// config.js — Captcha Solver Pro (inline, không phá layout)
(function(){
  var APIKEY = "7354dfda0562f14700d36f923868d5e7";
  var API_URL = "https://anticaptcha.top/api/captcha";

  function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }

  async function getBase64(img){
    if(!img) return null;
    if(img.src.startsWith("data:")) return img.src;
    try{
      var res=await fetch(img.src), blob=await res.blob();
      return await new Promise(function(r){var fr=new FileReader();fr.onloadend=function(){r(fr.result);};fr.readAsDataURL(blob);});
    }catch(e){}
    try{
      var c=document.createElement("canvas");
      c.width=img.naturalWidth||120; c.height=img.naturalHeight||40;
      c.getContext("2d").drawImage(img,0,0); return c.toDataURL("image/png");
    }catch(e){}
    return null;
  }

  async function callApi(base64, type){
    type=type||(base64.includes("svg+xml")?18:14);
    var res=await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({apikey:APIKEY,type:type,img:base64})
    });
    var d=await res.json();
    if(d.success&&(d.captcha||d.result)) return d.captcha||d.result;
    throw new Error(d.message||"API lỗi");
  }

  async function fillInput(el,value){
    if(!el) return;
    var ns=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value");
    ns=ns&&ns.set;
    function sv(v){ if(ns) ns.call(el,v); else el.value=v; }
    sv(""); el.dispatchEvent(new Event("input",{bubbles:true}));
    await sleep(50);
    for(var i=0;i<value.length;i++){
      sv(el.value+value[i]);
      el.dispatchEvent(new Event("input",{bubbles:true}));
      await sleep(35);
    }
  }

  async function solveAuto(){
    var inp = document.querySelector('input[formcontrolname="checkCode"]')
           || document.querySelector('input[ng-model*="code"]');
    if(!inp) return {ok:false, msg:"Không tìm thấy input"};

    await sleep(300);

    var img = document.querySelector('img[src^="data:image"]')
           || document.querySelector('img.codeImage')
           || document.querySelector('img.catchat_pic')
           || document.querySelector('#captcha-image')
           || document.querySelector('img[src*="captcha"]')
           || document.querySelector('img[src*="kaptcha"]')
           || document.querySelector('img[src*="vcode"]');

    if(!img){
      var parent = inp.closest('form') || inp.parentElement;
      if(parent) img = parent.querySelector('img');
    }
    if(!img){
      img = Array.from(document.querySelectorAll("img")).find(function(e){
        var w=e.naturalWidth||e.offsetWidth, h=e.naturalHeight||e.offsetHeight;
        return w>50&&w<280&&h>20&&h<100;
      });
    }

    if(!img) return {ok:false, msg:"Không tìm thấy ảnh captcha"};

    try{
      var b64 = await getBase64(img);
      if(!b64) return {ok:false, msg:"Không lấy được ảnh"};
      var raw = b64.includes(",") ? b64.split(",")[1] : b64;
      var type = b64.includes("svg+xml") ? 18 : 14;
      var r = await callApi(raw, type);
      await fillInput(inp, r);
      return {ok:true, result:r};
    }catch(e){
      return {ok:false, msg:e.message};
    }
  }

  // ===== CHÈN NÚT =====
  if(document.getElementById("__csp_btn__")) return;

  var inp = document.querySelector('input[formcontrolname="checkCode"]')
         || document.querySelector('input[ng-model*="code"]');
  if(!inp) return;

  var BTN = document.createElement("button");
  BTN.id = "__csp_btn__";
  BTN.type = "button";
  BTN.textContent = "⚡ Tự động nhận diện";
  BTN.style.cssText =
    "all:unset;display:block;box-sizing:border-box;"+
    "width:100%;margin-top:6px;padding:7px 0;"+
    "background:rgba(0,200,100,0.15);border:1px solid rgba(0,200,100,0.5);"+
    "border-radius:6px;color:#00aa55;font-size:13px;font-weight:bold;"+
    "font-family:monospace;text-align:center;white-space:nowrap;cursor:pointer;"+
    "transition:opacity .2s;";

  BTN.addEventListener("click", async function(){
    BTN.disabled = true;
    BTN.textContent = "⏳ Đang giải…";
    BTN.style.opacity = "0.6";

    var result;
    try{ result = await solveAuto(); }
    catch(e){ result = {ok:false, msg:e.message}; }

    if(result && result.ok){
      BTN.textContent = "✅ " + result.result;
      BTN.style.color = "#00aa55";
      setTimeout(function(){
        BTN.textContent = "⚡ Tự động nhận diện";
        BTN.style.opacity = "1";
        BTN.disabled = false;
      }, 3000);
    } else {
      BTN.textContent = "❌ " + (result && result.msg ? result.msg : "Lỗi");
      BTN.style.color = "#ff4466";
      setTimeout(function(){
        BTN.textContent = "⚡ Tự động nhận diện";
        BTN.style.color = "#00aa55";
        BTN.style.opacity = "1";
        BTN.disabled = false;
      }, 3000);
    }
  });

  // Chèn nút DƯỚI input, không đụng vào wrapper của captcha image
  inp.insertAdjacentElement("afterend", BTN);

})();
