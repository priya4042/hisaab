/* Every calculator: compute(values) returns what the ledger shows. Tax rules: FY 2026-27 (Budget 2026 kept Budget 2025 slabs). */
(function () {
  var C = window.CALCS = {}, INF = Infinity;
  var c1 = "var(--ink)", c2 = "var(--saffron)", c3 = "var(--margin)";

  /* ---------- tax engine ---------- */
  var NEW = [[4e5, 0], [8e5, .05], [12e5, .10], [16e5, .15], [20e5, .20], [24e5, .25], [INF, .30]];
  function oldSlabs(age) { var b = age === "80" ? 5e5 : age === "60" ? 3e5 : 2.5e5; return [[b, 0], [5e5, .05], [10e5, .20], [INF, .30]]; }
  function slabTax(inc, slabs) {
    var t = 0, prev = 0;
    for (var i = 0; i < slabs.length && inc > prev; i++) { t += (Math.min(inc, slabs[i][0]) - prev) * slabs[i][1]; prev = slabs[i][0]; }
    return t;
  }
  function afterRebate(inc, t, regime) {
    if (regime === "new") { if (inc <= 12e5) return 0; return Math.min(t, inc - 12e5); } // 87A rebate + marginal relief
    return inc <= 5e5 ? Math.max(0, t - 12500) : t;
  }
  function surRate(inc, regime) { return inc > 5e7 ? (regime === "new" ? .25 : .37) : inc > 2e7 ? .25 : inc > 1e7 ? .15 : inc > 5e6 ? .10 : 0; }
  var TH = [5e6, 1e7, 2e7, 5e7];
  function surcharge(inc, t, slabs, regime) {
    var r = surRate(inc, regime); if (!r) return 0;
    var s = t * r, th = 0; TH.forEach(function (x) { if (inc > x) th = x; });
    var tth = slabTax(th, slabs), cap = tth * (1 + surRate(th, regime)) + (inc - th); // marginal relief on surcharge
    return Math.max(0, Math.min(s, cap - t));
  }
  // full tax for a taxable income; returns the steps for the ledger
  function tax(inc, regime, age) {
    inc = Math.max(0, inc);
    var slabs = regime === "new" ? NEW : oldSlabs(age), base = slabTax(inc, slabs), t = afterRebate(inc, base, regime);
    var s = surcharge(inc, t, slabs, regime), cess = (t + s) * .04, total = Math.round((t + s + cess) / 10) * 10;
    return { inc: inc, base: base, rebate: base - t, sur: s, cess: cess, total: total };
  }
  window.HTAX = tax;

  C.tax = { compute: function (v) {
    var gross = v.salary + v.other, emp = v.empnps;
    var stdN = Math.min(75000, v.salary), stdO = Math.min(50000, v.salary);
    var dedO = v.hra + Math.min(v.c80, 15e4) + Math.min(v.d80, 1e5) + Math.min(v.nps, 5e4) + Math.min(v.home, 2e5) + v.others + Math.min(v.pt, 2500) + emp;
    var o = tax(gross - stdO - dedO, "old", v.age), n = tax(gross - stdN - emp, "new", v.age);
    var win = n.total <= o.total ? 1 : 0, best = Math.min(o.total, n.total), diff = Math.abs(o.total - n.total);
    var better = win ? ["New regime", "नई व्यवस्था"] : ["Old regime", "पुरानी व्यवस्था"];
    return {
      bigLabel: ["Tax for the year under the better choice", "बेहतर विकल्प में साल का टैक्स"], big: best,
      sub: diff ? H.t(better) + " " + H.t(["saves", "से बचत"]) + " <b>" + H.inr(diff) + "</b> " + H.t(["a year", "सालाना"]) + " (" + H.inr(diff / 12) + H.t(["/month", "/महीना"]) + ")" : H.t(["Both regimes cost the same.", "दोनों में टैक्स बराबर है।"]),
      cols: [["Old", "पुरानी"], ["New", "नई"]], win: win,
      rows: [
        { k: ["Gross income", "कुल आय"], v: [gross, gross] },
        { k: ["Standard deduction", "स्टैंडर्ड डिडक्शन"], v: [stdO, stdN], kind: "less" },
        { k: ["Deductions and exemptions", "छूट और कटौतियाँ"], v: [dedO, emp], kind: "less" },
        { k: ["Taxable income", "कर योग्य आय"], v: [o.inc, n.inc], kind: "head" },
        { k: ["Tax on slabs", "स्लैब पर टैक्स"], v: [o.base, n.base] },
        { k: ["Rebate and relief", "रिबेट और राहत"], v: [o.rebate, n.rebate], kind: "less" },
        { k: ["Surcharge", "सरचार्ज"], v: [o.sur, n.sur], kind: "add" },
        { k: ["Health and education cess 4%", "स्वास्थ्य व शिक्षा सेस 4%"], v: [o.cess, n.cess], kind: "add" },
        { k: ["Total tax", "कुल टैक्स"], v: [o.total, n.total], kind: "total" },
        { k: ["Per month (TDS)", "हर महीने (TDS)"], v: [o.total / 12, n.total / 12] },
        { k: ["Deductions for the old regime are capped at their legal limits (80C 1.5 lakh, 80D 1 lakh, 80CCD(1B) 50,000, home loan interest 2 lakh).", "पुरानी व्यवस्था की कटौतियाँ उनकी कानूनी सीमा तक ही गिनी गई हैं (80C 1.5 लाख, 80D 1 लाख, 80CCD(1B) 50,000, होम लोन ब्याज 2 लाख)।"], kind: "note" }
      ]
    };
  } };

  // home page: salary only, nothing else claimed
  C.quick = { compute: function (v) {
    return C.tax.compute({ salary: v.salary, other: 0, empnps: 0, hra: 0, c80: v.c80, d80: 0, nps: 0, home: 0, others: 0, pt: 0, age: "below" });
  } };

  C.salary = { compute: function (v) {
    var basic = v.ctc * v.basic / 100, pfBase = v.pf === "none" ? 0 : v.pf === "cap" ? Math.min(basic, 180000) : basic;
    var pf = pfBase * .12, grat = v.grat ? basic * .0481 : 0, gross = v.ctc - pf - grat;
    var t = v.regime === "old" ? tax(gross - Math.min(50000, gross) - Math.min(v.pt, 2500) - Math.min(15e4, pf + v.c80), "old", "below") : tax(gross - Math.min(75000, gross), "new", "below");
    var inhand = gross - pf - v.pt - t.total;
    function r(k, x, kind) { return { k: k, v: [x, x / 12], kind: kind }; }
    return {
      bigLabel: ["Take-home salary every month", "हर महीने हाथ में सैलरी"], big: inhand / 12,
      sub: H.t(["That is", "यानी"]) + " " + H.inr(inhand) + " " + H.t(["a year, or", "सालाना, CTC का"]) + " " + Math.round(inhand / (v.ctc || 1) * 100) + "%" + H.t([" of CTC.", "।"]),
      cols: [["Yearly", "सालाना"], ["Monthly", "मासिक"]],
      rows: [
        r(["Cost to company (CTC)", "कॉस्ट टू कंपनी (CTC)"], v.ctc),
        r(["Employer PF", "कंपनी का PF"], pf, "less"),
        r(["Gratuity (4.81% of basic)", "ग्रेच्युटी (बेसिक का 4.81%)"], grat, "less"),
        r(["Gross salary", "ग्रॉस सैलरी"], gross, "head"),
        r(["Your PF (12%)", "आपका PF (12%)"], pf, "less"),
        r(["Professional tax", "प्रोफ़ेशनल टैक्स"], v.pt, "less"),
        r(["Income tax (" + (v.regime === "old" ? "old" : "new") + " regime)", "इनकम टैक्स (" + (v.regime === "old" ? "पुरानी" : "नई") + " व्यवस्था)"], t.total, "less"),
        r(["In-hand salary", "हाथ में सैलरी"], inhand, "total")
      ],
      split: [{ k: ["In hand", "हाथ में"], v: inhand, c: c1 }, { k: ["PF and gratuity", "PF और ग्रेच्युटी"], v: pf * 2 + grat, c: c2 }, { k: ["Taxes", "टैक्स"], v: t.total + v.pt, c: c3 }]
    };
  } };

  C.gst = { compute: function (v) {
    var rate = v.rate === "custom" ? v.custom : +v.rate, a = v.amount, net, g;
    if (v.mode === "remove") { net = a * 100 / (100 + rate); g = a - net; } else { net = a; g = a * rate / 100; }
    var rows = [{ k: [v.mode === "remove" ? "Price before GST" : "Amount", v.mode === "remove" ? "GST से पहले की कीमत" : "रकम"], v: net }];
    if (v.supply === "inter") rows.push({ k: ["IGST " + rate + "%", "IGST " + rate + "%"], v: g, kind: "add" });
    else rows.push({ k: ["CGST " + rate / 2 + "%", "CGST " + rate / 2 + "%"], v: g / 2, kind: "add" }, { k: ["SGST " + rate / 2 + "%", "SGST " + rate / 2 + "%"], v: g / 2, kind: "add" });
    rows.push({ k: ["Total with GST", "GST मिलाकर कुल"], v: net + g, kind: "total" });
    return { bigLabel: ["GST amount", "GST की रकम"], big: g, sub: H.t(["Total", "कुल"]) + " <b>" + H.inr(net + g, 2) + "</b>", rows: rows };
  } };

  C.fd = { compute: function (v) {
    var n = { monthly: 12, quarterly: 4, half: 2, yearly: 1 }[v.comp] || 4, r = v.rate / 100, t = v.years + v.months / 12;
    var m = v.amount * Math.pow(1 + r / n, n * t), interest = m - v.amount, rows = [];
    for (var y = 1; y <= Math.ceil(t); y++) { var ty = Math.min(y, t), b = v.amount * Math.pow(1 + r / n, n * ty); rows.push([y + "", b - v.amount, b]); }
    return {
      bigLabel: ["Maturity amount", "मैच्योरिटी रकम"], big: m,
      sub: H.t(["Effective yearly return", "असल सालाना रिटर्न"]) + " " + ((Math.pow(1 + r / n, n) - 1) * 100).toFixed(2) + "%",
      rows: [{ k: ["Deposit", "जमा"], v: v.amount }, { k: ["Interest earned", "कमाया ब्याज"], v: interest, kind: "add" }, { k: ["Maturity amount", "मैच्योरिटी रकम"], v: m, kind: "total" },
        { k: ["Banks cut 10% TDS if FD interest crosses 50,000 a year (1 lakh for seniors) and no Form 15G/15H is given.", "साल का FD ब्याज 50,000 (सीनियर के लिए 1 लाख) से ज़्यादा हो और 15G/15H न दिया हो तो बैंक 10% TDS काटता है।"], kind: "note" }],
      split: [{ k: ["Deposit", "जमा"], v: v.amount, c: c1 }, { k: ["Interest", "ब्याज"], v: interest, c: c2 }],
      table: { head: [["Year", "साल"], ["Interest so far", "अब तक ब्याज"], ["Balance", "बैलेंस"]], rows: rows }
    };
  } };

  C.rd = { compute: function (v) {
    var q = v.rate / 400, n = Math.round(v.months), m = 0, rows = [];
    for (var k = 1; k <= n; k++) m += v.amount * Math.pow(1 + q, (n - k + 1) / 3); // quarterly compounding, as banks quote
    for (var y = 12; y <= n + 11; y += 12) {
      var mm = Math.min(y, n), b = 0; for (k = 1; k <= mm; k++) b += v.amount * Math.pow(1 + q, (mm - k + 1) / 3);
      rows.push([Math.ceil(mm / 12) + "", v.amount * mm, b]);
    }
    var dep = v.amount * n;
    return {
      bigLabel: ["Maturity amount", "मैच्योरिटी रकम"], big: m, sub: H.t(["after", "बाद"]) + " " + n + H.t([" months", " महीने"]),
      rows: [{ k: ["Total deposited", "कुल जमा"], v: dep }, { k: ["Interest earned", "कमाया ब्याज"], v: m - dep, kind: "add" }, { k: ["Maturity amount", "मैच्योरिटी रकम"], v: m, kind: "total" }],
      split: [{ k: ["Deposits", "जमा"], v: dep, c: c1 }, { k: ["Interest", "ब्याज"], v: m - dep, c: c2 }],
      table: { head: [["Year", "साल"], ["Deposited", "जमा"], ["Balance", "बैलेंस"]], rows: rows }
    };
  } };

  C.ppf = { compute: function (v) {
    var d = Math.min(150000, Math.max(0, v.amount)), r = v.rate / 100, N = +v.years, bal = 0, dep = 0, rows = [];
    for (var y = 1; y <= N; y++) { bal = (bal + d) * (1 + r); dep += d; rows.push([y + "", dep, bal]); }
    return {
      bigLabel: ["Maturity amount (tax-free)", "मैच्योरिटी रकम (टैक्स-फ़्री)"], big: bal, sub: H.t(["after", "बाद"]) + " " + N + H.t([" years", " साल"]),
      rows: [{ k: ["Total deposited", "कुल जमा"], v: dep }, { k: ["Interest earned", "कमाया ब्याज"], v: bal - dep, kind: "add" }, { k: ["Maturity amount", "मैच्योरिटी रकम"], v: bal, kind: "total" },
        { k: v.amount > 150000 ? ["PPF takes at most 1.5 lakh a year, so 1.5 lakh is used.", "PPF में साल में ज़्यादा से ज़्यादा 1.5 लाख जमा होते हैं, इसलिए 1.5 लाख लिया गया।"] : ["Assumes the deposit is made by 5 April each year, so it earns interest for the full year.", "माना गया है कि हर साल 5 अप्रैल तक पैसा जमा होता है, ताकि पूरे साल का ब्याज मिले।"], kind: "note" }],
      split: [{ k: ["Deposits", "जमा"], v: dep, c: c1 }, { k: ["Interest", "ब्याज"], v: bal - dep, c: c2 }],
      table: { head: [["Year", "साल"], ["Deposited", "जमा"], ["Balance", "बैलेंस"]], rows: rows }
    };
  } };

  function emi(p, i, n) { return i ? p * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1) : p / n; }
  C.emi = { compute: function (v) {
    var i = v.rate / 1200, n = Math.round(v.years * 12), e = emi(v.amount, i, n), bal = v.amount, rows = [], yp = 0, yi = 0;
    for (var m = 1; m <= n; m++) {
      var int = bal * i, pr = e - int; bal -= pr; yp += pr; yi += int;
      if (m % 12 === 0 || m === n) { rows.push([Math.ceil(m / 12) + "", yp, yi, Math.max(0, bal)]); yp = yi = 0; }
    }
    var tot = e * n;
    return {
      bigLabel: ["Monthly EMI", "मासिक EMI"], big: e,
      rows: [{ k: ["Loan amount", "लोन रकम"], v: v.amount }, { k: ["Total interest", "कुल ब्याज"], v: tot - v.amount, kind: "add" }, { k: ["Total you pay", "कुल चुकाना"], v: tot, kind: "total" }],
      split: [{ k: ["Principal", "मूलधन"], v: v.amount, c: c1 }, { k: ["Interest", "ब्याज"], v: tot - v.amount, c: c3 }],
      table: { head: [["Year", "साल"], ["Principal paid", "मूलधन चुकाया"], ["Interest paid", "ब्याज चुकाया"], ["Balance left", "बाकी"]], rows: rows }
    };
  } };

  C.prepay = { compute: function (v) {
    var i = v.rate / 1200, n = Math.round(v.years * 12), e0 = emi(v.amount, i, n), I0 = e0 * n - v.amount;
    var bal = v.amount, e = e0, I1 = 0, m = 0, at = Math.max(1, Math.round(v.at)), newE = e0;
    while (bal > 0.5 && m < n) {
      m++; var int = bal * i; I1 += int; bal = bal + int - Math.min(e, bal + int);
      if (bal > 0) bal = Math.max(0, bal - v.extra);
      if (m === at && bal > 0) { bal = Math.max(0, bal - v.lump); if (v.mode === "emi" && bal > 0) { e = emi(bal, i, n - m); newE = e; } }
    }
    var saved = I0 - I1;
    var rows = [{ k: ["Interest without prepaying", "बिना प्रीपेमेंट ब्याज"], v: I0 }, { k: ["Interest with prepaying", "प्रीपेमेंट के साथ ब्याज"], v: I1 }, { k: ["Interest saved", "बचा ब्याज"], v: saved, kind: "total" }];
    if (v.mode === "emi") rows.push({ k: ["EMI before / after", "पहले / बाद की EMI"], v: [e0, newE] });
    rows.push({ k: ["Loan closes in", "लोन खत्म होगा"], v: Math.floor(m / 12) + H.t([" yr ", " साल "]) + (m % 12) + H.t([" mo", " महीने"]) },
      { k: ["Time saved", "समय की बचत"], v: Math.floor((n - m) / 12) + H.t([" yr ", " साल "]) + ((n - m) % 12) + H.t([" mo", " महीने"]) });
    return { bigLabel: ["Interest you save", "आप ब्याज बचाएँगे"], big: saved, sub: H.t(["Original EMI", "मूल EMI"]) + " " + H.inr(e0), rows: rows };
  } };

  C.sip = { compute: function (v) {
    var i = v.rate / 1200, bal = 0, inv = 0, p = v.amount, rows = [];
    for (var y = 1; y <= v.years; y++) {
      for (var m = 0; m < 12; m++) { bal = (bal + p) * (1 + i); inv += p; }
      rows.push([y + "", inv, bal]); p = p * (1 + v.step / 100);
    }
    return {
      bigLabel: ["Expected value", "अनुमानित वैल्यू"], big: bal, sub: H.t(["Gain", "मुनाफ़ा"]) + " <b>" + H.inr(bal - inv) + "</b>",
      rows: [{ k: ["Total invested", "कुल निवेश"], v: inv }, { k: ["Estimated returns", "अनुमानित रिटर्न"], v: bal - inv, kind: "add" }, { k: ["Expected value", "अनुमानित वैल्यू"], v: bal, kind: "total" },
        { k: ["Market returns are not guaranteed. This assumes the same return every year.", "बाज़ार का रिटर्न तय नहीं है। यह हर साल एक जैसा रिटर्न मानकर है।"], kind: "note" }],
      split: [{ k: ["Invested", "निवेश"], v: inv, c: c1 }, { k: ["Returns", "रिटर्न"], v: bal - inv, c: c2 }],
      table: { head: [["Year", "साल"], ["Invested", "निवेश"], ["Value", "वैल्यू"]], rows: rows }
    };
  } };

  C.hra = { compute: function (v) {
    var sal = (v.basic + v.da) * v.months, hra = v.hra * v.months, rent = v.rent * v.months;
    var a = hra, b = Math.max(0, rent - sal * .1), c = sal * (v.metro === "yes" ? .5 : .4), ex = Math.max(0, Math.min(a, b, c));
    return {
      bigLabel: ["HRA exempt from tax", "टैक्स-फ़्री HRA"], big: ex, sub: H.t(["Taxable HRA", "टैक्स योग्य HRA"]) + " " + H.inr(hra - ex),
      rows: [{ k: ["Actual HRA received", "मिला हुआ HRA"], v: a }, { k: ["Rent paid minus 10% of salary", "किराया घटा सैलरी का 10%"], v: b },
        { k: [(v.metro === "yes" ? "50" : "40") + "% of salary (basic + DA)", "सैलरी (बेसिक + DA) का " + (v.metro === "yes" ? "50" : "40") + "%"], v: c },
        { k: ["Exempt HRA (the lowest of the three)", "छूट वाला HRA (तीनों में सबसे कम)"], v: ex, kind: "total" },
        { k: ["HRA exemption is available only in the old tax regime.", "HRA छूट सिर्फ़ पुरानी टैक्स व्यवस्था में मिलती है।"], kind: "note" }]
    };
  } };

  C.age = {
    prepare: function (v, form) { var a = form.querySelector('[name="asof"]'); if (a && !a.value) { a.value = new Date().toISOString().slice(0, 10); v.asof = a.value; } },
    compute: function (v) {
      if (!v.dob) return { bigLabel: ["Enter your date of birth", "जन्म तिथि डालें"], big: "-", rows: [] };
      var d = new Date(v.dob + "T00:00:00"), t = new Date((v.asof || new Date().toISOString().slice(0, 10)) + "T00:00:00");
      if (t < d) throw new Error(H.t(["The 'as on' date is before the date of birth.", "'तारीख तक' जन्म तिथि से पहले है।"]));
      var y = t.getFullYear() - d.getFullYear(), m = t.getMonth() - d.getMonth(), dd = t.getDate() - d.getDate();
      if (dd < 0) { m--; dd += new Date(t.getFullYear(), t.getMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }
      var days = Math.round((t - d) / 864e5), nb = new Date(t.getFullYear(), d.getMonth(), d.getDate());
      if (nb <= t) nb.setFullYear(t.getFullYear() + 1);
      var toNext = Math.round((nb - t) / 864e5), loc = H.lang() === "hi" ? "hi-IN" : "en-IN";
      var yl = H.t([" years, ", " साल, "]), ml = H.t([" months, ", " महीने, "]), dl = H.t([" days", " दिन"]);
      return {
        bigLabel: ["Age", "उम्र"], big: y + yl + m + ml + dd + dl,
        sub: H.t(["as on", "तारीख"]) + " " + t.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" }),
        rows: [{ k: ["Total months", "कुल महीने"], v: y * 12 + m, fmt: "num" }, { k: ["Total weeks", "कुल हफ़्ते"], v: Math.floor(days / 7), fmt: "num" },
          { k: ["Total days", "कुल दिन"], v: days, fmt: "num" }, { k: ["Born on a", "जन्म का दिन"], v: d.toLocaleDateString(loc, { weekday: "long" }) },
          { k: ["Next birthday in", "अगला जन्मदिन"], v: toNext + dl },
          { k: ["For exam forms, set 'as on' to the cut-off date in the notification, such as 1 August.", "परीक्षा फ़ॉर्म के लिए 'तारीख तक' में नोटिफ़िकेशन की कट-ऑफ़ तारीख डालें, जैसे 1 अगस्त।"], kind: "note" }]
      };
    } };

  C.percent = { compute: function (v) {
    var a = v.a, b = v.b, r, line;
    switch (v.mode) {
      case "what": r = b ? a / b * 100 : NaN; line = [H.num(a) + " is " + H.num(r) + "% of " + H.num(b), H.num(a), H.num(b) + " का " + H.num(r) + "% है"]; break;
      case "change": r = a ? (b - a) / Math.abs(a) * 100 : NaN; line = ["From " + H.num(a) + " to " + H.num(b) + " is a " + (r >= 0 ? "rise" : "fall") + " of " + H.num(Math.abs(r)) + "%", H.num(a) + " से " + H.num(b) + " में " + H.num(Math.abs(r)) + "% " + (r >= 0 ? "बढ़त" : "गिरावट")]; break;
      case "add": r = b * (1 + a / 100); line = [H.num(b) + " + " + H.num(a) + "% = " + H.num(r), H.num(b) + " + " + H.num(a) + "% = " + H.num(r)]; break;
      case "remove": r = b * (1 - a / 100); line = [H.num(b) + " − " + H.num(a) + "% = " + H.num(r), H.num(b) + " − " + H.num(a) + "% = " + H.num(r)]; break;
      default: r = a * b / 100; line = [H.num(a) + "% of " + H.num(b) + " = " + H.num(r), H.num(b) + " का " + H.num(a) + "% = " + H.num(r)];
    }
    if (v.mode === "what") line = [line[0], line[1] + " " + line[2]];
    var pct = v.mode === "what" || v.mode === "change";
    return { bigLabel: ["Answer", "जवाब"], big: isFinite(r) ? H.num(pct ? Math.abs(r) : r) + (pct ? "%" : "") : "-", rows: [{ k: line, kind: "note" }] };
  } };
})();
