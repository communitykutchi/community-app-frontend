import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios.js";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        identifier,
        password,
      });

      if (response.data.success) {
        const token = response.data.token;

        // store token
        localStorage.setItem("token", token);

        // attach token for future requests
        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        navigate("/");
      } else {
        setError(response.data.message || "Login failed");
      }

    } catch (err: any) {
      setError(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResetLoading(true);

    try {
      const response = await API.post('/auth/otp/send', { email: resetEmail, purpose: 'reset_password' });
      if (response.data.success) {
        setOtpSent(true);
        setResetOtp("");
        setError("");
      } else {
        setError(response.data.message || "Unable to send reset OTP.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to send reset OTP.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResetLoading(true);

    try {
      const response = await API.post('/auth/password/reset', { email: resetEmail, otp: resetOtp, newPassword });
      if (response.data.success) {
        setForgotMode(false);
        setOtpSent(false);
        setResetEmail("");
        setResetOtp("");
        setNewPassword("");
        setError("");
      } else {
        setError(response.data.message || "Unable to reset password.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const panelClass = "rounded-[1.6rem] border border-white/35 bg-white/80 p-6 shadow-[0_24px_70px_-38px_rgba(7,33,69,0.75)] backdrop-blur-xl sm:p-8";

  return (
    <div className="auth-scene relative isolate overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="register-orb register-orb-one" />
        <div className="register-orb register-orb-two" />
        <div className="register-orb register-orb-three" />
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        <div className={panelClass}>
          <div className="mb-6 text-center">
            <p className="inline-flex rounded-full bg-[#0f3d5e]/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[#0f3d5e]">WELCOME BACK</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0d2742]">Member Login</h2>
            <p className="mt-1 text-sm text-[#4b6788]">Access your community dashboard and updates.</p>
          </div>

          {!forgotMode ? (
            <form className="flex flex-col gap-4 text-gray-700" onSubmit={handleSubmit}>
              <div className="register-field">
                <label className="register-label">Mobile Number or Email</label>
                <input
                  type="text"
                  placeholder="03XX-XXXXXXX or you@example.com"
                  className="register-input"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div className="register-field">
                <label className="register-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="register-input w-full pr-10"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute inset-y-0 right-2 flex items-center appearance-none border-none bg-transparent p-0 text-gray-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ border: "none", background: "transparent", boxShadow: "none" }}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.5 12c1.5 4.5 5.7 7.5 10.5 7.5 1.6 0 3.1-.3 4.5-.9M6.6 6.6A10.45 10.45 0 0112 4.5c4.8 0 9 3 10.5 7.5a10.4 10.4 0 01-1.3 2.4M9.88 9.88a3 3 0 104.24 4.24M3.5 3.5l17 17" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-[#0f3d5e] via-[#1465a5] to-[#10a0b8] px-4 py-3 text-base font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(true);
                  setError("");
                }}
                className="text-sm font-semibold text-[#1465a5] hover:text-[#0f3d5e]"
              >
                Forgot password?
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-4 text-gray-700" onSubmit={otpSent ? handleResetPassword : handleSendResetOtp}>
              <div className="register-field">
                <label className="register-label">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="register-input"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              {otpSent ? (
                <>
                  <div className="register-field">
                    <label className="register-label">OTP</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      className="register-input"
                      required
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                    />
                  </div>

                  <div className="register-field">
                    <label className="register-label">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="register-input"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </>
              ) : null}

              {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

              <button
                type="submit"
                disabled={resetLoading}
                className="rounded-xl bg-gradient-to-r from-[#0f3d5e] via-[#1465a5] to-[#10a0b8] px-4 py-3 text-base font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:scale-[1.01] disabled:opacity-60"
              >
                {resetLoading ? "Please wait..." : otpSent ? "Reset Password" : "Send OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setOtpSent(false);
                  setResetEmail("");
                  setResetOtp("");
                  setNewPassword("");
                  setError("");
                }}
                className="text-sm font-semibold text-[#1465a5] hover:text-[#0f3d5e]"
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}