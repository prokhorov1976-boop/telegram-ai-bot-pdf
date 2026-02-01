import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { WidgetSettings } from './WidgetColorSchemes';
import { getIconSvgPath } from './WidgetPreview';
import { useToast } from '@/hooks/use-toast';

interface WidgetCodeGeneratorProps {
  settings: WidgetSettings;
  showCode: boolean;
  onToggleCode: () => void;
  tenantSlug?: string;
  needsUpdate?: boolean;
  onCodeCopied?: () => void;
}

export const generateWidgetCode = (settings: WidgetSettings, tenantSlug?: string): string => {
  console.log('[WidgetCodeGenerator] Generating code with colors:', {
    button_color: settings.button_color,
    button_color_end: settings.button_color_end,
    header_color: settings.header_color,
    header_color_end: settings.header_color_end
  });
  
  let chatUrl = settings.chat_url;
  
  // Если есть tenantSlug, всегда генерируем правильный URL для ai-ru.ru
  if (tenantSlug) {
    chatUrl = `https://ai-ru.ru/chat/${tenantSlug}`;
  } else if (chatUrl) {
    // Если нет tenantSlug, используем сохранённый chat_url
    chatUrl = chatUrl.replace(/\/$/, '');
  }
  
  // Добавляем цветовые параметры к URL
  const urlParams = new URLSearchParams({
    widget: '1',
    header_color: settings.header_color,
    header_color_end: settings.header_color_end
  });
  
  const fullChatUrl = `${chatUrl}?${urlParams.toString()}`;
  
  return `<!-- AI Bot Widget v2.0 - Вставьте этот код перед закрывающим тегом </body> -->
<script>
(function() {
    // Удаляем старый виджет если он есть
    var oldWidget = document.getElementById('ai-bot-widget-container');
    if (oldWidget) oldWidget.remove();
    
    var oldStyle = document.getElementById('ai-bot-widget-style');
    if (oldStyle) oldStyle.remove();
    
    var widget = document.createElement('div');
    widget.id = 'ai-bot-widget-container';
    document.body.appendChild(widget);

    var style = document.createElement('style');
    style.id = 'ai-bot-widget-style';
    style.textContent = \`
        #ai-bot-widget-container { position: fixed; ${settings.button_position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : settings.button_position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : 'bottom: 20px; right: 20px;'} z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #ai-bot-button { width: ${settings.button_size}px; height: ${settings.button_size}px; border-radius: 50%; background: linear-gradient(135deg, ${settings.button_color} 0%, ${settings.button_color_end} 100%) !important; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; }
        #ai-bot-button:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
        #ai-bot-button svg { width: ${settings.button_size * 0.5}px; height: ${settings.button_size * 0.5}px; }
        #ai-bot-iframe-container { position: fixed; ${settings.button_position === 'bottom-right' ? 'bottom: 90px; right: 20px;' : settings.button_position === 'bottom-left' ? 'bottom: 90px; left: 20px;' : 'bottom: 90px; right: 20px;'} width: ${settings.window_width}px; height: ${settings.window_height}px; border-radius: ${settings.border_radius}px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: none; z-index: 999998; background: white; }
        #ai-bot-iframe { width: 100%; height: 100%; border: none; border-radius: ${settings.border_radius}px; }
        
        @media (max-width: 768px) {
            #ai-bot-widget-container { bottom: 10px; right: 10px; left: auto; }
            #ai-bot-button { width: ${Math.max(50, settings.button_size - 10)}px; height: ${Math.max(50, settings.button_size - 10)}px; }
            #ai-bot-button svg { width: ${Math.max(25, settings.button_size * 0.5 - 5)}px; height: ${Math.max(25, settings.button_size * 0.5 - 5)}px; }
            #ai-bot-iframe-container { 
                bottom: 0 !important; 
                left: 0 !important; 
                right: 0 !important; 
                top: 0 !important;
                width: 100vw !important; 
                height: 100vh !important; 
                border-radius: 0 !important;
            }
        }
        
        ${settings.custom_css || ''}
    \`;
    document.head.appendChild(style);

    var button = document.createElement('button');
    button.id = 'ai-bot-button';
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${getIconSvgPath(settings.button_icon)}</svg>';
    widget.appendChild(button);

    var iframeContainer = document.createElement('div');
    iframeContainer.id = 'ai-bot-iframe-container';
    widget.appendChild(iframeContainer);

    var closeButton = document.createElement('button');
    closeButton.id = 'ai-bot-close-button';
    closeButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeButton.style.cssText = 'display: none; position: absolute; top: 10px; right: 10px; width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.5); border: none; cursor: pointer; z-index: 1000000; align-items: center; justify-content: center;';
    iframeContainer.appendChild(closeButton);

    var iframe = document.createElement('iframe');
    iframe.id = 'ai-bot-iframe';
    iframe.src = '${fullChatUrl}';
    iframeContainer.appendChild(iframe);

    var isOpen = false;
    var isMobile = window.innerWidth <= 768;
    
    function updateCloseButton() {
        isMobile = window.innerWidth <= 768;
        closeButton.style.display = (isOpen && isMobile) ? 'flex' : 'none';
    }
    
    button.addEventListener('click', function() {
        isOpen = !isOpen;
        iframeContainer.style.display = isOpen ? 'block' : 'none';
        updateCloseButton();
    });
    
    closeButton.addEventListener('click', function() {
        isOpen = false;
        iframeContainer.style.display = 'none';
        updateCloseButton();
    });

    document.addEventListener('click', function(e) {
        if (isOpen && !isMobile && !widget.contains(e.target)) {
            isOpen = false;
            iframeContainer.style.display = 'none';
            updateCloseButton();
        }
    });
    
    window.addEventListener('resize', updateCloseButton);
})();
</script>`;
};

const WidgetCodeGenerator = ({ settings, showCode, onToggleCode, tenantSlug, needsUpdate = false, onCodeCopied }: WidgetCodeGeneratorProps) => {
  const { toast } = useToast();
  
  const handleCopyCode = () => {
    try {
      const code = generateWidgetCode(settings, tenantSlug);
      
      // Универсальный метод копирования через textarea
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (err) {
        console.error('execCommand error:', err);
      }
      
      document.body.removeChild(textArea);
      
      if (success) {
        toast({
          title: '✓ Скопировано!',
          description: 'Код виджета скопирован в буфер обмена'
        });
        onCodeCopied?.();
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Выделите код вручную',
        description: 'Нажмите Ctrl+C или Cmd+C для копирования',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={onToggleCode}
          variant={needsUpdate ? 'default' : 'outline'}
          className={`flex-1 ${needsUpdate ? 'bg-amber-600 hover:bg-amber-700 animate-pulse' : ''}`}
        >
          <Icon name={showCode ? 'EyeOff' : 'Code'} size={16} className="mr-2" />
          {showCode ? 'Скрыть код' : needsUpdate ? 'Скопировать новый код встройки' : 'Показать код встройки'}
        </Button>
        {showCode && (
          <Button onClick={handleCopyCode} variant="outline">
            <Icon name="Copy" size={16} />
          </Button>
        )}
      </div>
      
      {showCode && (
        <Textarea
          value={generateWidgetCode(settings, tenantSlug)}
          readOnly
          className="font-mono text-xs h-64"
        />
      )}
    </div>
  );
};

export default WidgetCodeGenerator;