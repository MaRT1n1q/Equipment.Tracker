import { LayoutDashboard, Package, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'
import { SettingsModal } from './SettingsModal'

interface SidebarProps {
  currentView: 'dashboard' | 'requests'
  onViewChange: (view: 'dashboard' | 'requests') => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ currentView, onViewChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const menuItems = [
    {
      id: 'dashboard' as const,
      label: 'Дашборд',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'requests' as const,
      label: 'Заявки',
      icon: Package,
      gradient: 'from-purple-500 to-pink-500'
    }
  ]

  return (
    <div
      className={`fixed left-0 top-0 flex flex-col h-screen bg-card border-r border-border transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Equipment
              </h1>
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
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                relative w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 group overflow-hidden
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'hover:bg-accent text-foreground'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              {/* Gradient background for active state */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-100`} />
              )}
              
              {/* Icon */}
              <item.icon
                className={`
                  w-5 h-5 relative z-10 transition-transform duration-200
                  ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                `}
              />
              
              {/* Label */}
              {!isCollapsed && (
                <span className="relative z-10 font-medium">{item.label}</span>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Settings Button */}
      <div className="p-4 border-t border-border">
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
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
    
  )
}
