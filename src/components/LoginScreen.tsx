import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  LoaderCircle,
  LogIn,
  MapPin,
  Pencil,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { getCities, getSavedCity } from '../lib/auth'

type LoginScreenProps = {
  isLoading: boolean
  onLogin: (login: string, password: string, city: string) => Promise<void>
}

export function LoginScreen({ isLoading, onLogin }: LoginScreenProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [showCitySelect, setShowCitySelect] = useState<boolean>(!getSavedCity())
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [citiesError, setCitiesError] = useState(false)

  const loadCities = useCallback(() => {
    const savedCity = getSavedCity() ?? ''
    setCitiesLoading(true)
    setCitiesError(false)
    getCities()
      .then((list) => {
        if (list.length === 0) {
          setCitiesError(true)
          return
        }
        setCities(list)
        setSelectedCity(savedCity && list.includes(savedCity) ? savedCity : (list[0] ?? ''))
      })
      .catch(() => setCitiesError(true))
      .finally(() => setCitiesLoading(false))
  }, [])

  useEffect(() => {
    loadCities()
  }, [loadCities])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onLogin(login, password, selectedCity)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="surface-card w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto icon-bubble h-12 w-12">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Вход в Equipment Tracker</h1>
          <p className="text-sm text-muted-foreground">Введите логин и пароль</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Город
            </Label>

            {citiesLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Загрузка городов…
              </div>
            ) : citiesError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    Не удалось загрузить список городов
                  </span>
                  <button
                    type="button"
                    onClick={loadCities}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Повторить
                  </button>
                </div>
              </div>
            ) : showCitySelect ? (
              <Select
                value={selectedCity}
                onValueChange={(v) => {
                  setSelectedCity(v)
                  setShowCitySelect(false)
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{selectedCity}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCitySelect(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Изменить
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login">Логин</Label>
            <Input
              id="login"
              name="login"
              autoComplete="username"
              autoFocus
              disabled={isLoading}
              placeholder="i.ivanov"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              placeholder="Пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              citiesLoading ||
              citiesError ||
              !login.trim() ||
              password.trim().length < 8 ||
              !selectedCity
            }
          >
            {isLoading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Входим...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Войти
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
