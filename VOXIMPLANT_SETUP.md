# 📞 Инструкция по настройке Voximplant

## Шаг 1: Регистрация и создание аккаунта

1. Перейдите на https://voximplant.com
2. Нажмите **Sign Up** (Регистрация)
3. Заполните данные:
   - Email
   - Пароль
   - Название компании
4. Подтвердите email
5. Войдите в личный кабинет: https://manage.voximplant.com

---

## Шаг 2: Получение Account ID и API ключа

### Account ID:
1. В личном кабинете откройте: **Settings** → **Account**
2. Скопируйте **Account ID** (число, например: `7654321`)
3. Вставьте его в форму секретов вашего проекта как `VOXIMPLANT_ACCOUNT_ID`

### API Key:
1. Откройте: **Settings** → **API keys**
2. Нажмите **Create new key**
3. Укажите название (например: "AI Bot Integration")
4. Скопируйте сгенерированный ключ (будет показан один раз!)
5. Вставьте его в форму секретов как `VOXIMPLANT_API_KEY`

---

## Шаг 3: Создание Application

1. В меню слева выберите **Applications**
2. Нажмите **Create new application**
3. Заполните:
   - **Name**: `AI Voice Bot` (любое название)
   - **Type**: Voice
4. После создания скопируйте **Application ID** (формат UUID)
5. Вставьте его в форму секретов как `VOXIMPLANT_APPLICATION_ID`

---

## Шаг 4: Покупка номера телефона

1. Откройте **Numbers** → **Buy number**
2. Выберите страну (например, Россия)
3. Выберите номер из списка доступных
4. Нажмите **Buy** и оплатите
5. После покупки номер появится в разделе **Numbers**

---

## Шаг 5: Привязка номера к Application

1. Откройте **Numbers** → **Your numbers**
2. Найдите купленный номер
3. Нажмите на иконку **⚙️ Settings** (настройки)
4. В поле **Application** выберите созданное приложение (`AI Voice Bot`)
5. Нажмите **Save**

---

## Шаг 6: Создание Scenario с ASR (распознавание речи)

1. Откройте **Scenarios**
2. Нажмите **Create new scenario**
3. Название: `AI Bot Handler`
4. Вставьте следующий код:

```javascript
require(Modules.ASR);

VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
  var call = e.call;
  var tenant_slug = "dinasty-crimea";
  var webhookUrl = "https://functions.poehali.dev/7adc3631-e74d-43dc-88f4-d008c285f8f2";
  var recognitionUrl = "https://functions.poehali.dev/b5237645-271f-432f-b034-a63f038f5bb1";
  var asr = null;
  
  Logger.write("[" + tenant_slug + "] Call alerting from: " + call.callerid());
  
  call.answer();
  
  call.addEventListener(CallEvents.Connected, function() {
    Logger.write("[" + tenant_slug + "] Call connected from: " + call.callerid());
    
    Net.httpRequestAsync(webhookUrl, {
      method: "POST",
      headers: ["Content-Type: application/json"],
      postData: JSON.stringify({
        event_type: "call_started",
        call_id: call.id(),
        phone_number: call.callerid(),
        custom_data: { tenant_slug: tenant_slug }
      })
    }).then(function(response) {
      var data = JSON.parse(response.text);
      var greeting = data.response || "Здравствуйте! Я AI-консьерж. Чем могу помочь?";
      
      Logger.write("[" + tenant_slug + "] Greeting: " + greeting);
      
      call.say(greeting, Language.RU_RUSSIAN_FEMALE);
      
      call.addEventListener(CallEvents.PlaybackFinished, function() {
        startListening();
      });
      
    }).catch(function(error) {
      Logger.write("[" + tenant_slug + "] Webhook error: " + JSON.stringify(error));
      call.say("Извините, сервис временно недоступен.", Language.RU_RUSSIAN_FEMALE);
      call.hangup();
    });
  });
  
  function startListening() {
    Logger.write("[" + tenant_slug + "] Starting ASR...");
    
    asr = VoxEngine.createASR({
      profile: "en-US",
      lang: "ru-RU"
    });
    
    asr.addEventListener(ASREvents.CaptureStarted, function() {
      Logger.write("[" + tenant_slug + "] ASR capture started");
    });
    
    asr.addEventListener(ASREvents.Result, function(e) {
      var recognizedText = e.text;
      Logger.write("[" + tenant_slug + "] Recognized: " + recognizedText);
      
      if (recognizedText && recognizedText.length > 0) {
        getAIResponse(recognizedText);
      } else {
        call.say("Извините, я вас не расслышал. Повторите, пожалуйста.", Language.RU_RUSSIAN_FEMALE);
        call.addEventListener(CallEvents.PlaybackFinished, function() {
          startListening();
        });
      }
    });
    
    asr.addEventListener(ASREvents.Error, function(e) {
      Logger.write("[" + tenant_slug + "] ASR error: " + JSON.stringify(e));
      call.say("Извините, произошла ошибка распознавания.", Language.RU_RUSSIAN_FEMALE);
      call.hangup();
    });
    
    call.sendMediaTo(asr);
    asr.start();
  }
  
  function getAIResponse(userText) {
    Logger.write("[" + tenant_slug + "] Getting AI response for: " + userText);
    
    Net.httpRequestAsync(webhookUrl, {
      method: "POST",
      headers: ["Content-Type: application/json"],
      postData: JSON.stringify({
        event_type: "speech_recognized",
        call_id: call.id(),
        text: userText,
        custom_data: { tenant_slug: tenant_slug }
      })
    }).then(function(response) {
      var data = JSON.parse(response.text);
      var aiResponse = data.response || "Извините, не смог обработать запрос.";
      
      Logger.write("[" + tenant_slug + "] AI response: " + aiResponse);
      
      call.say(aiResponse, Language.RU_RUSSIAN_FEMALE);
      
      call.addEventListener(CallEvents.PlaybackFinished, function() {
        startListening();
      });
      
    }).catch(function(error) {
      Logger.write("[" + tenant_slug + "] AI error: " + JSON.stringify(error));
      call.say("Извините, произошла ошибка. Попробуйте позже.", Language.RU_RUSSIAN_FEMALE);
      call.hangup();
    });
  }
  
  call.addEventListener(CallEvents.Disconnected, function() {
    Logger.write("[" + tenant_slug + "] Call disconnected");
    
    if (asr) {
      asr.stop();
    }
    
    Net.httpRequestAsync(webhookUrl, {
      method: "POST",
      headers: ["Content-Type: application/json"],
      postData: JSON.stringify({
        event_type: "call_ended",
        call_id: call.id(),
        custom_data: { tenant_slug: tenant_slug }
      })
    });
  });
});
```

5. Можно изменить `tenant_slug` на другой, если используете для другого отеля
6. Нажмите **Save**

---

## Шаг 7: Привязка Scenario к Application

1. Откройте **Applications** → ваше приложение (`AI Voice Bot`)
2. Найдите секцию **Rules**
3. Нажмите **Create new rule**
4. Заполните:
   - **Rule name**: `Incoming Calls`
   - **Pattern**: `.*` (все входящие звонки)
   - **Scenario**: выберите `AI Bot Handler`
5. Нажмите **Save**

---

## Шаг 8: Настройка в админке проекта

1. Откройте админ-панель вашего бота
2. Перейдите на вкладку **Мессенджеры**
3. Найдите карточку **Голосовые звонки (Voximplant)**
4. Включите переключатель
5. Заполните поля:
   - **Номер телефона**: номер из Voximplant (например: `+74951234567`)
   - **Приветствие**: текст, который произнесёт бот (например: "Здравствуйте! Это AI-консьерж отеля. Чем могу помочь?")
   - **Rule ID** (опционально): оставьте пустым или укажите ID правила из Voximplant
6. Нажмите **Сохранить настройки**

---

## Шаг 9: Тестирование

1. Позвоните на номер, который вы купили в Voximplant
2. Вы должны услышать приветственное сообщение
3. Скажите что-нибудь (например: "Сколько стоит номер?")
4. Бот должен распознать речь и ответить голосом

---

## ❗ Важные моменты

### Тарифы:
- **Voximplant номер**: ~$1-5/месяц
- **Входящие звонки Voximplant**: ~$0.01-0.05/минута
- **Voximplant ASR**: Бесплатно (встроенный Google STT)
- **Voximplant TTS (call.say)**: Бесплатно
- **Yandex SpeechKit (опционально)**: ~₽1-2/минута
- **Итого примерная стоимость**: ~$0.01-0.05/минута разговора (только Voximplant)

### Отладка:
- Логи звонков: **Calls** → **Call history**
- Логи сценариев: **Scenarios** → выберите сценарий → **Logs**
- Логи приложения: проверьте консоль браузера (F12) в админке проекта

### Требования:
- **Voximplant аккаунт**: Базовый тариф с поддержкой ASR
- **Секреты проекта**: `VOXIMPLANT_ACCOUNT_ID`, `VOXIMPLANT_API_KEY`, `VOXIMPLANT_APPLICATION_ID`
- Webhook URL: `https://functions.poehali.dev/7adc3631-e74d-43dc-88f4-d008c285f8f2`

---

## 🎯 Преимущества ASR подхода

1. **Стоимость**: ASR и TTS бесплатны в Voximplant (только тариф на звонки)
2. **Простота**: Не требуется дополнительных API ключей
3. **Надёжность**: Встроенный Google ASR работает стабильно
4. **Интеграция**: Легко подключается к вашему AI-боту через webhook
5. **Гибкость**: Можно использовать любую AI-модель для ответов

## 🔧 Альтернативный упрощённый сценарий (только приветствие)

Если вы хотите только принимать звонки и проигрывать приветствие:

```javascript
VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
  var call = e.call;
  
  call.addEventListener(CallEvents.Connected, function() {
    call.say("Здравствуйте! Это голосовой помощник. К сожалению, сейчас все операторы заняты.", Language.RU_RUSSIAN_FEMALE);
    
    setTimeout(function() {
      call.hangup();
    }, 5000);
  });
  
  call.answer();
});
```

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте, что все секреты добавлены в проект
2. Убедитесь, что номер привязан к Application
3. Проверьте логи в разделе **Calls** → **Call history** в Voximplant
4. Проверьте slug тенанта в сценарии (должен совпадать с вашим ботом)
5. Обратитесь в техподдержку Voximplant: support@voximplant.com

---

**Готово!** Теперь ваш AI-бот может принимать голосовые звонки и отвечать клиентам! 🎉