// ⚠️ ИСПРАВЛЕННЫЙ КОД - БЕЗ ОШИБОК addEventListener
// Используйте этот код в Voximplant Scenario Editor

require(Modules.ASR);

VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
  var call = e.call;
  var tenant_slug = "dinasty-crimea";
  var webhookUrl = "https://functions.poehali.dev/7adc3631-e74d-43dc-88f4-d008c285f8f2";
  var asr = null;
  var isListening = false;
  
  Logger.write("[" + tenant_slug + "] 📞 Входящий звонок от: " + call.callerid());
  
  call.answer();
  
  call.addEventListener(CallEvents.Connected, function() {
    Logger.write("[" + tenant_slug + "] ✅ Звонок подключён");
    
    Net.httpRequestAsync(webhookUrl, {
      method: "POST",
      headers: ["Content-Type: application/json"],
      postData: JSON.stringify({
        event_type: "call_started",
        call_id: call.id(),
        phone_number: call.callerid(),
        tenant_slug: tenant_slug
      })
    }).then(function(response) {
      Logger.write("[" + tenant_slug + "] 📥 Webhook response: " + response.text);
      
      var cloudResponse = JSON.parse(response.text);
      var data = cloudResponse.body ? JSON.parse(cloudResponse.body) : cloudResponse;
      var greeting = data.text || data.response || "Здравствуйте! Чем могу помочь?";
      
      Logger.write("[" + tenant_slug + "] 🔊 Произносим: " + greeting);
      call.say(greeting, Language.RU_RUSSIAN_MALE);
      
    }).catch(function(error) {
      Logger.write("[" + tenant_slug + "] ❌ Ошибка webhook: " + JSON.stringify(error));
      call.say("Извините, сервис временно недоступен.", Language.RU_RUSSIAN_MALE);
      call.hangup();
    });
  });
  
  // ⚠️ КРИТИЧНО: Обработчик PlaybackFinished для ВСЕХ проигрываний
  call.addEventListener(CallEvents.PlaybackFinished, function() {
    Logger.write("[" + tenant_slug + "] 🎵 Проигрывание завершено");
    
    // Начинаем слушать только если ещё не слушаем
    if (!isListening) {
      startListening();
    }
  });
  
  function startListening() {
    if (isListening) {
      Logger.write("[" + tenant_slug + "] ⚠️ ASR уже активен, пропускаем");
      return;
    }
    
    Logger.write("[" + tenant_slug + "] 🎤 Начинаем слушать...");
    isListening = true;
    
    asr = VoxEngine.createASR({
      profile: "en-US",
      lang: "ru-RU"  // ⚠️ ОБЯЗАТЕЛЬНО указать язык!
    });
    
    asr.addEventListener(ASREvents.CaptureStarted, function() {
      Logger.write("[" + tenant_slug + "] ✅ ASR запущен");
    });
    
    asr.addEventListener(ASREvents.Result, function(e) {
      var recognizedText = e.text;
      Logger.write("[" + tenant_slug + "] 👂 Распознано: " + recognizedText);
      
      isListening = false;
      
      if (recognizedText && recognizedText.length > 0) {
        getAIResponse(recognizedText);
      } else {
        call.say("Извините, я вас не расслышал. Повторите, пожалуйста.", Language.RU_RUSSIAN_MALE);
      }
    });
    
    asr.addEventListener(ASREvents.Error, function(e) {
      Logger.write("[" + tenant_slug + "] ❌ ASR ошибка: " + JSON.stringify(e));
      isListening = false;
      call.say("Извините, произошла ошибка распознавания.", Language.RU_RUSSIAN_MALE);
      call.hangup();
    });
    
    call.sendMediaTo(asr);
    asr.start();
  }
  
  function getAIResponse(userText) {
    Logger.write("[" + tenant_slug + "] 🤖 Запрос к AI: " + userText);
    
    Net.httpRequestAsync(webhookUrl, {
      method: "POST",
      headers: ["Content-Type: application/json"],
      postData: JSON.stringify({
        event_type: "speech_recognized",
        call_id: call.id(),
        text: userText,
        tenant_slug: tenant_slug
      })
    }).then(function(response) {
      Logger.write("[" + tenant_slug + "] 📥 AI response: " + response.text);
      
      var cloudResponse = JSON.parse(response.text);
      var data = cloudResponse.body ? JSON.parse(cloudResponse.body) : cloudResponse;
      var aiResponse = data.text || data.response || "Извините, не смог обработать запрос.";
      
      Logger.write("[" + tenant_slug + "] 💬 Отвечаем: " + aiResponse);
      call.say(aiResponse, Language.RU_RUSSIAN_MALE);
      
      // После проигрывания ответа автоматически сработает PlaybackFinished
      
    }).catch(function(error) {
      Logger.write("[" + tenant_slug + "] ❌ AI error: " + JSON.stringify(error));
      call.say("Извините, произошла ошибка. Попробуйте позже.", Language.RU_RUSSIAN_MALE);
      call.hangup();
    });
  }
  
  call.addEventListener(CallEvents.Disconnected, function() {
    Logger.write("[" + tenant_slug + "] 📞 Звонок завершён");
    
    if (asr) {
      asr.stop();
    }
    
    Net.httpRequestAsync(webhookUrl, {
      method: "POST",
      headers: ["Content-Type: application/json"],
      postData: JSON.stringify({
        event_type: "call_ended",
        call_id: call.id(),
        tenant_slug: tenant_slug
      })
    });
  });
});
