import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const FlowDiagram = () => {
  return (
    <Card className="border-2 border-indigo-200 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Icon name="GitBranch" size={24} />
          Визуальная схема: путь клиента
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8 pb-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          {/* Этап 1 */}
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 text-white px-8 py-4 rounded-xl shadow-lg text-center min-w-[280px] hover:scale-105 transition-transform">
              <Icon name="Globe" size={32} className="mx-auto mb-2" />
              <p className="font-bold text-lg">Заход на landing</p>
              <p className="text-sm opacity-90">Знакомство с платформой</p>
            </div>
            <div className="flex flex-col items-center my-2">
              <Icon name="ArrowDown" size={24} className="text-blue-500 animate-bounce" />
            </div>
          </div>

          {/* Этап 2 */}
          <div className="flex flex-col items-center">
            <div className="bg-green-500 text-white px-8 py-4 rounded-xl shadow-lg text-center min-w-[280px] hover:scale-105 transition-transform">
              <Icon name="CreditCard" size={32} className="mx-auto mb-2" />
              <p className="font-bold text-lg">Выбор тарифа</p>
              <p className="text-sm opacity-90">Оплата через ЮKassa</p>
            </div>
            <div className="flex flex-col items-center my-2">
              <Icon name="ArrowDown" size={24} className="text-green-500 animate-bounce" />
            </div>
          </div>

          {/* Этап 3 */}
          <div className="flex flex-col items-center">
            <div className="bg-yellow-500 text-white px-8 py-4 rounded-xl shadow-lg text-center min-w-[280px] hover:scale-105 transition-transform">
              <Icon name="Webhook" size={32} className="mx-auto mb-2" />
              <p className="font-bold text-lg">Создание tenant</p>
              <p className="text-sm opacity-90">Webhook от ЮKassa</p>
            </div>
            <div className="flex flex-col items-center my-2">
              <Icon name="ArrowDown" size={24} className="text-yellow-500 animate-bounce" />
            </div>
          </div>

          {/* Этап 4 */}
          <div className="flex flex-col items-center">
            <div className="bg-purple-500 text-white px-8 py-4 rounded-xl shadow-lg text-center min-w-[280px] hover:scale-105 transition-transform">
              <Icon name="Mail" size={32} className="mx-auto mb-2" />
              <p className="font-bold text-lg">Email с доступами</p>
              <p className="text-sm opacity-90">Логин, пароль, ссылки</p>
            </div>
            <div className="flex flex-col items-center my-2">
              <Icon name="ArrowDown" size={24} className="text-purple-500 animate-bounce" />
            </div>
          </div>

          {/* Этап 5 */}
          <div className="flex flex-col items-center">
            <div className="bg-red-500 text-white px-8 py-4 rounded-xl shadow-lg text-center min-w-[280px] hover:scale-105 transition-transform">
              <Icon name="Lock" size={32} className="mx-auto mb-2" />
              <p className="font-bold text-lg">Вход в админку</p>
              <p className="text-sm opacity-90">Авторизация JWT</p>
            </div>
            <div className="flex flex-col items-center my-2">
              <Icon name="ArrowDown" size={24} className="text-red-500 animate-bounce" />
            </div>
          </div>

          {/* Этап 6 */}
          <div className="flex flex-col items-center">
            <div className="bg-indigo-500 text-white px-8 py-4 rounded-xl shadow-lg text-center min-w-[280px] hover:scale-105 transition-transform">
              <Icon name="Settings" size={32} className="mx-auto mb-2" />
              <p className="font-bold text-lg">Настройка бота</p>
              <p className="text-sm opacity-90">Документы, AI, мессенджеры</p>
            </div>
            <div className="flex flex-col items-center my-2">
              <Icon name="ArrowDown" size={24} className="text-indigo-500 animate-bounce" />
            </div>
          </div>

          {/* Этап 7 */}
          <div className="flex flex-col items-center">
            <div className="bg-green-600 text-white px-8 py-4 rounded-xl shadow-lg text-center min-w-[280px] hover:scale-105 transition-transform border-4 border-green-300">
              <Icon name="Zap" size={32} className="mx-auto mb-2" />
              <p className="font-bold text-lg">Бот работает! 🚀</p>
              <p className="text-sm opacity-90">Ответы клиентам 24/7</p>
            </div>
          </div>

          {/* Каналы снизу */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 w-full">
            <p className="text-center text-slate-600 font-semibold mb-4">Каналы коммуникации:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="bg-white border-2 border-blue-400 px-4 py-2 rounded-lg shadow flex items-center gap-2">
                <Icon name="MessageCircle" size={18} className="text-blue-600" />
                <span className="text-sm font-medium">Web-чат</span>
              </div>
              <div className="bg-white border-2 border-sky-400 px-4 py-2 rounded-lg shadow flex items-center gap-2">
                <Icon name="Send" size={18} className="text-sky-600" />
                <span className="text-sm font-medium">Telegram</span>
              </div>
              <div className="bg-white border-2 border-indigo-400 px-4 py-2 rounded-lg shadow flex items-center gap-2">
                <Icon name="Users" size={18} className="text-indigo-600" />
                <span className="text-sm font-medium">VK</span>
              </div>
              <div className="bg-white border-2 border-purple-400 px-4 py-2 rounded-lg shadow flex items-center gap-2">
                <Icon name="Mail" size={18} className="text-purple-600" />
                <span className="text-sm font-medium">MAX</span>
              </div>
              <div className="bg-white border-2 border-pink-400 px-4 py-2 rounded-lg shadow flex items-center gap-2">
                <Icon name="Code" size={18} className="text-pink-600" />
                <span className="text-sm font-medium">Виджет</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlowDiagram;
