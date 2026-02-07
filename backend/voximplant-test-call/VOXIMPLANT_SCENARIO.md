# Настройка сценария Voximplant для тестовых звонков

## Проблема
API успешно запускает сценарий (`result: 1`), но звонок не происходит, потому что в Voximplant нужен VoxEngine сценарий.

## Решение: Создать сценарий в Voximplant

### 1. Войти в Voximplant Console
https://manage.voximplant.com

### 2. Создать новый сценарий (Scenario)
Applications → Ваше приложение → Scenarios → Create Scenario

**Название:** `test_call_scenario`

**Код сценария:**

```javascript
// Сценарий для тестовых исходящих звонков
VoxEngine.addEventListener(AppEvents.Started, function(e) {
  Logger.write("Test call scenario started");
  
  // Получаем custom data
  var customData = VoxEngine.customData();
  Logger.write("Custom data: " + JSON.stringify(customData));
  
  var data;
  try {
    data = JSON.parse(customData);
  } catch(err) {
    Logger.write("Failed to parse custom data: " + err);
    VoxEngine.terminate();
    return;
  }
  
  // Проверяем, что это тестовый звонок
  if (!data.phone || !data.text) {
    Logger.write("Missing phone or text in custom data");
    VoxEngine.terminate();
    return;
  }
  
  Logger.write("Calling: " + data.phone);
  
  // Создаем исходящий звонок на PSTN (телефонную сеть)
  var call = VoxEngine.callPSTN(
    data.phone,
    "ВАШЕ_VOXIMPLANT_ПРАВИЛО_ДЛЯ_ИСХОДЯЩИХ" // Callerid из настроек приложения
  );
  
  // Когда абонент ответил
  call.addEventListener(CallEvents.Connected, function() {
    Logger.write("Call connected");
    
    // Проигрываем текст через TTS
    call.say(data.text, Language.RU_RUSSIAN_FEMALE);
    
    // Завершаем через 5 секунд
    setTimeout(function() {
      call.hangup();
      VoxEngine.terminate();
    }, 5000);
  });
  
  // Обработка ошибок
  call.addEventListener(CallEvents.Failed, function(e) {
    Logger.write("Call failed: " + e.code + " " + e.reason);
    VoxEngine.terminate();
  });
  
  call.addEventListener(CallEvents.Disconnected, function() {
    Logger.write("Call disconnected");
    VoxEngine.terminate();
  });
});
```

### 3. Привязать сценарий к Rule
Applications → Ваше приложение → Routing

Найти Rule ID **8227097** и привязать к нему сценарий `test_call_scenario`.

### 4. Настроить Caller ID
В настройках приложения указать номер для исходящих звонков (callerid).

## Проверка
После настройки тестовый звонок должен работать:
1. Voximplant запускает сценарий
2. Сценарий читает custom_data
3. Совершает звонок через VoxEngine.callPSTN()
4. Проигрывает текст через TTS
5. Завершает звонок

## Альтернатива
Если сценарий уже есть, проверьте, что он правильно обрабатывает `script_custom_data` с полями:
- `phone` - номер для звонка
- `text` - текст приветствия
- `voice` - голос (опционально)
- `is_test_call` - флаг тестового звонка
