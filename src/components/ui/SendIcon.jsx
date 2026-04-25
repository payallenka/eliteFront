// Simple send icon (play/arrow style)
export default function SendIcon({ size = 24, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#6c47ff" />
      <polygon points="9,7 17,12 9,17" fill="#fff" />
    </svg>
  );
}
