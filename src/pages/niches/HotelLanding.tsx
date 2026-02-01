import { Helmet } from 'react-helmet-async';
import { HotelHeroSection } from './components/HotelHeroSection';
import { HotelUseCasesSection } from './components/HotelUseCasesSection';
import { HotelPricingSection } from './components/HotelPricingSection';
import { HotelFooterSection } from './components/HotelFooterSection';

const HotelLanding = () => {
  return (
    <>
      <Helmet>
        <title>AI-консьерж для отеля | Автоматизация работы с гостями 24/7</title>
        <meta name="description" content="AI-консьерж для вашего отеля: отвечает на вопросы гостей 24/7, увеличивает бронирования, разгружает администраторов. Работает в Telegram, VK, MAX и на сайте. Полная настройка под ключ." />
        <meta property="og:title" content="AI-консьерж для отеля | Автоматизация работы с гостями" />
        <meta property="og:description" content="Умный помощник для вашего отеля: круглосуточные ответы гостям, рост конверсии, экономия на персонале. Попробуйте на примере отеля Династия!" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <HotelHeroSection />
        <HotelUseCasesSection />
        <HotelPricingSection />
        <HotelFooterSection />
      </div>
    </>
  );
};

export default HotelLanding;
