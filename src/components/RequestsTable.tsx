import { useState } from 'react'
import { Request } from '../types/electron.d'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { Trash2, Package, FileText, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface RequestsTableProps {
  requests: Request[]
  onUpdate: () => void
  onEdit: (request: Request) => void
}

type SortField = 'id' | 'employee_name' | 'equipment_name' | 'created_at' | 'issued_at'
type SortDirection = 'asc' | 'desc'

export function RequestsTable({ requests, onUpdate, onEdit }: RequestsTableProps) {
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sort requests
  const sortedRequests = [...requests].sort((a, b) => {
    let aValue: string | number | null = a[sortField]
    let bValue: string | number | null = b[sortField]

    // Handle null values for issued_at
    if (sortField === 'issued_at') {
      if (!aValue) return 1
      if (!bValue) return -1
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue as string).toLowerCase()
    }

    if (aValue! < bValue!) return sortDirection === 'asc' ? -1 : 1
    if (aValue! > bValue!) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleToggleIssued = async (id: number, currentStatus: boolean) => {
    try {
      const result = await window.electronAPI.updateIssued(id, !currentStatus)
      
      if (result.success) {
        toast.success(!currentStatus ? 'Оборудование отмечено как выданное' : 'Статус отменен')
        onUpdate()
      } else {
        toast.error(result.error || 'Ошибка при обновлении статуса')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) {
      return
    }

    try {
      const result = await window.electronAPI.deleteRequest(id)
      
      if (result.success) {
        toast.success('Заявка удалена')
        onUpdate()
      } else {
        toast.error(result.error || 'Ошибка при удалении заявки')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Заявок пока нет</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Создайте первую заявку на выдачу оборудования, нажав кнопку "Добавить заявку" выше
          или используя сочетание клавиш <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Ctrl+N</kbd>
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Учёт заявок</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Контроль выдачи</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th 
                className="text-left p-4 font-semibold text-sm cursor-pointer hover:bg-muted-foreground/10 transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-2">
                  № {sortField === 'id' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="text-left p-4 font-semibold text-sm cursor-pointer hover:bg-muted-foreground/10 transition-colors"
                onClick={() => handleSort('employee_name')}
              >
                <div className="flex items-center gap-2">
                  ФИО сотрудника {sortField === 'employee_name' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="text-left p-4 font-semibold text-sm cursor-pointer hover:bg-muted-foreground/10 transition-colors"
                onClick={() => handleSort('equipment_name')}
              >
                <div className="flex items-center gap-2">
                  Оборудование {sortField === 'equipment_name' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="text-left p-4 font-semibold text-sm">Серийный номер</th>
              <th 
                className="text-left p-4 font-semibold text-sm cursor-pointer hover:bg-muted-foreground/10 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  Дата создания {sortField === 'created_at' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th 
                className="text-left p-4 font-semibold text-sm cursor-pointer hover:bg-muted-foreground/10 transition-colors"
                onClick={() => handleSort('issued_at')}
              >
                <div className="flex items-center gap-2">
                  Дата выдачи {sortField === 'issued_at' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="text-center p-4 font-semibold text-sm">Выдано</th>
              <th className="text-center p-4 font-semibold text-sm">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.map((request) => (
              <tr
                key={request.id}
                className={`border-t hover:bg-muted/50 transition-colors ${
                  request.is_issued ? 'opacity-60' : ''
                }`}
              >
                <td className="p-4 text-sm">{request.id}</td>
                <td className="p-4 text-sm font-medium">{request.employee_name}</td>
                <td className="p-4 text-sm">{request.equipment_name}</td>
                <td className="p-4 text-xs font-mono">{request.serial_number}</td>
                <td className="p-4 text-sm text-muted-foreground">{formatDate(request.created_at)}</td>
                <td className="p-4 text-sm text-muted-foreground">
                  {request.issued_at ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {formatDate(request.issued_at)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={Boolean(request.is_issued)}
                      onCheckedChange={() => handleToggleIssued(request.id, Boolean(request.is_issued))}
                    />
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(request)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      title="Редактировать"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(request.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
