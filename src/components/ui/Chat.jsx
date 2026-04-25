import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

const Chat = ({ sessionId, userId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch messages for the session
  useEffect(() => {
    if (!sessionId) return;
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
  }, [sessionId]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || !userId) return;
    const { error } = await supabase.from('messages').insert([
      {
        session_id: sessionId,
        user_id: userId,
        sender: userId, // or 'user'/'admin' based on your logic
        text: input,
      }
    ]);
    if (!error) setInput('');
    inputRef.current?.focus();
  };

  return (
    <div style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden relative">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#1a0841]">
            <h3 className="text-white text-lg font-bold">Course Chat</h3>
            <button onClick={onClose} className="text-white hover:text-[#e60023]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-[#f6f6fa] h-96 max-h-96">
            {messages.map(msg => (
              <div key={msg.id} className={`mb-3 flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-xl shadow ${msg.user_id === userId ? 'bg-[#e60023] text-white' : 'bg-gray-200 text-[#1a0841]'}`}>
                  <div className="text-sm">{msg.text}</div>
                  <div className="text-xs text-right opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="flex items-center p-3 border-t border-gray-200 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none text-base bg-[#f6f6fa]"
            />
            <button type="submit" className="ml-2 bg-[#1a0841] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#e60023] transition">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
