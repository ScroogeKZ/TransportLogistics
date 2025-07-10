-- Инициализация базы данных для транспортного реестра
-- Этот файл будет выполнен при первом запуске PostgreSQL контейнера

-- Создание пользователя для приложения
CREATE USER transport_user WITH PASSWORD 'transport_password';

-- Предоставление прав доступа
GRANT ALL PRIVILEGES ON DATABASE transport_registry TO transport_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO transport_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO transport_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO transport_user;

-- Альтернативная настройка для более безопасного доступа
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO transport_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO transport_user;

-- Создание расширений если необходимо
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Индексы для оптимизации (будут созданы после миграций)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transport_requests_status ON transportation_requests(status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transport_requests_created_by ON transportation_requests(created_by_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);

-- Настройка часового пояса
SET timezone = 'Asia/Almaty';

-- Логирование для отладки
\echo 'Database initialization completed successfully'