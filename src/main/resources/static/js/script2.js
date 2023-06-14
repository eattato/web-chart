import * as jsChart from "/js/jschart.js";
import * as cb from "/js/chartBase.js";
import * as d3ext from "/js/d3ext.js";
import { CsvDF } from "/js/df.js";

const protocol = window.location.protocol;
const host = window.location.host;

$().ready(() => {
    fetch("/datalist")
        .then(res => res.json())
        .then((dataList) => {
            let dataSelect = $("#dataset_select");
            let options = [];
            dataList.list.forEach((v) => {
                let option = $($.parseHTML(`<option value='${v}'>${v}</option>`));
                options.push(option);
                option.appendTo(dataSelect);
            });

            let holder = $(".chart_holder");
            dataSelect.change(() => {
                holder.empty();
                let selectedData = dataSelect.val();
                fetch(`/summary/${selectedData}`)
                    .then((res) => res.json())
                    .then((summary) => {
                        let df = new CsvDF(summary.DataFrame);
                
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
                    })
            })
            if (options.length > 0) dataSelect.val(options[0]);
        })
})