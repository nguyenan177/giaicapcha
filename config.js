// ============================================================
//  solver.js — Captcha Solver Pro (iOS Safari Bookmarklet)
//  Up file này lên GitHub, bookmarklet sẽ fetch & chạy
// ============================================================

(function (APIKEY) {
  var API_URL = "https://anticaptcha.top/api/captcha";

  // ===== HELPERS =====
  function sleep(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

  async function getBase64(img) {
    if (!img) return null;
    if (img.src.startsWith("data:")) return img.src;
    try {
      var res = await fetch(img.src);
      var blob = await res.blob();
      return await new Promise(function(r) {
        var fr = new FileReader();
        fr.onloadend = function() { r(fr.result); };
        fr.readAsDataURL(blob);
      });
    } catch(e) {}
    try {
      var c = document.createElement("canvas");
      c.width = img.naturalWidth || 120;
      c.height = img.naturalHeight || 40;
      c.getContext("2d").drawImage(img, 0, 0);
      return c.toDataURL("image/png");
    } catch(e) {}
    return null;
  }

  async function callApi(base64, type) {
    type = type || (base64.includes("svg+xml") ? 18 : 14);
    var res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: APIKEY, type: type, img: base64 })
    });
    var d = await res.json();
    if (d.success && (d.captcha || d.result)) return d.captcha || d.result;
    throw new Error(d.message || "API lỗi");
  }

  async function fillInput(el, value) {
    if (!el) return;
    var ns = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    ns = ns && ns.set;
    var sv = function(v) { if (ns) ns.call(el, v); else el.value = v; };
    sv("");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(50);
    for (var i = 0; i < value.length; i++) {
      sv(el.value + value[i]);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(35);
    }
  }

  // ===== FIND ELEMENTS =====
  function findInput() {
    var sels = [
      'input[formcontrolname="checkCode"]',
      'input[ng-model*="code"]',
      'input[name="identifying"]',
      '.nrc-form-input.secure input[type="text"]',
      'input[name*="captcha"]',
      'input[id*="captcha"]',
      'input[placeholder*="captcha"]',
      'input[placeholder*="xác minh"]',
      'input[placeholder*="mã xác"]',
      'input[placeholder*="nhập mã"]'
    ];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el;
    }
    return Array.from(document.querySelectorAll('input[type="text"],input:not([type])')).find(function(el) {
      var ph = (el.placeholder || "").toLowerCase();
      return (ph.includes("nhập") || ph.includes("mã")) && el.maxLength > 0 && el.maxLength <= 8;
    }) || null;
  }

  function findImg() {
    var sels = [
      'img.catchat_pic',
      'img.codeImage',
      '.nrc-form-input.secure img',
      '#captcha-image',
      'img[src*="captcha"]',
      'img[src*="vcode"]',
      'img[src*="kaptcha"]',
      'img[class*="captcha"]'
    ];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el;
    }
    var inp = findInput();
    if (inp && inp.parentElement) {
      var si = inp.parentElement.querySelector('img[src^="data:image"]');
      if (si) return si;
    }
    return Array.from(document.querySelectorAll("img")).find(function(el) {
      var w = el.naturalWidth || el.offsetWidth;
      var h = el.naturalHeight || el.offsetHeight;
      return w > 50 && w < 280 && h > 20 && h < 100;
    }) || null;
  }

  // ===== SOLVERS =====
  async function solveGeneric() {
    var inp = document.querySelector('input[formcontrolname="checkCode"]')
           || document.querySelector('input[ng-model*="code"]');
    if (!inp) return { ok: false, msg: "Không tìm thấy input Angular" };
    await sleep(800);
    var img = document.querySelector('img[src^="data:image"]');
    if (!img) return { ok: false, msg: "Không tìm thấy ảnh captcha" };
    try {
      var r = await callApi(img.src.split(",")[1], 14);
      await fillInput(inp, r);
      return { ok: true, result: r };
    } catch(e) { return { ok: false, msg: e.message }; }
  }

  async function solveQQ88() {
    var inp = document.querySelector('input[name="identifying"]');
    var img = document.querySelector("img.catchat_pic");
    if (!inp || !img) return { ok: false, msg: "Không tìm thấy captcha QQ88" };
    await sleep(800);
    try {
      var r = await callApi(img.src.split(",")[1], 14);
      await fillInput(inp, r);
      return { ok: true, result: r };
    } catch(e) { return { ok: false, msg: e.message }; }
  }

  async function solve78Win() {
    var inp = document.querySelector('.nrc-form-input.secure input[type="text"]');
    var img = document.querySelector(".nrc-form-input.secure img");
    if (!inp || !img) return { ok: false, msg: "Không tìm thấy captcha 78Win" };
    await sleep(800);
    try {
      var r = await callApi(img.src.split(",")[1], 14);
      await fillInput(inp, r);
      return { ok: true, result: r };
    } catch(e) { return { ok: false, msg: e.message }; }
  }

  async function solveOkvip() {
    var img = document.querySelector("img.codeImage");
    if (!img) return { ok: false, msg: "Không tìm thấy captcha OKVip" };
    await sleep(800);
    try {
      var r = await callApi(img.src, 14);
      var inp = document.querySelector("#van-field-3-input");
      if (!inp) return { ok: false, msg: "Không tìm thấy input OKVip" };
      await fillInput(inp, r);
      return { ok: true, result: r };
    } catch(e) { return { ok: false, msg: e.message }; }
  }

  async function solveSVG() {
    var inp = document.querySelector("#captcha-input");
    var img = document.querySelector("#captcha-image");
    if (!inp || !img) return { ok: false, msg: "Không tìm thấy SVG captcha" };
    await sleep(800);
    try {
      var r = await callApi(img.src, 18);
      await fillInput(inp, r);
      return { ok: true, result: r };
    } catch(e) { return { ok: false, msg: e.message }; }
  }

  async function solveAuto() {
    if (document.querySelector(".nrc-form-input.secure img")) { var r = await solve78Win(); return Object.assign(r, { site: "78Win" }); }
    if (document.querySelector("img.catchat_pic"))            { var r = await solveQQ88();  return Object.assign(r, { site: "QQ88" }); }
    if (document.querySelector("img.codeImage"))              { var r = await solveOkvip(); return Object.assign(r, { site: "OKVip/New88" }); }
    if (document.querySelector("#captcha-image") && document.querySelector("#captcha-input")) { var r = await solveSVG(); return Object.assign(r, { site: "SVG" }); }
    if (document.querySelector('input[formcontrolname="checkCode"]') || document.querySelector('input[ng-model*="code"]')) { var r = await solveGeneric(); return Object.assign(r, { site: "Angular" }); }
    // Generic fallback
    var inp = findInput(), img = findImg();
    if (inp && img) {
      await sleep(800);
      try {
        var b64 = await getBase64(img);
        if (!b64) return { ok: false, msg: "Không lấy được ảnh" };
        var res = await callApi(b64);
        await fillInput(inp, res);
        return { ok: true, result: res, site: "Generic" };
      } catch(e) { return { ok: false, msg: e.message }; }
    }
    return { ok: false, msg: "Không nhận diện được captcha trên trang này" };
  }

  // ===== BUILD PANEL =====
  var existing = document.getElementById("__csp_panel__");
  if (existing) { existing.remove(); return; }

  function mkEl(tag, css, text) {
    var el = document.createElement(tag);
    if (css) el.style.cssText = css;
    if (text) el.textContent = text;
    return el;
  }
  function mkBtn(label, css, action) {
    var b = mkEl("button", css, label);
    b.addEventListener("click", action);
    return b;
  }

  var panel = mkEl("div",
    "position:fixed;bottom:0;left:0;right:0;z-index:2147483647;" +
    "background:#0a0a0f;border-top:2px solid #00ff88;font-family:monospace;" +
    "padding:12px 14px 28px;box-shadow:0 -10px 40px rgba(0,0,0,0.85);"
  );
  panel.id = "__csp_panel__";

  // Header
  var hdr = mkEl("div", "display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;");
  var logo = mkEl("div", "font-family:sans-serif;font-weight:800;font-size:14px;color:#00ff88;letter-spacing:1px;", "🔓 CAPTCHA SOLVER");
  var closeBtn = mkBtn("✕", "all:unset;color:#555;font-size:20px;cursor:pointer;padding:2px 6px;line-height:1;", function() { panel.remove(); });
  hdr.appendChild(logo);
  hdr.appendChild(closeBtn);
  panel.appendChild(hdr);

  // Status
  var msg = mkEl("div",
    "font-size:11px;color:#555570;margin-bottom:10px;padding:6px 10px;" +
    "background:#0d0d14;border-radius:6px;min-height:30px;line-height:1.5;",
    "Chọn loại captcha để giải…"
  );
  msg.id = "__csp_msg__";
  panel.appendChild(msg);

  // Grid
  var grid = mkEl("div", "display:grid;grid-template-columns:1fr 1fr;gap:7px;");

  var autoBtn = mkBtn("⚡  TỰ ĐỘNG NHẬN DIỆN & GIẢI",
    "all:unset;display:block;background:rgba(0,255,136,0.13);border:1px solid rgba(0,255,136,0.4);" +
    "border-radius:8px;padding:12px;text-align:center;font-family:sans-serif;font-weight:800;" +
    "font-size:13px;color:#00ff88;cursor:pointer;width:100%;box-sizing:border-box;",
    function() { doSolve("auto"); }
  );
  autoBtn.style.gridColumn = "1 / -1";
  grid.appendChild(autoBtn);

  var btns = [
    ["🎯  Angular",    "generic"],
    ["🃏  QQ88",       "qq88"],
    ["🎱  78Win",      "78win"],
    ["💎  OKVip/New88","okvip"],
    ["🧩  SVG",        "svg"],
    ["🔍  Generic",    "generic"]
  ];
  var bs = "all:unset;display:block;background:#14141f;border:1px solid #1e1e2e;" +
           "border-radius:8px;padding:10px 6px;text-align:center;font-size:11px;" +
           "color:#e2e2f0;cursor:pointer;width:100%;box-sizing:border-box;";
  btns.forEach(function(d) {
    var b = mkBtn(d[0], bs, (function(type){ return function(){ doSolve(type); }; })(d[1]));
    grid.appendChild(b);
  });

  panel.appendChild(grid);
  document.body.appendChild(panel);

  async function doSolve(type) {
    msg.style.color = "#ffcc00";
    msg.textContent = "⏳ Đang giải [" + type + "]…";
    var result;
    try {
      switch (type) {
        case "auto":    result = await solveAuto();    break;
        case "generic": result = await solveGeneric(); break;
        case "qq88":    result = await solveQQ88();    break;
        case "78win":   result = await solve78Win();   break;
        case "okvip":   result = await solveOkvip();   break;
        case "svg":     result = await solveSVG();     break;
        default: result = { ok: false, msg: "Không rõ loại solver" };
      }
    } catch(e) { result = { ok: false, msg: e.message }; }

    if (result && result.ok) {
      msg.style.color = "#00ff88";
      msg.textContent = "✅" + (result.site ? " [" + result.site + "]" : "") + "  →  " + result.result;
    } else {
      msg.style.color = "#ff3366";
      msg.textContent = "❌  " + (result && result.msg ? result.msg : "Lỗi không xác định");
    }
  }

})(window.__CSP_APIKEY__ || "");
