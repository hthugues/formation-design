// Photos de l'atelier « profil digital » (profil, couverture, publications).
// POST /api/photo { atelier, jeton, type, data: "data:image/jpeg;base64,..." }  -> enregistre (déjà compressée par la page)
// GET  /api/photo?a=C&id=<pid>&t=profil[&v=...]                               -> renvoie l'image
import { Redis } from "@upstash/redis";
import { ATELIERS, pid } from "./reponses.js";

const TYPES = ["profil", "couverture", "post1", "post2", "post3"];
const JETON = /^[a-f0-9]{32}$/;
const ID = /^[a-f0-9]{16}$/;
const MAX = 450000; // environ 330 Ko d'image

let client;
const db = () => (client ||= Redis.fromEnv());

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const a = String(req.query.a || "").toUpperCase(), id = String(req.query.id || ""), t = String(req.query.t || "");
      if (!ATELIERS.includes(a) || !ID.test(id) || !TYPES.includes(t)) return res.status(400).end();
      const data = await db().get(`photo:${a}:${id}:${t}`);
      if (!data || typeof data !== "string") return res.status(404).end();
      const m = data.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if (!m) return res.status(404).end();
      res.setHeader("Content-Type", m[1]);
      res.setHeader("Cache-Control", req.query.v ? "public, max-age=31536000, immutable" : "no-store");
      return res.status(200).send(Buffer.from(m[2], "base64"));
    }
    if (req.method === "POST") {
      let b = req.body;
      if (typeof b === "string") { try { b = JSON.parse(b || "{}"); } catch { b = {}; } }
      const a = String(b?.atelier || "").toUpperCase(), jeton = String(b?.jeton || ""), t = String(b?.type || ""), data = String(b?.data || "");
      if (!ATELIERS.includes(a) || !JETON.test(jeton) || !TYPES.includes(t)) return res.status(400).json({ erreur: "Requête invalide." });
      if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data)) return res.status(400).json({ erreur: "Image invalide." });
      if (data.length > MAX) return res.status(413).json({ erreur: "Image trop lourde." });
      const cle = `photo:${a}:${pid(jeton)}:${t}`;
      await db().set(cle, data);
      await db().sadd(`photos:${a}`, cle);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erreur: "Erreur serveur." });
  }
}
