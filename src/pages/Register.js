import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import API from '../api/axios.js';
const USERNAME_REGEX = /^[a-z0-9._-]+$/;
export default function Register() {
    const [form, setForm] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const usernameError = useMemo(() => {
        if (!form.username)
            return 'Username is required.';
        if (/\s/.test(form.username))
            return 'Username cannot contain spaces.';
        if (/[A-Z]/.test(form.username))
            return 'Username cannot contain capital letters.';
        if (!USERNAME_REGEX.test(form.username))
            return 'Use only lowercase letters, numbers, dot, underscore, or hyphen.';
        return '';
    }, [form.username]);
    function handleChange(e) {
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
            }
            catch {
                try {
                    const res = await API.post('/auth/check-username', { username: form.username });
                    if (typeof res.data?.available === 'boolean') {
                        available = res.data.available;
                    }
                }
                catch {
                    available = true;
                }
            }
            setUsernameAvailable(available);
            if (!available) {
                setMessage('This username is already taken. Please choose another one.');
            }
            return available;
        }
        finally {
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
            }
            else {
                setMessage(res.data.message || 'Unable to send OTP.');
            }
        }
        catch (err) {
            setMessage(err.response?.data?.message || 'Unable to send OTP.');
        }
        finally {
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
            }
            else {
                setOtpVerified(false);
                setMessage(res.data.message || 'OTP verification failed.');
            }
        }
        catch (err) {
            setOtpVerified(false);
            setMessage(err.response?.data?.message || 'OTP verification failed.');
        }
        finally {
            setVerifyingOtp(false);
        }
    }
    async function handleSubmit(e) {
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
            }
            else {
                setMessage(res.data.message || 'Something went wrong.');
            }
        }
        catch (err) {
            const errorMessage = err.response?.data?.message || 'Server error.';
            const duplicateUsername = /username.*(exist|taken|already)/i.test(errorMessage);
            if (duplicateUsername) {
                setUsernameAvailable(false);
            }
            setMessage(errorMessage);
        }
        finally {
            setLoading(false);
        }
    }
    const isSuccessMessage = message.toLowerCase().includes('successful') ||
        message.toLowerCase().includes('verified') ||
        message.toLowerCase().includes('sent');
    return (_jsx("div", { className: "px-4 py-8 sm:px-6 lg:px-8", children: _jsxs("div", { className: "page-card mx-auto w-full max-w-2xl p-6 sm:p-8", children: [_jsxs("div", { className: "mb-7 text-center sm:mb-8", children: [_jsx("p", { className: "inline-flex items-center rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-blue-700", children: "COMMUNITY MEMBERSHIP" }), _jsx("h2", { className: "page-title mt-3 text-3xl sm:text-4xl", children: "Create Your Account" }), _jsx("p", { className: "page-subtitle mt-2 text-sm sm:text-base", children: "Register with your basic account details." })] }), message && (_jsx("div", { className: `mb-6 rounded-xl border px-4 py-3 text-sm ${isSuccessMessage ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-700'}`, children: message })), _jsxs("form", { className: "space-y-5 text-gray-700", onSubmit: handleSubmit, children: [_jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Full Name" }), _jsx("input", { name: "fullName", value: form.fullName, onChange: handleChange, placeholder: "Your full name", className: "form-input", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Username" }), _jsx("input", { name: "username", value: form.username, onChange: handleChange, onBlur: checkUsernameUnique, placeholder: "e.g. ali_khan", className: "form-input", required: true, autoComplete: "off" }), _jsx("p", { className: "mt-2 text-xs font-medium text-slate-500", children: usernameError || (checkingUsername
                                        ? 'Checking username availability...'
                                        : usernameAvailable === false
                                            ? 'Username already taken.'
                                            : usernameAvailable === true
                                                ? 'Username is available.'
                                                : 'Use lowercase only, no spaces.') })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Email" }), _jsx("input", { name: "email", value: form.email, onChange: handleChange, type: "email", placeholder: "you@example.com", className: "form-input", required: true }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [_jsx("button", { type: "button", onClick: handleSendOtp, disabled: sendingOtp || !form.email, className: "btn-primary rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60", children: sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP' }), _jsx("button", { type: "button", onClick: handleVerifyOtp, disabled: verifyingOtp || !otpSent || !otpCode, className: "rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60", children: verifyingOtp ? 'Verifying...' : 'Verify OTP' })] }), _jsx("input", { value: otpCode, onChange: (e) => setOtpCode(e.target.value), placeholder: "Enter 6-digit OTP", className: "form-input mt-3" }), _jsx("p", { className: "mt-2 text-xs font-medium text-slate-500", children: otpVerified ? 'Email verified.' : 'Please verify your email before registering.' })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { name: "password", value: form.password, onChange: handleChange, type: showPassword ? 'text' : 'password', placeholder: "Enter password", className: "form-input w-full pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword((value) => !value), onMouseDown: (e) => e.preventDefault(), className: "absolute inset-y-0 right-2 flex items-center appearance-none border-none bg-transparent p-0 text-gray-500", "aria-label": showPassword ? 'Hide password' : 'Show password', style: { border: 'none', background: 'transparent', boxShadow: 'none' }, children: showPassword ? (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.98 8.223A10.477 10.477 0 001.5 12c1.5 4.5 5.7 7.5 10.5 7.5 1.6 0 3.1-.3 4.5-.9M6.6 6.6A10.45 10.45 0 0112 4.5c4.8 0 9 3 10.5 7.5a10.4 10.4 0 01-1.3 2.4M9.88 9.88a3 3 0 104.24 4.24M3.5 3.5l17 17" }) })) : (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { name: "confirmPassword", value: form.confirmPassword, onChange: handleChange, type: showConfirmPassword ? 'text' : 'password', placeholder: "Confirm password", className: "form-input w-full pr-10", required: true }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword((value) => !value), onMouseDown: (e) => e.preventDefault(), className: "absolute inset-y-0 right-2 flex items-center appearance-none border-none bg-transparent p-0 text-gray-500", "aria-label": showConfirmPassword ? 'Hide confirm password' : 'Show confirm password', style: { border: 'none', background: 'transparent', boxShadow: 'none' }, children: showConfirmPassword ? (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.98 8.223A10.477 10.477 0 001.5 12c1.5 4.5 5.7 7.5 10.5 7.5 1.6 0 3.1-.3 4.5-.9M6.6 6.6A10.45 10.45 0 0112 4.5c4.8 0 9 3 10.5 7.5a10.4 10.4 0 01-1.3 2.4M9.88 9.88a3 3 0 104.24 4.24M3.5 3.5l17 17" }) })) : (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })) })] })] }), _jsxs("div", { className: "pt-2 text-center", children: [_jsx("button", { type: "submit", disabled: loading || checkingUsername || sendingOtp || verifyingOtp, className: "btn-primary w-full rounded-xl px-4 py-3 text-base font-bold transition disabled:opacity-60", children: loading ? 'Submitting...' : 'Register' }), _jsxs("div", { className: "mt-4 text-sm text-slate-600", children: [_jsx("span", { className: "mr-2", children: "Already have an account?" }), _jsx("a", { href: "/login", className: "font-semibold text-blue-700 hover:text-blue-800", children: "Login" })] })] })] })] }) }));
}
