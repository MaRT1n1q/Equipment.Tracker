import { useState, useEffect } from 'react'
import { EmployeeExit } from '../types/electron.d'
import { EmployeeExitTable } from './EmployeeExitTable'
import { AddEmployeeExitModal } from './AddEmployeeExitModal'
import { Button } from './ui/button'
import { UserPlus, CheckCircle, Clock, Users } from 'lucide-react'

export function EmployeeExitView() {
  const [exits, setExits] = useState<EmployeeExit[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadExits = async () => {
    try {
      const result = await window.electronAPI.getEmployeeExits()
      if (result.success && result.data) {
        setExits(result.data)
      }
    } catch (error) {
      console.error('Failed to load employee exits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExits()
  }, [])

  // Statistics
  const totalExits = exits.length
  const completedExits = exits.filter(e => e.is_completed === 1).length
  const pendingExits = exits.filter(e => e.is_completed === 0).length

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="bg-card rounded-xl border border-border p-6 hover:border-orange-500/50 transition-all duration-300 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Всего записей</p>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                {totalExits}
              </h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-card rounded-xl border border-border p-6 hover:border-green-500/50 transition-all duration-300 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Завершено</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
                {completedExits}
              </h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-card rounded-xl border border-border p-6 hover:border-orange-500/50 transition-all duration-300 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">В ожидании</p>
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {pendingExits}
              </h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-7 h-7 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Список выходов</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Управление записями о выходе сотрудников
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Добавить запись
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <EmployeeExitTable exits={exits} onUpdate={loadExits} />
      )}

      {/* Add Modal */}
      <AddEmployeeExitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadExits}
      />
    </div>
  )
}
