import {
  LayoutDashboard,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  BriefcaseBusiness,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  BookOpen,
} from 'lucide-react'
import { Button } from './ui/button'
import { useEffect, useMemo, useState } from 'react'
import { SettingsModal } from './SettingsModal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { ThemeToggle } from './ThemeToggle'
import type { AuthSession } from '../lib/auth'
import { CitySwitcher } from './CitySwitcher'

interface SidebarProps {
  currentView: 'dashboard' | 'requests' | 'employee-exit' | 'templates' | 'instructions'
  onViewChange: (
    view: 'dashboard' | 'requests' | 'employee-exit' | 'templates' | 'instructions'
  ) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  authSession: AuthSession
  onLogout: () => void
  activeCityOverride: string | null
  onCityOverrideChange: (city: string | null) => void
}

type UpdateBannerStatus = 'available' | 'downloading' | 'downloaded' | 'error' | 'manual-required'

interface UpdateBannerState {
  status: UpdateBannerStatus
  message: string
  version?: string | null
  progress?: number | null
}

export function Sidebar({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  authSession,
  onLogout,
  activeCityOverride,
  onCityOverrideChange,
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [updateBanner, setUpdateBanner] = useState<UpdateBannerState | null>(null)

  useEffect(() => {
    if (!window.electronAPI?.onUpdateStatus) {
      return
    }

    const unsubscribe = window.electronAPI.onUpdateStatus((payload) => {
      const rawVersion = payload.data?.version
      const versionCandidate =
        typeof rawVersion === 'string'
          ? rawVersion
          : typeof rawVersion === 'number'
            ? String(rawVersion)
            : undefined

      switch (payload.event) {
        case 'update-available':
          setUpdateBanner({
            status: 'available',
            message: payload.message,
            version: versionCandidate ?? null,
            progress: null,
          })
          break
        case 'download-started':
          setUpdateBanner((previous) => ({
            status: 'downloading',
            message: payload.message,
            version: versionCandidate ?? previous?.version ?? null,
            progress: 0,
          }))
          break
        case 'download-progress': {
          const percentRaw = payload.data?.percent
          let percent: number | null = null
          if (typeof percentRaw === 'number') {
            percent = Math.round(percentRaw)
          } else if (typeof percentRaw === 'string') {
            const parsed = Number(percentRaw)
            percent = Number.isFinite(parsed) ? Math.round(parsed) : null
          }

          setUpdateBanner((previous) => ({
            status: 'downloading',
            message: payload.message,
            version: versionCandidate ?? previous?.version ?? null,
            progress: percent ?? previous?.progress ?? null,
          }))
          break
        }
        case 'update-downloaded':
          setUpdateBanner({
            status: 'downloaded',
            message: payload.message,
            version: versionCandidate ?? null,
            progress: 100,
          })
          break
        case 'update-error':
          setUpdateBanner((previous) => ({
            status: 'error',
            message: payload.message,
            version: previous?.version ?? versionCandidate ?? null,
            progress: null,
          }))
          break
        case 'manual-update-mode':
        case 'manual-update-info':
          setUpdateBanner({
            status: 'manual-required',
            message: payload.message,
            version: versionCandidate ?? null,
            progress: null,
          })
          break
        case 'update-not-available':
          setUpdateBanner(null)
          break
        default:
          break
      }
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  const bannerTone = useMemo(() => {
    if (!updateBanner) {
      return null
    }

    const toneMap: Record<
      UpdateBannerStatus,
      { bg: string; border: string; text: string; iconBg: string; dot: string }
    > = {
      available: {
        bg: 'bg-[hsl(var(--warning))]/10',
        border: 'border-[hsl(var(--warning))]/40',
        text: 'text-[hsl(var(--warning))]',
        iconBg: 'bg-[hsl(var(--warning))]/20',
        dot: 'bg-[hsl(var(--warning))]',
      },
      downloading: {
        bg: 'bg-[hsl(var(--primary))]/10',
        border: 'border-[hsl(var(--primary))]/40',
        text: 'text-[hsl(var(--primary))]',
        iconBg: 'bg-[hsl(var(--primary))]/20',
        dot: 'bg-[hsl(var(--primary))]',
      },
      downloaded: {
        bg: 'bg-[hsl(var(--success))]/10',
        border: 'border-[hsl(var(--success))]/40',
        text: 'text-[hsl(var(--success))]',
        iconBg: 'bg-[hsl(var(--success))]/20',
        dot: 'bg-[hsl(var(--success))]',
      },
      error: {
        bg: 'bg-[hsl(var(--destructive))]/10',
        border: 'border-[hsl(var(--destructive))]/40',
        text: 'text-[hsl(var(--destructive))]',
        iconBg: 'bg-[hsl(var(--destructive))]/20',
        dot: 'bg-[hsl(var(--destructive))]',
      },
      'manual-required': {
        bg: 'bg-[hsl(var(--warning))]/10',
        border: 'border-[hsl(var(--warning))]/40',
        text: 'text-[hsl(var(--warning))]',
        iconBg: 'bg-[hsl(var(--warning))]/20',
        dot: 'bg-[hsl(var(--warning))]',
      },
    }

    return toneMap[updateBanner.status]
  }, [updateBanner])

  const bannerIcon = useMemo(() => {
    if (!updateBanner) {
      return Download
    }

    const iconMap: Record<UpdateBannerStatus, typeof Download> = {
      available: Download,
      downloading: RefreshCw,
      downloaded: CheckCircle2,
      error: AlertTriangle,
      'manual-required': Info,
    }

    return iconMap[updateBanner.status]
  }, [updateBanner])

  const bannerTitle = useMemo(() => {
    if (!updateBanner) {
      return null
    }

    switch (updateBanner.status) {
      case 'available':
        return 'Доступно обновление'
      case 'downloading':
        return 'Загрузка обновления'
      case 'downloaded':
        return 'Обновление загружено'
      case 'error':
        return 'Ошибка обновления'
      case 'manual-required':
        return 'Доступно обновление'
      default:
        return null
    }
  }, [updateBanner])

  const bannerVersionLabel = useMemo(() => {
    if (!updateBanner?.version) {
      return null
    }

    return updateBanner.version.startsWith('v') ? updateBanner.version : `v${updateBanner.version}`
  }, [updateBanner])

  const BannerIconComponent = bannerIcon
  const showUpdateBanner = Boolean(updateBanner && bannerTone)

  const menuItems = [
    {
      id: 'dashboard' as const,
      label: 'Дашборд',
      icon: LayoutDashboard,
    },
    {
      id: 'requests' as const,
      label: 'Заявки',
      icon: Package,
    },
    {
      id: 'employee-exit' as const,
      label: 'Выход сотрудников',
      icon: BriefcaseBusiness,
    },
    {
      id: 'templates' as const,
      label: 'Шаблоны',
      icon: FileText,
    },
    {
      id: 'instructions' as const,
      label: 'Инструкции',
      icon: BookOpen,
    },
  ]

  return (
    <div
      className={`fixed left-0 top-10 flex flex-col h-[calc(100vh-2.5rem)] bg-card border-r border-border shadow-soft transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="icon-bubble w-10 h-10">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Equipment</h1>
              <p className="text-xs text-muted-foreground">Tracker</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="ml-auto hover:bg-accent"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={200} skipDelayDuration={0}>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = currentView === item.id
            return (
              <Tooltip key={item.id} disableHoverableContent={!isCollapsed}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={`
                      relative w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200 group
                      ${
                        isActive
                          ? 'bg-gradient-primary text-primary-foreground shadow-brand'
                          : 'text-muted-foreground hover:bg-muted/40'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    {/* Icon */}
                    <item.icon
                      className={`
                        w-5 h-5 relative z-10 transition-transform duration-200
                        ${isActive ? 'scale-110 text-primary-foreground' : 'group-hover:scale-110'}
                      `}
                    />

                    {/* Label */}
                    {!isCollapsed && (
                      <span
                        className={`relative z-10 font-medium ${isActive ? '' : 'text-foreground'}`}
                      >
                        {item.label}
                      </span>
                    )}

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/70 rounded-l-full" />
                    )}
                  </button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" align="center">
                    <span className="text-sm font-medium">{item.label}</span>
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <CitySwitcher
            userCity={authSession.city}
            activeCity={activeCityOverride}
            onChange={onCityOverrideChange}
            isCollapsed={isCollapsed}
          />
          {showUpdateBanner && bannerTone && (
            <Tooltip disableHoverableContent={!isCollapsed}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={`w-full rounded-lg border px-4 py-3 transition-all duration-200 text-left flex ${
                    isCollapsed
                      ? 'items-center justify-center gap-2 px-3 py-3'
                      : 'items-start gap-3'
                  } ${bannerTone.bg} ${bannerTone.border} hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--primary))]`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${bannerTone.iconBg} ${
                      isCollapsed ? '' : 'shrink-0'
                    }`}
                  >
                    <BannerIconComponent
                      className={`w-4 h-4 ${bannerTone.text} ${
                        updateBanner?.status === 'downloading' ? 'animate-spin' : ''
                      }`}
                    />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span>{bannerTitle ?? 'Обновление'}</span>
                        {bannerVersionLabel && (
                          <span className="px-2 py-0.5 rounded-full bg-background/60 text-[10px] font-medium uppercase tracking-wide">
                            {bannerVersionLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" align="center" className="max-w-[220px]">
                  <span className="text-sm font-semibold">
                    {bannerTitle ?? 'Обновление'}
                    {bannerVersionLabel ? ` ${bannerVersionLabel}` : ''}
                  </span>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          <Tooltip disableHoverableContent={!isCollapsed}>
            <TooltipTrigger asChild>
              <div className={`${isCollapsed ? 'flex justify-center' : ''}`}>
                <ThemeToggle variant={isCollapsed ? 'compact' : 'full'} className="shadow-soft" />
              </div>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center">
                <span className="text-sm font-medium">Переключить тему</span>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip disableHoverableContent={!isCollapsed}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`
                  relative w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  hover:bg-accent transition-all duration-200 group
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                {showUpdateBanner && (
                  <span
                    className={`absolute top-2 right-3 h-2 w-2 rounded-full ${
                      bannerTone?.dot ?? 'bg-[hsl(var(--primary))]'
                    } ${isCollapsed ? 'right-2 top-2' : ''}`}
                  />
                )}
                <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                {!isCollapsed && <span className="font-medium">Настройки</span>}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" align="center">
                <span className="text-sm font-medium">Настройки</span>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        authSession={authSession}
        onLogout={onLogout}
      />
    </div>
  )
}
