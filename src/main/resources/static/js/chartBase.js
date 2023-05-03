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