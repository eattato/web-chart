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

export const ImageData = class {
    constructor(url) {
        this.width = 0;
        this.height = 0;

        this.onload = this.readImage(url)
        .then(([pixels, width, height]) => {
            this.pixels = pixels;
            this.width = width;
            this.height = height;
        });
    }

    /**
     * 1차원 픽셀 데이터를 2차원 딕셔너리 배열 형태로 변환해줌
     * @param {[Number]} data 1차원 픽셀 데이터
     * @returns {*} [ [{r: 0, g: 0: b: 0, a: 0, gray: 0}], [].. ] 형태의 2차원 배열
     */
    pixelsFullChannel(data, width, height) {
        let result = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                let i = y * (width * 4) + (x * 4); // x한칸에 4개(rgba), 한 줄에 4 * width개
                let pixel = {
                    r: data[i],
                    g: data[i + 1],
                    b: data[i + 2],
                    a: data[i + 3],
                    gray: Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
                };
                // console.log(`x: ${x}, y: ${y}, got ${i} ~ ${i + 3}`);
                row.push(pixel);
            }
            result.push(row);
        }
        return result;
    }

    /**
     * URL로부터 이미지의 픽셀 데이터를 읽어줌
     * @param {*} url 읽은 이미지 URL
     * @returns {Promise} 픽셀 데이터를 리턴하는 Promise 객체
     */
    readImage(url) {
        let img = document.createElement("img")
        img.src = url;

        return new Promise((resolve, reject) => {
            img.onload = () => {
                let canvas = document.createElement("canvas");
                let context = canvas.getContext("2d");
                context.drawImage(img, 0, 0, img.width, img.height);
    
                let pixels = context.getImageData(0, 0, img.width, img.height).data;
                // console.log(`raw length: ${pixels.length}`);
                pixels = this.pixelsFullChannel(pixels, img.width, img.height);
                resolve([pixels, img.width, img.height]);
            };
        })
    }

    /**
     * 픽셀 데이터에서 각 채널 데이터를 분리함
     * @param {*} pixels 픽셀 데이터
     * @returns {*} {r: [], g: [], b:[]} 형태의 분리된 채널 데이터
     */
    getRGB(pixels) {
        let result = {r: [], g: [], b: [], a:[], gray: []};
        for (let c = 0; c < this.height; c++) {
            for (let r = 0; r < this.width; r++) {
                let pixel = this.pixels[c][r];
                for (let channel in pixel) {
                    result[channel].push(pixel[channel]);
                }
            }
        }
        return result;
    }

    /**
     * 대상 캔버스에 현재 이미지를 그려줌
     * @param {Object} canvas 이미지를 그릴 캔버스
     * @param {String} channel 원하는 채널, 예시로 RGB, GRAY 또는 원하는 채널을 순서에 따라 쓸 수 있음. default = RGB
     */
    drawOnCanvas(canvas, channel = "RGB") {
        let context = canvas.getContext("2d");
        for (let c = 0; c < this.height; c++) {
            for (let r = 0; r < this.width; r++) {
                let pixel = this.pixels[c][r];
                
                let color = "#";
                if (channel != "GRAY") {
                    for (let i = 0; i < 3; i++) {
                        let tc = channel.charAt(i); // targetChannel
                        tc = tc.length == 0 || tc == " " ? null : tc.toLowerCase();
                        color += tc ? toHex(pixel[tc], 2) : "00";
                    }
                } else {
                    let value = toHex(pixel.gray, 2);
                    for (let i = 0; i < 3; i++) color += value;
                }

                context.fillStyle = color;
                context.fillRect(r, c, 1, 1);
            }
        }
    }
}