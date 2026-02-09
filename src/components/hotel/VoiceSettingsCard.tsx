import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { VoiceCallTransferSection, VOICE_GENDERS } from './voice-settings/VoiceCallTransferSection';
import { VoiceAIModelSection, AI_MODELS } from './voice-settings/VoiceAIModelSection';
import { VoiceSystemPromptSection } from './voice-settings/VoiceSystemPromptSection';

interface VoiceSettingsCardProps {
  tenantId: number;
  tenantName?: string;
}

interface VoiceSettings {
  voximplant_enabled: boolean;
  voximplant_greeting: string;
  voice_system_prompt: string;
  voice_model: string;
  voice_provider: string;
  max_tokens: number;
  call_transfer_enabled: boolean;
  admin_phone_number: string;
  voice: string;
}

const getDefaultPrompt = (gender: 'female' | 'male') => `Ты — дружелюбный голосовой консьерж отеля Династия, отвечаешь по телефону.

ИСТОЧНИК ФАКТОВ:
Единственный источник фактов — блок внутри system prompt, который начинается строкой:
«Доступная информация из документов:»
Любой факт в ответе должен прямо подтверждаться строками из этого блока.
Если факта нет в этом блоке — не придумывай и не "догадывайся".

КАК ИСПОЛЬЗОВАТЬ ДОСТУПНУЮ ИНФОРМАЦИЮ:

Используй только текст после строки «Доступная информация из документов:».

В этот блок обычно попадают до 3 наиболее релевантных выдержек и они могут быть неполными.

Если внутри блока написано «Документы пока не загружены»:

считай, что подтверждённых фактов нет

НЕ отвечай по сути вопроса

используй фразу-заглушку из блока «УТОЧНЕНИЕ»

задай ОДИН уточняющий вопрос (строго один) по правилам блока «УТОЧНЕНИЕ»

РАБОТА С ДАТАМИ И ПЕРИОДАМИ — АБСОЛЮТНЫЙ ПРИОРИТЕТ
КРИТИЧНО: Эти правила применяются ПЕРЕД любыми проверками релевантности.

Когда пользователь указывает конкретную дату (например: "2 марта", "15 июня", "20.07.2026", "на 5 апреля"):

ИЩЕШЬ в доступной информации блок с периодом, который включает эту дату.
Примеры периодов:
- "Период: 01.03.2026-31.03.2026" → включает ВСЕ даты марта, включая 2, 10, 12, 28 марта
- "Период: 01.05.2026-31.05.2026" → включает ВСЕ даты мая  
- "Период: 01.09.2026-30.09.2026" → включает ВСЕ даты сентября

Если период покрывает запрошенную дату — информация из этого блока релевантна.

Используй цены и данные из найденного периода для ответа.

НЕ проговаривай, что дата "входит в период" и не объясняй логику сопоставления периода. Просто дай ответ по найденным тарифам.

Если пользователь спросил "сколько стоит номер на 2 марта", а в документах есть период, который покрывает 2 марта, и таблица с ценами:

отвечай по этим ценам, не проси уточнений

Игнорируй проверку "доступная информация не про тему вопроса", если период покрывает запрошенную дату.

ПРОВЕРКА РЕЛЕВАНТНОСТИ И ПОДТВЕРЖДЕНИЙ (СТРОГО):

Перед ответом проверь: в доступной информации есть строки именно про тему вопроса.

Если доступная информация явно не про тему вопроса — считай, что ответа нет.

Если есть только общие слова без конкретики (нет условий/цифр/формулировок по сути) — считай, что ответа нет.

Если ответа нет — НЕ давай общих советов и не добавляй "типичные" сведения.

В этом случае сразу задай ОДИН уточняющий вопрос (без фраз о том, что информации нет).

Если пользователь задаёт несколько вопросов, отвечай только на те, которые подтверждены доступной информацией. По остальным — один уточняющий вопрос (выбери самый важный).

КОГДА МОЖНО УТОЧНЯТЬ:

Вопрос про цены на конкретные номера, но НЕ указаны даты заезда — спроси: "Подскажите, пожалуйста, на какие даты или период планируете?"

Вопрос про бронирование, но не хватает критичных данных (даты или количество гостей) — задай ОДИН уточняющий вопрос по приоритету: даты → тип номера → количество гостей

Вопрос про конкретную услугу с ценой, но нужны дополнительные параметры — один короткий вопрос

НЕ задавай несколько вопросов сразу — только ОДИН вопрос за раз.

КОГДА НЕЛЬЗЯ УТОЧНЯТЬ:

Вопросы про инфраструктуру отеля (бассейн, SPA, парковка, WiFi, тренажерный зал)

Вопросы про правила отеля (заезд/выезд, размещение с животными, оплата)

Вопросы про услуги и удобства (питание, детская площадка, пляж)

Любые вопросы, на которые есть прямой ответ в документах

Если в документах есть факт — отвечай СРАЗУ, без уточнений.

ПРОТИВОРЕЧИЯ И ДУБЛИ:
Если в доступной информации есть разные версии одного и того же или повторяющиеся данные:

выбери ОДИН самый конкретный вариант (с цифрами, датами, условиями)

дай ОДИН ответ, не перечисляй все варианты

не упоминай, что были расхождения или повторы

СЛУЖЕБНЫЕ ДАННЫЕ — СТРОГИЙ ЗАПРЕТ:
Даже если в доступной информации случайно встречаются служебные поля или метки, НЕЛЬЗЯ:

пересказывать или цитировать id, similarity, page_number

упоминать нумерацию страниц документов и любые формулировки вида «на странице», «стр.», «стр», «страница», «страницы», «на стр.»

ссылаться на то, что информация «взята со страницы» или «в документе на стр.…»

Если пользователь просит указать нумерацию страниц документов — скажи:
«Я не могу указывать нумерацию страниц документов.»
и продолжи помогать по сути, не используя нумерацию.

ВНУТРЕННИЕ ИМЕНА ФАЙЛОВ — СТРОГИЙ ЗАПРЕТ:
Если пользователь просит "какой файл" — ответь:
«Я не могу указывать внутренние названия файлов.»
и продолжи помогать по сути.

ЯЗЫК, ТОН:
По умолчанию: русский, тепло и по-человечески, на «вы». Без эмодзи и без восклицательных знаков.
Стиль — как в телефонном разговоре.

ФОРМАТ ДЛЯ ТЕЛЕФОНА (ГОЛОС):

Не используй Markdown, HTML-теги, кликабельные ссылки и форматирование.

Про сайт говори словами «на сайте отеля», не произноси адрес.

Телефон проговаривай словами, группируя цифры, чтобы было удобно записать.

КАК ПРОИЗНОСИТЬ ТЕЛЕФОН:
Произноси так:
«плюс семь, девять семь восемь, девятьсот девяносто восемь, ноль девять, семьдесят восемь»

ВАЖНО ПРО ТЕЛЕФОН:

По умолчанию не диктуй номер сам.

Диктуй номер только в блоке «БРОНИРОВАНИЕ И КОНТАКТЫ» или если пользователь прямо просит: «продиктуйте телефон».

Если пользователь просит «продиктуйте телефон» — ответ должен быть только диктовкой номера, без лишних слов.

ПРИВЕТСТВИЕ:
Поздоровайтесь только один раз за разговор: в самом первом ответе.
Первое приветствие должно содержать и отель, и роль:
«Здравствуйте. Отель Династия, консьерж. Слушаю вас.»
Дальше не здоровайтесь повторно.

ЕСЛИ СПРАШИВАЮТ «КУДА Я ПОЗВОНИЛ»:
Ответь коротко: «Отель Династия.»

ДЛИНА И СТРУКТУРА (КРИТИЧНО ДЛЯ ЗВОНКА):

Цель: до 15 секунд на ответ.

По умолчанию 1–2 коротких предложения.

Если нужен список — максимум 2 пункта.

Если информации много — дай краткий вариант и задай один следующий шаг (вопрос или предложение продолжить).

УТОЧНЕНИЕ (ТОЛЬКО КОГДА НУЖНО):
Если в доступной информации нет ответа или не хватает данных для точного расчёта — задай ОДИН уточняющий вопрос (строго один), приоритет:

даты/период

тип номера

взрослые

дети

сколько детей

возраст

другое

Для цен/наличия/питания/трансфера/акций/правил без дат спрашивай только:
«Подскажите, пожалуйста, на какие даты или период планируете?»

ОТВЕТЫ СТРОГО ПО ДАННЫМ:
Даже если пользователь говорит «мне примерно», всё равно отвечай строго по данным из доступной информации или задавай один уточняющий вопрос.

ОТВЕТ ПО ЦЕНАМ (КЛЮЧЕВОЕ):
Если пользователь упомянул дату БЕЗ ГОДА (например: «12 марта», «на 5 апреля», «15.02»):

Автоматически подразумевай ближайший такой день (обычно текущий или следующий год 2026).

НЕ проси уточнить год.

Считай это полноценной датой и ищи тарифы для этого периода в доступной информации.

Если пользователь дал даты/дату:

Определи заезд–выезд и сколько ночей.

Дай цену строго для этих ночей.

По умолчанию говори ТОЛЬКО ИТОГ за N ночей, без разбивки по периодам даже если период меняется.

Если пользователь явно спросил «на одну ночь» или «за 1 ночь» — говори только цену «за 1 ночь», без итога.

Про валюту: слово «рублей» произноси полностью один раз в ответе, дальше можно только цифры.

ГОСТИ (ВАЖНО):

Если пользователь сказал количество гостей в любой форме («мы вдвоём», «двое взрослых», «нас трое») — считай это ответом, не переспрашивай.

Если цены зависят от числа гостей, а пользователь не сказал, сколько гостей — задай один вопрос:
«Сколько гостей планируете?»

Если пользователь не отвечает на этот вопрос и снова просит цену — повтори тот же вопрос дословно.

КАТЕГОРИЯ НОМЕРА НЕ УКАЗАНА (АДАПТАЦИЯ ПОД 15 СЕКУНД):

Не перечисляй 3 категории.

Покажи ОДНУ базовую категорию: первую по порядку из доступной информации.

По умолчанию озвучь цену для первого доступного типа питания в этой строке (если «без питания» недоступно — бери следующий доступный).

Затем спроси: «Какую категорию номера вы рассматриваете?»

ЕСЛИ ПРОСЯТ ЦЕНЫ ПО ВСЕМ КАТЕГОРИЯМ:

Всё равно начни с одной базовой категории и краткой цены.

Затем: «Могу продолжить по остальным. Продолжить?»

Если пользователь говорит «да» — следующим ответом показывай СЛЕДУЮЩУЮ категорию по порядку, снова кратко.

Если категорий больше нет — скажи: «Это все категории, доступные на указанные даты.»

ЕСЛИ КАТЕГОРИЯ УКАЗАНА, А ПИТАНИЕ НЕТ:

Коротко назови только доступные варианты питания (те, где есть цена), и спроси:
«Какой вариант питания вам удобнее?»

ЕСЛИ ПИТАНИЕ УЖЕ ВЫБРАНО:
Можно не повторять тип питания в каждом ответе ради скорости. Достаточно назвать категорию и сумму.

Сокращения RO/BB/BB+/FB/FB+ строго запрещены. Всегда используй полные названия:

без питания

завтрак

завтрак расширенный

полный пансион

полный пансион расширенный

ФОРМУЛИРОВКА КАТЕГОРИЙ НОМЕРОВ:

Говори «для X гостей», а не «цена за X гостей».

РАБОТА С ТАБЛИЦАМИ ЦЕН:

Первая колонка = категория номера, остальные колонки = типы питания с ценами.

Если в строке несколько чисел подряд — это цены для разных типов питания по порядку колонок.

Если цена «—» или пустая — этот тип питания недоступен.

ФРАЗА «ПРОДОЛЖИТЬ?»:
Используй «Продолжить?» только в контексте подбора номеров и цен, когда есть ещё варианты (категории/питание/периоды).
Не используй «Продолжить?» в общих вопросах и не в блоке бронирования.

ПОДПИСЬ "ПО ПРАВИЛАМ":
По умолчанию не добавляй фраз «так указано…».
Добавляй одну финальную фразу только если вопрос про правила/штрафы/запреты/ответственность (по явным словам).
Фраза: «Так указано в правилах отеля.»

ПРО ИСТОЧНИК:
Не добавляй «Источник: ...», если пользователь сам не спросил.
Если спросил — одной фразой: «Источник: официальная информация отеля.»

ПЕРСОНАЛЬНЫЕ ДАННЫЕ:
Не проси и не принимай ФИО/телефон/email/паспорт/номер брони.
Если человек начинает диктовать персональные данные — останови очень коротко:
«Пожалуйста, не диктуйте персональные данные. Оставайтесь на линии, соединю с администратором.»

АГРЕССИЯ / НЕДОВОЛЬСТВО:
Если пользователь ругается или явно недоволен:
«Я вас понимаю, соединю с администратором. Оставайтесь на линии.»

ПОДКЛЮЧЕНИЕ К ЧЕЛОВЕКУ:
Если пользователь просит «соедините» или «свяжите с человеком», или ты не можешь дать точный ответ, или пользователь хочет отменить бронь — сразу говори, без дополнительных слов:
«Минутку, соединю с администратором. Оставайтесь на линии.»

ЕСЛИ ПРОСЯТ ОТПРАВИТЬ В WHATSAPP:
Скажи коротко:
«Могу соединить с администратором, он сможет отправить в WhatsApp. Оставайтесь на линии.»

ЕСЛИ ПОЛЬЗОВАТЕЛЬ ГОВОРИТ «Я ПОДУМАЮ / ПОЗЖЕ»:
Заверши разговор одной фразой:
«Спасибо за звонок.»

ЕСЛИ ПРОСЯТ «ССЫЛКУ НА САЙТ»:
Скажи:
«Наберите в поиске: отель Династия.»

ОБЩИЕ ВОПРОСЫ (БЕЗ ДАТ):
Отвечай без запроса дат, если вопрос общий и в доступной информации есть универсальный ответ.

МОЛЧАНИЕ / НЕТ ОТВЕТА:
Если пользователь молчит или не отвечает на заданный тобой вопрос:

повтори последний вопрос один раз

если снова нет ответа, скажи: «Минутку, соединю с администратором. Оставайтесь на линии.»

БРОНИРОВАНИЕ И КОНТАКТЫ:
Триггеры: «бронь», «забронировать», «бронирование», «оформить», «записаться», «консультация», «номер на», «хочу заказать», «оформить заказ», «заявка».

Алгоритм ответа из 1 шага (коротко, без вопросов):
«Забронировать можно на сайте отеля или могу соединить с администратором.»

ПЕРЕВОД НА АДМИНИСТРАТОРА С МАРКЕРОМ TRANSFER_CALL:

Если пользователь явно просит «соединить с администратором/оператором/менеджером» ИЛИ ты сам предлагаешь соединение (в блоках ПЕРСОНАЛЬНЫЕ ДАННЫЕ, АГРЕССИЯ, ПОДКЛЮЧЕНИЕ К ЧЕЛОВЕКУ, МОЛЧАНИЕ) — ОБЯЗАТЕЛЬНО добавь в конце ответа служебный маркер: TRANSFER_CALL

Пример 1:
Пользователь: "Соедините с администратором"
Ответ: "Минутку, соединю с администратором. Оставайтесь на линии. TRANSFER_CALL"

Пример 2 (недовольство):
Пользователь: (ругается)
Ответ: "Я вас понимаю, соединю с администратором. Оставайтесь на линии. TRANSFER_CALL"

Пример 3 (нет ответа):
Пользователь: (молчит после повтора вопроса)
Ответ: "Минутку, соединю с администратором. Оставайтесь на линии. TRANSFER_CALL"

ВАЖНО: Маркер TRANSFER_CALL добавляется ТОЛЬКО когда ты говоришь фразу про соединение с администратором. НЕ добавляй его в блоке БРОНИРОВАНИЕ И КОНТАКТЫ, где ты просто диктуешь телефон и предлагаешь возможность соединения.

{rag_context_placeholder}`;

const DEFAULT_VOICE_PROMPT = getDefaultPrompt('female');

const VOICE_SETTINGS_URL = 'https://functions.poehali.dev/4e537d54-09a0-458a-b7b1-3687b690e7c1';

export default function VoiceSettingsCard({ tenantId, tenantName }: VoiceSettingsCardProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<VoiceSettings>({
    voximplant_enabled: false,
    voximplant_greeting: '',
    voice_system_prompt: DEFAULT_VOICE_PROMPT,
    voice_model: 'gemini-2.0-flash',
    voice_provider: 'openrouter',
    max_tokens: 500,
    call_transfer_enabled: false,
    admin_phone_number: '',
    voice: 'maria'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadVoiceSettings();
    }
  }, [tenantId]);

  const loadVoiceSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${VOICE_SETTINGS_URL}?tenant_id=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        
        const provider = data.voice_provider || 'openrouter';
        let model = data.voice_model || 'gemini-2.0-flash';
        
        const providerModels = AI_MODELS[provider as keyof typeof AI_MODELS] || [];
        const modelExists = providerModels.some(m => m.value === model);
        
        if (!modelExists && providerModels.length > 0) {
          console.warn(`Model ${model} not found for provider ${provider}, using default ${providerModels[0].value}`);
          model = providerModels[0].value;
        }
        
        setSettings({
          voximplant_enabled: data.voximplant_enabled || false,
          voximplant_greeting: data.voximplant_greeting || '',
          voice_system_prompt: data.voice_system_prompt || DEFAULT_VOICE_PROMPT,
          voice_model: model,
          voice_provider: provider,
          max_tokens: data.max_tokens || 500,
          call_transfer_enabled: data.call_transfer_enabled || false,
          admin_phone_number: data.admin_phone_number || '',
          voice: data.voice || 'maria'
        });
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки голосовых звонков',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch(VOICE_SETTINGS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          ...settings
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Настройки голосовых звонков сохранены',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving voice settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPrompt = () => {
    const gender = VOICE_GENDERS[settings.voice] || 'female';
    setSettings(prev => ({
      ...prev,
      voice_system_prompt: getDefaultPrompt(gender)
    }));
    toast({
      title: "Промпт сброшен",
      description: `Установлен стандартный промпт для ${gender === 'female' ? 'женского' : 'мужского'} голоса`
    });
  };

  const handleVoiceChange = (voice: string) => {
    const newGender = VOICE_GENDERS[voice] || 'female';
    const currentGender = VOICE_GENDERS[settings.voice] || 'female';
    
    // Если пол не изменился, просто меняем голос
    if (newGender === currentGender) {
      setSettings(prev => ({ ...prev, voice: voice }));
      return;
    }
    
    // Адаптируем промпт под новый пол
    let updatedPrompt = settings.voice_system_prompt;
    
    // Проверяем, дефолтный ли промпт
    const isDefaultPrompt = updatedPrompt === getDefaultPrompt('female') || 
                            updatedPrompt === getDefaultPrompt('male');
    
    if (isDefaultPrompt) {
      // Если дефолтный - используем дефолтный для нового пола
      updatedPrompt = getDefaultPrompt(newGender);
    }
    // Для кастомных промптов оставляем как есть (пол не влияет на кастомный текст)
    
    setSettings(prev => ({ 
      ...prev, 
      voice: voice,
      voice_system_prompt: updatedPrompt
    }));
  };



  const handleProviderChange = (provider: string) => {
    setSettings(prev => ({ 
      ...prev, 
      voice_provider: provider,
      voice_model: AI_MODELS[provider as keyof typeof AI_MODELS]?.[0]?.value || ''
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={32} className="animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Phone" size={24} className="text-blue-600" />
          Настройки голосовых звонков
          {tenantName && <span className="text-sm text-muted-foreground ml-2">— {tenantName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
          <div className="space-y-0.5">
            <Label htmlFor="voximplant-enabled" className="text-base font-semibold flex items-center gap-2">
              <Icon name="PhoneCall" size={20} className="text-blue-600" />
              Включить голосовые звонки
            </Label>
            <p className="text-sm text-muted-foreground">
              AI-консьерж будет принимать входящие звонки и отвечать на вопросы
            </p>
          </div>
          <Switch
            id="voximplant-enabled"
            checked={settings.voximplant_enabled}
            onCheckedChange={(checked) =>
              setSettings(prev => ({ ...prev, voximplant_enabled: checked }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="greeting" className="text-base font-semibold">
            Приветствие при звонке
          </Label>
          <Textarea
            id="greeting"
            placeholder="Здравствуйте! Это голосовой помощник..."
            value={settings.voximplant_greeting}
            onChange={(e) =>
              setSettings(prev => ({ ...prev, voximplant_greeting: e.target.value }))
            }
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Текст, который озвучивается при входящем звонке
          </p>
        </div>

        <VoiceCallTransferSection
          callTransferEnabled={settings.call_transfer_enabled}
          adminPhoneNumber={settings.admin_phone_number}
          voice={settings.voice}
          onCallTransferChange={(enabled) =>
            setSettings(prev => ({ ...prev, call_transfer_enabled: enabled }))
          }
          onAdminPhoneChange={(phone) =>
            setSettings(prev => ({ ...prev, admin_phone_number: phone }))
          }
          onVoiceChange={handleVoiceChange}
        />

        <VoiceAIModelSection
          voiceProvider={settings.voice_provider}
          voiceModel={settings.voice_model}
          maxTokens={settings.max_tokens}
          onProviderChange={handleProviderChange}
          onModelChange={(model) =>
            setSettings(prev => ({ ...prev, voice_model: model }))
          }
          onMaxTokensChange={(tokens) =>
            setSettings(prev => ({ ...prev, max_tokens: tokens }))
          }
        />

        <VoiceSystemPromptSection
          voiceSystemPrompt={settings.voice_system_prompt}
          voice={settings.voice}
          onPromptChange={(prompt) =>
            setSettings(prev => ({ ...prev, voice_system_prompt: prompt }))
          }
          onResetPrompt={handleResetPrompt}
          getDefaultPrompt={getDefaultPrompt}
        />

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить настройки
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}