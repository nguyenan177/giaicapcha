// solver.js — Captcha Solver Pro
// Được gọi bởi: new Function('__APIKEY__', code)(key)
// __APIKEY__ là tham số được truyền trực tiếp từ bookmarklet

(function (APIKEY) {
  if (!APIKEY) { alert('❌ Chưa có API key! Tạo lại bookmarklet.'); return; }

  var API_URL = "https://anticaptcha.top/api/captcha";

  function sleep(ms) { return new Promise(function(r){ setTimeout(r,ms); }); }

  async function getBase64(img) {
    if (!img) return null;
    if (img.src.startsWith("data:")) return img.src;
    try {
      var res = await fetch(img.src);
      var blob = await res.blob();
      return await new Promise(function(r){
        var fr = new FileReader();
        fr.onloadend = function(){ r(fr.result); };
        fr.readAsDataURL(blob);
      });
    } catch(e) {}
    try {
      var c = document.createElement("canvas");
      c.width = img.naturalWidth||120; c.height = img.naturalHeight||40;
      c.getContext("2d").drawImage(img,0,0);
      return c.toDataURL("image/png");
    } catch(e) {}
    return null;
  }

  async function callApi(base64, type) {
    type = type || (base64.includes("svg+xml") ? 18 : 14);
    var res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({apikey: APIKEY, type: type, img: base64})
    });
    var d = await res.json();
    if (d.success && (d.captcha||d.result)) return d.captcha||d.result;
    throw new Error(d.message||"API lỗi");
  }

  async function fillInput(el, value) {
    if (!el) return;
    var ns = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value");
    ns = ns && ns.set;
    function sv(v){ if(ns) ns.call(el,v); else el.value=v; }
    sv(""); el.dispatchEvent(new Event("input",{bubbles:true}));
    await sleep(50);
    for (var i=0; i<value.length; i++){
      sv(el.value+value[i]);
      el.dispatchEvent(new Event("input",{bubbles:true}));
      await sleep(35);
    }
  }

  function findInput() {
    var sels = [
      'input[formcontrolname="checkCode"]','input[ng-model*="code"]',
      'input[name="identifying"]','.nrc-form-input.secure input[type="text"]',
      'input[name*="captcha"]','input[id*="captcha"]',
      'input[placeholder*="captcha"]','input[placeholder*="xác minh"]',
      'input[placeholder*="mã xác"]','input[placeholder*="nhập mã"]'
    ];
    for (var i=0;i<sels.length;i++){var el=document.querySelector(sels[i]);if(el)return el;}
    return Array.from(document.querySelectorAll('input[type="text"],input:not([type])')).find(function(el){
      var ph=(el.placeholder||"").toLowerCase();
      return (ph.includes("nhập")||ph.includes("mã"))&&el.maxLength>0&&el.maxLength<=8;
    })||null;
  }

  function findImg() {
    var sels=[
      'img.catchat_pic','img.codeImage','.nrc-form-input.secure img',
      '#captcha-image','img[src*="captcha"]','img[src*="vcode"]',
      'img[src*="kaptcha"]','img[class*="captcha"]'
    ];
    for (var i=0;i<sels.length;i++){var el=document.querySelector(sels[i]);if(el)return el;}
    var inp=findInput();
    if (inp&&inp.parentElement){
      var si=inp.parentElement.querySelector('img[src^="data:image"]');
      if(si) return si;
    }
    return Array.from(document.querySelectorAll("img")).find(function(el){
      var w=el.naturalWidth||el.offsetWidth, h=el.naturalHeight||el.offsetHeight;
      return w>50&&w<280&&h>20&&h<100;
    })||null;
  }

  async function solveGeneric() {
    var inp=document.querySelector('input[formcontrolname="checkCode"]')
          ||document.querySelector('input[ng-model*="code"]');
    if(!inp) return{ok:false,msg:"Không tìm thấy input Angular"};
    await sleep(800);
    var img=document.querySelector('img[src^="data:image"]');
    if(!img) return{ok:false,msg:"Không tìm thấy ảnh captcha"};
    try{var r=await callApi(img.src.split(",")[1],14);await fillInput(inp,r);return{ok:true,result:r};}
    catch(e){return{ok:false,msg:e.message};}
  }

  async function solveQQ88() {
    var inp=document.querySelector('input[name="identifying"]');
    var img=document.querySelector("img.catchat_pic");
    if(!inp||!img) return{ok:false,msg:"Không tìm thấy captcha QQ88"};
    await sleep(800);
    try{var r=await callApi(img.src.split(",")[1],14);await fillInput(inp,r);return{ok:true,result:r};}
    catch(e){return{ok:false,msg:e.message};}
  }

  async function solve78Win() {
    var inp=document.querySelector('.nrc-form-input.secure input[type="text"]');
    var img=document.querySelector(".nrc-form-input.secure img");
    if(!inp||!img) return{ok:false,msg:"Không tìm thấy captcha 78Win"};
    await sleep(800);
    try{var r=await callApi(img.src.split(",")[1],14);await fillInput(inp,r);return{ok:true,result:r};}
    catch(e){return{ok:false,msg:e.message};}
  }

  async function solveOkvip() {
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

  async function solveSVG() {
    var inp=document.querySelector("#captcha-input");
    var img=document.querySelector("#captcha-image");
    if(!inp||!img) return{ok:false,msg:"Không tìm thấy SVG captcha"};
    await sleep(800);
    try{var r=await callApi(img.src,18);await fillInput(inp,r);return{ok:true,result:r};}
    catch(e){return{ok:false,msg:e.message};}
  }

  async function solveAuto() {
    if(document.querySelector(".nrc-form-input.secure img")){var r=await solve78Win();r.site="78Win";return r;}
    if(document.querySelector("img.catchat_pic")){var r=await solveQQ88();r.site="QQ88";return r;}
    if(document.querySelector("img.codeImage")){var r=await solveOkvip();r.site="OKVip/New88";return r;}
    if(document.querySelector("#captcha-image")&&document.querySelector("#captcha-input")){var r=await solveSVG();r.site="SVG";return r;}
    if(document.querySelector('input[formcontrolname="checkCode"]')||document.querySelector('input[ng-model*="code"]')){var r=await solveGeneric();r.site="Angular";return r;}
    var inp=findInput(), img=findImg();
    if(inp&&img){
      await sleep(800);
      try{
        var b64=await getBase64(img);
        if(!b64) return{ok:false,msg:"Không lấy được ảnh"};
        var res=await callApi(b64);
        await fillInput(inp,res);
        return{ok:true,result:res,site:"Generic"};
      }catch(e){return{ok:false,msg:e.message};}
    }
    return{ok:false,msg:"Không nhận diện được captcha"};
  }

  // ===== PANEL =====
  var old=document.getElementById("__csp__");
  if(old){old.remove();return;}

  function el(tag,css,txt){
    var e=document.createElement(tag);
    if(css) e.style.cssText=css;
    if(txt) e.textContent=txt;
    return e;
  }
  function btn(txt,css,fn){
    var b=el("button",css,txt);
    b.addEventListener("click",fn);
    return b;
  }

  var P=el("div",
    "all:initial;display:block;position:fixed;bottom:0;left:0;right:0;"+
    "z-index:2147483647;background:#0a0a0f;border-top:2px solid #00ff88;"+
    "font-family:monospace;padding:12px 14px 30px;"+
    "box-shadow:0 -8px 32px rgba(0,0,0,0.9);"
  );
  P.id="__csp__";

  var H=el("div","display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;");
  H.appendChild(el("div","color:#00ff88;font-weight:bold;font-size:14px;letter-spacing:1px;","🔓 CAPTCHA SOLVER"));
  H.appendChild(btn("✕","all:unset;color:#666;font-size:20px;cursor:pointer;padding:0 6px;line-height:1;",function(){P.remove();}));
  P.appendChild(H);

  var MSG=el("div",
    "font-size:11px;color:#666;background:#0d0d14;border-radius:6px;"+
    "padding:7px 10px;margin-bottom:10px;min-height:32px;line-height:1.5;",
    "Chọn loại captcha bên dưới…"
  );
  P.appendChild(MSG);

  function setMsg(txt,color){MSG.textContent=txt;MSG.style.color=color||"#666";}

  var G=el("div","display:grid;grid-template-columns:1fr 1fr;gap:7px;");

  var AB=btn("⚡  TỰ ĐỘNG NHẬN DIỆN",
    "display:block;width:100%;padding:12px;background:rgba(0,255,136,0.13);"+
    "border:1px solid rgba(0,255,136,0.4);border-radius:8px;color:#00ff88;"+
    "font-weight:bold;font-size:13px;cursor:pointer;text-align:center;box-sizing:border-box;",
    function(){run("auto");}
  );
  AB.style.gridColumn="1 / -1";
  G.appendChild(AB);

  var SITES=[
    ["🎯 Angular","generic"],["🃏 QQ88","qq88"],
    ["🎱 78Win","78win"],["💎 OKVip","okvip"],
    ["🧩 SVG","svg"],["🔍 Generic","auto"]
  ];
  var BS="display:block;width:100%;padding:10px 6px;background:#14141f;"+
         "border:1px solid #1e1e2e;border-radius:8px;color:#e2e2f0;"+
         "font-size:11px;cursor:pointer;text-align:center;box-sizing:border-box;";
  SITES.forEach(function(s){
    G.appendChild(btn(s[0],BS,(function(t){return function(){run(t);};})(s[1])));
  });

  P.appendChild(G);
  document.body.appendChild(P);

  async function run(type){
    setMsg("⏳ Đang giải ["+type+"]…","#ffcc00");
    var result;
    try{
      if     (type==="auto")    result=await solveAuto();
      else if(type==="generic") result=await solveGeneric();
      else if(type==="qq88")    result=await solveQQ88();
      else if(type==="78win")   result=await solve78Win();
      else if(type==="okvip")   result=await solveOkvip();
      else if(type==="svg")     result=await solveSVG();
      else result={ok:false,msg:"Không rõ loại"};
    }catch(e){result={ok:false,msg:e.message};}

    if(result&&result.ok){
      setMsg("✅"+(result.site?" ["+result.site+"]":"")+" → "+result.result,"#00ff88");
    } else {
      setMsg("❌ "+(result&&result.msg?result.msg:"Lỗi không xác định"),"#ff3366");
    }
  }

})(__APIKEY__);
