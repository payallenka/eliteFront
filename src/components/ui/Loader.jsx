import React from "react";
import { MdAutorenew } from "react-icons/md";

export default function Loader({ message = "Loading..." }) {
  return (
    <div
      className="flex flex-row items-center py-8"
      style={{
        fontFamily:
          "Montserrat, Inter, Hedvig Letters Sans, sans-serif",
        fontWeight: 400,
      }}
    >
      <MdAutorenew className="animate-spin text-4xl text-[#6c47ff] mr-2" />
      <span className="text-lg font-semibold text-[#1a0841]" style={{ fontFamily: "Montserrat, Inter, Hedvig Letters Sans, sans-serif" }}>
        {message}
      </span>
    </div>
  );
}
