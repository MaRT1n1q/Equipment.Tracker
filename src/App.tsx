import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from './components/ui/button'
import { AddRequestModal } from './components/AddRequestModal'
import { RequestsTable } from './components/RequestsTable'
import { ThemeToggle } from './components/ThemeToggle'
import { Toaster } from 'sonner'
import { Request } from './types/electron.d'

function App() {
  const [requests, setRequests] = useState<Request[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    loadRequests()
  }, [])

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
            <div className="flex items-center gap-3">
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
          <RequestsTable requests={requests} onUpdate={loadRequests} />
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
