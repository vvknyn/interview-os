import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer | null {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) return null;
    return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing iv:tag:ciphertext.
 * If ENCRYPTION_KEY is not set, returns the plaintext unchanged.
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    if (!key) return plaintext;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const tag = cipher.getAuthTag();

    // Combine iv + tag + ciphertext into a single base64 string
    const combined = Buffer.concat([iv, tag, encrypted]);
    return `enc:${combined.toString("base64")}`;
}

/**
 * Decrypt a string that was encrypted with encrypt().
 * If the string doesn't start with "enc:", treats it as plaintext (backwards compat).
 */
export function decrypt(encryptedStr: string): string {
    // Backwards compatibility: if not encrypted, return as-is
    if (!encryptedStr.startsWith("enc:")) {
        return encryptedStr;
    }

    const key = getEncryptionKey();
    if (!key) {
        // No encryption key available - strip prefix and return
        // This shouldn't happen in production but handles gracefully
        console.warn("[Encryption] ENCRYPTION_KEY not set, cannot decrypt");
        return encryptedStr;
    }

    const combined = Buffer.from(encryptedStr.slice(4), "base64");

    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
}

/**
 * Encrypt all non-empty values in a key-value object.
 * Keys (provider names) remain plaintext; values (API keys) get encrypted.
 */
export function encryptKeys(keys: Record<string, string | undefined>): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const [provider, value] of Object.entries(keys)) {
        result[provider] = value ? encrypt(value) : value;
    }
    return result;
}

/**
 * Decrypt all values in a key-value object.
 * Handles mixed encrypted/plaintext values for backwards compatibility.
 */
export function decryptKeys(keys: Record<string, string | undefined>): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const [provider, value] of Object.entries(keys)) {
        result[provider] = value ? decrypt(value) : value;
    }
    return result;
}
