import { Request } from '../types/electron.d'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { Trash2, Package, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface RequestsTableProps {
  requests: Request[]
  onUpdate: () => void
}

export function RequestsTable({ requests, onUpdate }: RequestsTableProps) {
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
              <th className="text-left p-4 font-semibold text-sm">№</th>
              <th className="text-left p-4 font-semibold text-sm">ФИО сотрудника</th>
              <th className="text-left p-4 font-semibold text-sm">Оборудование</th>
              <th className="text-left p-4 font-semibold text-sm">Серийный номер</th>
              <th className="text-left p-4 font-semibold text-sm">Дата создания</th>
              <th className="text-center p-4 font-semibold text-sm">Выдано</th>
              <th className="text-center p-4 font-semibold text-sm">Действия</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
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
                <td className="p-4 text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={Boolean(request.is_issued)}
                      onCheckedChange={() => handleToggleIssued(request.id, Boolean(request.is_issued))}
                    />
                  </div>
                </td>
                <td className="p-4 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(request.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
