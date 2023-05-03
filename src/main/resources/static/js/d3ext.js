export const horizontalBar = (element, data, option) => {
    /*
        element, {
            labels: [],
            values: [],
        }, {
            color: "#FFFFFF"
        }
    */

    let d3Element = d3.select(element[0]);
    let y = data.labels;
    let x = data.values;

    let width = element.width();
    let height = element.height();

    // 스케일링
    let axisPadding = 20;
    let axisSize = 20;

    let xScale = d3.scaleLinear() // 파라미터를 넣으면 0 ~ max의 범위에서 range에 맞게 스케일해서 리턴하는 함수를 받음
        // .domain([d3.min(x), d3.max(x)])
        .domain([0, d3.max(x)])
        .range([axisPadding + axisSize, width - axisPadding]); // 시작: 패딩 + y 액시스 공간, 끝: full - 패딩

    let yScale = d3.scaleBand()
        .domain([0, y.length - 1])
        .range([axisPadding, height - axisPadding - axisSize]) // 시작: 패딩, 끝: full - 패딩 - x 액시스 공간

    // 축 생성
    let xAxisFrame = d3Element.append("g")
        .attr("transform", `translate(0, ${height - axisSize - axisPadding})`);
    let yAxisFrame = d3Element.append("g")
        .attr("transform", `translate(${axisSize + axisPadding}, 0)`);
    let xAxis = d3.axisBottom(xScale)
    let yAxis = d3.axisLeft(yScale);
    xAxis(xAxisFrame);
    yAxis(yAxisFrame);

    // 데이터 표시
    // d3Element.data(x)
    //     .enter()
    //     .append("rect")
    //     .attr("width", () => )
    //     .attr("x", axisPadding + axisSize)
    //     .attr("y", (v, i) => {})
}