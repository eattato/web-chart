/**
 * Math.max인데 비교해서 큰 쪽의 Alt값을 대신 리턴함
 * @param {*} a 비교할 값 a
 * @param {*} b 비교할 값 b
 * @param {*} aAlt a가 클 경우 리턴되는 Alt 값
 * @param {*} bAlt b가 클 경우 리턴되는 Alt 값
 * @returns a와 b중 더 큰 값의 Alt값
 */
const maxAlt = (a, b, aAlt, bAlt) => {
    if (a >= b) {
        return aAlt;
    } else {
        return bAlt;
    }
}

const clamp = (min, val, max) => {
    if (val < min) {
        return min;
    } else if (max && val > max) {
        return max;
    } else {
        return val;
    }
}

const hex = (x) => {
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

const toHex = (x, formatLength) => {
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

const lerp = (start, end, alpha) => {
    // if (start > end) {
    //     let temp = start;
    //     start = end
    //     end = temp;
    // }
    return end - (end - start) * alpha;
}

/**
 * 시작, 끝, 변환값(alpha)를 통해 색의 중간값을 얻음
 * @param {string} start 시작이 되는 16진수 색
 * @param {string} end 끝이 되는 16진수 색
 * @param {number} alpha 알파값
 * @returns 중간색
 */
const colorLerp = (start, end, alpha) => {
    let startRGB = [hex(start.substring(1, 3)), hex(start.substring(3, 5)), hex(start.substring(5, 7))];
    let endRGB = [hex(end.substring(1, 3)), hex(end.substring(3, 5)), hex(end.substring(5, 7))];

    let result = "#";
    for (let i in startRGB) {
        let lerped = Math.round(lerp(startRGB[i], endRGB[i], alpha));
        result += toHex(lerped, 2);
    }
    return result;
}

// 차트 베이스
class ChartBase {
    /**
     * 그냥 말 그대로 차트를 날려버림
     */
    destroy() {
        this.element.empty();
    }

    /** 
     * 차트 기본 정보 및 요소를 제공
     * @param {*} x x축이 될 데이터 또는 라벨 값
     * @param {*} y y축이 될 데이터 또는 라벨 값
     * @returns [d3Element, width, height, xScale, yScale]
    */
    getBase(x, y) {
        let d3Element = d3.select(this.element[0]);
        let width = this.element.width();
        let height = this.element.height();

        let xScale = this.getScaleX(x, width);
        let yScale = this.getScaleY(y, height);
        return [d3Element, width, height, xScale, yScale];
    }

    /**
     * 데이터 자료형에 따라서 scaleLinear 또는 scaleBand 리턴
     * @param {*} data 대상 데이터
     * @param {*} range 차트 사이즈
     * @returns scaleLinear 또는 scaleBand
     */
    getScale(data, range) {
        let firstKey = Object.keys(data)[0];
        if (typeof data[firstKey] == "number") { // scaleLinear 리턴
            // data내에서 최소값, 최대값을 가진 리스트. 이 때 최소값이 양수라면 대신 0부터 시작한다.
            let domain = [Math.min(d3.min(data), 0), d3.max(data)];
            return d3.scaleLinear().domain(domain).range(range);
        } else { // scaleBand 리턴
            return d3.scaleBand().domain(data).range(range);
        }
    }

    /**
     * 데이터 자료형에 따라서 차트 사이즈에 맞는 x축 스케일링 함수 리턴
     * @param {*} data 사용할 데이터
     * @param {number} width 차트 width
     * @returns x축 스케일링 함수
     */
    getScaleX(data, width) {
        let hasYaxis = (this.option.yAxis == null || this.option.yAxis == true)
        let range = [this.paddingX + (hasYaxis ? this.axisSize : 0), width - this.paddingX];
        return this.getScale(data, range);
    }

    /**
     * 데이터 자료형에 따라서 차트 사이즈에 맞는 y축 스케일링 함수 리턴
     * @param {*} data 사용할 데이터
     * @param {number} height 차트 height
     * @returns x축 스케일링 함수
     */
    getScaleY(data, height) {
        let hasXaxis = (this.option.xAxis == null || this.option.xAxis == true)
        let range = [this.paddingY, height - this.paddingY - (hasXaxis ? this.axisSize : 0)];
        return this.getScale(data, range);
    }

    /** 
     * x, y 액시스를 그려줌
     * @param {d3Element} d3Element 액시스를 그릴 대상 d3 요소
     * @param {number} height 대상 세로 넓이
     * @param {xScale} xScale 기준 xScale
     * @param {yScale} yScale 기준 yScale
     */
    createAxis(d3Element, height, xScale, yScale) {
        var insertLinebreaks = function (v) {
            var el = d3.select(this);
            var words = `${v}`.split("\n");
            el.text("");
        
            for (var i = 0; i < words.length; i++) {
                var tspan = el.append("tspan").text(words[i]);
                if (i > 0)
                    tspan.attr("x", 0).attr("dy", "15");
            }
        };

        if (this.option.xAxis == undefined || this.option.xAxis) {
            let xAxisFrame = d3Element.append("g")
                .attr("transform", `translate(0, ${height - this.axisSize - this.paddingY})`); // 위에 생성되니까 y위치를 끝 - y 액시스 공간 - 패딩으로 설정
            let xAxis = d3.axisBottom(xScale)
            xAxis(xAxisFrame);

            xAxisFrame.selectAll("text").each(insertLinebreaks)
        }

        if (this.option.yAxis == undefined || this.option.yAxis) {
            let yAxisFrame = d3Element.append("g")
                .attr("transform", `translate(${this.axisSize + this.paddingX}, 0)`); // 패딩과 액시스 사이즈 적용
            let yAxis = d3.axisLeft(yScale);
            yAxis(yAxisFrame);

            // yAxisFrame.selectAll("text").each(insertLinebreaks)
        }
    }

    /**
     * 차트를 만듬
     * @param {*} element 차트가 생성될 svg jQuery 요소
     * @param {*} data 사용할 데이터 딕셔너리 - ex: {labels: [], values: []}
     * @param {*} option 추가 옵션 - ex: {color: "#FFFFFF"}
     */
    constructor (element, data, option) {
        this.element = element;
        this.data = data;
        this.option = option;

        // 스케일링
        this.paddingX = option.paddingX || 20;
        this.paddingY = option.paddingY || 20;
        this.axisSize = option.axisSize || 20;
    }
}

// 가로 bar 차트
export class horizontalBar extends ChartBase {
    /**
     * 차트를 업데이트함
     */
    update() {
        // 값 정의
        let x = this.data.values;
        let y = this.data.labels;
        let [d3Element, width, height, xScale, yScale] = this.getBase(x, y);

        // 축 생성
        this.createAxis(d3Element, height, xScale, yScale);

        // 옵션 추출
        let color = (this.option && this.option.color) || "#47E1A8"; // option.color가 null이면 기본 컬러 사용

        // 데이터 표시
        let xZeroPoint = xScale(0); // x축 영점 크기, xScale를 거쳤다와서 패딩이 적용되어 있음
        let heightResized = yScale.bandwidth() * this.barSize; // height는 y 스케일의 한 칸 사이즈 * bar 사이즈 배율로
        let yOffset = (yScale.bandwidth() - heightResized) / 2; // 조정된 height의 작아진 크기의 반절을 빼서 오프셋 만듬

        // (v) => {return ~} 또는 (v) => ~를 통해 현재 사용하는 데이터를 foreach해 적용할 수 있음.
        d3Element.selectAll("rect")
            .data(x) // x 데이터를 사용
            .enter()
            .append("rect") // 데이터 갯수에 맞춰 사각형 생성
            .attr("width", (v) => clamp(0, xScale(Math.abs(v)) - xZeroPoint - 1)) // 각 값의 절대값(마이너스 방지)를 xScale에 돌리고 영점에 맞춤 - 겹침 방지
            .attr("height", heightResized) // height는 미리 설정한 오프셋으로 설정
            .attr("x", (v) => maxAlt(v, 0, xZeroPoint, xZeroPoint - (xScale(Math.abs(v)) - xZeroPoint)) + 1) // 겹침 방지하고 양수값이면 영점값만큼 오른쪽으로 밀고, 음수값이면 영점값 - 본인 width만큼 밀기
            .data(y) // 이후 사용할 데이터를 y 데이터로 변경, +1하고 width에 -1한건 액시스랑 겹치지 않기 위함임
            .attr("y", (v) => yScale(v) + yOffset) // 각 라벨(v)을 yScale에 돌리고 오프셋 적용해서 y위치를 설정
            .attr("fill", color); // 색상 채움

        // 영점 선 표시
        d3Element.append("line")
            .attr("stroke", "#000000")
            .attr("stroke-width", "1px")
            .style("shape-rendering", "crispEdges") // 이걸 넣어야 진짜 1px 짜리 선이 됨
            .attr("x1", xScale(0) + 1).attr("y1", yScale(y[0])) // 1번째 점(위) 그리고 좀 왼쪽에 있어서 1px 밀었음
            .attr("x2", xScale(0) + 1).attr("y2", yScale(y[y.length - 1]) + yScale.bandwidth()); // 2번째 점(밑)
    }

    constructor(element, data, option) {
        if (!option) {option = {}}
        super(element, data, option); // ChartBase의 생성자 실행

        // 스케일링
        this.barSize = option.barSize || 0.75;
        this.update();
    }
}

// 히트맵
export class heatmap extends ChartBase {
    /**
     * 차트를 업데이트함
     */
    update() {
        // 값 정의
        let x = this.data.values;
        let y = this.data.labels;
        let [d3Element, width, height, xScale, yScale] = this.getBase(y.x, y.y);

        // 축 생성
        this.createAxis(d3Element, height, xScale, yScale);

        // 옵션 추출
        let startColor = (this.option && this.option.startColor) || "#FFFF00";
        let endColor = (this.option && this.option.endColor) || "#FF0000";

        // 최대값, 최소값 찾기
        let vMin = null, vMax = null;
        for (let c in x) {
            let row = x[c];
            for (let r in row) {
                let v = row[r];
                if (vMin == null && vMax == null) {
                    vMin = v;
                    vMax = v;
                } else {
                    vMin = Math.min(vMin, v);
                    vMax = Math.max(vMax, v);
                }
            }
        }

        // 데이터 표시
        for (let c in x) {
            let row = x[c];
            for (let r in row) {
                let v = row[r]; // 실제 데이터
                let yx = y.x[r]; // x축 라벨
                let yy = y.y[c]; // y축 라벨
                let alpha = (v - vMin) / (vMax - vMin) // (v / vMax) 인데 모두 vMin을 뺀 상태
                // console.log(`v: ${v}, x: ${yx}, y: ${yy}, alpha: ${alpha}`);
                
                d3Element.append("rect")
                    .attr("width", xScale.bandwidth())
                    .attr("height", yScale.bandwidth())
                    .attr("x", xScale(yx) + 1)
                    .attr("y", yScale(yy) - 1)
                    .attr("fill", colorLerp(startColor, endColor, alpha));
            }
        }
    }

    /**
     * 히트맵을 만듬. 데이터 형식 조금 다름.
     * @param {*} data ex: {labels: {x: ["1월", "5월", "8월"], y: ["a", "b", "c"]}, values: [ [10, 9, 12], [20, 18, 24], [32, 28, 34] ]}
     * @param {*} option 
     */
    constructor(element, data, option) {
        if (!option) {option = {}}
        super(element, data, option); // ChartBase의 생성자 실행

        // 스케일링
        this.barSize = option.barSize || 0.75;
        this.update();
    }
}

// 꺾은선
export class line extends ChartBase {
    /**
     * 차트를 업데이트함
     */
    update() {
        // 값 정의
        let x = this.data.values;
        let y = this.data.labels;

        let xAlt = x;
        if (typeof xAlt[0] == "object") { // x의 요소가 배열이라면 - {values: [[1, 2, 3], [3, 2, 1]]} 형태
            let max = 0;
            for (let i in xAlt) {
                let oldMax = d3.max(xAlt[max]);
                let current = d3.max(xAlt[i]);
                if (current > oldMax) {
                    max = i;
                }
            }
            xAlt = xAlt[max];
        }

        let [d3Element, width, height, xScale, yScale] = this.getBase(y, xAlt); // x랑 y 뒤바꿈(x가 세로, y가 가로)

        // 축 생성
        this.createAxis(d3Element, height, xScale, yScale);

        // 옵션 추출
        let color = (this.option && this.option.color) || "#47E1A8"; // option.color가 null이면 기본 컬러 사용
            // .attr("x1", xScale(0) + 1).attr("y1", yScale(y[0])) // 1번째 점(위) 그리고 좀 왼쪽에 있어서 1px 밀었음
            // .attr("x2", xScale(0) + 1).attr("y2", yScale(y[y.length - 1]) + yScale.bandwidth()); // 2번째 점(밑)

        // 데이터 표시
        xAlt = x;
        if (typeof xAlt[0] != "object") { xAlt = [xAlt]; } // 여러 컬럼 처리를 위해 배열로 감쌈

        for (let i in xAlt) {
            let x = xAlt[i];
            d3Element.selectAll("line")
                .data(x)
                .enter()
                .append("line")
                .attr("stroke", "#000000")
                .attr("stroke-width", "1px")
                .style("shape-rendering", "crispEdges")
                .attr("y1", v => yScale(v))
                .attr("y2", (v, i) => { let target = y[max(i + 1, y.length)]; return yScale(target); })
                .data(y)
                .attr("x1", v => xScale(v))
                .attr("x2", (v, i) => { let target = x[max(i + 1, x.length)]; return xScale(target); })
        }
    }

    constructor(element, data, option) {
        if (!option) {option = {}}
        super(element, data, option); // ChartBase의 생성자 실행

        // 스케일링
        this.barSize = option.barSize || 0.75;
        this.update();
    }
}