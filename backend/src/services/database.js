import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BACKEND_ROOT = path.resolve(__dirname, '..', '..')
const databasePath = path.resolve(BACKEND_ROOT, process.env.DATABASE_PATH || './data/heic2jpg.sqlite3')
const databaseDir = path.dirname(databasePath)

if (!existsSync(databaseDir)) {
  mkdirSync(databaseDir, { recursive: true })
}

const db = new DatabaseSync(databasePath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    oauth_state TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
`)

const insertUserStatement = db.prepare(`
  INSERT INTO users (id, google_id, email, name, avatar_url, created_at, last_login_at)
  VALUES (:id, :googleId, :email, :name, :avatarUrl, :createdAt, :lastLoginAt)
`)

const updateUserStatement = db.prepare(`
  UPDATE users
  SET email = :email,
      name = :name,
      avatar_url = :avatarUrl,
      last_login_at = :lastLoginAt
  WHERE google_id = :googleId
`)

const findUserByGoogleIdStatement = db.prepare(`
  SELECT id, google_id AS googleId, email, name, avatar_url AS avatarUrl, created_at AS createdAt, last_login_at AS lastLoginAt
  FROM users
  WHERE google_id = ?
`)

const findUserByIdStatement = db.prepare(`
  SELECT id, google_id AS googleId, email, name, avatar_url AS avatarUrl, created_at AS createdAt, last_login_at AS lastLoginAt
  FROM users
  WHERE id = ?
`)

const insertSessionStatement = db.prepare(`
  INSERT INTO sessions (id, user_id, oauth_state, ip_address, user_agent, created_at, updated_at, expires_at)
  VALUES (:id, :userId, :oauthState, :ipAddress, :userAgent, :createdAt, :updatedAt, :expiresAt)
`)

const updateSessionStatement = db.prepare(`
  UPDATE sessions
  SET user_id = :userId,
      oauth_state = :oauthState,
      ip_address = :ipAddress,
      user_agent = :userAgent,
      updated_at = :updatedAt,
      expires_at = :expiresAt
  WHERE id = :id
`)

const findSessionByIdStatement = db.prepare(`
  SELECT id,
         user_id AS userId,
         oauth_state AS oauthState,
         ip_address AS ipAddress,
         user_agent AS userAgent,
         created_at AS createdAt,
         updated_at AS updatedAt,
         expires_at AS expiresAt
  FROM sessions
  WHERE id = ?
`)

const deleteSessionStatement = db.prepare('DELETE FROM sessions WHERE id = ?')
const deleteExpiredSessionsStatement = db.prepare('DELETE FROM sessions WHERE expires_at <= ?')

export function getDatabasePath() {
  return databasePath
}

export function upsertGoogleUser(profile) {
  const now = new Date().toISOString()
  const existing = findUserByGoogleIdStatement.get(profile.googleId)

  if (existing) {
    updateUserStatement.run({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl || null,
      lastLoginAt: now
    })

    return findUserByGoogleIdStatement.get(profile.googleId)
  }

  const id = randomUUID()
  insertUserStatement.run({
    id,
    googleId: profile.googleId,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl || null,
    createdAt: now,
    lastLoginAt: now
  })

  return findUserByGoogleIdStatement.get(profile.googleId)
}

export function getUserById(userId) {
  return findUserByIdStatement.get(userId) || null
}

export function createSession({
  userId = null,
  oauthState = null,
  ipAddress = null,
  userAgent = null,
  expiresAt
} = {}) {
  const id = randomUUID()
  const now = new Date().toISOString()
  const resolvedExpiresAt = expiresAt || now

  insertSessionStatement.run({
    id,
    userId,
    oauthState,
    ipAddress,
    userAgent,
    createdAt: now,
    updatedAt: now,
    expiresAt: resolvedExpiresAt
  })

  return getSessionById(id)
}

export function getSessionById(sessionId) {
  return findSessionByIdStatement.get(sessionId) || null
}

export function updateSession(sessionId, updates = {}) {
  const existing = getSessionById(sessionId)
  if (!existing) {
    return null
  }

  const nextSession = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  updateSessionStatement.run({
    id: nextSession.id,
    userId: nextSession.userId || null,
    oauthState: nextSession.oauthState || null,
    ipAddress: nextSession.ipAddress || null,
    userAgent: nextSession.userAgent || null,
    updatedAt: nextSession.updatedAt,
    expiresAt: nextSession.expiresAt
  })

  return getSessionById(sessionId)
}

export function deleteSession(sessionId) {
  deleteSessionStatement.run(sessionId)
}

export function cleanupExpiredSessions(now = new Date().toISOString()) {
  deleteExpiredSessionsStatement.run(now)
}
