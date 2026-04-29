import { useEffect } from 'react';

export default function ExplorePrograms() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://studentpanel.net/widget-search-result/ams-widget-loader.js";
    script.async = true;
    script.setAttribute('conf-id', '16-a2ad2ae250715aee9d4de7da7eb496a6');
    script.setAttribute('agency-id', '42628');
    script.className = 'amsSearchResult';
    const container = document.getElementById('ams-widget-container');
    if (container) {
      container.appendChild(script);
      script.onerror = (e) => {
        console.error('Widget script failed to load:', e);
        container.innerHTML = '<div style="color:red">Widget failed to load. Please check your domain or widget configuration.</div>';
      };
      script.onload = () => {
        console.log('Widget script loaded successfully.');
      };
    } else {
      console.error('Widget container not found.');
    }

    return () => {
      if (container) container.removeChild(script);
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-[#f7f7fa] transition-all duration-300"
      style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif' }}
    >
      <div className="ml-0 lg:ml-16 w-auto transition-all duration-300 px-0 sm:px-4">
        <div className="widget-responsive-container w-full px-0 sm:px-4">
          <div
            id="ams-widget-container"
            className="ams-widget-responsive"
            style={{
              minHeight: 900,
              background: '#f7f7fa',
              width: '100%',
              maxWidth: '100%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
