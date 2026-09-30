declare const __APP_VERSION__: string

declare namespace google.accounts.oauth2 {
  interface TokenResponse {
    access_token: string
    expires_in: number
    scope: string
    error?: string
    error_description?: string
  }
  interface ClientConfigError {
    type: 'popup_failed_to_open' | 'popup_closed' | 'unknown'
    message?: string
  }
  interface TokenClientConfig {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback?: (error: ClientConfigError) => void
    prompt?: string
  }
  interface OverridableTokenClientConfig {
    prompt?: string
  }
  interface TokenClient {
    requestAccessToken(config?: OverridableTokenClientConfig): void
  }
  function initTokenClient(config: TokenClientConfig): TokenClient
  function revoke(token: string, done?: () => void): void
  function hasGrantedAllScopes(response: TokenResponse, ...scopes: string[]): boolean
}
