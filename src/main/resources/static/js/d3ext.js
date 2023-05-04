/**
 * Math.max인데 비교해서 큰 쪽의 Alt값을 대신 리턴함
 * @param {*} a 비교할 값 a
 * @param {*} b 비교할 값 b
 * @param {*} aAlt a가 클 경우 리턴되는 Alt 값
 * @param {*} bAlt b가 클 경우 리턴되는 Alt 값
 * @returns a와 b중 더 큰 값의 Alt값
 */
const maxAlt = (a, b, aAlt, bAlt) => {
    if (a > b) {
        return aAlt;
    } else {
        return bAlt;
    }
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
     * 차트를 만듬
     * @param {*} element 차트가 생성될 svg jQuery 요소
     * @param {*} data 사용할 데이터 딕셔너리 - ex: {labels: [], values: []}
     * @param {*} option 추가 옵션 - ex: {color: "#FFFFFF"}
     */
    constructor (element, data, option) {
        this.element = element;
        this.data = data;
        this.option = option;
    }
}

// 가로 bar 차트
export class horizontalBar extends ChartBase {
    /**
     * 차트를 업데이트함
     */
    update() {
        // 값 정의
        let d3Element = d3.select(this.element[0]);
        let x = this.data.values;
        let y = this.data.labels;
        let width = this.element.width();
        let height = this.element.height();

        /**
         * 파라미터(x값)를 넣으면 0 ~ max의 범위에서 스케일링하는 함수.
         * 시작: 패딩 + y 액시스 공간, 끝: full - 패딩
         * @param {number} x 해당 값을 차트 위치 & 사이즈에 맞게 스케일링
         * @returns range에 맞게 스케일링해서 width를 리턴
         */
        let xScale = d3.scaleLinear()
        .domain([d3.min(x), d3.max(x)])
        .range([this.axisPadding + this.axisSize, width - this.axisPadding]);

        /**
         * 파라미터(y값, 라벨)을 넣으면 라벨의 순서에 따라 스케일링하는 함수.
         * 시작: 패딩, 끝: full - 패딩 - x 액시스 공간
         * @param {string} y 해당 라벨 위치를 사용해 차트 위치 & 사이즈에 맞게 스케일링
         * @returns range에 맞게 스케일링해서 y 위치를 리턴
         */
        let yScale = d3.scaleBand()
            .domain(y)
            .range([this.axisPadding, height - this.axisPadding - this.axisSize]);

        // 축 생성
        let xAxisFrame = d3Element.append("g")
            .attr("transform", `translate(0, ${height - this.axisSize - this.axisPadding})`); // 위에 생성되니까 y위치를 끝 - y 액시스 공간 - 패딩으로 설정
        let yAxisFrame = d3Element.append("g")
            .attr("transform", `translate(${this.axisSize + this.axisPadding}, 0)`); // 패딩과 액시스 사이즈 적용
        let xAxis = d3.axisBottom(xScale)
        let yAxis = d3.axisLeft(yScale);
        xAxis(xAxisFrame);
        yAxis(yAxisFrame);

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
            .attr("width", (v) => xScale(Math.abs(v)) - xZeroPoint - 1) // 각 값의 절대값(마이너스 방지)를 xScale에 돌리고 영점에 맞춤 - 겹침 방지
            .attr("height", heightResized) // height는 미리 설정한 오프셋으로 설정
            .attr("x", (v) => maxAlt(v, 0, xZeroPoint, this.axisPadding + this.axisSize) + 1) // 겹침 방지하고 양수값이면 영점값만큼 오른쪽으로 밀고, 음수값이면 패딩만큼만 밀기
            .data(y) // 이후 사용할 데이터를 y 데이터로 변경, +1하고 width에 -1한건 액시스랑 겹치지 않기 위함임
            .attr("y", (v) => yScale(v) + yOffset) // 각 라벨(v)을 yScale에 돌리고 오프셋 적용해서 y위치를 설정
            .attr("fill", color); // 색상 채움
    }

    constructor(element, data, option) {
        super(element, data, option); // ChartBase의 생성자 실행

        // 스케일링
        this.axisPadding = 20;
        this.axisSize = 20;
        this.barSize = 0.75;
        this.update();
    }
}