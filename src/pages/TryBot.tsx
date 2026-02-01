import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Helmet } from 'react-helmet-async';

const TryBot = () => {
  return (
    <>
      <Helmet>
        <title>Попробуйте AI-консультанта | AI-консьержа отеля в Крыму</title>
        <meta name="description" content="Протестируйте AI-консультанта на примере AI-консьержи крымского отеля. Доступен в веб-чате, Telegram и MAX мессенджере." />
        <meta property="og:title" content="Попробуйте AI-консультанта | AI-консьержа отеля в Крыму" />
        <meta property="og:description" content="Протестируйте AI-консультанта на примере AI-консьержи крымского отеля. Доступен в веб-чате, Telegram и MAX мессенджере." />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 p-4 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-xl">
            <Icon name="Bot" size={48} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Попробуйте AI-консультанта
          </h1>
          <p className="text-xl text-slate-600">
            на примере AI-консьержи крымского отеля
          </p>
        </div>

        <div className="space-y-4">
          {/* Web Chat */}
          <a 
            href="/dinasty-crimea/chat" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-100 hover:border-primary hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="MessageCircle" size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                    Веб-чат
                  </h3>
                  <p className="text-slate-600">
                    Попробуйте прямо в браузере без установки
                  </p>
                </div>
                <Icon name="ArrowRight" size={24} className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </a>

          {/* Telegram */}
          <a 
            href="https://t.me/dynastiya_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-100 hover:border-[#0088cc] hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0088cc] to-[#006699] rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.038-1.36 5.353-.168.557-.5.743-.82.762-.696.064-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.248-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.098.155.23.171.324.016.094.037.308.02.475z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-[#0088cc] transition-colors">
                    Telegram
                  </h3>
                  <p className="text-slate-600">
                    @dynastiya_bot
                  </p>
                </div>
                <Icon name="ArrowRight" size={24} className="text-slate-400 group-hover:text-[#0088cc] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </a>

          {/* MAX */}
          <a 
            href="https://max.ru/id9108121649_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-100 hover:border-purple-500 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87-.96-7-5.38-7-9V8.3l7-3.11 7 3.11V11c0 3.62-3.13 8.04-7 9z"/>
                    <path d="M11 11h2v6h-2zm0-4h2v2h-2z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-purple-500 transition-colors">
                    MAX
                  </h3>
                  <p className="text-slate-600">
                    Российский защищённый мессенджер
                  </p>
                </div>
                <Icon name="ArrowRight" size={24} className="text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </a>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-primary transition-colors"
          >
            <Icon name="ArrowLeft" size={20} />
            <span>Вернуться на главную</span>
          </a>
        </div>
      </div>
    </div>
    </>
  );
};

export default TryBot;