import React from 'react';
import { useKaaboWidget } from './useKaaboWidget';

const KaaboWidget = ({ partnerId, placeId, partnerToken, verified = true, widgetUrl }) => {
  const widgetRef = useKaaboWidget({
    partnerId,
    placeId,
    partnerToken,
    verified,
    widgetUrl,
  });

  return (
    <div className="kaabo-widget-responsive w-full">
      <div
        ref={widgetRef}
        id="kaabo-widget"
        className="kaabo-widget-container w-full"
        style={{
          minHeight: 400,
          width: '100%',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};

export default KaaboWidget;
