import os
import numpy as np
import pandas as pd
import util
from flask import Flask, request, render_template, jsonify, send_from_directory

app = Flask(__name__, template_folder="src/main/resources/templates")

@app.route("/", methods=["GET"])
def page():
    return render_template("flask.html")

@app.route("/summary/<target>", methods=["GET"])
def getSummary(target):
    if type(target) != str: return "no u"
    path = os.path.join("src/main/resources/static/data", target)
    if not os.path.exists(path): return "no u"

    return jsonify(util.summary(path))
    # csv = pd.read_csv(path)
    # return util.buffer(csv.info)

@app.route("/<path:path>")
def public(path):
    return send_from_directory("src/main/resources/static", path)

# 메인
if __name__ == "__main__":
    print("서버 열림")
    app.run(port=8889)