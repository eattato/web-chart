import * as jsChart from "/js/jschart.js";
import * as cb from "/js/chartBase.js";
import * as d3ext from "/js/d3ext.js";
import { CsvDF } from "/js/df.js";

const protocol = window.location.protocol;
const host = window.location.host;

$().ready(() => {
    let bodyFrame = $(".body_frame");
    const createCategory = (title) => {
        let category = $($.parseHTML(`<div class="chart_category"><div class="chart_drawer">${title}</div><div class="chart_holder"></div></div>`));
        category.appendTo(bodyFrame);
        return category;
    }

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

            dataSelect.change(() => {
                bodyFrame.empty();
                let selectedData = dataSelect.val();
                fetch(`/summary/${selectedData}`)
                    .then((res) => res.json())
                    .then((summary) => {
                        let df = new CsvDF(summary.DataFrame);
                
                        const defaultWindows = () => {
                            let category = createCategory("Common Datas");
                            let holder = category.find(".chart_holder");

                            let naChart = cb.getChartFrameD3("NaN Rate", holder);
                            jsChart.naRatioEDA(naChart, df);
                
                            let vcChart = cb.getEmptyOptionChartFrame("Value Counts", holder);
                            jsChart.valueCountChart(vcChart, summary.ValueCounts);
                        }
                
                        const numberWindows = () => {
                            let category = createCategory("Number Datas");
                            let holder = category.find(".chart_holder");

                            let summaryChart = cb.getEmptyOptionChartFrame("Describe", holder);
                            jsChart.describeChart(summaryChart, summary.Describe);

                            let quartileChart = cb.getEmptyOptionChartFrame("Quartile", holder);
                            jsChart.quartileChart(quartileChart, summary, df);

                            if (summary.Numbers.length > 2) {
                                let scatter = cb.getChartFrameD3("Scatter", holder);
                                let scatterSelect = $($.parseHTML('<div class="chart_selection"><select></select> and <select></select></div>'));
                                scatterSelect.appendTo(scatter.find(".chart_header"));
                                jsChart.scatterEDA(scatter, df, summary.Numbers);

                                let pair = cb.getChartFrame("Pairplot", holder);
                                jsChart.pairEDA(pair, df, summary.Numbers);
                            }
                        }
                
                        const categoryWindows = () => {
                            let category = createCategory("Category Datas");
                            let holder = category.find(".chart_holder");

                            let cvcChart = cb.getEmptyOptionChartFrame("Category Value Counts", holder);
                            jsChart.valueCountChart(cvcChart, summary.CategoryData);
                        }

                        const textWindows = () => {
                            let category = createCategory("Text Datas");
                            let holder = category.find(".chart_holder");
                            
                            let wordCloud = cb.getChartFrame("Word Cloud", holder);
                            let wordCloudSelect = $($.parseHTML('<div class="chart_selection"><select name="" id=""></select> over <input type="number" value="1" /> usages</div>'));
                            wordCloudSelect.appendTo(wordCloud.find(".chart_header"));
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
                        if (Object.keys(summary.CategoryData).length > 0) {
                            // categoryWindows();
                        }
                    })
            })
            if (options.length > 0) dataSelect.val(options[0]);
        })
})