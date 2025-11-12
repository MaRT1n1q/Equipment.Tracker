import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, UserMinus } from 'lucide-react'
import type { EmployeeExit } from '../types/ipc'
import { cn } from '../lib/utils'
import { parseExitEquipmentList, stringifyExitEquipmentItems } from '../lib/employeeExitEquipment'

interface EmployeeExitCalendarProps {
  exits: EmployeeExit[]
}

type CalendarDay = {
  date: Date
  inCurrentMonth: boolean
  key: string
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

  const firstWeekdayIndex = (monthStart.getDay() + 6) % 7 // Monday = 0
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

export function EmployeeExitCalendar({ exits }: EmployeeExitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => getMonthStart(new Date()))
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())

  const exitsByDay = useMemo(() => {
    const map = new Map<string, EmployeeExit[]>()

    exits.forEach((exit) => {
      const date = parseDate(exit.exit_date)
      const key = formatDateKey(date)
      const current = map.get(key) ?? []
      current.push(exit)
      map.set(key, current)
    })

    return map
  }, [exits])

  const selectedKey = selectedDate ? formatDateKey(selectedDate) : null

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = formatDateKey(today)

    if (selectedKey && exitsByDay.has(selectedKey)) {
      return
    }

    if (exits.length === 0) {
      if (selectedKey !== todayKey) {
        setSelectedDate(new Date(today))
      }
      return
    }

    if (exitsByDay.has(todayKey)) {
      if (selectedKey !== todayKey) {
        setSelectedDate(new Date(today))
      }
      return
    }

    const upcoming = [...exits]
      .map((exit) => parseDate(exit.exit_date))
      .sort((a, b) => a.getTime() - b.getTime())
      .find((date) => date.getTime() >= today.getTime())

    if (upcoming) {
      const upcomingKey = formatDateKey(upcoming)
      if (upcomingKey !== selectedKey) {
        setSelectedDate(new Date(upcoming))
      }
      return
    }

    const recent = [...exits]
      .map((exit) => parseDate(exit.exit_date))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    if (recent) {
      const recentKey = formatDateKey(recent)
      if (recentKey !== selectedKey) {
        setSelectedDate(new Date(recent))
      }
    } else if (selectedKey !== todayKey) {
      setSelectedDate(new Date(today))
    }
  }, [exits, exitsByDay, selectedKey])

  const calendarDays = useMemo(() => getMonthGrid(currentMonth), [currentMonth])
  const selectedExits = selectedKey ? (exitsByDay.get(selectedKey) ?? []) : []

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
              const exitsForDay = exitsByDay.get(key) ?? []
              const isToday = key === formatDateKey(new Date())
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
                    {exitsForDay.length > 0 ? (
                      <div className="space-y-1 max-h-20 overflow-hidden">
                        {exitsForDay.slice(0, 2).map((exit) => (
                          <div
                            key={exit.id}
                            className={cn(
                              'flex items-center gap-2 text-xs rounded-md px-2 py-1 truncate',
                              exit.is_completed === 1
                                ? 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success)/1.2)]'
                                : 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning)/1.2)]'
                            )}
                          >
                            <span className="truncate">{exit.employee_name}</span>
                          </div>
                        ))}
                        {exitsForDay.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">
                            + ещё {exitsForDay.length - 2}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full rounded-md border border-dashed border-border/40 text-[10px] text-muted-foreground flex items-center justify-center">
                        Нет выходов
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
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--warning))]" /> Ожидают
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" /> Завершены
            </span>
          </div>
        </div>

        {selectedExits.length > 0 ? (
          <ul className="space-y-3">
            {selectedExits.map((exit) => {
              const equipmentItems = parseExitEquipmentList(exit.equipment_list)
              const equipmentDetails =
                equipmentItems.length > 0
                  ? stringifyExitEquipmentItems(equipmentItems)
                  : 'Оборудование не указано'

              return (
                <li
                  key={exit.id}
                  className="surface-section rounded-lg p-4 flex flex-col gap-2 border border-border/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{exit.employee_name}</p>
                      <p className="text-xs text-muted-foreground">Логин: {exit.login}</p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide',
                        exit.is_completed === 1
                          ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]'
                          : 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]'
                      )}
                    >
                      {exit.is_completed === 1 ? 'Завершено' : 'Ожидает'}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {equipmentDetails}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="surface-section rounded-lg p-6 text-center text-sm text-muted-foreground">
            На выбранную дату выходы не запланированы.
          </div>
        )}
      </div>
    </div>
  )
}
