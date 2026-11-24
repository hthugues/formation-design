// Outils de l'animateur, protégés par la variable d'environnement ADMIN_KEY.
// GET /api/admin?cle=VOTRE_CLE&action=exporter              -> toutes les réponses (JSON)
// GET /api/admin?cle=VOTRE_CLE&action=vider&atelier=B       -> efface les réponses de l'atelier B (ou QUIZ)
import { timingSafeEqual } from "node:crypto";
import { Redis } from "@upstash/redis";
import { lireMur } from "./reponses.js";

const ATELIERS = ["B", "C", "D"];

function cleValide(fournie) {
  const attendue = process.env.ADMIN_KEY || "";
  if (attendue.length < 8) return false;
  const a = Buffer.from(String(fournie || ""));
  const b = Buffer.from(attendue);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!cleValide(req.query.cle)) return res.status(401).json({ erreur: "Clé administrateur absente ou incorrecte." });
  try {
    const action = String(req.query.action || "");
    if (action === "exporter") {
      const tout = {};
      for (const a of ATELIERS) tout[a] = (await lireMur(a, "")).map(({ moi, ...r }) => ({ ...r, date: new Date(r.ts).toISOString() }));
      tout.QUIZ = Object.values((await Redis.fromEnv().hgetall("quiz:final")) || {}).map((v) => (typeof v === "string" ? JSON.parse(v) : v));
      res.setHeader("Content-Disposition", 'attachment; filename="reponses-ateliers.json"');
      return res.status(200).json(tout);
    }
    if (action === "vider") {
      const atelier = String(req.query.atelier || "").toUpperCase();
      if (atelier === "QUIZ") {
        await Redis.fromEnv().del("quiz:final");
        return res.status(200).json({ ok: true, message: "Réponses du quiz effacées." });
      }
      if (!ATELIERS.includes(atelier)) return res.status(400).json({ erreur: "Atelier inconnu (B, C, D ou QUIZ)." });
      await Redis.fromEnv().del(`atelier:${atelier}`);
      return res.status(200).json({ ok: true, message: `Réponses de l'atelier ${atelier} effacées.` });
    }
    return res.status(400).json({ erreur: "Action inconnue : exporter ou vider." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erreur: "Erreur serveur." });
  }
}
