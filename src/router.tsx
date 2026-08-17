import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            lazy: async () => {
              const { default: Component } = await import('@/routes/DashboardRoute')
              return { Component }
            },
          },
          {
            path: '/analytics',
            lazy: async () => {
              const { default: Component } = await import('@/routes/AnalyticsRoute')
              return { Component }
            },
          },
          {
            path: '/profile',
            lazy: async () => {
              const { default: Component } = await import('@/routes/ProfileRoute')
              return { Component }
            },
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    lazy: async () => {
      const { default: Component } = await import('@/routes/LoginRoute')
      return { Component }
    },
  },
  {
    path: '/register',
    lazy: async () => {
      const { default: Component } = await import('@/routes/RegisterRoute')
      return { Component }
    },
  },
  {
    path: '/forgot-password',
    lazy: async () => {
      const { default: Component } = await import('@/routes/ForgotPasswordRoute')
      return { Component }
    },
  },
  {
    path: '/reset-password',
    lazy: async () => {
      const { default: Component } = await import('@/routes/ResetPasswordRoute')
      return { Component }
    },
  },
])
