import {
  LayoutDashboard,
  Package,
  BriefcaseBusiness,
  FileText,
  BookOpen,
  BarChart3,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export type AppView =
  | 'dashboard'
  | 'requests'
  | 'employee-exit'
  | 'templates'
  | 'instructions'
  | 'analytics'
  | 'admin'

export interface NavItem {
  id: AppView
  label: string
  shortLabel: string
  icon: LucideIcon
  adminOnly?: boolean
}

/** Пункты навигации, общие для сайдбара (desktop) и нижней панели (mobile). */
export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', shortLabel: 'Главная', icon: LayoutDashboard },
  { id: 'requests', label: 'Заявки', shortLabel: 'Заявки', icon: Package },
  {
    id: 'employee-exit',
    label: 'Выход сотрудников',
    shortLabel: 'Выходы',
    icon: BriefcaseBusiness,
  },
  { id: 'templates', label: 'Шаблоны', shortLabel: 'Шаблоны', icon: FileText },
  { id: 'instructions', label: 'Инструкции', shortLabel: 'Инструкции', icon: BookOpen },
  { id: 'analytics', label: 'Аналитика', shortLabel: 'Аналитика', icon: BarChart3 },
  { id: 'admin', label: 'Админ-панель', shortLabel: 'Админ', icon: ShieldCheck, adminOnly: true },
]
