import { useState } from 'react'
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
import { Toaster } from 'sonner'
import type { Request } from './types/ipc'
import { useRequestsQuery } from './hooks/useRequests'
import { usePersistentState } from './hooks/usePersistentState'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { cn } from './lib/utils'

const VIEW_STORAGE_KEY = 'equipment-tracker:current-view'
const SIDEBAR_STORAGE_KEY = 'equipment-tracker:sidebar-collapsed'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [isEmployeeExitModalOpen, setIsEmployeeExitModalOpen] = useState(false)
  const [currentView, setCurrentView] = usePersistentState<
    'dashboard' | 'requests' | 'employee-exit'
  >(VIEW_STORAGE_KEY, 'dashboard', {
    serializer: (value) => value,
    deserializer: (value) =>
      value === 'dashboard' || value === 'requests' || value === 'employee-exit'
        ? (value as 'dashboard' | 'requests' | 'employee-exit')
        : 'dashboard',
  })
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState<boolean>(
    SIDEBAR_STORAGE_KEY,
    false,
    {
      serializer: (value) => (value ? 'true' : 'false'),
      deserializer: (value) => value === 'true',
    }
  )

  const { data: requests = [], isLoading, isError, refetch: refetchRequests } = useRequestsQuery()

  const handleEdit = (request: Request) => {
    setEditingRequest(request)
    setIsEditModalOpen(true)
  }

  useKeyboardShortcut(
    { key: 'n', ctrlKey: true },
    () => {
      setIsModalOpen(true)
    },
    [setIsModalOpen]
  )

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between px-8 py-5">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground">
                {currentView === 'dashboard'
                  ? 'Дашборд'
                  : currentView === 'requests'
                    ? 'Заявки'
                    : 'Выход сотрудников'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentView === 'dashboard'
                  ? 'Обзор статистики и аналитики'
                  : currentView === 'requests'
                    ? 'Управление заявками на выдачу оборудования'
                    : 'Учёт выдачи оборудования уходящим сотрудникам'}
              </p>
              <div className="mt-4 inline-flex rounded-full border border-border bg-background/60 p-1.5 backdrop-blur">
                <Button
                  variant={currentView === 'requests' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('requests')}
                  className={cn(
                    'rounded-full px-4 transition-all',
                    currentView === 'requests' ? '' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Заявки
                </Button>
                <Button
                  variant={currentView === 'employee-exit' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('employee-exit')}
                  className={cn(
                    'rounded-full px-4 transition-all',
                    currentView === 'employee-exit'
                      ? ''
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Выходы
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {currentView === 'requests' && (
                <Button onClick={() => setIsModalOpen(true)} size="lg" className="shadow-brand">
                  <Plus className="mr-2 h-5 w-5" />
                  Добавить заявку
                </Button>
              )}
              {currentView === 'employee-exit' && (
                <Button
                  onClick={() => setIsEmployeeExitModalOpen(true)}
                  size="lg"
                  className="shadow-brand"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Добавить запись
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="custom-scrollbar flex-1 overflow-auto">
          <div className="px-8 py-6">
            {currentView === 'dashboard' ? (
              isLoading ? (
                <TableSkeleton />
              ) : isError ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
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
                <div className="animate-fade-in space-y-6">
                  <Dashboard requests={requests} />
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

      <AddRequestModal open={isModalOpen} onOpenChange={setIsModalOpen} />

      <EditRequestModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        request={editingRequest}
      />
    </div>
  )
}

export default App
