import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Loader from '../components/ui/Loader';
import { supabase } from '../supabaseClient';

function AdminAIChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [runtimeError, setRuntimeError] = useState("");
  const [userTyping, setUserTyping] = useState(false);
  let typingTimeout = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://elite-scholars-eight.vercel.app/api/chats");
        const data = await res.json();
        console.log("Fetched chats:", data); // Log chat data for debugging
        setChats(data);
      } catch (err) {
        setError("Failed to load chats");
      }
      setLoading(false);
    };
    fetchChats();
  }, []);

  const handleHandover = async (id) => {
    try {
      await fetch("https://elite-scholars-eight.vercel.app/api/chats/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setChats((prev) => prev.map(chat => chat.id === id ? { ...chat, handover: true } : chat));
      if (selectedChat && selectedChat.id === id) {
        setSelectedChat({ ...selectedChat, handover: true });
      }
    } catch {
      setError("Failed to handover chat");
    }
  };

  const openModal = (chat) => {
    setSelectedChat(chat);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedChat(null);
  };

  useEffect(() => {
    if (!modalOpen || !selectedChat) return;
    // Subscribe to changes for the selected chat
    const subscription = supabase
      .channel('admin-chat-' + selectedChat.id)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_history',
          filter: 'id=eq.' + selectedChat.id
        },
        payload => {
          if (payload?.new?.messages) {
            setSelectedChat(prev => prev ? { ...prev, messages: payload.new.messages } : prev);
            setChats(prev => prev.map(chat => chat.id === selectedChat.id ? { ...chat, messages: payload.new.messages } : chat));
          }
          setUserTyping(!!payload?.new?.user_typing);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [modalOpen, selectedChat]);

  useEffect(() => {
    if (modalOpen && selectedChat) {
      const chatEndElem = document.getElementById('admin-chat-end');
      if (chatEndElem) {
        chatEndElem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [selectedChat?.messages, modalOpen]);

  return (
    <>
      <div className="min-h-screen bg-white text-[#1a0841] font-sans px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
          <h2 className="text-3xl md:text-4xl tracking-tight mb-2 md:mb-0" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>AI Chat Management</h2>
          {/* If you want a top-right action button, add it here, e.g.:
          <button className="bg-[#e60023] hover:bg-[#c2001a] text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg shadow-md" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Some Action</button>
          */}
        </div>
        {loading ? (
          <Loader message="Loading chats..." />
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <>
            {runtimeError && <div className="text-red-600 mb-4">{runtimeError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chats.length === 0 ? (
                <div>No ongoing chats found.</div>
              ) : (
                chats.map(chat => (
                  <div key={chat.id} className="cursor-pointer border rounded-xl p-4 shadow bg-gray-50 hover:bg-gray-100 transition" onClick={() => openModal(chat)} style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
                    <div className="mb-2" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>User: {chat.user_name && chat.user_name !== 'null' ? `${chat.user_name} (${chat.user_id})` : `No name (${chat.user_id})`}</div>
                    <div className="mb-1 text-sm" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Handover: {chat.handover ? "Yes" : "No"}</div>
                    <div className="mb-2 text-xs text-gray-600" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Messages: {chat.messages?.length || 0}</div>
                    <div className="flex flex-wrap gap-1">
                      {chat.messages?.slice(-2).map((msg, i) => (
                        <span key={i} className={`px-2 py-1 rounded text-xs ${msg.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800"}`} style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>{msg.role}: {msg.content.slice(0, 20)}{msg.content.length > 20 ? "..." : ""}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Modal for chat details */}
            {modalOpen && selectedChat && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }} onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div className="px-6 pt-6 pb-2 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="mb-1" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>User: {selectedChat.user_name && selectedChat.user_name !== 'null' ? `${selectedChat.user_name} (${selectedChat.user_id})` : `No name (${selectedChat.user_id})`}</div>
                      <div className="mb-1 text-sm" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Handover: {selectedChat.handover ? "Yes" : "No"}</div>
                      <div className="mb-1" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Messages:</div>
                    </div>
                    <button className="text-xl text-gray-500 hover:text-gray-800 ml-4" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }} onClick={closeModal}>&times;</button>
                  </div>
                  {/* Scrollable messages area */}
                  <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2 max-h-[45vh]">
                    {selectedChat.messages?.map((msg, i) => (
                      <div key={i} className={`px-3 py-2 rounded-lg ${msg.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800"}`} style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
                        <span style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>{msg.role}:</span> {msg.content}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                    <div id="admin-chat-end" />
                  </div>
                  {/* Footer */}
                  <div className="px-6 pb-4 pt-2 border-t border-gray-200 bg-white">
                    {selectedChat.handover ? (
                      <>
                        <form
                          className="flex gap-2"
                          onSubmit={async e => {
                            e.preventDefault();
                            const input = e.target.elements.adminMsg.value.trim();
                            if (!input) return;
                            // Add admin message to chat
                            const updatedMessages = [...selectedChat.messages, { role: "admin", content: input }];
                            // Update chat_history in Supabase
                            await fetch("https://elite-scholars-eight.vercel.app/api/chats/update", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: selectedChat.id, messages: updatedMessages })
                            });
                            setSelectedChat({ ...selectedChat, messages: updatedMessages });
                            setChats(prev => prev.map(chat => chat.id === selectedChat.id ? { ...chat, messages: updatedMessages } : chat));
                            e.target.reset();
                          }}
                        >
                          <input
                            name="adminMsg"
                            type="text"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300"
                            placeholder="Type a message as admin..."
                            autoComplete="off"
                            onChange={async e => {
                              // Set admin_typing true
                              await supabase
                                .from("chat_history")
                                .update({ admin_typing: true })
                                .eq("id", selectedChat.id);
                              // Clear previous timeout
                              if (typingTimeout.current) clearTimeout(typingTimeout.current);
                              // Set admin_typing false after 2s of inactivity
                              typingTimeout.current = setTimeout(async () => {
                                await supabase
                                  .from("chat_history")
                                  .update({ admin_typing: false })
                                  .eq("id", selectedChat.id);
                              }, 2000);
                            }}
                          />
                          <button
                            type="submit"
                            className="bg-[#1a0841] text-white px-4 py-2 rounded-lg hover:bg-[#2c1a4e]"
                            style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                          >
                            Send
                          </button>
                        </form>
                        <button
                          className="mt-2 bg-gray-300 text-[#1a0841] px-4 py-2 rounded-lg hover:bg-gray-400"
                          style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                          onClick={async () => {
                            // Undo handover: set handover to false
                            await fetch("https://elite-scholars-eight.vercel.app/api/chats/handover", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: selectedChat.id, handover: false })
                            });
                            setSelectedChat({ ...selectedChat, handover: false });
                            setChats(prev => prev.map(chat => chat.id === selectedChat.id ? { ...chat, handover: false } : chat));
                          }}
                        >
                          Undo Takeover
                        </button>
                      </>
                    ) : (
                      <button
                        className="w-full bg-[#e60023] text-white px-4 py-2 rounded-full hover:bg-[#c2001a]"
                        style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                        onClick={() => handleHandover(selectedChat.id)}
                      >
                        Take Over Chat
                      </button>
                    )}
                    {userTyping && (
                      <div className="my-2 text-left">
                        <span className="inline-block px-3 py-2 rounded-lg bg-blue-100 text-blue-900 border border-gray-300 opacity-70 animate-pulse">
                          User is typing...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default AdminAIChats;
