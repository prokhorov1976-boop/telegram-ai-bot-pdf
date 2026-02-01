import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const SecuritySection = () => {
  return (
    <div id="security" className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-700/50 border border-blue-500 rounded-full">
              <p className="text-sm font-semibold text-blue-100 flex items-center gap-2">
                <Icon name="ShieldCheck" size={16} />
                Полное соответствие требованиям безопасности РФ
              </p>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Защита данных по 152-ФЗ
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Мы подбираем AI-модель с учётом требований 152-ФЗ под вашу нишу. Все данные хранятся в России, защищены шифрованием
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-white/10 backdrop-blur border-blue-400/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Database" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Хранение в РФ
                    </h3>
                    <p className="text-blue-100">
                      Все серверы находятся на территории России (Яндекс.Облако). Персональные данные не покидают пределы страны
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-blue-400/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Lock" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Шифрование данных
                    </h3>
                    <p className="text-blue-100">
                      TLS 1.3 для передачи данных, AES-256 для хранения. Доступ только у авторизованных администраторов
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-blue-400/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="FileCheck" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Соответствие 152-ФЗ
                    </h3>
                    <p className="text-blue-100">
                      Обработка персональных данных ведётся в строгом соответствии с требованиями Федерального закона №152-ФЗ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur border-blue-400/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="UserCheck" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Контроль доступа
                    </h3>
                    <p className="text-blue-100">
                      Многоуровневая система прав доступа. Логирование всех действий. Регулярные аудиты безопасности
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0">
            <CardContent className="py-8 text-center">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex items-center gap-3">
                  <Icon name="ShieldCheck" size={48} className="text-white" />
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">100% безопасно</div>
                    <div className="text-green-100">для вашего бизнеса</div>
                  </div>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/30" />
                <div className="flex items-center gap-3">
                  <Icon name="FileText" size={48} className="text-white" />
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">Документы</div>
                    <div className="text-green-100">политики и согласия</div>
                  </div>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/30" />
                <div className="flex items-center gap-3">
                  <Icon name="Award" size={48} className="text-white" />
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">Сертификация</div>
                    <div className="text-green-100">соответствия стандартам</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};