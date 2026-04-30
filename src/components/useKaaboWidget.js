import { useEffect, useRef } from 'react';

export const useKaaboWidget = (config) => {
  const widgetRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    function restoreScroll() {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.documentElement.style.overflow = '';
    }

    function initializeWidget() {
      if (window._mw && widgetRef.current) {
        window._mw('init', {
          element: `#${widgetRef.current.id}`,
          partnerId: config.partnerId,
          placeId: config.placeId,
          partnerToken: config.partnerToken,
          verified: config.verified ?? true,
        });
      }
    }

    // Watch for the widget locking body/html overflow on mobile and restore it immediately
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === 'hidden' || document.body.style.position === 'fixed') {
        restoreScroll();
      }
      if (document.documentElement.style.overflow === 'hidden') {
        document.documentElement.style.overflow = '';
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    if (!scriptLoadedRef.current) {
      const script = document.createElement('script');
      script.id = 'kaabo-widget-script';
      script.async = true;
      script.src = config.widgetUrl || 'https://kaabo-widget-url-placeholder.cloudfront.net/1.0.0.js';
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializeWidget();
        restoreScroll();
      };
      script.onerror = () => {
        console.error('Failed to load Kaabo widget script');
      };
      document.body.appendChild(script);
    } else {
      initializeWidget();
      restoreScroll();
    }

    // Cleanup on unmount — disconnect observer, remove script, restore body styles
    return () => {
      observer.disconnect();
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
      const existingScript = document.getElementById('kaabo-widget-script');
      if (existingScript) existingScript.remove();
      scriptLoadedRef.current = false;
      restoreScroll();
    };
  }, [config]);

  return widgetRef;
};