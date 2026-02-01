import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { getCompanyInfo } from '@/lib/company-info';

const TermsOfService = () => {
  const navigate = useNavigate();
  const company = getCompanyInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <Icon name="ArrowLeft" className="mr-2" size={16} />
          Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Пользовательское соглашение</CardTitle>
            <p className="text-sm text-muted-foreground">Дата публикации: 13 января 2026 г.</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Общие положения</h2>
              <p>
                Настоящая оферта (далее — Оферта) является публичным предложением {company.legalForm} {company.name}, ИНН {company.inn} (далее — Исполнитель), 
                заключить договор оказания услуг с любым лицом (далее — Заказчик),
                которое примет условия Оферты путем использования сервиса AI-консультант, 
                размещенного по адресу ai-ru.ru (далее — Сервис).
              </p>
              <p>
                Оплата услуг и начало использования Сервиса означают полное и безоговорочное принятие 
                Заказчиком условий настоящей Оферты (акцепт).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Предмет соглашения</h2>
              <p>
                Исполнитель предоставляет Пользователю доступ к Сервису — программному обеспечению 
                для создания и управления AI-консультантом на базе искусственного интеллекта для любого бизнеса, 
                включающему следующие возможности:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Загрузка и обработка документов в формате PDF для обучения AI</li>
                <li>Настройка поведения и ответов AI-консультанта</li>
                <li>Интеграция с мессенджерами (Telegram, WhatsApp, VK) в зависимости от тарифа</li>
                <li>Web-виджет чата для размещения на сайте</li>
                <li>Статистика обращений и аналитика</li>
                <li>Административная панель для управления контентом</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Регистрация и учетная запись</h2>
              <p>
                Для использования платных функций Сервиса Пользователь обязан пройти регистрацию, 
                предоставив достоверные данные: имя, email, телефон, название организации.
              </p>
              <p>
                Пользователь несет ответственность за сохранность своих учетных данных (логин и пароль) 
                и обязуется не передавать их третьим лицам.
              </p>
              <p>
                При обнаружении несанкционированного доступа к учетной записи Пользователь обязан 
                незамедлительно сообщить об этом Исполнителю.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Тарифы и оплата</h2>
              <p>Сервис предоставляет следующие тарифные планы:</p>
              
              <div className="space-y-4 my-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Старт — 9 975 ₽/месяц</h3>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li>Публичный web-чат</li>
                    <li>До 10 PDF документов</li>
                    <li>Email поддержка</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-500">
                  <h3 className="font-semibold mb-2">Бизнес — 19 990 ₽/месяц</h3>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li>Всё из тарифа Старт</li>
                    <li>Интеграция с Telegram</li>
                    <li>До 25 PDF документов</li>
                    <li>Приоритетная поддержка</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Премиум — 35 990 ₽/месяц</h3>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li>Всё из тарифа Бизнес</li>
                    <li>VK, MAX.ru интеграции</li>
                    <li>До 100 PDF документов</li>
                    <li>Персональный менеджер</li>
                    <li>Кастомизация под бренд</li>
                  </ul>
                </div>
              </div>

              <p>
                Оплата производится онлайн через платежную систему ЮKassa. Подписка активируется 
                автоматически после успешной оплаты и действует 30 дней.
              </p>
              <p>
                Возврат денежных средств возможен в течение 7 дней с момента оплаты при условии, 
                что Сервис не был использован (не загружено ни одного документа).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Права и обязанности Пользователя</h2>
              <p><strong>Пользователь имеет право:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Использовать Сервис в соответствии с выбранным тарифным планом</li>
                <li>Загружать документы и настраивать AI-консультанта</li>
                <li>Получать техническую поддержку</li>
                <li>Изменить или удалить свою учетную запись</li>
              </ul>

              <p className="mt-4"><strong>Пользователь обязуется:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Предоставлять достоверную информацию при регистрации</li>
                <li>Не использовать Сервис для незаконных целей</li>
                <li>Не загружать материалы, нарушающие авторские права третьих лиц</li>
                <li>Не загружать вредоносное ПО, вирусы или другой вредоносный код</li>
                <li>Не пытаться получить несанкционированный доступ к системам Сервиса</li>
                <li>Своевременно оплачивать выбранный тарифный план</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Права и обязанности Исполнителя</h2>
              <p><strong>Исполнитель имеет право:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Изменять условия Соглашения и тарифные планы с уведомлением за 7 дней</li>
                <li>Приостановить или прекратить доступ при нарушении условий Соглашения</li>
                <li>Проводить технические работы с предварительным уведомлением</li>
                <li>Удалять контент, нарушающий законодательство РФ или права третьих лиц</li>
              </ul>

              <p className="mt-4"><strong>Исполнитель обязуется:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Обеспечивать доступность Сервиса не менее 95% времени в месяц</li>
                <li>Защищать персональные данные в соответствии с ФЗ-152</li>
                <li>Предоставлять техническую поддержку в соответствии с тарифом</li>
                <li>Уведомлять о плановых технических работах за 24 часа</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Ответственность сторон</h2>
              <p>
                Исполнитель не несет ответственности за:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Содержание документов и данных, загруженных Пользователем</li>
                <li>Ответы AI-консультанта, сгенерированные на основе загруженных Пользователем данных</li>
                <li>Убытки, возникшие вследствие неправильного использования Сервиса</li>
                <li>Сбои в работе Сервиса, вызванные форс-мажорными обстоятельствами</li>
                <li>Действия третьих лиц, получивших доступ к учетной записи по вине Пользователя</li>
              </ul>

              <p className="mt-3">
                Максимальная ответственность Исполнителя ограничена суммой, уплаченной Пользователем 
                за текущий расчетный период.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Интеллектуальная собственность</h2>
              <p>
                Все права на Сервис, включая исходный код, дизайн, логотипы и товарные знаки, 
                принадлежат Исполнителю и защищены законодательством РФ.
              </p>
              <p>
                Загруженные Пользователем документы остаются его собственностью. Исполнитель использует 
                их исключительно для предоставления услуг в рамках Сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Прекращение действия соглашения</h2>
              <p>
                Соглашение действует до момента его расторжения по инициативе любой из сторон.
              </p>
              <p>
                Пользователь может прекратить использование Сервиса и удалить учетную запись в любое время 
                через административную панель или обратившись в поддержку.
              </p>
              <p>
                Исполнитель может прекратить предоставление услуг в случае нарушения Пользователем 
                условий Соглашения с предварительным уведомлением за 3 дня.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Разрешение споров</h2>
              <p>
                Все споры и разногласия разрешаются путем переговоров. При невозможности достижения 
                соглашения спор передается на рассмотрение в суд по месту нахождения Исполнителя 
                в соответствии с законодательством РФ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Контактная информация</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p><strong>Исполнитель:</strong></p>
                <p>{company.legalForm}</p>
                <p>{company.name}</p>
                <p>ИНН: {company.inn}</p>
                <p>Email: <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">{company.email}</a></p>
                <p>Телефон: <a href={`tel:${company.phone.replace(/\D/g, '')}`} className="text-blue-600 hover:underline">{company.phone}</a></p>
              </div>
            </section>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8 pb-8">
          <a 
            href="https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEez0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 transition-colors underline text-lg font-medium"
          >
            Хочу такой бот!
          </a>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;