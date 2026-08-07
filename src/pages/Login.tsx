import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { persistAuthToken, getAuthToken } from '../auth/session';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getAuthToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

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
        setResetMessage('OTP sent to your email address.');
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
        setResetMessage('Password reset successfully! You can now log in.');
      } else {
        setError(response.data.message || 'Unable to reset password.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-900 p-2 shadow-lg shadow-teal-600/20 border border-teal-500/30">
            <img src="/logo.png" alt="All Kutchi Community Logo" className="h-full w-full object-contain" />
          </div>
          <span className="inline-flex rounded-full bg-teal-50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-teal-700 border border-teal-200">
            MEMBER LOGIN
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Sign In to Your Account</h2>
          <p className="mt-1 text-xs text-slate-500">Access your community feed, notices, polls & messaging.</p>
        </div>

        {!forgotMode ? (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Number or Email</label>
              <input
                type="text"
                placeholder="03XX-XXXXXXX or you@example.com"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pr-10 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">{error}</p>}
            {resetMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">{resetMessage}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/30 hover:bg-teal-500 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setForgotMode(true);
                  setError('');
                  setResetMessage('');
                }}
                className="font-bold text-teal-600 hover:text-teal-700"
              >
                Forgot Password?
              </button>

              <Link to="/register" className="font-bold text-slate-600 hover:text-slate-900">
                Create Account →
              </Link>
            </div>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={otpSent ? handleResetPassword : handleSendResetOtp}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Account Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value.trim());
                  setOtpSent(false);
                  setResetOtp('');
                  setResetMessage('');
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500"
              />
            </div>

            {otpSent && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">6-Digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit OTP"
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-mono font-bold tracking-widest text-center focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500"
                  />
                </div>
              </>
            )}

            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700">{error}</p>}
            {resetMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">{resetMessage}</p>}

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/30 hover:bg-teal-500 transition active:scale-95 disabled:opacity-50"
            >
              {resetLoading ? 'Processing...' : otpSent ? 'Reset Password' : 'Send Verification OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setError('');
                setResetMessage('');
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 text-center"
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
