const toastChart = toastui.Chart;
import { getAverage, getData, getColumn, addOptions, destroyChart } from "/js/chartBase.js";
import * as jsChart from "/js/jschart.js";

let weatherData = {};
let charts = {};

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

    jsChart.dailyChart(dailyChart, weatherData);
    jsChart.weatherRatio(ratioChart, weatherData);
    jsChart.rainChart(rainMonthChart, weatherData);
    jsChart.rankingChart(temperatureRank, "temperature", "기온", "#FFF04D", weatherData);
    jsChart.rankingChart(rainRank, "rain", "강우량(mm)", "#1E85E6", weatherData);

    function updateHeatmap() {
        // let element = heatmap;
        // destroyChart(element.attr("id"));

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

    // 기본 표시
    updateHeatmap();
});