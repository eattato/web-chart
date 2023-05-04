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
    if (start > end) {
        let temp = start;
        start = end
        end = temp;
    }
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
     * @returns [d3Element, x, y, width, height]
    */
    getBase() {
        let d3Element = d3.select(this.element[0]);
        let x = this.data.values;
        let y = this.data.labels;
        let width = this.element.width();
        let height = this.element.height();
        return [d3Element, x, y, width, height]
    }

    /**
     * @param {*} x x 데이터 전체
     * @param {*} width 차트 가로 사이즈
     * @returns 파라미터에 따른 xScale
     */    
    getScaleLinearX(x, width) {
        /**
         * 파라미터(x값)를 넣으면 0||min ~ max의 범위에서 스케일링하는 함수.
         * 시작: 패딩 + y 액시스 공간, 끝: full - 패딩
         * @param {number} x 해당 값을 차트 위치 & 사이즈에 맞게 스케일링
         * @returns range에 맞게 스케일링해서 width를 리턴
         */
        let xScale = d3.scaleLinear()
        .domain([Math.min(d3.min(x), 0), d3.max(x)])
        .range([this.paddingX + this.axisSize, width - this.paddingX]);

        return xScale;
    }

    /**
     * @param {*} x x 데이터 전체
     * @param {*} width 차트 가로 사이즈
     * @returns 파라미터에 따른 xScale
     */    
    getScaleBandX(x, width) {
        /**
         * 파라미터(x값, 라벨)을 넣으면 라벨의 순서에 따라 스케일링하는 함수.
         * 시작: 패딩 + y 액시스 공간, 끝: full - 패딩
         * @param {string} x 해당 라벨 위치를 사용해 차트 위치 & 사이즈에 맞게 스케일링
         * @returns range에 맞게 스케일링해서 y 위치를 리턴
         */
        let xScale = d3.scaleBand()
        .domain(x)
        .range([this.paddingX + this.axisSize, width - this.paddingX]);

        return xScale;
    }

    /**
     * @param {*} y y 데이터 전체
     * @param {*} height 차트 세로 사이즈
     * @returns 파라미터에 따른 yScale
     */    
    getScaleLinearY(y, height) {
        /**
         * 파라미터(y값)를 넣으면 0||min ~ max의 범위에서 스케일링하는 함수.
         * 시작: 패딩, 끝: full - 패딩 - x 액시스 공간
         * @param {number} y 해당 값을 차트 위치 & 사이즈에 맞게 스케일링
         * @returns range에 맞게 스케일링해서 height를 리턴
         */
        let yScale = d3.scaleLinear()
        .domain([Math.min(d3.min(y), 0), d3.max(y)])
        .range([this.paddingY, height - this.paddingY - this.axisSize]);

        return yScale;
    }

    /**
     * @param {*} y y 데이터 전체
     * @param {*} height 차트 세로 사이즈
     * @returns 파라미터에 따른 yScale
     */
    getScaleBandY(y, height) {
        /**
         * 파라미터(y값, 라벨)을 넣으면 라벨의 순서에 따라 스케일링하는 함수.
         * 시작: 패딩, 끝: full - 패딩 - x 액시스 공간
         * @param {string} y 해당 라벨 위치를 사용해 차트 위치 & 사이즈에 맞게 스케일링
         * @returns range에 맞게 스케일링해서 y 위치를 리턴
         */
        let yScale = d3.scaleBand()
            .domain(y)
            .range([this.paddingY, height - this.paddingY - this.axisSize]);

        return yScale;
    }

    /** 
     * x, y 액시스를 그려줌
     * @param {d3Element} d3Element 액시스를 그릴 대상 d3 요소
     * @param {number} height 대상 세로 넓이
     * @param {xScale} xScale 기준 xScale
     * @param {yScale} yScale 기준 yScale
     */
    createAxis(d3Element, height, xScale, yScale) {
        let xAxisFrame = d3Element.append("g")
            .attr("transform", `translate(0, ${height - this.axisSize - this.paddingY})`); // 위에 생성되니까 y위치를 끝 - y 액시스 공간 - 패딩으로 설정
        let yAxisFrame = d3Element.append("g")
            .attr("transform", `translate(${this.axisSize + this.paddingX}, 0)`); // 패딩과 액시스 사이즈 적용
        let xAxis = d3.axisBottom(xScale)
        let yAxis = d3.axisLeft(yScale);
        xAxis(xAxisFrame);
        yAxis(yAxisFrame);
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
        let [d3Element, x, y, width, height] = this.getBase();
        let xScale = this.getScaleLinearX(x, width);
        let yScale = this.getScaleBandY(y, height);

        // 축 생성
        this.createAxis(d3Element, height, xScale, yScale);

        // 옵션 추출
        if (!this.option) { this.option = {}; } // option이 null인데 액세스하려고 할 때 에러 막는 용도
        let color = this.option.color || "#47E1A8"; // option.color가 null이면 기본 컬러 사용

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
        let [d3Element, x, y, width, height] = this.getBase();
        let xScale = this.getScaleBandX(y.x, width);
        let yScale = this.getScaleBandY(y.y, height);

        // 축 생성
        this.createAxis(d3Element, height, xScale, yScale);

        // 옵션 추출
        if (!this.option) { this.option = {}; } // option이 null인데 액세스하려고 할 때 에러 막는 용도
        let startColor = this.option.startColor || "#FFFF00";
        let endColor = this.option.endColor || "#FF0000";

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