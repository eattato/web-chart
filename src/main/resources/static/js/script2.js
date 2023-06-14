import * as jsChart from "/js/jschart.js";
import * as cb from "/js/chartBase.js";
import * as d3ext from "/js/d3ext.js";
import { CsvDF } from "/js/df.js";

const protocol = window.location.protocol;
const host = window.location.host;

$().ready(() => {
    fetch("/summary/BagOfWord.csv")
    .then(summary => summary.json())
    .then((summary) => {
        let df = new CsvDF(summary.DataFrame);
        let holder = $(".chart_holder");

        const defaultWindows = () => {
            let naChart = cb.getChartFrameD3("결측값 비율", holder);
            jsChart.naRatioEDA(naChart, df);

            let summaryChart = cb.getEmptyOptionChartFrame("Describe", holder);
            jsChart.describeChart(summaryChart, summary.Describe);
        }

        const numberWindows = () => {
            let vcChart = cb.getEmptyOptionChartFrame("Value Counts", holder);
            jsChart.valueCountChart(vcChart, summary.ValueCounts);

            let quartileChart = cb.getEmptyOptionChartFrame("Quartile", holder);
            jsChart.quartileChart(quartileChart, summary, df);
        }

        const textWindows = () => {
            let wordCloud = cb.getEmptyOptionChartFrame("Word Cloud", holder);
            jsChart.wordCloudChart(wordCloud, summary.StrData, df);

            let sentenceLength = cb.getEmptyOptionChartFrameD3("Sentence Length", holder);
            jsChart.sentenceLengthChart(sentenceLength, summary.StrData, df);

            let wordCount = cb.getEmptyOptionChartFrameD3("Word Count", holder);
            jsChart.wordCountChart(wordCount, summary.StrData, df);
        }


        defaultWindows();
        if (summary.Numbers.length > 0) {
            numberWindows();
        }
        if (Object.keys(summary.StrData).length > 0) {
            textWindows();
        }
    });
})