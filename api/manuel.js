// Manuel du participant (PDF) : résumé du cours + réponses du participant aux ateliers et au quiz.
// GET  /api/manuel?jeton=...&info=1  -> { nom, email (masqué), ateliers faits, quiz }
// GET  /api/manuel?jeton=...         -> le PDF à télécharger
// POST /api/manuel { jeton, email? } -> envoie le PDF par e-mail (met l'adresse à jour si fournie)
import { Redis } from "@upstash/redis";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import nodemailer from "nodemailer";
import { MANUEL } from "./_manuel-data.js";
import { QUESTIONS } from "./_quiz-data.js";
import { LOGO_PNG } from "./_logo.js";

const JETON = /^[a-f0-9]{32}$/;
const EMAIL = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,}$/i;
const ATELIERS = ["P", "A", "B", "C", "D"];
const NOMS = { P: "Atelier de départ - Mon projet", A: "Atelier A - Ma phrase de positionnement", B: "Atelier B - Ma mini-charte", C: "Atelier C - Mon profil digital", D: "Atelier D - Mes 2 prochaines semaines" };

let client;
const db = () => (client ||= Redis.fromEnv());
const lire = (v) => { if (typeof v === "string") { try { return JSON.parse(v); } catch { return null; } } return v || null; };

export async function donnees(jeton) {
  const out = { jeton, ateliers: {}, quiz: null, participant: null };
  for (const a of ATELIERS) { const r = lire(await db().hget(`atelier:${a}`, jeton)); if (r) out.ateliers[a] = r; }
  out.quiz = lire(await db().hget("quiz:final", jeton));
  out.participant = lire(await db().hget("participants", jeton));
  out.nom = out.participant?.nom || out.ateliers.P?.nom || Object.values(out.ateliers)[0]?.nom || out.quiz?.nom || "";
  out.marque = out.ateliers.P?.marque || Object.values(out.ateliers).find((r) => r.marque)?.marque || "";
  return out;
}

/* ---------- PDF ---------- */
const C = { lagon: rgb(15 / 255, 76 / 255, 92 / 255), ocre: rgb(227 / 255, 162 / 255, 59 / 255), ocreInk: rgb(138 / 255, 93 / 255, 14 / 255), ink: rgb(43 / 255, 45 / 255, 47 / 255), soft: rgb(90 / 255, 95 / 255, 98 / 255), sable: rgb(250 / 255, 247 / 255, 242 / 255), gres: rgb(228 / 255, 222 / 255, 211 / 255), blanc: rgb(1, 1, 1) };
const REMPL = { "−": "-", "–": "-", "—": "-", "→": "->", "←": "<-", "✓": "", "★": "*", " ": " ", " ": " ", " ": " ", "→": "->" };

export async function genererPdf(d) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Manuel du participant - ${d.nom || "Participant"}`);
  pdf.setAuthor("Hugues Hamba - B-Lossom Center");
  const F = { reg: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold), it: await pdf.embedFont(StandardFonts.HelveticaOblique), serif: await pdf.embedFont(StandardFonts.TimesRomanBold) };
  const ok = new Set(F.reg.getCharacterSet());
  const net = (t) => String(t == null ? "" : t).split("").map((ch) => (REMPL[ch] !== undefined ? REMPL[ch] : ok.has(ch.codePointAt(0)) || ch === "\n" ? ch : "?")).join("");
  const logo = await pdf.embedPng(Buffer.from(LOGO_PNG, "base64"));
  const W = 595.28, H = 841.89, M = 56;
  let page, y, num = 0;

  function wrap(text, font, size, width) {
    const out = [];
    for (const para of net(text).split("\n")) {
      let line = "";
      for (const w of para.split(/\s+/)) {
        const t = line ? line + " " + w : w;
        if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  }
  function nouvellePage() {
    page = pdf.addPage([W, H]); num++; y = H - M;
    page.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: C.lagon });
    page.drawText(net("Identité visuelle & Marketing digital · Manuel du participant"), { x: M, y: 30, size: 8, font: F.reg, color: C.soft });
    page.drawText(String(num), { x: W - M - 10, y: 30, size: 8, font: F.reg, color: C.soft });
  }
  function place(h) { if (y - h < 60) nouvellePage(); }
  function texte(t, { font = F.reg, size = 11, color = C.ink, x = M, width = W - 2 * M, gap = 4, lh = 1.35 } = {}) {
    for (const l of wrap(t, font, size, width)) { place(size * lh); page.drawText(l, { x, y: y - size, size, font, color }); y -= size * lh; }
    y -= gap;
  }
  function puce(t) {
    const lignes = wrap(t, F.reg, 11, W - 2 * M - 16);
    place(15 * Math.min(lignes.length, 2));
    page.drawCircle({ x: M + 4, y: y - 7.5, size: 2.2, color: C.ocre });
    for (const l of lignes) { place(15); page.drawText(l, { x: M + 16, y: y - 11, size: 11, font: F.reg, color: C.ink }); y -= 15; }
    y -= 4;
  }
  function module(t) { place(60); y -= 10; page.drawText(net(t).toUpperCase(), { x: M, y: y - 9, size: 9, font: F.bold, color: C.ocreInk }); y -= 18; }
  function titre(t) { place(40); texte(t, { font: F.serif, size: 18, color: C.lagon, gap: 6, lh: 1.2 }); }
  function encadre(titreBloc, lignes) {
    // lignes : [[étiquette, valeur], ...]
    const largeur = W - 2 * M - 28;
    const contenu = [];
    for (const [k, v] of lignes) {
      if (!v) continue;
      if (k) contenu.push({ t: k, f: F.bold, s: 9, c: C.soft, g: 2 });
      for (const l of wrap(v, F.reg, 11, largeur)) contenu.push({ t: l, f: F.reg, s: 11, c: C.ink, g: 0 });
      contenu.push({ sp: 6 });
    }
    if (!contenu.length) contenu.push({ t: "Pas de réponse enregistrée pour cet atelier.", f: F.it, s: 11, c: C.soft, g: 0 });
    place(60); y -= 6;
    page.drawText(net(titreBloc), { x: M, y: y - 12, size: 12, font: F.bold, color: C.lagon }); y -= 22;
    let i = 0;
    while (i < contenu.length) {
      place(40);
      const debut = y; let h = 12; const morceau = [];
      while (i < contenu.length && debut - h - (contenu[i].sp || contenu[i].s * 1.35) > 70) { const c = contenu[i]; h += c.sp || c.s * 1.35 + (c.g || 0); morceau.push(c); i++; }
      page.drawRectangle({ x: M, y: debut - h - 8, width: W - 2 * M, height: h + 8, color: C.sable, borderColor: C.gres, borderWidth: 1 });
      page.drawRectangle({ x: M, y: debut - h - 8, width: 3, height: h + 8, color: C.ocre });
      let yy = debut - 10;
      for (const c of morceau) { if (c.sp) { yy -= c.sp; continue; } page.drawText(net(c.t), { x: M + 14, y: yy - c.s, size: c.s, font: c.f, color: c.c }); yy -= c.s * 1.35 + (c.g || 0); }
      y = debut - h - 18;
      if (i < contenu.length) nouvellePage();
    }
  }

  /* Couverture */
  page = pdf.addPage([W, H]); num++;
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.sable });
  page.drawRectangle({ x: 0, y: H - 14, width: W, height: 14, color: C.lagon });
  const lw = 190, lh = lw * logo.height / logo.width;
  page.drawImage(logo, { x: (W - lw) / 2, y: H - 70 - lh, width: lw, height: lh });
  let cy = H - 110 - lh;
  const centre = (t, font, size, color) => { for (const l of wrap(t, font, size, W - 2 * M)) { const w = font.widthOfTextAtSize(l, size); page.drawText(l, { x: (W - w) / 2, y: cy - size, size, font, color }); cy -= size * 1.25; } };
  centre("MANUEL DU PARTICIPANT", F.bold, 11, C.ocreInk); cy -= 10;
  centre("Identité visuelle & Marketing digital", F.serif, 30, C.lagon); cy -= 2;
  centre("Construire une image de marque cohérente et la rendre visible en ligne", F.it, 12, C.soft); cy -= 46;
  page.drawRectangle({ x: (W - 60) / 2, y: cy, width: 60, height: 3, color: C.ocre }); cy -= 40;
  centre(d.nom || "Participant", F.serif, 40, C.ink);
  if (d.marque) { cy -= 4; centre(d.marque, F.bold, 14, C.ocreInk); }
  cy -= 60;
  centre("Formateur : Hugues Hamba", F.bold, 13, C.lagon); cy -= 4;
  centre("B-Lossom Center · 24/11/2026", F.reg, 12, C.soft);
  page.drawText(net("formation-design.vercel.app"), { x: (W - F.reg.widthOfTextAtSize("formation-design.vercel.app", 9)) / 2, y: 40, size: 9, font: F.reg, color: C.soft });

  /* Contenu */
  nouvellePage();
  titre("Sommaire");
  for (const s of MANUEL) if (s.module) texte("· " + s.module, { size: 11, gap: 1 });
  texte("· Plan d'action : mes 3 actions dans les 30 jours", { size: 11, gap: 1 });
  y -= 10;
  texte("Ce manuel reprend l'essentiel de la formation et toutes vos réponses aux ateliers. Gardez-le près de vous quand vous préparez vos publications.", { font: F.it, color: C.soft });

  for (const s of MANUEL) {
    if (s.module) { if (s.module !== "Introduction") nouvellePage(); module(s.module); }
    titre(s.titre);
    for (const p of s.points) puce(p);
    y -= 4;
    if (s.atelier && s.atelier !== "QUIZ") encadre("Vos réponses · " + NOMS[s.atelier], lignesAtelier(s.atelier, d.ateliers[s.atelier]));
    if (s.atelier === "QUIZ") blocQuiz();
  }

  function blocQuiz() {
    const q = d.quiz;
    if (!q || !Array.isArray(q.reponses)) { encadre("Votre quiz", [["", "Vous n'avez pas répondu au quiz en ligne."]]); return; }
    const score = QUESTIONS.filter((x, i) => q.reponses[i] === x.answer).length;
    const lignes = [["Score", `${score} / ${QUESTIONS.length}`]];
    QUESTIONS.forEach((x, i) => {
      const juste = q.reponses[i] === x.answer;
      lignes.push([`Question ${i + 1} · ${juste ? "bonne réponse" : "à revoir"}`, `${x.question}\nBonne réponse : ${x.options[x.answer - 1]}. ${x.explanation}`]);
    });
    encadre("Votre quiz", lignes);
  }

  nouvellePage();
  module("Plan d'action");
  titre("Mes 3 actions dans les 30 jours");
  texte("Exemples : mettre à jour ma bio, créer ma fiche Google, publier mon premier post lundi.", { font: F.it, color: C.soft, gap: 14 });
  for (let i = 1; i <= 3; i++) {
    place(70);
    page.drawText(`${i}.`, { x: M, y: y - 14, size: 14, font: F.serif, color: C.ocreInk });
    page.drawLine({ start: { x: M + 22, y: y - 16 }, end: { x: W - M - 120, y: y - 16 }, thickness: 0.8, color: C.gres });
    page.drawText(net("Pour le :"), { x: W - M - 110, y: y - 14, size: 10, font: F.reg, color: C.soft });
    page.drawLine({ start: { x: W - M - 62, y: y - 16 }, end: { x: W - M, y: y - 16 }, thickness: 0.8, color: C.gres });
    y -= 50;
  }
  y -= 10;
  texte("Envoyez le lien de votre page à Hugues Hamba d'ici un mois : il sera ravi de voir ce que vous en avez fait.", { color: C.lagon, font: F.bold });

  return await pdf.save();
}

function lignesAtelier(a, r) {
  if (!r) return [];
  const d = r.data || {};
  const L = [["Nom", r.nom], ["Projet ou marque", r.marque]];
  if (a === "P") L.push(["Mon projet en une phrase", d.phraseProjet], ["Une marque que je suis en ligne", d.suivie], ["Pourquoi", d.pourquoi]);
  if (a === "A") {
    const ok = d.cible || d.besoin || d.categorie || d.benefice || d.preuve;
    if (ok) L.push(["Ma phrase de positionnement", `Pour ${d.cible || "..."} qui ${d.besoin || "..."}, ${r.marque || "[marque]"} est ${d.categorie || "..."} qui ${d.benefice || "..."}, grâce à ${d.preuve || "..."}.`]);
  }
  if (a === "B") {
    L.push(["Ambiance", (d.ambiance || []).join(", ")]);
    L.push(["Couleurs", (d.couleurs || []).map((c) => `${c.role} : ${c.nom || "-"} (${(c.hex || "").toUpperCase()})`).join(" · ")]);
    if (d.polices) L.push(["Polices", `Titres : ${d.polices.titres || "-"} · Texte : ${d.polices.texte || "-"}`]);
    L.push(["Style d'images", d.images]);
    if (d.ton && (d.ton.oui || d.ton.non)) L.push(["Ton", `Je suis ${d.ton.oui || "..."}, mais pas ${d.ton.non || "..."}.`]);
    L.push(["Interdits", (d.interdits || []).join(" · ")]);
  }
  if (a === "C") {
    L.push(["Canal principal", d.canal], ["Nom affiché", d.nomAffiche], ["Bio", d.bio], ["Coordonnées et horaires", d.coord], ["Bouton d'action", d.bouton],
           ["Photo de profil", d.photo], ["Bannière", d.banniere], ["Mes corrections", (d.corrections || []).map((x, i) => `${i + 1}. ${x}`).join("\n")]);
  }
  if (a === "D") {
    const posts = (d.posts || []).filter((p) => p.idee || p.pilier);
    if (posts.length) L.push(["Mon planning", posts.map((p) => `${p.jour || "-"} · ${p.pilier || "-"} · ${p.format || "-"} : ${p.idee || ""}`).join("\n")]);
    L.push(["Accroche", d.accroche], ["Texte", d.texte], ["Appel à l'action", d.cta]);
  }
  return L;
}

/* ---------- E-mail ---------- */
export function mailConfigure() { return !!(process.env.SMTP_USER && process.env.SMTP_PASS); }
export async function envoyerManuel(d, email) {
  const port = Number(process.env.SMTP_PORT || 465);
  const t = nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  const pdf = await genererPdf(d);
  const prenom = (d.nom || "").split(" ")[0] || "Bonjour";
  await t.sendMail({
    from: process.env.SMTP_FROM || `Hugues Hamba - B-Lossom Center <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Votre manuel - Identité visuelle & Marketing digital",
    text: `${prenom},\n\nMerci pour votre participation à la formation « Identité visuelle & Marketing digital » au B-Lossom Center.\n\nVous trouverez en pièce jointe votre manuel du participant : le résumé du cours et toutes vos réponses aux ateliers.\n\nN'oubliez pas vos 3 actions dans les 30 jours, et envoyez-moi le lien de votre page d'ici un mois !\n\nHugues Hamba\nB-Lossom Center`,
    attachments: [{ filename: `Manuel - ${(d.nom || "participant").replace(/[^\w\- ]+/g, "")}.pdf`, content: Buffer.from(pdf), contentType: "application/pdf" }]
  });
}

const masquer = (e) => (e ? e.replace(/^(.)[^@]*(@.*)$/, "$1***$2") : "");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const jeton = String(req.query.jeton || "");
      if (!JETON.test(jeton)) return res.status(400).json({ erreur: "Lien invalide." });
      const d = await donnees(jeton);
      if (req.query.info) {
        return res.status(200).json({ nom: d.nom, marque: d.marque, email: masquer(d.participant?.email), ateliers: Object.keys(d.ateliers), quiz: !!d.quiz, mail: mailConfigure() });
      }
      if (!d.nom) return res.status(404).json({ erreur: "Aucune réponse trouvée pour ce participant." });
      const pdf = await genererPdf(d);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Manuel - ${(d.nom || "participant").replace(/[^\w\- ]+/g, "")}.pdf"`);
      return res.status(200).send(Buffer.from(pdf));
    }
    if (req.method === "POST") {
      let b = req.body;
      if (typeof b === "string") { try { b = JSON.parse(b || "{}"); } catch { b = {}; } }
      const jeton = String(b?.jeton || "");
      if (!JETON.test(jeton)) return res.status(400).json({ erreur: "Lien invalide." });
      const d = await donnees(jeton);
      if (!d.nom) return res.status(404).json({ erreur: "Aucune réponse trouvée : participez d'abord à un atelier." });
      let email = d.participant?.email || "";
      if (b?.email) {
        email = String(b.email).trim().slice(0, 254);
        if (!EMAIL.test(email)) return res.status(400).json({ erreur: "Adresse e-mail invalide." });
        await db().hset("participants", { [jeton]: JSON.stringify({ ...(d.participant || {}), nom: d.nom, email, ts: Date.now() }) });
      }
      if (!email) return res.status(400).json({ erreur: "Indiquez votre adresse e-mail." });
      if (!mailConfigure()) return res.status(503).json({ erreur: "L'envoi par e-mail n'est pas encore activé par le formateur. Téléchargez votre manuel en attendant." });
      await envoyerManuel(d, email);
      return res.status(200).json({ ok: true, email: masquer(email) });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erreur: "Méthode non autorisée." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erreur: "Erreur lors de la création ou de l'envoi du manuel." });
  }
}
