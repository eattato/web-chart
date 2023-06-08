import * as jsChart from "/js/jschart.js";
import * as cb from "/js/chartBase.js";
import * as d3ext from "/js/d3ext.js";
import { CsvDF } from "/js/df.js";

const protocol = window.location.protocol;
const host = window.location.host;

$().ready(() => {
    fetch("/summary/Iris.csv")
    .then(summary => summary.json())
    .then((summary) => {
        let df = new CsvDF(summary.DataFrame);

        let holder = $(".chart_holder")
        let numbers = Object.keys(df.columns).reduce((arr, key) => {
            if (summary.Numbers.includes(key)) {
                arr[key] = df.getColumn(key);
            }
            return arr;
        }, {});


        
        let vcChart = cb.getEmptyOptionChartFrame("Value Counts", holder)
        jsChart.valueCountChart(vcChart, summary.ValueCounts)

        let summaryChart = cb.getEmptyOptionChartFrame("Describe", holder)
        jsChart.describeChart(summaryChart, summary.Describe)

        let quartileChart = cb.getEmptyOptionChartFrame("Quartile", holder)
        jsChart.quartileChart(quartileChart, summary, df)

        let naChart = cb.getChartFrameD3("결측값 비율", holder)
        jsChart.naRatioEDA(naChart, df)
    });
})