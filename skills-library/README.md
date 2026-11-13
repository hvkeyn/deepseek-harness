# CEditNeuro skills library

36 готовых Markdown-скиллов, разложенных по категориям. Это **процедуры**, а не плагины: скилл не добавляет инструмент, право или MCP-сервер. Его можно скопировать в другой агент и адаптировать.

Источник: CEditNeuro 0.99.31 (versionCode 147), снимок 2026-10-26. В каталоге нет значений ключей, паролей и токенов.

## Категории

| Папка | Что внутри | Штук |
|---|---|---:|
| [`01-android`](01-android/) | Android, Compose, APK, debug, UI | 5 |
| [`02-code-review`](02-code-review/) | review, debug, deep-read, diff-tour | 5 |
| [`03-code-understanding`](03-code-understanding/) | understand-anything, REA, reverse-engineering | 3 |
| [`04-security`](04-security/) | security, skill-security | 2 |
| [`05-network`](05-network/) | net-map, network-study, second-monitor | 3 |
| [`06-media`](06-media/) | hyperframes, video-notes, video-download, ascii-studio | 4 |
| [`07-design`](07-design/) | frontend-design | 1 |
| [`08-research`](08-research/) | research, learn, book-notes, genealogy | 4 |
| [`09-personal`](09-personal/) | health, dreams, photo-ocr | 3 |
| [`10-language`](10-language/) | ru-translate | 1 |
| [`11-team`](11-team/) | crew, rrsi | 2 |
| [`12-skills`](12-skills/) | find-skills | 1 |
| [`13-web`](13-web/) | web-reach, web-to-app | 2 |

## Как перенести один скилл

1. Выбери категорию и `.md`-файл.
2. Скопируй его в папку скиллов целевого агента. Имя файла оставь `<name>.md`; имя — lowercase `a-z`, `0-9`, `-`, 2–40 символов, начинается с буквы.
3. Открой `ADAPTING.md`: замени имена инструментов, группы, пути и команды на аналоги целевого проекта.
4. Проверь лимит: **12 000 символов** на файл; триггер — первая строка, начинающаяся с `Use this`.
5. Убедись, что скилл не просит секрет, не устанавливает пакет без явного PC-сценария и не обходит разрешения. Если просит — вырежи шаг.
6. Проверь один сценарий на маленькой задаче и только потом включай скилл в рабочий набор.

## Важное

- `android-*`, `second-monitor`, `rrsi`, `crew`, `video-download`, `web-to-app`, `find-skills` завязаны на CEditoNeuro, Android или конкретный каталог. Их нужно адаптировать или не брать.
- `photo-ocr` отправляет изображение на публичный хост и использует OCR-ключи из проекта. Без явного согласия пользователя не запускать; ключи в скилл не копировать.
- `genealogy`, `health`, `dreams` работают с чувствительными данными. Сохраняй минимизацию и приватность, как написано в самих файлах.
- `rea` — это процедура для ПК с Node/REA 6.8.0, не для телефона. `reverse-engineering` — локальный fallback.
- Адаптация не должна добавлять новую опасную возможность. Скилл описывает, **как** пользоваться уже имеющимися инструментами.

## Служебные файлы

- [`manifest.json`](manifest.json) — 36 записей: имя, категория, файл, триггер, инструменты, группы, зависимости, размер, SHA-256.
- [`INDEX.md`](INDEX.md) — плоская таблица всех 36 скиллов.
- [`ADAPTING.md`](ADAPTING.md) — карта замен инструментов, путей и платформ.
- [`CHECKLIST.md`](CHECKLIST.md) — короткий чек-лист переноса.
- [`ATTRIBUTION.md`](ATTRIBUTION.md) — лицензии и источники адаптированных скиллов.
- [`CATALOG.md`](CATALOG.md) — копия полного каталога CEditoNeuro; в нём есть ссылки на эту систему, используй его только как справку.
