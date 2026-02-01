import { useState, useEffect } from 'react';
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

import { OrderFormSection } from './OrderFormSection';
import { FooterSection } from './FooterSection';
import SalesChat from '@/components/SalesChat';
import { APP_CONFIG } from '@/config/app';

const LandingPage = () => {
  const location = useLocation();
  const [selectedTariff, setSelectedTariff] = useState<string>('basic');

  useEffect(() => {
    // Обработка query параметра ?tariff=
    const params = new URLSearchParams(location.search);
    const tariffParam = params.get('tariff');
    
    if (tariffParam) {
      setSelectedTariff(tariffParam);
      // Скролл к форме заказа с задержкой для загрузки DOM
      setTimeout(() => {
        const formElement = document.getElementById('order-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }

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

  const scrollToForm = (tariffId: string) => {
    setSelectedTariff(tariffId);
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <link rel="canonical" href={APP_CONFIG.baseUrl} />
        <meta property="og:url" content={APP_CONFIG.baseUrl} />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <HeroSection onOrderClick={() => scrollToForm('basic')} />
        <FeaturesSection />
        <WeDoEverythingSection />
        <HowItWorksSection />
        <CalculatorSection />
        <CasesSection />
        <TestimonialsSection />
        <VectorTechSection />
        <SecuritySection />
        <PricingSection onPlanSelect={scrollToForm} />
        <FAQSection />
        <OrderFormSection selectedTariff={selectedTariff} />
        <FooterSection />
        <SalesChat />
      </div>
    </>
  );
};

export default LandingPage;