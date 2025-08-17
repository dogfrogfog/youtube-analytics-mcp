export interface AuthConfig {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

export interface TokenData {
  type: 'authorized_user';
  client_id: string;
  client_secret: string;
  refresh_token: string;
  access_token?: string;
  expiry_date?: number;
}

// Authentication Error types
export class AuthenticationError extends Error {
  constructor(message: string, public account?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(account: string) {
    super(`Token expired for account ${account}`, account);
    this.name = 'TokenExpiredError';
  }
}