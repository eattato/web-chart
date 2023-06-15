import io
import math
import pandas as pd
import numpy as np
from functools import reduce
import json
from keras.preprocessing.text import text_to_word_sequence

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
                            np.int16, np.int32, np.int64, np.uint8,
                            np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, (np.complex_, np.complex64, np.complex128)):
            return {'real': obj.real, 'imag': obj.imag}
        elif isinstance(obj, (np.ndarray,)):
            return obj.tolist()
        elif isinstance(obj, (np.bool_)):
            return bool(obj)
        elif isinstance(obj, (np.void)): 
            return None
        return json.JSONEncoder.default(self, obj)

def buffer(func):
    buf = io.StringIO()
    func(buf=buf)
    return buf.getvalue()

def quartile(column, p):
    sort = sorted(column)
    pos = len(column) * p - 1
    return sort[int(pos)] if pos % 1 == 0 else (sort[math.floor(pos)] + sort[math.ceil(pos)]) / 2

    # n = len(column) + 1
    # diff = (n * p) - int(n * p)
    # return column[int(n * (p - 1))] if diff == 0 else column[int(n * p - 1)] * (1 - diff) + column[int(n * p)] * diff

def getDescribe(numbers):
    describe = {}
    for c in numbers.columns:
        data = {}
        describe[c] = data
        column = numbers[c].dropna()

        data["Max"] = max(column)
        data["Min"] = min(column)
        data["Mean"] = sum(column) / len(column)
        data["Var"] = reduce((lambda a, c: a + (data["Mean"] - c) ** 2), column, 0) / len(column.index)
        data["Std"] = math.sqrt(data["Var"])

        sort = sorted(column)
        center = len(sort) // 2
        data["Median"] = sort[center] if len(sort) % 2 == 1 else (sort[center - 1] + sort[center]) / 2

        data["Q1"] = quartile(column, 0.25)
        data["Q2"] = quartile(column, 0.5)
        data["Q3"] = quartile(column, 0.75)
        data["IQR"] = data["Q3"] - data["Q1"]
        data["IQR_InnerRight"] = (data["Q1"] - 1.5) * data["IQR"]
        data["IQR_InnerLeft"] = (data["Q3"] + 1.5) * data["IQR"]
    return describe

def getTokens(column):
    useCount = {}
    wordCount = []
    for line in column:
        if type(line) != str: continue
        words = text_to_word_sequence(line)
        # if len(words) <= 2: continue
        for word in words:
            if not word in useCount: useCount[word] = 0
            useCount[word] += 1
        wordCount.append(len(words))
    return useCount, wordCount

    # tokens = {}
    # for c in df.columns:
    #     for sentence in df[c]:
    #         words = text_to_word_sequence(sentence)
    #         if len(words) > 2: tokens[c] = words

    # for c in df.columns:
    #     useCount = {}
    #     if c in tokens:
    #         words = tokens[c]
    #         if len(words) > 1: useCount = {word: words.count(word) for word in words}
    #         tokens[c] = useCount
    # return tokens

def getLength(column):
    return [len(line) for line in column if type(line) == str]

def getWordCount(column):
    return [len(line.split(" ")) for line in column if type(line) == str]

def summary(path):
    df = pd.read_csv(path)
    df.info()
    df = df.iloc[:, 1:] # Id 제거

    # categories = df.select_dtypes(include=["object", "bool"])
    valueCounts = {c: df[c].value_counts().to_dict() for c in df.columns}

    # 자연어인 컬럼 찾고 토큰화 (스트링 컬럼 중에서도 Unique가 절반 이상이면 자연어로 침, 아니면 카테고리)
    strColumns = df.select_dtypes(include="object").columns
    natural = [column for column in strColumns if len(df[column].unique()) >= (len(df[column]) - df[column].isna().sum()) / 2]
    naturalData = {}
    for column in natural:
        validColumn = df[column].dropna()
        tokens, wordCount = getTokens(validColumn)
        naturalData[column] = {
            "Tokens": tokens,
            "Length": getLength(validColumn),
            "WordCount": wordCount
        }

    # 카테고리인 컬럼 찾기 (실수가 아니여야함. 0 또는 1로만 구성되거나 스트링 중에서도 자연어가 아닌 경우)
    catColumns = df.select_dtypes(include=["object", "int"]).columns
    categories = []
    for column in catColumns:
        if df[column].dtype == np.dtype("int64"):
            unique = df[column].unique()
            if not (np.array_equal(unique, [0, 1]) or np.array_equal(unique, [1, 0])): continue # 이진 아닌 정수 거름
        elif df[column].dtype == object:
            if column in natural: continue # 자연어 거름
        else: continue # 기타 타입 거름
        categories.append(column)
    # categoryData = {
    #     column: df[column].value_counts().to_dict()
    #     for column in categories
    # }

    # Describe 구하기
    numbers = df.select_dtypes(include=["int", "float"]).columns
    numbers = [column for column in numbers if not column in categories]
    describe = getDescribe(df[numbers])

    return {
        "ValueCounts": valueCounts,
        "Describe": describe,
        "DataFrame": df.replace(np.nan, "").to_dict(orient="split"),
        "Numbers": numbers,
        "StrData": naturalData,
        "Categories": categories
    }