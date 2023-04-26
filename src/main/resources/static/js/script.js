import * as jsChart from "/js/jschart.js";

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
});