import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: {
        title: 'HEIC2JPG - Studio'
      }
    },
    {
      path: '/convert',
      name: 'convert',
      component: () => import('../views/ConvertView.vue'),
      meta: {
        title: 'Studio Route - HEIC2JPG'
      }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue'),
      meta: {
        title: 'History - HEIC2JPG'
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: {
        title: 'Settings - HEIC2JPG'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: 'Help Center - HEIC2JPG'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: 'Page Not Found - HEIC2JPG'
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫：更新页面标题
router.beforeEach((to, from, next) => {
  const title = (to.meta['title'] as string) || 'HEIC2JPG'
  document.title = title
  next()
})

// 错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  // 可以在这里添加错误报告
})

export default router
