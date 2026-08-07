import { useMemo, useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getAuthToken } from '../auth/session';
import { PAKISTAN_CITIES } from '../utils/pakistanCities';

const USERNAME_REGEX = /^[a-z0-9._-]+$/;

type RegisterForm = {
  fullName: string;
  username: string;
  email: string;
  country: string;
  city: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getAuthToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const [form, setForm] = useState<RegisterForm>({
    fullName: '',
    username: '',
    email: '',
    country: 'Pakistan',
    city: 'Karachi',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const usernameError = useMemo(() => {
    if (!form.username) return '';
    if (/\s/.test(form.username)) return 'Username cannot contain spaces.';
    if (/[A-Z]/.test(form.username)) return 'Username cannot contain capital letters.';
    if (!USERNAME_REGEX.test(form.username)) return 'Use only lowercase letters, numbers, dot, underscore, or hyphen.';
    return '';
  }, [form.username]);

  const isPasswordMatch = useMemo(() => {
    if (!form.confirmPassword) return null;
    return form.password === form.confirmPassword;
  }, [form.password, form.confirmPassword]);

  useEffect(() => {
    if (!form.username || usernameError) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(() => {
      checkUsernameUnique();
    }, 400);
    return () => clearTimeout(timer);
  }, [form.username, usernameError]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value: rawValue } = e.target;
    let value = rawValue;

    if (name === 'username') {
      value = rawValue.trimStart();
      setUsernameAvailable(null);
    }

    if (name === 'email') {
      value = rawValue.trim();
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function checkUsernameUnique() {
    if (!form.username || usernameError) {
      setUsernameAvailable(null);
      return false;
    }

    try {
      setCheckingUsername(true);

      let available = true;

      try {
        const res = await API.get('/auth/check-username', {
          params: { username: form.username },
        });
        if (typeof res.data?.available === 'boolean') {
          available = res.data.available;
        }
      } catch {
        try {
          const res = await API.post('/auth/check-username', { username: form.username });
          if (typeof res.data?.available === 'boolean') {
            available = res.data.available;
          }
        } catch {
          available = true;
        }
      }

      setUsernameAvailable(available);
      return available;
    } finally {
      setCheckingUsername(false);
    }
  }

  async function handleSendOtp() {
    if (!form.email) {
      setMessage('Please enter your email first.');
      return;
    }

    try {
      setSendingOtp(true);
      setMessage('');

      const res = await API.post('/auth/otp/send', {
        email: form.email,
        purpose: 'register',
        provider: 'resend',
        service: 'resend',
      });

      if (res.data.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtpCode('');
        setMessage('OTP sent to your email. Please verify before registration.');
      } else {
        setMessage(res.data.message || 'Unable to send OTP.');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Unable to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!form.email || !otpCode) {
      setMessage('Please enter OTP sent to your email.');
      return;
    }

    try {
      setVerifyingOtp(true);
      setMessage('');

      const res = await API.post('/auth/otp/verify', {
        email: form.email,
        code: otpCode,
        purpose: 'register',
      });

      if (res.data.success) {
        setOtpVerified(true);
        setMessage('Email verified successfully.');
      } else {
        setOtpVerified(false);
        setMessage(res.data.message || 'OTP verification failed.');
      }
    } catch (err: any) {
      setOtpVerified(false);
      setMessage(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.fullName || !form.username || !form.email || !form.password || !form.confirmPassword) {
      setMessage('Please fill all required fields.');
      return;
    }

    if (usernameError) {
      setMessage(usernameError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Password and confirm password must match.');
      return;
    }

    if (!otpVerified) {
      setMessage('Please verify your email with OTP before registering.');
      return;
    }

    const isUnique = usernameAvailable === true ? true : await checkUsernameUnique();
    if (!isUnique) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const payload = {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        country: "Pakistan",
        city: form.city || "Karachi",
        password: form.password,
      };

      const res = await API.post('/auth/register', payload);

      if (res.data.success) {
        setMessage('Registration successful!');
        setForm({
          fullName: '',
          username: '',
          email: '',
          country: 'Pakistan',
          city: 'Karachi',
          password: '',
          confirmPassword: '',
        });
        setUsernameAvailable(null);
        setOtpSent(false);
        setOtpVerified(false);
        setOtpCode('');
      } else {
        setMessage(res.data.message || 'Something went wrong.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Server error.';
      const duplicateUsername = /username.*(exist|taken|already)/i.test(errorMessage);
      if (duplicateUsername) {
        setUsernameAvailable(false);
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const isSuccessMessage =
    message.toLowerCase().includes('successful') ||
    message.toLowerCase().includes('verified') ||
    message.toLowerCase().includes('sent');

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-900 p-2 shadow-lg shadow-teal-600/20 border border-teal-500/30">
            <img src="/logo.png" alt="All Kutchi Community Logo" className="h-full w-full object-contain" />
          </div>
          <span className="inline-flex rounded-full bg-teal-50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-teal-700 border border-teal-200">
            COMMUNITY MEMBERSHIP
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">Create Your Account</h2>
          <p className="mt-1 text-xs text-slate-500">Register to connect with friends, notices, polls, and opportunities.</p>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${isSuccessMessage ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>
            {message}
          </div>
        )}

        <form className="space-y-5 text-gray-700" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Full Name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" className="form-input" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Country</label>
              <input
                name="country"
                value="Pakistan"
                readOnly
                className="form-input bg-slate-100 cursor-not-allowed font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="form-label">City</label>
              <select
                name="city"
                value={form.city || "Karachi"}
                onChange={handleChange}
                className="form-input font-medium"
                required
              >
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              onBlur={checkUsernameUnique}
              placeholder="e.g. ali_khan"
              className={`form-input w-full ${
                usernameError || usernameAvailable === false
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                  : usernameAvailable === true
                  ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200'
                  : ''
              }`}
              required
              autoComplete="off"
            />
            {form.username && (
              <p className="mt-1.5 text-xs font-bold">
                {checkingUsername ? (
                  <span className="text-slate-500 font-medium">Checking username availability...</span>
                ) : usernameError ? (
                  <span className="text-rose-600 font-bold">{usernameError}</span>
                ) : usernameAvailable === false ? (
                  <span className="text-rose-600 font-bold">Username unavailable</span>
                ) : usernameAvailable === true ? (
                  <span className="text-emerald-600 font-bold">✓ Username available</span>
                ) : (
                  <span className="text-slate-500 font-medium">Use lowercase only, no spaces.</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="form-label">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" className="form-input" required />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || !form.email}
                className="btn-primary rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60"
              >
                {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || !otpSent || !otpCode}
                className="rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="form-input mt-3 font-mono font-bold tracking-widest text-center text-sm"
            />
            <p className="mt-2 text-xs font-bold">
              {otpVerified ? (
                <span className="text-emerald-600 font-bold">✓ Email verified.</span>
              ) : (
                <span className="text-rose-600 font-bold">Please verify your email before registering.</span>
              )}
            </p>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                className="form-input w-full pr-10"
                required
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

          <div>
            <label className="form-label">Confirm Password</label>
            <div className="relative">
              <input
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className={`form-input w-full pr-10 ${
                  isPasswordMatch === false
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                    : isPasswordMatch === true
                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200'
                    : ''
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                onMouseDown={(e) => e.preventDefault()}
                className="absolute inset-y-0 right-2 flex items-center appearance-none border-none bg-transparent p-0 text-gray-500"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
              >
                {showConfirmPassword ? (
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
            {form.confirmPassword ? (
              <p className="mt-1.5 text-xs font-bold">
                {isPasswordMatch === true ? (
                  <span className="text-emerald-600 font-bold">✓ Password matched</span>
                ) : (
                  <span className="text-rose-600 font-bold">Password and confirm password must match.</span>
                )}
              </p>
            ) : null}
          </div>

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading || checkingUsername || sendingOtp || verifyingOtp}
              className="btn-primary w-full rounded-xl px-4 py-3 text-base font-bold transition disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Register'}
            </button>

            <div className="mt-4 text-sm text-slate-600">
              <span className="mr-2">Already have an account?</span>
              <a href="/login" className="font-semibold text-blue-700 hover:text-blue-800">Login</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
