import { getData, getColumn, addOptions, destroyChart, n, rotateRows } from "/js/chartBase.js";
import * as cb from "/js/chartBase.js";
const toastChart = toastui.Chart;
import * as d3ext from "./d3ext.js";
import * as eda from "/js/eda.js";
import { ImageData, toHex } from "/js/image.js";
import { CsvDF } from "/js/df.js";

// 딕셔너리 값으로 정렬
const dictSort = (dict) => {
    dict = Object.keys(dict).map(function(key) {
        return [key, dict[key]];
    });

    dict.sort(function(first, second) {
        return second[1] - first[1];
    });

    let keys = [];
    let vals = [];
    for (let i in dict) {
        let v = dict[i];
        keys.push(v[0]);
        vals.push(v[1]);
    }
    return [keys, vals];
}

const getPointDatas = (list, splitCount) => {
    if (list.length == 0) return [];

    let result = [list[0]];
    let space = (list.length - 1) / (splitCount - 1);
    for (let i = 1; i < splitCount; i++) {
        let index = Math.floor(space * i);
        result.push(list[index]);
    }
    return result;
}

const getPointRanges = (list, splitCount) => {
    if (list.length == 0) return [];

    let result = [];
    let space = list.length / splitCount;
    for(let i = 0; i < 10; i++) {
        let firstIndex = Math.floor(space * i);
        let lastIndex = Math.floor(space * (i + 1) - 1);

        let range = []
        for (let i = firstIndex; i <= lastIndex; i++) range.push(list[i]);
        result.push(range);
    }
    return result;
}

const scatter = (df, val1, val2, val3) => {
    // 결측값 1이나 2에 하나라도 있으면 안씀
    let values = [];
    let x = df.getColumn(val1);
    let y = df.getColumn(val2);
    let v = val3 ? df.getColumn(val3) : null;

    for (let i in x) {
        // console.log(`${column1[i]} && ${column2[i]}`);
        if (!val3) {
            if (x[i] && y[i]) values.push([Number(x[i]), Number(y[i])]);
        } else {
            if (x[i] && y[i]) values.push([Number(x[i]), Number(y[i]), v[i] != null ? `${v[i]}` : "NaN"]);
        }
    }

    return {
        labels: {
            x: val1, y: val2, value: val3 ? val3 : null
        },
        values: values
    };
}

const histogram = (column, val) => {
    let colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

    let useCount;
    if (val == null) {
        useCount = column.reduce((arr, c) => {
            if (arr[c] == null) arr[c] = 0;
            arr[c] += 1;
            return arr;
        }, {});
    } else {
        

        useCount = column.reduce((arr, c, i) => {
            let v = val[i];
            if (arr[c] == null) arr[c] = {};
            if (arr[c][v] == null) arr[c][v] = 0;
            arr[c][v] += 1;
        
        }, {});
    }

    let labels = Object.keys(useCount).sort();
    let values = [];
    labels.forEach((c) => {
        values.push(useCount[c]);
    })

    return {
        labels: labels,
        values: values
    };
}

// common data
export const valueCountChart = (element, valueCounts) => {
    let chart = null;
    let select = element.find("select");

    let options = Object.keys(valueCounts).reduce((arr, c) => {
        if (Object.keys(valueCounts[c]).length <= 300) arr.push(c);
        return arr;
    }, []); // 300개 넘어가면 짤라버림

    addOptions(select, options);

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let el = element.find(".chart_body")[0];
        let data = {
            categories: Object.keys(valueCounts[val]),
            series: [{
                name: val,
                data: Object.values(valueCounts[val]).reduce((arr, c) => {
                    arr.push(c);
                    return arr;
                }, [])
            }]
        };
        let options = {};
        chart = toastChart.columnChart({ el, data, options });
    }
    update(options[0]);

    // 바인딩
    select.change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const naRatioEDA = (element, df) => {
    let labels = [];
    df = df.isNa();

    for (let c in df.columns) {
        let column = df.getColumn(df.columns[c]);
        let sum = column.reduce((a, c) => a + c, 0)
        let percent = (sum / df.rows.length * 100).toFixed(2);
        let label = `${df.columns[c]}  (${percent}%)`;
        labels.push(label);
    }

    let el = element.find(".chart_body");
    let data = {
        labels: {
            x: labels,
            y: Object.keys(df.rows)
        },
        values: df.rows
    }
    let option = {
        yAxis: false,
        startColor: "#000000",
        endColor: "#FFFFFF",
    };
    let chart = new d3ext.heatmap(el, data, option);
}

// 넘버 데이터
export const describeChart = (element, describe) => {
    let chart = null;
    let select = element.find("select");
    let options = ["Max", "Min", "Mean", "Std", "Var", "Median"];
    addOptions(select, options);

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let el = element.find(".chart_body")[0];
        let data = {
            categories: Object.keys(describe),
            series: [{
                name: val,
                data: Object.values(describe).reduce((arr, c) => {
                    arr.push(c[val]);
                    return arr;
                }, [])
            }]
        };
        let options = {};
        chart = toastChart.columnChart({ el, data, options });
    }
    update(options[0]);

    // 바인딩
    select.change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const quartileChart = (element, summary, df) => {
    let chart = null;
    let select = element.find("select");
    let options = ["Quartile"];
    addOptions(select, options);

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let el = element.find(".chart_body")[0];
        let data = {
            categories: Object.keys(summary.Describe),
            series: [
                {
                    name: "Quartile",
                    data: df.getColumns(summary.Numbers)
                }
            ]
        };

        // chart = new Chart(el, {
        //     type: "boxplot",
        //     data: {
        //         labels: Object.keys(summary.Describe),
        //         datasets: [{
        //             name: "Quartile",
        //             data: Object.values(summary.Numbers).reduce((arr, c) => {
        //                 arr.push(c);
        //                 return arr;
        //             }, [])
        //         }]
        //     }
        // })



        let options = {
            // yAxis: {
            //     scale: {
            //         min: totalMin,
            //         max: totalMax,
            //         stepSize: 0.1
            //     }
            // }
        };
        chart = toastChart.boxPlotChart({ el, data, options });
    }
    update(options[0]);

    // 바인딩
    select.change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const scatterEDA = (element, df, numberColumns, categories) => {
    let chart = null;

    let firstSelect = element.find("select").eq(0);
    let secondSelect = element.find("select").eq(1);
    addOptions(firstSelect, numberColumns);
    addOptions(secondSelect, numberColumns);

    let valueSelect = categories ? element.find("select").eq(2) : null;
    if (valueSelect) addOptions(valueSelect, categories);

    function update(val1, val2, val3) {
        if (chart) {
            chart.destroy();
        }

        let el = element.find(".chart_body");
        let data = scatter(df, val1, val2, val3);
        let options = {
            reverse: true
        };

        chart = new d3ext.scatter(el, data, options);
    }

    // 바인딩
    function selectionBind() {
        let val1 = firstSelect.val();
        let val2 = secondSelect.val();
        let val3 = categories ? valueSelect.val() : null;
        if (val1 && val2) update(val1, val2, val3);
    }
    firstSelect.change(selectionBind);
    secondSelect.change(selectionBind)
    if (valueSelect) valueSelect.change(selectionBind);

    firstSelect.val(numberColumns[0]);
    secondSelect.val(numberColumns[1]);

    if (valueSelect) {
        valueSelect.val(categories[0]);
        update(numberColumns[0], numberColumns[1], categories[0]);
    } else update(numberColumns[0], numberColumns[1]);
}

export const pairEDA = (element, df, numberColumns, categories) => {
    let el = element.find(".chart_body");
    el.addClass("multiplot");

    let select = categories ? element.find("select") : null;
    if (select) addOptions(select, categories);

    let axisSize = 25;
    let plotMargin = 3;
    let plotScale = 1 / numberColumns.length * 100;

    let multiplot = $($.parseHTML("<div class='chart_multiplot'></div>"))
    multiplot.width(el.width() - axisSize)
    multiplot.height(el.height() - axisSize)
    multiplot.appendTo(el)

    let gridHorizontal = $($.parseHTML("<div class='chart_plotgrid horizontal'></div>"));
    let gridVertical = $($.parseHTML("<div class='chart_plotgrid vertical'></div>"));
    gridHorizontal.width(el.width() - axisSize);
    gridVertical.height(el.height() - axisSize);
    gridHorizontal.height(axisSize);
    gridVertical.width(axisSize);
    gridHorizontal.appendTo(el);
    gridVertical.appendTo(el);

    for (let c in numberColumns) {
        let text = $($.parseHTML(`<div>${numberColumns[c]}</div>`));
        text.appendTo(gridVertical);
    }
    for (let r in numberColumns) {
        let text = $($.parseHTML(`<div>${numberColumns[r]}</div>`));
        text.appendTo(gridHorizontal);
    }

    function update(val) {
        multiplot.empty();
        for (let c in numberColumns) {
            for (let r in numberColumns) {
                let columnNameC = numberColumns[c];
                let columnNameR = numberColumns[r];

                let plot = $($.parseHTML("<svg class='chart_subplot'></svg>"))
                plot.width(`calc(${plotScale}% - ${plotMargin * 2}px)`);
                plot.height(`calc(${plotScale}% - ${plotMargin * 2}px)`);
                plot.css({margin: `${plotMargin}px`})
                plot.appendTo(multiplot);

                if (c != r) { // 스캐터
                    let data = scatter(df, columnNameR, columnNameC, val ? val : null);
                    let options = {
                        reverse: true,
                        paddingX: 3,//20,
                        paddingY: 3,//20,
                        xAxis: false,
                        yAxis: false,
                        // axisSize: 20 / numberColumns.length,//20,
                        radius: 3 / numberColumns.length * 1.5 //1.25
                    };

                    new d3ext.scatter(plot, data, options);
                } else { // 히스토그램
                    let data = histogram(df.getColumn(columnNameC));
                    let options = {
                        reverse: true,
                        paddingX: 3,//20,
                        paddingY: 3,//20,
                        xAxis: false,
                        yAxis: false,
                    };
            
                    new d3ext.verticalBar(plot, {...data, name: columnNameC}, options);
                }
            }
        }
    }
    categories ? update(categories[0]) : update();

    if (select) {
        select.change(() => {
            let val = select.val();
            update(val);
        })
    }
}

// 카테고리 데이터
export const categoryStackChart = (element, df, categories) => {
    let chart = null;

    let firstSelect = element.find("select").eq(0);
    let secondSelect = element.find("select").eq(1);
    addOptions(firstSelect, categories);
    addOptions(secondSelect, categories);

    function update(val, condition) {
        if (chart) {
            chart.destroy();
        }

        // 추가 조건 (첫번째 라벨과 같은 행의 다른 컬럼 카테고리 값 추출)
        let [c1, c2] = df.getColumns([val, condition]);
        let valueCount = df.getColumnValueCount(val);
        let labels = Object.keys(valueCount);
        let values = Object.values(valueCount);

        let stacked = labels.reduce((arr, label) => {
            let filteredValueCount = c1.reduce((arr, c, i) => {
                if (c == label) {
                    let value = c2[i];
                    if (arr[value] == null) arr[value] = 0;
                    arr[value] += 1;
                }
                return arr;
            }, {});
            arr.push(Object.values(filteredValueCount));
            return arr;
        }, []);

        let el = element.find(".chart_body");
        let data = {
            name: val,
            labels: labels,
            values: values,
            stack: {
                name: condition,
                labels: df.getColumnUnique(condition), // Survived, Pclass 설정일 경우, Pclass 라벨 넣으면 됨 - [1, 2, 3]
                values: stacked // Survived, Pclass 설정일 경우, 각 경우의 수만큼 요소 만듬(Survived 2개, Pclass 3개 = 총 6개 요소) - [ [100, 150, 20], [10, 200, 400] ]
            }
        };
        let options = {
            paddingX: 60,
            stackStartColor: "#47E1A8",
            stackEndColor: "#297458"
        };

        chart = new d3ext.horizontalBar(el, data, options);
    }

    // 바인딩
    function selectionBind() {
        let val1 = firstSelect.val();
        let val2 = secondSelect.val();
        if (val1 && val2) update(val1, val2);
    }
    firstSelect.change(selectionBind);
    secondSelect.change(selectionBind)

    firstSelect.val(categories[0]);
    secondSelect.val(categories[1]);
    update(categories[0], categories[1]);
}

export const heatmapD3 = (element, df, categories, numbers) => {
    let chart = null;

    let xSelect = element.find("select").eq(0);
    let ySelect = element.find("select").eq(1);
    let valueSelect = element.find("select").eq(2);

    addOptions(xSelect, categories);
    addOptions(ySelect, categories);
    addOptions(valueSelect, numbers);

    // 업데이트
    function update(x, y, val) {
        if (x != y) {
            if (chart) {
                chart.destroy();
            }
    
            let xi = df.columns.indexOf(x);
            let yi = df.columns.indexOf(y);
            let vi = df.columns.indexOf(val);
            let labelX = Object.keys(df.getColumnValueCount(x));
            let labelY = Object.keys(df.getColumnValueCount(y));

            // 데이터 정리
            let heatDatas = [];
            for (let c in labelY) {
                let row = [];
                for (let r in labelX) {
                    let xv = labelX[r];
                    let yv = labelY[c];
                    let values = df.rows.reduce((arr, c) => {
                        if (c[xi] == xv && c[yi] == yv) arr.push(c[vi]);
                        return arr;
                    }, []);
                    row.push(values.length > 0 ? values.reduce((a, c) => a + c, 0) / values.length : 0);
                }
                heatDatas.push(row);
            }

            let el = element.find(".chart_body");
            let data = {
                labels: {
                    x: labelX,
                    y: labelY,
                    xLabel: x,
                    yLabel: y,
                    valueLabel: val
                },
                values: heatDatas
            }
            let options = {
                paddingX: 60
            }
            chart = new d3ext.heatmap(el, data, options);
        }
    }
    update();

    // 바인딩
    function bind() {
        let x = xSelect.val();
        let y = ySelect.val();
        let v = valueSelect.val();
        update(x, y, v);
    }

    xSelect.change(bind);
    ySelect.change(bind);
    valueSelect.change(bind);

    xSelect.val(categories[0]);
    ySelect.val(categories[1]);
    valueSelect.val(numbers[0]);
    update(categories[0], categories[1], numbers[0])
}

// 텍스트 데이터
export const wordCloudChart = (element, strData) => {
    let chart = null;
    let select = element.find("select");
    let countInput = element.find("input");
    let options = Object.keys(strData);

    addOptions(select, options);

    // 업데이트
    function update(val, count) {
        if (chart) {
            chart.remove();
        }

        let valTokens = strData[val].Tokens;
        let data = Object.keys(valTokens).reduce((arr, key) => {
            if (valTokens[key] <= count) return arr;

            let [mouseover, mousemove, mouseout] = d3ext.hoverTooltipEvent(null, JSON.stringify({
                label: key,
                value: valTokens[key],
                color: "#000000"
            }));

            arr.push({
                text: key,
                weight: valTokens[key],
                handlers: {
                    mouseover: mouseover,
                    mousemove: mousemove,
                    mouseout: mouseout
                }
            });
            return arr;
        }, [])

        let el = element.find(".chart_body");
        chart = $($.parseHTML("<div class='chart_cloud'></div>"));
        chart.appendTo(el);
        chart.jQCloud(data);
    }
    update(options[0]);

    // 바인딩
    select.change(function() {
        let val = $(this).val();
        let count = Number(countInput.val());
        update(val, count);
    });

    countInput.change(function() {
        $(this).width(30 + (this.value.length - 1) * 12);
        let val = select.val();
        let count = Number(countInput.val());
        update(val, count);
    });
}

export const sentenceLengthChart = (element, strData) => {
    let chart = null;
    let select = element.find("select");
    let options = Object.keys(strData);

    addOptions(select, options);

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let sd = strData[val].Length.reduce((arr, c) => {
            if (arr[c] == null) arr[c] = 0;
            arr[c] += 1;
            return arr;
        }, {});

        let labels = Object.keys(sd);
        let values = Object.values(sd);
        if (Object.keys(sd).length > 30) {
            labels = getPointRanges(labels, 10).reduce((arr, c) => [...arr, `${c[0]}  ~${c[c.length - 1]}`], []);
            values = getPointRanges(values, 10).reduce((arr, c) => [...arr, cb.n.sum(c)], []);
        }

        let el = element.find(".chart_body");
        let data = {
            labels: labels,
            values: values
        };
        let options = {
            reverse: true
        };

        chart = new d3ext.verticalBar(el, data, options);
    }
    update(options[0]);

    // 바인딩
    select.change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const wordCountChart = (element, strData) => {
    let chart = null;
    let select = element.find("select");
    let options = Object.keys(strData);

    addOptions(select, options);

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let sd = strData[val].WordCount.reduce((arr, c) => {
            if (arr[c] == null) arr[c] = 0;
            arr[c] += 1;
            return arr;
        }, {});

        let labels = Object.keys(sd);
        let values = Object.values(sd);
        if (Object.keys(sd).length > 30) {
            labels = getPointRanges(labels, 10).reduce((arr, c) => [...arr, `${c[0]}  ~${c[c.length - 1]}`], []);
            values = getPointRanges(values, 10).reduce((arr, c) => [...arr, cb.n.sum(c)], []);
        }

        let el = element.find(".chart_body");
        let data = {
            labels: labels,
            values: values
        };
        let options = {
            reverse: true
        };

        chart = new d3ext.verticalBar(el, data, options);
    }
    update(options[0]);

    // 바인딩
    select.change(function() {
        let val = $(this).val();
        update(val);
    });
}

// D3 쓰는 차트
export const rankingChartD3 = (element, column, name, color, weatherData) => {
    let chart = null;

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        val = Number(val);
        let globalData = {};
        Object.assign(globalData, weatherData);

        for (let location in globalData) {
            globalData[location] = n.mean(getColumn(getData(weatherData, location, val), column));
        }

        // 정렬
        let [labels, values] = dictSort(globalData)
        // let newGlobalData = dictSort(globalData);
        // globalData = Object.keys(globalData).map(function(key) {
        //     return [key, globalData[key]];
        // });

        // globalData.sort(function(first, second) {
        //     return second[1] - first[1];
        // });

        // let newGlobalData = {}
        // for (let i in globalData) {
        //     let locationData = globalData[i];
        //     newGlobalData[locationData[0]] = locationData[1];
        // }

        let el = element.find(".chart_body");
        let data = {
            labels: labels,
            values: values
        };
        let options = {
            color: color,
            paddingX: 60
        };

        chart = new d3ext.horizontalBar(el, data, options);
    }
    update("1");

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const dailyChartD3 = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let dailyData = getData(weatherData, val);

        let el = element.find(".chart_body");
        let data = {
            labels: getColumn(dailyData, "date"),
            values: [getColumn(dailyData, "temperature"), getColumn(dailyData, "humidity")]
        };
        let options = {
            colors: ["#FFD400", "#1E85E6"],
            reverse: true
        };

        chart = new d3ext.line(el, data, options);
    }
    update("all");

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

// EDA 차트


export const uniqueRankEDA = (element, rows) => {
    let chart = null;
    let uniqueAll = eda.uniqueCheck(rows);

    let firstSelect = element.find("select").eq(0);
    let secondSelect = element.find("select").eq(1);
    addOptions(firstSelect, Object.keys(uniqueAll));
    addOptions(secondSelect, Object.keys(uniqueAll));

    function update(val, condition) {
        if (chart) {
            chart.destroy();
        }

        let [labels, values] = dictSort(uniqueAll[val]);
        labels = labels.slice(0, 7);
        values = values.slice(0, 7);

        // 추가 조건 (첫번째 라벨과 같은 행의 다른 컬럼 카테고리 값 추출)
        let stackLabels = Object.keys(uniqueAll[condition]);
        let stackValues = [];
        for (let i in labels) {
            let label = labels[i];
            // console.log(`${val}: ${label}`);

            // Survived, Pclass로 돌린다면 전체 중 Survived가 찾는 것과 같은 행들만 나옴
            let stackedRows = eda.getRowsWithCondition(rows, val, label);
            let stackedUnique = eda.uniqueCheck(stackedRows); // 찾는 조건과 맞는 행들에서 카테고리 추출
            stackValues.push(Object.values(stackedUnique[condition]));
            // console.log(stackedUnique[condition]);
        }

        // console.log(stackLabels);
        // console.log(stackValues);

        let el = element.find(".chart_body");
        let data = {
            name: val,
            labels: labels,
            values: values,
            stack: {
                name: condition,
                labels: stackLabels, // Survived, Pclass 설정일 경우, Pclass 라벨 넣으면 됨 - [1, 2, 3]
                values: stackValues  // Survived, Pclass 설정일 경우, 각 경우의 수만큼 요소 만듬(Survived 2개, Pclass 3개 = 총 6개 요소) - [ [100, 150, 20], [10, 200, 400] ]
            }
        };
        let options = {
            paddingX: 60,
            stackStartColor: "#47E1A8",
            stackEndColor: "#297458"
        };

        chart = new d3ext.horizontalBar(el, data, options);
    }

    // 바인딩
    function selectionBind() {
        let val1 = firstSelect.val();
        let val2 = secondSelect.val();
        if (val1 && val2) update(val1, val2);
    }
    firstSelect.change(selectionBind);
    secondSelect.change(selectionBind)

    firstSelect.val();
    secondSelect.val();
    // update();
}

export const describeEDA = (element, df) => {
    let chart = null;

    // 데이터 정리
    let tableDF = [[], [], [] ,[], [], [], []];
    df.columns.forEach((c) => {
        let column = df.getColumn(c).reduce((arr, c) => {
            if (c) arr.push(c);
            return arr;
        }, []);
        let sorted = [...column].sort();

        let sortedMin = Math.floor(sorted.length / 2);
        let sortedMax = Math.ceil(sorted.length / 2);
        let median = sortedMin;
        if (sorted.length % 2 == 1) {
            median = sortedMin;
        } else {
            median = (sortedMin + sortedMax) / 2;
        }

        let data = [
            column.length, // count
            n.mean(column), // mean
            n.std(column), // std
            n.min(column), // min
            n.max(column), // max
            n.var(column), // var
            median // median
        ];
        data.forEach((v, i) => {
            tableDF[i].push(v);
        });
    })

    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let el = element.find(".chart_body");
        let data = {
            labels: {
                x: df.columns,
                y: ["count", "mean", "std", "min", "max", "var", "median"]
            },
            values: tableDF,
        };
        let options = {};

        chart = new d3ext.table(el, data, options);
    }

    // 바인딩
    update();
}



export const rgbEDA = (element, rgb) => {
    console.log(rgb);

    const quartile = (arr, q) => {
        let pos = (arr.length - 1) * q;
        let base = Math.floor(pos);
        let rest = pos - base;

        if (arr[base + 1] !== undefined) {
            return arr[base] + rest * (arr[base + 1] - arr[base]);
        } else {
            return arr[base];
        }
    }

    console.log(quartile(rgb.r, 0.7))

    let chart = null;

    let selections = [
        "RGB 사분위수", // RGB 사분위수 barchart
    ];
    addOptions(element.find("select"), selections);

    function update(val) {
        if (chart) {
            chart.destroy();
        }

        if (val == "RGB 사분위수") { // Bar chart
            let el = element.find(".chart_body");
            let data = {
                labels: ["R Q1", "R Q2", "R Q3"],
                // values: values
            };
            let options = {
                color: color,
                paddingX: 60
            };

            // chart = new d3ext.horizontalBar(el, data, options);
        }
    }

    // 바인딩
    element.find("select").change(() => {
        let val = element.find("select").val();
    });
    update(selections[0]);
}

export const rgbHistogramEDA = (element, img) => {
    let chart = null;

    let selections = ["GRAY", "R", "G", "B"];
    addOptions(element.find("select"), selections);

    // 이미지 탐색
    let imageData = new ImageData(img);
    imageData.onload.then(() => {
        let pixels = imageData.getRGB(imageData.pixels);

        // 표시를 위해 {r: {0: r0인 픽셀 갯수, 1:.. 255:..}, g:...} 형태로 변환
        let pixelCounts = {};
        for (let channel in pixels) {
            let channelData = pixels[channel];
            pixelCounts[channel] = Array(256).fill(0).reduce((arr, c, i) => { // reduce spread는 복사때문에 O(N^2)로 느려져서 reduce mutate로
                arr[i] = 0;
                return arr;
            }, {});

            for (let i in channelData) {
                let value = channelData[i];
                pixelCounts[channel][value]++;
            }
        }

        function update(val) {
            if (chart) {
                chart.destroy();
            }
    
            let colorOptions = {
                GRAY: { color: "#000000", data: pixelCounts.gray },
                R: { color: "#FF0000", data: pixelCounts.r },
                G: { color: "#00FF00", data: pixelCounts.g },
                B: { color: "#0000FF", data: pixelCounts.b },
            }
    
            let el = element.find(".chart_body");
            let data = {
                name: val,
                labels: Object.keys(colorOptions[val].data),
                values: Object.values(colorOptions[val].data)
            };
            let options = {
                color: colorOptions[val].color,
                reverse: true,
                mergeLabel: {
                    whenOver: 15,
                    to: 15
                }
            };
            chart = new d3ext.verticalBar(el, data, options);
        }
    
        // 바인딩
        element.find("select").change(() => {
            let val = element.find("select").val();
            update(val);
        });
        update(selections[0]);
    });
}

export const rgbChannelEDA = (element, img) => {
    let canvas = element.find(".chart_body")[0];
    let context = canvas.getContext("2d");

    let selections = ["RGB", "BGR", "GRAY", "R", " G ", "  B", "RG", "R B", " GB", "ALPHA"];
    addOptions(element.find("select"), selections);

    // 이미지 탐색
    let imageData = new ImageData(img);
    imageData.onload.then(() => {
        function update(val) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            imageData.drawOnCanvasFit(canvas, val);
        }
        
        // 바인딩
        element.find("select").change(() => {
            let val = element.find("select").val();
            update(val);
        });
        update(selections[0]);

        let canvasCover = element.find(".canvas_cover");
        if (canvasCover != null && canvasCover.length != 0) {
            const canvasMouseCallback = (act, event) => {            
                if (act == "mousemove" || act == "mouseover") {
                    let bounding = canvas.getBoundingClientRect();
                    let x = Math.floor((event.clientX - bounding.left) / bounding.width * canvas.width);
                    let y = Math.floor((event.clientY - bounding.top) / bounding.height * canvas.height);

                    let pixel = context.getImageData(x, y, 1, 1).data;
                    let color = "#";
                    for (let i in pixel) {
                        color += toHex(pixel[i], 2);
                    }

                    canvasCover.text(JSON.stringify({
                        label: `canvas - x: ${x}, y: ${y}`,
                        color: color,
                        value: `${color}`
                    }))
                }
            }

            d3ext.hoverTooltipEvent(canvasCover, null, canvasMouseCallback);
        }
    });
}

export const columnInfoEDA = (element, df) => {
    let chart = null;

    // 숫자형인 컬럼명만 수집
    let numberColumns = df.columns.reduce((arr, c) => {
        if (df.getColumnType(c) == "number") arr.push(c);
        return arr;
    }, []);

    // 컬럼 별 데이터 갯수 합산 및 정렬
    let columns = {}
    df.columns.forEach((c) => {
        if (df.getColumnType(c) == "number") {
            let column = df.getColumn(c);
            let valueCounts = {};
            columns[c] = valueCounts;
            column.forEach((v) => {
                if (v) {
                    if (!valueCounts[v]) valueCounts[v] = 0;
                    valueCounts[v]++;
                }
            })
        }
    });


    // 정렬
    let sorted = {};
    Object.keys(columns).sort().forEach((c) => {
        sorted[c] = columns[c];
    })
    columns = sorted;

    let select = element.find("select").eq(0);
    addOptions(select, Object.keys(columns));

    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let el = element.find(".chart_body");
        let data = {
            labels: Object.keys(columns[val]),
            values: Object.values(columns[val])
        };
        let options = {
            reverse: true
        };

        chart = new d3ext.verticalBar(el, data, options);
    }

    // 바인딩
    function selectionBind() {
        let val = select.val();
        update(val);
    }
    select.change(selectionBind);

    select.val(Object.keys(columns)[0]);
    update(Object.keys(columns)[0]);
}