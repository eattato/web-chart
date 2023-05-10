import * as jsChart from "/js/jschart.js";
import * as cb from "/js/chartBase.js";
import * as eda from "/js/eda.js";
import * as d3ext from "/js/d3ext.js";

$().ready(() => {
    let weatherData = {};

    fetch("/data/weather3.json")
    .then(res => res.json())
    .then((res) => {
        weatherData = res;

        $(".chart_category").each((ind, obj) => {
            let category = $(obj);
            let drawer = category.find(".chart_drawer");
            let holder = category.find(".chart_holder");

            let drawerText = drawer.text();
            function activate(change) {
                if (change) {
                    if (holder.hasClass("hide")) {
                        holder.removeClass("hide");
                    } else {
                        holder.addClass("hide");
                    }
                }

                if (holder.hasClass("hide")) {
                    drawer.text(drawerText + " 열기");
                } else {
                    drawer.text(drawerText + " 닫기");
                }
            }
            
            drawer.click(() => {
                activate(true);
            })
            activate(false);
        })

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
        cb.addOptions($("#predict_location"), Object.keys(weatherData));

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
                        let rain = cb.clamp(0, res.rain);
                        let snow = cb.clamp(0, res.snow);
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
        let legacyHolder = $("#legacy_holder");

        let dailyChartLegacy = cb.getLocationChartFrameLegacy("일일 기온 및 습도 (Chart.js)", legacyHolder);
        let temperatureRankLegacy = cb.getMonthChartFrameLegacy("지역별 온도 순위 (Chart.js)", legacyHolder);
        let rainRankLegacy = cb.getMonthChartFrameLegacy("지역별 강우량 순위 (Chart.js)", legacyHolder);
        let rainMonthChartLegacy = cb.getMonthChartFrameLegacy("월 별 강수량 (Chart.js)", legacyHolder);
        let ratioChartLegacy = cb.getLocationChartFrameLegacy("연간 날씨 비율 (Chart.js)", legacyHolder);

        jsChart.dailyChartLegacy(dailyChartLegacy, weatherData);
        jsChart.weatherRatioLegacy(ratioChartLegacy, weatherData);
        jsChart.rainChartLegacy(rainMonthChartLegacy, weatherData);
        jsChart.rankingChartLegacy(temperatureRankLegacy, "temperature", "기온", "#FFF04D", weatherData);
        jsChart.rankingChartLegacy(rainRankLegacy, "rain", "강우량(mm)", "#1E85E6", weatherData);

        // D3 쓰는 차트 생성
        let d3Holder = $("#d3_holder");

        let rainRankD3 = cb.getMonthChartFrameD3("지역별 강우량 순위", d3Holder);
        let temperatureRankD3 = cb.getMonthChartFrameD3("지역별 온도 순위", d3Holder);
        let heatmapD3 = cb.getChartFrameD3("지역별 기온 히트맵", d3Holder);
        let dailyChartD3 = cb.getLocationChartFrameD3("일일 기온 및 습도", d3Holder);

        jsChart.rankingChartD3(rainRankD3, "rain", "강우량(mm)", "#1E85E6", weatherData);
        jsChart.rankingChartD3(temperatureRankD3, "temperature", "기온", "#FFF04D", weatherData);
        jsChart.heatmapD3(heatmapD3, weatherData);
        jsChart.dailyChartD3(dailyChartD3, weatherData);

        // EDA 데이터
        let rows = []
        d3.csv("/data/titanic.csv", (data) => {
            rows.push(data)
        }).then(() => {
            console.log(`${rows.length} rows found`);
            let [columnCount, rowCount, naCount, naPercent, columnCategory, unique] = eda.getCommonDatas(rows)
            console.log([columnCount, rowCount, naCount, naPercent, columnCategory, unique]);

            let naChart = cb.getChartFrameD3("결측값 비율", d3Holder);
            let [na, naTotal, naColumns] = eda.isNa(rows);

            // 결측값 데이터
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

            let el = naChart.find(".chart_body");
            let data = {
                labels: {
                    x: Object.keys(rows[0]),
                    y: Object.keys(naData)
                },
                values: naData
            }
            let option = {
                yAxis: false
            };
            let chart = new d3ext.heatmap(el, data, option);
        });
    });
})