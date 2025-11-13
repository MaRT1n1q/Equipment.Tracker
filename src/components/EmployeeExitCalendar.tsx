import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCcw, UserMinus } from 'lucide-react'
import type { EmployeeExit } from '../types/ipc'
import { cn } from '../lib/utils'
import { parseExitEquipmentList, stringifyExitEquipmentItems } from '../lib/employeeExitEquipment'

interface EmployeeExitCalendarProps {
  exits: EmployeeExit[]
  returns: RequestReturnEvent[]
}

interface RequestReturnEvent {
  id: number
  requestId: number
  employeeName: string
  login: string
  sdNumber: string | null
  dueDate: string
  equipmentList: string
  isCompleted: boolean
}

type CalendarDay = {
  date: Date
  inCurrentMonth: boolean
  key: string
}

type CalendarEvent = {
  kind: 'exit' | 'return'
  id: string
  sourceId: number
  employeeName: string
  login: string
  sdNumber: string | null
  equipmentList: string
  date: Date
  dateKey: string
  rawDate: string
  status: 'pending' | 'completed'
  isOverdue: boolean
}

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTH_SHORT_LABELS = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]
const CALENDAR_GRID_SIZE = 35

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string): Date {
  const parts = value.split('-').map(Number)
  if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }

  return new Date(value)
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getMonthGrid(date: Date): CalendarDay[] {
  const monthStart = getMonthStart(date)
  const { year, month } = { year: monthStart.getFullYear(), month: monthStart.getMonth() }

  const firstWeekdayIndex = (monthStart.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - firstWeekdayIndex)

  const days: CalendarDay[] = []
  for (let i = 0; i < CALENDAR_GRID_SIZE; i += 1) {
    const current = new Date(gridStart)
    current.setDate(gridStart.getDate() + i)

    days.push({
      date: current,
      inCurrentMonth: current.getMonth() === month,
      key: formatDateKey(current),
    })
  }

  return days
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function getLongDateLabel(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  })
}

function moveMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

export function EmployeeExitCalendar({ exits, returns }: EmployeeExitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => getMonthStart(new Date()))
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())

  const calendarEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const aggregate: CalendarEvent[] = []

    exits.forEach((exit) => {
      const date = parseDate(exit.exit_date)
      date.setHours(0, 0, 0, 0)

      aggregate.push({
        kind: 'exit',
        id: `exit-${exit.id}`,
        sourceId: exit.id,
        employeeName: exit.employee_name,
        login: exit.login,
        sdNumber: exit.sd_number ?? null,
        equipmentList: exit.equipment_list,
        date,
        dateKey: formatDateKey(date),
        rawDate: exit.exit_date,
        status: exit.is_completed === 1 ? 'completed' : 'pending',
        isOverdue: exit.is_completed === 0 && date.getTime() < today.getTime(),
      })
    })

    returns.forEach((item) => {
      const date = parseDate(item.dueDate)
      date.setHours(0, 0, 0, 0)

      aggregate.push({
        kind: 'return',
        id: `return-${item.id}`,
        sourceId: item.requestId,
        employeeName: item.employeeName,
        login: item.login,
        sdNumber: item.sdNumber,
        equipmentList: item.equipmentList,
        date,
        dateKey: formatDateKey(date),
        rawDate: item.dueDate,
        status: item.isCompleted ? 'completed' : 'pending',
        isOverdue: !item.isCompleted && date.getTime() < today.getTime(),
      })
    })

    return aggregate.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [exits, returns])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()

    calendarEvents.forEach((event) => {
      const current = map.get(event.dateKey) ?? []
      current.push(event)
      map.set(event.dateKey, current)
    })

    map.forEach((events) => events.sort((a, b) => a.employeeName.localeCompare(b.employeeName)))

    return map
  }, [calendarEvents])

  const selectedKey = selectedDate ? formatDateKey(selectedDate) : null
  const todayKey = formatDateKey(new Date())

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDateKey = formatDateKey(today)

    if (selectedKey && eventsByDay.has(selectedKey)) {
      return
    }

    if (calendarEvents.length === 0) {
      if (selectedKey !== todayDateKey) {
        setSelectedDate(new Date(today))
      }
      return
    }

    if (eventsByDay.has(todayDateKey)) {
      if (selectedKey !== todayDateKey) {
        setSelectedDate(new Date(today))
      }
      return
    }

    const upcoming = calendarEvents
      .map((event) => new Date(event.date))
      .find((date) => date.getTime() >= today.getTime())

    if (upcoming) {
      const upcomingKey = formatDateKey(upcoming)
      if (upcomingKey !== selectedKey) {
        setSelectedDate(new Date(upcoming))
      }
      return
    }

    const recent = calendarEvents
      .map((event) => new Date(event.date))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    if (recent) {
      const recentKey = formatDateKey(recent)
      if (recentKey !== selectedKey) {
        setSelectedDate(new Date(recent))
      }
    } else if (selectedKey !== todayDateKey) {
      setSelectedDate(new Date(today))
    }
  }, [calendarEvents, eventsByDay, selectedKey])

  const calendarDays = useMemo(() => getMonthGrid(currentMonth), [currentMonth])
  const selectedEvents = selectedKey ? (eventsByDay.get(selectedKey) ?? []) : []

  const getEventTone = (event: CalendarEvent) => {
    if (event.kind === 'return') {
      if (event.status === 'completed') {
        return 'success'
      }
      if (event.isOverdue) {
        return 'danger'
      }
      return 'info'
    }

    return event.status === 'completed' ? 'success' : 'warning'
  }

  const toneBadgeClasses: Record<string, string> = {
    success: 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success)/1.2)]',
    warning: 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning)/1.2)]',
    danger: 'bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive)/1.2)]',
    info: 'bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--primary)/1.2)]',
  }

  const tonePillClasses: Record<string, string> = {
    success: 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]',
    warning: 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]',
    danger: 'bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))]',
    info: 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]',
  }

  return (
    <div className="space-y-6">
      <div className="surface-card p-6 rounded-xl shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-[hsl(var(--primary))]" />
              <h2 className="text-xl font-semibold">Календарь выходов сотрудников</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="icon-button"
                onClick={() => setCurrentMonth((prev) => moveMonth(prev, -1))}
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="surface-section px-4 py-2 rounded-lg text-sm font-medium capitalize">
                {getMonthLabel(currentMonth)}
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setCurrentMonth((prev) => moveMonth(prev, 1))}
                aria-label="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="uppercase tracking-wide">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const key = day.key
              const eventsForDay = eventsByDay.get(key) ?? []
              const isToday = key === todayKey
              const isSelected = key === selectedKey

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    setSelectedDate(new Date(day.date))
                    if (!day.inCurrentMonth) {
                      setCurrentMonth(getMonthStart(day.date))
                    }
                  }}
                  className={cn(
                    'relative p-3 rounded-lg text-left transition-all duration-200 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--primary))] hover:border-[hsl(var(--primary)/0.4)] flex flex-col gap-2 min-h-[140px] overflow-hidden',
                    !day.inCurrentMonth && 'text-muted-foreground/60 bg-muted/40',
                    day.inCurrentMonth && 'bg-muted/20',
                    isToday && 'border-[hsl(var(--primary)/0.6)] bg-[hsl(var(--primary)/0.08)]',
                    isSelected && 'ring-2 ring-[hsl(var(--primary))] ring-offset-2'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium">{day.date.getDate()}</span>
                      <span className="text-[10px] uppercase text-muted-foreground tracking-wide">
                        {MONTH_SHORT_LABELS[day.date.getMonth()]}
                      </span>
                    </div>
                    {isToday && (
                      <span className="text-[10px] uppercase text-[hsl(var(--primary))]">
                        Сегодня
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex-1">
                    {eventsForDay.length > 0 ? (
                      <div className="space-y-1 max-h-20 overflow-hidden">
                        {eventsForDay.slice(0, 2).map((event) => {
                          const tone = getEventTone(event)

                          return (
                            <div
                              key={event.id}
                              className={cn(
                                'flex items-center gap-2 text-xs rounded-md px-2 py-1 truncate',
                                toneBadgeClasses[tone]
                              )}
                            >
                              <span className="truncate">{event.employeeName}</span>
                            </div>
                          )
                        })}
                        {eventsForDay.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">
                            + ещё {eventsForDay.length - 2}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full rounded-md border border-dashed border-border/40 text-[10px] text-muted-foreground flex items-center justify-center">
                        Нет событий
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="surface-card p-6 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold">События</h3>
            <p className="text-sm text-muted-foreground">
              {selectedDate
                ? getLongDateLabel(selectedDate)
                : 'Выберите дату в календаре, чтобы увидеть подробности.'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--warning))]" /> Выходы в ожидании
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> Возвраты
              запланированы
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" /> Завершено
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]" /> Просрочено
            </span>
          </div>
        </div>

        {selectedEvents.length > 0 ? (
          <ul className="space-y-3">
            {selectedEvents.map((event) => {
              const tone = getEventTone(event)
              const equipmentItems = parseExitEquipmentList(event.equipmentList)
              const equipmentDetails =
                equipmentItems.length > 0
                  ? stringifyExitEquipmentItems(equipmentItems)
                  : 'Оборудование не указано'

              const statusText = (() => {
                if (event.kind === 'return') {
                  if (tone === 'success') {
                    return 'Сдача завершена'
                  }
                  if (tone === 'danger') {
                    return 'Сдача просрочена'
                  }
                  return 'Сдача запланирована'
                }

                return tone === 'success' ? 'Завершено' : 'Ожидает'
              })()

              const infoLine =
                event.kind === 'return'
                  ? `Плановая сдача: ${getLongDateLabel(event.date)}`
                  : `Дата выхода: ${getLongDateLabel(event.date)}`

              return (
                <li
                  key={event.id}
                  className="surface-section rounded-lg p-4 flex flex-col gap-2 border border-border/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground flex items-center gap-2">
                        {event.kind === 'return' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] px-2 py-0.5 text-[11px] uppercase tracking-wide">
                            <RefreshCcw className="h-3 w-3" /> Сдача техники
                          </span>
                        )}
                        <span className="truncate">{event.employeeName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">Логин: {event.login}</p>
                      {event.sdNumber && (
                        <p className="text-xs text-muted-foreground truncate">
                          SD: {event.sdNumber}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide',
                        tonePillClasses[tone]
                      )}
                    >
                      {statusText}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{infoLine}</div>
                  <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {equipmentDetails}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="surface-section rounded-lg p-6 text-center text-sm text-muted-foreground">
            На выбранную дату событий не запланировано.
          </div>
        )}
      </div>
    </div>
  )
}
