import * as jsChart from "/js/jschart.js";
import * as cb from "/js/chartBase.js";
import * as d3ext from "/js/d3ext.js";

const protocol = window.location.protocol;
const host = window.location.host;

$().ready(() => {
    fetch("/summary/Iris.csv")
    .then(summary => summary.json())
    .then((summary) => {
        let holder = $(".chart_holder")
        let numbers = Object.keys(summary.Columns).reduce((arr, key) => {
            if (summary.Numbers.includes(key)) {
                arr[key] = summary.Columns[key];
            }
            return arr;
        }, {});


        
        let vcChart = cb.getEmptyOptionChartFrame("Value Counts", holder)
        jsChart.valueCountChart(vcChart, summary)

        let summaryChart = cb.getEmptyOptionChartFrame("Describe", holder)
        jsChart.describeChart(summaryChart, summary)

        let quartileChart = cb.getEmptyOptionChartFrameLegacy("Quartile", holder)
        jsChart.quartileChart(quartileChart, summary.Describe, numbers)

        let noKeys = [];
        let columns = Object.keys(summary.Columns);
        for (let r = 0; r < summary.Columns[columns[0]].length; r++) {
            let row = [];
            for (let c in summary.Columns) {
                row.push(summary.Columns[c][r])
            }
            noKeys.push(row);
        }

        let naChart = cb.getChartFrameD3("결측값 비율", holder)
        jsChart.naRatioEDA(naChart, noKeys)
    });
})