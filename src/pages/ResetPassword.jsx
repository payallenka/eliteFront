import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [canReset, setCanReset] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase sends the token in the hash fragment, not query string
    const hash = window.location.hash.substring(1); // remove '#'
    const params = new URLSearchParams(hash);
    const type = params.get("type");
    const accessToken = params.get("access_token");
    if (type === "recovery" && accessToken) {
      setCanReset(true);
      // Supabase automatically authenticates the user with the token
    } else {
      setError("Invalid or expired password reset link.");
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    // Update password for authenticated user (from reset link)
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Your password has been reset successfully. You can now log in.");
      setTimeout(() => navigate('/login'), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2c1a4e] to-[#4b3a7b] text-white font-sans">
      <div className="form-section bg-[#3b2866] p-10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-8 border border-[#4b3a7b]">
        <h1 className="text-2xl font-bold mb-2 tracking-tight text-center">Reset Password</h1>
        {canReset ? (
          <form className="grid grid-cols-1 gap-4" onSubmit={handleResetPassword}>
            <input
              type="password"
              placeholder="New Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-[#4b3a7b] text-white border-none rounded-lg px-4 py-3 w-full placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              type="submit"
              className="submit-button bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg w-full mt-4 flex items-center justify-center transition-colors shadow-md"
            >
              Reset Password
            </button>
          </form>
        ) : (
          <div className="text-red-400 text-center font-semibold">{error}</div>
        )}
        {message && <div className="mt-4 text-green-400 text-center font-semibold">{message}</div>}
        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-red-400 underline ml-1 font-semibold hover:text-red-300"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
