import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { MarketIntelligencePage } from '@/features/intelligence/MarketIntelligencePage'
import { AIAssistantPage } from '@/features/ai-assistant/AIAssistantPage'
import { PropertiesPage } from '@/features/properties/PropertiesPage'
import { PropertyDetailPage } from '@/features/properties/PropertyDetailPage'
import { ContactsPage } from '@/features/contacts/ContactsPage'
import { TransactionsPage } from '@/features/transactions/TransactionsPage'
import { ActivitiesPage } from '@/features/activities/ActivitiesPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { NotFoundPage } from '@/features/shared/NotFoundPage'
import { LoadingState } from '@/components/shared/LoadingState'
import { Card, CardContent } from '@/components/ui/card'

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <Card className="w-64">
        <CardContent className="p-6">
          <LoadingState rows={2} />
        </CardContent>
      </Card>
    </div>
  )
}

function RootRedirect() {
  return <Navigate to="/dashboard" replace />
}

function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'loading') return <FullPageLoader />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/properties', element: <PropertiesPage /> },
          { path: '/properties/:id', element: <PropertyDetailPage /> },
          { path: '/contacts', element: <ContactsPage /> },
          { path: '/transactions', element: <TransactionsPage /> },
          { path: '/activities', element: <ActivitiesPage /> },
          {
            path: '/intelligence',
            element: <MarketIntelligencePage />,
          },
          {
            path: '/ai-assistant',
            element: <AIAssistantPage />,
          },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
