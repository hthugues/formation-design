// Ateliers en ligne : enregistrement et lecture des réponses (P, A, B, C, D).
// GET  /api/reponses?atelier=B[&jeton=...][&mien=1]  -> le mur (ou la réponse du participant)
// POST /api/reponses  { atelier, jeton, reponse }      -> enregistre ou met à jour, renvoie le mur
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

export const ATELIERS = ["P", "A", "B", "C", "D"];
export const pid = (jeton) => createHash("sha256").update(String(jeton)).digest("hex").slice(0, 16);
const JETON = /^[a-f0-9]{32}$/;
const MAX_PAR_ATELIER = 300;
const MAX_TAILLE = 8000;

let client;
function db() {
  if (!client) client = Redis.fromEnv();
  return client;
}

function nettoyer(v, max) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
}

export async function lireMur(atelier, jeton) {
  const tout = (await db().hgetall(`atelier:${atelier}`)) || {};
  return Object.entries(tout)
    .map(([cle, v]) => {
      let r = v;
      if (typeof r === "string") {
        try { r = JSON.parse(r); } catch { r = {}; }
      }
      return { ts: r.ts || 0, nom: r.nom || "", marque: r.marque || "", data: r.data || {}, pid: pid(cle), moi: !!jeton && cle === jeton };
    })
    .sort((a, b) => b.ts - a.ts);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const atelier = String(req.query.atelier || "").toUpperCase();
      if (!ATELIERS.includes(atelier)) return res.status(400).json({ erreur: "Atelier inconnu." });
      const jeton = JETON.test(String(req.query.jeton || "")) ? String(req.query.jeton) : "";
      const mur = await lireMur(atelier, jeton);
      if (req.query.mien) {
        const mienne = mur.find((r) => r.moi);
        return res.status(200).json(mienne ? { ...mienne.data, nom: mienne.nom, marque: mienne.marque } : null);
      }
      return res.status(200).json(mur);
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body || "{}"); } catch { body = {}; }
      }
      const atelier = String(body?.atelier || "").toUpperCase();
      const jeton = String(body?.jeton || "");
      const reponse = body?.reponse;
      if (!ATELIERS.includes(atelier)) return res.status(400).json({ erreur: "Atelier inconnu." });
      if (!JETON.test(jeton)) return res.status(400).json({ erreur: "Jeton invalide, rechargez la page." });
      if (!reponse || typeof reponse !== "object" || Array.isArray(reponse)) return res.status(400).json({ erreur: "Réponse vide." });

      const nom = nettoyer(reponse.nom, 80);
      const marque = nettoyer(reponse.marque, 80);
      if (!nom) return res.status(400).json({ erreur: "Indiquez votre nom." });
      if (JSON.stringify(reponse).length > MAX_TAILLE) return res.status(413).json({ erreur: "Réponse trop longue." });

      const cle = `atelier:${atelier}`;
      const existe = await db().hexists(cle, jeton);
      if (!existe && (await db().hlen(cle)) >= MAX_PAR_ATELIER) {
        return res.status(429).json({ erreur: "Le mur de cet atelier est complet." });
      }
      await db().hset(cle, { [jeton]: JSON.stringify({ ts: Date.now(), nom, marque, data: reponse }) });
      return res.status(200).json(await lireMur(atelier, jeton));
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erreur: "Méthode non autorisée." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erreur: "Erreur serveur : vérifiez que la base Upstash Redis est bien connectée au projet." });
  }
}
