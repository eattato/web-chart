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