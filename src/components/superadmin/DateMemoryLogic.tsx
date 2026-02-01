import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DateMemoryLogic = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Память дат в диалоге (Context-Aware Date Tracking)</CardTitle>
        <CardDescription>
          Система автоматического запоминания и использования дат/периодов из истории диалога
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Принцип работы */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            Как работает память дат
          </h3>
          <div className="space-y-4 text-sm text-slate-700">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold mb-2">⚡ Ключевой принцип:</p>
              <p>Система запоминает ПОСЛЕДНЮЮ упомянутую дату из истории диалога и автоматически использует её для всех последующих запросов до тех пор, пока пользователь не назовёт новую дату.</p>
            </div>

            <div className="grid gap-3">
              <div className="flex gap-3">
                <span className="font-bold text-blue-600 shrink-0">1.</span>
                <div>
                  <p className="font-semibold">ЗАПОМИНАНИЕ</p>
                  <p className="text-slate-600">Пользователь указывает дату или период → система сохраняет в памяти диалога</p>
                  <p className="text-xs text-slate-500 mt-1">Примеры: "11 марта", "с 5 по 10 июня", "01.03.2026-31.03.2026"</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-green-600 shrink-0">2.</span>
                <div>
                  <p className="font-semibold">ИСПОЛЬЗОВАНИЕ</p>
                  <p className="text-slate-600">Все последующие вопросы БЕЗ даты автоматически используют сохранённую дату</p>
                  <p className="text-xs text-slate-500 mt-1">Примеры коротких запросов: "комфорт", "а с завтраком?", "есть ли Wi-Fi?"</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="font-bold text-orange-600 shrink-0">3.</span>
                <div>
                  <p className="font-semibold">ОБНОВЛЕНИЕ</p>
                  <p className="text-slate-600">Новая дата ЗАМЕНЯЕТ старую → дальше используется новая</p>
                  <p className="text-xs text-slate-500 mt-1">Пример: "а на 20 апреля?" — теперь все запросы будут для 20 апреля</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Технический flow */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Технический процесс
          </h3>
          <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm">
            <div className="flex gap-2">
              <span className="shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <div className="flex-1">
                <p className="font-semibold">Получение запроса</p>
                <p className="text-slate-600">Функция <code className="bg-white px-1 rounded">backend/chat/index.py</code> получает новое сообщение пользователя</p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <div className="flex-1">
                <p className="font-semibold">Загрузка истории (строки 229-239)</p>
                <p className="text-slate-600">Загружаем последние 10 сообщений из <code className="bg-white px-1 rounded">chat_messages</code> таблицы</p>
                <code className="block bg-white p-2 mt-1 text-xs rounded">
                  SELECT role, content FROM chat_messages<br/>
                  WHERE session_id = ... ORDER BY created_at DESC LIMIT 10
                </code>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <div className="flex-1">
                <p className="font-semibold">Извлечение даты (функция extract_date_from_history)</p>
                <p className="text-slate-600">Анализируем историю регулярными выражениями, ищем упоминания дат</p>
                <div className="bg-white p-2 mt-1 rounded text-xs space-y-1">
                  <p className="font-semibold">Поддерживаемые форматы:</p>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                    <li>"11 марта", "5 января" (число + название месяца)</li>
                    <li>"20.07.2026", "15.02" (даты с точками)</li>
                    <li>"январь 2026", "март" (месяц с/без года)</li>
                    <li>"Период: 01.03.2026-31.03.2026" (периоды из документов)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <div className="flex-1">
                <p className="font-semibold">Обогащение запроса для embedding</p>
                <p className="text-slate-600">Если запрос короткий (≤3 слова) и дата найдена:</p>
                <div className="bg-white p-2 mt-1 rounded text-xs">
                  <code>enriched_query = user_message + " " + context_date</code>
                  <p className="text-slate-600 mt-1">Пример: "комфорт" → "комфорт 11 марта"</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              <div className="flex-1">
                <p className="font-semibold">Поиск релевантных документов</p>
                <p className="text-slate-600">Yandex Embeddings API получает обогащённый запрос и ищет похожие чанки документов с ценами для нужного периода</p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
              <div className="flex-1">
                <p className="font-semibold">Передача AI с полной историей</p>
                <p className="text-slate-600">AI получает:</p>
                <ul className="list-disc list-inside text-xs text-slate-600 bg-white p-2 mt-1 rounded">
                  <li>System prompt с инструкциями про память дат</li>
                  <li>Всю историю диалога (10 последних сообщений)</li>
                  <li>Релевантные документы из RAG</li>
                  <li>Текущий запрос пользователя</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="shrink-0 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
              <div className="flex-1">
                <p className="font-semibold">Генерация ответа</p>
                <p className="text-slate-600">AI видит контекст дат из истории и использует правильные цены из нужного периода</p>
              </div>
            </div>
          </div>
        </div>

        {/* Пример диалога */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Пример работы в диалоге
          </h3>
          <div className="space-y-2 text-sm">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="font-semibold text-blue-800">👤 Пользователь:</p>
              <p className="text-slate-700">"сколько стоит номер на 11 марта?"</p>
              <p className="text-xs text-blue-600 mt-2">✓ Система запоминает: "11 марта"</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
              <p className="font-semibold text-green-800">🤖 AI:</p>
              <p className="text-slate-700">"Вот цены на 11 марта: Комфорт без питания 4500₽, с завтраком 6100₽, полный пансион 8800₽"</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="font-semibold text-blue-800">👤 Пользователь:</p>
              <p className="text-slate-700">"комфорт"</p>
              <p className="text-xs text-purple-600 mt-2">⚡ Система обогащает запрос: "комфорт 11 марта"</p>
              <p className="text-xs text-green-600">✓ Использует дату из памяти</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
              <p className="font-semibold text-green-800">🤖 AI:</p>
              <p className="text-slate-700">"Комфорт на 11 марта: без питания 4500₽, завтрак 6100₽, полный пансион 8800₽. Какой вариант питания вам удобнее?"</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="font-semibold text-blue-800">👤 Пользователь:</p>
              <p className="text-slate-700">"а на 20 апреля?"</p>
              <p className="text-xs text-orange-600 mt-2">🔄 Система обновляет дату: "11 марта" → "20 апреля"</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
              <p className="font-semibold text-green-800">🤖 AI:</p>
              <p className="text-slate-700">"Вот цены на 20 апреля: Комфорт без питания 5000₽, с завтраком 6500₽..."</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="font-semibold text-blue-800">👤 Пользователь:</p>
              <p className="text-slate-700">"стандарт"</p>
              <p className="text-xs text-green-600 mt-2">✓ Использует "20 апреля" из памяти</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
              <p className="font-semibold text-green-800">🤖 AI:</p>
              <p className="text-slate-700">"Стандарт на 20 апреля: без питания 4200₽, с завтраком 5800₽..."</p>
            </div>
          </div>
        </div>

        {/* Технические детали */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            Технические детали реализации
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">База данных</p>
              <ul className="space-y-1 text-slate-700 text-xs">
                <li>• Таблица: <code className="bg-white px-1 rounded">chat_messages</code></li>
                <li>• Поля: session_id, role, content, created_at</li>
                <li>• Хранится последние N сообщений диалога</li>
                <li>• Индекс по session_id для быстрой выборки</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">Код</p>
              <ul className="space-y-1 text-slate-700 text-xs">
                <li>• <code className="bg-white px-1 rounded">backend/chat/index.py</code> - основная логика</li>
                <li>• Функция extract_date_from_history() - парсинг дат</li>
                <li>• Обогащение: enriched_query для embeddings</li>
                <li>• История передаётся AI во всех провайдерах</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">System Prompt</p>
              <ul className="space-y-1 text-slate-700 text-xs">
                <li>• Хранится в <code className="bg-white px-1 rounded">default_settings</code> таблице</li>
                <li>• Ключ: default_system_prompt</li>
                <li>• Содержит инструкции про память дат</li>
                <li>• Обновляется через миграции БД</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">RAG (поиск документов)</p>
              <ul className="space-y-1 text-slate-700 text-xs">
                <li>• Yandex Embeddings API для векторизации</li>
                <li>• Cosine similarity для ранжирования</li>
                <li>• Top-K чанков (default=12, fallback=15)</li>
                <li>• Quality gate проверяет релевантность</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Преимущества */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Преимущества системы
          </h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="font-semibold text-green-800 mb-1">🎯 Точность</p>
              <p className="text-slate-700 text-xs">AI видит контекст дат и выдаёт цены именно для нужного периода, избегая путаницы</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="font-semibold text-blue-800 mb-1">⚡ Удобство</p>
              <p className="text-slate-700 text-xs">Пользователь не повторяет даты в каждом сообщении — достаточно указать один раз</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
              <p className="font-semibold text-purple-800 mb-1">🔄 Гибкость</p>
              <p className="text-slate-700 text-xs">Легко переключаться между датами — система автоматически обновляет контекст</p>
            </div>
          </div>
        </div>

        {/* Важные заметки */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="font-semibold text-yellow-800 mb-2">⚠️ Важно знать:</p>
          <ul className="space-y-1 text-sm text-slate-700">
            <li>• Память дат работает в рамках одной сессии (session_id)</li>
            <li>• При новой сессии история очищается</li>
            <li>• Обогащение запроса работает только для коротких фраз (≤3 слова)</li>
            <li>• Система ищет ПОСЛЕДНЮЮ дату в истории (самую свежую)</li>
            <li>• Если дата не найдена в истории — AI попросит указать период</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateMemoryLogic;
