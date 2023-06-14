export const getAverage = (list) => {
    let sum = 0;
    for (let i in list) {
        sum += list[i];
    }
    return sum / list.length;
}

const mergeDatesAverage = (data) => {
    let summary = {};
    for (let i in data) {
        let dayData = data[i];
        if (!summary[dayData.date]) {
            let daySummary = {
                "temperature": [],
                "humidity": [],
                "rain": [],
                "snow": [],
            }
            summary[dayData.date] = daySummary;
        }

        for (let column in summary[dayData.date]) {
            summary[dayData.date][column].push(dayData[column]);
        }
    }

    let result = []
    for (let date in summary) {
        let daySummary = summary[date];
        let dayData = { "date": date }
        for (let column in daySummary) {
            dayData[column] = getAverage(daySummary[column]);
        }
        result.push(dayData);
    }
    return result;
}

export const getData = (weatherData, location, date) => {
    let result = [];
    if (location && location != "all") {
        result = weatherData[location];
    } else {
        for (let loc in weatherData) {
            result = result.concat(weatherData[loc]);
        }
    }
    result = mergeDatesAverage(result);

    if (date) {
        if (typeof date == "number") {
            date = [date, date];
        }

        let filter = []
        for (let i in result) {
            let dayData = result[i];
            let month = Number(dayData.date.split("-")[1]);
            if (date[0] <= month && month <= date[1]) {
                filter.push(dayData);
            }
        }
        result = filter;
    }
    return result;
}

export const getColumn = (data, column) => {
    let result = [];
    for (let i in data) {
        result.push(data[i][column]);
    }
    return result;
}

export const addOptions = (select, options) => {
    for (let i in options) {
        let option = options[i];
        let element = $($.parseHTML("<option></option>"));
        element.text(option);
        element.val(option);
        select.append(element);
    }
}

export const destroyChart = (charts, element) => {
    if (charts[element]) {
        charts[element].destroy();
    }
}

export const clamp = (min, val, max) => {
    if (val < min) {
        return min;
    } else if (max && val > max) {
        return max;
    } else {
        return val;
    }
}

// 차트 프레임
export const getMonthChartFrame = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""><option value="1">1월</option><option value="2">2월</option><option value="3">3월</option><option value="4">4월</option><option value="5">5월</option><option value="6">6월</option><option value="7">7월</option><option value="8">8월</option><option value="9">9월</option><option value="10">10월</option><option value="11">11월</option><option value="12">12월</option></select></div><div class="chart_body"></div></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

export const getLocationChartFrame = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""><option value="">전체 지역 평균</option></select></div><div class="chart_body"></div></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

export const getEmptyOptionChartFrame = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""></select></div><div class="chart_body"></div></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

export const getChartFrame = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div></div><div class="chart_body"></div></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

// Chart.js쓰는 레거시 버전
export const getMonthChartFrameLegacy = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""><option value="1">1월</option><option value="2">2월</option><option value="3">3월</option><option value="4">4월</option><option value="5">5월</option><option value="6">6월</option><option value="7">7월</option><option value="8">8월</option><option value="9">9월</option><option value="10">10월</option><option value="11">11월</option><option value="12">12월</option></select></div><canvas class="chart_body" width: "600" "height: 310"></canvas></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

export const getLocationChartFrameLegacy = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""><option value="">전체 지역 평균</option></select></div><canvas class="chart_body" width: "600" "height: 310"></canvas></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

export const getEmptyOptionChartFrameLegacy = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""></select></div><canvas class="chart_body" width: "600" "height: 310"></canvas></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

// D3 차트 프레임
export const getMonthChartFrameD3 = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""><option value="1">1월</option><option value="2">2월</option><option value="3">3월</option><option value="4">4월</option><option value="5">5월</option><option value="6">6월</option><option value="7">7월</option><option value="8">8월</option><option value="9">9월</option><option value="10">10월</option><option value="11">11월</option><option value="12">12월</option></select></div><svg class="chart_body" width: "600" "height: 310"></svg></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

export const getLocationChartFrameD3 = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""><option value="">전체 지역 평균</option></select></div><svg class="chart_body" width: "600" "height: 310"></svg></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

export const getChartFrameD3 = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div></div><svg class="chart_body" width: "600" "height: 310"></svg></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

export const getEmptyOptionChartFrameD3 = (title, parent) => {
    let frame = $($.parseHTML('<div class="chart_frame"><div class="chart_header"><div class="chart_title"></div><select name="" id=""></select></div><svg class="chart_body" width: "600" "height: 310"></svg></div>'));
    frame.find(".chart_title").text(title);
    frame.appendTo(parent);
    return frame;
}

// export const getPixelDatas = (url, scale = 1, method) => {
//     let img = document.createElement("img")
//     img.src = url;

//     return new Promise((resolve, reject) => {
//         img.onload = () => {
//             let { width, height, offsetX, offsetY } = [img.width, img.height, 0, 0];
//             if (typeof scale == "object") {
//                 if (img.width > img.height) { // 가로가 세로보다 길다
//                     scale = scale[0] / img.width;
//                 } else {
//                     scale = scale[1] / img.height;
//                 }

//                 width = parseInt(Math.floor(img.width * scale));
//                 height = parseInt(Math.floor(img.height * scale));
//                 offsetX = parseInt(Math.floor((scale[0] - width) / 2));
//                 offsetY = parseInt(Math.floor((scale[1] - height) / 2));
//             }

//             let canvas = document.createElement("canvas");
//             let context = canvas.getContext("2d");
//             context.drawImage(img, offsetX, offsetY, width, height);

//             let data = context.getImageData(offsetX, offsetY, width, height).data;
//             resolve(method(data));
//         };
//     })
// }

export const n = {
    toNum: arr => arr.map(v => Number(v)),
    sum: arr => arr.reduce((r, v) => r + v), // 합계
    mean: arr => n.sum(arr) / arr.length, // 평균
    min: arr => arr.reduce((r, v) => v < r ? v : r), // 최소값
    max: arr => arr.reduce((r, v) => v > r ? v : r), // 최대값
    dev: arr => arr.map(v => v - n.mean(arr)), // 편차
    var: arr => n.dev(arr).reduce((r, v) => r + Math.pow(Math.abs(v), 2), 0) / arr.length, // 분산
    std: arr => Math.sqrt(n.var(arr)) // 표준 편차
}

export const rotateRows = (arr) => {
    // console.log(arr);
    let result = [];
    for (let i = 0; i < arr[0].length; i++) {
        result.push([]);
    }
    // console.log(`be ${result.length} columns`);

    for (let c = 0; c < arr[0].length; c++) {
        for (let r in arr) {
            let row = arr[r];
            result[c].push(row[c]);
        }
    }
    // console.log(result);
    return result;
}