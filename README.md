# Hisaab

Free Indian money calculators that run in the browser: income tax (old vs new, FY 2026-27), in-hand salary, GST, FD, RD, PPF, SIP, EMI, loan prepayment, HRA, age and percentage. English and Hindi, dark mode, works offline, results shareable by link.

## Editing

- Pages, fields, wording and FAQs: `_build/pages.py`
- Maths: `assets/calcs.js` (tax engine at the top: slabs, 87A rebate + marginal relief, surcharge with marginal relief, 4% cess)
- Ledger drawing, formats, link state: `assets/core.js`

```
python _build/build.py   # writes every page, sitemap.xml, robots.txt, sw.js
python _build/icons.py   # icons + assets/og.png
```

## Every year

Tax slabs and limits change with each Budget and small-savings rates every quarter. Review `NEW`, `oldSlabs`, rebate and surcharge in `calcs.js`, the PPF default rate and the "as of" labels in `pages.py`, then bump `CACHE` in `_build/sw.tpl.js`.
