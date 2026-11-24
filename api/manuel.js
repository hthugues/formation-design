// Manuel du participant (PDF) : résumé du cours + réponses du participant aux ateliers et au quiz.
// GET  /api/manuel?jeton=...&info=1  -> { nom, email (masqué), ateliers faits, quiz }
// GET  /api/manuel?jeton=...         -> le PDF à télécharger
// POST /api/manuel { jeton, email? } -> envoie le PDF par e-mail (met l'adresse à jour si fournie)
import { Redis } from "@upstash/redis";
import nodemailer from "nodemailer";
import { QUESTIONS } from "./_quiz-data.js";
import { genererPdf } from "./_pdf.js";
import { pid } from "./reponses.js";

export { genererPdf };

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
  // photos de l'atelier C (uniquement celles de ce participant)
  out.photos = {};
  if (out.ateliers.C) for (const t of ["profil", "couverture", "post1", "post2", "post3"]) { const v = await db().get(`photo:C:${pid(jeton)}:${t}`); if (typeof v === "string") out.photos[t] = v; }
  // statistiques anonymes du groupe pour le quiz
  const tous = Object.values((await db().hgetall("quiz:final")) || {}).map(lire).filter((q) => q && Array.isArray(q.reponses));
  if (tous.length) {
    const sc = tous.map((q) => QUESTIONS.filter((x, i) => q.reponses[i] === x.answer).length);
    out.groupe = { n: tous.length, moyenne: sc.reduce((a, b) => a + b, 0) / tous.length, parQuestion: QUESTIONS.map((x, i) => tous.filter((q) => q.reponses[i] === x.answer).length / tous.length) };
  }
  out.marque = out.ateliers.P?.marque || Object.values(out.ateliers).find((r) => r.marque)?.marque || "";
  return out;
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
