import {
  AuthenticationResult,
  AuthorizationCodeRequest,
  ConfidentialClientApplication,
  Configuration,
  LogLevel,
  ProtocolMode,
} from '@azure/msal-node';
import { getUnixTime } from 'date-fns';
import axios, { AxiosResponse } from 'axios';

export type ExtendedAuthenticationResult = AuthenticationResult & {
  refreshToken?: string;
};

export type AuthenticationAppState =
  | 'login'
  | 'logout'
  | 'password_reset'
  | 'update_profile';

export function getScopes() {
  return [process.env.AZURE_AD_CLIENT_ID as string, 'openid', 'offline_access'];
}

export function getAuthorityDomain(): string {
  const azureAdTenant = process.env.AZURE_AD_TENANT_NAME as string;
  return `https://${azureAdTenant}.b2clogin.com`;
}

export function getAuthorityUrl(): string {
  const azureAdTenant = process.env.AZURE_AD_TENANT_NAME as string;
  const azureAdPolicyName = process.env
    .AZURE_AD_COMBINED_SIGNUP_SIGNIN_POLICY_NAME as string;
  const parts = [
    getAuthorityDomain(),
    `${azureAdTenant}.onmicrosoft.com`,
    azureAdPolicyName,
  ];
  return parts.join('/');
}

export function getMsalNodeClient(): ConfidentialClientApplication {
  // Configuration reference:
  // https://docs.microsoft.com/en-us/azure/active-directory-b2c/tutorial-authenticate-nodejs-web-app-msal
  // See section where confidentialClientConfig is being initialized
  const clientConfig: Configuration = {
    auth: {
      clientId: process.env.AZURE_AD_CLIENT_ID as string,
      authority: getAuthorityUrl(),
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
      knownAuthorities: [getAuthorityDomain()],
      protocolMode: ProtocolMode.AAD,
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Trace,
      },
    },
  };
  return new ConfidentialClientApplication(clientConfig);
}

export function transformToken(input: ExtendedAuthenticationResult, now: Date) {
  if (!input || !input.expiresOn || !input.extExpiresOn) {
    return null;
  }

  return {
    accessToken: input.accessToken,
    refreshToken: input?.refreshToken as string,
    refreshExpiresIn: getUnixTime(input.extExpiresOn) - getUnixTime(now),
    tokenType: input.tokenType,
    expiresAt: getUnixTime(input.expiresOn),
    expiresIn: getUnixTime(input.expiresOn) - getUnixTime(now),
  };
}

export async function redeemCodeForTokens({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}) {
  const azureAdAuthority = getAuthorityUrl();
  const client = getMsalNodeClient();
  const acquireTokenRequest = {
    authority: azureAdAuthority,
    code,
    redirectUri,
    scopes: getScopes(),
  };
  const result = await client.acquireTokenByCode(
    acquireTokenRequest as AuthorizationCodeRequest
  );
  return result;
}

export function getTokenEndpoint() {
  const parts = [getAuthorityUrl(), `oauth2/v2.0/token`];
  return parts.join('/');
}

export async function getTokensFromAuthorizationCode(code: string) {
  const azureAdClientId = process.env.AZURE_AD_CLIENT_ID as string;
  const azureAdClientSecret = process.env.AZURE_AD_CLIENT_SECRET as string;
  const formData = new URLSearchParams({
    client_id: azureAdClientId,
    client_secret: azureAdClientSecret,
    grant_type: 'authorization_code',
    code,
    scope: `${azureAdClientId} openid offline_access`,
    response_type: 'token',
  });
  const tokenEndpoint = getTokenEndpoint();
  const result: AxiosResponse = await axios.post(tokenEndpoint, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  if (axios.isAxiosError(result)) {
    console.error('Error obtaining tokens from AzureAD B2C', result.data);
    throw new Error('Error obtaining tokens from AzureAD B2C');
  }
  const { data: tokenResponse } = result;
  return {
    accessToken: tokenResponse.access_token as string,
    refreshToken: tokenResponse.refresh_token as string,
    expiresOn: tokenResponse.expires_on, // Expiry in seconds
  };
}

export async function refreshTokens(refreshToken: string) {
  const client = getMsalNodeClient();
  const authenticationResult = await client.acquireTokenByRefreshToken({
    refreshToken,
    scopes: getScopes(),
  });
  const now = new Date(Date.now());
  return transformToken(
    authenticationResult as ExtendedAuthenticationResult,
    now
  );
}

export async function getAuthCodeUrl({
  redirectUri,
  prompt = 'login',
}: {
  redirectUri: string;
  prompt?: AuthenticationAppState;
}): Promise<string> {
  const client = getMsalNodeClient();
  return client.getAuthCodeUrl({
    scopes: getScopes(),
    redirectUri,
    prompt,
  });
}
