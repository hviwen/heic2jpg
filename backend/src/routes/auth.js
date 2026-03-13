import express from 'express'
import { getUserById, upsertGoogleUser } from '../services/database.js'

const GOOGLE_AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

const router = express.Router()

function getBackendUrl(req) {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '')
  }

  return `${req.protocol}://${req.get('host')}`
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
}

function getGoogleOAuthConfig(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${getBackendUrl(req)}/api/auth/google/callback`
  }
}

function buildFrontendRedirect(pathname = '/', params = {}) {
  const url = new URL(pathname, `${getFrontendUrl()}/`)
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

function sanitizeUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl
  }
}

router.get('/session', (req, res) => {
  const oauthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const user = req.session?.userId ? getUserById(req.session.userId) : null

  if (req.session) {
    req.saveSession({})
  }

  res.json({
    success: true,
    message: '会话状态获取成功',
    data: {
      authenticated: Boolean(user),
      oauthEnabled,
      user: sanitizeUser(user)
    },
    timestamp: new Date().toISOString()
  })
})

router.get('/google/start', (req, res) => {
  const config = getGoogleOAuthConfig(req)
  if (!config) {
    return res.status(503).json({
      error: 'OAuth unavailable',
      message: 'Google OAuth 未配置，请先设置客户端信息'
    })
  }

  const oauthState = req.generateOAuthState()
  req.saveSession({ oauthState, userId: req.session?.userId || null })

  const authUrl = new URL(GOOGLE_AUTH_BASE_URL)
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', config.redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', oauthState)
  authUrl.searchParams.set('prompt', 'select_account')

  res.redirect(authUrl.toString())
})

router.get('/google/callback', async (req, res, next) => {
  const config = getGoogleOAuthConfig(req)
  if (!config) {
    return res.redirect(buildFrontendRedirect('/', { auth: 'error', reason: 'oauth_unavailable' }))
  }

  const { code, state, error } = req.query

  if (error) {
    return res.redirect(buildFrontendRedirect('/', { auth: 'error', reason: error }))
  }

  if (!code || !state || !req.session || req.session.oauthState !== state) {
    return res.redirect(buildFrontendRedirect('/', { auth: 'error', reason: 'invalid_state' }))
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: String(code),
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Google token 交换失败')
    }

    const tokenPayload = await tokenResponse.json()
    const accessToken = tokenPayload.access_token
    if (!accessToken) {
      throw new Error('Google 未返回 access token')
    }

    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!profileResponse.ok) {
      throw new Error('Google 用户信息获取失败')
    }

    const profile = await profileResponse.json()
    const user = upsertGoogleUser({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name || profile.email,
      avatarUrl: profile.picture || null
    })

    req.saveSession({
      userId: user.id,
      oauthState: null
    })

    res.redirect(buildFrontendRedirect('/', { auth: 'success' }))
  } catch (error) {
    next(error)
  }
})

router.post('/logout', (req, res) => {
  req.destroySession()

  res.json({
    success: true,
    message: '已退出登录',
    data: {
      authenticated: false
    },
    timestamp: new Date().toISOString()
  })
})

export default router
