import crypto from 'node:crypto';
import { TokenSecurityEngine, EncryptedPayload } from './crypto.js';

export interface StoredCredential {
  id: string;
  userId: string;
  provider: 'gmail' | 'yandex';
  accountEmail: string;
  encryptedToken: EncryptedPayload;
  createdAt: number;
  updatedAt: number;
}

/**
 * TokenVault - Privacy-by-design secure storage for OAuth refresh tokens
 * and IMAP app passwords using AES-256-GCM Envelope Encryption.
 */
export class TokenVault {
  private cryptoEngine: TokenSecurityEngine;
  private vaultStore: Map<string, StoredCredential> = new Map();

  constructor(masterSecret?: string) {
    this.cryptoEngine = new TokenSecurityEngine(masterSecret);
  }

  /**
   * Encrypts and securely stores an authentication secret
   */
  public storeToken(
    userId: string,
    provider: 'gmail' | 'yandex',
    accountEmail: string,
    rawSecret: string
  ): StoredCredential {
    if (!userId || !userId.trim()) throw new Error('Invalid userId: cannot be empty');
    if (provider !== 'gmail' && provider !== 'yandex') throw new Error('Invalid provider: must be gmail or yandex');
    if (!accountEmail || !accountEmail.includes('@')) throw new Error('Invalid accountEmail: must be valid email address');
    if (!rawSecret || !rawSecret.trim()) throw new Error('Invalid rawSecret: secret cannot be empty');

    const cleanEmail = accountEmail.trim().toLowerCase();
    const cleanUserId = userId.trim();
    const aad = JSON.stringify({ userId: cleanUserId, provider, accountEmail: cleanEmail });
    const encrypted = this.cryptoEngine.encryptToken(rawSecret, aad);

    const id = `sec_${provider}_${crypto.createHash('sha256').update(cleanEmail).digest('hex').slice(0, 16)}`;
    const record: StoredCredential = {
      id,
      userId,
      provider,
      accountEmail,
      encryptedToken: encrypted,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.vaultStore.set(id, record);
    return record;
  }

  /**
   * Retrieves and decrypts the credential with AEAD verification
   */
  public retrieveToken(id: string): string | null {
    const record = this.vaultStore.get(id);
    if (!record) return null;

    try {
      const aad = JSON.stringify({
        userId: record.userId,
        provider: record.provider,
        accountEmail: record.accountEmail,
      });
      return this.cryptoEngine.decryptToken(record.encryptedToken, aad);
    } catch (err) {
      console.error(`[TokenVault] Decryption / AEAD integrity failure for ${id}:`, err);
      return null;
    }
  }

  /**
   * Retrieves all registered accounts for a user (without exposing raw secrets)
   */
  public listAccountsForUser(userId: string): Array<Omit<StoredCredential, 'encryptedToken'>> {
    const results: Array<Omit<StoredCredential, 'encryptedToken'>> = [];
    for (const record of this.vaultStore.values()) {
      if (record.userId === userId) {
        const { encryptedToken, ...safeMeta } = record;
        results.push(safeMeta);
      }
    }
    return results;
  }

  /**
   * Revokes and securely clears a stored credential
   */
  public revokeToken(id: string): boolean {
    return this.vaultStore.delete(id);
  }
}

export const tokenVault = new TokenVault(process.env.MASTER_KEY_HEX);
