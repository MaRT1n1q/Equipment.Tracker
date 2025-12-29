/**
 * Changelog — история изменений приложения
 *
 * Формат записи:
 * {
 *   version: '1.0.22',        // Версия (должна совпадать с package.json)
 *   date: '2024-12-29',       // Дата релиза
 *   title: 'Название релиза', // Опционально
 *   sections: [               // Секции изменений
 *     {
 *       type: 'new',          // 'new' | 'improved' | 'fixed' | 'removed'
 *       items: [              // Список изменений
 *         'Описание изменения',
 *       ]
 *     }
 *   ]
 * }
 */

export interface ChangelogSection {
  type: 'new' | 'improved' | 'fixed' | 'removed'
  items: string[]
}

export interface ChangelogEntry {
  version: string
  date: string
  title?: string
  sections: ChangelogSection[]
}

// Добавляйте новые версии В НАЧАЛО массива
export const changelog: ChangelogEntry[] = [
  {
    version: '1.0.23',
    date: '2024-12-29',
    title: 'Файлы в шаблонах',
    sections: [
      {
        type: 'new',
        items: [
          'Добавлена возможность прикреплять файлы к шаблонам',
          'Файлы можно скачивать и открывать прямо из приложения',
          'На карточках шаблонов отображается количество прикреплённых файлов',
        ],
      },
      {
        type: 'improved',
        items: ['Оптимизирована сборка приложения — разбиение на чанки для ускорения загрузки'],
      },
    ],
  },
  // Пример предыдущих версий:
  // {
  //   version: '1.0.21',
  //   date: '2024-12-28',
  //   sections: [
  //     {
  //       type: 'fixed',
  //       items: [
  //         'Исправлена ошибка при сохранении заявки',
  //       ],
  //     },
  //   ],
  // },
]

/**
 * Получить запись changelog для конкретной версии
 */
export function getChangelogForVersion(version: string): ChangelogEntry | undefined {
  return changelog.find((entry) => entry.version === version)
}

/**
 * Получить все записи changelog новее указанной версии
 */
export function getChangelogSinceVersion(lastSeenVersion: string): ChangelogEntry[] {
  const lastSeenIndex = changelog.findIndex((entry) => entry.version === lastSeenVersion)

  // Если версия не найдена, показываем только последнюю
  if (lastSeenIndex === -1) {
    return changelog.slice(0, 1)
  }

  // Если это актуальная версия, ничего не показываем
  if (lastSeenIndex === 0) {
    return []
  }

  // Возвращаем все версии новее последней просмотренной
  return changelog.slice(0, lastSeenIndex)
}

/**
 * Получить последнюю версию из changelog
 */
export function getLatestVersion(): string {
  return changelog[0]?.version || '0.0.0'
}
