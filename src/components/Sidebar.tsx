import {
  LayoutDashboard,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserMinus,
} from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'
import { SettingsModal } from './SettingsModal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { ThemeToggle } from './ThemeToggle'

interface SidebarProps {
  currentView: 'dashboard' | 'requests' | 'employee-exit'
  onViewChange: (view: 'dashboard' | 'requests' | 'employee-exit') => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
      icon: UserMinus,
    },
  ]

  return (
    <div
      className={`fixed left-0 top-0 flex flex-col h-screen bg-card border-r border-border shadow-soft transition-all duration-300 z-20 ${
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
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  hover:bg-accent transition-all duration-200 group
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
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
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
