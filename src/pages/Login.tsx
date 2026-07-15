import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios.js';
import { persistAuthToken } from '../auth/session.js';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/login', {
        identifier,
        password,
      });

      if (response.data.success) {
        const token = response.data.token;
        persistAuthToken(token);
        API.defaults.headers.common.Authorization = `Bearer ${token}`;
        navigate('/');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async (e?: FormEvent) => {
    e?.preventDefault();

    if (!resetEmail) {
      setError('Please enter your email first.');
      return;
    }

    setError('');
    setResetMessage('');
    setResetLoading(true);

    try {
      const response = await API.post('/auth/otp/send', {
        email: resetEmail,
        purpose: 'reset_password',
        provider: 'resend',
        service: 'resend',
      });

      if (response.data.success) {
        setOtpSent(true);
        setResetOtp('');
        setResetMessage('OTP sent to your email.');
      } else {
        setError(response.data.message || 'Unable to send reset OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to send reset OTP.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setResetLoading(true);

    try {
      const response = await API.post('/auth/password/reset', {
        email: resetEmail,
        otp: resetOtp,
        newPassword,
      });

      if (response.data.success) {
        setForgotMode(false);
        setOtpSent(false);
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setResetMessage('Password reset successful. Please login.');
      } else {
        setError(response.data.message || 'Unable to reset password.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  const panelClass = 'page-card p-6 sm:p-8';

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <div className={panelClass}>
          <div className="mb-6 text-center">
            <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-blue-700">WELCOME BACK</p>
            <h2 className="page-title mt-3 text-3xl">Member Login</h2>
            <p className="page-subtitle mt-1 text-sm">Access your community dashboard and updates.</p>
          </div>

          {!forgotMode ? (
            <form className="flex flex-col gap-4 text-gray-700" onSubmit={handleSubmit}>
              <div>
                <label className="form-label">Mobile Number or Email</label>
                <input
                  type="text"
                  placeholder="03XX-XXXXXXX or you@example.com"
                  className="form-input"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="form-input w-full pr-10"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute inset-y-0 right-2 flex items-center appearance-none border-none bg-transparent p-0 text-gray-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
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
                className="btn-primary rounded-xl px-4 py-3 text-base font-bold transition disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(true);
                  setError('');
                  setResetMessage('');
                }}
                className="text-sm font-semibold text-[#1465a5] hover:text-[#0f3d5e]"
              >
                Forgot password?
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-4 text-gray-700" onSubmit={otpSent ? handleResetPassword : handleSendResetOtp}>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="form-input"
                  required
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value.trim());
                    setOtpSent(false);
                    setResetOtp('');
                    setResetMessage('');
                  }}
                />
              </div>

              {otpSent ? (
                <>
                  <div>
                    <label className="form-label">OTP</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      className="form-input"
                      required
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="form-input"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </>
              ) : null}

              {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              {resetMessage && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{resetMessage}</p>}

              <button
                type="submit"
                disabled={resetLoading}
                className="btn-primary rounded-xl px-4 py-3 text-base font-bold transition disabled:opacity-60"
              >
                {resetLoading ? 'Please wait...' : otpSent ? 'Reset Password' : 'Send OTP'}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => handleSendResetOtp()}
                  disabled={resetLoading || !resetEmail}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Resend OTP
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setOtpSent(false);
                  setResetEmail('');
                  setResetOtp('');
                  setNewPassword('');
                  setError('');
                  setResetMessage('');
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
