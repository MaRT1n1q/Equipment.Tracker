import { useEffect, useState, useRef, useMemo } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { Button } from './components/ui/button'
import { AddRequestModal } from './components/AddRequestModal'
import { EditRequestModal } from './components/EditRequestModal'
import { RequestsTable } from './components/RequestsTable'
import { ThemeToggle } from './components/ThemeToggle'
import { SearchAndFilters } from './components/SearchAndFilters'
import { TableSkeleton } from './components/TableSkeleton'
import { Dashboard } from './components/Dashboard'
import { Sidebar } from './components/Sidebar'
import { EmployeeExitView } from './components/EmployeeExitView'
import { Toaster } from 'sonner'
import { Request } from './types/electron.d'
import { useDebounce } from './hooks/useDebounce'

function App() {
  const [requests, setRequests] = useState<Request[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [isEmployeeExitModalOpen, setIsEmployeeExitModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'issued' | 'not-issued'>('all')
  const [currentView, setCurrentView] = useState<'dashboard' | 'requests' | 'employee-exit'>('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const loadRequests = async () => {
    try {
      const result = await window.electronAPI.getRequests()
      if (result.success && result.data) {
        setRequests(result.data)
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (request: Request) => {
    setEditingRequest(request)
    setIsEditModalOpen(true)
  }

  // Filter and search requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests]

    // Apply filter
    if (filter === 'issued') {
      filtered = filtered.filter(req => req.is_issued === 1)
    } else if (filter === 'not-issued') {
      filtered = filtered.filter(req => req.is_issued === 0)
    }

    // Apply debounced search
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(req => {
        // Search in employee name
        if (req.employee_name.toLowerCase().includes(query)) return true
        
        // Search in equipment items
        if (req.equipment_items && req.equipment_items.some(item =>
          item.equipment_name.toLowerCase().includes(query) ||
          item.serial_number.toLowerCase().includes(query)
        )) return true
        
        return false
      })
    }

    return filtered
  }, [requests, filter, debouncedSearchQuery])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N - New request
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        setIsModalOpen(true)
      }
      // Ctrl+F - Focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    loadRequests()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar - Fixed */}
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content - with left margin for sidebar */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="animate-fade-in">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
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
                    : 'Учёт выдачи оборудования уходящим сотрудникам'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />
                {currentView === 'requests' && (
                  <Button 
                    onClick={() => setIsModalOpen(true)} 
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Добавить заявку
                  </Button>
                )}
                {currentView === 'employee-exit' && (
                  <Button 
                    onClick={() => setIsEmployeeExitModalOpen(true)} 
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
            {loading ? (
              <TableSkeleton />
            ) : (
              <>
                {currentView === 'dashboard' ? (
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
                      <RequestsTable 
                        requests={requests.slice(0, 5)} 
                        onUpdate={loadRequests}
                        onEdit={handleEdit}
                      />
                    </div>
                  </div>
                ) : currentView === 'requests' ? (
                  <div className="space-y-6 animate-fade-in">
                    <SearchAndFilters
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      filter={filter}
                      onFilterChange={setFilter}
                      totalCount={requests.length}
                      filteredCount={filteredRequests.length}
                      searchInputRef={searchInputRef}
                    />
                    
                    <RequestsTable 
                      requests={filteredRequests} 
                      onUpdate={loadRequests}
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
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Request Modal */}
      <AddRequestModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onRequestAdded={loadRequests}
      />

      {/* Edit Request Modal */}
      <EditRequestModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onRequestUpdated={loadRequests}
        request={editingRequest}
      />
    </div>
  )
}

export default App
