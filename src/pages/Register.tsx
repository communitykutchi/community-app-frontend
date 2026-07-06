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
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [groups, setGroups] = useState<string[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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
  }

  async function handleSendOtp() {
    if (!form.email) {
      setMessage('Please enter your email first.');
      return;
    }

    try {
      setSendingOtp(true);
      setMessage('');
      const res = await API.post('/auth/otp/send', { email: form.email, purpose: 'register' });
      if (res.data.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtpCode('');
        setMessage('OTP sent to your email. Please verify it before registering.');
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
      setMessage('Please enter the OTP sent to your email.');
      return;
    }

    try {
      setVerifyingOtp(true);
      setMessage('');
      const res = await API.post('/auth/otp/verify', { email: form.email, code: otpCode, purpose: 'register' });
      if (res.data.success) {
        setOtpVerified(true);
        setMessage('Email verified successfully. You can now register.');
      } else {
        setMessage(res.data.message || 'OTP verification failed.');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

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
      return;
    }

    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  const isSuccessMessage =
    message.toLowerCase().includes('successful') ||
    message.toLowerCase().includes('verified');

  return (
    <div className="register-scene relative isolate overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="register-orb register-orb-one" />
        <div className="register-orb register-orb-two" />
        <div className="register-orb register-orb-three" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl rounded-[2rem] border border-white/30 bg-white/75 p-6 shadow-[0_30px_80px_-40px_rgba(7,33,69,0.75)] backdrop-blur-xl sm:p-8">
        <div className="mb-7 text-center sm:mb-8">
          <p className="inline-flex items-center rounded-full bg-[#0f3d5e]/10 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#0f3d5e]">
            COMMUNITY MEMBERSHIP
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0d2742] sm:text-4xl">Create Your Member Profile</h2>
          <p className="mt-2 text-sm text-[#345070] sm:text-base">Fill details once, verify your email, and join your jamaat dashboard.</p>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${isSuccessMessage ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>
            {message}
          </div>
        )}

        <form className="space-y-6 text-gray-700" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <div className="register-field">
              <label className="register-label">Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" className="register-input" required />
            </div>

            <div className="register-field">
              <label className="register-label">Father Name</label>
              <input name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Father full name" className="register-input" />
            </div>

            <div className="register-field">
              <label className="register-label">Mother Name</label>
              <input name="motherName" value={form.motherName} onChange={handleChange} placeholder="Mother full name" className="register-input" />
            </div>

            <div className="register-field">
              <label className="register-label">Family Members</label>
              <input name="familyMembers" value={form.familyMembers} onChange={handleChange} type="number" min="1" placeholder="e.g. 4" className="register-input" />
            </div>

            <div className="register-field">
              <label className="register-label">Date of Birth</label>
              <input name="dob" value={form.dob} onChange={handleChange} type="date" className="register-input" />
            </div>

            <div className="register-field">
              <label className="register-label">CNIC Number</label>
              <input name="cnic" value={form.cnic} onChange={handleChange} placeholder="XXXXX-XXXXXXX-X" className="register-input" />
            </div>

            <div className="register-field">
              <label className="register-label">Mobile Number</label>
              <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="03XX-XXXXXXX" className="register-input" required />
            </div>

            <div className="register-field">
              <label className="register-label">Jamaat</label>
              <select
                name="jamaat"
                value={form.jamaat}
                onChange={handleChange}
                className="register-input"
                required
              >
                <option value="">Select jamaat</option>
                {groups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            <div className="register-field md:col-span-2">
              <label className="register-label">Email Address</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" className="register-input" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !form.email} className="rounded-lg bg-[#0f3d5e] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0b2f49] disabled:opacity-60">
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
                <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || !otpSent || !otpCode} className="rounded-lg bg-[#157347] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f5b38] disabled:opacity-60">
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter 6-digit OTP" className="register-input mt-3" />
              <p className="mt-2 text-xs font-medium text-[#586f89]">{otpVerified ? 'Email verified.' : 'Please verify your email before registering.'}</p>
            </div>

            <div className="register-field md:col-span-2">
              <label className="register-label">Password</label>
              <div className="relative">
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  className="register-input w-full pr-10"
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
            <div className="register-field">
              <label className="register-label">Home Status</label>
              <select name="homeStatus" value={form.homeStatus} onChange={handleChange} className="register-input">
                <option>Owner</option>
                <option>Rent</option>
              </select>
            </div>

            <div className="register-field">
              <label className="register-label">Occupation</label>
              <select name="occupation" value={form.occupation} onChange={handleChange} className="register-input">
                <option>Employee</option>
                <option>Business Man</option>
              </select>
            </div>
          </div>

          {form.occupation === 'Business Man' && (
            <div className="register-field">
              <label className="register-label">Business Name</label>
              <input name="businessName" value={form.businessName} onChange={handleChange} placeholder="Your business name" className="register-input" />
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0f3d5e] via-[#1465a5] to-[#10a0b8] px-4 py-3 text-base font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:scale-[1.01] disabled:opacity-60 sm:w-64"
            >
              {loading ? 'Submitting...' : 'Register'}
            </button>

            <div className="mt-4 text-sm text-[#35516f]">
              <span className="mr-2">Already have an account?</span>
              <a href="/login" className="font-semibold text-[#0f3d5e] hover:text-[#1465a5]">Login</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
