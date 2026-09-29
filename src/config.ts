export const CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
export const SCOPE = 'https://www.googleapis.com/auth/youtube'
export const API_BASE = 'https://www.googleapis.com/youtube/v3'
export const DAILY_QUOTA = 10000
export const COST_LIST = 1
export const COST_WRITE = 50
export const AUTO_REFRESH_MS = 60_000
