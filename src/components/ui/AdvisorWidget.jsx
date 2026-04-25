import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { marked } from "marked";


function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-xs
        ${isUser ? 'bg-brand-600 text-white' : 'bg-gradient-to-br from-violet-600 to-brand-600 text-white'}`}>
        {isUser ? 'U' : '✦'}
      </div>
      <div
        className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-brand-600 text-white rounded-2xl rounded-br-sm shadow-xs'
            : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm shadow-xs'
          }`}
        dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-brand-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">✦</div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function AdvisorWidget({ user, profileData = null, userDetails = null, uploadedDocuments = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Refresh/clear chat history
  const handleRefreshChat = async () => {
    setMessages([
      { role: "assistant", content: "Hi! I can answer questions about universities, programs, eligibility, and admissions using our knowledge base. I cannot access your uploaded documents or personal files.", time: formatTime(new Date()) }
    ]);
    setInput("");
    await supabase
      .from("chat_history")
      .upsert({ id: user.id, user_id: user.id, messages: [
        { role: "assistant", content: "Hi! I can answer questions about universities, programs, eligibility, and admissions using our knowledge base. I cannot access your uploaded documents or personal files.", time: formatTime(new Date()) }
      ] });
  };

  // Helper: detect if a question is file-based (KB)
  function isFileQuestion(text) {
    if (!text) return false;
    const fileMarkers = [
      'file', 'document', 'knowledge base', 'eligibility', 'criteria', 'csv', 'acceptance', 'uploaded', 'data', 'university', 'college', 'requirement', 'score', 'gpa', 'marks', 'grade', 'profile', 'application', 'admission', 'program', 'course', 'major', 'faculty', 'institute', 'school', 'academy', 'polytechnic', 'campus', 'center', 'centre', 'école'
    ];
    const lower = text.toLowerCase();
    return fileMarkers.some(marker => lower.includes(marker));
  }

  // Detect advisor-related queries
  function isAdvisorRequest(text) {
    if (!text) return false;
    const advisorMarkers = [
      'advisor', 'talk to advisor', 'speak to advisor', 'book meeting', 'book session', 'consultation', 'contact advisor', 'human', 'real person', 'real advisor', 'call advisor', 'connect advisor', 'schedule advisor', 'appointment', 'help from advisor', 'meet advisor'
    ];
    const lower = text.toLowerCase();
    return advisorMarkers.some(marker => lower.includes(marker));
  }

  useEffect(() => {
    console.log('[AdvisorWidget] user prop:', user);
    if (!user) return;
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("chat_history")
        .select("messages")
        .eq("id", user.id)
        .maybeSingle();
      if (data && data.messages) {
        setMessages(data.messages);
      } else {
        setMessages([
          { role: "assistant", content: "Hi! How can I help you today?", time: formatTime(new Date()) }
        ]);
      }
    };
    
    const loadUserDocuments = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("documents")
        .eq("user_id", user.id)
        .single();
      if (data && data.documents) {
        setUserDocuments(data.documents);
      }
    };
    
    loadHistory();
    loadUserDocuments();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setInputFocus(false); // Hide input area immediately after pressing send
    // If advisor-related request, show direct booking prompt
    if (isAdvisorRequest(input)) {
      setMessages(prev => [
        ...prev,
        {
          role: "system",
          content: `<div style='background:#f6f6fa;padding:18px 16px;border-radius:12px;border:1.5px solid #6c47ff;max-width:480px;margin:12px auto;text-align:center;'><b>Want to talk to a real advisor?</b><br/>Book a free session with an expert now:<br/><a href='https://meet.brevo.com/support-213/elite-consultation' target='_blank' rel='noopener noreferrer' style='display:inline-block;margin-top:10px;padding:10px 22px;background:#6c47ff;color:#fff;border-radius:8px;font-weight:bold;text-decoration:none;'>Book Free Consultation</a></div>`
        },
      ]);
      return;
    }
    setLoading(true);
    const now = new Date();
    const newUserMessage = {
      role: "user",
      content: input,
      time: formatTime(now)
    };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    // Fetch real AI response from backend
    try {
      const fetchBody = {
        prompt: input,
        userId: user?.id
      };
      console.log('AI Advisor fetch body:', fetchBody);
      const res = await fetch("https://elite-scholars-eight.vercel.app/api/palm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fetchBody),
      });
      console.log('AI Advisor response status:', res.status);
      const data = await res.json();
      console.log('AI Advisor response data:', data);
      const reply = data.reply?.trim() || "Sorry, I couldn't get a response.";
      console.log('AI Advisor reply:', reply);
      const assistantReply = {
        role: "assistant",
        content: reply,
        time: formatTime(new Date())
      };
      setMessages([...newMessages, assistantReply]);
    } catch (error) {
      console.error('AI Advisor error:', error);
      const assistantReply = {
        role: "assistant",
        content: "Sorry, I couldn't get a response from the server.",
        time: formatTime(new Date())
      };
      setMessages([...newMessages, assistantReply]);
    }
    setLoading(false);
    setIsTyping(false);
    // Optionally save to supabase
    await supabase
      .from("chat_history")
      .upsert({ id: user.id, user_id: user.id, messages: newMessages });
    setInputFocus(false); // Hide input area after everything is done
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50">
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-brand-600 flex items-center justify-center text-2xl text-white shadow-card-md mb-4">✦</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">AI Advisor</h3>
            <p className="text-slate-500 text-sm max-w-xs">Ask me anything about universities, programs, eligibility, and admissions.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          msg.role === 'system' ? (
            <div key={idx} className="flex justify-center my-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 max-w-md text-center" dangerouslySetInnerHTML={{ __html: msg.content }} />
            </div>
          ) : (
            <ChatMessage key={idx} msg={msg} />
          )
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto">
        <div className="flex gap-2 whitespace-nowrap">
          {["Eligibility for MS in France?", "Requirements for MBA in USA?", "Scholarships in Germany?", "Visa process for Canada?", "Deadlines for MS in Australia?"].map((s, idx) => (
            <button key={idx} type="button" onClick={() => setInput(s)} disabled={loading || isTyping}
              className="px-3 py-1.5 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100 rounded-full hover:bg-brand-100 transition-colors whitespace-nowrap flex-shrink-0">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className={`px-4 py-3 bg-white border-t border-slate-200 ${isMobile ? 'pb-20' : ''}`}>
        <form onSubmit={sendMessage}>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about universities, programs, eligibility…"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              disabled={loading || isTyping}
            />
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={handleRefreshChat} disabled={loading || isTyping} title="New chat"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                <RotateCcw size={13} />
              </button>
              <button type="submit" disabled={!input.trim() || loading || isTyping}
                className="w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                aria-label="Send Message"
                tabIndex={0}
                  onMouseDown={e => e.preventDefault()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
