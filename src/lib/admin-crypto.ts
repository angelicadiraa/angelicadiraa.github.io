type AdminSecret = {
  kdf: "pbkdf2-sha256";
  iterations: number;
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

function base64ToBuffer(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concat(a: Uint8Array<ArrayBuffer>, b: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

async function decryptToken(pin: string, secret: AdminSecret): Promise<string> {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64ToBuffer(secret.salt),
      iterations: secret.iterations,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBuffer(secret.iv),
      tagLength: 128,
    },
    key,
    concat(base64ToBuffer(secret.ciphertext), base64ToBuffer(secret.tag)),
  );

  return new TextDecoder().decode(plaintext);
}

export async function unlockAdminToken(pin: string): Promise<string> {
  const res = await fetch("/admin-secret.json");
  if (!res.ok) throw new Error("Could not load admin secret.");
  const secret: AdminSecret = await res.json();
  return decryptToken(pin, secret);
}
