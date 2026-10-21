/* Hisaab shared code: theme, language, number formats, form reading, ledger drawing. */
(function () {
  var H = window.H = {}, root = document.documentElement;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var l = store("hs-lang"); if (l === "hi" || l === "en") root.lang = l;
  var th = store("hs-theme"); if (th === "dark" || th === "light") root.setAttribute("data-theme", th);
  H.lang = function () { return root.lang === "hi" ? "hi" : "en"; };
  H.t = function (p) { return Array.isArray(p) ? (H.lang() === "hi" && p[1] ? p[1] : p[0]) : p; };
  var langFns = []; H.onLang = function (f) { langFns.push(f); };

  // Indian formats
  H.inr = function (n, dec) {
    if (!isFinite(n)) return "-";
    var neg = n < 0; n = Math.abs(n);
    var s = dec ? n.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : Math.round(n).toLocaleString("en-IN");
    return (neg ? "-" : "") + "₹" + s;
  };
  H.num = function (n, d) { return isFinite(n) ? n.toLocaleString("en-IN", { maximumFractionDigits: d == null ? 2 : d }) : "-"; };
  H.words = function (n) {
    n = Math.abs(n); var hi = H.lang() === "hi";
    function f(x) { return (+x.toFixed(2)).toLocaleString("en-IN"); }
    if (n >= 1e7) return f(n / 1e7) + (hi ? " करोड़" : " crore");
    if (n >= 1e5) return f(n / 1e5) + (hi ? " लाख" : " lakh");
    if (n >= 1e3) return f(n / 1e3) + (hi ? " हज़ार" : " thousand");
    return n ? f(n) : "";
  };

  H.toast = function (msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2400);
  };

  /* ---------- reading the form ---------- */
  function values(form) {
    var v = {};
    form.querySelectorAll("input, select").forEach(function (el) {
      if (!el.name) return;
      if (el.type === "radio") { if (el.checked) v[el.name] = el.value; return; }
      if (el.type === "checkbox") { v[el.name] = el.checked; return; }
      if (el.type === "number") { var x = parseFloat(el.value); v[el.name] = isFinite(x) ? x : 0; return; }
      v[el.name] = el.value;
    });
    return v;
  }
  function moneyHints(form) {
    form.querySelectorAll("input[data-money]").forEach(function (el) {
      var s = el.closest(".fld").querySelector("small[data-words]");
      if (s) s.textContent = H.words(parseFloat(el.value) || 0);
    });
  }
  // keep inputs in the link so a result can be shared
  function toUrl(form) {
    var p = new URLSearchParams();
    form.querySelectorAll("input, select").forEach(function (el) {
      if (!el.name || (el.type === "radio" && !el.checked)) return;
      p.set(el.name, el.type === "checkbox" ? (el.checked ? 1 : 0) : el.value);
    });
    history.replaceState(null, "", "?" + p.toString());
  }
  function fromUrl(form) {
    var p = new URLSearchParams(location.search);
    p.forEach(function (val, key) {
      form.querySelectorAll('[name="' + key + '"]').forEach(function (el) {
        if (el.type === "radio") el.checked = el.value === val;
        else if (el.type === "checkbox") el.checked = val === "1";
        else el.value = val;
      });
    });
  }

  /* ---------- drawing the ledger ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function val(x, fmt) { return typeof x === "number" ? (fmt === "num" ? H.num(x) : H.inr(x)) : esc(H.t(x)); }
  H.render = function (box, r) {
    var html = '<div class="l-head"><div class="lbl">' + esc(H.t(r.bigLabel)) + '</div><div class="l-big" id="l-big">' + val(r.big, r.bigFmt) + "</div>" +
      (r.sub ? '<div class="l-sub">' + r.sub + "</div>" : "") + "</div>";
    html += '<div class="l-body' + (r.cols ? " l-cols" : "") + '">';
    if (r.cols) html += '<div class="l-colhead">' + r.cols.map(function (c, i) { return '<span class="' + (r.win === i ? "win" : "") + '">' + esc(H.t(c)) + "</span>"; }).join("") + "</div>";
    (r.rows || []).forEach(function (row) {
      var vs = Array.isArray(row.v) && typeof row.v[0] !== "string" ? row.v : [row.v];
      var vhtml = row.v === undefined ? "" : vs.map(function (x) { return '<span class="v">' + (x === null ? "" : val(x, row.fmt)) + "</span>"; }).join("");
      html += '<div class="l-row ' + (row.kind || "") + '"><span class="k">' + esc(H.t(row.k)) + '</span><span class="dots"></span>' + vhtml + "</div>";
    });
    if (r.split) {
      var tot = r.split.reduce(function (a, s) { return a + Math.max(0, s.v); }, 0) || 1;
      html += '<div class="split" aria-hidden="true">' + r.split.map(function (s) { return '<i style="width:' + (Math.max(0, s.v) / tot * 100) + "%;background:" + s.c + '"></i>'; }).join("") + "</div>";
      html += '<div class="legend">' + r.split.map(function (s) { return '<span style="--c:' + s.c + '">' + esc(H.t(s.k)) + " " + Math.round(Math.max(0, s.v) / tot * 100) + "%</span>"; }).join("") + "</div>";
    }
    html += "</div>";
    html += '<div class="l-foot"><button class="btn" type="button" data-act="copy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>' +
      esc(H.t(["Copy link", "लिंक कॉपी करें"])) + '</button><button class="btn" type="button" data-act="print"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>' +
      esc(H.t(["Print or save PDF", "प्रिंट या PDF"])) + "</button></div>";
    var old = box.querySelector("#l-big"), oldTxt = old && old.textContent;
    box.innerHTML = html;
    var nb = box.querySelector("#l-big"); if (oldTxt && oldTxt !== nb.textContent) nb.classList.add("flash");
    // year-by-year table lives outside the ledger
    var yt = document.getElementById("yt");
    if (yt) {
      if (r.table) {
        yt.hidden = false;
        yt.querySelector("summary").textContent = H.t(r.table.title || ["Year by year", "साल दर साल"]);
        yt.querySelector(".tw").innerHTML = "<table><thead><tr>" + r.table.head.map(function (h) { return "<th>" + esc(H.t(h)) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          r.table.rows.map(function (row) { return "<tr>" + row.map(function (c) { return "<td>" + (typeof c === "number" ? H.inr(c) : esc(H.t(c))) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
      } else yt.hidden = true;
    }
  };

  H.mount = function (calc) {
    var form = document.getElementById("calc-form"), box = document.getElementById("ledger");
    if (!form || !box) return;
    fromUrl(form);
    var timer = null;
    function run(push) {
      moneyHints(form);
      var v = values(form), r;
      if (calc.prepare) calc.prepare(v, form);
      try { r = calc.compute(v); } catch (e) { r = { bigLabel: ["Check the numbers", "नंबर जाँचें"], big: "-", rows: [{ k: e.message, kind: "note" }] }; }
      H.render(box, r);
      if (push) toUrl(form);
    }
    form.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { run(true); }, 120); });
    form.addEventListener("change", function () { run(true); });
    form.addEventListener("submit", function (e) { e.preventDefault(); run(true); });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      if (b.dataset.act === "print") window.print();
      if (b.dataset.act === "copy") {
        var done = function () { H.toast(H.t(["Link copied", "लिंक कॉपी हो गया"])); };
        if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, function () { prompt("Copy", location.href); });
        else prompt("Copy", location.href);
      }
    });
    H.onLang(function () { run(false); });
    run(false);
  };

  document.addEventListener("DOMContentLoaded", function () {
    var lb = document.getElementById("lang-btn");
    // dropdown options carry their Hindi text in data-hi
    var sels = Array.prototype.slice.call(document.querySelectorAll("select[data-hi]"));
    sels.forEach(function (s) { s._en = Array.prototype.map.call(s.options, function (o) { return o.text; }); try { s._hi = JSON.parse(s.dataset.hi); } catch (e) { s._hi = s._en; } });
    function paintSel() { sels.forEach(function (s) { Array.prototype.forEach.call(s.options, function (o, i) { o.text = H.lang() === "hi" ? s._hi[i] : s._en[i]; }); }); }
    function paint() { paintSel(); if (lb) { lb.textContent = H.lang() === "hi" ? "EN" : "हिं"; lb.title = H.lang() === "hi" ? "Switch to English" : "हिंदी में देखें"; } }
    paint();
    if (lb) lb.addEventListener("click", function () { root.lang = H.lang() === "hi" ? "en" : "hi"; store("hs-lang", root.lang); paint(); langFns.forEach(function (f) { f(); }); });
    var tb = document.getElementById("theme-btn");
    if (tb) tb.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme") === "dark" || (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
      root.setAttribute("data-theme", dark ? "light" : "dark"); store("hs-theme", dark ? "light" : "dark");
    });
    var nb = document.getElementById("nav-btn"), nav = document.getElementById("nav");
    if (nb && nav) nb.addEventListener("click", function () { nb.setAttribute("aria-expanded", nav.classList.toggle("open")); });
    var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
    var find = document.getElementById("find");
    if (find) find.addEventListener("input", function () {
      var q = find.value.trim().toLowerCase();
      document.querySelectorAll(".card").forEach(function (c) { c.hidden = q && c.textContent.toLowerCase().indexOf(q) < 0 && (c.dataset.k || "").indexOf(q) < 0; });
      document.querySelectorAll(".group").forEach(function (g) { g.hidden = !g.querySelector(".card:not([hidden])"); });
    });
    if (window.HISAAB_CALC && window.CALCS && CALCS[HISAAB_CALC]) H.mount(CALCS[HISAAB_CALC]);
    if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(function () {});
  });
})();
