import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Как быстро можно запустить AI-консультанта?',
      answer: 'За 24 часа! Вы оплачиваете — получаете ЛК, загружаете документы и ключи мессенджеров (дадим инструкцию). Мы подбираем AI-модель, настраиваем, подключаем, тестируем. Вы получаете готового бота под ключ.'
    },
    {
      question: 'Нужны ли технические знания?',
      answer: 'Совсем не нужны! Мы делаем ВСЮ техническую работу. От вас только: загрузить PDF в ЛК, написать приветствие, получить ключи мессенджеров по нашей инструкции (это ВАШ бот, подписчики навсегда с вами). Всё остальное — наша забота.'
    },
    {
      question: 'Как бот узнаёт информацию о моём бизнесе?',
      answer: 'Вы загружаете PDF-документы в ЛК. Мы обучаем бота на этой информации, подбирая оптимальную модель под вашу нишу и требования 152-ФЗ. Бот запоминает всё и отвечает только по вашим данным, не придумывает.'
    },
    {
      question: 'Насколько точно бот отвечает на вопросы?',
      answer: 'Точность ответов 97%. Бот отвечает строго по вашим документам, не придумывает информацию. Если в документах нет ответа, бот честно говорит об этом и предлагает связаться с менеджером.'
    },
    {
      question: 'В каких каналах может работать AI-консультант?',
      answer: 'Мы подключим: web-чат, виджет для сайта (все тарифы), Telegram (Бизнес/Премиум), VK и MAX (Премиум). ВАЖНО: Это ВАШ бот на ваших ключах — подписчики никогда не потеряются, всегда останутся с вами. Единая база знаний во всех каналах.'
    },
    {
      question: 'Как защищены данные клиентов?',
      answer: 'Мы полностью соответствуем 152-ФЗ. Все данные хранятся на серверах в России (Яндекс.Облако). Используем шифрование TLS 1.3 для передачи и AES-256 для хранения. Регулярные аудиты безопасности.'
    },
    {
      question: 'Что входит в первый платёж?',
      answer: 'Первый платёж — это полная настройка под ключ. Мы: подберём оптимальную AI-модель, обучим бота на ваших документах, подключим каналы, протестируем. Продление — поддержка работы: хостинг, API, обновления. Добавление новых документов в ЛК — бесплатно.'
    },
    {
      question: 'Можно ли попробовать перед покупкой?',
      answer: 'Да! У нас есть демо-версия бота, где вы можете задать вопросы и посмотреть, как работает AI-консультант. Также мы предоставляем гарантию возврата в течение 14 дней, если вас что-то не устроит.'
    }
  ];

  return (
    <div id="faq" className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Частые вопросы
            </h2>
            <p className="text-xl text-slate-600">
              Отвечаем на всё, что может вас волновать
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  openIndex === index ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      openIndex === index ? 'bg-primary' : 'bg-slate-100'
                    }`}>
                      <Icon
                        name={openIndex === index ? 'ChevronUp' : 'ChevronDown'}
                        size={24}
                        className={openIndex === index ? 'text-white' : 'text-slate-600'}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {faq.question}
                      </h3>
                      {openIndex === index && (
                        <p className="text-slate-600 leading-relaxed animate-fade-in">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-primary to-blue-600 border-0">
              <CardContent className="py-8">
                <Icon name="MessageCircle" size={48} className="mx-auto text-white mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Остались вопросы?
                </h3>
                <p className="text-blue-100 mb-6">
                  Напишите в MAX.ru или чат-боту — ответим мгновенно
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="https://max.ru/spa/ai-ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <Icon name="MessageSquare" size={20} />
                    Открыть MAX.ru
                  </a>
                  <a
                    href="/sales/chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <Icon name="Bot" size={20} />
                    Чат-бот AI-ру
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};