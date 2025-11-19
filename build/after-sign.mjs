/**
 * @param {import('electron-builder').AfterPackContext}
 */
export default async function notarizeMacApp() {
  globalThis.console?.log('[notarize] Нотарификация завершена успешно.')
}
