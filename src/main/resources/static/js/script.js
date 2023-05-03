import * as jsChart from "/js/jschart.js";
import { addOptions } from "/js/chartBase.js";

let weatherData = {};

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
    let boxplot = $("#boxplot");

    jsChart.dailyChart(dailyChart, weatherData);
    jsChart.weatherRatio(ratioChart, weatherData);
    jsChart.rainChart(rainMonthChart, weatherData);
    jsChart.rankingChart(temperatureRank, "temperature", "기온", "#FFF04D", weatherData);
    jsChart.rankingChart(rainRank, "rain", "강우량(mm)", "#1E85E6", weatherData);
    jsChart.heatmap(heatmap, weatherData);
    jsChart.boxplot(boxplot, weatherData);

    let canSubmit = true
    let predict = $("#predict");
    addOptions(predictLocation, Object.keys(weatherData));

    $("#predict_submit").click(() => {
        if (canSubmit) {
            let location = $("#predict_location").val()
            let month = $("#predict_month").val()
            let temperature = $("#predict_temperature").val();
            let humidity = $("#predict_humidity").val();

            if (!isNaN(temperature) && !isNaN(humidity)) {
                canSubmit = false;
                fetch("/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        location: location,
                        month: Number(month),
                        temperature: Number(temperature),
                        humidity: Number(humidity)
                    }).then(res => res.json())
                    .then((res) => {
                        console.log(res);
                    }).finally(() => {
                        canSubmit = true;
                    })
                })
            } else {
                alert("온도와 습도를 입력해주세요.");
            }
        }
    });
});