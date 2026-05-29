import type { H3Event } from 'h3'

export const SESSION_COOKIE = 'neo_business_session'

export function backendBaseUrl() {
  const config = useRuntimeConfig()

  return String(config.apiBase).replace(/\/$/, '')
}

export function extractJwt(value: string | null) {
  if (!value) return null

  return value.replace(/^Bearer\s+/i, '').trim()
}

export function readSessionToken(event: H3Event) {
  return getCookie(event, SESSION_COOKIE)
}

export function setSessionToken(event: H3Event, token: string) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  })
}

export function clearSessionToken(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, {
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  })
}

export function requireSessionToken(event: H3Event) {
  const token = readSessionToken(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sesion requerida.',
    })
  }

  return token
}

export function authorizationHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  }
}
