import crypto from 'node:crypto';

export interface SessionInfo {
  token: string;
  createdAt: number;
  lastUsedAt: number;
}

export class SessionManager {
  private static readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly DEV_DEFAULT_TOKEN = 'threads-dev-session-token-2026';
  private sessions: Map<string, SessionInfo> = new Map();

  constructor() {
    // Seed default session token for dev/test environments
    if (process.env.NODE_ENV !== 'production') {
      this.sessions.set(SessionManager.DEV_DEFAULT_TOKEN, {
        token: SessionManager.DEV_DEFAULT_TOKEN,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      });
    }

    if (process.env.THREADS_SESSION_TOKEN) {
      this.sessions.set(process.env.THREADS_SESSION_TOKEN, {
        token: process.env.THREADS_SESSION_TOKEN,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      });
    }
  }

  /**
   * Issues a new secure random session token.
   */
  public issueSessionToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.sessions.set(token, {
      token,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    });
    this.cleanupExpired();
    return token;
  }

  /**
   * Validates if a session token is active and unexpired.
   */
  public validateSessionToken(token: string | undefined | null): boolean {
    if (!token || typeof token !== 'string') return false;

    // Reject dev token in production
    if (process.env.NODE_ENV === 'production' && token === SessionManager.DEV_DEFAULT_TOKEN) {
      return false;
    }

    const session = this.sessions.get(token);
    if (!session) return false;

    const now = Date.now();
    if (now - session.createdAt > SessionManager.TTL_MS) {
      this.sessions.delete(token);
      return false;
    }

    session.lastUsedAt = now;
    return true;
  }

  /**
   * Revokes a session token.
   */
  public revokeSessionToken(token: string): boolean {
    return this.sessions.delete(token);
  }

  public getActiveCount(): number {
    return this.sessions.size;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (now - session.createdAt > SessionManager.TTL_MS) {
        this.sessions.delete(token);
      }
    }
  }
}

export const sessionManager = new SessionManager();
