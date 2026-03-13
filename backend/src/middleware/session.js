import crypto from 'node:crypto'
import { cleanupExpiredSessions, createSession, deleteSession, getSessionById, updateSession } from '../services/database.js'

const SESSION_COOKIE_NAME = 'heic2jpg.sid'
const SESSION_MAX_AGE_DAYS = Number.parseInt(process.env.SESSION_MAX_AGE_DAYS || '7', 10)
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-session-secret'

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separatorIndex = part.indexOf('=')
      if (separatorIndex === -1) {
        return acc
      }

      const key = decodeURIComponent(part.slice(0, separatorIndex))
      const value = decodeURIComponent(part.slice(separatorIndex + 1))
      acc[key] = value
      return acc
    }, {})
}

function getExpiryDate() {
  return new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString()
}

function signSessionId(sessionId) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(sessionId).digest('base64url')
}

function encodeSessionCookieValue(sessionId) {
  return `${sessionId}.${signSessionId(sessionId)}`
}

function decodeSessionCookieValue(cookieValue) {
  if (!cookieValue || !cookieValue.includes('.')) {
    return null
  }

  const separatorIndex = cookieValue.lastIndexOf('.')
  const sessionId = cookieValue.slice(0, separatorIndex)
  const signature = cookieValue.slice(separatorIndex + 1)
  if (!sessionId || !signature) {
    return null
  }

  const expectedSignature = signSessionId(sessionId)
  const providedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (providedBuffer.length !== expectedBuffer.length) {
    return null
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null
  }

  return sessionId
}

function getCookieAttributes() {
  const isProduction = process.env.NODE_ENV === 'production'
  const sameSite = isProduction ? 'None' : 'Lax'
  const secure = isProduction

  return {
    httpOnly: true,
    path: '/',
    sameSite,
    secure,
    maxAge: SESSION_MAX_AGE_MS
  }
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`]

  if (options.maxAge) {
    parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`)
  }

  if (options.path) {
    parts.push(`Path=${options.path}`)
  }

  if (options.httpOnly) {
    parts.push('HttpOnly')
  }

  if (options.secure) {
    parts.push('Secure')
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`)
  }

  return parts.join('; ')
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader('Set-Cookie')
  if (!existing) {
    res.setHeader('Set-Cookie', cookieValue)
    return
  }

  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieValue])
    return
  }

  res.setHeader('Set-Cookie', [existing, cookieValue])
}

function setSessionCookie(res, sessionId) {
  appendSetCookie(res, serializeCookie(SESSION_COOKIE_NAME, encodeSessionCookieValue(sessionId), getCookieAttributes()))
}

function clearSessionCookie(res) {
  appendSetCookie(
    res,
    serializeCookie(SESSION_COOKIE_NAME, '', {
      ...getCookieAttributes(),
      maxAge: 0
    })
  )
}

export function sessionMiddleware(req, res, next) {
  cleanupExpiredSessions()

  const cookies = parseCookies(req.headers.cookie)
  const sessionId = decodeSessionCookieValue(cookies[SESSION_COOKIE_NAME])
  const existingSession = sessionId ? getSessionById(sessionId) : null
  const isExpired = existingSession ? new Date(existingSession.expiresAt).getTime() <= Date.now() : false

  if (existingSession && isExpired) {
    deleteSession(existingSession.id)
    clearSessionCookie(res)
  }

  req.session = existingSession && !isExpired ? existingSession : null

  req.createSession = (initialValues = {}) => {
    const session = createSession({
      userId: initialValues.userId || null,
      oauthState: initialValues.oauthState || null,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null,
      expiresAt: getExpiryDate()
    })

    req.session = session
    setSessionCookie(res, session.id)
    return session
  }

  req.saveSession = (updates = {}) => {
    if (!req.session) {
      return req.createSession(updates)
    }

    const session = updateSession(req.session.id, {
      ...updates,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null,
      expiresAt: getExpiryDate()
    })

    req.session = session
    if (session) {
      setSessionCookie(res, session.id)
    }
    return session
  }

  req.destroySession = () => {
    if (req.session) {
      deleteSession(req.session.id)
    }
    req.session = null
    clearSessionCookie(res)
  }

  req.generateOAuthState = () => crypto.randomBytes(24).toString('hex')

  next()
}
