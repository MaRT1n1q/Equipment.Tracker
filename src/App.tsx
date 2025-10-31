import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './components/ui/button'
import { AddRequestModal } from './components/AddRequestModal'
import { EditRequestModal } from './components/EditRequestModal'
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

type AppView = 'dashboard' | 'requests' | 'employee-exit'

const VIEW_STORAGE_KEY = 'equipment-tracker:current-view'
const SIDEBAR_STORAGE_KEY = 'equipment-tracker:sidebar-collapsed'

const isAppView = (value: string): value is AppView =>
  value === 'dashboard' || value === 'requests' || value === 'employee-exit'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [isEmployeeExitModalOpen, setIsEmployeeExitModalOpen] = useState(false)
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

  const { data: requests = [], isLoading, isError, refetch: refetchRequests } = useRequestsQuery()

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
        <main className="custom-scrollbar flex-1 overflow-auto">
          <div className="px-8 py-8">
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
                      {/* <p className="text-sm text-muted-foreground">Дополнительная информация</p> */}
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
                  onAddRequest={() => setIsModalOpen(true)}
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
