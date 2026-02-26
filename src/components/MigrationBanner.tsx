/**
 * MigrationBanner — баннер для переноса данных из локальной SQLite-базы
 * (старые версии настольного приложения) на сервер.
 *
 * Показывается только в Electron-приложении после авторизации,
 * если обнаружена локальная база данных и миграция ещё не выполнена.
 */

import { useState, useEffect, useCallback } from 'react'
import { Database, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { toast } from 'sonner'
import type { MigrationStatus, MigrationCounts } from '../types/ipc'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:9090'

interface MigrationBannerProps {
  accessToken: string
}

type BannerState = 'checking' | 'idle' | 'running' | 'done' | 'skipped' | 'error'

export function MigrationBanner({ accessToken }: MigrationBannerProps) {
  const [bannerState, setBannerState] = useState<BannerState>('checking')
  const [counts, setCounts] = useState<MigrationCounts | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [importedSummary, setImportedSummary] = useState<string | null>(null)

  // Проверяем статус миграции при монтировании
  useEffect(() => {
    if (!window.electronAPI?.getMigrationStatus) {
      setBannerState('skipped')
      return
    }

    window.electronAPI
      .getMigrationStatus()
      .then((status: MigrationStatus) => {
        if (!status.needed || status.done) {
          setBannerState('skipped')
          return
        }
        setCounts(status.counts ?? null)
        setBannerState('idle')
      })
      .catch(() => {
        setBannerState('skipped')
      })
  }, [])

  const handleRun = useCallback(async () => {
    if (!window.electronAPI?.runMigration) return
    setBannerState('running')
    setErrorMsg(null)

    try {
      const result = await window.electronAPI.runMigration(API_BASE, accessToken)
      if (!result.success) {
        setErrorMsg(result.error ?? 'Неизвестная ошибка')
        setBannerState('error')
        return
      }

      const imp = result.imported
      if (imp) {
        const parts: string[] = []
        if (imp.requests > 0) parts.push(`${imp.requests} заявок`)
        if (imp.employee_exits > 0) parts.push(`${imp.employee_exits} увольнений`)
        if (imp.templates > 0) parts.push(`${imp.templates} шаблонов`)
        if (imp.instructions > 0) parts.push(`${imp.instructions} инструкций`)
        setImportedSummary(parts.length > 0 ? parts.join(', ') : 'данные перенесены')
      }

      setBannerState('done')
      toast.success('Данные успешно перенесены на сервер')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setErrorMsg(msg)
      setBannerState('error')
    }
  }, [accessToken])

  const handleSkip = useCallback(async () => {
    if (window.electronAPI?.skipMigration) {
      await window.electronAPI.skipMigration().catch(() => {})
    }
    setBannerState('skipped')
  }, [])

  // Ничего не показываем в скрытых состояниях
  if (bannerState === 'checking' || bannerState === 'skipped') {
    return null
  }

  return (
    <div className="relative mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <div className="mt-0.5 shrink-0">
          {bannerState === 'done' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {bannerState === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
          {bannerState === 'running' && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
          {bannerState === 'idle' && <Database className="w-5 h-5 text-amber-500" />}
        </div>

        {/* Содержимое */}
        <div className="flex-1 min-w-0">
          {bannerState === 'idle' && (
            <>
              <p className="font-semibold text-sm text-foreground">
                Найдены локальные данные для переноса
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Обнаружена база данных старой версии приложения.
                {counts && (
                  <span className="ml-1">
                    Найдено: {counts.requests} заявок, {counts.employee_exits} увольнений,{' '}
                    {counts.templates} шаблонов, {counts.instructions} инструкций.
                  </span>
                )}{' '}
                Данные будут добавлены к уже существующим записям на сервере.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={handleRun} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Перенести данные
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Не переносить
                </Button>
              </div>
            </>
          )}

          {bannerState === 'running' && (
            <>
              <p className="font-semibold text-sm text-foreground">Перенос данных...</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Пожалуйста, не закрывайте приложение.
              </p>
            </>
          )}

          {bannerState === 'done' && (
            <>
              <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                Данные успешно перенесены
              </p>
              {importedSummary && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Импортировано: {importedSummary}
                </p>
              )}
            </>
          )}

          {bannerState === 'error' && (
            <>
              <p className="font-semibold text-sm text-destructive">Ошибка при переносе данных</p>
              {errorMsg && (
                <p className="text-xs text-muted-foreground mt-0.5 break-words">{errorMsg}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={handleRun} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Повторить
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Пропустить
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Кнопка закрытия для done-состояния */}
        {bannerState === 'done' && (
          <button
            type="button"
            onClick={() => setBannerState('skipped')}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
