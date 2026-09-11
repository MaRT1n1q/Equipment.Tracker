import { useEffect, useState } from 'react'
import { Users, BarChart3, ClipboardList, MapPin, Trash2, ShieldCheck } from 'lucide-react'
import { PageHeader } from './PageHeader'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { AuditLogView } from './AuditLogView'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { cn } from '../lib/utils'
import {
  useAdminUsersQuery,
  useAdminStatsQuery,
  useAdminActions,
  useAdminRegistrationQuery,
} from '../hooks/useAdmin'
import type { AdminUser } from '../lib/api/admin'
import { ListPagination } from './ListPagination'
import { toast } from 'sonner'
import { getCities } from '../lib/auth'

type AdminTab = 'users' | 'stats' | 'audit'

const ADMIN_PAGE_SIZE = 20

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  admin: {
    label: 'Админ',
    className:
      'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.3)]',
  },
  user: {
    label: 'Пользователь',
    className:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
  },
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_LABELS[role] ?? ROLE_LABELS.user
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        meta.className
      )}
    >
      {meta.label}
    </span>
  )
}

function UsersPanel() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useAdminUsersQuery({
    page,
    pageSize: ADMIN_PAGE_SIZE,
  })
  const { setRole, setCity, deleteUser } = useAdminActions()
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    getCities().then(setCities)
  }, [])

  const users = data?.items ?? []
  const meta = data?.meta ?? {
    page: 1,
    pageSize: ADMIN_PAGE_SIZE,
    total: 0,
    pageCount: 1,
    hasMore: false,
  }

  const handleSetRole = async (user: AdminUser, role: string) => {
    try {
      await setRole.mutateAsync({ id: user.id, role })
      toast.success(`Роль для ${user.email} обновлена`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка обновления роли')
    }
  }

  const handleSetCity = async (user: AdminUser, city: string) => {
    try {
      await setCity.mutateAsync({ id: user.id, city })
      toast.success(`Город для ${user.email} обновлён`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка обновления города')
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Удалить пользователя ${user.email}?`)) {
      return
    }
    try {
      await deleteUser.mutateAsync(user.id)
      toast.success(`Пользователь ${user.email} удалён`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка удаления пользователя')
    }
  }

  if (isLoading) {
    return <LoadingState label="Загружаем пользователей…" />
  }
  if (isError) {
    return <ErrorState title="Не удалось загрузить пользователей" onRetry={() => refetch()} />
  }

  const cityOptions = cities

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Пользователь</th>
                <th className="px-4 py-3 text-left font-medium">Город</th>
                <th className="px-4 py-3 text-left font-medium">Роль</th>
                <th className="px-4 py-3 text-left font-medium">Изменить роль</th>
                <th className="px-4 py-3 text-left font-medium">Изменить город</th>
                <th className="px-4 py-3 text-left font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-xs font-semibold">
                        {(user.name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{user.email}</div>
                        {user.name && user.name !== user.email && (
                          <div className="text-xs text-muted-foreground truncate">{user.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {user.city || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <Select value={user.role} onValueChange={(role) => handleSetRole(user, role)}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Пользователь</SelectItem>
                        <SelectItem value="admin">Админ</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {cityOptions.length > 0 ? (
                      <Select value={user.city} onValueChange={(city) => handleSetCity(user, city)}>
                        <SelectTrigger className="h-8 w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cityOptions.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">{user.city || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user)}
                      className="text-destructive hover:bg-destructive/10"
                      title="Удалить пользователя"
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

      {meta.total > ADMIN_PAGE_SIZE && (
        <ListPagination
          page={meta.page}
          pageCount={meta.pageCount}
          total={meta.total}
          pageSize={meta.pageSize}
          pageSizeOptions={[]}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

function StatsPanel() {
  const { data, isLoading, isError, refetch } = useAdminStatsQuery()

  if (isLoading) {
    return <LoadingState label="Загружаем статистику…" />
  }
  if (isError) {
    return <ErrorState title="Не удалось загрузить статистику" onRetry={() => refetch()} />
  }

  const renderCityBlock = (
    title: string,
    icon: typeof BarChart3,
    rows: { city: string; total: number }[]
  ) => {
    const Icon = icon
    const max = Math.max(1, ...rows.map((r) => r.total))
    return (
      <div className="surface-section space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет данных</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.city} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{row.city || '—'}</span>
                  <span className="font-medium text-foreground">{row.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--primary)/0.7)]"
                    style={{ width: `${(row.total / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {renderCityBlock('Заявки по городам', BarChart3, data?.requests_by_city ?? [])}
      {renderCityBlock('Выходы по городам', BarChart3, data?.exits_by_city ?? [])}
      {renderCityBlock('Пользователи по городам', BarChart3, data?.users_by_city ?? [])}
    </div>
  )
}

export function AdminView() {
  const [tab, setTab] = useState<AdminTab>('users')

  const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'stats', label: 'Статистика', icon: BarChart3 },
    { id: 'audit', label: 'Аудит-лог', icon: ClipboardList },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Администрирование"
        title="Админ-панель"
        description="Управление пользователями, статистика по городам и журнал действий."
      />

      {/* Настройки регистрации */}
      <RegistrationSettings />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <Button
              key={t.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(t.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {t.label}
            </Button>
          )
        })}
      </div>

      {tab === 'users' && <UsersPanel />}
      {tab === 'stats' && <StatsPanel />}
      {tab === 'audit' && <AuditLogView />}
    </div>
  )
}

function RegistrationSettings() {
  const { data: enabled, isLoading, isError, refetch } = useAdminRegistrationQuery()
  const { setRegistration } = useAdminActions()

  const handleToggle = async (next: boolean) => {
    try {
      await setRegistration.mutateAsync(next)
      toast.success(next ? 'Авторегистрация включена' : 'Авторегистрация отключена')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка изменения настройки')
    }
  }

  return (
    <div className="surface-section space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
        <h3 className="font-semibold text-foreground">Авторегистрация пользователей</h3>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка настройки…</p>
      ) : isError ? (
        <ErrorState title="Не удалось загрузить настройку регистрации" onRetry={() => refetch()} />
      ) : (
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={enabled ?? false}
            onCheckedChange={(value) => handleToggle(Boolean(value))}
          />
          <span className="text-sm text-foreground">
            Разрешить автоматическое создание учётной записи при первом входе
          </span>
        </label>
      )}
    </div>
  )
}
