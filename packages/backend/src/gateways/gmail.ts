import crypto from 'node:crypto';
import { declutterEmailContent, Message, classifySmartCategory } from '@vibery/shared';
import { sanitizeHeader } from '../security/sanitizer.js';

export interface GmailOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  tokenType: string;
  scope: string;
}

export interface GmailWebhookEvent {
  subscription: string;
  message: {
    data: string; // Base64 encoded JSON
    messageId: string;
    publishTime: string;
  };
}

export interface DecodedPubSubPayload {
  emailAddress: string;
  historyId: string;
}

export class GmailGateway {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private pendingStates: Map<string, number> = new Map(); // CSRF state token store with TTL

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
  }

  /**
   * Generates Google OAuth2 consent URL with offline access and state parameter for CSRF defense
   */
  public generateAuthUrl(state?: string): { url: string; state: string } {
    const randomState = state || crypto.randomBytes(24).toString('hex');
    // Store with 10 minute expiry
    this.pendingStates.set(randomState, Date.now() + 10 * 60 * 1000);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
      access_type: 'offline',
      prompt: 'consent',
      state: randomState,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state: randomState,
    };
  }

  /**
   * Verifies CSRF state token validity
   */
  public verifyState(state: string): boolean {
    if (!state) return false;
    const expiresAt = this.pendingStates.get(state);
    if (!expiresAt) return false;
    this.pendingStates.delete(state);
    return Date.now() <= expiresAt;
  }

  /**
   * Exchanges authorization code for OAuth tokens
   */
  public async exchangeCode(code: string): Promise<GmailOAuthTokens> {
    // In production, performs POST to https://oauth2.googleapis.com/token
    // Here we provide the full robust implementation with mock fallback for dev
    if (this.clientId === 'mock-google-client-id') {
      return {
        accessToken: `mock_access_gmail_${crypto.randomBytes(8).toString('hex')}`,
        refreshToken: `mock_refresh_gmail_${crypto.randomBytes(16).toString('hex')}`,
        expiresInSeconds: 3600,
        tokenType: 'Bearer',
        scope: 'gmail.modify gmail.send',
      };
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      throw new Error(`Google token exchange failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresInSeconds: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Decodes Google Cloud Pub/Sub push notification payload
   */
  public parsePubSubPush(event: GmailWebhookEvent): DecodedPubSubPayload {
    if (!event.message || !event.message.data) {
      throw new Error('Invalid PubSub push notification: missing message.data');
    }

    const jsonStr = Buffer.from(event.message.data, 'base64').toString('utf-8');
    const decoded = JSON.parse(jsonStr);

    if (!decoded.emailAddress || !decoded.historyId) {
      throw new Error('Invalid PubSub payload structure: missing emailAddress or historyId');
    }

    return {
      emailAddress: decoded.emailAddress,
      historyId: String(decoded.historyId),
    };
  }

  /**
   * Normalizes raw email content into clean Message entity using De-clutter Engine
   */
  public normalizeMessage(params: {
    rawId: string;
    conversationId: string;
    sender: { name: string; email: string };
    recipients: string[];
    subject: string;
    rawBody: string;
    timestamp?: number;
    attachments?: any[];
  }): Message {
    const cleanResult = declutterEmailContent(params.rawBody);
    const category = classifySmartCategory(params.sender.email, params.subject, cleanResult.cleanBody);

    return {
      id: `msg-gm-${params.rawId}`,
      conversationId: params.conversationId,
      providerMessageId: `<${params.rawId}@mail.gmail.com>`,
      provider: 'gmail',
      sender: params.sender,
      recipients: params.recipients,
      subject: params.subject,
      timestamp: params.timestamp || Date.now(),
      isOutgoing: false,
      status: 'read',
      cleanBody: cleanResult.cleanBody,
      greeting: cleanResult.isolatedGreeting,
      signature: cleanResult.signature,
      collapsedQuote: cleanResult.collapsedQuote,
      attachments: params.attachments || [],
    };
  }

  /**
   * Formats an outgoing message into an RFC 2822 / RFC 822 base64url string for Gmail API
   */
  public buildRfc822Payload(params: {
    from: string;
    to: string;
    subject: string;
    body: string;
    inReplyTo?: string;
    references?: string;
  }): string {
    const cleanFrom = sanitizeHeader(params.from);
    const cleanTo = sanitizeHeader(params.to);
    const cleanSubject = sanitizeHeader(params.subject);
    const cleanInReplyTo = params.inReplyTo ? sanitizeHeader(params.inReplyTo) : undefined;
    const cleanReferences = params.references ? sanitizeHeader(params.references) : undefined;

    const messageId = `<${Date.now()}.${crypto.randomBytes(6).toString('hex')}@threads.local>`;
    const lines = [
      `From: ${cleanFrom}`,
      `To: ${cleanTo}`,
      `Subject: =?utf-8?B?${Buffer.from(cleanSubject).toString('base64')}?=`,
      `Message-ID: ${messageId}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8; format=flowed`,
      `Content-Transfer-Encoding: base64`,
    ];

    if (cleanInReplyTo) {
      lines.push(`In-Reply-To: ${cleanInReplyTo}`);
    }
    if (cleanReferences) {
      lines.push(`References: ${cleanReferences}`);
    }

    lines.push('', Buffer.from(params.body, 'utf-8').toString('base64'));

    const raw = lines.join('\r\n');
    return Buffer.from(raw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

export const gmailGateway = new GmailGateway();
