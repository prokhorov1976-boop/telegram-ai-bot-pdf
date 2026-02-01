-- Полная схема базы данных для копирования проекта
-- Выполните этот SQL в новом проекте через миграцию

-- Таблица documents: метаданные загруженных PDF файлов
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    file_key VARCHAR(500) NOT NULL,
    size_bytes BIGINT NOT NULL,
    pages INTEGER,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'processing',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Таблица document_chunks: текстовые фрагменты из PDF с векторными эмбеддингами
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding_text TEXT
);

-- Таблица chat_messages: история диалогов с AI
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации производительности
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx 
ON document_chunks(document_id);

CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx 
ON chat_messages(session_id);

CREATE INDEX IF NOT EXISTS documents_status_idx 
ON documents(status);

-- Комментарии к таблицам
COMMENT ON TABLE documents IS 'Метаданные загруженных PDF документов';
COMMENT ON TABLE document_chunks IS 'Текстовые фрагменты документов с векторными эмбеддингами для семантического поиска';
COMMENT ON TABLE chat_messages IS 'История сообщений чата между пользователем и AI';

COMMENT ON COLUMN document_chunks.embedding_text IS 'JSON массив с векторным представлением текста (1536 измерений от text-embedding-3-small)';
COMMENT ON COLUMN documents.status IS 'Статус обработки: processing, ready, error';
