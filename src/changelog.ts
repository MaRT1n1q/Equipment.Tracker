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
    version: '1.0.27',
    date: '2026-01-26',
    title: 'Дабвлена новая вкладка Инструкции',
    sections: [
      {
        type: 'new',
        items: [
          'Новый раздел «Инструкции» — база знаний с древовидной структурой папок и документов',
          'Drag & Drop — перетаскивание инструкций и папок мышью для изменения структуры',
          'Избранное — возможность отмечать важные инструкции звёздочкой ⭐',
          'Хлебные крошки — навигация по пути к текущей инструкции',
          'Внутренние ссылки — поддержка [[id]] и [[id:название]] для ссылок между инструкциями',
          'Вложения — прикрепление файлов к инструкциям с возможностью открытия',
          'Теги — категоризация инструкций с отображением бейджей',
          'Кнопки «Свернуть всё» и «Развернуть всё» для управления деревом',
          'Форматирование текста — поддержка Markdown (заголовки, списки, ссылки, цитаты и др.)',
        ],
      },
      {
        type: 'improved',
        items: [
          'Изменяемая ширина левой панели с сохранением между сессиями',
          'Подсветка найденного текста в содержимом инструкции при поиске',
          'Состояние дерева (развёрнутые папки, выбранная инструкция) сохраняется между сессиями',
        ],
      },
      {
        type: 'fixed',
        items: ['Исправлен бесконечный цикл в хуке сохранения состояния'],
      },
    ],
  },
  {
    version: '1.0.26',
    date: '2026-01-23',
    title: 'Поиск в шаблонах',
    sections: [
      {
        type: 'new',
        items: [
          'Добавлен глобальный поиск по шаблонам — ищет по названию и содержимому',
          'Горячая клавиша Ctrl+F для быстрого фокуса на поле поиска',
          'Счётчик результатов поиска с отображением найденных шаблонов',
        ],
      },
      {
        type: 'improved',
        items: [
          'При активном поиске перетаскивание карточек отключается для предотвращения случайных изменений порядка',
        ],
      },
    ],
  },
  {
    version: '1.0.25',
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
 * Версия приложения из package.json (инжектится Vite)
 */
declare const __APP_VERSION__: string

/**
 * Получить текущую версию приложения
 */
export function getLatestVersion(): string {
  return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : changelog[0]?.version || '0.0.0'
}
