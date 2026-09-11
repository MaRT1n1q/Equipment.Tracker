import { useState, useEffect, lazy, Suspense } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onQuerySync } from './lib/querySync'
import { Dashboard } from './components/Dashboard'
import { Sidebar } from './components/Sidebar'
import { MobileBottomNav } from './components/MobileBottomNav'
import { ChangelogModal } from './components/ChangelogModal'
import { Toaster, toast } from 'sonner'
import type { Request } from './types/ipc'
import { usePersistentState } from './hooks/usePersistentState'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useRealtimeEvents } from './lib/useRealtimeEvents'
import type { AppView } from './lib/navigation'

// Lazy-loading тяжёлых view — каждый загружается отдельным чанком при первом открытии.
// Dashboard импортируется статически (дефолтный экран).
const RequestsView = lazy(() =>
  import('./components/RequestsView').then((m) => ({ default: m.RequestsView }))
)
const EmployeeExitView = lazy(() =>
  import('./components/EmployeeExitView').then((m) => ({ default: m.EmployeeExitView }))
)
const TemplatesView = lazy(() =>
  import('./components/TemplatesView').then((m) => ({ default: m.TemplatesView }))
)
const InstructionsView = lazy(() =>
  import('./components/InstructionsView').then((m) => ({ default: m.InstructionsView }))
)
const AnalyticsView = lazy(() =>
  import('./components/AnalyticsView').then((m) => ({ default: m.AnalyticsView }))
)
const AdminView = lazy(() =>
  import('./components/AdminView').then((m) => ({ default: m.AdminView }))
)

// Lazy-loading модалок — загружаются только при открытии.
const AddRequestModal = lazy(() =>
  import('./components/AddRequestModal').then((m) => ({ default: m.AddRequestModal }))
)
const EditRequestModal = lazy(() =>
  import('./components/EditRequestModal').then((m) => ({ default: m.EditRequestModal }))
)
const ScheduleReturnModal = lazy(() =>
  import('./components/ScheduleReturnModal').then((m) => ({ default: m.ScheduleReturnModal }))
)
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useChangelog } from './hooks/useChangelog'
import { cn } from './lib/utils'
import type { DashboardSelection } from './components/Dashboard'
import { WindowTitleBar } from './components/WindowTitleBar'
import { LoginScreen } from './components/LoginScreen'
import { MigrationBanner } from './components/MigrationBanner'
import { clearAuthSession, getAuthSession, loginByUserLogin, type AuthSession } from './lib/auth'

const VIEW_STORAGE_KEY = 'equipment-tracker:current-view'
const SIDEBAR_STORAGE_KEY = 'equipment-tracker:sidebar-collapsed'

const isAppView = (value: string): value is AppView =>
  value === 'dashboard' ||
  value === 'requests' ||
  value === 'employee-exit' ||
  value === 'templates' ||
  value === 'instructions' ||
  value === 'analytics' ||
  value === 'admin'

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getAuthSession())
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [isEmployeeExitModalOpen, setIsEmployeeExitModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [returnTargetRequest, setReturnTargetRequest] = useState<Request | null>(null)
  const [highlightRequestId, setHighlightRequestId] = useState<number | null>(null)
  const [highlightExitId, setHighlightExitId] = useState<number | null>(null)
  const [highlightRequestSearch, setHighlightRequestSearch] = useState<string | null>(null)
  const [highlightExitSearch, setHighlightExitSearch] = useState<string | null>(null)
  const { newChanges, isOpen: isChangelogOpen, dismissChangelog } = useChangelog()
  const [currentView, setCurrentView] = usePersistentState<AppView>(VIEW_STORAGE_KEY, 'dashboard', {
    serializer: (value) => value,
    deserializer: (value) => (isAppView(value) ? value : 'dashboard'),
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState<boolean>(
    SIDEBAR_STORAGE_KEY,
    false,
    {
      serializer: (value) => (value ? 'true' : 'false'),
      deserializer: (value) => value === 'true',
    }
  )

  const queryClient = useQueryClient()

  // Real-time обновления через SSE (только после авторизации)
  useRealtimeEvents()

  // Синхронизация кэша между вкладками
  useEffect(() => {
    return onQuerySync((keys) => {
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    })
  }, [queryClient])

  // При 401 от API — выбрасываем на экран входа
  useEffect(() => {
    const onAuthLogout = () => {
      setAuthSession(null)
      toast.error('Сессия истекла — выполните вход заново')
    }
    window.addEventListener('auth:logout', onAuthLogout)
    return () => window.removeEventListener('auth:logout', onAuthLogout)
  }, [])

  // Устанавливаем CSS переменную для ширины сайдбара
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isSidebarCollapsed ? '5rem' : '16rem'
    )
  }, [isSidebarCollapsed])

  const handleEdit = (request: Request) => {
    setEditingRequest(request)
    setIsEditModalOpen(true)
  }

  const handleScheduleReturn = (request: Request) => {
    setReturnTargetRequest(request)
    setIsReturnModalOpen(true)
  }

  const handleReturnModalOpenChange = (nextOpen: boolean) => {
    setIsReturnModalOpen(nextOpen)
    if (!nextOpen) {
      setReturnTargetRequest(null)
    }
  }

  const handleNavigateToRequest = ({ id, searchHint }: DashboardSelection) => {
    setCurrentView('requests')
    setHighlightRequestId(null)
    setHighlightRequestSearch(searchHint ?? null)
    setTimeout(() => {
      setHighlightRequestId(id)
    }, 0)
  }

  const handleNavigateToEmployeeExit = ({ id, searchHint }: DashboardSelection) => {
    setIsEmployeeExitModalOpen(false)
    setCurrentView('employee-exit')
    setHighlightExitId(null)
    setHighlightExitSearch(searchHint ?? null)
    setTimeout(() => {
      setHighlightExitId(id)
    }, 0)
  }

  const handleNavigateToInstruction = () => {
    setCurrentView('instructions')
  }

  const handleNavigateToTemplate = () => {
    setCurrentView('templates')
  }

  useKeyboardShortcut(
    { key: 'n', ctrlKey: true },
    () => {
      setIsModalOpen(true)
    },
    [setIsModalOpen]
  )

  const handleLogin = async (login: string, password: string, city: string) => {
    try {
      setIsAuthLoading(true)
      const session = await loginByUserLogin(login, password, city)
      queryClient.clear()
      setAuthSession(session)
      toast.success(`Вход выполнен: ${session.login}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выполнить вход'
      toast.error(message)
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthSession()
    queryClient.clear()
    setAuthSession(null)
    toast.success('Вы вышли из аккаунта')
  }

  if (!authSession) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <WindowTitleBar />
        <Toaster position="top-right" richColors />
        <div className="mt-10 h-[calc(100vh-2.5rem)] overflow-auto">
          <LoginScreen isLoading={isAuthLoading} onLogin={handleLogin} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <WindowTitleBar />
      <Toaster position="top-right" richColors />

      {!isMobile && (
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          authSession={authSession}
          onLogout={handleLogout}
        />
      )}

      {isMobile && (
        <MobileBottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
          role={authSession.role}
        />
      )}

      <div
        className={cn(
          'mt-10 flex flex-col h-[calc(100vh-2.5rem)] transition-all duration-300',
          !isMobile && (isSidebarCollapsed ? 'ml-20' : 'ml-64'),
          isMobile && 'pb-16'
        )}
      >
        <main className="custom-scrollbar flex-1 overflow-auto">
          <MigrationBanner />
          <div className={cn('py-6', isMobile ? 'px-4' : 'px-8 py-8')}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              }
            >
              {currentView === 'dashboard' ? (
                <div className="animate-fade-in space-y-6">
                  <Dashboard
                    onSelectRequest={handleNavigateToRequest}
                    onSelectEmployeeExit={handleNavigateToEmployeeExit}
                    onSelectInstruction={handleNavigateToInstruction}
                    onSelectTemplate={handleNavigateToTemplate}
                  />
                </div>
              ) : currentView === 'requests' ? (
                <div className="animate-fade-in">
                  <RequestsView
                    onEdit={handleEdit}
                    onAddRequest={() => setIsModalOpen(true)}
                    onScheduleReturn={handleScheduleReturn}
                    highlightRequestId={highlightRequestId}
                    highlightSearchQuery={highlightRequestSearch}
                    onHighlightConsumed={() => {
                      setHighlightRequestId(null)
                      setHighlightRequestSearch(null)
                    }}
                  />
                </div>
              ) : currentView === 'templates' ? (
                <div className="animate-fade-in">
                  <TemplatesView />
                </div>
              ) : currentView === 'instructions' ? (
                <div className="animate-fade-in">
                  <InstructionsView />
                </div>
              ) : currentView === 'analytics' ? (
                <div className="animate-fade-in">
                  <AnalyticsView />
                </div>
              ) : currentView === 'admin' ? (
                authSession.role === 'admin' ? (
                  <div className="animate-fade-in">
                    <AdminView />
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <Dashboard
                      onSelectRequest={handleNavigateToRequest}
                      onSelectEmployeeExit={handleNavigateToEmployeeExit}
                      onSelectInstruction={handleNavigateToInstruction}
                      onSelectTemplate={handleNavigateToTemplate}
                    />
                  </div>
                )
              ) : (
                <div className="animate-fade-in">
                  <EmployeeExitView
                    isModalOpen={isEmployeeExitModalOpen}
                    onModalOpenChange={setIsEmployeeExitModalOpen}
                    highlightExitId={highlightExitId}
                    highlightSearchQuery={highlightExitSearch}
                    onHighlightConsumed={() => {
                      setHighlightExitId(null)
                      setHighlightExitSearch(null)
                    }}
                  />
                </div>
              )}
            </Suspense>
          </div>
        </main>
      </div>

      <Suspense fallback={null}>
        <AddRequestModal open={isModalOpen} onOpenChange={setIsModalOpen} />

        <EditRequestModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          request={editingRequest}
        />

        <ScheduleReturnModal
          open={isReturnModalOpen && Boolean(returnTargetRequest)}
          onOpenChange={handleReturnModalOpenChange}
          request={returnTargetRequest}
        />
      </Suspense>

      <ChangelogModal open={isChangelogOpen} onClose={dismissChangelog} changes={newChanges} />
    </div>
  )
}

export default App
