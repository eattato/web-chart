import os
import numpy as np
import pandas as pd
import util
from flask import Flask, request, render_template, jsonify, send_from_directory

app = Flask(__name__, template_folder="src/main/resources/templates")

summarySaves = {}

@app.route("/", methods=["GET"])
def page():
    return render_template("flask.html")

@app.route("/summary/<target>", methods=["GET"])
def getSummary(target):
    if type(target) != str: return "no u"
    path = os.path.join("src/main/resources/static/data", target)
    if not os.path.exists(path): return "no u"

    if not target in summarySaves:
        summarySaves[target] = util.summary(path)
    return summarySaves[target]

@app.route("/<path:path>")
def public(path):
    return send_from_directory("src/main/resources/static", path)

@app.route("/datalist", methods=["GET"])
def getDatalist():
    result = []
    for file in os.listdir("src/main/resources/static/data"):
        if os.path.splitext(file)[1] == ".csv":
            result.append(file)
    return { "list": result }

# 메인
if __name__ == "__main__":
    print("서버 열림")
    app.run(port=8889)