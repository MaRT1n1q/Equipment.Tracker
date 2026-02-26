import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { getCities } from '../lib/auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface CitySwitcherProps {
  userCity: string
  activeCity: string | null
  onChange: (city: string | null) => void
  isCollapsed?: boolean
}

export function CitySwitcher({ userCity, activeCity, onChange, isCollapsed }: CitySwitcherProps) {
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    getCities().then(setCities)
  }, [])

  if (cities.length === 0) return null

  const displayed = activeCity ?? userCity

  if (isCollapsed) {
    return (
      <div className="flex justify-center px-2 pb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
          <MapPin className="h-4 w-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 pb-2 space-y-1.5">
      <span className="flex items-center gap-1.5 px-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <MapPin className="h-3 w-3" />
        Город
      </span>
      <Select value={displayed} onValueChange={(city) => onChange(city === userCity ? null : city)}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
