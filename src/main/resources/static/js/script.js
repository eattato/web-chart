import * as jsChart from "/js/jschart.js";
import { addOptions, clamp, getMonthChartFrame, getLocationChartFrame, getMonthChartFrameLegacy, getLocationChartFrameLegacy } from "/js/chartBase.js";

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
                    let comment = "";

                    if (snow > 0) {
                        weather = "눈";
                        if (snow <= 2) {
                            comment = "눈이 조금 내립니다..";
                        } else if (snow <= 5) {
                            comment = "눈이 꽤나 쌓였습니다..";
                        } else {
                            comment = "교통사고 발생 확률이 높으니 운전을 자제하세요."
                        }
                    } else if (rain >= 0.5) {
                        weather = "비";
                        if (rain <= 1) {
                            comment = "비가 흩날리듯이 내립니다..";
                        } else if (rain <= 2.5) {
                            comment = "비가 가늘게 내립니다..\n우산을 챙기는 것을 권장합니다.";
                        } else if (rain <= 5) {
                            comment = "비가 부슬부슬 내립니다..\n우산을 챙기세요.";
                        } else if (rain <= 10) {
                            comment = "비가 추적추적 내립니다..\n우산을 꼭 챙기세요.";
                        } else if (rain <= 20) {
                            comment = "비가 거세게 내립니다..\n우산을 꼭 챙기세요.";
                        } else {
                            comment = "비가 매우 거세게 내립니다..\n외출을 자제하세요.";
                        }
                    }

                    predictBody.removeClass("hide");
                    $(".predict_result").text(weather);
                    $(".predict_subtitle").text(
                        `예측된 강우량은 ${rain}mm, 적설량은 ${snow}cm입니다.`
                    );
                    $(".predict_comment").text(comment);
                }).finally(() => {
                    canSubmit = true;
                });
            } else {
                alert("온도와 습도를 입력해주세요.");
            }
        }
    });

    // Chart.js쓰는 차트 생성
    let dailyChartLegacy = getLocationChartFrameLegacy("일일 기온 및 습도");
    jsChart.dailyChartLegacy(dailyChartLegacy, weatherData);
});