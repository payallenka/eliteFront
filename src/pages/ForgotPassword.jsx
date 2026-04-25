import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password"
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("If you have an account, a password reset link will be sent to your email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-[#1a0841] font-sans mt-12 px-4 md:px-0">
      <div className="form-section bg-white p-6 md:p-12 rounded-3xl w-full max-w-lg md:max-w-xl shadow-2xl flex flex-col gap-8 border border-[#e6e6e6]">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight" style={{ fontFamily: 'Inter, Hedvig Letters Sans, sans-serif' }}>Elite Scholars</h1>
        <h2 className="mb-6 text-2xl md:text-4xl font-bold leading-tight text-[#1a0841]" style={{ fontFamily: 'Inter, Hedvig Letters Sans, sans-serif' }}>Forgot your password?</h2>
        <form className="grid grid-cols-1 gap-4 md:gap-6" onSubmit={handleForgotPassword}>
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-[#f6f6fa] text-[#1a0841] border border-[#e6e6e6] rounded-xl px-4 md:px-5 py-3 md:py-4 w-full placeholder:text-[#a3a3b3] focus:outline-none text-base md:text-lg"
          />
          <button
            type="submit"
            className="bg-[#e60023] hover:bg-[#c2001a] text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-full w-full mt-2 flex items-center justify-center text-base md:text-lg transition-colors shadow-md"
          >
            Send Reset Link
          </button>
        </form>
        {error && <div className="mt-4 text-[#e60023] text-center text-base font-semibold">{error}</div>}
        {message && <div className="mt-4 text-green-600 text-center text-base font-semibold">{message}</div>}
        <div className="mt-6 text-center text-base">
          <button
            type="button"
            className="text-[#e60023] underline ml-1 font-semibold"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
      <style>{`
        body { font-family: Inter, Hedvig Letters Sans, sans-serif; }
      `}</style>
    </div>
  );
}

export default ForgotPassword;
