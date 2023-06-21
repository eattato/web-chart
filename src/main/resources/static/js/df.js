export class CsvDF {
    constructor (dataframe, convert=true) {
        if (dataframe.columns && dataframe.index && dataframe.data) {
            this.columns = dataframe.columns;
            this.rows = dataframe.data;
            this.index = dataframe.index;
        } else { // d3js로 불러온거
            // this.columns = Object.keys(dataframe[0]);
            this.columns = dataframe[0];
            this.rows = dataframe.slice(1)
            this.index = [...new Array(this.rows.length)].map((v, i) => i);
        }
        this.length = this.rows.length;

        if (convert) {
            // 숫자형인 컬럼명만 수집
            let numberColumns = this.columns.reduce((arr, c) => {
                if (this.getColumnType(c) == "number") arr.push(c);
                return arr;
            }, []);
            numberColumns.forEach((c) => {
                if (this.getColumnType(c) == "number") {
                    let columnIndex = this.columns.indexOf(c);
                    let column = this.getColumn(c);
                    column = column.map((v) => v ? Number(v) : v);
                    for (let i in this.index) {
                        this.rows[i][columnIndex] = column[i];
                    }
                }
            })

            // null 처리
            this.rows = this.rows.reduce((arr, row) => {
                arr.push(Object.values(row).map((v) => typeof v == "string" && v.length == 0 ? null : v));
                return arr;
            }, []);
        }
    }

    getColumn(column) {
        let columnIndex = this.columns.indexOf(column);
        return this.rows.reduce((arr, row) => {
            arr.push(row[columnIndex]);
            return arr;
        }, []);
    }

    getColumns(columns) {
        return columns.reduce((arr, c) => {
            arr.push(this.getColumn(c));
            return arr;
        }, []);
    }

    getColumnsDF(columns) {
        let columnIndex = columns.map((v) => this.columns.indexOf(v));
        let result = this.rows.reduce((arr, row) => {
            let filteredRow = row.reduce((arr, c, i) => i in columnIndex ? [...arr, c] : arr, []);
            arr.push(filteredRow);
            return arr;
        }, [[...columns]]);
        return new CsvDF(result, false);
    }

    getRow(index) {
        return this.rows[index];
    }

    copy() {
        return new CsvDF({
            columns: [...this.columns],
            index: [...this.index],
            data: this.rows.reduce((arr, c) => [...arr, c], [])
        }, false);
    }

    isNa() {
        let result = this.copy();
        result.rows.forEach((row, i) => {
            row = row.map((v) => v == null || v == undefined ? 1 : 0);
            result.rows[i] = row;
        })
        return result;
    }

    getColumnType(column) {
        column = this.getColumn(column);
        let result = null;

        column.forEach((v) => {
            if (v) {
                if (result == null) result = typeof(v);
                if (typeof(v) != result) {
                    result = null;
                    return false;
                }
            }
        });
        return result;
    }

    getColumnValueCount(column) {
        column = this.getColumn(column);
        return column.reduce((arr, c) => {
            if (c != null) {
                if (arr[c] == null) arr[c] = 0;
                arr[c] += 1;
            }
            return arr;
        }, {});
    }

    getColumnUnique(column) { // "원본으로" 가져옴, 즉 숫자로 나오니까 band쓰려면 Object.keys(valueCount) 쓰셈
        column = this.getColumn(column);
        return column.reduce((arr, c) => {
            if (!arr.includes(c)) arr.push(c);
            return arr;
        }, []);
        // return Object.keys(this.getColumnValueCount(column));
    }
}