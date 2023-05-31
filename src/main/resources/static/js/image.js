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
                let i = y * width + x * 4;
                let pixel = {
                    r: data[i],
                    g: data[i + 1],
                    b: data[i + 2],
                    a: data[i + 3],
                    gray: Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
                };
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
}