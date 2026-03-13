import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ApiEnvelope, AuthSessionResponse, AuthUser } from '../types'
import { toApiUrl } from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const oauthEnabled = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(user.value))

  const fetchSession = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(toApiUrl('/api/auth/session'), {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('会话获取失败')
      }

      const payload = (await response.json()) as ApiEnvelope<AuthSessionResponse>
      oauthEnabled.value = payload.data.oauthEnabled
      user.value = payload.data.user
    } catch (sessionError) {
      error.value = sessionError instanceof Error ? sessionError.message : '会话获取失败'
      user.value = null
      oauthEnabled.value = false
    } finally {
      isLoading.value = false
    }
  }

  const startGoogleLogin = () => {
    window.location.href = toApiUrl('/api/auth/google/start')
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(toApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('退出登录失败')
      }

      user.value = null
    } catch (logoutError) {
      error.value = logoutError instanceof Error ? logoutError.message : '退出登录失败'
      throw logoutError
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    oauthEnabled,
    isLoading,
    error,
    isAuthenticated,
    fetchSession,
    startGoogleLogin,
    logout
  }
})
