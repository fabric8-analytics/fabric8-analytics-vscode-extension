import * as vscode from 'vscode';

import * as client from 'openid-client';
import { outputChannelDep } from './extension';
import { record, TelemetryActions } from './redhatTelemetry';
import { caStatusBarProvider } from './caStatusBarProvider';
import { globalConfig } from './config';

// OIDC flow state storage
interface OIDCFlowState {
  codeVerifier: string;
  state?: string;
  nonce: string;
}

const callbackUrl = 'vscode://redhat.fabric8-analytics/auth-callback';

/**
 * Performs OIDC Authorization Code Flow with VSCode URL handler
 */
export async function performOIDCAuthorizationFlow(context: vscode.ExtensionContext): Promise<void> {
  const clientId = globalConfig.oidcClientId;
  const realmUrl = globalConfig.oidcRealmUrl;

  try {
    let config: client.Configuration | undefined;

    try {
      config = await client.discovery(
        new URL(realmUrl),
        clientId,
        undefined,
        undefined,
        {
          execute: globalConfig.oidcAllowInsecure ? [client.allowInsecureRequests] : [],
        }
      );
      outputChannelDep.info(`Discovery successful for: ${realmUrl}`);
    } catch (error) {
      outputChannelDep.info(`Discovery failed for ${realmUrl}: ${error}`);
    }

    if (!config) {
      throw new Error(`Could not discover OIDC configuration from ${realmUrl}`);
    }

    outputChannelDep.debug(`Using issuer: ${realmUrl}`);
    outputChannelDep.debug(`Authorization endpoint: ${config.serverMetadata().authorization_endpoint}`);

    // Generate PKCE parameters
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const nonce = client.randomNonce();

    let state: string | undefined;
    const parameters: Record<string, string> = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      redirect_uri: callbackUrl,
      scope: 'openid profile email',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      code_challenge: codeChallenge,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      code_challenge_method: 'S256',
      nonce: nonce,
    };

    // Use state if PKCE is not supported
    if (!config.serverMetadata().supportsPKCE()) {
      state = client.randomState();
      parameters.state = state;
    }

    // Store flow state for callback verification
    const flowState: OIDCFlowState = {
      codeVerifier,
      state,
      nonce,
    };
    await context.globalState.update('rhda-oidc-flow-state', flowState);

    // Register URL handler for the callback
    const disposable = vscode.window.registerUriHandler({
      handleUri: async (uri: vscode.Uri) => {
        try {
          await handleOIDCCallback(context, config, uri, flowState);
        } catch (error) {
          outputChannelDep.error(`OIDC callback error: ${error}`);
          vscode.window.showErrorMessage(`RHDA authentication failed: ${(error as Error).message}`);
        } finally {
          disposable.dispose();
          await context.globalState.update('rhda-oidc-flow-state', undefined);
        }
      },
    });

    // Build authorization URL and redirect user
    outputChannelDep.debug(`Building authorization URL with parameters: ${JSON.stringify(parameters)}`);
    const authUrl = client.buildAuthorizationUrl(config, parameters);
    outputChannelDep.debug(`Complete authorization URL: ${authUrl.href}`);

    // Open authorization URL in browser
    await vscode.env.openExternal(vscode.Uri.parse(authUrl.href));

    vscode.window.showInformationMessage('Please complete RHDA authentication in your browser.');
  } catch (error) {
    outputChannelDep.error(`OIDC flow initialization error: ${error}`);
    vscode.window.showErrorMessage(`RHDA authentication initialization failed: ${(error as Error).message}`);
  }
}

/**
 * Handles the OIDC callback from VSCode URL handler
 */
async function handleOIDCCallback(context: vscode.ExtensionContext, config: client.Configuration, callbackUri: vscode.Uri, flowState: OIDCFlowState): Promise<void> {
  try {
    const url = new URL(callbackUri.toString());
    // Handle double-encoded query parameters from VSCode
    const searchParams = new URLSearchParams(url.searchParams.keys().next().value!);

    // Create a simple URL with just the base and our clean parameters
    const cleanCallbackUrl = new URL(`${callbackUrl}?${searchParams.toString()}`);
    outputChannelDep.debug(`Clean callback URL: ${cleanCallbackUrl.toString()}`);

    // First try the standard approach
    const tokens = await client.authorizationCodeGrant(
      config,
      cleanCallbackUrl,
      {
        pkceCodeVerifier: flowState.codeVerifier,
        expectedState: flowState.state,
        expectedNonce: flowState.nonce,
      }
    );

    outputChannelDep.info('Successfully obtained tokens from OIDC authorization server');

    // Store tokens securely
    if (tokens.access_token) {
      await context.secrets.store('rhda-oidc-access-token', tokens.access_token);
    }
    if (tokens.refresh_token) {
      await context.secrets.store('rhda-oidc-refresh-token', tokens.refresh_token);
    }
    if (tokens.id_token) {
      await context.secrets.store('rhda-oidc-id-token', tokens.id_token);
    }

    // Store token expiration time
    if (tokens.expires_in) {
      const expirationTime = Date.now() + tokens.expires_in * 1000;
      await context.globalState.update('rhda-oidc-token-expiration', expirationTime);
    }

    vscode.window.showInformationMessage('RHDA authentication successful!');

    // Record successful authentication telemetry
    record(context, TelemetryActions.vulnerabilityReportDone, {
      action: 'oidc-authentication-success',
    });

    // Update status bar to show authenticated state
    outputChannelDep.info('Authentication complete');
    caStatusBarProvider.showAuthenticated();
  } catch (error) {
    outputChannelDep.error(`Token exchange failed: ${error}`);
    throw new Error(`Failed to complete authentication: ${(error as Error).message}`);
  }
}

/**
 * Retrieves a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(context: vscode.ExtensionContext): Promise<string | null> {
  try {
    const accessToken = await context.secrets.get('rhda-oidc-access-token');
    const expirationTime = context.globalState.get<number>('rhda-oidc-token-expiration');

    if (!accessToken) {
      // No token means user hasn't authenticated yet
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    if (expirationTime && Date.now() > expirationTime - 300000) {
      const refreshToken = await context.secrets.get('rhda-oidc-refresh-token');
      if (refreshToken) {
        return await refreshAccessToken(context, refreshToken);
      }
      return null;
    }

    return accessToken;
  } catch (error) {
    outputChannelDep.error(`Failed to get access token: ${error}`);
    return null;
  }
}

/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(context: vscode.ExtensionContext, refreshToken: string): Promise<string | null> {
  const clientId = globalConfig.oidcClientId;
  const realmUrl = globalConfig.oidcRealmUrl;

  try {
    const config = await client.discovery(
      new URL(realmUrl),
      clientId,
      undefined,
      undefined,
      {
        execute: globalConfig.oidcAllowInsecure ? [client.allowInsecureRequests] : [],
      }
    );

    const tokens = await client.refreshTokenGrant(config, refreshToken);

    // Update stored tokens
    if (tokens.access_token) {
      await context.secrets.store('rhda-oidc-access-token', tokens.access_token);
    }
    if (tokens.refresh_token) {
      await context.secrets.store('rhda-oidc-refresh-token', tokens.refresh_token);
    }

    // Update token expiration time
    if (tokens.expires_in) {
      const expirationTime = Date.now() + tokens.expires_in * 1000;
      await context.globalState.update('rhda-oidc-token-expiration', expirationTime);
    }

    outputChannelDep.info('Successfully refreshed access token');
    return tokens.access_token || null;
  } catch (error) {
    outputChannelDep.error(`Token refresh failed: ${error}`);
    // Clear invalid tokens
    await context.secrets.delete('rhda-oidc-access-token');
    await context.secrets.delete('rhda-oidc-refresh-token');
    await context.secrets.delete('rhda-oidc-id-token');
    await context.globalState.update('rhda-oidc-token-expiration', undefined);

    // Update status bar to show session expired
    caStatusBarProvider.showSessionExpired();
    return null;
  }
}