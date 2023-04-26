const toastChart = toastui.Chart;

let weatherData = {};
let charts = {};

const getAverage = (list) => {
    let sum = 0;
    for (let i in list) {
        sum += list[i];
    }
    return sum / list.length;
}

const mergeDatesAverage = (data) => {
    let summary = {};
    for (let i in data) {
        let dayData = data[i];
        if (!summary[dayData.date]) {
            let daySummary = {
                "temperature": [],
                "humidity": [],
                "rain": [],
                "snow": [],
            }
            summary[dayData.date] = daySummary;
        }

        for (let column in summary[dayData.date]) {
            summary[dayData.date][column].push(dayData[column]);
        }
    }

    let result = []
    for (let date in summary) {
        let daySummary = summary[date];
        let dayData = { "date": date }
        for (let column in daySummary) {
            dayData[column] = getAverage(daySummary[column]);
        }
        result.push(dayData);
    }
    return result;
}

const getData = (location, date) => {
    let result = [];
    if (location && location != "all") {
        result = weatherData[location];
    } else {
        for (let loc in weatherData) {
            result = result.concat(weatherData[loc]);
        }
    }
    result = mergeDatesAverage(result);

    if (date) {
        if (typeof date == "number") {
            date = [date, date];
        }

        let filter = []
        for (let i in result) {
            let dayData = result[i];
            let month = Number(dayData.date.split("-")[1]);
            if (date[0] <= month && month <= date[1]) {
                filter.push(dayData);
            }
        }
        result = filter;
    }
    return result;
}

const getColumn = (data, column) => {
    let result = [];
    for (let i in data) {
        result.push(data[i][column]);
    }
    return result;
}

const addOptions = (select, options) => {
    for (let i in options) {
        let option = options[i];
        let element = $($.parseHTML("<option></option>"));
        element.text(option);
        element.val(option);
        select.append(element);
    }
}

const destroyChart = (element) => {
    if (charts[element]) {
        charts[element].destroy();
    }
}

fetch("/data/weather3.json")
.then(res => res.json())
.then((res) => {
    weatherData = res;

    let dailyChart = $("#daily");
    let rainMonthChart = $("#rain_month");
    let ratioChart = $("#weather_ratio");
    let temperatureRank = $("#temperature");
    let rainRank = $("#rain");
    let heatmap = $("#heatmap");

    addOptions(dailyChart.find("select"), Object.keys(weatherData));
    addOptions(ratioChart.find("select"), Object.keys(weatherData));
    addOptions(temperatureRank.find("select"), Object.keys(weatherData));
    addOptions(rainRank.find("select"), Object.keys(weatherData));

    function updateDailyChart(val) {
        let element = dailyChart;
        destroyChart(element.attr("id"));

        let dailyData = getData(val);
        charts[dailyChart.attr("id")] = new Chart(dailyChart.find(".chart_body"), {
            type: "line",
            data: {
                labels: Object.keys(dailyData),
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

    function updateWeatherRatio(val) {
        let element = ratioChart;
        destroyChart(element.attr("id"));

        let locationData = getData(val);
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

        charts[element.attr("id")] = new Chart(element.find(".chart_body"), {
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
        })
    }

    function updateRainChart(val) {
        let element = rainMonthChart;
        destroyChart(element.attr("id"));

        let locationData = getData(val);
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

        charts[element.attr("id")] = new Chart(element.find(".chart_body"), {
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

    function updateRanking(element, column, val, name, color) {
        destroyChart(element.attr("id"));

        val = Number(val);
        let globalData = {};
        Object.assign(globalData, weatherData);

        for (let location in globalData) {
            globalData[location] = getAverage(getColumn(getData(location, val), column));
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

        charts[element.attr("id")] = new Chart(element.find(".chart_body"), {
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

    function updateHeatmap() {
        // let element = heatmap;
        // destroyChart(element.attr("id"));

        let labels = []
        let heatDatas = []
        
        for (let location in weatherData) {
            labels.push(location);
            let locationData = getData(location);
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

        let el = heatmap.find(".chart_body")[0];
        let data = {
            categories: {
                x: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
                y: labels,
            },
            series: heatDatas
        }
        let options = {}
        let chart = toastChart.heatmapChart({ el, data, options });
    }

    // 업데이트
    dailyChart.find("select").change(function() {
        let val = $(this).val();
        updateDailyChart(val);
    });

    ratioChart.find("select").change(function() {
        let val = $(this).val();
        updateWeatherRatio(val);
    });

    rainMonthChart.find("select").change(function() {
        let val = $(this).val();
        updateRainChart(val);
    });

    temperatureRank.find("select").change(function() {
        let val = $(this).val();
        updateRanking(temperatureRank, "temperature", val, "기온", "#FFF04D");
    });

    rainRank.find("select").change(function() {
        let val = $(this).val();
        updateRanking(rainRank, "rain", val, "강우량(mm)", "#1E85E6");
    });

    // 기본 표시
    updateDailyChart("all");
    updateWeatherRatio("all");
    updateRainChart("all");
    updateRanking(temperatureRank, "temperature", "1", "기온", "#FFF04D");
    updateRanking(rainRank, "rain", "1", "강우량(mm)", "#1E85E6");
    updateHeatmap();
});