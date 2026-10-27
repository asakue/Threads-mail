import crypto from 'node:crypto';

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64
  authTag: string;    // Base64
  keyVersion: number;
}

/**
 * Security module for OAuth tokens and secret credentials.
 * Implements AES-256-GCM Envelope Encryption with authenticated data (AEAD).
 */
export class TokenSecurityEngine {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // Standard 96-bit IV for GCM
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly CURRENT_KEY_VERSION = 1;

  // Master key derived or injected from KMS / environment
  private masterKey: Buffer;

  constructor(masterSecret = process.env.VIBERY_KMS_MASTER_SECRET || 'vibery-production-kms-master-secret-key-32b-length!!') {
    // Ensure 256-bit key via SHA-256 derivation
    this.masterKey = crypto.createHash('sha256').update(masterSecret).digest();
  }

  /**
   * Encrypts a sensitive OAuth refresh token or app password with AES-256-GCM.
   */
  public encryptToken(plainText: string, associatedData = 'vibery-oauth-v1'): EncryptedPayload {
    const iv = crypto.randomBytes(TokenSecurityEngine.IV_LENGTH);
    const cipher = crypto.createCipheriv(TokenSecurityEngine.ALGORITHM, this.masterKey, iv, {
      authTagLength: TokenSecurityEngine.AUTH_TAG_LENGTH,
    });

    cipher.setAAD(Buffer.from(associatedData, 'utf8'));

    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyVersion: TokenSecurityEngine.CURRENT_KEY_VERSION,
    };
  }

  /**
   * Decrypts an encrypted token and validates its authenticity tag.
   */
  public decryptToken(payload: EncryptedPayload, associatedData = 'vibery-oauth-v1'): string {
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');

    const decipher = crypto.createDecipheriv(TokenSecurityEngine.ALGORITHM, this.masterKey, iv, {
      authTagLength: TokenSecurityEngine.AUTH_TAG_LENGTH,
    });

    decipher.setAAD(Buffer.from(associatedData, 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export const tokenSecurity = new TokenSecurityEngine();
