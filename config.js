// config.js — Captcha Solver Pro (minimal, chỉ nút tự động)
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

  function findInput(){
    var sels=[
      'input[formcontrolname="checkCode"]','input[ng-model*="code"]',
      'input[name="identifying"]','.nrc-form-input.secure input[type="text"]',
      'input[name*="captcha"]','input[id*="captcha"]',
      'input[placeholder*="captcha"]','input[placeholder*="xác minh"]',
      'input[placeholder*="mã xác"]','input[placeholder*="nhập mã"]',
      'input[placeholder*="Mã xác"]','input[placeholder*="verification"]'
    ];
    for(var i=0;i<sels.length;i++){var e=document.querySelector(sels[i]);if(e)return e;}
    return Array.from(document.querySelectorAll('input[type="text"],input:not([type])')).find(function(e){
      var p=(e.placeholder||"").toLowerCase();
      return (p.includes("nhập")||p.includes("mã"))&&e.maxLength>0&&e.maxLength<=8;
    })||null;
  }

  function findImg(){
    var sels=['img.catchat_pic','img.codeImage','.nrc-form-input.secure img',
      '#captcha-image','img[src*="captcha"]','img[src*="vcode"]',
      'img[src*="kaptcha"]','img[class*="captcha"]','img[id*="captcha"]'];
    for(var i=0;i<sels.length;i++){var e=document.querySelector(sels[i]);if(e)return e;}
    var inp=findInput();
    if(inp&&inp.parentElement){var si=inp.parentElement.querySelector('img[src^="data:image"]');if(si)return si;}
    return Array.from(document.querySelectorAll("img")).find(function(e){
      var w=e.naturalWidth||e.offsetWidth,h=e.naturalHeight||e.offsetHeight;
      return w>50&&w<280&&h>20&&h<100;
    })||null;
  }

  async function solveGeneric(){
    var inp=document.querySelector('input[formcontrolname="checkCode"]')||document.querySelector('input[ng-model*="code"]');
    if(!inp) return{ok:false,msg:"Không tìm thấy input Angular"};
    await sleep(800);
    var img=document.querySelector('img[src^="data:image"]');
    if(!img) return{ok:false,msg:"Không tìm thấy ảnh captcha"};
    try{var r=await callApi(img.src.split(",")[1],14);await fillInput(inp,r);return{ok:true,result:r};}
    catch(e){return{ok:false,msg:e.message};}
  }
  async function solveQQ88(){
    var inp=document.querySelector('input[name="identifying"]');
    var img=document.querySelector("img.catchat_pic");
    if(!inp||!img) return{ok:false,msg:"Không tìm thấy captcha QQ88"};
    await sleep(800);
    try{var r=await callApi(img.src.split(",")[1],14);await fillInput(inp,r);return{ok:true,result:r};}
    catch(e){return{ok:false,msg:e.message};}
  }
  async function solve78Win(){
    var inp=document.querySelector('.nrc-form-input.secure input[type="text"]');
    var img=document.querySelector(".nrc-form-input.secure img");
    if(!inp||!img) return{ok:false,msg:"Không tìm thấy captcha 78Win"};
    await sleep(800);
    try{var r=await callApi(img.src.split(",")[1],14);await fillInput(inp,r);return{ok:true,result:r};}
    catch(e){return{ok:false,msg:e.message};}
  }
  async function solveOkvip(){
    var img=document.querySelector("img.codeImage");
    if(!img) return{ok:false,msg:"Không tìm thấy captcha OKVip"};
    await sleep(800);
    try{
      var r=await callApi(img.src,14);
      var inp=document.querySelector("#van-field-3-input");
      if(!inp) return{ok:false,msg:"Không tìm thấy input OKVip"};
      await fillInput(inp,r); return{ok:true,result:r};
    }catch(e){return{ok:false,msg:e.message};}
  }
  async function solveSVG(){
    var inp=document.querySelector("#captcha-input");
    var img=document.querySelector("#captcha-image");
    if(!inp||!img) return{ok:false,msg:"Không tìm thấy SVG captcha"};
    await sleep(800);
    try{var r=await callApi(img.src,18);await fillInput(inp,r);return{ok:true,result:r};}
    catch(e){return{ok:false,msg:e.message};}
  }

  async function solveAuto(){
    if(document.querySelector(".nrc-form-input.secure img")){var r=await solve78Win();r.site="78Win";return r;}
    if(document.querySelector("img.catchat_pic")){var r=await solveQQ88();r.site="QQ88";return r;}
    if(document.querySelector("img.codeImage")){var r=await solveOkvip();r.site="OKVip/New88";return r;}
    if(document.querySelector("#captcha-image")&&document.querySelector("#captcha-input")){var r=await solveSVG();r.site="SVG";return r;}
    if(document.querySelector('input[formcontrolname="checkCode"]')||document.querySelector('input[ng-model*="code"]')){var r=await solveGeneric();r.site="Angular";return r;}
    var inp=findInput(),img=findImg();
    if(inp&&img){
      await sleep(800);
      try{
        var b64=await getBase64(img);
        if(!b64) return{ok:false,msg:"Không lấy được ảnh"};
        var res=await callApi(b64); await fillInput(inp,res);
        return{ok:true,result:res,site:"Generic"};
      }catch(e){return{ok:false,msg:e.message};}
    }
    return{ok:false,msg:"Không nhận diện được captcha"};
  }

  // ===== CHỈ NÚT DUY NHẤT =====
  var old=document.getElementById("__csp__");
  if(old){old.remove(); return;}

  var P=document.createElement("div");
  P.id="__csp__";
  P.style.cssText=
    "all:initial;display:flex;align-items:center;gap:8px;position:fixed;bottom:16px;left:50%;"+
    "transform:translateX(-50%);z-index:2147483647;"+
    "background:#0a0a0f;border:1px solid rgba(0,255,136,0.35);border-radius:999px;"+
    "padding:8px 16px;box-shadow:0 4px 20px rgba(0,0,0,0.8);font-family:monospace;";

  var MSG=document.createElement("span");
  MSG.style.cssText="font-size:11px;color:#888;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;";
  MSG.textContent="Sẵn sàng";

  var BTN=document.createElement("button");
  BTN.style.cssText=
    "all:unset;cursor:pointer;padding:7px 16px;background:rgba(0,255,136,0.13);"+
    "border:1px solid rgba(0,255,136,0.45);border-radius:999px;"+
    "color:#00ff88;font-weight:bold;font-size:12px;font-family:monospace;white-space:nowrap;";
  BTN.textContent="⚡ Tự động nhận diện";

  var CLOSE=document.createElement("button");
  CLOSE.style.cssText="all:unset;cursor:pointer;color:#555;font-size:16px;line-height:1;padding:0 2px;";
  CLOSE.textContent="✕";
  CLOSE.addEventListener("click",function(){P.remove();});

  BTN.addEventListener("click",async function(){
    BTN.disabled=true;
    MSG.style.color="#ffcc00";
    MSG.textContent="⏳ Đang giải…";
    var result;
    try{ result=await solveAuto(); }
    catch(e){ result={ok:false,msg:e.message}; }
    if(result&&result.ok){
      MSG.style.color="#00ff88";
      MSG.textContent="✅"+(result.site?" ["+result.site+"]":"")+" "+result.result;
    }else{
      MSG.style.color="#ff3366";
      MSG.textContent="❌ "+(result&&result.msg?result.msg:"Lỗi");
    }
    BTN.disabled=false;
  });

  P.appendChild(MSG);
  P.appendChild(BTN);
  P.appendChild(CLOSE);
  document.body.appendChild(P);
})();
