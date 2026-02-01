import Icon from '@/components/ui/icon';
import { Link } from 'react-router-dom';
import { getCompanyInfo } from '@/lib/company-info';

export const FooterSection = () => {
  const company = getCompanyInfo();
  
  return (
    <div className="bg-slate-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Контакты</h3>
            <div className="space-y-2 text-slate-400">
              <a href={`mailto:${company.email}`} className="block hover:text-white transition-colors">
                <Icon name="Mail" size={16} className="inline mr-2" />
                {company.email}
              </a>
              <a href={`tel:${company.phone.replace(/\D/g, '')}`} className="block hover:text-white transition-colors">
                <Icon name="Phone" size={16} className="inline mr-2" />
                {company.phone}
              </a>
              <p className="flex items-start">
                <Icon name="MapPin" size={16} className="inline mr-2 mt-1 flex-shrink-0" />
                <span>{company.address}</span>
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Документы</h3>
            <div className="space-y-2 text-slate-400">
              <Link to="/privacy-policy" className="block hover:text-white transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/terms-of-service" className="block hover:text-white transition-colors">
                Пользовательское соглашение
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Реквизиты</h3>
            <div className="space-y-2 text-slate-400">
              <p>{company.legalForm}</p>
              <p>{company.name}</p>
              <p>ИНН: {company.inn}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8">
          <div className="mb-6">
            <h3 className="text-center text-lg font-semibold mb-4">Остались вопросы?</h3>
            <p className="text-center text-slate-400 mb-4">Напишите в MAX. Отвечаем в течение 10 минут</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
              <a 
                href="https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEez0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="MessageSquare" size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">MAX</p>
                  <p className="text-xs text-slate-400">max.ru</p>
                </div>
              </a>
              <a 
                href="mailto:info@298100.ru"
                className="flex items-center gap-2 p-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Icon name="Mail" size={20} className="text-green-400" />
                <div>
                  <p className="font-medium text-sm text-white">Email</p>
                  <p className="text-xs text-slate-400">info@298100.ru</p>
                </div>
              </a>
            </div>
          </div>
          <div className="text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} ai-ru.ru Все права защищены.</p>
          </div>
        </div>
      </div>
    </div>
  );
};