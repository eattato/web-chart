const isNull = (val) => {
    return (val == null || val == undefined || (typeof val == "string" && val.length == 0))
}

const getColumn = (data, column) => {
    let result = [];
    for (let i in data) {
        result.push(data[i][column]);
    }
    return result;
}

/**
 * DataFrame의 모든 값을 결측값 여부로 변환해 리턴
 * @param {*} rows DataFrame rows
 * @returns [result, naCount, naColumns]
 */
export const isNa = (rows) => {
    let result = [];
    let naCount = 0;
    let naColumns = {};

    for (let i in rows) {
        let rowNa = {};
        let row = rows[i];

        for (let c in row) {
            if (!(c in naColumns)) { naColumns[c] = 0; }

            let val = isNull(row[c]);
            rowNa[c] = val;
            if (val) { naCount++; naColumns[c]++; }
        }
        result.push(rowNa);
    }
    return [result, naCount, naColumns];
}

/**
 * DataFrame에서 각 요소의 갯수를 컬럼별로 세고 묶어 리턴
 * @param {*} rows DataFrame rows
 * @returns 컬럼별 요소의 사용 횟수 목록 - {column1: {a: 5, b: 3, c: 7}}
 */
export const uniqueCheck = (rows) => {
    let uniqueCheck = {}
    for (let i in rows) {
        let row = rows[i];
        for (let c in row) {
            let v = row[c];
            if (!isNull(row[c])) { // 결측값 체크 안 하게
                if (!(c in uniqueCheck)) { uniqueCheck[c] = {}; }
                if (!(v in uniqueCheck[c])) { uniqueCheck[c][v] = 0; }
                uniqueCheck[c][v] += 1;
            }
        }
    }
    return uniqueCheck;
}

/**
 * 원하는 열에 특정 조건을 만족하는 행만 추출하는 함수
 * @param {*} rows DataFrame rows
 * @param {*} column 조건을 검색할 컬럼명
 * @param {*} target 값을 비교할 조건 (값이 같다면 가져옴)
 * @returns 필터링된 rows
 */
export const getRowsWithCondition = (rows, column, target) => {
    let result = [];
    for (let i in rows) {
        let row = rows[i];
        if (row[column] == target) {
            result.push(row);
        }
    }
    return result;
}

/**
 * DataFrame에서 원하는 컬럼값만 리스트로 뽑아줌
 * @param {*} rows DataFrame rows
 * @param {*} column 원하는 컬럼명
 * @returns 컬럼값 리스트
 */
export const getColumnFromRows = (rows, column) => {
    let result = [];
    for (let i in rows) {
        let row = rows[i];
        result.push(row[column]);
    }
    return result;
}

/**
 * DataFrame의 설명을 리턴하는 함수
 * @param {*} rows DataFrame rows
 * @returns Common EDA 설명
 */
export const getCommonDatas = (rows) => {
    let columns = Object.keys(rows[0]);

    let columnCount = columns.length; // 열 수
    let rowCount = rows.length; // 행 수

    // 컬럼별 결측값 찾기
    let [na, naCount, naColumns] = isNa(rows);
    let naRatio = naCount / (rowCount * columnCount); // 전체에서 결측값의 비율

    // Unique 값 찾기
    let columnCategory = {}; // 컬럼에서 각 요소가 몇 번씩 쓰였는지 횟수
    let unique = uniqueCheck(rows); // 각 컬럼에서 한 번만 쓰인 요소들
    for (let c in unique) {
        // console.log(`checking unique of ${c}`);
        let uniqueCount = 0;
        let uniqueC = unique[c];

        let max = null;
        let min = null;

        for (let v in uniqueC) {
            if (uniqueC[v] == 1) {
                uniqueCount++;
            }

            if (max == null) { max = v; min = v; }
            if (uniqueC[v] > uniqueC[max]) {
                // console.log(`${v}(${uniqueC[v]} times used) is more used than ${max}(${uniqueC[max]} times used)`);
                max = v;
            }
            if (uniqueC[v] < uniqueC[min]) {
                // console.log(`${v}(${uniqueC[v]} times used) is less used than ${min}(${uniqueC[min]} times used)`);
                min = v;
            }
        }
        columnCategory[c] = uniqueCount;

        unique[c] = {
            min: min,
            max: max,
            minRatio: uniqueC[min] / rows.length,
            maxRatio: uniqueC[max] / rows.length
        }
    }

    return [columnCount, rowCount, naCount, naRatio, columnCategory, unique];
}