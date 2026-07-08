<<<<<<< HEAD
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import API from '../api/axios.js';

const USERNAME_REGEX = /^[a-z0-9._-]+$/;

type RegisterForm = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const [form, setForm] = useState<RegisterForm>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
=======
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import API from '../api/axios.js';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    familyMembers: '',
    cast: '',
    dob: '',
    cnic: '',
    mobile: '',
    email: '',
    password: '',
    homeStatus: 'Owner',
    occupation: 'Employee',
    businessName: '',
    jamaat: '',
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

=======
  const [showPassword, setShowPassword] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
<<<<<<< HEAD
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const usernameError = useMemo(() => {
    if (!form.username) return 'Username is required.';
    if (/\s/.test(form.username)) return 'Username cannot contain spaces.';
    if (/[A-Z]/.test(form.username)) return 'Username cannot contain capital letters.';
    if (!USERNAME_REGEX.test(form.username)) return 'Use only lowercase letters, numbers, dot, underscore, or hyphen.';
    return '';
  }, [form.username]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
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
    if (usernameError) {
      setUsernameAvailable(null);
      return false;
    }

    try {
      setCheckingUsername(true);
      setMessage('');

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

      if (!available) {
        setMessage('This username is already taken. Please choose another one.');
      }

      return available;
    } finally {
      setCheckingUsername(false);
    }
=======

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await API.get('/auth/groups');
        if (response.data.success) {
          setGroups(response.data.groups.map((group: { name: string }) => group.name));
        }
      } catch {
        // Ignore load failures.
      }
    };

    loadGroups();
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value: rawValue } = e.target;
    let value = rawValue as string;

    if (name === 'cnic') {
      const digits = value.replace(/\D/g, '').slice(0, 13);
      if (digits.length <= 5) value = digits;
      else if (digits.length <= 12) value = digits.slice(0, 5) + '-' + digits.slice(5);
      else value = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
    }

    if (name === 'mobile') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      if (digits.length <= 4) value = digits;
      else value = digits.slice(0, 4) + '-' + digits.slice(4);
    }

    setForm((f) => ({ ...f, [name]: value }));
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
  }

  async function handleSendOtp() {
    if (!form.email) {
      setMessage('Please enter your email first.');
      return;
    }

    try {
      setSendingOtp(true);
      setMessage('');
<<<<<<< HEAD

      const res = await API.post('/auth/otp/send', {
        email: form.email,
        purpose: 'register',
        provider: 'resend',
        service: 'resend',
      });

=======
      const res = await API.post('/auth/otp/send', { email: form.email, purpose: 'register' });
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
      if (res.data.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtpCode('');
<<<<<<< HEAD
        setMessage('OTP sent to your email. Please verify before registration.');
=======
        setMessage('OTP sent to your email. Please verify it before registering.');
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
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
<<<<<<< HEAD
      setMessage('Please enter OTP sent to your email.');
=======
      setMessage('Please enter the OTP sent to your email.');
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
      return;
    }

    try {
      setVerifyingOtp(true);
      setMessage('');
<<<<<<< HEAD

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
=======
      const res = await API.post('/auth/otp/verify', { email: form.email, code: otpCode, purpose: 'register' });
      if (res.data.success) {
        setOtpVerified(true);
        setMessage('Email verified successfully. You can now register.');
      } else {
        setMessage(res.data.message || 'OTP verification failed.');
      }
    } catch (err: any) {
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
      setMessage(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

<<<<<<< HEAD
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
=======
    if (!form.fullName || !form.mobile || !form.jamaat || !form.email) {
      setMessage('Please fill required fields: Full name, Mobile number, and Jamaat');
      return;
    }

    if (!/^\d{4}-\d{7}$/.test(form.mobile)) {
      setMessage('Mobile must be 11 digits in format: 03XX-XXXXXXX');
      return;
    }

    if (form.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(form.cnic)) {
      setMessage('CNIC must be 13 digits in format: 12345-1234567-1');
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
      return;
    }

    try {
      setLoading(true);
<<<<<<< HEAD
      setMessage('');

      const payload = {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
      };

      const res = await API.post('/auth/register', payload);

      if (res.data.success) {
        setMessage('Registration successful!');
        setForm({
          fullName: '',
          username: '',
          email: '',
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
=======
      setMessage("");

      const res = await API.post("/auth/register", form);

      if (res.data.success) {
        setMessage("Registration successful!");
        console.log("Registered user:", res);
      } else {
        setMessage(res.data.message || "Something went wrong.");
      }

    } catch (err: any) {
      setMessage(err.response?.data?.message || "Server error.");
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
    } finally {
      setLoading(false);
    }
  }

  const isSuccessMessage =
    message.toLowerCase().includes('successful') ||
<<<<<<< HEAD
    message.toLowerCase().includes('verified') ||
    message.toLowerCase().includes('sent');

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="page-card mx-auto w-full max-w-2xl p-6 sm:p-8">
=======
    message.toLowerCase().includes('verified');

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="page-card mx-auto w-full max-w-5xl p-6 sm:p-8">
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
        <div className="mb-7 text-center sm:mb-8">
          <p className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-blue-700">
            COMMUNITY MEMBERSHIP
          </p>
<<<<<<< HEAD
          <h2 className="page-title mt-3 text-3xl sm:text-4xl">Create Your Account</h2>
          <p className="page-subtitle mt-2 text-sm sm:text-base">Register with your basic account details.</p>
=======
          <h2 className="page-title mt-3 text-3xl sm:text-4xl">Create Your Member Profile</h2>
          <p className="page-subtitle mt-2 text-sm sm:text-base">Fill details once, verify your email, and join your jamaat dashboard.</p>
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${isSuccessMessage ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>
            {message}
          </div>
        )}

<<<<<<< HEAD
        <form className="space-y-5 text-gray-700" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Full Name</label>
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" className="form-input" required />
          </div>

          <div>
            <label className="form-label">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              onBlur={checkUsernameUnique}
              placeholder="e.g. ali_khan"
              className="form-input"
              required
              autoComplete="off"
            />
            <p className="mt-2 text-xs font-medium text-slate-500">
              {usernameError || (checkingUsername
                ? 'Checking username availability...'
                : usernameAvailable === false
                  ? 'Username already taken.'
                  : usernameAvailable === true
                    ? 'Username is available.'
                    : 'Use lowercase only, no spaces.')}
            </p>
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
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="form-input mt-3"
            />
            <p className="mt-2 text-xs font-medium text-slate-500">
              {otpVerified ? 'Email verified.' : 'Please verify your email before registering.'}
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
                className="form-input w-full pr-10"
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
          </div>

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading || checkingUsername || sendingOtp || verifyingOtp}
              className="btn-primary w-full rounded-xl px-4 py-3 text-base font-bold transition disabled:opacity-60"
=======
        <form className="space-y-6 text-gray-700" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <div>
              <label className="form-label">Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" className="form-input" required />
            </div>

            <div>
              <label className="form-label">Father Name</label>
              <input name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Father full name" className="form-input" />
            </div>

            <div>
              <label className="form-label">Mother Name</label>
              <input name="motherName" value={form.motherName} onChange={handleChange} placeholder="Mother full name" className="form-input" />
            </div>

            <div>
              <label className="form-label">Family Members</label>
              <input name="familyMembers" value={form.familyMembers} onChange={handleChange} type="number" min="1" placeholder="e.g. 4" className="form-input" />
            </div>

            <div>
              <label className="form-label">Date of Birth</label>
              <input name="dob" value={form.dob} onChange={handleChange} type="date" className="form-input" />
            </div>

            <div>
              <label className="form-label">CNIC Number</label>
              <input name="cnic" value={form.cnic} onChange={handleChange} placeholder="XXXXX-XXXXXXX-X" className="form-input" />
            </div>

            <div>
              <label className="form-label">Mobile Number</label>
              <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="03XX-XXXXXXX" className="form-input" required />
            </div>

            <div>
              <label className="form-label">Jamaat</label>
              <select
                name="jamaat"
                value={form.jamaat}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select jamaat</option>
                {groups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Email Address</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" className="form-input" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !form.email} className="btn-primary rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60">
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
                <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || !otpSent || !otpCode} className="rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter 6-digit OTP" className="form-input mt-3" />
              <p className="mt-2 text-xs font-medium text-slate-500">{otpVerified ? 'Email verified.' : 'Please verify your email before registering.'}</p>
            </div>

            <div className="md:col-span-2">
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
                  className="absolute inset-y-0 right-2 flex items-center appearance-none border-none bg-transparent p-0 text-gray-500 shadow-none outline-none ring-0"
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
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="form-label">Home Status</label>
              <select name="homeStatus" value={form.homeStatus} onChange={handleChange} className="form-input">
                <option>Owner</option>
                <option>Rent</option>
              </select>
            </div>

            <div>
              <label className="form-label">Occupation</label>
              <select name="occupation" value={form.occupation} onChange={handleChange} className="form-input">
                <option>Employee</option>
                <option>Business Man</option>
              </select>
            </div>
          </div>

          {form.occupation === 'Business Man' && (
            <div>
              <label className="form-label">Business Name</label>
              <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="Your business name" className="form-input" />
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-xl px-4 py-3 text-base font-bold transition disabled:opacity-60 sm:w-64"
>>>>>>> 04b2b653aab20788d83c5ce2c3a65e0546c90875
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
