import React from 'react';
import KaaboWidget from '../components/KaaboWidget';
import VerticalSidebar from '../components/ui/VerticalSidebar';
import MobileBottomNav from '../components/ui/MobileBottomNav';

export default function Housing() {
  return (
    <div className="min-h-screen w-full bg-[#f7f7fa] transition-all duration-300 overflow-hidden" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif' }}>
      {/* Debug border for sidebar visibility */}
      <VerticalSidebar/>
      <div className="ml-0 lg:ml-16 w-auto overflow-hidden transition-all duration-300 px-0 sm:px-4">
        <div className="widget-responsive-container w-full px-0 sm:px-4">
          <KaaboWidget
            partnerId="eli-sch-4d67177214b80ea9b91481ca"
            placeId="ChIJE9on3F3HwoAR9AhGJW_fL-I"
            partnerToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMTg5MmQyYS0wMjc1LTRmMmUtYTkxYi0xYzgwMTIyZWI1NTQiLCJyb2xlIjoicGFydG5lciIsInNlY3JldEtleSI6IklUazhFMHk5Ukp1VnU5VjEzQXktNTdURkxVb3VndkV6bEhTbkFna1lwc0kiLCJpYXQiOjE3NjY0MTI1MzcsImV4cCI6MTkyNDIwMDUzN30.eXTZimkaSEZNCsq8dSWXDH0PvyTKJD2jX3TxtjxEAoA"
            verified={true}
            widgetUrl="https://d2fbpagy9rootz.cloudfront.net/1.0.0.js"
          />
        </div>
      </div>
      {/* <MobileBottomNav /> */}
    </div>
  );
}
