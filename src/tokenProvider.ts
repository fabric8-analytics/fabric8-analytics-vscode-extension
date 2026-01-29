import * as vscode from 'vscode';
import { getValidAccessToken } from './oidcAuthentication';

export interface TokenProvider {
  getToken(): Promise<string | null>;
}

export class VSCodeTokenProvider implements TokenProvider {
  constructor(private context: vscode.ExtensionContext) { }

  async getToken(): Promise<string | null> {
    return await getValidAccessToken(this.context);
  }
}

export class MockTokenProvider implements TokenProvider {
  constructor(private token: string | null = null) { }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }
}
