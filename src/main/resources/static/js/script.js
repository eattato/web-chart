import * as jsChart from "/js/jschart.js";
import { addOptions, clamp } from "/js/chartBase.js";

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
    let predictBody = $(".predict_body");
    addOptions($("#predict_location"), Object.keys(weatherData));

    $("#predict_submit").click(() => {
        if (canSubmit) {
            let location = $("#predict_location").val()
            let month = $("#predict_month").val()
            let temperature = $("#predict_temperature").val();
            let humidity = $("#predict_humidity").val();

            if (temperature.length > 0 && humidity.length > 0 && !isNaN(temperature) && !isNaN(humidity)) {
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
                    })
                }).then(res => res.json())
                .then((res) => {
                    console.log(res);
                    let rain = clamp(0, res.rain);
                    let snow = clamp(0, res.snow);
                    let weather = "맑음";

                    if (snow > 0) {
                        weather = "눈";
                    } else if (rain >= 0.5) {
                        weather = "비";
                    }

                    predictBody.removeClass("hide");
                    $(".predict_result").text(weather);
                    $(".predict_subtitle").text(
                        `예측된 강우량은 ${rain}mm, 적설량은 ${snow}cm입니다.`
                    );
                }).finally(() => {
                    canSubmit = true;
                });
            } else {
                alert("온도와 습도를 입력해주세요.");
            }
        }
    });
});