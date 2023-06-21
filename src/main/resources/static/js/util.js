export const zipDict = (keys, values) => {
    return keys.reduce((arr, key, i) => {
        arr[key] = values[i];
        return arr;
    }, {});
}

export const sortByKey = (dict, order="asc") => {
    let keys = Object.keys(dict);
    keys.sort((a, b) => {
        return order == "asc" ? a[1] - b[1] : b[1] - a[1];
    });

    return keys.reduce((arr, key) => {
        arr[key] = dict[key]
        return arr;
    }, {})
}

export const sortByValue = (dict, order="asc") => {
    let flatten = Object.keys(dict).map((key) => [key, dict[key]]);
    flatten.sort((a, b) => {
        return order == "asc" ? a[1] - b[1] : b[1] - a[1];
    });
    
    return flatten.reduce((arr, c) => {
        arr[c[0]] = c[1];
        return arr;
    }, {})
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

export const dec = (x) => {
    let result = 0;
    let hexDict = {
        "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "A": 10, "B": 11, "C": 12, "D": 13, "E": 14, "F": 15, "a": 10, "b": 11, "c": 12, "d": 13, "e": 14, "f": 15
    }

    for (let i = 0; i < x.length; i++) {
        let val = x.charAt(i);
        val = hexDict[val];
        val *= Math.pow(16, x.length - i - 1);
        result += val;
    }
    return result;
}

export const toHex = (x, formatLength) => {
    let resMult = "";
    if (x < 0) { resMult = "-" }

    let factor = 0;
    while (Math.pow(16, factor) <= x) {
        factor++;
    }

    let hexDict = {
        0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "A", 11: "B", 12: "C", 13: "D", 14: "E", 15: "F"
    }

    let result = "";
    for (let i = factor - 1; i >= 0; i--) {
        let mult = Math.pow(16, i);
        let v = Math.floor(x / mult);
        x -= v * mult;
        result += hexDict[v];
    }
    if (factor == 0) { // 0이 들어와서 결과가 안 나온 경우
        result = "0";
    }

    if (formatLength) {
        let fillCount = formatLength - result.length;
        for (let i = 1; i <= fillCount; i++) {
            result = "0" + result;
        }
    }
    return resMult + result;
}

export const lerp = (start, end, alpha) => {
    // if (start > end) {
    //     let temp = start;
    //     start = end
    //     end = temp;
    // }
    return end - (end - start) * alpha;
}

export const hexColorToDec = (color) => {
    return [dec(color.substring(1, 3)), dec(color.substring(3, 5)), dec(color.substring(5, 7))]
}

export const decColorToHex = (color) => {
    return "#" + color.map((v) => toHex(v, 2))
}


/**
 * 시작, 끝, 변환값(alpha)를 통해 색의 중간값을 얻음
 * @param {string} start 시작이 되는 16진수 색
 * @param {string} end 끝이 되는 16진수 색
 * @param {number} alpha 알파값
 * @returns 중간색
 */
export const colorLerp = (start, end, alpha) => {
    let startRGB = hexColorToDec(start);
    let endRGB = hexColorToDec(end);
    startRGB = startRGB.map((v, i) => Math.round(lerp(startRGB[i], endRGB[i], 1 - alpha)))
    return decColorToHex(startRGB)
}