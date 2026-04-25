// Lightweight Markdown-to-HTML for bold/italic/inline code
// Supports *italic*, **bold**, and `code`
export function simpleMarkdownToHtml(text) {
  if (!text) return '';
  let html = text
    // Escape HTML special chars
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  // Italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  return html;
}
