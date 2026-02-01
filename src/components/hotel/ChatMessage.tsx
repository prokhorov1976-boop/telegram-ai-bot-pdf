import Icon from '@/components/ui/icon';
import { Message } from './types';

interface ChatMessageProps {
  message: Message;
}

const cleanMessageContent = (content: string): string => {
  // Оставляем только безопасные HTML теги: <b>, <i>, <strong>, <em>, <a>
  // Удаляем tel: и mailto: ссылки, но сохраняем обычные http(s) ссылки
  return content
    .replace(/<a\s+href="tel:[^"]*">([^<]+)<\/a>/gi, '$1')
    .replace(/<a\s+href="mailto:[^"]*">([^<]+)<\/a>/gi, '$1')
    // Сохраняем http(s) ссылки как есть
    .replace(/<a\s+href="(https?:\/\/[^"]+)"[^>]*>([^<]+)<\/a>/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$2</a>')
    // Конвертируем <b> в <strong>, <i> в <em>
    .replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>')
    .replace(/<i>(.*?)<\/i>/gi, '<em>$1</em>')
    // Удаляем остальные неподдерживаемые теги
    .replace(/<(?!\/?(?:strong|em|a)\b)[^>]+>/g, '');
};

const formatMessageContent = (content: string): JSX.Element => {
  const cleanedContent = cleanMessageContent(content);
  
  // Добавляем автоматическое распознавание телефонов (если они не в HTML тегах)
  const phoneRegex = /(\+7\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}|\+7\d{10}|8\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2})/g;
  
  const withPhoneLinks = cleanedContent.replace(phoneRegex, (phone) => {
    // Проверяем, не находится ли телефон уже внутри <a> тега
    if (cleanedContent.indexOf('<a') !== -1) {
      const phoneIndex = cleanedContent.indexOf(phone);
      const lastLinkStart = cleanedContent.lastIndexOf('<a', phoneIndex);
      const lastLinkEnd = cleanedContent.lastIndexOf('</a>', phoneIndex);
      if (lastLinkStart !== -1 && (lastLinkEnd === -1 || lastLinkStart > lastLinkEnd)) {
        return phone; // Уже внутри ссылки
      }
    }
    const cleanPhone = phone.replace(/\D/g, '');
    return `<a href="tel:+${cleanPhone}" class="text-blue-600 hover:text-blue-800 underline">${phone}</a>`;
  });
  
  // Добавляем автоматическое распознавание URL (если они не в HTML тегах)
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const finalContent = withPhoneLinks.replace(urlRegex, (url) => {
    // Проверяем, не находится ли URL уже внутри <a> тега
    if (withPhoneLinks.indexOf('<a') !== -1) {
      const urlIndex = withPhoneLinks.indexOf(url);
      const lastLinkStart = withPhoneLinks.lastIndexOf('<a', urlIndex);
      const lastLinkEnd = withPhoneLinks.lastIndexOf('</a>', urlIndex);
      if (lastLinkStart !== -1 && (lastLinkEnd === -1 || lastLinkStart > lastLinkEnd)) {
        return url; // Уже внутри ссылки
      }
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${url}</a>`;
  });
  
  return <span dangerouslySetInnerHTML={{ __html: finalContent }} />;
};

const ChatMessage = ({ message }: ChatMessageProps) => {
  const formattedContent = formatMessageContent(message.content);
  
  return (
    <div
      className={`flex gap-3 animate-fade-in ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        message.role === 'assistant' ? 'bg-primary' : 'bg-slate-300'
      }`}>
        {message.role === 'assistant' ? (
          <Icon name="ConciergeBell" size={16} className="text-white" />
        ) : (
          <Icon name="User" size={16} className="text-slate-700" />
        )}
      </div>
      <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-3 rounded-2xl max-w-[85%] ${
          message.role === 'assistant'
            ? 'bg-slate-100 text-slate-900'
            : 'bg-primary text-white'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{formattedContent}</p>
        </div>
        <p className="text-xs text-slate-500 mt-1 px-1">{message.timestamp}</p>
      </div>
    </div>
  );
};

export default ChatMessage;