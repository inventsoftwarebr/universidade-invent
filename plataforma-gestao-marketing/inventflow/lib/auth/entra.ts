import * as client from "openid-client";

/**
 * Login com a conta Microsoft da Invent (Entra ID), via OpenID Connect com PKCE.
 *
 * Fica ativo quando ENTRA_TENANT_ID, ENTRA_CLIENT_ID e ENTRA_CLIENT_SECRET
 * estão presentes. Sem eles, a aplicação cai no modo piloto (ver lib/auth).
 *
 * ATENÇÃO: este caminho ainda não foi exercido contra o tenant da Invent —
 * depende do registro de aplicativo pelo TI (§07 do escopo). Validar antes do
 * go-live; até lá o modo piloto é o que está em uso.
 */

export interface EntraProfile {
  objectId: string;
  email: string;
  name: string;
  jobTitle: string | null;
}

export function entraConfigured(): boolean {
  return Boolean(
    process.env.ENTRA_TENANT_ID &&
      process.env.ENTRA_CLIENT_ID &&
      process.env.ENTRA_CLIENT_SECRET,
  );
}

export function redirectUri(): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/auth/callback`;
}

async function configuration(): Promise<client.Configuration> {
  return client.discovery(
    new URL(`https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/v2.0`),
    process.env.ENTRA_CLIENT_ID!,
    process.env.ENTRA_CLIENT_SECRET!,
  );
}

export interface AuthorizationStart {
  url: string;
  codeVerifier: string;
  state: string;
  nonce: string;
}

export async function startAuthorization(): Promise<AuthorizationStart> {
  const config = await configuration();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri(),
    scope: "openid profile email User.Read",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  return { url: url.href, codeVerifier, state, nonce };
}

export async function completeAuthorization(
  currentUrl: URL,
  checks: { codeVerifier: string; state: string; nonce: string },
): Promise<EntraProfile> {
  const config = await configuration();
  const tokens = await client.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: checks.codeVerifier,
    expectedState: checks.state,
    expectedNonce: checks.nonce,
  });

  const claims = tokens.claims();
  if (!claims) throw new Error("Resposta do Entra ID sem id_token.");

  const email =
    (claims.email as string | undefined) ??
    (claims.preferred_username as string | undefined);
  if (!email) throw new Error("Resposta do Entra ID sem e-mail.");

  return {
    objectId: String(claims.oid ?? claims.sub),
    email: email.toLowerCase(),
    name: (claims.name as string | undefined) ?? email,
    jobTitle: null,
  };
}
