// Quiz final en ligne.
// GET  /api/quiz?questions=1         -> les questions, sans les réponses (page participant)
// GET  /api/quiz[?jeton=...]          -> participants, scores et votes par question (+ ma réponse)
// GET  /api/quiz?resultats=1          -> idem, avec les bonnes réponses et les explications
// POST /api/quiz { jeton, nom, reponses: [1..3 x 5] } -> enregistre, renvoie le score et les corrections
import { Redis } from "@upstash/redis";
import { QUESTIONS } from "./_quiz-data.js";

const CLE = "quiz:final";
const JETON = /^[a-f0-9]{32}$/;
const MAX_PARTICIPANTS = 300;

let client;
function db() {
  if (!client) client = Redis.fromEnv();
  return client;
}

function corriger(reponses) {
  return QUESTIONS.map((q, i) => ({ choix: reponses[i] || 0, bonne: q.answer, juste: reponses[i] === q.answer }));
}

async function etat(jeton, avecReponses) {
  const tout = (await db().hgetall(CLE)) || {};
  const stats = QUESTIONS.map(() => [0, 0, 0]);
  const participants = [];
  let moi = null;
  for (const [cle, v] of Object.entries(tout)) {
    let r = v;
    if (typeof r === "string") {
      try { r = JSON.parse(r); } catch { continue; }
    }
    const rep = Array.isArray(r.reponses) ? r.reponses : [];
    rep.forEach((c, i) => { if (stats[i] && c >= 1 && c <= 3) stats[i][c - 1]++; });
    const score = corriger(rep).filter((x) => x.juste).length;
    participants.push({ nom: r.nom || "", score, ts: r.ts || 0 });
    if (jeton && cle === jeton) moi = { nom: r.nom, reponses: rep, score, corrections: corriger(rep) };
  }
  participants.sort((a, b) => b.score - a.score || a.ts - b.ts);
  const out = { total: participants.length, stats, participants, moi };
  if (avecReponses) out.questions = QUESTIONS;
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      if (req.query.questions) {
        return res.status(200).json(QUESTIONS.map(({ theme, question, options }) => ({ theme, question, options })));
      }
      const jeton = JETON.test(String(req.query.jeton || "")) ? String(req.query.jeton) : "";
      return res.status(200).json(await etat(jeton, !!req.query.resultats));
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body || "{}"); } catch { body = {}; }
      }
      const jeton = String(body?.jeton || "");
      const nom = String(body?.nom || "").replace(/\s+/g, " ").trim().slice(0, 80);
      const reponses = Array.isArray(body?.reponses) ? body.reponses.slice(0, QUESTIONS.length).map((x) => Number(x) || 0) : [];
      if (!JETON.test(jeton)) return res.status(400).json({ erreur: "Jeton invalide, rechargez la page." });
      if (!nom) return res.status(400).json({ erreur: "Indiquez votre nom." });
      if (reponses.length !== QUESTIONS.length || reponses.some((x) => x < 1 || x > 3)) {
        return res.status(400).json({ erreur: "Répondez aux 5 questions." });
      }
      const existe = await db().hexists(CLE, jeton);
      if (!existe && (await db().hlen(CLE)) >= MAX_PARTICIPANTS) return res.status(429).json({ erreur: "Le quiz est complet." });
      await db().hset(CLE, { [jeton]: JSON.stringify({ ts: Date.now(), nom, reponses }) });
      const corrections = corriger(reponses);
      return res.status(200).json({
        score: corrections.filter((x) => x.juste).length,
        corrections: corrections.map((c, i) => ({ ...c, explication: QUESTIONS[i].explanation }))
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erreur: "Méthode non autorisée." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erreur: "Erreur serveur : vérifiez la base Upstash Redis." });
  }
}
