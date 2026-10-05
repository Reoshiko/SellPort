# SellPort — маркетплейс

## Описание проекта

SellPort — веб-приложение для просмотра и управления товарами, категориями, пользователями и заказами.

Проект состоит из frontend на React, TypeScript и Vite и backend на FastAPI. Backend использует PostgreSQL, Redis и S3-совместимое хранилище для изображений товаров.

## Задача

Для проекта необходимо самостоятельно подготовить Dockerfile для backend и frontend, конфигурацию Nginx и Docker Compose. Nginx должен раздавать frontend, проксировать запросы `/api` на backend и корректно обрабатывать маршруты SPA.

Compose должен запускать необходимые приложению сервисы: frontend, backend, PostgreSQL, Redis и локальное S3-совместимое хранилище. Данные PostgreSQL, Redis и объектного хранилища должны сохраняться после перезапуска контейнеров. Настройки backend передаются через переменные окружения.

Frontend использует `VITE_API_URL` для адреса API. Значение по умолчанию — `/api`; для production оно должно быть задано во время сборки frontend.

## Backend

Backend написан на Python 3.12+ с использованием FastAPI, SQLAlchemy и Alembic. Зависимости находятся в `backend/pyproject.toml`, управление ими выполняется через [uv](https://docs.astral.sh/uv/).

Установите uv по [официальной инструкции](https://docs.astral.sh/uv/getting-started/installation/), затем перейдите в каталог `backend` и установите зависимости проекта:

```bash
cd backend
uv sync
```

Команда `uv sync` создаёт виртуальное окружение и устанавливает зависимости из `pyproject.toml` и `uv.lock`.

После запуска PostgreSQL примените миграции из каталога `backend`:

```bash
uv run alembic upgrade head
```

Запуск backend в режиме разработки:

```bash
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Для тестов API:

```bash
cd backend
uv sync --group dev
uv run pytest -q
```

Тесты не требуют подключения к PostgreSQL, Redis или S3.

## Переменные окружения

Шаблон переменных backend находится в [`backend/.env.example`](backend/.env.example). Для Compose адреса PostgreSQL, Redis и S3 должны указывать на соответствующие сервисы в Docker-сети. Не добавляйте файл `.env` с секретами в Git.

| Переменная | Назначение |
| --- | --- |
| `APP_HOST`, `APP_PORT` | Адрес и порт backend |
| `APP_DEBUG` | Режим отладки |
| `DATABASE_URL` | Подключение к PostgreSQL |
| `REDIS_URL` | Подключение к Redis |
| `S3_ENDPOINT_URL` | Адрес S3 API |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Учётные данные S3 |
| `S3_BUCKET_NAME` | Имя бакета для изображений |
| `S3_REGION` | Регион S3 |
| `JWT_SECRET_KEY`, `JWT_ALGORITHM` | Подпись JWT |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни access-токена |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Время жизни refresh-токена |
| `CORS_ORIGIN` | Разрешённый origin frontend |

При старте backend проверяет Redis и S3. Если заданный бакет отсутствует, backend создаёт его. При недоступности Redis или S3 backend не запускается.

## Локальное S3-хранилище

Для разработки подойдёт MinIO или другое локальное S3-совместимое хранилище. Например, Docker-образ [MinIO](https://hub.docker.com/r/minio/minio/). Укажите адрес S3 API и учётные данные выбранного сервиса в `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID` и `S3_SECRET_ACCESS_KEY`. Для локального запуска S3 API обычно доступен на порту `9000`, веб-консоль — на `9001`; уточните порты в документации выбранного образа.

Бакет задаётся переменной `S3_BUCKET_NAME` и создаётся backend при старте, если его ещё нет.

## Frontend

Frontend использует React, TypeScript, Vite, TanStack Query и Axios. Для production необходимо собрать приложение и отдавать содержимое `dist/` через Nginx. Запросы `/api` должны проксироваться в backend; адрес backend из браузера напрямую не используется.

Backend принимает изображения размером до 5 МБ. По умолчанию Nginx ограничивает размер тела запроса 1 МБ. Без настройки `client_max_body_size` загрузка крупных изображений завершится ответом `413 Request Entity Too Large`. Установите лимит выше максимального размера файла с запасом на multipart-запрос.

## API

Документация FastAPI доступна по `/api/docs`, если Nginx настроен проксировать этот путь.

Основные маршруты:

| Маршрут | Назначение |
| --- | --- |
| `/api/auth/*` | Регистрация, вход и обновление токенов |
| `/api/users/me` | Профиль текущего пользователя |
| `/api/categories` | Получение и управление категориями |
| `/api/products` | Получение и управление товарами |
| `/api/products/{id}/image` | Получение, загрузка и удаление изображения товара |
| `/api/orders` | Получение заказов текущего пользователя |
| `/api/status` | Проверка состояния API |
