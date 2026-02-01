import ChatArea from './ChatArea';
import SidebarInfo from './SidebarInfo';
import { Message, QuickQuestion, PageSettings } from './types';

interface GuestViewProps {
  messages: Message[];
  inputMessage: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onQuickQuestion: (question: string) => void;
  pageSettings?: PageSettings;
  quickQuestions?: QuickQuestion[];
  consentEnabled?: boolean;
  consentText?: string;
}

const GuestView = ({
  messages,
  inputMessage,
  isLoading,
  onInputChange,
  onSendMessage,
  onQuickQuestion,
  pageSettings,
  quickQuestions = [],
  consentEnabled = false,
  consentText = ''
}: GuestViewProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ChatArea
          messages={messages}
          inputMessage={inputMessage}
          isLoading={isLoading}
          onInputChange={onInputChange}
          onSendMessage={onSendMessage}
          pageSettings={pageSettings}
          consentEnabled={consentEnabled}
          consentText={consentText}
        />
      </div>

      <SidebarInfo
        quickQuestions={quickQuestions}
        pageSettings={pageSettings}
        isLoading={isLoading}
        onQuickQuestion={onQuickQuestion}
      />
    </div>
  );
};

export default GuestView;
