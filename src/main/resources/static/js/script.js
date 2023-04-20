let data = {};

const getAverage = (list) => {
    let sum = 0;
    for (let i in list) {
        sum += list[i];
    }
    return sum / list.length;
}

const getLocationDataAverage = (location) => {
    let locationData = [];
    if (location) {
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

fetch("/data/weather3.json")
.then(res => res.json())
.then((res) => {
    data = res;

    let dailyChart = $("#daily");
    let rainLocChart = $("#rain_top");
    let rainMonthChart = $("#rain_month");
    let ratioChart = $("#weather_ratio");

    let globalData = getLocationDataAverage();
    console.log(globalData);
    // console.log(getColumn(globalData, "tempurature"));
    // console.log(getColumn(globalData, "humidity"));
    new Chart(dailyChart.find(".chart_body"), {
        type: "line",
        data: {
            // labels: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
            datasets: [
                {
                    label: "기온",
                    data: getColumn(globalData, "tempurature"),
                },
                {
                    label: "습도",
                    data: getColumn(globalData, "humidity")
                }
            ]
        }
    })
});