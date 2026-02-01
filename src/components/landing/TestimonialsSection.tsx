import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Алексей Морозов',
      position: 'Владелец отеля "Морской Берег"',
      company: 'Отель на 40 номеров',
      avatar: '👨‍💼',
      rating: 5,
      text: 'Раньше администраторы работали в три смены, чтобы отвечать на звонки круглосуточно. Теперь AI-консультант обрабатывает 80% вопросов: цены, доступные номера, услуги. Бронирований стало на 52% больше, а затраты на персонал снизились вдвое. Окупилось за первый месяц!',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Мария Соколова',
      position: 'Директор стоматологической клиники',
      company: 'Клиника "Белоснежка"',
      avatar: '👩‍⚕️',
      rating: 5,
      text: 'Администраторы больше не захлёбываются в звонках! AI-бот отвечает на вопросы о ценах, услугах, противопоказаниях. Записей стало на 67% больше, потому что клиенты получают ответы мгновенно — даже ночью. Освободилось 8 часов в день на действительно важные задачи.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Дмитрий Кузнецов',
      position: 'Владелец интернет-магазина',
      company: 'Магазин электроники "ТехноМир"',
      avatar: '👨‍💻',
      rating: 5,
      text: 'Клиенты уходили к конкурентам, потому что мы не успевали отвечать на вопросы о характеристиках товаров. AI-консультант знает все спецификации наизусть и отвечает за 3 секунды. Конверсия выросла на 43%, сэкономили 180 000₽/мес на зарплате операторов. Лучшее вложение в бизнес!',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Елена Петрова',
      position: 'Маркетолог',
      company: 'Образовательный центр "Знание"',
      avatar: '👩‍🎓',
      rating: 5,
      text: 'Нам нужно было отвечать на сотни однотипных вопросов о курсах, расписании, ценах. AI-консультант разгрузил менеджеров на 70%, теперь они занимаются продажами, а не рутиной. Заявок стало больше, а качество обработки выше. Запустили за один день — просто супер!',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      name: 'Сергей Иванов',
      position: 'Руководитель отдела продаж',
      company: 'B2B компания "ПромТех"',
      avatar: '👨‍💼',
      rating: 5,
      text: 'Сначала сомневался, что AI сможет работать с нашими сложными техническими товарами. Но загрузили все спецификации, прайсы — и бот стал лучшим консультантом! Отвечает точно, по делу, клиенты довольны. Менеджеры теперь получают "тёплых" лидов, а не холодные запросы. Продажи выросли на 34%.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      name: 'Анна Волкова',
      position: 'Основатель сервиса',
      company: 'Онлайн-школа йоги',
      avatar: '👩‍🏫',
      rating: 5,
      text: 'У нас небольшая команда, и мы физически не могли отвечать всем желающим 24/7. AI-консультант решил эту проблему полностью. Он рассказывает о программах, стоимости, расписании — и даже помогает выбрать подходящий курс. Записей больше, клиенты счастливы, я довольна. За такую цену — просто подарок!',
      gradient: 'from-teal-500 to-green-500'
    }
  ];

  return (
    <div id="testimonials" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
            <p className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
              <Icon name="Star" size={16} />
              Реальные отзывы от реальных клиентов
            </p>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Что говорят наши клиенты
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Более 247 компаний уже используют AI-консультанта и получают результаты
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-xl transition-all hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-3xl flex-shrink-0`}>
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-slate-600">{testimonial.position}</p>
                    <p className="text-xs text-slate-500">{testimonial.company}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Icon key={i} name="Star" size={16} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  "{testimonial.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 max-w-4xl mx-auto">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-slate-900 mb-2">247</div>
                  <div className="text-slate-600">довольных клиентов</div>
                </div>
                <div className="hidden md:block w-px h-16 bg-slate-300" />
                <div className="text-center">
                  <div className="text-5xl font-bold text-slate-900 mb-2">4.9</div>
                  <div className="text-slate-600 flex items-center gap-1">
                    средняя оценка
                    <Icon name="Star" size={18} className="text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <div className="hidden md:block w-px h-16 bg-slate-300" />
                <div className="text-center">
                  <div className="text-5xl font-bold text-slate-900 mb-2">98%</div>
                  <div className="text-slate-600">рекомендуют друзьям</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};