import { useEffect, useRef } from 'react';

export const useKaaboWidget = (config) => {
  const widgetRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
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

    if (!scriptLoadedRef.current) {
      const script = document.createElement('script');
      script.id = 'kaabo-widget-script';
      script.async = true;
      script.src = config.widgetUrl || 'https://kaabo-widget-url-placeholder.cloudfront.net/1.0.0.js';
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializeWidget();
      };
      script.onerror = () => {
        console.error('Failed to load Kaabo widget script');
      };
      document.body.appendChild(script);
    } else {
      initializeWidget();
    }

    // Cleanup on unmount — remove script, clear container, restore body styles the widget may have set
    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
      const existingScript = document.getElementById('kaabo-widget-script');
      if (existingScript) existingScript.remove();
      scriptLoadedRef.current = false;
      // Restore body/html overflow in case the widget locked them
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.documentElement.style.overflow = '';
    };
  }, [config]);

  return widgetRef;
};