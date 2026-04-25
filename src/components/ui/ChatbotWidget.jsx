import { useState, useRef, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import SendIcon from "./SendIcon";
import { supabase } from "../../supabaseClient";

export default function ChatbotWidget({ user, forceOpen }) {
  // Draggable state for mobile (smooth)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragAnimFrame = useRef(null);
  const nextDragPos = useRef(dragPos);

  // Only enable drag on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  // Handlers for drag (smooth)
  const handleDragStart = (e) => {
    setDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = {
      x: clientX - dragPos.x,
      y: clientY - dragPos.y,
    };
  };
  const updateDragPosition = (newX, newY) => {
    nextDragPos.current = { x: newX, y: newY };
    if (!dragAnimFrame.current) {
      dragAnimFrame.current = requestAnimationFrame(() => {
        setDragPos(nextDragPos.current);
        dragAnimFrame.current = null;
      });
    }
  };
  const handleDrag = (e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    let newX = clientX - dragOffset.current.x;
    let newY = clientY - dragOffset.current.y;
    // Prevent dragging out of viewport (mobile)
    newX = Math.max(0, Math.min(newX, window.innerWidth - 64));
    newY = Math.max(0, Math.min(newY, window.innerHeight - 180));
    updateDragPosition(newX, newY);
  };
  const handleDragEnd = () => {
    setDragging(false);
    if (dragAnimFrame.current) {
      cancelAnimationFrame(dragAnimFrame.current);
      dragAnimFrame.current = null;
    }
  };
    // Refresh/clear chat history
    const handleRefreshChat = async () => {
      const initialMsg = [{ role: "assistant", content: "Hi! How can I help you today?" }];
      setMessages(initialMsg);
      setInput("");
      setShowHandoverMsg(false);
      setHandover(false);
      setKbAnswers(0);
      setLimitReached(false);
      if (kbLimitKey) localStorage.setItem(kbLimitKey, "0");
      if (user) {
        await supabase
          .from("chat_history")
          .upsert({ id: user.id, user_id: user.id, messages: initialMsg });
      }
    };
  // --- KB answer limit logic ---
  const KB_ANSWER_LIMIT = 5;
  // Use localStorage key per user
  const kbLimitKey = user ? `kbAnswers_${user.id}` : null;
  const [kbAnswers, setKbAnswers] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  // On mount or user change, load count from localStorage
  useEffect(() => {
    if (kbLimitKey) {
      const stored = parseInt(localStorage.getItem(kbLimitKey) || "0", 10);
      setKbAnswers(stored);
      setLimitReached(stored >= KB_ANSWER_LIMIT);
    }
  }, [kbLimitKey]);

  // Helper: detect if a bot reply is file-based (KB answer)
  function isFileBasedAnswer(text) {
    // Improved: If the answer contains any phrase like 'Based on the' or 'According to the', treat as KB answer
    if (!text) return false;
    const kbMarkers = [
      'based on the',
      'according to the',
      'from the file',
      'from the knowledge base',
      'from the database',
      'from your documents',
      'from your file',
      'from the csv',
      'from the extracted',
      'from the eligibility criteria',
      'from the acceptance criteria',
      'from the provided',
      'from the uploaded',
      'from the context',
      'from the data',
      'from the kb',
    ];
    const lower = text.toLowerCase();
    return kbMarkers.some(marker => lower.includes(marker));
  }
  const [open, setOpen] = useState(forceOpen || false);
  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [handover, setHandover] = useState(false);
  const [showHandoverMsg, setShowHandoverMsg] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  let typingTimeout = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevHandoverRef = useRef(handover);

  // Detect mobile keyboard
  useEffect(() => {
    let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        
        if (heightDifference > 150) { // Keyboard is likely open
          setKeyboardHeight(heightDifference);
          setIsKeyboardOpen(true);
        } else {
          setKeyboardHeight(0);
          setIsKeyboardOpen(false);
        }
      }
    };

    // Fallback for older browsers
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = window.screen.height - currentHeight;
      
      if (heightDifference > 300 && window.innerWidth <= 768) { // Mobile keyboard likely open
        setKeyboardHeight(heightDifference - 100); // Adjust for browser UI
        setIsKeyboardOpen(true);
      } else if (heightDifference < 200) {
        setKeyboardHeight(0);
        setIsKeyboardOpen(false);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => window.visualViewport.removeEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (user) {
      console.log("ChatbotWidget userId:", user.id);
    }
  }, [user]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("chat_history")
        .select("messages, handover")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Supabase select error:", error);
      }
      if (data) {
        setMessages(data.messages && data.messages.length > 0 ? data.messages : [{ role: "assistant", content: "Hi! How can I help you today?" }]);
        setHandover(!!data.handover);
      } else {
        setMessages([{ role: "assistant", content: "Hi! How can I help you today?" }]);
        setHandover(false);
      }
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Subscribe to changes in chat_history for this user
    const channel = supabase
      .channel('realtime-chat-' + user.id)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_history',
        filter: `id=eq.${user.id}`
      }, payload => {
        if (payload.new) {
          if (payload.new.messages) setMessages(payload.new.messages);
          setHandover(!!payload.new.handover);
          setAdminTyping(!!payload.new.admin_typing);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Block only file-based questions if limit reached and not handover
    if (limitReached && !handover) {
      // Check if the user is asking a file-based question (simple heuristic: contains 'file', 'document', 'eligibility', 'criteria', 'knowledge base', etc.)
      const fileQuestionMarkers = [
        'file', 'document', 'knowledge base', 'eligibility', 'criteria', 'csv', 'acceptance', 'uploaded', 'data', 'university', 'college', 'requirement', 'score', 'gpa', 'marks', 'grade', 'profile', 'application', 'admission', 'program', 'course', 'major', 'faculty', 'institute', 'school', 'academy', 'polytechnic', 'campus', 'center', 'centre', 'école'
      ];
      const userInputLower = input.toLowerCase();
      const isFileQuestion = fileQuestionMarkers.some(marker => userInputLower.includes(marker));
      if (isFileQuestion) {
        setShowHandoverMsg(true);
        // Optionally: show booking link in the prompt
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: "system",
              content: `<b>You've reached the free file-based answer limit.</b><br/>To get more personalized help or ask further questions about your documents, <b>please book a session with an advisor:</b><br/><a href='https://meet.brevo.com/elitescholars/free-elite-consultation' target='_blank' rel='noopener noreferrer' style='color:#6c47ff;text-decoration:underline;font-weight:bold;'>Book a free consultation slot</a>.`,
            },
          ]);
        }, 200);
        return;
      }
      // Otherwise, allow general questions (e.g., pricing, advisor, etc.)
    }
    setLoading(true);
    if (handover) {
      // Only append user message, no AI reply
      const newMessages = [...messages, { role: "user", content: input }];
      setMessages(newMessages);
      setInput("");
      if (user) {
        await supabase
          .from("chat_history")
          .upsert({ id: user.id, user_id: user.id, messages: newMessages });
      }
      setLoading(false);
      setTimeout(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
      return;
    }
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      // Get user documents from Supabase to provide context
      let userDocuments = null;
      if (user) {
        const { data, error } = await supabase
          .from("user_roles")
          .select("documents")
          .eq("user_id", user.id)
          .single();
        if (data && data.documents) {
          userDocuments = data.documents;
        }
      }

      const res = await fetch("https://elite-scholars-eight.vercel.app/api/palm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: input,
          userId: user?.id,
          userDocuments: userDocuments
        }),
      });
      const data = await res.json();
      let reply = data.reply?.trim() || "Sorry, I couldn't get a response.";

            // --- Advisor booking link logic ---
            const advisorLink = "<a href='https://meet.brevo.com/elitescholars/free-elite-consultation' target='_blank' rel='noopener noreferrer' style='color:#6c47ff;text-decoration:underline;font-weight:bold;'>Book a free consultation here</a>";
            const advisorRegex = /speak(ing)? with (one of )?(our|an|a) (expert )?advisor(s)?|book a (free )?consultation|recommend (that )?you (speak|talk) with/i;
            const hasAdvisorRecommendation = advisorRegex.test(reply);
            const hasAdvisorLink = reply.includes('meet.brevo.com/elitescholars/free-elite-consultation');
            if (hasAdvisorRecommendation && !hasAdvisorLink) {
              // Append the booking link if not already present
              reply += `<br><br>${advisorLink}`;
            }
      
      // Check if response indicates lack of information and redirect to advisor
      const unknownResponseMarkers = [
        'i don\'t know',
        'i don\'t have',
        'not available',
        'no information',
        'cannot provide',
        'don\'t have information',
        'unable to provide',
        'sorry, i don\'t',
        'i apologize, but',
        'does not contain information',
        'knowledge base does not',
        'no specific',
        'not found in',
        'cannot find'
      ];
      let replaced = false;
      unknownResponseMarkers.forEach(marker => {
        if (reply.toLowerCase().includes(marker)) {
          reply = reply.replace(new RegExp(marker, 'gi'), 'Based on our experience and best practices,');
          replaced = true;
        }
      });
      if (replaced) {
        reply = reply.replace(/(Based on our experience and best practices,)[\s,.]*/g, '$1 ');
        reply = reply.replace(/\s{2,}/g, ' ');
      }
      
      // --- KB answer limit logic: check if reply is file-based ---
      let newKbAnswers = kbAnswers;
      let reached = limitReached;
      if (isFileBasedAnswer(reply) && !handover) {
        newKbAnswers = kbAnswers + 1;
        localStorage.setItem(kbLimitKey, newKbAnswers);
        setKbAnswers(newKbAnswers);
        if (newKbAnswers >= KB_ANSWER_LIMIT) {
          setLimitReached(true);
          reached = true;
        }
      }
      const updatedMessages = [...newMessages, { role: "assistant", content: reply }];
      setMessages(updatedMessages);
      // Upsert chat history only after receiving reply
      if (user) {
        await supabase
          .from("chat_history")
          .upsert({ id: user.id, user_id: user.id, messages: updatedMessages });
      }
      // If limit just reached, show handover prompt
      if (isFileBasedAnswer(reply) && !handover && !limitReached && reached) {
        setShowHandoverMsg(true);
      }
    } catch {
      const updatedMessages = [...newMessages, { role: "assistant", content: "Sorry, I couldn't get a response from the server." }];
      setMessages(updatedMessages);
      if (user) {
        await supabase
          .from("chat_history")
          .upsert({ id: user.id, user_id: user.id, messages: updatedMessages });
      }
    }
    setLoading(false);
    setTimeout(() => {
      if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    if (messages && messages.length > 0 && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (handover && !prevHandoverRef.current) {
      // Add system message to chat history
      const systemMsg = { role: "system", content: "This chat is now being handled by a human admin. AI assistant is disabled." };
      if (messages && messages[messages.length - 1]?.role !== "system") {
        const newMessages = [...messages, systemMsg];
        setMessages(newMessages);
        if (user) {
          supabase
            .from("chat_history")
            .upsert({ id: user.id, user_id: user.id, messages: newMessages });
        }
      }
    }
    if (!handover && prevHandoverRef.current) {
      // Remove system message if present
      if (messages && messages[messages.length - 1]?.role === "system") {
        const newMessages = messages.slice(0, -1);
        setMessages(newMessages);
        if (user) {
          supabase
            .from("chat_history")
            .upsert({ id: user.id, user_id: user.id, messages: newMessages });
        }
      }
    }
    prevHandoverRef.current = handover;
  }, [handover]);

  const handleInputChange = async (e) => {
    setInput(e.target.value);
    if (!user) return;
    // Set user_typing true
    await supabase
      .from("chat_history")
      .update({ user_typing: true })
      .eq("id", user.id);
    // Clear previous timeout
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    // Set user_typing false after 2s of inactivity
    typingTimeout.current = setTimeout(async () => {
      await supabase
        .from("chat_history")
        .update({ user_typing: false })
        .eq("id", user.id);
    }, 2000);
  };

  // Utility: parse *text* and **text** to <strong>text</strong>, and handle lists
  function parseBold(text) {
    if (!text) return '';
    // Clean up punctuation and markdown headings
    text = text.replace(/([.!?]){2,}/g, '$1'); // Collapse repeated punctuation
    text = text.replace(/([.!?])([^ \n])/g, '$1 $2'); // Ensure space after punctuation
    text = text.replace(/^#+\s*/gm, '<strong>'); // Markdown headings to <strong>
    text = text.replace(/\n/g, '</strong><br>'); // Newlines after headings
    // Replace **text** first, then *text*
    let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<strong>$1</strong>');
    // Handle nested lists and multiple bullets
    html = html.replace(/(^|\n)\s*\*\s+(?!\*)(.*?)(?=\n|$)/g, function(match, p1, p2) {
      return `${p1}<ul><li style=\"list-style-type:disc; margin-left:1em;\">${p2}</li></ul>`;
    });
    html = html.replace(/(^|\n)\s*\*\*\s+(.*?)(?=\n|$)/g, function(match, p1, p2) {
      return `${p1}<ul><li style=\"list-style-type:circle; margin-left:2em;\">${p2}</li></ul>`;
    });
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    return html;
  }

  return (
    <div>
      {/* Floating Button */}
      {!open && !forceOpen && (
        <button
          className="fixed z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-700 text-white shadow-card-lg hover:shadow-card-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
          style={isMobile ? {
            left: dragPos.x, top: dragPos.y, right: 'auto', bottom: 'auto',
            touchAction: 'none',
            transition: 'left 0.2s cubic-bezier(.4,2,.3,1), top 0.2s cubic-bezier(.4,2,.3,1)',
          } : { bottom: '1.5rem', right: '1.5rem' }}
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          onTouchStart={isMobile ? handleDragStart : undefined}
          onTouchMove={isMobile ? handleDrag : undefined}
          onTouchEnd={isMobile ? handleDragEnd : undefined}
          onMouseDown={isMobile ? handleDragStart : undefined}
          onMouseMove={isMobile ? handleDrag : undefined}
          onMouseUp={isMobile ? handleDragEnd : undefined}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          className={forceOpen
            ? 'w-full max-w-lg mx-auto'
            : `fixed z-50 flex flex-col bg-white rounded-2xl shadow-card-xl border border-slate-200 overflow-hidden
               bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 w-auto sm:w-[380px]`}
          style={isMobile && !forceOpen ? {
            left: dragPos.x, top: dragPos.y, right: 'auto', bottom: 'auto',
            touchAction: 'none', zIndex: 60,
            maxHeight: '85vh',
            transition: 'left 0.2s cubic-bezier(.4,2,.3,1), top 0.2s cubic-bezier(.4,2,.3,1)',
          } : {
            maxHeight: forceOpen ? undefined : '580px',
            transform: isKeyboardOpen && !forceOpen && window.innerWidth <= 640
              ? `translateY(-${Math.min(keyboardHeight - 20, 250)}px)` : 'none',
            transition: 'transform 0.3s ease-in-out',
          }}
          onTouchStart={isMobile && !forceOpen ? handleDragStart : undefined}
          onTouchMove={isMobile && !forceOpen ? handleDrag : undefined}
          onTouchEnd={isMobile && !forceOpen ? handleDragEnd : undefined}
          onMouseDown={isMobile && !forceOpen ? handleDragStart : undefined}
          onMouseMove={isMobile && !forceOpen ? handleDrag : undefined}
          onMouseUp={isMobile && !forceOpen ? handleDragEnd : undefined}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-white/10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✦</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">AI Assistant</p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Online
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleRefreshChat} disabled={loading} title="New chat"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors">
                <RotateCcw size={12} />
              </button>
              {!forceOpen && (
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors text-lg leading-none">
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 bg-slate-50" style={{ minHeight: 180 }}>
            {messages === null ? (
              <div className="flex items-center justify-center h-full py-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading…</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-2`}>
                  <span
                    className={`inline-block px-3 py-2 rounded-2xl text-sm leading-relaxed max-w-[82%] break-words
                      ${msg.role === "user"
                        ? "bg-brand-600 text-white rounded-br-sm shadow-xs"
                        : msg.role === "admin"
                          ? "bg-violet-50 text-violet-900 border border-violet-200 rounded-bl-sm"
                          : msg.role === "system"
                            ? "bg-amber-50 text-amber-800 border border-amber-200 text-xs"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-xs"
                      }`}
                    dangerouslySetInnerHTML={{ __html: parseBold(msg.content) }}
                  />
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start mb-2">
                <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}
            {adminTyping && (
              <div className="flex justify-start mb-2">
                <span className="inline-block px-3 py-2 rounded-2xl rounded-bl-sm bg-violet-50 border border-violet-200 text-violet-700 text-xs animate-pulse">Admin is typing…</span>
              </div>
            )}
            {showHandoverMsg && !handover && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-3 py-3 text-xs text-amber-800 text-center my-2">
                <p className="font-semibold mb-1">Free answer limit reached</p>
                <p>To ask more, please <span className="underline cursor-pointer">talk to an Advisor</span>.</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex-shrink-0 p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
              <input
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                value={input}
                onChange={handleInputChange}
                placeholder={handover ? "Admin is handling your chat…" : limitReached ? "Limit reached" : "Type a message…"}
                disabled={loading || (limitReached && !handover)}
                ref={inputRef}
                onFocus={() => { if (window.innerWidth <= 640) { setTimeout(() => { setIsKeyboardOpen(true); inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 100); } }}
                onBlur={() => { if (window.innerWidth <= 640) { setTimeout(() => { setIsKeyboardOpen(false); setKeyboardHeight(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 300); } }}
              />
              <button type="submit" disabled={loading || (limitReached && !handover)}
                className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center flex-shrink-0 transition-colors"
                aria-label="Send">
                {loading
                  ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  : <SendIcon size={16} color="#fff" />
                }
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
