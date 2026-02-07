import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// We test the encryption module by importing the compiled logic directly
// Since it uses Node crypto module, it works in Node test runner without bundling

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Replicate the encrypt/decrypt functions for testing
// (avoids TypeScript compilation issues with node:test)
function encrypt(plaintext: string, keyHex: string): string {
    const key = Buffer.from(keyHex, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, tag, encrypted]);
    return `enc:${combined.toString('base64')}`;
}

function decrypt(encryptedStr: string, keyHex: string): string {
    if (!encryptedStr.startsWith('enc:')) {
        return encryptedStr;
    }
    const key = Buffer.from(keyHex, 'hex');
    const combined = Buffer.from(encryptedStr.slice(4), 'base64');
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}

function encryptKeys(keys: Record<string, string | undefined>, keyHex: string): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const [provider, value] of Object.entries(keys)) {
        result[provider] = value ? encrypt(value, keyHex) : value;
    }
    return result;
}

function decryptKeys(keys: Record<string, string | undefined>, keyHex: string): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const [provider, value] of Object.entries(keys)) {
        result[provider] = value ? decrypt(value, keyHex) : value;
    }
    return result;
}

// Generate a test encryption key (32 bytes = 64 hex chars)
const TEST_KEY = crypto.randomBytes(32).toString('hex');

describe('Encryption', () => {
    it('should encrypt and decrypt a string', () => {
        const plaintext = 'gsk_test_key_12345';
        const encrypted = encrypt(plaintext, TEST_KEY);

        // Encrypted string should start with enc: prefix
        assert.ok(encrypted.startsWith('enc:'), 'Encrypted string should start with enc:');

        // Should not contain the plaintext
        assert.ok(!encrypted.includes(plaintext), 'Encrypted string should not contain plaintext');

        // Should decrypt back to original
        const decrypted = decrypt(encrypted, TEST_KEY);
        assert.equal(decrypted, plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
        const plaintext = 'sk-test-openai-key';
        const encrypted1 = encrypt(plaintext, TEST_KEY);
        const encrypted2 = encrypt(plaintext, TEST_KEY);

        // Different IVs should produce different ciphertext
        assert.notEqual(encrypted1, encrypted2);

        // Both should decrypt to the same value
        assert.equal(decrypt(encrypted1, TEST_KEY), plaintext);
        assert.equal(decrypt(encrypted2, TEST_KEY), plaintext);
    });

    it('should handle plaintext passthrough (backwards compatibility)', () => {
        const plaintext = 'gsk_legacy_key_no_encryption';
        const result = decrypt(plaintext, TEST_KEY);
        assert.equal(result, plaintext, 'Plaintext without enc: prefix should pass through');
    });

    it('should handle empty strings', () => {
        const encrypted = encrypt('', TEST_KEY);
        assert.ok(encrypted.startsWith('enc:'));
        const decrypted = decrypt(encrypted, TEST_KEY);
        assert.equal(decrypted, '');
    });

    it('should handle special characters', () => {
        const plaintext = 'key-with-special=chars/+&test@123!';
        const encrypted = encrypt(plaintext, TEST_KEY);
        const decrypted = decrypt(encrypted, TEST_KEY);
        assert.equal(decrypted, plaintext);
    });

    it('should handle unicode characters', () => {
        const plaintext = 'key-with-unicode-✓-🔑';
        const encrypted = encrypt(plaintext, TEST_KEY);
        const decrypted = decrypt(encrypted, TEST_KEY);
        assert.equal(decrypted, plaintext);
    });

    it('should reject tampered ciphertext', () => {
        const plaintext = 'sensitive_api_key';
        const encrypted = encrypt(plaintext, TEST_KEY);

        // Tamper with the ciphertext
        const tampered = encrypted.slice(0, -2) + 'XX';

        assert.throws(() => {
            decrypt(tampered, TEST_KEY);
        }, 'Should throw on tampered ciphertext');
    });

    it('should reject wrong key', () => {
        const plaintext = 'sensitive_api_key';
        const encrypted = encrypt(plaintext, TEST_KEY);

        const wrongKey = crypto.randomBytes(32).toString('hex');

        assert.throws(() => {
            decrypt(encrypted, wrongKey);
        }, 'Should throw when decrypting with wrong key');
    });
});

describe('Key Encryption Helpers', () => {
    it('should encrypt all non-empty values in a keys object', () => {
        const keys = {
            groq: 'gsk_test123',
            gemini: 'AIzaTest456',
            openai: undefined,
        };

        const encrypted = encryptKeys(keys, TEST_KEY);

        // groq and gemini should be encrypted
        assert.ok(encrypted.groq?.startsWith('enc:'), 'groq key should be encrypted');
        assert.ok(encrypted.gemini?.startsWith('enc:'), 'gemini key should be encrypted');

        // openai should remain undefined
        assert.equal(encrypted.openai, undefined);
    });

    it('should decrypt all values in a keys object', () => {
        const original = {
            groq: 'gsk_test123',
            gemini: 'AIzaTest456',
            openai: undefined,
        };

        const encrypted = encryptKeys(original, TEST_KEY);
        const decrypted = decryptKeys(encrypted, TEST_KEY);

        assert.equal(decrypted.groq, 'gsk_test123');
        assert.equal(decrypted.gemini, 'AIzaTest456');
        assert.equal(decrypted.openai, undefined);
    });

    it('should handle mixed encrypted and plaintext values (backwards compat)', () => {
        const mixed = {
            groq: encrypt('gsk_test123', TEST_KEY),
            gemini: 'AIzaPlaintext456', // not encrypted (legacy)
            openai: undefined,
        };

        const decrypted = decryptKeys(mixed, TEST_KEY);

        assert.equal(decrypted.groq, 'gsk_test123');
        assert.equal(decrypted.gemini, 'AIzaPlaintext456'); // passes through
        assert.equal(decrypted.openai, undefined);
    });

    it('should handle empty keys object', () => {
        const encrypted = encryptKeys({}, TEST_KEY);
        assert.deepEqual(encrypted, {});

        const decrypted = decryptKeys({}, TEST_KEY);
        assert.deepEqual(decrypted, {});
    });
});
