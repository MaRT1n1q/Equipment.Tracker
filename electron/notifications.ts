import { Notification } from 'electron'
import type { Knex } from 'knex'

const MS_IN_DAY = 24 * 60 * 60 * 1000
const CHECK_INTERVAL = 60 * 1000
const REMINDER_HOURS = [9, 12, 15, 18] as const

interface ExitRecord {
  id: number
  employee_name: string
  exit_date: string
  is_completed: number
}

type GetDatabase = () => Knex

type ExitReminderScheduler = {
  stop: () => void
  triggerCheck: () => void
}

function parseDateOnly(value: string): Date | null {
  if (!value) {
    return null
  }

  const [datePart] = value.split('T')
  const parts = datePart.split('-').map((segment) => Number.parseInt(segment, 10))

  if (parts.length === 3 && parts.every((segment) => !Number.isNaN(segment))) {
    const [year, month, day] = parts
    return new Date(year, month - 1, day)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function formatHumanDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatReminderKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

async function fetchUpcomingExits(
  getDatabase: GetDatabase,
  today: Date,
  reminderKey: string
): Promise<ExitRecord[]> {
  const database = getDatabase()
  const rows = (await database('employee_exits').select(
    'id',
    'employee_name',
    'exit_date',
    'is_completed'
  )) as ExitRecord[]

  const upcoming = rows.filter((row) => {
    if (row.is_completed === 1) {
      return false
    }

    const exitDate = parseDateOnly(row.exit_date)
    if (!exitDate) {
      return false
    }

    const key = formatReminderKey(exitDate)
    if (key !== reminderKey) {
      return false
    }

    const diffDays = Math.round((exitDate.getTime() - today.getTime()) / MS_IN_DAY)
    return diffDays === 1
  })

  return upcoming
}

function showReminder(exits: ExitRecord[], tomorrow: Date) {
  if (exits.length === 0) {
    return
  }

  const title = exits.length === 1 ? 'Напоминание о выходе сотрудника' : 'Напоминание о выходах'

  const heading =
    exits.length === 1 ? `${exits[0].employee_name}` : `${exits.length} сотрудника завтра выходят`

  const bodyLines = exits.map((exit) => `• ${exit.employee_name}`)
  const body = [`${formatHumanDate(tomorrow)}:`, ...bodyLines].join('\n')

  try {
    const notification = new Notification({
      title,
      body: `${heading}\n${body}`,
      silent: false,
    })

    notification.show()
  } catch (error) {
    console.error('Не удалось показать уведомление о выходах:', error)
  }
}

export function startExitReminderScheduler(getDatabase: GetDatabase): ExitReminderScheduler | null {
  if (!Notification.isSupported()) {
    console.warn('Системные уведомления не поддерживаются на этой платформе')
    return null
  }

  let intervalHandle: NodeJS.Timeout | null = null
  let isChecking = false
  let pendingCheck = false
  let lastReminderKey: string | null = null
  const shownSlots = new Set<string>()

  const runCheck = async () => {
    if (isChecking) {
      pendingCheck = true
      return
    }

    isChecking = true
    let reminderKey: string | null = null
    let dueHours: number[] = []

    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + MS_IN_DAY)
      reminderKey = formatReminderKey(tomorrow)

      if (lastReminderKey !== reminderKey) {
        shownSlots.clear()
        lastReminderKey = reminderKey
      }

      dueHours = REMINDER_HOURS.filter((hour) => {
        const slotKey = `${reminderKey}-${hour}`
        if (shownSlots.has(slotKey)) {
          return false
        }

        const slotTime = new Date(today)
        slotTime.setHours(hour, 0, 0, 0)
        return now >= slotTime
      })

      if (dueHours.length === 0) {
        return
      }

      const upcoming = await fetchUpcomingExits(getDatabase, today, reminderKey)

      if (upcoming.length > 0) {
        showReminder(upcoming, tomorrow)
      }
    } catch (error) {
      console.error('Ошибка при проверке выходов для напоминания:', error)
    } finally {
      if (reminderKey && dueHours.length > 0) {
        for (const hour of dueHours) {
          shownSlots.add(`${reminderKey}-${hour}`)
        }
      }

      isChecking = false
      if (pendingCheck) {
        pendingCheck = false
        void runCheck()
      }
    }
  }

  const triggerCheck = () => {
    void runCheck()
  }

  void runCheck()
  intervalHandle = setInterval(() => {
    void runCheck()
  }, CHECK_INTERVAL)

  return {
    stop: () => {
      if (intervalHandle) {
        clearInterval(intervalHandle)
      }
      intervalHandle = null
      shownSlots.clear()
      lastReminderKey = null
    },
    triggerCheck,
  }
}
