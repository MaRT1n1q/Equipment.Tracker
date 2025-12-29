import { useState, useEffect } from 'react'
import { AddRequestModal } from './components/AddRequestModal'
import { EditRequestModal } from './components/EditRequestModal'
import { Dashboard } from './components/Dashboard'
import { Sidebar } from './components/Sidebar'
import { EmployeeExitView } from './components/EmployeeExitView'
import { RequestsView } from './components/RequestsView'
import { TemplatesView } from './components/TemplatesView'
import { ChangelogModal } from './components/ChangelogModal'
import { Toaster } from 'sonner'
import type { Request } from './types/ipc'
import { usePersistentState } from './hooks/usePersistentState'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useChangelog } from './hooks/useChangelog'
import { cn } from './lib/utils'
import { ScheduleReturnModal } from './components/ScheduleReturnModal'
import type { DashboardSelection } from './components/Dashboard'
import { WindowTitleBar } from './components/WindowTitleBar'

type AppView = 'dashboard' | 'requests' | 'employee-exit' | 'templates'

const VIEW_STORAGE_KEY = 'equipment-tracker:current-view'
const SIDEBAR_STORAGE_KEY = 'equipment-tracker:sidebar-collapsed'

const isAppView = (value: string): value is AppView =>
  value === 'dashboard' ||
  value === 'requests' ||
  value === 'employee-exit' ||
  value === 'templates'

function App() {
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

  useKeyboardShortcut(
    { key: 'n', ctrlKey: true },
    () => {
      setIsModalOpen(true)
    },
    [setIsModalOpen]
  )

  return (
    <div className="h-screen bg-background overflow-hidden">
      <WindowTitleBar />
      <Toaster position="top-right" richColors />

      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={cn(
          'mt-10 flex flex-col h-[calc(100vh-2.5rem)] transition-all duration-300',
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <main className="custom-scrollbar flex-1 overflow-auto">
          <div className="px-8 py-8">
            {currentView === 'dashboard' ? (
              <div className="animate-fade-in space-y-6">
                <Dashboard
                  onSelectRequest={handleNavigateToRequest}
                  onSelectEmployeeExit={handleNavigateToEmployeeExit}
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
          </div>
        </main>
      </div>

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

      <ChangelogModal open={isChangelogOpen} onClose={dismissChangelog} changes={newChanges} />
    </div>
  )
}

export default App
