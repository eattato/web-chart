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
        let lerped = Math.round(lerp(startRGB[i], endRGB[i], 1 - alpha));
        result += toHex(lerped, 2);
    }
    return result;
}

// Additional D3 Prototype Functions
/**
 * text를 사용하기 힘든 태그에 숨겨진 툴팁을 추가해주는 메소드
 * https://github.com/d3/d3-selection/blob/main/src/selection/text.js 참고
 * @param {function, string} value 실행할 함수나(매개변수 첫 칸에 현재 텍스트를 줌), 설정할 스트링을 받음
 */
d3.selection.prototype.addTooltip = function(value) {
    // this = 대상 요소들을 묶은 Selection 객체(selectAll)
    // https://github.com/d3/d3-selection/blob/main/src/selection/each.js 참고
    return this.each(function(v, i) { // callback.call(node, node.__data__, i, group), Function.prototype.call() 참고
        let tooltipText = null;
        if (typeof value == "function") tooltipText = value(v, i); // (v) => {}라면 v에 각 td
        else if (typeof value == "string") tooltipText = value;

        // 각각의 요소(td)에 툴팁을 추가
        d3.select(this)
            .bindHoverTooltip(tooltipText);
    }).selectAll(".tooltip_hidden"); // 주의: 예전 대상이 아닌 대상의 '툴팁 오브젝트'를 리턴함 - 이후 데이터 수정 불가!!
}

/**
 * 호버 툴팁 이벤트를 처리하는 함수
 * @param {*} element jQuery 오브젝트
 * @param {String} text 커스텀 JSON 툴팁 정보
 * @param {Function} callback 마우스 이벤트에 실행할 콜백, callback(act, event)로 실행됨
 */
export const hoverTooltipEvent = (element, text, callback) => {
    let tooltip = $(".tooltip_frame");
    if (!tooltip || tooltip.length == 0) {
        tooltip = $($.parseHTML('<div class="tooltip_frame"><div class="tooltip_header"><div class="tooltip_title"></div><div class="tooltip_color"></div></div><div class="tooltip_body"></div></div>'))
        tooltip.appendTo($("body"));
    }

    const updateToolip = (event) => {
        let target = $(event.target);
        let data = text ? JSON.parse(text) : JSON.parse(target.text());
        tooltip.find(".tooltip_title").text(data.label);
        tooltip.find(".tooltip_body").text(data.value);
        tooltip.find(".tooltip_color").css({"background-color": data.color});
    }

    function mouseover(event) {
        if (callback) callback("mouseover", event);
        updateToolip(event);
        tooltip.addClass("active");
    }

    function mousemove(event) {
        if (callback) callback("mousemove", event);
        let padding = 10;
        let x = event.pageY;
        let y = event.pageX;

        let tooltipWidth = y + padding + tooltip.width() + 30;
        let tooltipHeight = x + padding + tooltip.height() + 30;
        let bodyWidth = document.body.scrollWidth;
        let bodyHeight = document.body.scrollHeight;
        if (tooltipWidth > bodyWidth) y -= tooltipWidth - bodyWidth;
        if (tooltipHeight > bodyHeight) x -= tooltipHeight - bodyHeight;
        //console.log(`${x + padding}+${tooltip.height()}=${tooltipPos} ${height}`);

        tooltip.css({
            "top": `${x + padding}px`,
            "left": `${y + padding}px`
        });
        updateToolip(event);
    }

    function mouseout(event) {
        if (callback) callback("mouseout", event);
        tooltip.removeClass("active")
    }

    if (element) {
        element.on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout);
    } else {
        return [mouseover, mousemove, mouseout];
    }
}

d3.selection.prototype.bindHoverTooltip = function(text) {
    // 각 요소에 이벤트 바인딩
    this.each(function() {
        let element = $(this); // 바닐라 -> jQuery
        hoverTooltipEvent(element, text);
    });
    return this; // 본인 다시 리턴
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
            //let domain = [Math.min(d3.min(data), 0), d3.max(data)];
            let domain = [this.option.zeroPoint ? d3.min(data) : Math.min(0, d3.min(data)), d3.max(data)];
            return d3.scaleLinear().domain(domain).range(range);
        } else { // scaleBand 리턴
            return d3.scaleBand().domain(data).range(range).paddingInner(0).paddingOuter(0);
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
        range = this.option.reverse ? [range[1], range[0]] : range; // 뒤집기
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
            var words = `${v}`.split("  ");
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
        let zeroPoint = xScale(Math.min(0, d3.min(x)));
        let heightResized = yScale.bandwidth() * this.barSize;
        let yOffset = (yScale.bandwidth() - heightResized) / 2;

        let rects = d3Element.selectAll("rect")
            .data(x)
            .enter()
            .append("rect")
            .attr("width", (v) => xScale(v) - zeroPoint)
            .attr("height", heightResized) // height는 미리 설정한 오프셋으로 설정
            .attr("x", (v) => zeroPoint)
            .text((v) => JSON.stringify({
                label: this.data.name ? this.data.name : "",
                value: v,
                color: color
            }))
            .data(y)
            .attr("y", (v) => yScale(v) + yOffset)
            .attr("fill", color) // 색상 채움
            .bindHoverTooltip();

        // 영점 선 표시
        d3Element.append("line")
            .attr("stroke", "#000000")
            .attr("stroke-width", "1px")
            .style("shape-rendering", "crispEdges") // 이걸 넣어야 진짜 1px 짜리 선이 됨
            .attr("x1", xScale(0) + 1).attr("y1", yScale(y[0])) // 1번째 점(위) 그리고 좀 왼쪽에 있어서 1px 밀었음
            .attr("x2", xScale(0) + 1).attr("y2", yScale(y[y.length - 1]) + yScale.bandwidth()); // 2번째 점(밑)

        // 스택 끼우기
        if (this.data.stack) {
            let stackStartColor = this.option.stackStartColor || "#47E1A8";
            let stackEndColor = this.option.stackEndColor || "#297458";
            let stackLabels = this.data.stack.labels;

            for (let i in y) {
                let stackValues = this.data.stack.values[i];
                let stackDirection = x[i] > 0;
                let xStackOffset = 0;
                // let xStackOffset = (x[i] > 0 ? xZeroPoint : xZeroPoint - (xScale(Math.abs(x[i])) - xZeroPoint)) + 1;

                for (let j in stackLabels) {
                    let label = stackLabels[j];
                    let v = stackValues[j];
                    let alpha = j / (stackLabels.length - 1);
                    let labelColor = colorLerp(stackStartColor, stackEndColor, alpha);
                    // console.log(`${y[i]} and ${label} - ${v}, color: ${labelColor}`);

                    // 추가 스택 데이터 표시
                    let labelText = this.data.name?
                        this.data.stack.name?
                            `${this.data.name}: ${y[i]}, ${this.data.stack.name}: ${label}`:
                            `${this.data.name}: ${y[i]}, ${label}`:
                        `${y[i]}, ${label}`;

                    let width = xScale(v) - zeroPoint;
                    let stackDisplay = d3Element.append("rect")
                        .attr("width", width) // 각 값의 절대값(마이너스 방지)를 xScale에 돌리고 영점에 맞춤 - 겹침 방지
                        .attr("height", heightResized) // height는 미리 설정한 오프셋으로 설정
                        .attr("x", zeroPoint + xStackOffset) // 겹침 방지하고 양수값이면 영점값만큼 오른쪽으로 밀고, 음수값이면 영점값 - 본인 width만큼 밀기
                        .attr("y", yScale(y[i]) + yOffset) // 각 라벨(v)을 yScale에 돌리고 오프셋 적용해서 y위치를 설정
                        .attr("fill", labelColor) // 색상 채움
                        .text(JSON.stringify({
                            label: labelText,
                            value: `${v} / ${x[i]} (${(v / x[i] * 100).toFixed(2)}%)`,
                            color: labelColor
                        }))
                        .bindHoverTooltip();
                    xStackOffset += stackDirection * width;
                }
            }
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

// 세로 bar 차트
export class verticalBar extends ChartBase {
    /**
     * 차트를 업데이트함
     */
    update() {
        // 값 정의
        let x = this.data.values;
        let y = this.data.labels;
        let [d3Element, width, height, xScale, yScale] = this.getBase(y, x);

        // 축 생성
        let mergedGrid = null;
        if (this.option.mergeLabel && this.option.mergeLabel.whenOver < y.length) {
            mergedGrid = [];
            let labelMin = Math.min(...y);
            let labelMax = Math.max(...y);
            for (let i = 0; i < this.option.mergeLabel.to - 1; i++) {
                //let label = (labelMin + (labelMax - labelMin) / this.option.mergeLabel.to * i).toFixed(1);
                let label = labelMin + (labelMax - labelMin) / this.option.mergeLabel.to * i;
                mergedGrid.push(label);
            }
            mergedGrid.push(labelMax);

            //mergedGrid = mergedGrid.map((v) => `${v}`);
            mergedGrid = this.getScaleX(mergedGrid, width);
        }
        this.createAxis(d3Element, height, !mergedGrid ? xScale : mergedGrid, yScale, mergedGrid);

        // 옵션 추출
        let color = (this.option && this.option.color) || "#47E1A8"; // option.color가 null이면 기본 컬러 사용

        // 데이터 표시
        let widthResized = xScale.bandwidth() * this.barSize;
        let xOffset = (xScale.bandwidth() - widthResized) / 2;

        // (v) => {return ~} 또는 (v) => ~를 통해 현재 사용하는 데이터를 foreach해 적용할 수 있음.
        let xMax = d3.max(x);
        let zeroPoint = yScale(Math.min(0, d3.min(x)));
        let rects = d3Element.selectAll("rect")
            .data(x) // x 데이터를 사용
            .enter()
            .append("rect") // 데이터 갯수에 맞춰 사각형 생성
            .attr("width", widthResized)
            .attr("height", (v) => zeroPoint - yScale(v))
            .attr("y", (v) => yScale(v)) // 음수면 양수랑 같은 상태에서 자기 height만큼 내림
            //.attr("height", (v) => yScale(xMax - v) - zeroPoint)
            //.attr("y", (v) => yScale(v))
            .text((v, i) => JSON.stringify({
                label: this.data.name ? `${this.data.name}: ${y[i]}` : `${y[i]}`,
                value: v,
                color: color
            }))
            .data(y) // 이후 사용할 데이터를 y 데이터로 변경
            .attr("x", (v) => xScale(v) + xOffset)
            .attr("fill", color) // 색상 채움
            .bindHoverTooltip();

        // 영점 선 표시
        // d3Element.append("line")
        //     .attr("stroke", "#000000")
        //     .attr("stroke-width", "1px")
        //     .style("shape-rendering", "crispEdges") // 이걸 넣어야 진짜 1px 짜리 선이 됨
        //     .attr("x1", xScale(y[0])).attr("y1", yScale(0)) // 1번째 점(위) 그리고 좀 왼쪽에 있어서 1px 밀었음
        //     .attr("x2", xScale(y[y.length - 1]) + xScale.bandwidth()).attr("y2", yScale(0)); // 2번째 점(밑)
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
                let color = colorLerp(startColor, endColor, alpha);
                // console.log(`v: ${v}, x: ${yx}, y: ${yy}, alpha: ${alpha}`);
                
                let map = d3Element.append("rect")
                    .attr("width", xScale.bandwidth())
                    .attr("height", yScale.bandwidth())
                    .attr("x", xScale(yx) + 1)
                    .attr("y", yScale(yy) - 1)
                    .attr("fill", color)
                    .text(JSON.stringify({
                        label: y.xLabel && y.yLabel ? `${y.yLabel}: ${yy}, ${y.xLabel}: ${yx}` : `${yy}, ${yx}`,
                        color: color,
                        value: y.valueLabel ? `${y.valueLabel}: ${v}` : v
                    }))
                    .bindHoverTooltip();
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

        let xAlt;
        if (typeof x[0] != "object") x = [x]; // 1차원이라면(solo column) 그냥 2차원으로 감쌈
        xAlt = x.reduce((arr, c) => arr.concat(c), []); // 모든 컬럼 데이터 병합
        xAlt = [Math.min(...xAlt), Math.max(...xAlt)]; // 모든 컬럼 데이터의 최소값, 최대값

        let [d3Element, width, height, xScale, yScale] = this.getBase(y, xAlt); // x랑 y 뒤바꿈(x가 세로, y가 가로)

        // 축 생성
        this.createAxis(d3Element, height, xScale, yScale);

        // 데이터 표시
        for (let i in x) {
            let points = x[i];

            let line = d3.line()
                .x((v, i) => xScale(y[i]))
                .y((v, i) => yScale(v))

            d3Element.append("path")
                .attr("d", line(points))
                .attr("fill", "none")
                .attr("stroke", this.option.colors ? this.option.colors[i] : "#47E1A8")
                .attr("stroke-width", "1px");
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

// 테이블
export class table extends ChartBase {
    /**
     * 차트를 업데이트함
     */
    update() {
        // 값 정의
        let x = this.data.values;
        let y = this.data.labels;
        y.x.unshift("");
        let [d3Element, width, height, xScale, yScale] = this.getBase(y.x, y.y);

        // 데이터 표시
        let table = d3Element.append("table");
        let thead = table.append("thead");
        let tbody = table.append("tbody");

        thead.append("tr")
            .selectAll("th")
            .data(y.x)
            .enter()
            .append("th")
            .text(v => v)

        let tr = tbody.selectAll("tr")
            .data(x)
            .enter()
            .append("tr")
            .each(function (v, ri) {
                d3.select(this)
                    .selectAll("td")
                    .data(x[ri])
                    .enter()
                    .append("td")
                    .text(v => v)
                    .addTooltip((v, i) => JSON.stringify({
                        label: `${y.x[i + 1]}, ${y.y[ri]}`,
                        color: "black",
                        value: v
                    }));
            })

        let ind = 0;
        for (let c in y.y) {
            let targetRow = tr.filter((v, i) => i == ind);
            targetRow.insert("th", ":first-child").text(y.y[c]);
            ind++;
        }
    }

    constructor(element, data, option) {
        if (element.prop("tagName") == "svg") {
            let newBody = $($.parseHTML('<div class="chart_body"></div>'));
            newBody.appendTo(element.parent());
            element.remove();
            element = newBody;
        }

        if (!option) {option = {}}
        option.xAxis = false;
        option.yAxis = false;
        super(element, data, option); // ChartBase의 생성자 실행

        // 스케일링
        this.barSize = option.barSize || 0.75;
        this.update();
    }
}

// 스캐터
export class scatter extends ChartBase {
    /**
     * 차트를 업데이트함
     */
    update() {
        // 값 정의
        let x = this.data.values;
        let y = this.data.labels;

        let scatterX = [];
        let scatterY = [];
        for (let i in x) {
            scatterX.push(x[i][0]);
            scatterY.push(x[i][1]);
        }
        // console.log(scatterX);
        // console.log(scatterY);

        this.option.zeroPoint = true;
        let [d3Element, width, height, xScale, yScale] = this.getBase(scatterX, scatterY);

        // 축 생성
        this.createAxis(d3Element, height, xScale, yScale);

        // 옵션 추출
        let color = (this.option && this.option.color) || "#47E1A8"; // option.color가 null이면 기본 컬러 사용
        let radius = (this.option && this.option.radius) || 3;

        // 데이터 표시
        let dots = d3Element.selectAll("circle")
            .data(scatterX)
            .enter()
            .append("circle")
            .attr("cx", v => xScale(v))
            .data(scatterY)
            .attr("cy", v => yScale(v))
            .attr("r", radius)
            .attr("fill", color)
            .data(x)
            .text((v) => JSON.stringify({
                label: `${y.x}: ${v[0]}, ${y.y}: ${v[1]}`,
                value: "",
                color: color
            }))
            .bindHoverTooltip();
    }

    /**
     * 스캐터 플롯을 띄움
     * @param {*} data [ [1, 2], [3.14, 15.92], [12, 21] ] x,y 들어간 2차원 형태로
     */
    constructor(element, data, option) {
        if (!option) {option = {}}
        super(element, data, option); // ChartBase의 생성자 실행

        // 스케일링
        this.barSize = option.barSize || 0.75;
        this.update();
    }
}