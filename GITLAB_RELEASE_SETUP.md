# Настройка GitLab CI/CD для релизов Equipment Tracker

`.gitlab-ci.yml` настроен для сценария, когда GitHub Actions выполняет сборку, а GitLab зеркалит тег и создаёт релиз со ссылками на артефакты GitHub.

GitLab runner нужен только Linux-шared (доступен по умолчанию).

## GitHub собирает, GitLab синхронизирует релиз

Оставьте сборку на GitHub Actions: GitLab зеркалит репозиторий и на каждый тег создаёт релиз с прямыми ссылками на GitHub-артефакты.

### 1. Включите зеркалирование репозитория

1. В GitLab откройте **Settings → Repository → Mirroring repositories**.
2. Добавьте зеркалирование из GitHub (тип **Pull**), укажите URL `https://github.com/MaRT1n1q/Equipment.Tracker.git` и токен GitHub (PAT с доступом `repo`).
3. Включите опцию «Mirror only protected branches» при необходимости.

Теперь каждый новый тег из GitHub автоматически появится в GitLab и запустит пайплайн.

### 2. Добавьте переменную `GITHUB_TOKEN`

`.gitlab-ci.yml` читает GitHub release через API и требует токен.

1. Перейдите в **Settings → CI/CD → Variables**.
2. Создайте переменную:
   - **Key**: `GITHUB_TOKEN`
   - **Value**: тот же PAT, что используется для зеркалирования, либо отдельный токен с правами `repo` (достаточно read).
   - **Protect** не обязательно, если теги не защищены.

### 3. Проверьте пайплайн синхронизации

1. Создайте релиз в GitHub (например, `npm version patch && git push && git push --tags`).
2. После зеркалирования убедитесь, что в GitLab на теге `vX.Y.Z` отработал job `sync_release`.
3. В разделе **Deploy → Releases** появится запись с тем же описанием, что и на GitHub, а в секции «Ссылки» будут URL на артефакты GitHub.

Важно: артефакты физически остаются на GitHub; GitLab хранит только ссылки на них.
