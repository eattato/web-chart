import { getAverage, getData, getColumn, addOptions, destroyChart } from "/js/chartBase.js";
const toastChart = toastui.Chart;

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
            rainData[month] = getAverage(rainData[month]);
        }
        for (let month in snowData) {
            snowData[month] = getAverage(snowData[month]);
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
            globalData[location] = getAverage(getColumn(getData(weatherData, location, val), column));
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
                yearData.push(getAverage(getColumn(monthData, "temperature")));
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
            rainData[month] = getAverage(rainData[month]);
        }
        for (let month in snowData) {
            snowData[month] = getAverage(snowData[month]);
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
            globalData[location] = getAverage(getColumn(getData(weatherData, location, val), column));
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