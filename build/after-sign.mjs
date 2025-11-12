/* eslint-env node */
import path from 'node:path'
import process from 'node:process'
import { notarize } from '@electron/notarize'

/**
 * @param {import('electron-builder').AfterPackContext} context
 */
export default async function notarizeMacApp(context) {
  const { electronPlatformName, packager, appOutDir } = context

  if (electronPlatformName !== 'darwin') {
    return
  }

  if (process.env.SKIP_NOTARIZE === 'true') {
    globalThis.console?.warn('[notarize] SKIP_NOTARIZE=true — пропускаем нотарификацию.')
    return
  }

  const appleId = process.env.APPLE_ID
  const appleAppSpecificPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID
  const ascProvider = process.env.APPLE_ASC_PROVIDER

  if (!appleId || !appleAppSpecificPassword || !teamId) {
    globalThis.console?.warn(
      '[notarize] Не заданы APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD и/или APPLE_TEAM_ID — пропускаем нотарификацию.'
    )
    globalThis.console?.warn(
      '[notarize] Задайте переменные окружения либо установите SKIP_NOTARIZE=true для локальных сборок.'
    )
    return
  }

  const appBundleId = packager.appInfo.appId
  const appPath = path.join(appOutDir, `${packager.appInfo.productFilename}.app`)

  globalThis.console?.log(`[notarize] Запускаем notarize для ${appPath}`)

  await notarize({
    appBundleId,
    appPath,
    appleId,
    appleAppSpecificPassword,
    teamId,
    ascProvider,
    tool: 'notarytool',
  })

  globalThis.console?.log('[notarize] Нотарификация завершена успешно.')
}
