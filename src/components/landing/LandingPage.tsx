import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { WeDoEverythingSection } from './WeDoEverythingSection';
import { HowItWorksSection } from './HowItWorksSection';
import { CalculatorSection } from './CalculatorSection';
import { CasesSection } from './CasesSection';
import { TestimonialsSection } from './TestimonialsSection';
import { SecuritySection } from './SecuritySection';
import { VectorTechSection } from './VectorTechSection';
import { PricingSection } from './PricingSection';
import { FAQSection } from './FAQSection';
import { FooterSection } from './FooterSection';
import SalesChat from '@/components/SalesChat';
import { APP_CONFIG } from '@/config/app';

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    // Обработка hash (#pricing, #faq и т.д.)
    if (location.hash) {
      const elementId = location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  // Регистрация отключена — подключение новых клиентов только через суперадмина.
  // Кнопки "Выбрать тариф" ведут к блоку контактов в футере.
  const scrollToContact = () => {
    const footer = document.getElementById('contact') || document.querySelector('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <Helmet>
        <link rel="canonical" href={APP_CONFIG.baseUrl} />
        <meta property="og:url" content={APP_CONFIG.baseUrl} />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <HeroSection onOrderClick={scrollToContact} />
        <FeaturesSection />
        <WeDoEverythingSection />
        <HowItWorksSection />
        <CalculatorSection />
        <CasesSection />
        <TestimonialsSection />
        <VectorTechSection />
        <SecuritySection />
        <PricingSection onPlanSelect={scrollToContact} />
        <FAQSection />
        <FooterSection />
        <SalesChat />
      </div>
    </>
  );
};

export default LandingPage;