require(Modules.ASR);

var currentCall = null;
var currentASR = null;
var tenant_slug = "dinasty-crimea";
var webhookUrl = "https://functions.poehali.dev/7adc3631-e74d-43dc-88f4-d008c285f8f2";
var isListening = false;
var isProcessing = false;

// Глобальный перехват событий для ASR
var originalOnPhoneEvent = this.onPhoneEvent;
this.onPhoneEvent = function(event) {
  if (event && event.name === "ASR.CaptureStarted") {
    Logger.write("[" + tenant_slug + "] ASR capture started");
  }
  
  if (event && event.name === "ASR.Result") {
    var recognizedText = event.text || "";
    var confidence = event.confidence || 0;
    Logger.write("[" + tenant_slug + "] Recognized: " + recognizedText + " (confidence: " + confidence + "%)");
    
    if (recognizedText && recognizedText.length > 0 && confidence > 50 && !isProcessing) {
      isListening = false;
      isProcessing = true;
      
      if (currentASR) {
        currentASR.stop();
        currentASR = null;
      }
      
      getAIResponse(recognizedText);
    }
  }
  
  if (event && event.name === "ASR.SpeechCaptured") {
    Logger.write("[" + tenant_slug + "] Speech captured");
  }
  
  if (originalOnPhoneEvent) {
    return originalOnPhoneEvent.call(this, event);
  }
};

VoxEngine.addEventListener(AppEvents.CallAlerting, function(e) {
  currentCall = e.call;
  
  Logger.write("[" + tenant_slug + "] Incoming call from: " + currentCall.callerid());
  
  currentCall.answer();
  
  currentCall.addEventListener(CallEvents.Connected, function() {
    Logger.write("[" + tenant_slug + "] Call connected");
    
    Net.httpRequestAsync(webhookUrl, {
      method: "POST",
      headers: ["Content-Type: application/json"],
      postData: JSON.stringify({
        event_type: "call_started",
        call_id: currentCall.id(),
        phone_number: currentCall.callerid(),
        tenant_slug: tenant_slug
      })
    }).then(function(response) {
      Logger.write("[" + tenant_slug + "] Webhook response: " + response.text);
      
      var cloudResponse = JSON.parse(response.text);
      var data = cloudResponse.body ? JSON.parse(cloudResponse.body) : cloudResponse;
      var greeting = data.text || data.response || "Hello! How can I help you?";
      
      greeting = removeEmojis(greeting);
      
      Logger.write("[" + tenant_slug + "] Speaking: " + greeting);
      currentCall.say(greeting, Language.RU_RUSSIAN_MALE);
      
    }).catch(function(error) {
      Logger.write("[" + tenant_slug + "] Webhook error: " + JSON.stringify(error));
      currentCall.say("Sorry, service is temporarily unavailable.", Language.RU_RUSSIAN_MALE);
      currentCall.hangup();
    });
  });
  
  currentCall.addEventListener(CallEvents.PlaybackFinished, function() {
    Logger.write("[" + tenant_slug + "] Playback finished");
    
    if (!isListening && !isProcessing) {
      startListening();
    }
  });
  
  currentCall.addEventListener(CallEvents.Disconnected, function() {
    Logger.write("[" + tenant_slug + "] Call ended");
    
    if (currentASR) {
      currentASR.stop();
      currentASR = null;
    }
    
    isListening = false;
    isProcessing = false;
    
    Net.httpRequestAsync(webhookUrl, {
      method: "POST",
      headers: ["Content-Type: application/json"],
      postData: JSON.stringify({
        event_type: "call_ended",
        call_id: currentCall.id(),
        tenant_slug: tenant_slug
      })
    });
  });
});

function startListening() {
  if (isListening || isProcessing) {
    Logger.write("[" + tenant_slug + "] ASR already active or processing, skipping");
    return;
  }
  
  Logger.write("[" + tenant_slug + "] Starting to listen...");
  isListening = true;
  
  currentASR = VoxEngine.createASR({
    profile: "en-US",
    lang: "ru-RU"
  });
  
  currentCall.sendMediaTo(currentASR);
}

function getAIResponse(userText) {
  Logger.write("[" + tenant_slug + "] AI request: " + userText);
  
  Net.httpRequestAsync(webhookUrl, {
    method: "POST",
    headers: ["Content-Type: application/json"],
    postData: JSON.stringify({
      event_type: "speech_recognized",
      call_id: currentCall.id(),
      text: userText,
      tenant_slug: tenant_slug
    })
  }).then(function(response) {
    Logger.write("[" + tenant_slug + "] AI response: " + response.text);
    
    var cloudResponse = JSON.parse(response.text);
    var data = cloudResponse.body ? JSON.parse(cloudResponse.body) : cloudResponse;
    var aiResponse = data.text || data.response || "Sorry, could not process request.";
    var action = data.action || "speak";
    var transferPhone = data.phone_number || "";
    
    aiResponse = removeEmojis(aiResponse);
    
    Logger.write("[" + tenant_slug + "] Action: " + action + ", Answering: " + aiResponse);
    
    currentCall.say(aiResponse, Language.RU_RUSSIAN_MALE);
    
    // ✅ ИСПРАВЛЕНИЕ: используем startForwarding вместо callPSTN
    if (action === "transfer" && transferPhone) {
      Logger.write("[" + tenant_slug + "] TRANSFER REQUEST to: " + transferPhone);
      
      var transferHandler = function() {
        Logger.write("[" + tenant_slug + "] Starting call forwarding to: " + transferPhone);
        
        currentCall.removeEventListener(CallEvents.PlaybackFinished, transferHandler);
        currentCall.removeEventListener(CallEvents.PlaybackFinished, startListening);
        
        // Используем startForwarding вместо callPSTN
        currentCall.startForwarding(transferPhone, {
          "scheme": "pstn"
        });
        
        currentCall.addEventListener(CallEvents.Failed, function(ev) {
          Logger.write("[" + tenant_slug + "] Forwarding failed: " + ev.reason);
          currentCall.say("Извините, не удалось соединить с оператором. Попробуйте позже.", Language.RU_RUSSIAN_MALE);
          
          // После сообщения об ошибке возвращаемся к прослушиванию
          currentCall.addEventListener(CallEvents.PlaybackFinished, function() {
            isProcessing = false;
            startListening();
          });
        });
      };
      
      currentCall.addEventListener(CallEvents.PlaybackFinished, transferHandler);
      
    } else {
      isProcessing = false;
    }
    
  }).catch(function(error) {
    Logger.write("[" + tenant_slug + "] AI error: " + JSON.stringify(error));
    currentCall.say("Sorry, an error occurred. Try again later.", Language.RU_RUSSIAN_MALE);
    isProcessing = false;
    currentCall.hangup();
  });
}

function removeEmojis(text) {
  return text.replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
