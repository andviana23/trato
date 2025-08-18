'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Google Analytics 4 Configuration
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

// Inicializar Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    // Carregar script do GA
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Configurar gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Rastrear navegação de página
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Rastrear eventos customizados
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Eventos específicos do sistema
export const trackAppointmentCreated = (serviceType: string, value: number) => {
  trackEvent('appointment_created', 'engagement', serviceType, value);
};

export const trackAppointmentCancelled = (serviceType: string) => {
  trackEvent('appointment_cancelled', 'engagement', serviceType);
};

export const trackClientAddedToQueue = (priority: string) => {
  trackEvent('client_added_to_queue', 'engagement', priority);
};

export const trackReportGenerated = (reportType: string) => {
  trackEvent('report_generated', 'engagement', reportType);
};

export const trackReportExported = (reportType: string, format: string) => {
  trackEvent('report_exported', 'engagement', `${reportType}_${format}`);
};

export const trackLogin = (method: string) => {
  trackEvent('login', 'authentication', method);
};

export const trackLogout = () => {
  trackEvent('logout', 'authentication');
};

// Hook para rastrear mudanças de rota
export const usePageTracking = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      const url = pathname + searchParams.toString();
      trackPageView(url);
    }
  }, [pathname, searchParams]);
};

// Componente para inicializar GA
export const GoogleAnalytics = () => {
  useEffect(() => {
    initGA();
  }, []);

  return null;
};

