import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "admin-secret.json");

const token = process.env.ADMIN_TOKEN;
const pin = process.env.ADMIN_PIN;

if (!token || !pin) {
  console.error("Usage: ADMIN_TOKEN=<token> ADMIN_PIN=<pin> node scripts/encrypt-admin-token.mjs");
  process.exit(1);
}

const salt = randomBytes(16);
const iterations = 200000;
const key = pbkdf2Sync(pin, salt, iterations, 32, "sha256");
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();

const secret = {
  kdf: "pbkdf2-sha256",
  iterations,
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  tag: tag.toString("base64"),
  ciphertext: encrypted.toString("base64"),
};

writeFileSync(outPath, JSON.stringify(secret, null, 2) + "\n");
console.log(`Wrote ${outPath}`);
