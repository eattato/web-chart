import { getData, getColumn, addOptions, destroyChart, n, rotateRows } from "/js/chartBase.js";
import * as cb from "/js/chartBase.js";
const toastChart = toastui.Chart;
import * as d3ext from "./d3ext.js";
import * as eda from "/js/eda.js";

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

// 일일 기온/습도 차트
export const dailyChart = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let dailyData = getData(weatherData, val);

        let el = element.find(".chart_body")[0];
        let data = {
            categories: getColumn(dailyData, "date"),
            series: [
                {
                    name: "기온",
                    data: getColumn(dailyData, "temperature"),
                },
                {
                    name: "습도",
                    data: getColumn(dailyData, "humidity")
                }
            ]
        };
        let options = {
            theme: {
                series: {
                    lineWidth: 0.75,
                    colors: ["#FFD400", "#1E85E6"]
                }
            },
            series: {
                zoomable: true
            }
        };

        chart = toastChart.lineChart({ el, data, options });
    }
    update("all");

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const weatherRatio = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let locationData = getData(weatherData, val);
        let rainCount = 0;
        let snowCount = 0;
        let sunnyCount = 0;
        for (let date in locationData) {
            let dayData = locationData[date];
            if (dayData.snow > 0) {
                snowCount += 1;
            } else if (dayData.rain >= 0.5) {
                rainCount += 1;
            } else {
                sunnyCount += 1;
            }
        }

        let el = element.find(".chart_body")[0];
        let data = {
            categories: ["날씨 비율"],
            series: [
                {
                    name: "맑음",
                    data: sunnyCount
                },
                {
                    name: "비",
                    data: rainCount
                },
                {
                    name: "눈",
                    data: snowCount
                }
            ]
        };
        let options = {
            theme: {
                series: {
                    colors: ["#FFF04D", "#1E85E6", "#EEEEEE"]
                }
            }
        };

        chart = toastChart.pieChart({ el, data, options });
    }
    update();

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const rainChart = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let locationData = getData(weatherData, val);
        let rainData = {};
        let snowData = {};

        for (let i in locationData) {
            let dayData = locationData[i];
            let month = Number(dayData.date.split("-")[1]);
            if (rainData[month] == null) {
                rainData[month] = [];
                snowData[month] = [];
            }
            rainData[month].push(dayData.rain);
            snowData[month].push(dayData.snow);
        }

        // 월 별로 평균 내기
        for (let month in rainData) {
            rainData[month] = n.mean(rainData[month]);
        }
        for (let month in snowData) {
            snowData[month] = n.mean(snowData[month]);
        }

        let el = element.find(".chart_body")[0];
        let data = {
            categories: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
            series: [
                {
                    name: "강우량(mm)",
                    data: Object.values(rainData),
                },
                {
                    name: "적설량(cm)",
                    data: Object.values(snowData),
                }
            ]
        };
        let options = {
            series: {
                stack: {
                    type: "normal",
                },
            },
            theme: {
                series: {
                    colors: ["#1E85E6", "#EEEEEE"]
                }
            }
        };

        chart = toastChart.columnChart({ el, data, options });
        //     type: "bar",
        //     data: {
        //         labels: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        //         datasets: [
        //             {
        //                 label: "강우량(mm)",
        //                 data: Object.values(rainData),
        //                 backgroundColor: "#1E85E6"
        //             },
        //             {
        //                 label: "적설량(cm)",
        //                 data: Object.values(snowData),
        //                 backgroundColor: "#EEEEEE"
        //             }
        //         ]
        //     },
        //     options: {
        //         scales: {
        //             x: {
        //               stacked: true,
        //             },
        //             y: {
        //               stacked: true
        //             }
        //           }
        //     }
        // });
    }
    update("all");

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const rankingChart = (element, column, name, color, weatherData) => {
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
        globalData = Object.keys(globalData).map(function(key) {
            return [key, globalData[key]];
        });

        globalData.sort(function(first, second) {
            return second[1] - first[1];
        });

        let newGlobalData = {}
        for (let i in globalData) {
            let locationData = globalData[i];
            newGlobalData[locationData[0]] = locationData[1];
        }

        let el = element.find(".chart_body")[0];
        let data = {
            categories: Object.keys(newGlobalData),
            series: [
                {
                    name: name,
                    data: Object.values(newGlobalData)
                }
            ]
        };
        let options = {
            theme: {
                series: {
                    colors: [color]
                }
            }
        };

        chart = toastChart.barChart({ el, data, options });
    }
    update("1");

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const boxplot = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let locationData = getData(weatherData, val);
        let tempData = [];
        let rainData = [];

        for (let i in locationData) {
            let dayData = locationData[i];
            let month = Number(dayData.date.split("-")[1]);
            if (rainData[month] == null) {
                tempData[month] = [];
                rainData[month] = [];
            }
            tempData[month].push(dayData.temperature);
            rainData[month].push(dayData.rain);
        }

        let el = element.find(".chart_body")[0];
        let data = {
            categories: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
            series: [
                {
                    name: "기온",
                    data: Object.values(tempData),
                },
                {
                    name: "습도",
                    data: Object.values(rainData),
                }
            ]
        };
        let options = {
            series: {
                stack: {
                    type: "normal",
                }
            },
            theme: {
                series: {
                    colors: ["#FFD400", "#1E85E6"]
                }
            }
        };

        chart = toastChart.boxPlotChart({ el, data, options });
        //     type: "bar",
        //     data: {
        //         labels: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
        //         datasets: [
        //             {
        //                 label: "강우량(mm)",
        //                 data: Object.values(rainData),
        //                 backgroundColor: "#1E85E6"
        //             },
        //             {
        //                 label: "적설량(cm)",
        //                 data: Object.values(snowData),
        //                 backgroundColor: "#EEEEEE"
        //             }
        //         ]
        //     },
        //     options: {
        //         scales: {
        //             x: {
        //               stacked: true,
        //             },
        //             y: {
        //               stacked: true
        //             }
        //           }
        //     }
        // });
    }
    update("all");

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const heatmap = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update() {
        if (chart) {
            chart.destroy();
        }

        let labels = []
        let heatDatas = []
        
        for (let location in weatherData) {
            labels.push(location);
            let locationData = getData(weatherData, location);
            let yearData = [];

            for (let month = 1; month <= 12; month++) {
                let monthData = [];
                for (let i in locationData) {
                    let dayData = locationData[i];
                    if (Number(dayData.date.split("-")[1]) == month) {
                        monthData.push(dayData);
                    }
                }
                yearData.push(n.mean(getColumn(monthData, "temperature")));
            }
            heatDatas.push(yearData);
        }

        let el = element.find(".chart_body")[0];
        let data = {
            categories: {
                x: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
                y: labels,
            },
            series: heatDatas
        }
        let options = {}
        chart = toastChart.heatmapChart({ el, data, options });
    }
    update();

    // 바인딩
    // element.find("select").change(function() {
    //     let val = $(this).val();
    //     update(val);
    // });
}

// Chart.js쓰는 레거시 차트
export const dailyChartLegacy = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let dailyData = getData(weatherData, val);

        let el = element.find(".chart_body")[0];
        chart = new Chart(el, {
            type: "line",
            data: {
                labels: getColumn(dailyData, "date"),
                datasets: [
                    {
                        label: "기온",
                        data: getColumn(dailyData, "temperature"),
                        borderColor: "rgb(150, 150, 0)",
                        showLine: true,
                        spanGaps: true,
                        pointRadius: 0,
                        borderWidth: 0.75
                    },
                    {
                        label: "습도",
                        data: getColumn(dailyData, "humidity"),
                        borderColor: "rgb(70, 70, 255)",
                        showLine: true,
                        spanGaps: true,
                        pointRadius: 0,
                        borderWidth: 0.75
                    }
                ]
            }
        })
    }
    update("all");

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const weatherRatioLegacy = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let locationData = getData(weatherData, val);
        let rainCount = 0;
        let snowCount = 0;
        let sunnyCount = 0;
        for (let date in locationData) {
            let dayData = locationData[date];
            if (dayData.snow > 0) {
                snowCount += 1;
            } else if (dayData.rain >= 0.5) {
                rainCount += 1;
            } else {
                sunnyCount += 1;
            }
        }

        let el = element.find(".chart_body")[0];
        chart = new Chart(el, {
            type: "pie",
            data: {
                labels: ["맑음", "비", "눈"],
                datasets: [{
                    label: "날씨 비율",
                    data: [sunnyCount, rainCount, snowCount],
                    backgroundColor: [
                        "#FFF04D",
                        "#1E85E6",
                        "#EEEEEE"
                    ]
                }]
            }
        });
    }
    update();

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const rainChartLegacy = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let locationData = getData(weatherData, val);
        let rainData = {};
        let snowData = {};

        for (let i in locationData) {
            let dayData = locationData[i];
            let month = Number(dayData.date.split("-")[1]);
            if (rainData[month] == null) {
                rainData[month] = [];
                snowData[month] = [];
            }
            rainData[month].push(dayData.rain);
            snowData[month].push(dayData.snow);
        }

        // 월 별로 평균 내기
        for (let month in rainData) {
            rainData[month] = n.mean(rainData[month]);
        }
        for (let month in snowData) {
            snowData[month] = n.mean(snowData[month]);
        }

        let el = element.find(".chart_body")[0];
        chart = new Chart(el, {
            type: "bar",
            data: {
                labels: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
                datasets: [
                    {
                        label: "강우량(mm)",
                        data: Object.values(rainData),
                        backgroundColor: "#1E85E6"
                    },
                    {
                        label: "적설량(cm)",
                        data: Object.values(snowData),
                        backgroundColor: "#EEEEEE"
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                      stacked: true,
                    },
                    y: {
                      stacked: true
                    }
                  }
            }
        });
    }
    update("all");

    // 바인딩
    element.find("select").change(function() {
        let val = $(this).val();
        update(val);
    });
}

export const rankingChartLegacy = (element, column, name, color, weatherData) => {
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
        globalData = Object.keys(globalData).map(function(key) {
            return [key, globalData[key]];
        });

        globalData.sort(function(first, second) {
            return second[1] - first[1];
        });

        let newGlobalData = {}
        for (let i in globalData) {
            let locationData = globalData[i];
            newGlobalData[locationData[0]] = locationData[1];
        }

        let el = element.find(".chart_body")[0];
        chart = new Chart(el, {
            type: "bar",
            data: {
                labels: Object.keys(newGlobalData),
                datasets: [
                    {
                        label: name,
                        data: Object.values(newGlobalData),
                        backgroundColor: color
                    }
                ]
            },
            options: {
                indexAxis: "y"
            }
        });
    }
    update("1");

    // 바인딩
    element.find("select").change(function() {
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

export const heatmapD3 = (element, weatherData) => {
    let chart = null;
    addOptions(element.find("select"), Object.keys(weatherData));

    // 업데이트
    function update() {
        if (chart) {
            chart.destroy();
        }

        let labels = []
        let heatDatas = []
        
        for (let location in weatherData) {
            labels.push(location);
            let locationData = getData(weatherData, location);
            let yearData = [];

            for (let month = 1; month <= 12; month++) {
                let monthData = [];
                for (let i in locationData) {
                    let dayData = locationData[i];
                    if (Number(dayData.date.split("-")[1]) == month) {
                        monthData.push(dayData);
                    }
                }
                yearData.push(n.mean(getColumn(monthData, "temperature")));
            }
            heatDatas.push(yearData);
        }

        let el = element.find(".chart_body");
        let data = {
            labels: {
                x: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
                y: labels
            },
            values: heatDatas
        }
        let options = {
            paddingX: 60
        }
        chart = new d3ext.heatmap(el, data, options);
    }
    update();

    // 바인딩
    // element.find("select").change(function() {
    //     let val = $(this).val();
    //     update(val);
    // });
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
            values: getColumn(dailyData, "temperature")
            // values: [getColumn(dailyData, "temperature"), getColumn(dailyData, "humidity")]
        };
        let options = {
            colors: ["#FFD400", "#1E85E6"]
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
export const naRatioEDA = (element, rows) => {
    let [na, naCount, naColumns] = eda.isNa(rows);

    let naData = [];
    for (let i in na) {
        let row = na[i];
        let naRow = [];
        for (let c in row) {
            if (row[c]) {
                naRow.push(1);
            } else {
                naRow.push(0);
            }
        }
        naData.push(naRow);
    }

    let labels = [];
    for (let c in naColumns) {
        let percent = (naColumns[c] / rows.length * 100).toFixed(2);
        let label = `${c}  (${percent}%)`;
        labels.push(label);
    }

    let el = element.find(".chart_body");
    let data = {
        labels: {
            x: labels,
            y: Object.keys(naData)
        },
        values: naData
    }
    let option = {
        yAxis: false,
        startColor: "#FFFFFF",
        endColor: "#000000"
    };
    let chart = new d3ext.heatmap(el, data, option);
}

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
        update(val1, val2);
    }
    firstSelect.change(selectionBind);
    secondSelect.change(selectionBind)

    firstSelect.val("Survived");
    secondSelect.val("Pclass");
    update("Survived", "Pclass");
}

export const describeEDA = (element, rows) => {
    let chart = null;

    let columns = {};

    // 숫자형인 컬럼명만 수집
    let keys = Object.keys(rows[0]);
    for (let i = 1; i < keys.length; i++) {
        let c = keys[i];
        let columnData = getColumn(rows, c);
        if (eda.isColumnNumber(columnData)) {
            columns[c] = n.toNum(eda.removeNull(columnData));
        }
    }

    // 데이터 정리
    for (let c in columns) {
        let datas = columns[c];
        let sorted = [...datas].sort();

        let sortedMin = Math.floor(sorted.length / 2);
        let sortedMax = Math.ceil(sorted.length / 2);
        let median = sortedMin;
        if (sorted.length % 2 == 1) {
            median = sortedMin;
        } else {
            median = (sortedMin + sortedMax) / 2;
        }

        let data = [
            datas.length, // count
            n.mean(datas), // mean
            n.std(datas), // std
            n.min(datas), // min
            n.max(datas), // max
            n.var(datas), // var
            median // median
        ];
        columns[c] = data;
    }

    function update(val) {
        if (chart) {
            chart.destroy();
        }

        let el = element.find(".chart_body");
        let data = {
            labels: {
                x: Object.keys(columns),
                y: ["count", "mean", "std", "min", "max", "var", "median"]
            },
            values: rotateRows(Object.values(columns)),
        };
        let options = {};

        chart = new d3ext.table(el, data, options);
    }

    // 바인딩
    update();
}

export const scatterEDA = (element, rows) => {
    let chart = null;
    
    let columns = {};

    // 숫자형인 컬럼명만 수집
    let keys = Object.keys(rows[0]);
    for (let i = 1; i < keys.length; i++) {
        let c = keys[i];
        let columnData = getColumn(rows, c);
        if (eda.isColumnNumber(columnData)) {
            columns[c] = columnData;
        }
    }

    let firstSelect = element.find("select").eq(0);
    let secondSelect = element.find("select").eq(1);
    addOptions(firstSelect, Object.keys(columns));
    addOptions(secondSelect, Object.keys(columns));

    function update(val1, val2) {
        if (chart) {
            chart.destroy();
        }

        // 결측값 1이나 2에 하나라도 있으면 안씀
        let values = [];
        for (let i in rows) {
            let row = rows[i];
            if (!eda.isNull(row[val1]) && !eda.isNull(row[val2])) {
                values.push([Number(row[val1]), Number(row[val2])]);
            }
        }

        let el = element.find(".chart_body");
        let data = {
            labels: {
                x: val1, y: val2
            },
            values: values
        };
        let options = {
            reverse: true
        };

        chart = new d3ext.scatter(el, data, options);
    }

    // 바인딩
    function selectionBind() {
        let val1 = firstSelect.val();
        let val2 = secondSelect.val();
        update(val1, val2);
    }
    firstSelect.change(selectionBind);
    secondSelect.change(selectionBind)

    firstSelect.val("Age");
    secondSelect.val("Fare");
    update("Age", "Fare");
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
    cb.getPixelDatas(img, 1, cb.getRGB)
        .then((pixels) => {
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
                    reverse: true
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
    console.log(canvas);
    let context = canvas.getContext("2d");

    let selections = ["GRAY", "R", "G", "B"];
    addOptions(element.find("select"), selections);

    // 이미지 탐색
    cb.getPixelDatas(img, [canvas.width, canvas.height], cb.getPixelDatas)
        .then((pixels) => {
            function update(val) {
                context.clearRect(0, 0, canvas.width, canvas.height);

                // 그리기
                
            }
        
            // 바인딩
            element.find("select").change(() => {
                let val = element.find("select").val();
                update(val);
            });
            update(selections[0]);
        });
}