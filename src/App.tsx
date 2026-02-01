
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./components/landing/LandingPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import SuperAdmin from "./pages/SuperAdmin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ChatWidget from "./pages/ChatWidget";
import TryBot from "./pages/TryBot";
import HotelLanding from "./pages/niches/HotelLanding";
import { CookieConsent } from "./components/CookieConsent";
import { useSEONotify } from "./hooks/use-seo-notify";

const queryClient = new QueryClient();

const AppContent = () => {
  useSEONotify();
  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppContent />
          <CookieConsent />
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/try-bot" element={<TryBot />} />
          <Route path="/niches/hotels" element={<HotelLanding />} />
          <Route path="/admin" element={<Index />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/chat/:tenantSlug" element={<Index />} />
          <Route path="/:tenantSlug/chat" element={<ChatWidget />} />
          <Route path="/:tenantSlug" element={<Index />} />
          <Route path="/:tenantSlug/admin" element={<Index />} />
          <Route path="/:tenantSlug/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/:tenantSlug/terms-of-service" element={<TermsOfService />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;