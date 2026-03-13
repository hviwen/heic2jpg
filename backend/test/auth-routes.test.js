import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'

process.env.DATABASE_PATH = path.join(os.tmpdir(), `heic2jpg-auth-test-${Date.now()}.sqlite3`)
process.env.GOOGLE_CLIENT_ID = ''
process.env.GOOGLE_CLIENT_SECRET = ''

const { default: app } = await import('../src/index.js')

test('GET /api/auth/session returns anonymous session state', async () => {
  const server = app.listen(0)
  const address = server.address()
  assert(address && typeof address === 'object')

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/session`)
    assert.equal(response.status, 200)

    const payload = await response.json()
    assert.equal(payload.data.authenticated, false)
    assert.equal(payload.data.oauthEnabled, false)
    assert.equal(payload.data.user, null)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('GET /api/auth/google/start returns 503 when oauth is not configured', async () => {
  const server = app.listen(0)
  const address = server.address()
  assert(address && typeof address === 'object')

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/google/start`, {
      redirect: 'manual'
    })

    assert.equal(response.status, 503)
    const payload = await response.json()
    assert.match(payload.message, /Google OAuth/)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
