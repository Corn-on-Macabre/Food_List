import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { InvalidTokenError, InvalidGrantError } from '@modelcontextprotocol/sdk/server/auth/errors.js';

/**
 * Single-user OAuth provider for the MCP admin endpoint.
 *
 * "Logging in" means entering the curator ADMIN_PASSWORD on a minimal HTML
 * form — there is exactly one user. Clients (Claude app connectors) register
 * via Dynamic Client Registration; issued tokens carry the 'admin' scope.
 * All state persists to a JSON file so tokens survive container restarts.
 * The file must live OUTSIDE the web root (it holds live credentials).
 */

const CODE_TTL_MS = 5 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const randomToken = () => crypto.randomBytes(32).toString('base64url');

/** Constant-time string comparison — never compare credentials with ===. */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export class FoodListOAuthProvider {
  constructor(stateFile) {
    this.stateFile = stateFile;
    this.state = { clients: {}, codes: {}, tokens: {}, refreshTokens: {} };
    try {
      this.state = { ...this.state, ...JSON.parse(fs.readFileSync(stateFile, 'utf-8')) };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  _save() {
    // Prune expired codes/tokens on every write to keep the file small
    const now = Date.now();
    for (const [c, v] of Object.entries(this.state.codes)) if (v.expiresAt < now) delete this.state.codes[c];
    for (const [t, v] of Object.entries(this.state.tokens)) if (v.expiresAt < now) delete this.state.tokens[t];
    fs.mkdirSync(path.dirname(this.stateFile), { recursive: true });
    const tmp = this.stateFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.state), { mode: 0o600 });
    fs.renameSync(tmp, this.stateFile);
  }

  get clientsStore() {
    return {
      getClient: (clientId) => this.state.clients[clientId],
      registerClient: (client) => {
        this.state.clients[client.client_id] = client;
        this._save();
        return client;
      },
    };
  }

  /** GET /authorize — render the curator login form (the whole "consent" UI). */
  async authorize(client, params, res) {
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    res.status(200).type('html').send(`<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>bobby.menu — connect</title>
<style>
  body{font-family:Georgia,serif;background:#faf7f0;display:flex;justify-content:center;padding:15vh 16px 0;margin:0}
  form{background:#fff;border:1px solid #e7e0d2;border-radius:12px;padding:28px;max-width:340px;width:100%;box-shadow:0 2px 12px rgba(0,0,0,.06)}
  h1{font-size:22px;margin:0 0 4px;color:#1c1917} p{font-size:14px;color:#78716c;margin:0 0 18px}
  input{width:100%;box-sizing:border-box;padding:10px 12px;font-size:16px;border:1.5px solid #d6cdb8;border-radius:8px;margin-bottom:14px}
  button{width:100%;padding:11px;font-size:15px;font-weight:700;color:#fff;background:#b45419;border:0;border-radius:8px;cursor:pointer}
</style></head><body>
<form method="post" action="/mcp-auth/consent">
  <h1>bobby.menu</h1>
  <p>${esc(client.client_name || 'An MCP client')} is asking for curator (write) access. Enter the admin password to allow it.</p>
  <input type="password" name="password" placeholder="Admin password" autofocus required>
  <input type="hidden" name="client_id" value="${esc(client.client_id)}">
  <input type="hidden" name="redirect_uri" value="${esc(params.redirectUri)}">
  <input type="hidden" name="code_challenge" value="${esc(params.codeChallenge)}">
  <input type="hidden" name="state" value="${esc(params.state)}">
  <input type="hidden" name="resource" value="${esc(params.resource ?? '')}">
  <button type="submit">Allow curator access</button>
</form></body></html>`);
  }

  /** Express handler for the login form POST. Issues the authorization code. */
  consentHandler(adminPassword) {
    return (req, res) => {
      const { password, client_id, redirect_uri, code_challenge, state } = req.body ?? {};
      const client = this.state.clients[client_id];
      if (!client || !client.redirect_uris?.includes(redirect_uri)) {
        return res.status(400).send('Unknown client or redirect URI');
      }
      const url = new URL(redirect_uri);
      if (!safeEqual(password, adminPassword)) {
        url.searchParams.set('error', 'access_denied');
        url.searchParams.set('error_description', 'Wrong password');
        if (state) url.searchParams.set('state', state);
        return res.redirect(url.toString());
      }
      const code = randomToken();
      this.state.codes[code] = {
        clientId: client_id,
        codeChallenge: code_challenge,
        redirectUri: redirect_uri,
        expiresAt: Date.now() + CODE_TTL_MS,
      };
      this._save();
      url.searchParams.set('code', code);
      if (state) url.searchParams.set('state', state);
      res.redirect(url.toString());
    };
  }

  /** The SDK's token handler verifies PKCE against this value itself. */
  async challengeForAuthorizationCode(client, authorizationCode) {
    const record = this.state.codes[authorizationCode];
    if (!record || record.clientId !== client.client_id) {
      throw new InvalidGrantError('Unknown authorization code');
    }
    return record.codeChallenge;
  }

  async exchangeAuthorizationCode(client, authorizationCode) {
    const record = this.state.codes[authorizationCode];
    if (!record || record.clientId !== client.client_id) {
      throw new InvalidGrantError('Unknown authorization code');
    }
    delete this.state.codes[authorizationCode];
    if (record.expiresAt < Date.now()) {
      this._save();
      throw new InvalidGrantError('Authorization code expired');
    }
    return this._issueTokens(client.client_id);
  }

  async exchangeRefreshToken(client, refreshToken) {
    const record = this.state.refreshTokens[refreshToken];
    if (!record || record.clientId !== client.client_id) {
      throw new InvalidGrantError('Unknown refresh token');
    }
    delete this.state.refreshTokens[refreshToken];
    return this._issueTokens(client.client_id);
  }

  _issueTokens(clientId) {
    const accessToken = randomToken();
    const refreshToken = randomToken();
    this.state.tokens[accessToken] = { clientId, expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS };
    this.state.refreshTokens[refreshToken] = { clientId };
    this._save();
    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
      refresh_token: refreshToken,
      scope: 'admin',
    };
  }

  async verifyAccessToken(token) {
    const record = this.state.tokens[token];
    if (!record) throw new InvalidTokenError('Unknown token');
    if (record.expiresAt < Date.now()) {
      delete this.state.tokens[token];
      this._save();
      throw new InvalidTokenError('Token expired');
    }
    return {
      token,
      clientId: record.clientId,
      scopes: ['admin'],
      expiresAt: Math.floor(record.expiresAt / 1000),
    };
  }

  async revokeToken(client, { token }) {
    delete this.state.tokens[token];
    delete this.state.refreshTokens[token];
    this._save();
  }

  /** Non-throwing check used by the MCP endpoints. */
  async isValidToken(token) {
    try {
      await this.verifyAccessToken(token);
      return true;
    } catch {
      return false;
    }
  }
}
