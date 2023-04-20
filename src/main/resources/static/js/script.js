let data = {};
let charts = {};

const getAverage = (list) => {
    let sum = 0;
    for (let i in list) {
        sum += list[i];
    }
    return sum / list.length;
}

const getLocationDataAverage = (location) => {
    let locationData = [];
    if (location && location != "all") {
        locationData = data[location];
    } else {
        for (let loc in data) {
            locationData = locationData.concat(data[loc]);
        }
    }

    let result = {};
    for (let i in locationData) {
        let dayData = locationData[i];

        let dateRecord = result[dayData.date];
        if (dateRecord == null) {
            result[dayData.date] = {
                "tempurature": [],
                "humidity": [],
                "rain": [],
                "snow": []
            }
            dateRecord = result[dayData.date];
        }

        for (let column in dayData) {
            if (column != "date") {
                dateRecord[column].push(dayData[column]);
            }
        }
    }

    for (let date in result) {
        let dayData = result[date];
        for (let column in dayData) {
            dayData[column] = getAverage(dayData[column]);
        }
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
    data = res;

    let dailyChart = $("#daily");
    let rainLocChart = $("#rain_top");
    let rainMonthChart = $("#rain_month");
    let ratioChart = $("#weather_ratio");

    addOptions(dailyChart.find("select"), Object.keys(data));
    addOptions(ratioChart.find("select"), Object.keys(data));

    function updateDailyChart(val) {
        let element = dailyChart;
        destroyChart(element.attr("id"));

        let dailyData = getLocationDataAverage(val);
        charts[dailyChart.attr("id")] = new Chart(dailyChart.find(".chart_body"), {
            type: "line",
            data: {
                labels: Object.keys(dailyData),
                datasets: [
                    {
                        label: "기온",
                        data: getColumn(dailyData, "tempurature"),
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

        let locationData = getLocationDataAverage(val);
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

    // 업데이트
    dailyChart.find("select").change(function() {
        let val = $(this).val();
        updateDailyChart(val);
    });

    ratioChart.find("select").change(function() {
        let val = $(this).val();
        updateWeatherRatio(val);
    });

    // 기본 표시
    updateDailyChart("all");
    updateWeatherRatio("all");
});