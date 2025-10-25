import { useEffect, useState } from 'react'
import { Plus, UserPlus, AlertTriangle } from 'lucide-react'
import { Button } from './components/ui/button'
import { AddRequestModal } from './components/AddRequestModal'
import { EditRequestModal } from './components/EditRequestModal'
import { ThemeToggle } from './components/ThemeToggle'
import { TableSkeleton } from './components/TableSkeleton'
import { Dashboard } from './components/Dashboard'
import { Sidebar } from './components/Sidebar'
import { EmployeeExitView } from './components/EmployeeExitView'
import { RequestsView } from './components/RequestsView'
import { RequestsTable } from './components/RequestsTable'
import { Toaster } from 'sonner'
import type { Request } from './types/ipc'
import { useRequestsQuery } from './hooks/useRequests'

const VIEW_STORAGE_KEY = 'equipment-tracker:current-view'
const SIDEBAR_STORAGE_KEY = 'equipment-tracker:sidebar-collapsed'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [isEmployeeExitModalOpen, setIsEmployeeExitModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'requests' | 'employee-exit'>(() => {
    if (typeof window === 'undefined') {
      return 'dashboard'
    }

    const stored = localStorage.getItem(VIEW_STORAGE_KEY)

    if (stored === 'dashboard' || stored === 'requests' || stored === 'employee-exit') {
      return stored
    }

    return 'dashboard'
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  })

  const { data: requests = [], isLoading, isError, refetch: refetchRequests } = useRequestsQuery()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(VIEW_STORAGE_KEY, currentView)
  }, [currentView])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarCollapsed ? 'true' : 'false')
  }, [isSidebarCollapsed])

  const handleEdit = (request: Request) => {
    setEditingRequest(request)
    setIsEditModalOpen(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N - New request
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        setIsModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      {/* Sidebar - Fixed */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content - with left margin for sidebar */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}
      >
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-foreground">
                  {currentView === 'dashboard'
                    ? 'Дашборд'
                    : currentView === 'requests'
                      ? 'Заявки'
                      : 'Выход сотрудников'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentView === 'dashboard'
                    ? 'Обзор статистики и аналитики'
                    : currentView === 'requests'
                      ? 'Управление заявками на выдачу оборудования'
                      : 'Учёт выдачи оборудования уходящим сотрудникам'}
                </p>
                <div className="mt-4 inline-flex rounded-full border border-border p-1 bg-background/60 backdrop-blur">
                  <Button
                    variant={currentView === 'requests' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('requests')}
                    className={`rounded-full px-4 ${currentView === 'requests' ? '' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Заявки
                  </Button>
                  <Button
                    variant={currentView === 'employee-exit' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('employee-exit')}
                    className={`rounded-full px-4 ${currentView === 'employee-exit' ? '' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Выходы
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                {currentView === 'requests' && (
                  <Button onClick={() => setIsModalOpen(true)} size="lg" className="shadow-brand">
                    <Plus className="h-5 w-5 mr-2" />
                    Добавить заявку
                  </Button>
                )}
                {currentView === 'employee-exit' && (
                  <Button
                    onClick={() => setIsEmployeeExitModalOpen(true)}
                    size="lg"
                    className="shadow-brand"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Добавить запись
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto custom-scrollbar">
          <div className="px-8 py-6">
            {currentView === 'dashboard' ? (
              isLoading ? (
                <TableSkeleton />
              ) : isError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center gap-3 text-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <div>
                    <h3 className="text-lg font-semibold">Не удалось загрузить заявки</h3>
                    <p className="text-sm text-muted-foreground">
                      Попробуйте обновить данные. Если ошибка повторится, проверьте подключение или
                      обратитесь к администратору.
                    </p>
                  </div>
                  <Button onClick={() => refetchRequests()} variant="outline">
                    Повторить попытку
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <Dashboard requests={requests} />

                  {/* Recent Requests Preview */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold">Последние заявки</h2>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentView('requests')}
                        className="hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      >
                        Все заявки
                      </Button>
                    </div>
                    <RequestsTable requests={requests.slice(0, 5)} onEdit={handleEdit} />
                  </div>
                </div>
              )
            ) : currentView === 'requests' ? (
              <div className="animate-fade-in">
                <RequestsView
                  requests={requests}
                  isLoading={isLoading}
                  isError={isError}
                  onRetry={() => refetchRequests()}
                  onEdit={handleEdit}
                />
              </div>
            ) : (
              <div className="animate-fade-in">
                <EmployeeExitView
                  isModalOpen={isEmployeeExitModalOpen}
                  onModalOpenChange={setIsEmployeeExitModalOpen}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Request Modal */}
      <AddRequestModal open={isModalOpen} onOpenChange={setIsModalOpen} />

      {/* Edit Request Modal */}
      <EditRequestModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        request={editingRequest}
      />
    </div>
  )
}

export default App
