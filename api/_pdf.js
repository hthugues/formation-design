// Génération du manuel du participant (PDF), avec polices intégrées, illustrations et graphiques vectoriels.
import { readFile } from "node:fs/promises";
import { PDFDocument, rgb, degrees, pushGraphicsState, popGraphicsState, moveTo, lineTo, closePath, clip, endPath, appendBezierCurve } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { MODULES, ERREURS } from "./_manuel-data.js";
import { QUESTIONS } from "./_quiz-data.js";
import { LOGO_PNG, LOGO_BLANC } from "./_logo.js";

const hx = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  lagon: hx("#0F4C5C"), lagon2: hx("#2F6E7D"), lagonFonce: hx("#0B3A46"), lagonClair: hx("#E7F0F2"), ciel: hx("#8FC1CC"),
  ocre: hx("#E3A23B"), ocreInk: hx("#8A5D0E"), ocreClair: hx("#F8EBD3"),
  ink: hx("#2B2D2F"), soft: hx("#5A5F62"), mute: hx("#8B9094"),
  sable: hx("#FAF7F2"), gres: hx("#E4DED3"), blanc: rgb(1, 1, 1),
  vert: hx("#4F8A5B"), vertClair: hx("#E3F0E5"), rouge: hx("#C0453A"), rougeClair: hx("#F7E1DE"), corail: hx("#C9654B")
};
const PIL = { Montrer: hx("#0F4C5C"), Apprendre: hx("#4F8A5B"), Coulisses: hx("#E3A23B"), Preuve: hx("#C9654B"), "Offre commerciale": hx("#8C3B5E") };
const NOMS = { P: "Atelier de départ - Mon projet", A: "Atelier A - Ma phrase de positionnement", B: "Atelier B - Ma mini-charte", C: "Atelier C - Mon profil digital", D: "Atelier D - Mes 2 prochaines semaines", QUIZ: "Quiz final" };
const REMPL = { "–": "-", "—": "-", "−": "-", "→": "->", "←": "<-", "✓": "", "★": "*", " ": " ", " ": " ", " ": " " };

let polices;
async function chargerPolices() {
  if (polices) return polices;
  const f = (n) => readFile(new URL(`./_fonts/${n}`, import.meta.url));
  const [reg, semi, bold, ti, it] = await Promise.all(["Inter-Regular.ttf", "Inter-SemiBold.ttf", "Inter-Bold.ttf", "Playfair-Bold.ttf", "Playfair-Italic.ttf"].map(f));
  return (polices = { reg, semi, bold, ti, it });
}

export async function genererPdf(d) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`Manuel du participant - ${d.nom || "Participant"}`);
  pdf.setAuthor("Hugues Hamba - B-Lossom Center");
  pdf.setSubject("Identité visuelle & Marketing digital");
  const P = await chargerPolices();
  const F = {};
  for (const k of Object.keys(P)) F[k] = await pdf.embedFont(P[k], { subset: false });
  const jeux = new Map();
  const net = (t, font = F.reg) => {
    if (!jeux.has(font)) jeux.set(font, new Set(font.getCharacterSet()));
    const ok = jeux.get(font);
    return String(t == null ? "" : t).split("").map((ch) => (REMPL[ch] !== undefined ? REMPL[ch] : ok.has(ch.codePointAt(0)) || ch === "\n" ? ch : "")).join("");
  };
  const logo = await pdf.embedPng(Buffer.from(LOGO_PNG, "base64"));
  const logoBlanc = await pdf.embedPng(Buffer.from(LOGO_BLANC, "base64"));
  const IMG = {}; // photos du participant (atelier C)
  for (const [k, v] of Object.entries(d.photos || {})) {
    const m = String(v || "").match(/^data:image\/(jpeg|png);base64,(.+)$/);
    if (!m) continue;
    try { IMG[k] = m[1] === "png" ? await pdf.embedPng(Buffer.from(m[2], "base64")) : await pdf.embedJpg(Buffer.from(m[2], "base64")); } catch {}
  }
  const W = 595.28, H = 841.89, M = 50, CW = W - 2 * M, BAS = 64;
  let page, y, moduleCourant = "";
  const pagesSans = new Set(); // pages sans pied de page
  const ancres = {};

  /* ---------- outils de dessin ---------- */
  const wid = (t, f, s) => f.widthOfTextAtSize(net(t, f), s);
  function tx(p, t, x, yb, s, f, c, al) {
    const v = net(t, f); if (!v) return;
    const w = f.widthOfTextAtSize(v, s);
    p.drawText(v, { x: al === "c" ? x - w / 2 : al === "r" ? x - w : x, y: yb, size: s, font: f, color: c });
  }
  function wrap(t, f, s, w) {
    const out = [];
    for (const para of net(t, f).split("\n")) {
      let l = "";
      for (const m of para.split(/\s+/)) {
        if (!m) continue;
        const e = l ? l + " " + m : m;
        if (f.widthOfTextAtSize(e, s) > w && l) { out.push(l); l = m; } else l = e;
      }
      out.push(l);
    }
    return out;
  }
  function txw(p, t, x, top, s, f, c, w, lh = 1.35, al) { // texte multiligne, renvoie la hauteur
    const L = wrap(t, f, s, w);
    L.forEach((l, i) => tx(p, l, al === "c" ? x + w / 2 : x, top - s - i * s * lh, s, f, c, al));
    return L.length * s * lh;
  }
  function rr(p, x, yb, w, h, r, o = {}) {
    r = Math.min(r, w / 2, h / 2);
    const d = `M${r},0 H${w - r} Q${w},0 ${w},${r} V${h - r} Q${w},${h} ${w - r},${h} H${r} Q0,${h} 0,${h - r} V${r} Q0,0 ${r},0 Z`;
    p.drawSvgPath(d, { x, y: yb + h, color: o.color, borderColor: o.border, borderWidth: o.bw || (o.border ? 1 : 0), opacity: o.opacity, borderOpacity: o.opacity });
  }
  function poly(p, pts, o = {}) {
    const d = pts.map(([a, b], i) => `${i ? "L" : "M"}${a.toFixed(2)},${(-b).toFixed(2)}`).join(" ") + (o.ouvert ? "" : " Z");
    p.drawSvgPath(d, { x: 0, y: 0, color: o.ouvert ? undefined : o.color, borderColor: o.border, borderWidth: o.bw || (o.border ? 1 : 0), opacity: o.opacity, borderOpacity: o.bopacity });
  }
  const ligne = (p, x1, y1, x2, y2, c = C.gres, e = 1, dash) => p.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: e, color: c, dashArray: dash });
  function anneau(p, cx, cy, r1, r2, a0, a1, c, o) { // secteur d'anneau, angles en degrés (0 = haut, sens horaire)
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 4)), pts = [];
    const pt = (r, a) => [cx + r * Math.sin(a * Math.PI / 180), cy + r * Math.cos(a * Math.PI / 180)];
    for (let i = 0; i <= n; i++) pts.push(pt(r2, a0 + (a1 - a0) * i / n));
    for (let i = n; i >= 0; i--) pts.push(pt(r1, a0 + (a1 - a0) * i / n));
    poly(p, pts, { color: c, opacity: o });
  }
  function coche(p, cx, cy, s, c = C.vert) { poly(p, [[cx - s * .55, cy], [cx - s * .15, cy - s * .4], [cx + s * .6, cy + s * .45]], { ouvert: true, border: c, bw: s * .28 }); }
  function croix(p, cx, cy, s, c = C.rouge) { ligne(p, cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2, c, s * .25); ligne(p, cx - s / 2, cy + s / 2, cx + s / 2, cy - s / 2, c, s * .25); }
  function clipRect(p, x, yb, w, h) { p.pushOperators(pushGraphicsState(), moveTo(x, yb), lineTo(x + w, yb), lineTo(x + w, yb + h), lineTo(x, yb + h), closePath(), clip(), endPath()); }
  function clipCercle(p, cx, cy, r) {
    const k = 0.5523 * r;
    p.pushOperators(pushGraphicsState(), moveTo(cx + r, cy), appendBezierCurve(cx + r, cy + k, cx + k, cy + r, cx, cy + r), appendBezierCurve(cx - k, cy + r, cx - r, cy + k, cx - r, cy),
      appendBezierCurve(cx - r, cy - k, cx - k, cy - r, cx, cy - r), appendBezierCurve(cx + k, cy - r, cx + r, cy - k, cx + r, cy), closePath(), clip(), endPath());
  }
  const finClip = (p) => p.pushOperators(popGraphicsState());
  function imgCouvre(p, img, x, yb, w, h) { const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s; p.drawImage(img, { x: x + (w - iw) / 2, y: yb + (h - ih) / 2, width: iw, height: ih }); }
  function melange(a, b, t) { return rgb(a.red + (b.red - a.red) * t, a.green + (b.green - a.green) * t, a.blue + (b.blue - a.blue) * t); }
  function hsl(h, s, l) { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return rgb(f(0), f(8), f(4)); }
  function marque(p, cx, cy, r, gris) { // petit logo fictif « soleil sur la mer »
    p.drawCircle({ x: cx, y: cy, size: r, color: gris ? hx("#222222") : C.lagon });
    p.drawCircle({ x: cx, y: cy + r * .05, size: r * .42, color: gris ? hx("#BBBBBB") : C.ocre });
    p.drawRectangle({ x: cx - r * .8, y: cy - r * .75, width: r * 1.6, height: r * .7, color: gris ? hx("#222222") : C.lagon });
    const v = []; for (let i = 0; i <= 20; i++) { const t = i / 20; v.push([cx - r * .7 + t * r * 1.4, cy - r * .12 + Math.sin(t * Math.PI * 2) * r * .1]); }
    poly(p, v, { ouvert: true, border: C.blanc, bw: Math.max(.8, r * .1) });
  }
  function pastille(p, t, x, yb, s, f, fond, encre, pad = 6) { const w = wid(t, f, s) + pad * 2; rr(p, x, yb, w, s + 8, (s + 8) / 2, { color: fond }); tx(p, t, x + pad, yb + 4 + s * .12, s, f, encre); return w; }
  function numero(p, n, cx, cy, r = 8, fond = C.ocre, encre = C.blanc) { p.drawCircle({ x: cx, y: cy, size: r, color: fond }); tx(p, String(n), cx, cy - r * .38, r * 1.05, F.bold, encre, "c"); }

  /* ---------- mise en page ---------- */
  function nouvellePage(entete = true) {
    page = pdf.addPage([W, H]); y = H - M;
    if (entete) {
      tx(page, moduleCourant.toUpperCase(), M, H - 30, 7.5, F.semi, C.mute);
      const lw = 62, lh = lw * logo.height / logo.width; page.drawImage(logo, { x: W - M - lw, y: H - 22 - lh * .78, width: lw, height: lh });
      ligne(page, M, H - 38, W - M - lw - 10, H - 38, C.gres, .6);
      y = H - 62;
    }
    return page;
  }
  function place(h) { if (y - h < BAS) nouvellePage(); }
  function para(t, o = {}) {
    const f = o.f || F.reg, s = o.s || 10.3, lh = o.lh || 1.5, c = o.c || C.ink, x = o.x || M, w = o.w || CW;
    for (const l of wrap(t, f, s, w)) { place(s * lh); tx(page, l, x, y - s, s, f, c); y -= s * lh; }
    y -= o.gap ?? 7;
  }
  function ouvertureModule(m, i) {
    moduleCourant = `Module ${m.num} · ${m.titre}`;
    nouvellePage(false);
    ancres["m" + i] = pdf.getPageCount();
    const tl = wrap(m.titre, F.ti, 30, CW - 120), il = wrap(m.intro, F.reg, 11, CW - 140);
    const hb = Math.max(230, 140 + tl.length * 36 + il.length * 16 + 26);
    page.drawRectangle({ x: 0, y: H - hb, width: W, height: hb, color: C.lagon });
    page.drawCircle({ x: W - 40, y: H - 30, size: 130, color: C.lagon2, opacity: .55 });
    page.drawCircle({ x: W - 110, y: H - hb + 10, size: 46, color: C.ocre, opacity: .9 });
    const lw = 80, lh = lw * logoBlanc.height / logoBlanc.width; page.drawImage(logoBlanc, { x: M, y: H - 34 - lh * .8, width: lw, height: lh * 1 });
    tx(page, `MODULE ${m.num}`, M, H - 112, 10, F.bold, C.ocre);
    let yy = H - 122;
    for (const l of tl) { tx(page, l, M, yy - 30, 30, F.ti, C.blanc); yy -= 36; }
    yy -= 6;
    for (const l of il) { tx(page, l, M, yy - 11, 11, F.reg, hx("#D6E8EC")); yy -= 16; }
    y = H - hb - 34;
  }
  function titreSection(num, t) {
    place(70);
    tx(page, num, M, y - 12, 9.5, F.bold, C.ocre);
    const L = wrap(t, F.ti, 17, CW - 34);
    L.forEach((l, i) => tx(page, l, M + 30, y - 15 - i * 21, 17, F.ti, C.lagon));
    y -= 15 + (L.length - 1) * 21 + 6;
    page.drawRectangle({ x: M + 30, y: y - 2, width: 34, height: 2, color: C.ocre });
    y -= 14;
  }
  function encadre(type, contenu) {
    const st = {
      retenir: { titre: "À RETENIR", fond: C.lagonClair, barre: C.lagon, encre: C.lagon },
      exemple: { titre: "EXEMPLE", fond: C.ocreClair, barre: C.ocre, encre: C.ocreInk },
      astuce: { titre: "ASTUCE", fond: C.vertClair, barre: C.vert, encre: C.vert }
    }[type];
    const lignes = Array.isArray(contenu) ? contenu : [contenu];
    const iw = CW - 46, s = 10;
    const blocs = lignes.map((l) => wrap(l, type === "exemple" ? F.it : F.reg, type === "exemple" ? 10.8 : s, iw - (Array.isArray(contenu) ? 14 : 0)));
    const h = 30 + blocs.reduce((a, b) => a + b.length * 14.5 + 3, 0) + 6;
    place(h + 8);
    rr(page, M, y - h, CW, h, 8, { color: st.fond });
    page.drawRectangle({ x: M, y: y - h + 8, width: 3.5, height: h - 16, color: st.barre });
    // pictogramme
    const px = M + 22, py = y - 17;
    page.drawCircle({ x: px, y: py, size: 8, color: st.barre });
    if (type === "retenir") tx(page, "!", px, py - 3.8, 10.5, F.bold, C.blanc, "c");
    if (type === "exemple") tx(page, "e", px, py - 3.3, 10, F.it, C.blanc, "c");
    if (type === "astuce") { page.drawCircle({ x: px, y: py + 1.5, size: 3.2, color: C.blanc }); page.drawRectangle({ x: px - 1.6, y: py - 5, width: 3.2, height: 3, color: C.blanc }); }
    tx(page, st.titre, M + 36, y - 20, 8.5, F.bold, st.encre);
    let yy = y - 34;
    blocs.forEach((L) => {
      L.forEach((l, i) => {
        if (i === 0 && Array.isArray(contenu)) page.drawCircle({ x: M + 40, y: yy - 6.5, size: 2.1, color: st.barre });
        tx(page, l, M + 36 + (Array.isArray(contenu) ? 12 : 0), yy - 10.3, type === "exemple" ? 10.8 : s, type === "exemple" ? F.it : F.reg, C.ink); yy -= 14.5;
      });
      yy -= 3;
    });
    y -= h + 12;
  }
  function illustration(cle) {
    const f = ILL[cle]; if (!f) return;
    place(f.h + 16);
    y -= 6;
    f.d(page, M, y, CW);
    y -= f.h + 14;
  }

  /* ---------- illustrations du cours ---------- */
  const ILL = {
    deuxMoities: { h: 128, d(p, x, top, w) {
      const bw = (w - 46) / 2, bh = 84;
      rr(p, x, top - bh, bw, bh, 12, { color: C.lagon });
      tx(p, "IDENTITÉ VISUELLE", x + bw / 2, top - 28, 10, F.bold, C.ocre, "c");
      tx(p, "Ce que vous montrez", x + bw / 2, top - 50, 15, F.it, C.blanc, "c");
      [C.ocre, C.sable, C.ciel].forEach((c, i) => p.drawCircle({ x: x + bw / 2 - 18 + i * 18, y: top - 68, size: 5.5, color: c }));
      const x2 = x + bw + 46;
      rr(p, x2, top - bh, bw, bh, 12, { color: C.ocreClair, border: C.ocre });
      tx(p, "MARKETING DIGITAL", x2 + bw / 2, top - 28, 10, F.bold, C.ocreInk, "c");
      tx(p, "Comment, où et quand", x2 + bw / 2, top - 50, 15, F.it, C.ink, "c");
      [0, 1, 2].forEach((i) => rr(p, x2 + bw / 2 - 26 + i * 18, top - 74, 14, 11, 2.5, { color: i === 1 ? C.ocre : C.lagon }));
      numero(p, "+", x + bw + 23, top - bh / 2, 14, C.ocre);
      ligne(p, x + w / 2, top - bh - 4, x + w / 2, top - bh - 18, C.lagon, 1.2);
      poly(p, [[x + w / 2 - 4, top - bh - 16], [x + w / 2 + 4, top - bh - 16], [x + w / 2, top - bh - 22]], { color: C.lagon });
      tx(p, "Une marque reconnue, et visible là où sont vos clients", x + w / 2, top - bh - 38, 10.5, F.semi, C.lagon, "c");
    } },
    iceberg: { h: 182, d(p, x, top, w) {
      const eau = top - 56, cx = x + 150;
      rr(p, x, top - 182, w, 182 - 56, 8, { color: C.lagonClair });
      page.drawRectangle({ x, y: eau - 8, width: w, height: 8, color: C.lagonClair });
      const v = []; for (let i = 0; i <= 60; i++) v.push([x + i * w / 60, eau + Math.sin(i * .9) * 1.6]);
      poly(p, v, { ouvert: true, border: C.lagon2, bw: 1.2 });
      poly(p, [[cx, top - 4], [cx - 46, eau], [cx + 46, eau]], { color: C.blanc, border: C.lagon, bw: 1.2 });
      tx(p, "Logo", cx, eau + 10, 9.5, F.bold, C.lagon, "c");
      poly(p, [[cx - 46, eau], [cx + 46, eau], [cx + 118, top - 116], [cx - 128, top - 116]], { color: C.lagon2 });
      poly(p, [[cx - 128, top - 116], [cx + 118, top - 116], [cx + 78, top - 176], [cx - 92, top - 176]], { color: C.lagonFonce });
      tx(p, "Identité visuelle", cx, top - 92, 11, F.semi, C.blanc, "c");
      tx(p, "Marque", cx, top - 152, 11, F.semi, C.blanc, "c");
      const ax = x + 315;
      [[top - 30, "La signature", "ce qu'on reconnaît d'un coup d'œil"], [top - 88, "La tenue complète", "couleurs, polices, photos, ton"], [top - 146, "La réputation", "ce que l'on dit de vous"]].forEach(([yy, a, b], i) => {
        ligne(p, [cx + 30, cx + 92, cx + 102][i], yy + 4, ax - 8, yy + 4, C.lagon, .7, [2, 2]);
        p.drawCircle({ x: ax - 8, y: yy + 4, size: 2.2, color: C.ocre });
        tx(p, a, ax, yy + 6, 10.5, F.bold, C.lagon); tx(p, b, ax, yy - 7, 9, F.reg, C.soft);
      });
    } },
    temple: { h: 186, d(p, x, top, w) {
      const cx = x + w / 2;
      poly(p, [[cx, top - 2], [cx - 178, top - 54], [cx + 178, top - 54]], { color: C.lagon });
      tx(p, "MA MARQUE", cx, top - 44, 11.5, F.bold, C.blanc, "c");
      p.drawRectangle({ x: cx - 168, y: top - 63, width: 336, height: 9, color: C.ocre });
      [["CIBLE", "Pour qui ?"], ["VALEURS", "En quoi je crois ?"], ["POSITIONNEMENT", "Pourquoi moi ?"]].forEach(([a, b], i) => {
        const ox = cx + (i - 1) * 118 - 46;
        p.drawRectangle({ x: ox, y: top - 140, width: 92, height: 77, color: C.lagonClair, borderColor: C.lagon, borderWidth: .8 });
        for (let k = 1; k < 4; k++) ligne(p, ox + k * 23, top - 136, ox + k * 23, top - 67, C.ciel, .6);
        p.drawRectangle({ x: ox + 6, y: top - 110, width: 80, height: 18, color: C.blanc });
        tx(p, a, ox + 46, top - 104.5, a.length > 10 ? 7.8 : 9, F.bold, C.lagon, "c");
        tx(p, b, ox + 46, top - 166, 11, F.it, C.ink, "c");
      });
      p.drawRectangle({ x: cx - 180, y: top - 149, width: 360, height: 9, color: C.lagon });
    } },
    formule: { h: 78, d(p, x, top, w) {
      const ch = [["Pour", "la cible", C.lagon], ["qui", "le besoin", C.lagon2], ["[marque] est", "la catégorie", C.vert], ["qui", "le bénéfice", C.corail], ["grâce à", "la preuve", C.ocre]];
      const gap = 7, cw = (w - gap * 4) / 5;
      ch.forEach(([a, b, c], i) => {
        const ox = x + i * (cw + gap), fort = i === 4;
        rr(p, ox, top - 50, cw, 50, 9, { color: fort ? C.ocre : C.blanc, border: c, bw: 1.3 });
        tx(p, a, ox + cw / 2, top - 18, 8.5, F.reg, fort ? C.blanc : C.soft, "c");
        tx(p, b, ox + cw / 2, top - 36, 11, F.bold, fort ? C.blanc : c, "c");
        if (i < 4) tx(p, "›", ox + cw + gap / 2, top - 30, 12, F.bold, C.mute, "c");
      });
      tx(p, "le mot qui rend la promesse crédible", x + w, top - 68, 8.5, F.semi, C.ocreInk, "r");
    } },
    polices: { h: 134, d(p, x, top, w) {
      const bw = (w - 16) / 2;
      [[F.ti, "Avec empattements", "tradition · élégance · haut de gamme"], [F.bold, "Sans empattements", "modernité · clarté · lisible à l'écran"]].forEach(([f, a, b], i) => {
        const ox = x + i * (bw + 16);
        rr(p, ox, top - 132, bw, 132, 10, { color: C.sable, border: C.gres });
        tx(p, "Aa", ox + bw / 2, top - 76, 62, f, C.lagon, "c");
        tx(p, a, ox + bw / 2, top - 100, 11, F.bold, C.ink, "c");
        tx(p, b, ox + bw / 2, top - 116, 9, F.reg, C.soft, "c");
      });
      // repère des empattements
      p.drawCircle({ x: x + bw / 2 - 38, y: top - 77, size: 7, borderColor: C.ocre, borderWidth: 1.2 });
      tx(p, "empattement", x + bw / 2 - 52, top - 26, 7.5, F.semi, C.ocreInk, "c");
      ligne(p, x + bw / 2 - 48, top - 30, x + bw / 2 - 40, top - 70, C.ocre, .6);
    } },
    decode: { h: 128, d(p, x, top, w) {
      const bw = (w - 16) / 2;
      [["WWF", [hx("#111111"), C.blanc], ["nature", "protection", "sérieux", "simplicité"], "Un panda noir et blanc, des formes pleines : reproductible partout, même au crayon."],
       ["Coca-Cola", [hx("#E41E2B"), C.blanc], ["énergie", "plaisir", "tradition", "partage"], "Un rouge vif et une écriture manuscrite presque inchangée depuis plus d'un siècle."]].forEach(([n, cols, adj, txt], i) => {
        const ox = x + i * (bw + 16);
        rr(p, ox, top - 126, bw, 126, 10, { color: C.blanc, border: C.gres });
        tx(p, n, ox + 14, top - 24, 15, F.ti, C.ink);
        cols.forEach((c, k) => p.drawCircle({ x: ox + bw - 22 - k * 20, y: top - 19, size: 7.5, color: c, borderColor: C.gres, borderWidth: .8 }));
        txw(p, txt, ox + 14, top - 34, 8.8, F.reg, C.soft, bw - 28, 1.4);
        tx(p, "ON Y LIT", ox + 14, top - 84, 7.5, F.bold, C.mute);
        let cx = ox + 14, cy = top - 108;
        adj.forEach((a) => { const pw = wid(a, F.semi, 8.5) + 12; if (cx + pw > ox + bw - 10) { cx = ox + 14; cy -= 20; } pastille(p, a, cx, cy, 8.5, F.semi, i ? C.rougeClair : C.lagonClair, i ? C.rouge : C.lagon); cx += pw + 5; });
      });
    } },
    logoTailles: { h: 128, d(p, x, top, w) {
      rr(p, x, top - 126, w, 126, 10, { color: C.sable });
      const items = [[44, "Affiche, enseigne"], [26, "Photo de profil"], [12, "Icône de 40 px"], [26, "Noir et blanc", true]];
      items.forEach(([r, l, g], i) => {
        const cx = x + w * (i + .5) / 4, cy = top - 60;
        marque(p, cx, cy, r, g);
        tx(p, l, cx, top - 116, 9, F.semi, C.ink, "c");
        coche(p, cx, top - 98, 8);
      });
    } },
    couleurs: { h: 170, d(p, x, top, w) {
      const cx = x + 82, cy = top - 84;
      for (let i = 0; i < 12; i++) anneau(p, cx, cy, 36, 76, i * 30 + 1, i * 30 + 29, hsl(i * 30 + 10, .62, .55));
      // repères : voisines et opposées
      anneau(p, cx, cy, 78, 82, 150 + 1, 210 - 1, C.lagon);
      anneau(p, cx, cy, 78, 82, 330 + 1, 389, C.ocre);
      ligne(p, cx + 30 * Math.sin(195 * Math.PI / 180), cy + 30 * Math.cos(195 * Math.PI / 180), cx + 30 * Math.sin(15 * Math.PI / 180), cy + 30 * Math.cos(15 * Math.PI / 180), C.ink, .8, [2, 2]);
      tx(p, "cercle chromatique", cx, top - 168, 8, F.semi, C.mute, "c");
      const rx = x + 190, rw = w - 190;
      const ligneEx = (yy, t, d, cols) => { tx(p, t, rx, yy, 10, F.bold, C.ink); tx(p, d, rx, yy - 13, 8.8, F.reg, C.soft); cols.forEach((c, k) => rr(p, rx + rw - 84 + k * 28, yy - 16, 24, 24, 5, { color: c })); };
      ligneEx(top - 14, "Couleurs voisines", "harmonie douce et calme", [hsl(170, .62, .45), hsl(195, .62, .45), hsl(220, .62, .5)]);
      ligneEx(top - 52, "Couleurs opposées", "contraste et énergie, parfait pour l'accent", [hsl(195, .62, .35), hsl(35, .78, .55)]);
      tx(p, "LA RÈGLE 60-30-10", rx, top - 86, 7.5, F.bold, C.mute);
      const parts = [[.6, hx("#EDE6DA"), "60 % neutre", C.ink], [.3, C.lagon, "30 % principale", C.blanc], [.1, C.ocre, "10 %", C.blanc]];
      let ox = rx;
      parts.forEach(([f, c, l, e]) => { p.drawRectangle({ x: ox, y: top - 118, width: rw * f, height: 26, color: c }); tx(p, l, ox + rw * f / 2, top - 109, 8.5, F.semi, e, "c"); ox += rw * f; });
      tx(p, "accent", rx + rw - rw * .05, top - 130, 7.5, F.semi, C.ocreInk, "c");
      rr(p, rx, top - 166, rw / 2 - 6, 26, 5, { color: C.sable, border: C.gres });
      tx(p, "Bien lisible", rx + 10, top - 157, 10, F.bold, C.lagon); coche(p, rx + rw / 2 - 20, top - 153, 9);
      rr(p, rx + rw / 2 + 6, top - 166, rw / 2 - 6, 26, 5, { color: C.blanc, border: C.gres });
      tx(p, "Peu lisible", rx + rw / 2 + 16, top - 157, 10, F.bold, hx("#EFE2A2")); croix(p, rx + rw - 20, top - 153, 8);
    } },
    composer: { h: 196, d(p, x, top, w) {
      const fw = 150, fh = 172, ax = x + 30, bx = x + w - 30 - fw;
      // avant
      p.drawRectangle({ x: ax, y: top - fh, width: fw, height: fh, color: C.blanc, borderColor: C.gres, borderWidth: 1 });
      p.drawRectangle({ x: ax + 8, y: top - 62, width: 60, height: 40, color: hx("#9BD86A") });
      p.drawRectangle({ x: ax + 80, y: top - 90, width: 60, height: 34, color: hx("#F4A6C8") });
      p.drawCircle({ x: ax + 120, y: top - 30, size: 18, color: hx("#FFE14D") });
      p.drawText(net("PROMO !!!"), { x: ax + 14, y: top - 100, size: 19, font: F.bold, color: hx("#E3342F"), rotate: degrees(9) });
      p.drawText(net("Super prix"), { x: ax + 70, y: top - 112, size: 11, font: F.ti, color: hx("#2E7D32"), rotate: degrees(-6) });
      p.drawText(net("Vanille"), { x: ax + 10, y: top - 135, size: 17, font: F.it, color: hx("#3F51B5") });
      p.drawText(net("Appelez vite !!"), { x: ax + 72, y: top - 140, size: 9, font: F.bold, color: hx("#9C27B0"), rotate: degrees(4) });
      p.drawText(net("Livraison - Qualité - Pas cher"), { x: ax + 6, y: top - 160, size: 7, font: F.reg, color: hx("#FF6F00") });
      tx(p, "Avant", ax + fw / 2, top - fh - 18, 10, F.bold, C.rouge, "c");
      // après
      p.drawRectangle({ x: bx, y: top - fh, width: fw, height: fh, color: C.sable, borderColor: C.gres, borderWidth: 1 });
      tx(p, "Vanille", bx + 16, top - 34, 18, F.ti, C.lagon); tx(p, "de Nosy Be", bx + 16, top - 52, 13, F.it, C.lagon);
      rr(p, bx + 16, top - 118, fw - 32, 56, 6, { color: C.lagonClair });
      p.drawCircle({ x: bx + fw - 44, y: top - 80, size: 8, color: C.ocre });
      poly(p, [[bx + 16, top - 118], [bx + 52, top - 84], [bx + 76, top - 104], [bx + 96, top - 92], [bx + fw - 16, top - 118]], { color: C.lagon2 });
      tx(p, "Achat direct aux producteurs", bx + 16, top - 132, 7.5, F.reg, C.soft);
      rr(p, bx + 16, top - 160, 76, 18, 9, { color: C.ocre });
      tx(p, "Commander", bx + 54, top - 154.5, 8, F.bold, C.blanc, "c");
      tx(p, "Après", bx + fw / 2, top - fh - 18, 10, F.bold, C.vert, "c");
      // flèche
      const mx1 = ax + fw + 14, mx2 = bx - 14, my = top - fh / 2;
      ligne(p, mx1, my, mx2 - 6, my, C.ocre, 2);
      poly(p, [[mx2 - 8, my + 6], [mx2, my], [mx2 - 8, my - 6]], { color: C.ocre });
      tx(p, "5 règles", (mx1 + mx2) / 2, my + 10, 9.5, F.bold, C.ocreInk, "c");
      ["gommer", "aligner", "espacer", "marges", "l'essentiel"].forEach((r, i) => tx(p, r, (mx1 + mx2) / 2, my - 18 - i * 12, 8, F.reg, C.soft, "c"));
    } },
    parcours: { h: 92, d(p, x, top, w) {
      const et = [["Découvrir", "une vidéo, un post"], ["S'intéresser", "la page, le profil"], ["Contacter", "WhatsApp, Messenger"], ["Acheter", "réservation, paiement"], ["Recommander", "avis Google, partage"]];
      const cw = w / 5;
      et.forEach(([a, b], i) => {
        const ox = x + i * cw, c = melange(C.lagon, C.ocre, i / 4);
        const pts = [[ox, top], [ox + cw - 10, top], [ox + cw + 4, top - 20], [ox + cw - 10, top - 40], [ox, top - 40]];
        if (i) pts.push([ox + 14, top - 20]);
        poly(p, pts, { color: c });
        tx(p, a, ox + cw / 2 + (i ? 4 : -2), top - 24, 9.5, F.bold, C.blanc, "c");
        numero(p, i + 1, ox + cw / 2, top - 56, 7, C.sable, c);
        tx(p, b, ox + cw / 2, top - 78, 8.3, F.reg, C.soft, "c");
      });
    } },
    venn: { h: 176, d(p, x, top, w) {
      const cx = x + 140, r = 58;
      p.drawCircle({ x: cx - 44, y: top - 66, size: r, color: C.lagon, opacity: .5 });
      p.drawCircle({ x: cx + 44, y: top - 66, size: r, color: C.vert, opacity: .5 });
      p.drawCircle({ x: cx, y: top - 116, size: r, color: C.ocre, opacity: .55 });
      tx(p, "POSSÉDÉ", cx - 64, top - 54, 9.5, F.bold, C.lagonFonce, "c"); tx(p, "page, WhatsApp", cx - 64, top - 67, 7.8, F.reg, C.ink, "c");
      tx(p, "GAGNÉ", cx + 64, top - 54, 9.5, F.bold, hx("#24502D"), "c"); tx(p, "avis, partages", cx + 64, top - 67, 7.8, F.reg, C.ink, "c");
      tx(p, "PAYÉ", cx, top - 140, 9.5, F.bold, C.ocreInk, "c"); tx(p, "publicité", cx, top - 153, 7.8, F.reg, C.ink, "c");
      const rx = x + 300;
      [["D'abord le possédé", "gratuit et sous votre contrôle", C.lagon], ["Puis le gagné", "demandez des avis à chaque client", C.vert], ["Enfin le payé", "pour amplifier ce qui marche", C.ocre]].forEach(([a, b, c], i) => {
        numero(p, i + 1, rx + 8, top - 30 - i * 46, 9, c);
        tx(p, a, rx + 24, top - 30 - i * 46, 10.5, F.bold, C.ink); tx(p, b, rx + 24, top - 44 - i * 46, 8.8, F.reg, C.soft);
      });
    } },
    canaux: { h: 168, d(p, x, top, w) {
      const us = ["Converser, vendre", "Être trouvé", "Images, tourisme", "Vidéo, jeunes"];
      const ca = [["WhatsApp Business", [3, 0, 1, 0], 1], ["Fiche Google", [1, 3, 1, 0], 1], ["Facebook", [2, 1, 2, 1]], ["Instagram", [1, 0, 3, 2]], ["TikTok", [0, 0, 2, 3]]];
      const lc = 150, cw = (w - lc) / 4, rh = 24, ht = top - 30;
      us.forEach((u, i) => tx(p, u, x + lc + cw * (i + .5), top - 18, 8.5, F.semi, C.soft, "c"));
      ca.forEach(([n, v, def], r) => {
        const yy = ht - r * rh;
        if (def) rr(p, x, yy - rh + 2, w, rh - 2, 5, { color: C.ocreClair });
        tx(p, n, x + 8, yy - 15, 9.5, F.semi, C.ink);
        if (def && r === 0) pastille(p, "par défaut", x + 104, yy - 18, 6.5, F.bold, C.ocre, C.blanc, 4);
        v.forEach((k, i) => { if (k) p.drawCircle({ x: x + lc + cw * (i + .5), y: yy - 11, size: [0, 3, 5, 7][k], color: [0, C.gres, C.ocre, C.lagon][k] }); });
        ligne(p, x, yy - rh + 1, x + w, yy - rh + 1, C.gres, .4);
      });
      const ly = ht - 5 * rh - 16;
      [[7, C.lagon, "très adapté"], [5, C.ocre, "adapté"], [3, C.gres, "possible"]].forEach(([s, c, l], i) => { p.drawCircle({ x: x + lc + i * 92, y: ly + 3, size: s, color: c }); tx(p, l, x + lc + i * 92 + 12, ly, 8, F.reg, C.soft); });
    } },
    profil: { h: 240, d(p, x, top, w) {
      const px = x + 20, pw = 150, ph = 236;
      rr(p, px, top - ph, pw, ph, 20, { color: hx("#1E2326") });
      const sx = px + 7, sw = pw - 14, st = top - 14;
      rr(p, sx, top - ph + 8, sw, ph - 22, 13, { color: C.blanc });
      p.drawRectangle({ x: sx, y: st - 56, width: sw, height: 50, color: C.lagonClair });
      p.drawCircle({ x: sx + sw - 30, y: st - 24, size: 9, color: C.ocre, opacity: .8 });
      poly(p, [[sx, st - 56], [sx + 40, st - 32], [sx + 70, st - 46], [sx + 100, st - 30], [sx + sw, st - 56]], { color: C.ciel });
      marque(p, sx + 26, st - 60, 16);
      p.drawCircle({ x: sx + 26, y: st - 60, size: 16, borderColor: C.blanc, borderWidth: 2 });
      tx(p, "Ma Marque", sx + 10, st - 92, 10, F.bold, C.ink);
      [0, 1, 2].forEach((i) => p.drawRectangle({ x: sx + 10, y: st - 106 - i * 9, width: [sw - 24, sw - 34, sw - 60][i], height: 4.5, color: C.gres }));
      [0, 1].forEach((i) => p.drawRectangle({ x: sx + 10, y: st - 140 - i * 9, width: [sw - 50, sw - 70][i], height: 4.5, color: hx("#D5E5E9") }));
      rr(p, sx + 10, st - 178, sw - 20, 20, 10, { color: C.ocre });
      tx(p, "Écrire sur WhatsApp", sx + sw / 2, st - 171, 7.5, F.bold, C.blanc, "c");
      const z = [[st - 60, 1], [st - 22, 2], [st - 89, 3], [st - 110, 4], [st - 142, 5], [st - 168, 6]];
      z.forEach(([yy, n]) => { ligne(p, px + pw - 4, yy, px + pw + 18, yy, C.ocre, .7); numero(p, n, px + pw + 26, yy, 7.5); });
      const rx = x + 230;
      [["Photo de profil", "votre logo carré, lisible en petit"], ["Bannière", "aux couleurs de votre charte"], ["Nom", "le même sur tous les canaux"], ["Bio", "votre phrase de positionnement"], ["Coordonnées", "adresse, téléphone, horaires à jour"], ["Bouton d'action", "un seul, clair : Écrire, Réserver..."]].forEach(([a, b], i) => {
        const yy = top - 22 - i * 36;
        numero(p, i + 1, rx, yy + 3, 8);
        tx(p, a, rx + 16, yy, 10.5, F.bold, C.ink); tx(p, b, rx + 16, yy - 13, 8.8, F.reg, C.soft);
      });
    } },
    piliers: { h: 116, d(p, x, top, w) {
      const pl = [["Montrer", "La vanille en gros plan"], ["Apprendre", "Comment conserver une gousse"], ["Coulisses", "La récolte avec le producteur"], ["Preuve", "Un client avec son colis"]];
      const gap = 10, cw = (w - 3 * gap) / 4;
      pl.forEach(([a, b], i) => {
        const ox = x + i * (cw + gap), c = PIL[a];
        rr(p, ox, top - 112, cw, 112, 9, { color: C.sable, border: C.gres });
        rr(p, ox, top - 34, cw, 34, 9, { color: c }); p.drawRectangle({ x: ox, y: top - 34, width: cw, height: 10, color: c });
        tx(p, a, ox + cw / 2, top - 22, 11, F.bold, C.blanc, "c");
        tx(p, "Exemple", ox + 10, top - 50, 7.2, F.bold, C.mute);
        txw(p, b, ox + 10, top - 54, 9.5, F.it, C.ink, cw - 20, 1.35);
      });
    } },
    regle8020: { h: 82, d(p, x, top, w) {
      rr(p, x, top - 32, w * .8 - 2, 32, 6, { color: C.lagon });
      rr(p, x + w * .8 + 2, top - 32, w * .2 - 2, 32, 6, { color: C.ocre });
      tx(p, "80 %  utile, inspirant, divertissant", x + w * .4, top - 20, 10, F.semi, C.blanc, "c");
      tx(p, "20 %  vendre", x + w * .9, top - 20, 10, F.semi, C.blanc, "c");
      for (let i = 0; i < 5; i++) rr(p, x + i * 30, top - 74, 24, 24, 5, { color: i === 4 ? C.ocre : C.lagonClair, border: i === 4 ? undefined : C.lagon });
      for (let i = 0; i < 4; i++) coche(p, x + 12 + i * 30, top - 62, 9, C.lagon);
      tx(p, "Ar", x + 132, top - 66.5, 9.5, F.bold, C.blanc, "c");
      tx(p, "Sur 5 publications : 4 qui donnent, 1 qui demande.", x + 168, top - 66, 10, F.reg, C.soft);
    } },
    recit: { h: 112, d(p, x, top, w) {
      rr(p, x, top - 110, w, 110, 10, { color: C.sable });
      const y0 = top - 82, y1 = top - 30;
      const d = `M${x + 20},${-y0} L${x + 150},${-y0} C${x + 230},${-y0} ${x + 250},${-y1} ${x + 330},${-y1} L${x + w - 20},${-y1}`;
      p.drawSvgPath(d, { x: 0, y: 0, borderColor: C.lagon, borderWidth: 3 });
      [[x + 85, y0, "AVANT", "le problème", C.rouge], [x + 240, (y0 + y1) / 2, "DÉCLIC", "votre solution", C.ocre], [x + w - 80, y1, "APRÈS", "la transformation", C.vert]].forEach(([cx, cy, a, b, c], i) => {
        p.drawCircle({ x: cx, y: cy, size: 8, color: c, borderColor: C.blanc, borderWidth: 2 });
        const ly = i === 2 ? cy - 26 : i === 1 ? cy + 4 : cy + 16, lx = i === 1 ? cx + 16 : cx, al = i === 1 ? undefined : "c";
        tx(p, a, lx, ly, 9.5, F.bold, c, al); tx(p, b, lx, ly - 12, 8.5, F.it, C.ink, al);
      });
      tx(p, "0 à 3 s : l'accroche", x + 20, top - 104, 8, F.semi, C.mute);
    } },
    calendrier: { h: 150, d(p, x, top, w) {
      calendrier(p, x, top, w, [
        { jour: "Lun · S1", pilier: "Montrer", format: "Photo", idee: "La vanille en gros plan" },
        { jour: "Jeu · S1", pilier: "Apprendre", format: "Vidéo courte", idee: "Conserver une gousse" },
        { jour: "Sam · S1", pilier: "Coulisses", format: "Story", idee: "La récolte" },
        { jour: "Mar · S2", pilier: "Preuve", format: "Photo", idee: "Avis d'un client" },
        { jour: "Jeu · S2", pilier: "Montrer", format: "Carrousel", idee: "Nos 3 épices" },
        { jour: "Sam · S2", pilier: "Offre commerciale", format: "Photo", idee: "Coffret découverte" }]);
    } },
    pub: { h: 156, d(p, x, top, w) {
      const cx = x + 150, et = ["Une publication qui marche déjà", "Objectif : messages", "Zone, âge, centres d'intérêt", "Budget fixé · test de 3 à 5 jours"];
      et.forEach((t, i) => {
        const t0 = top - i * 37, w0 = 300 - i * 46, w1 = 300 - (i + 1) * 46;
        poly(p, [[cx - w0 / 2, t0], [cx + w0 / 2, t0], [cx + w1 / 2, t0 - 33], [cx - w1 / 2, t0 - 33]], { color: melange(C.lagon, C.ocre, i / 3) });
        tx(p, t, cx, t0 - 20, i === 3 ? 8.2 : 9.2, F.semi, C.blanc, "c");
      });
      tx(p, "Comparer, garder ce qui marche", cx, top - 154, 8.5, F.semi, C.ocreInk, "c");
      const rx = x + 330, rw = w - 330;
      rr(p, rx, top - 132, rw, 132, 10, { color: C.rougeClair });
      tx(p, "À ÉVITER", rx + 14, top - 22, 8.5, F.bold, C.rouge);
      ["Cibler tout Madagascar", "Booster une page vide", "Viser les « j'aime »", "Budget sans limite"].forEach((t, i) => { croix(p, rx + 20, top - 46 - i * 23, 7); tx(p, t, rx + 32, top - 49 - i * 23, 9.3, F.reg, C.ink); });
    } },
    chiffres: { h: 178, d(p, x, top, w) {
      const gap = 10, tw = (w - 2 * gap) / 3;
      [["2 400", "Portée", "personnes vous ont vu", C.lagon], ["180", "Engagement", "réactions, commentaires", C.vert], ["12", "Contacts", "messages reçus", C.ocre]].forEach(([n, a, b, c], i) => {
        const ox = x + i * (tw + gap);
        rr(p, ox, top - 70, tw, 70, 9, { color: i === 2 ? C.ocreClair : C.sable, border: i === 2 ? C.ocre : C.gres, bw: i === 2 ? 1.4 : 1 });
        tx(p, n, ox + 14, top - 34, 24, F.ti, c);
        tx(p, a, ox + 14, top - 50, 10, F.bold, C.ink); tx(p, b, ox + 14, top - 62, 8.3, F.reg, C.soft);
        if (i === 2) pastille(p, "le plus important", ox + tw - 86, top - 22, 6.8, F.bold, C.ocre, C.blanc, 5);
      });
      // courbe des contacts
      const gx = x + 30, gw = w - 40, gb = top - 160, gh = 60, v = [3, 5, 4, 8, 10, 12], mx = 14;
      tx(p, "Contacts par mois (exemple illustratif)", x, top - 88, 8.5, F.semi, C.soft);
      [0, 7, 14].forEach((k) => { const yy = gb + gh * k / mx; ligne(p, gx, yy, gx + gw, yy, C.gres, .5); tx(p, String(k), gx - 8, yy - 3, 7, F.reg, C.mute, "r"); });
      const pts = v.map((k, i) => [gx + 10 + i * (gw - 20) / 5, gb + gh * k / mx]);
      poly(p, [[pts[0][0], gb], ...pts, [pts[5][0], gb]], { color: C.ocre, opacity: .15 });
      poly(p, pts, { ouvert: true, border: C.ocre, bw: 2.2 });
      pts.forEach(([a, b], i) => { p.drawCircle({ x: a, y: b, size: 3, color: C.blanc, borderColor: C.ocre, borderWidth: 1.6 }); tx(p, "M" + (i + 1), a, gb - 12, 7.5, F.reg, C.mute, "c"); });
    } }
  };

  function calendrier(p, x, top, w, posts) {
    const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], lc = 26, cw = (w - lc) / 7, rh = 52;
    jours.forEach((j, i) => tx(p, j, x + lc + cw * (i + .5), top - 12, 8.5, F.bold, C.soft, "c"));
    for (let s = 0; s < 2; s++) {
      const yy = top - 20 - s * (rh + 4);
      tx(p, "S" + (s + 1), x + 4, yy - rh / 2 - 3, 9, F.bold, C.lagon);
      for (let j = 0; j < 7; j++) rr(p, x + lc + j * cw + 1.5, yy - rh, cw - 3, rh, 5, { color: C.sable, border: C.gres, bw: .6 });
    }
    const vus = {};
    posts.forEach((q) => {
      const m = String(q.jour || "").match(/^(\w{3})\s*·\s*S([12])/); if (!m) return;
      const j = jours.indexOf(m[1]), s = +m[2] - 1; if (j < 0) return;
      const k = `${j}-${s}`; const n = vus[k] = (vus[k] || 0) + 1; if (n > 1) return;
      const c = PIL[q.pilier] || C.mute, ox = x + lc + j * cw + 1.5, yy = top - 20 - s * (rh + 4);
      rr(p, ox, yy - rh, cw - 3, rh, 5, { color: c });
      tx(p, (q.format || q.pilier || "").slice(0, 14), ox + 5, yy - 11, 6.6, F.bold, C.blanc);
      wrap(q.idee || q.pilier || "", F.reg, 6.8, cw - 10).slice(0, 4).forEach((l, i) => tx(p, l, ox + 5, yy - 22 - i * 8.2, 6.8, F.reg, C.blanc));
    });
    let lx = x + lc; const ly = top - 20 - 2 * (rh + 4) - 6;
    Object.entries(PIL).forEach(([n, c]) => { rr(p, lx, ly - 8, 9, 9, 2, { color: c }); tx(p, n === "Offre commerciale" ? "Offre" : n, lx + 13, ly - 7, 8, F.reg, C.soft); lx += wid(n === "Offre commerciale" ? "Offre" : n, F.reg, 8) + 30; });
  }

  /* ---------- couverture ---------- */
  page = pdf.addPage([W, H]); pagesSans.add(0);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.sable });
  page.drawCircle({ x: W + 30, y: H - 60, size: 210, color: C.lagon, opacity: .08 });
  page.drawCircle({ x: W - 70, y: H - 230, size: 70, color: C.ocre, opacity: .18 });
  page.drawCircle({ x: -40, y: 120, size: 160, color: C.lagon, opacity: .07 });
  page.drawRectangle({ x: 0, y: 0, width: W, height: 190, color: C.lagon });
  page.drawCircle({ x: W - 60, y: 190, size: 34, color: C.ocre });
  const lw = 170, lh = lw * logo.height / logo.width;
  page.drawImage(logo, { x: M - 6, y: H - 56 - lh, width: lw, height: lh });
  let cy = H - 120 - lh;
  tx(page, "MANUEL DU PARTICIPANT", M, cy, 10.5, F.bold, C.ocreInk); cy -= 16;
  for (const l of wrap("Identité visuelle & Marketing digital", F.ti, 38, CW - 30)) { tx(page, l, M, cy - 38, 38, F.ti, C.lagon); cy -= 44; }
  cy -= 4;
  for (const l of wrap("Construire une image de marque cohérente et la rendre visible en ligne", F.it, 14, CW - 80)) { tx(page, l, M, cy - 14, 14, F.it, C.soft); cy -= 19; }
  cy -= 40;
  page.drawRectangle({ x: M, y: cy, width: 54, height: 3, color: C.ocre }); cy -= 28;
  tx(page, "PRÉPARÉ POUR", M, cy, 9, F.bold, C.mute); cy -= 8;
  let tn = 50; while (tn > 26 && wid(d.nom || "Participant", F.ti, tn) > CW) tn -= 2;
  for (const l of wrap(d.nom || "Participant", F.ti, tn, CW)) { tx(page, l, M, cy - tn, tn, F.ti, C.ink); cy -= tn * 1.15; }
  if (d.marque) { cy -= 6; tx(page, d.marque, M, cy - 15, 15, F.semi, C.ocreInk); }
  tx(page, "FORMATEUR", M, 140, 8.5, F.bold, C.ocre);
  tx(page, "Hugues Hamba", M, 116, 20, F.ti, C.blanc);
  tx(page, "B-Lossom Center · 24 novembre 2026", M, 96, 10.5, F.reg, hx("#D6E8EC"));
  tx(page, "formation-design.vercel.app", M, 48, 8.5, F.reg, hx("#9FC3CC"));

  /* ---------- sommaire (rempli à la fin) ---------- */
  const pageSommaire = pdf.addPage([W, H]);

  /* ---------- modules ---------- */
  MODULES.forEach((m, mi) => {
    ouvertureModule(m, mi);
    m.sections.forEach((s, si) => {
      titreSection(`${mi}.${si + 1}`, s.titre);
      if (s.illus === "synthese") { synthese(); return; }
      (s.texte || []).forEach((t) => para(t));
      if (s.illus) illustration(s.illus);
      if (s.exemple) encadre("exemple", s.exemple);
      if (s.astuce) encadre("astuce", s.astuce);
      if (s.retenir) encadre("retenir", s.retenir);
      y -= 6;
    });
    if (m.atelier === "QUIZ") blocQuiz();
    else if (m.atelier) blocAtelier(m.atelier);
  });

  function synthese() {
    const items = [
      ["L'identité d'abord", "Cible, valeurs, positionnement : décidez qui vous êtes avant de choisir une couleur."],
      ["Une charte simple, répétée partout", "2 ou 3 couleurs avec leur code HEX, 2 polices, un ton. C'est la répétition qui vous rend reconnaissable."],
      ["Peu de canaux, bien tenus", "WhatsApp Business et la fiche Google, puis un réseau. Un profil cohérent en 6 points."],
      ["Donner avant de demander", "4 piliers de contenu, la règle 80/20, des vidéos courtes avec une accroche."],
      ["Mesurer les contacts", "Portée, engagement, contacts, chaque mois. Booster seulement ce qui marche déjà."]
    ];
    items.forEach(([a, b], i) => {
      const L = wrap(b, F.reg, 10, CW - 70), h = 26 + L.length * 14 + 10;
      place(h + 8);
      rr(page, M, y - h, CW, h, 9, { color: i % 2 ? C.blanc : C.sable, border: C.gres });
      tx(page, String(i + 1), M + 24, y - 36, 30, F.ti, C.ocre, "c");
      tx(page, a, M + 54, y - 20, 12, F.bold, C.lagon);
      L.forEach((l, k) => tx(page, l, M + 54, y - 36 - k * 14, 10, F.reg, C.soft));
      y -= h + 8;
    });
    y -= 6;
  }

  /* ---------- réponses du participant ---------- */
  function enteteAtelier(a, fait, min = 120) {
    place(min);
    y -= 6;
    ancres[a] = pdf.getPageCount();
    rr(page, M, y - 40, CW, 40, 9, { color: C.lagon });
    tx(page, "VOS RÉPONSES", M + 16, y - 16, 7.5, F.bold, C.ocre);
    tx(page, NOMS[a], M + 16, y - 31, 12.5, F.ti, C.blanc);
    pastille(page, fait ? "complété" : "non complété", M + CW - 16 - wid(fait ? "complété" : "non complété", F.bold, 7.5) - 12, y - 27, 7.5, F.bold, fait ? C.ocre : C.lagon2, C.blanc);
    y -= 52;
  }
  function champ(label, valeur) {
    if (!valeur) return;
    const L = wrap(valeur, F.reg, 10.3, CW - 32);
    place(16 + Math.min(L.length, 3) * 15);
    tx(page, String(label).toUpperCase(), M + 14, y - 8, 7.3, F.bold, C.mute);
    page.drawRectangle({ x: M, y: y - 12 - L.length * 15, width: 2.5, height: L.length * 15 + 10, color: C.ocre });
    y -= 13;
    for (const l of L) { place(15); tx(page, l, M + 14, y - 11, 10.3, F.reg, C.ink); y -= 15; }
    y -= 9;
  }
  function vide(t) { place(40); rr(page, M, y - 34, CW, 34, 8, { color: C.sable, border: C.gres }); tx(page, t, M + 14, y - 21, 10, F.it, C.soft); y -= 46; }

  function blocAtelier(a) {
    const r = d.ateliers[a], dd = r?.data || {};
    enteteAtelier(a, !!r, a === "C" && r ? 310 : a === "D" && r ? 220 : 130);
    if (!r) { vide("Vous n'avez pas envoyé de réponse pour cet atelier : reprenez-le sur formation-design.vercel.app/ateliers."); return; }
    if (a === "P") {
      if (dd.phraseProjet) { const L = wrap(`« ${dd.phraseProjet} »`, F.it, 15, CW - 40); place(L.length * 21 + 30); rr(page, M, y - L.length * 21 - 22, CW, L.length * 21 + 22, 10, { color: C.ocreClair }); L.forEach((l, i) => tx(page, l, M + 20, y - 26 - i * 21, 15, F.it, C.ink)); y -= L.length * 21 + 34; }
      champ("Nom", r.nom); champ("Projet ou marque", r.marque); champ("Une marque que je suis en ligne", dd.suivie); champ("Pourquoi", dd.pourquoi);
    }
    if (a === "A") {
      const parts = [["Pour ", 0], [dd.cible || "...", C.lagon], [" qui ", 0], [dd.besoin || "...", C.lagon2], [", ", 0], [r.marque || "[marque]", C.ink], [" est ", 0], [dd.categorie || "...", C.vert], [" qui ", 0], [dd.benefice || "...", C.corail], [", grâce à ", 0], [dd.preuve || "...", C.ocreInk], [".", 0]];
      // texte enrichi : chaque partie de la formule dans sa couleur
      const s = 14, lh = 21, mw = CW - 40, lignes = [[]]; let lw0 = 0;
      parts.forEach(([t, c]) => {
        const f = c ? F.ti : F.it;
        net(t, f).split(/(\s+)/).forEach((m) => {
          if (!m) return; const mw2 = f.widthOfTextAtSize(m, s);
          if (lw0 + mw2 > mw && /\S/.test(m) && lw0 > 0) { lignes.push([]); lw0 = 0; }
          if (!lw0 && !/\S/.test(m)) return;
          lignes[lignes.length - 1].push([m, f, c || C.soft]); lw0 += mw2;
        });
      });
      const h = lignes.length * lh + 26;
      place(h + 40);
      rr(page, M, y - h, CW, h, 10, { color: C.sable, border: C.gres });
      lignes.forEach((L, i) => { let xx = M + 20; L.forEach(([m, f, c]) => { page.drawText(m, { x: xx, y: y - 28 - i * lh, size: s, font: f, color: c }); xx += f.widthOfTextAtSize(m, s); }); });
      y -= h + 10;
      let lx = M;
      [["cible", C.lagon], ["besoin", C.lagon2], ["catégorie", C.vert], ["bénéfice", C.corail], ["preuve", C.ocreInk]].forEach(([n, c]) => { page.drawCircle({ x: lx + 4, y: y - 5, size: 4, color: c }); tx(page, n, lx + 12, y - 8, 8.5, F.semi, C.soft); lx += wid(n, F.semi, 8.5) + 28; });
      y -= 24;
      if (!dd.preuve) encadre("astuce", "Il manque la preuve : ajoutez un fait vérifiable (un chiffre, un label, une méthode) pour transformer votre slogan en promesse.");
    }
    if (a === "B") {
      const cols = (dd.couleurs || []).filter((c) => /^#[0-9a-f]{6}$/i.test(c.hex || ""));
      if (cols.length) {
        place(120);
        const sw = (CW - (cols.length - 1) * 12) / cols.length;
        cols.forEach((c, i) => {
          const ox = M + i * (sw + 12);
          rr(page, ox, y - 104, sw, 104, 10, { color: C.blanc, border: C.gres });
          rr(page, ox, y - 64, sw, 64, 10, { color: hx(c.hex) }); page.drawRectangle({ x: ox, y: y - 64, width: sw, height: 12, color: hx(c.hex) });
          tx(page, c.role, ox + 12, y - 80, 7.5, F.bold, C.mute);
          tx(page, `${c.nom || "-"}  ${c.hex.toUpperCase()}`, ox + 12, y - 95, 10, F.semi, C.ink);
        });
        y -= 116;
        // dosage proposé 60-30-10
        place(50);
        tx(page, "VOTRE DOSAGE 60-30-10", M, y - 8, 7.3, F.bold, C.mute);
        const neutre = cols.find((c) => c.role === "Neutre") || cols[2] || cols[0], princ = cols.find((c) => c.role === "Principale") || cols[0], acc = cols.find((c) => c.role === "Accent") || cols[1] || cols[0];
        let ox = M; [[.6, neutre], [.3, princ], [.1, acc]].forEach(([f, c]) => { page.drawRectangle({ x: ox, y: y - 38, width: CW * f, height: 22, color: hx(c.hex), borderColor: C.gres, borderWidth: .5 }); ox += CW * f; });
        y -= 52;
      }
      if (dd.ambiance?.length) {
        place(40); tx(page, "MES 3 MOTS D'AMBIANCE", M + 14, y - 8, 7.3, F.bold, C.mute); y -= 14;
        let cx = M + 14; dd.ambiance.forEach((t) => { cx += pastille(page, t, cx, y - 20, 10, F.semi, C.lagonClair, C.lagon, 9) + 6; }); y -= 32;
      }
      if (dd.polices && (dd.polices.titres || dd.polices.texte)) champ("Polices", `Titres : ${dd.polices.titres || "-"} · Texte : ${dd.polices.texte || "-"}`);
      champ("Style d'images", dd.images);
      if (dd.ton && (dd.ton.oui || dd.ton.non)) champ("Ton", `Je suis ${dd.ton.oui || "..."}, mais pas ${dd.ton.non || "..."}.`);
      const inter = (dd.interdits || []).filter(Boolean);
      if (inter.length) {
        place(20 + inter.length * 18); tx(page, "MES INTERDITS", M + 14, y - 8, 7.3, F.bold, C.mute); y -= 16;
        inter.forEach((t) => { croix(page, M + 20, y - 7, 7); tx(page, t, M + 32, y - 10.5, 10.3, F.reg, C.ink); y -= 18; }); y -= 8;
      }
    }
    if (a === "C") {
      const ph = IMG;
      place(250);
      const mx = M, mw = CW, top = y;
      rr(page, mx, top - 236, mw, 236, 12, { color: C.blanc, border: C.gres });
      tx(page, (dd.canal || "Mon profil").toUpperCase(), mx + 14, top - 16, 7.5, F.bold, C.mute);
      const bh = 96, by = top - 24 - bh;
      if (ph.couverture) { clipRect(page, mx + 10, by, mw - 20, bh); imgCouvre(page, ph.couverture, mx + 10, by, mw - 20, bh); finClip(page); }
      else { page.drawRectangle({ x: mx + 10, y: by, width: mw - 20, height: bh, color: C.lagonClair }); tx(page, dd.banniere ? `Bannière : ${dd.banniere}`.slice(0, 80) : "Bannière", mx + mw / 2, by + bh / 2 - 4, 9, F.it, C.lagon, "c"); }
      const ax = mx + 54, ay = by - 6, ar = 34;
      page.drawCircle({ x: ax, y: ay, size: ar + 3, color: C.blanc });
      if (ph.profil) { clipCercle(page, ax, ay, ar); imgCouvre(page, ph.profil, ax - ar, ay - ar, ar * 2, ar * 2); finClip(page); }
      else marque(page, ax, ay, ar);
      tx(page, dd.nomAffiche || r.marque || r.nom, mx + 100, by - 22, 15, F.bold, C.ink);
      const bio = wrap(dd.bio || "", F.reg, 9.5, mw - 330).slice(0, 5);
      bio.forEach((l, i) => tx(page, l, mx + 100, by - 38 - i * 13, 9.5, F.reg, C.soft));
      if (dd.coord) wrap(dd.coord, F.reg, 8.5, 190).slice(0, 4).forEach((l, i) => tx(page, l, mx + mw - 204, by - 22 - i * 12, 8.5, F.reg, C.lagon));
      if (dd.bouton) { const bw = Math.min(180, wid(dd.bouton, F.bold, 9) + 30); rr(page, mx + mw - bw - 14, top - 228, bw, 22, 11, { color: C.ocre }); tx(page, dd.bouton, mx + mw - bw / 2 - 14, top - 220.5, 9, F.bold, C.blanc, "c"); }
      const posts = ["post1", "post2", "post3"].filter((k) => ph[k]);
      posts.forEach((k, i) => { const s = 44, ox = mx + 14 + i * (s + 6); clipRect(page, ox, top - 228, s, s); imgCouvre(page, ph[k], ox, top - 228, s, s); finClip(page); });
      y = top - 250;
      if (!ph.profil) champ("Photo de profil", dd.photo);
      champ("Canal principal", dd.canal); champ("Nom affiché", dd.nomAffiche); champ("Bio", dd.bio); champ("Coordonnées et horaires", dd.coord); champ("Bouton d'action", dd.bouton);
      if (!ph.couverture) champ("Bannière", dd.banniere);
      const corr = (dd.corrections || []).filter(Boolean);
      if (corr.length) encadre("astuce", ["Mes corrections à faire dès cette semaine :", ...corr]);
    }
    if (a === "D") {
      const posts = (dd.posts || []).filter((q) => q.idee || q.pilier);
      if (posts.length) {
        place(160); calendrier(page, M, y, CW, posts); y -= 158;
        // répartition par pilier
        const cpt = {}; posts.forEach((q) => { if (q.pilier) cpt[q.pilier] = (cpt[q.pilier] || 0) + 1; });
        const ent = Object.entries(cpt);
        if (ent.length) {
          place(30 + ent.length * 20);
          tx(page, "RÉPARTITION DE VOS PUBLICATIONS", M, y - 8, 7.3, F.bold, C.mute); y -= 18;
          const mx2 = Math.max(...ent.map((e) => e[1]));
          ent.forEach(([n, k]) => { tx(page, n, M, y - 11, 9, F.reg, C.ink); rr(page, M + 120, y - 14, (CW - 160) * k / Math.max(mx2, 3), 14, 4, { color: PIL[n] || C.mute }); tx(page, String(k), M + 126 + (CW - 160) * k / Math.max(mx2, 3), y - 11, 9, F.bold, C.ink); y -= 20; });
          y -= 6;
        }
        posts.forEach((q) => champ(`${q.jour || "-"} · ${q.pilier || "-"} · ${q.format || "-"}`, q.idee));
      }
      champ("Accroche", dd.accroche); champ("Texte", dd.texte); champ("Appel à l'action", dd.cta);
    }
  }

  function blocQuiz() {
    const q = d.quiz;
    enteteAtelier("QUIZ", !!q, q ? 200 : 130);
    if (!q || !Array.isArray(q.reponses)) { vide("Vous n'avez pas répondu au quiz en ligne : formation-design.vercel.app/quiz."); return; }
    const juste = QUESTIONS.map((x, i) => q.reponses[i] === x.answer), score = juste.filter(Boolean).length, n = QUESTIONS.length;
    place(150);
    const cx = M + 70, cy = y - 66;
    anneau(page, cx, cy, 40, 56, 0, 359.9, C.gres);
    if (score) anneau(page, cx, cy, 40, 56, 0, 360 * score / n - .1, C.ocre);
    tx(page, `${score}/${n}`, cx, cy - 8, 24, F.ti, C.lagon, "c");
    tx(page, "votre score", cx, cy - 22, 8, F.reg, C.soft, "c");
    const rx = M + 160, rw = CW - 170, g = d.groupe;
    tx(page, "VOUS ET LE GROUPE", rx, y - 18, 7.3, F.bold, C.mute);
    const barre = (yy, l, v, c) => { tx(page, l, rx, yy, 9.5, F.semi, C.ink); rr(page, rx + 110, yy - 4, rw - 150, 14, 4, { color: C.sable }); if (v > 0) rr(page, rx + 110, yy - 4, (rw - 150) * v / n, 14, 4, { color: c }); tx(page, String(v).replace(".", ","), rx + rw - 30, yy, 9.5, F.bold, c); };
    barre(y - 44, "Vous", score, C.ocre);
    if (g && g.n > 1) { barre(y - 70, "Moyenne du groupe", Math.round(g.moyenne * 10) / 10, C.lagon); tx(page, `${g.n} participants ont répondu au quiz.`, rx, y - 96, 8.5, F.it, C.soft); }
    const msg = score >= 8 ? "Excellent : vous maîtrisez l'essentiel de la formation." : score >= 5 ? "Bonne base : relisez les questions à revoir ci-dessous." : "Reprenez les modules liés aux questions à revoir : tout est dans ce manuel.";
    tx(page, msg, rx, y - 118, 9.5, F.semi, C.lagon);
    y -= 150;
    // réussite par question
    place(40 + n * 17);
    tx(page, "RÉUSSITE PAR QUESTION", M, y - 8, 7.3, F.bold, C.mute);
    if (g && g.n > 1) tx(page, "barre : % du groupe qui a bien répondu", M + CW, y - 8, 7.5, F.reg, C.mute, "r");
    y -= 20;
    QUESTIONS.forEach((x, i) => {
      tx(page, `Q${i + 1}`, M, y - 10, 8.5, F.bold, C.soft);
      tx(page, x.theme || "", M + 26, y - 10, 8, F.reg, C.mute);
      rr(page, M + 80, y - 12, CW - 120, 11, 3, { color: C.sable });
      const pc = g && g.n > 1 ? g.parQuestion[i] : (juste[i] ? 1 : 0);
      if (pc > 0) rr(page, M + 80, y - 12, (CW - 120) * pc, 11, 3, { color: C.lagonClair, border: C.ciel, bw: .5 });
      if (g && g.n > 1) tx(page, `${Math.round(pc * 100)} %`, M + 86, y - 9.5, 7, F.semi, C.lagon);
      if (juste[i]) { p0(page, M + CW - 20, y - 6.5, C.vert); coche(page, M + CW - 20, y - 6.5, 6, C.blanc); } else { p0(page, M + CW - 20, y - 6.5, C.rouge); croix(page, M + CW - 20, y - 6.5, 5, C.blanc); }
      y -= 17;
    });
    y -= 10;
    // corrigé
    QUESTIONS.forEach((x, i) => {
      const rep = q.reponses[i], L = wrap(`${i + 1}. ${x.question}`, F.semi, 10, CW - 30), E = wrap(x.explanation, F.reg, 9.3, CW - 30);
      const lv = rep && rep !== x.answer ? wrap(`Votre réponse : ${x.options[rep - 1]}`, F.reg, 9.3, CW - 30) : [];
      const lb = wrap(`Bonne réponse : ${x.options[x.answer - 1]}`, F.semi, 9.3, CW - 30);
      const h = L.length * 14 + lv.length * 13 + lb.length * 13 + E.length * 13 + 22;
      place(h + 8);
      rr(page, M, y - h, CW, h, 8, { color: juste[i] ? C.blanc : C.rougeClair, border: juste[i] ? C.gres : undefined });
      page.drawRectangle({ x: M, y: y - h + 6, width: 3, height: h - 12, color: juste[i] ? C.vert : C.rouge });
      let yy = y - 10;
      L.forEach((l) => { tx(page, l, M + 16, yy - 10, 10, F.semi, C.ink); yy -= 14; }); yy -= 2;
      lv.forEach((l) => { tx(page, l, M + 16, yy - 9.3, 9.3, F.reg, C.rouge); yy -= 13; });
      lb.forEach((l) => { tx(page, l, M + 16, yy - 9.3, 9.3, F.semi, C.vert); yy -= 13; });
      E.forEach((l) => { tx(page, l, M + 16, yy - 9.3, 9.3, F.reg, C.soft); yy -= 13; });
      y -= h + 7;
    });
  }
  function p0(p, cx, cy, c) { p.drawCircle({ x: cx, y: cy, size: 7, color: c }); }

  /* ---------- plan d'action ---------- */
  moduleCourant = "Plan d'action";
  nouvellePage(); ancres.plan = pdf.getPageCount();
  tx(page, "PLAN D'ACTION", M, y - 8, 9, F.bold, C.ocreInk); y -= 16;
  tx(page, "Mes 3 actions dans les 30 jours", M, y - 26, 26, F.ti, C.lagon); y -= 44;
  para("Une formation ne sert à rien si rien ne change lundi matin. Choisissez trois actions concrètes, datées, que vous pouvez faire seul et sans budget.", { c: C.soft, gap: 14 });
  for (let i = 1; i <= 3; i++) {
    rr(page, M, y - 70, CW, 70, 10, { color: C.sable, border: C.gres });
    tx(page, String(i), M + 22, y - 44, 30, F.ti, C.ocre, "c");
    ligne(page, M + 50, y - 30, M + CW - 130, y - 30, C.gres, .8);
    ligne(page, M + 50, y - 54, M + CW - 130, y - 54, C.gres, .8);
    tx(page, "Pour le", M + CW - 116, y - 33, 8.5, F.semi, C.mute);
    ligne(page, M + CW - 116, y - 54, M + CW - 16, y - 54, C.gres, .8);
    y -= 82;
  }
  para("Exemples : mettre à jour ma bio avec ma phrase de positionnement, créer ma fiche Google, publier ma première vidéo courte lundi.", { f: F.it, s: 10.5, c: C.soft, gap: 16 });
  // suivi 3 mois
  tx(page, "Mon suivi sur 3 mois", M, y - 16, 16, F.ti, C.lagon); y -= 30;
  const tc = [140, (CW - 140) / 3];
  ["", "Mois 1", "Mois 2", "Mois 3"].forEach((t, i) => tx(page, t, M + (i ? tc[0] + tc[1] * (i - .5) : 0), y - 12, 9, F.bold, C.soft, i ? "c" : undefined));
  y -= 20;
  ["Portée", "Engagement", "Contacts", "Avis Google"].forEach((t, r) => {
    page.drawRectangle({ x: M, y: y - 26, width: CW, height: 26, color: r % 2 ? C.blanc : C.sable });
    tx(page, t, M + 10, y - 17, 10, F.semi, C.ink);
    for (let k = 1; k < 4; k++) ligne(page, M + tc[0] + tc[1] * (k - 1), y, M + tc[0] + tc[1] * (k - 1), y - 26, C.gres, .6);
    y -= 26;
  });
  y -= 22;
  place(40 + ERREURS.length * 19);
  tx(page, "Les erreurs à éviter", M, y - 16, 16, F.ti, C.lagon); y -= 30;
  ERREURS.forEach((t) => { rr(page, M, y - 13, 12, 12, 2.5, { border: C.lagon, bw: 1 }); tx(page, t, M + 22, y - 10.5, 10.3, F.reg, C.ink); y -= 19; });
  y -= 10;
  place(50);
  rr(page, M, y - 44, CW, 44, 10, { color: C.lagon });
  tx(page, "Envoyez le lien de votre page à Hugues Hamba d'ici un mois :", M + 16, y - 19, 10, F.semi, C.blanc);
  tx(page, "il sera ravi de voir ce que vous en avez fait.", M + 16, y - 33, 10, F.reg, hx("#D6E8EC"));
  y -= 56;

  /* ---------- 4e de couverture ---------- */
  page = pdf.addPage([W, H]); pagesSans.add(pdf.getPageCount() - 1);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.lagon });
  page.drawCircle({ x: W, y: H, size: 260, color: C.lagon2, opacity: .5 });
  page.drawCircle({ x: 90, y: 150, size: 60, color: C.ocre, opacity: .9 });
  const bw2 = 230, bh2 = bw2 * logoBlanc.height / logoBlanc.width;
  page.drawImage(logoBlanc, { x: (W - bw2) / 2, y: H / 2 - bh2 / 2 + 60, width: bw2, height: bh2 });
  tx(page, "Merci et belle route à votre marque.", W / 2, H / 2 - 100, 20, F.it, C.blanc, "c");
  tx(page, "Hugues Hamba · B-Lossom Center", W / 2, H / 2 - 130, 11, F.semi, hx("#D6E8EC"), "c");
  tx(page, "formation-design.vercel.app", W / 2, H / 2 - 148, 9.5, F.reg, hx("#9FC3CC"), "c");

  /* ---------- sommaire ---------- */
  {
    const p = pageSommaire; let yy = H - 70;
    const lw2 = 62, lh2 = lw2 * logo.height / logo.width; p.drawImage(logo, { x: W - M - lw2, y: H - 22 - lh2 * .78, width: lw2, height: lh2 });
    tx(p, "Sommaire", M, yy - 34, 34, F.ti, C.lagon); yy -= 50;
    p.drawRectangle({ x: M, y: yy, width: 44, height: 3, color: C.ocre }); yy -= 28;
    MODULES.forEach((m, i) => {
      tx(p, `MODULE ${m.num}`, M, yy, 7.5, F.bold, C.ocreInk);
      tx(p, m.titre, M, yy - 18, 14, F.ti, C.ink);
      const n = String(ancres["m" + i] || "");
      const x0 = M + wid(m.titre, F.ti, 14) + 8, x1 = W - M - wid(n, F.bold, 11) - 8;
      if (x1 > x0) ligne(p, x0, yy - 17, x1, yy - 17, C.gres, 1, [1, 3]);
      tx(p, n, W - M, yy - 18, 11, F.bold, C.lagon, "r");
      yy -= 38;
    });
    tx(p, "Plan d'action et suivi", M, yy - 18, 14, F.ti, C.ink); tx(p, String(ancres.plan), W - M, yy - 18, 11, F.bold, C.lagon, "r");
    ligne(p, M + wid("Plan d'action et suivi", F.ti, 14) + 8, yy - 17, W - M - 24, yy - 17, C.gres, 1, [1, 3]);
    yy -= 54;
    rr(p, M, yy - 128, CW, 128, 12, { color: C.sable, border: C.gres });
    tx(p, "VOS ATELIERS", M + 18, yy - 22, 7.5, F.bold, C.mute);
    ["P", "A", "B", "C", "D", "QUIZ"].forEach((a, i) => {
      const fait = a === "QUIZ" ? !!d.quiz : !!d.ateliers[a];
      const col = i % 2, row = Math.floor(i / 2), ox = M + 18 + col * (CW / 2), oy = yy - 46 - row * 28;
      if (fait) { p.drawCircle({ x: ox + 7, y: oy + 3, size: 7, color: C.vert }); coche(p, ox + 7, oy + 3, 6, C.blanc); } else p.drawCircle({ x: ox + 7, y: oy + 3, size: 6.5, borderColor: C.mute, borderWidth: 1 });
      tx(p, NOMS[a].replace(" - ", " · ").replace("Mes 2 prochaines semaines", "Mes 2 semaines").replace("Ma phrase de positionnement", "Mon positionnement"), ox + 20, oy, 9.3, fait ? F.semi : F.reg, fait ? C.ink : C.mute);
      tx(p, "p. " + (ancres[a] || ""), ox + CW / 2 - 40, oy, 8.5, F.reg, C.mute, "r");
    });
    yy -= 156;
    tx(p, "Comment utiliser ce manuel", M, yy - 15, 15, F.ti, C.lagon); yy -= 30;
    ["Chaque module reprend une partie de la formation : les explications, des schémas et l'essentiel à retenir.",
     "À la fin de chaque module, vous retrouvez vos propres réponses aux ateliers : c'est le point de départ de votre marque.",
     "Gardez-le près de vous quand vous préparez vos publications, et remplissez le plan d'action à la fin."].forEach((t) => {
      p.drawCircle({ x: M + 4, y: yy - 6.5, size: 2.3, color: C.ocre });
      yy -= txw(p, t, M + 16, yy, 10.3, F.reg, C.ink, CW - 16, 1.45) + 6;
    });
  }

  /* ---------- pieds de page ---------- */
  const total = pdf.getPageCount();
  pdf.getPages().forEach((p, i) => {
    if (pagesSans.has(i)) return;
    ligne(p, M, 42, W - M, 42, C.gres, .6);
    tx(p, `Manuel du participant · ${d.nom || ""}`, M, 28, 7.5, F.reg, C.mute);
    tx(p, `${i + 1} / ${total}`, W - M, 28, 7.5, F.semi, C.soft, "r");
  });

  return await pdf.save();
}
