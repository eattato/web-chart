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
    for line in column:
        words = text_to_word_sequence(line)
        if len(words) <= 2: continue
        for word in words:
            if not word in useCount: useCount[word] = 0
            useCount[word] += 1
    return useCount

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
    return [len(line) for line in column]

def getWordCount(column):
    return [len(line.split(" ")) for line in column]

def summary(path):
    df = pd.read_csv(path)
    df.info()
    
    df = df.iloc[:, 1:]

    # categories = df.select_dtypes(include=["object", "bool"])
    valueCounts = {}
    valueCounts = {c: df[c].value_counts().to_dict() for c in df.columns}
    numbers = df.select_dtypes(include=["int", "float"]).copy()

    # Describe 구하기
    describe = getDescribe(numbers)

    # 문장인 컬럼 찾고 토큰화
    strData = {}
    stringDf = df.select_dtypes(include="object")
    for column in stringDf:
        strData[column] = {
            "Tokens": getTokens(stringDf[column]),
            "Length": getLength(stringDf[column]),
            "WordCount": getWordCount(stringDf[column])
        }

    return {
        "ValueCounts": valueCounts,
        "Describe": describe,
        "DataFrame": df.replace(np.nan, "").to_dict(orient="split"),
        "Numbers": list(numbers.columns),
        "StrData": strData
    }