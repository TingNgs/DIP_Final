
var url;
var canvas = document.getElementById('canvas');
var ctx;
var img;
var isPress;
var old;
var eraserSize = 10;
var eraserLineSize = eraserSize * 2
var c_w;
var c_h;
var resetData;
var colorBGData;
var customBGData;
const cursor = document.querySelector('.cursor');
// Usage
getDataUri('/colorBG.jpg', function (dataUri) {
    colorBGData = dataUri;
    console.log(colorBGData)
});
document.addEventListener('mousemove', e => {
    cursor.style.top = e.clientY - eraserSize + 'px';
    cursor.style.left = e.clientX - eraserSize + 'px';
})

$("#EraserInput").change((e) => {
    eraserSize = $("#EraserInput").val();
    eraserLineSize = eraserSize * 2
    cursor.style.width = eraserSize * 2 + 'px';
    cursor.style.height = eraserSize * 2 + 'px';
})
function ResetImage() {
    img = new Image();
    img.src = resetData;// set src to file url

    img.onload = function () {
        c_w = Math.min(500, img.width);
        c_h = img.height * (c_w / img.width);
        canvas.innerHTML = ''
        canvas.width = c_w;
        canvas.height = c_h;
        ctx.drawImage(img, 0, 0, c_w, c_h);
    };
}
document.getElementById('image').addEventListener('change', function () {

    if (this.files && this.files[0]) {
        img = new Image();
        img.src = URL.createObjectURL(this.files[0]); // set src to file url
        resetData = URL.createObjectURL(this.files[0]);
        canvas.innerHTML = ''
        ctx = canvas.getContext('2d');
        img.onload = function () {
            c_w = Math.min(500, img.width);
            c_h = img.height * (c_w / img.width);

            canvas.width = c_w;
            canvas.height = c_h;
            ctx.drawImage(img, 0, 0, c_w, c_h);
        };

        isPress = false;
        old = null;
        canvas.addEventListener('mousedown', function (e) {
            isPress = true;
            old = { x: e.offsetX, y: e.offsetY };
        });
        canvas.addEventListener('mousemove', function (e) {
            if (isPress) {
                var x = e.offsetX;
                var y = e.offsetY;
                ctx.globalCompositeOperation = 'destination-out';

                ctx.beginPath();
                ctx.arc(x, y, eraserSize, 0, 2 * Math.PI);
                ctx.fill();

                ctx.lineWidth = eraserLineSize;
                ctx.beginPath();
                ctx.moveTo(old.x, old.y);
                ctx.lineTo(x, y);
                ctx.stroke();

                old = { x: x, y: y };

            }
        });
        canvas.addEventListener('mouseup', function (e) {
            isPress = false;
        });
    }
});

document.getElementById('bg_image').addEventListener('change', function () {
    if (this.files && this.files[0]) {
        img = new Image();
        getDataUri(URL.createObjectURL(this.files[0]), function (dataUri) {
            customBGData = dataUri;
            console.log(customBGData)
        });
    }
})

function ImgToSvg(toSvgCanvas, type, callback) {
    let option = 'default';
    if (type == 1) option = 'sharp';
    if (type == 2) option = 'smoothed';
    if (type == 3) option = 'grayscale';
    if (type == 4) option = 'curvy';
    var imgd = ImageTracer.getImgdata(toSvgCanvas);
    var svgstr = ImageTracer.imagedataToSVG(imgd, option);
    $("#svgcontainer").empty()
    ImageTracer.appendSVGString(svgstr, 'svgcontainer');
    callback()
}



function binary(n) {
    var threshold = 255;
    var c = document.createElement("canvas");
    c.width = c_w;
    c.height = c_h;
    var tempCtx = c.getContext("2d");
    ctx = canvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, c_w, c_h);

    for (var i = 0; i < imgData.data.length; i += 4) {

        var R = imgData.data[i]; //R(0-255)

        var G = imgData.data[i + 1]; //G(0-255)

        var B = imgData.data[i + 2]; //G(0-255)

        var Alpha = imgData.data[i + 3]; //Alpha(0-255)

        var sum = (R + G + B) / 3;

        if (sum > threshold) {

            imgData.data[i] = 255;

            imgData.data[i + 1] = 255;

            imgData.data[i + 2] = 255;

            imgData.data[i + 3] = Alpha;

        }

        else {

            imgData.data[i] = 0;

            imgData.data[i + 1] = 0;

            imgData.data[i + 2] = 0;

            imgData.data[i + 3] = Alpha;

        }

    }
    tempCtx.putImageData(imgData, 0, 0);
    ImgToSvg(c, 0, () => {
        if (n == 1) {
            ToImgMask(0)
        }
        if (n == 2) {
            ToImgMask(1)
        }
    })


}


function getDataUri(url, callback) {
    var image = new Image();

    image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0);

        // Get raw image data
        callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/png'));
    };

    image.src = url;
}



function ToImgMask(n) {
    var s = new XMLSerializer();
    paths = document.querySelectorAll('path');
    svg = document.querySelector('svg');
    svg.setAttribute('xmlns:xlink', "http://www.w3.org/1999/xlink");
    svg.innerHTML = "";
    let tempString = '<mask id="mask-path" x="0" y="0" width="1" height="1">';
    let bg = colorBGData;
    if (n == 1) bg = customBGData;
    for (let index = 0; index < paths.length; index++) {
        pathString = s.serializeToString(paths[index]);
        pathString = pathString.replace(/0,0,0/g, '255,255,255');
        tempString += pathString;
        if (index == paths.length - 1) { tempString += '</mask><image xlink:href="' + bg + '" mask="url(#mask-path)" style="position:absolute;height:' + c_h + 'px;x:-50%;"/>'; }
    }
    svg.innerHTML = tempString;
}

document.querySelector(".link-download").addEventListener("click", (evt) => {
    const svgContent = document.getElementById("svgcontainer").innerHTML,
        blob = new Blob([svgContent], {
            type: "image/svg+xml"
        }),
        url = window.URL.createObjectURL(blob),
        link = evt.target;

    link.target = "_blank";
    link.download = "Illustration.svg";
    link.href = url;
});
