
var url;
var canvas;
var ctx;
var img;
var isPress;
var old;
var eraserSize = 10;
var eraserLineSize = eraserSize * 2
var c_w;
var c_h;
const cursor = document.querySelector('.cursor');

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

document.querySelector('input[type="file"]').addEventListener('change', function () {

    if (this.files && this.files[0]) {
        img = new Image();
        img.src = URL.createObjectURL(this.files[0]); // set src to file url
        canvas = document.getElementById('canvas');
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



function ImgToSvg(toSvgCanvas, callback) {
    var imgd = ImageTracer.getImgdata(toSvgCanvas);
    var svgstr = ImageTracer.imagedataToSVG(imgd, { scale: 1 });
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
    ImgToSvg(c, () => {
        if (n == 1) {
            ToImgMask()
        }
    })


}

function ToImgMask() {
    var s = new XMLSerializer();
    paths = document.querySelectorAll('path');
    svg = document.querySelector('svg');
    svg.innerHTML = "";
    console.log(paths)
    let tempString = '<mask id="mask-path" x="0" y="0" width="1" height="1">';

    for (let index = 0; index < paths.length; index++) {
        pathString = s.serializeToString(paths[index]);
        pathString = pathString.replace(/0,0,0/g, '255,255,255');
        tempString += pathString;
        if (index == paths.length - 1) tempString += '</mask><image xlink:href="colorBG.jpg" x="0" y="0" mask="url(#mask-path)" style="object-fit: cover"/>';
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
