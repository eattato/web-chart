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
    let x = data.values;
    let y = data.labels;

    let width = element.width();
    let height = element.height();

    // 스케일링
    let axisPadding = 20;
    let axisSize = 20;
    let barSize = 0.75;

    /**
     * 파라미터(x값)를 넣으면 0 ~ max의 범위에서 스케일링하는 함수
     * 시작: 패딩 + y 액시스 공간, 끝: full - 패딩
     * @param {number} x 해당 값을 차트 위치 & 사이즈에 맞게 스케일링
     * @returns range에 맞게 스케일링해서 width를 리턴
     */
    let xScale = d3.scaleLinear()
        .domain([0, d3.max(x)])
        .range([axisPadding + axisSize, width - axisPadding]);

    /**
     * 파라미터(y값, 라벨)을 넣으면 라벨의 순서에 따라 스케일링하는 함수
     * 시작: 패딩, 끝: full - 패딩 - x 액시스 공간
     * @param {string} y 해당 라벨 위치를 사용해 차트 위치 & 사이즈에 맞게 스케일링
     * @returns range에 맞게 스케일링해서 y 위치를 리턴
     */
    let yScale = d3.scaleBand()
        .domain(y)
        .range([axisPadding, height - axisPadding - axisSize]) // 

    // 축 생성
    let xAxisFrame = d3Element.append("g")
        .attr("transform", `translate(0, ${height - axisSize - axisPadding})`); // 위에 생성되니까 y위치를 끝 - y 액시스 공간 - 패딩으로 설정
    let yAxisFrame = d3Element.append("g")
        .attr("transform", `translate(${axisSize + axisPadding}, 0)`); // 패딩과 액시스 사이즈 적용
    let xAxis = d3.axisBottom(xScale)
    let yAxis = d3.axisLeft(yScale);
    xAxis(xAxisFrame);
    yAxis(yAxisFrame);

    // 데이터 표시
    let heightResized = yScale.bandwidth() * barSize; // height는 y 스케일의 한 칸 사이즈 * bar 사이즈 배율로
    d3Element.selectAll("rect")
        .data(x) // x 데이터를 사용
        .enter()
        .append("rect") // 데이터 갯수에 맞춰 사각형 생성
        .attr("width", (v) => xScale(v) - axisPadding - axisSize) // width는 각 데이터(foreach를 통해 x의 요소인 v를 얻음) 값을 xScale에 돌린거에 왼쪽으로 민 만큼 뺌
        .attr("height", heightResized) // height는 미리 설정한 오프셋으로 설정
        .attr("x", axisPadding + axisSize) // 패딩 + 액시스 사이즈 위치만큼 왼쪽으로 밈
        .data(y) // 이후 사용할 데이터를 y 데이터로 변경
        .attr("y", (v) => yScale(v) + (yScale.bandwidth() - heightResized) / 2) // 각 라벨(v)을 yScale에 돌리고 조정된 height에 맞춰 y위치를 설정
}