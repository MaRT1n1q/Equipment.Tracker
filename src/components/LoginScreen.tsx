import { FormEvent, useMemo, useState } from 'react'
import { LoaderCircle, LogIn, ShieldCheck } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { getAuthApiUrl } from '../lib/auth'

type LoginScreenProps = {
  isLoading: boolean
  onLogin: (login: string, password: string) => Promise<void>
}

export function LoginScreen({ isLoading, onLogin }: LoginScreenProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const authApiUrl = useMemo(() => getAuthApiUrl(), [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onLogin(login, password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="surface-card w-full max-w-md space-y-6 p-6 sm:p-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto icon-bubble h-12 w-12">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Вход в Equipment Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Введите логин. Если пользователя нет, он будет создан автоматически.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="login">Логин</Label>
            <Input
              id="login"
              name="login"
              autoComplete="username"
              autoFocus
              disabled={isLoading}
              placeholder="например, vlad"
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
              placeholder="минимум 8 символов"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !login.trim() || password.trim().length < 8}
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

        <p className="text-xs text-muted-foreground text-center break-all">
          Auth API: {authApiUrl}
        </p>
      </div>
    </div>
  )
}
