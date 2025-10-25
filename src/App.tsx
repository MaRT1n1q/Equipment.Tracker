import { useEffect, useState, useRef, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from './components/ui/button'
import { AddRequestModal } from './components/AddRequestModal'
import { RequestsTable } from './components/RequestsTable'
import { ThemeToggle } from './components/ThemeToggle'
import { SearchAndFilters } from './components/SearchAndFilters'
import { Toaster } from 'sonner'
import { Request } from './types/electron.d'

function App() {
  const [requests, setRequests] = useState<Request[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'issued' | 'not-issued'>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Filter and search requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests]

    // Apply filter
    if (filter === 'issued') {
      filtered = filtered.filter(req => req.is_issued === 1)
    } else if (filter === 'not-issued') {
      filtered = filtered.filter(req => req.is_issued === 0)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(req =>
        req.employee_name.toLowerCase().includes(query) ||
        req.equipment_name.toLowerCase().includes(query) ||
        req.serial_number.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [requests, filter, searchQuery])

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

  // Calculate statistics
  const stats = useMemo(() => {
    const total = requests.length
    const issued = requests.filter(r => r.is_issued === 1).length
    const notIssued = total - issued
    return { total, issued, notIssued }
  }, [requests])

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Equipment Tracker
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Учет заявок на выдачу оборудования
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Statistics */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground">Всего:</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">Выдано:</span>
                  <span className="font-semibold">{stats.issued}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <span className="text-muted-foreground">Не выдано:</span>
                  <span className="font-semibold">{stats.notIssued}</span>
                </div>
              </div>
              
              <div className="h-8 w-px bg-border hidden md:block"></div>
              
              <ThemeToggle />
              <Button onClick={() => setIsModalOpen(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Добавить заявку
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        ) : (
          <>
            <SearchAndFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filter={filter}
              onFilterChange={setFilter}
              totalCount={requests.length}
              filteredCount={filteredRequests.length}
              searchInputRef={searchInputRef}
            />
            <RequestsTable requests={filteredRequests} onUpdate={loadRequests} />
          </>
        )}
      </main>

      {/* Add Request Modal */}
      <AddRequestModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onRequestAdded={loadRequests}
      />
    </div>
  )
}

export default App
