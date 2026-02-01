import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { getCompanyInfo } from '@/lib/company-info';
import { getTenantId } from '@/lib/auth';
import { BACKEND_URLS } from '@/components/hotel/types';
import { PublicContentResponse } from './types/index.types';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const company = getCompanyInfo();
  const [customText, setCustomText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<number | null>(null);

  useEffect(() => {
    loadTenantInfo();
  }, [tenantSlug]);

  useEffect(() => {
    if (tenantId) {
      loadPrivacyPolicy();
    }
  }, [tenantId]);

  const loadTenantInfo = async () => {
    if (!tenantSlug) {
      setTenantId(getTenantId());
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URLS.getTenantBySlug}?slug=${tenantSlug}`);
      if (response.ok) {
        const data = await response.json();
        setTenantId(data.tenant_id);
      } else {
        setTenantId(getTenantId());
      }
    } catch (error) {
      console.error('Error loading tenant info:', error);
      setTenantId(getTenantId());
    }
  };

  const loadPrivacyPolicy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URLS.manageConsentSettings}?action=public_content&tenant_id=${tenantId}`);
      if (response.ok) {
        const data: PublicContentResponse = await response.json();
        if (data.consent_settings?.privacy_policy_text) {
          setCustomText(data.consent_settings.privacy_policy_text);
        }
      }
    } catch (error) {
      console.error('Error loading privacy policy:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-3xl">Политика конфиденциальности</CardTitle>
            <p className="text-sm text-muted-foreground">Дата последнего обновления: 13 января 2026 г.</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Icon name="Loader2" className="animate-spin" size={32} />
              </div>
            ) : customText ? (
              <div dangerouslySetInnerHTML={{ __html: customText }} />
            ) : (
            <>
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Общие положения</h2>
              <p>
                Настоящая Политика конфиденциальности персональных данных (далее — Политика) действует в отношении 
                всей информации, которую сервис AI-консультант (далее — Сервис) может получить о 
                Пользователе во время использования сайта ai-ru.ru и его сервисов.
              </p>
              <p>
                Использование Сервиса означает безоговорочное согласие Пользователя с настоящей Политикой 
                и указанными в ней условиями обработки его персональной информации.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Персональные данные пользователей</h2>
              <p>
                Под персональными данными в настоящей Политике понимается:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Персональная информация, которую Пользователь предоставляет о себе самостоятельно при регистрации или в процессе использования Сервиса: имя, фамилия, email, номер телефона, название организации.</li>
                <li>Данные, которые автоматически передаются Сервису в процессе использования: IP-адрес, информация из cookies, информация о браузере и устройстве.</li>
                <li>Загружаемые документы и файлы в формате PDF для обучения AI-консультанта.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Цели обработки персональных данных</h2>
              <p>Сервис обрабатывает персональные данные Пользователя в следующих целях:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Идентификация Пользователя и предоставление доступа к Сервису</li>
                <li>Предоставление платных услуг и обработка платежей</li>
                <li>Связь с Пользователем для технической поддержки</li>
                <li>Отправка уведомлений об услугах, обновлениях и важных изменениях</li>
                <li>Улучшение качества Сервиса, удобства использования</li>
                <li>Проведение статистических и маркетинговых исследований</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Правовые основания обработки персональных данных</h2>
              <p>Обработка персональных данных осуществляется на основании:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»</li>
                <li>Согласия Пользователя на обработку персональных данных</li>
                <li>Договора оказания услуг между Пользователем и Сервисом</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Способы и сроки обработки персональной информации</h2>
              <p>
                Обработка персональных данных Пользователя осуществляется без ограничения срока любым законным способом, 
                в том числе в информационных системах персональных данных с использованием средств автоматизации 
                или без использования таких средств.
              </p>
              <p>
                Персональные данные Пользователя хранятся в течение срока действия договора оказания услуг, 
                а также в течение 5 лет после его расторжения в соответствии с требованиями законодательства РФ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Передача персональных данных третьим лицам</h2>
              <p>
                Сервис не продает, не обменивает и не передает персональные данные Пользователя третьим лицам, 
                за исключением следующих случаев:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Пользователь явно выразил свое согласие на такие действия</li>
                <li>Передача необходима для использования функционала Сервиса (например, платежные системы ЮKassa)</li>
                <li>Передача предусмотрена законодательством РФ в рамках установленной процедуры</li>
                <li>Для обеспечения защиты прав и законных интересов Сервиса или третьих лиц</li>
              </ul>
              <p className="mt-3">
                <strong>Партнеры, которые могут получать доступ к данным:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>ЮKassa (ООО «НКО ЮМани») — для обработки платежей</li>
                <li>Yandex Cloud — для хостинга и хранения данных</li>
                <li>Mail.ru — для отправки email-уведомлений</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Защита персональных данных</h2>
              <p>
                Сервис принимает необходимые и достаточные организационные и технические меры для защиты 
                персональной информации Пользователя от неправомерного или случайного доступа, уничтожения, 
                изменения, блокирования, копирования, распространения:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Использование SSL-шифрования для передачи данных</li>
                <li>Хранение паролей в зашифрованном виде (SHA-256)</li>
                <li>Регулярное резервное копирование данных</li>
                <li>Ограничение доступа сотрудников к персональным данным</li>
                <li>Использование защищенной облачной инфраструктуры Yandex Cloud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Права субъекта персональных данных</h2>
              <p>Пользователь имеет право:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Получать информацию о том, какие персональные данные о нем обрабатываются</li>
                <li>Требовать уточнения, обновления или удаления своих персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обжаловать действия или бездействие Оператора в Роскомнадзор или суд</li>
                <li>Требовать блокирования или удаления персональных данных</li>
              </ul>
              <p className="mt-3">
                Для реализации своих прав обращайтесь по email: <a href="mailto:info@298100.ru" className="text-blue-600 hover:underline">info@298100.ru</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Изменение Политики конфиденциальности</h2>
              <p>
                Сервис оставляет за собой право вносить изменения в настоящую Политику конфиденциальности. 
                При внесении изменений в актуальной редакции указывается дата последнего обновления. 
                Новая редакция Политики вступает в силу с момента ее размещения.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Контактная информация</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p><strong>Оператор персональных данных:</strong></p>
                <p>{company.legalForm}</p>
                <p>{company.name}</p>
                <p>ИНН: {company.inn}</p>
                <p>Email: <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">{company.email}</a></p>
                <p>Телефон: <a href={`tel:${company.phone.replace(/\D/g, '')}`} className="text-blue-600 hover:underline">{company.phone}</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Cookies и технологии отслеживания</h2>
              <p>
                Сервис использует файлы cookies для следующих целей:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Необходимые cookies</strong> — для сохранения сеанса авторизации и работы базовых функций сайта</li>
                <li><strong>Функциональные cookies</strong> — для запоминания ваших настроек и предпочтений</li>
              </ul>
              <p className="mt-3">
                <strong>Яндекс.Метрика:</strong>
              </p>
              <p className="mt-2">
                Мы используем Яндекс.Метрику для анализа посещаемости сайта, поведения пользователей и улучшения качества сервиса.
                Яндекс.Метрика собирает следующие данные: IP-адрес, информация о браузере и устройстве, посещенные страницы, время на сайте.
                Подробнее о политике конфиденциальности Яндекс.Метрики: https://yandex.ru/legal/confidential/
              </p>
              <p className="mt-3">
                <strong>Мы НЕ используем:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Рекламные cookies третьих лиц</li>
                <li>Google Analytics и другие зарубежные системы аналитики</li>
                <li>Социальные плагины со сбором данных</li>
              </ul>
              <p className="mt-3">
                Пользователь может настроить свой браузер на отклонение cookies, однако это приведет 
                к невозможности авторизации и ограничению функциональности Сервиса. При первом посещении 
                сайта отображается баннер с запросом согласия на использование cookies.
              </p>
            </section>
            </>
            )}
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

export default PrivacyPolicy;