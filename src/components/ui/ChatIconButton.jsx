import React from "react";

const ChatIconButton = ({ onClick }) => (
  <button
    className="fixed bottom-6 right-6 z-50 bg-[#1a0841] hover:bg-[#e60023] text-white rounded-full shadow-lg p-4 flex items-center justify-center transition duration-200"
    style={{ boxShadow: "0 4px 16px rgba(26,8,65,0.15)" }}
    onClick={onClick}
    aria-label="Open Chat"
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-message-circle">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7A8.38 8.38 0 0 1 3 16.5c-.3-.5-.5-1-.7-1.5A8.5 8.5 0 0 1 3 7.5a8.38 8.38 0 0 1 .9-3.8A8.5 8.5 0 0 1 11.5 3a8.38 8.38 0 0 1 3.8.9A8.5 8.5 0 0 1 21 11.5z"></path>
      <polyline points="8 11 12 15 16 11"></polyline>
    </svg>
  </button>
);

export default ChatIconButton;
