import io
import math
import pandas as pd
import numpy as np
from functools import reduce
import json

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
    n = len(column) + 1
    diff = (n * p) - int(n * p)
    return column[int(n * (p - 1))] if diff == 0 else column[int(n * p - 1)] * (1 - diff) + column[int(n * p)] * diff

def summary(path):
    df = pd.read_csv(path)
    # df.info()
    
    df = df.iloc[:, 1:]

    # categories = df.select_dtypes(include=["object", "bool"])
    valueCounts = {}
    valueCounts = {c: df[c].value_counts().to_dict() for c in df.columns}

    describe = {}

    # 유니크 4개 밑인 컬럼은 카테고리로 간주하고 삭제
    numbers = df.select_dtypes(include=["int", "float"]).copy()
    for c in numbers:
        if len(pd.unique(numbers[c])) < 4:
            numbers.drop(c, axis=1)

    for c in numbers.columns:
        data = {}
        describe[c] = data
        column = numbers[c]

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
        data = []

    return {
        "ValueCounts": valueCounts,
        "Describe": describe,
        "DataFrame": df.to_dict(orient="split"),
        "Numbers": list(numbers.columns)
    }