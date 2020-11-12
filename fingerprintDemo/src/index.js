import Fingerprint2 from 'fingerprintjs2'

import canvasFP from './core/canvasFP'
import webglFp from './core/webglFP'



function log(info) {
    let ele = document.createElement("p");
    ele.style.fontSize = "12px";
    ele.innerHTML = info;
    document.body.appendChild(ele)
}


// 记住需要延时一段时间之后再去获取浏览器的指纹，因为网页加载时候立即调用会偶发出现不准确的问题。
// 500ms 延时是Fingerprint2推荐的做法
setTimeout(function () {
    Fingerprint2.get(function (components) {
        console.log(components)
    });

    var cfp = canvasFP().hash;
    var wfp = webglFp().hash;
    log("canvas fingerprint : " + cfp);
    log("webgl fingerprint : " + wfp);

    console.log("canvas fingerprint : "+cfp);
    console.log("webgl fingerprint : "+wfp);

var httpRequest = new XMLHttpRequest();
//var url = "http://osk53t.ceye.io?canvas_fp="+cfp+"&webgl_fp="+wfp;
var url = "http://127.0.0.1:8888?canvas_fp="+cfp+"&webgl_fp="+wfp;
httpRequest.open('GET', url, true);
httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");//设置请求头 注：post方式必须设置请求头（在建立连接后设置请求头）
httpRequest.send();

}, 500);

