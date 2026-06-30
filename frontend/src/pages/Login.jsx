import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check, ArrowLeft, KeyRound, RefreshCw, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import api from '../utils/api.js';

// Role → redirect path mapping (single source of truth)
const ROLE_REDIRECT = {
  SUPER_ADMIN:  '/superadmin',
  TENANT_ADMIN: '/admin',
  MANAGER:      '/',
  RECEPTIONIST: '/rooms',
  CASHIER:      '/pos',
  CAPTAIN:       '/captain',
  CHEF:         '/kitchen',
  HOUSEKEEPING: '/housekeeping',
  ACCOUNTANT:   '/reports',
};

const demoRoles = [
  {
    name: 'Super Admin',
    email: 'SuperAdmin@hoteloraa.com',
    password: 'superadminsecret',
    color: 'from-purple-600 to-indigo-700',
    badge: 'SA',
    desc: 'Full SaaS control',
  },
];

// ─── Sub-component: Step 2 — Request Reset Code ──────────────────────────────
function ForgotStep({ onBack, onCodeReceived }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.forgotPassword(email);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If we got a token, show the "code reveal" screen
  if (result) {
    return (
      <div className="w-full flex flex-col items-center gap-5">
        {/* Success header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50/50 border border-emerald-200/50 flex items-center justify-center mb-1">
            <ShieldCheck className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
          </div>
          <h4 className="font-display font-medium text-2xl text-slate-900">Check Your Email</h4>
          <p className="text-slate-800 text-[11px] font-bold leading-relaxed max-w-[280px]">
            {result.message || 'If that email is registered, a reset code has been sent.'}
          </p>
        </div>

        {false ? (
          <>
            {/* Token display box */}
            <div className="w-full bg-navy/5 border border-navy/10 rounded-2xl p-4 flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Your Reset Code</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-3xl font-black text-[#0B1F3A] tracking-[0.3em] select-all">
                  {' '}
                </span>
                <button
                  type="button"
                  onClick={() => {}}
                  title="Copy code"
                  className="p-1.5 rounded-lg bg-white/50 border border-white/60 hover:border-gold/50 text-slate-900 hover:text-gold transition-all active:scale-95"
                >
                  {false
                    ? <KeyRound className="w-4 h-4 text-emerald-500" />
                    : <KeyRound className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-800 font-semibold">
                ⏱ Expires in <span className="font-bold text-amber-600">{result.expiresIn || '15 minutes'}</span>
              </p>
            </div>

            {/* Dev note */}
            <div className="w-full bg-amber-50 border border-amber-200/70 rounded-xl p-3 text-[10px] text-amber-700 leading-relaxed">
              <strong>Note:</strong> In production, this code would be sent to <span className="font-mono font-bold">{result.email}</span> via email. Copy the code above and use it on the next step.
            </div>

            <button
              type="button"
              onClick={() => onCodeReceived('')}
              className="w-full py-3.5 bg-[#0B1F3A] hover:bg-[#142d50] text-white rounded-full font-bold text-xs tracking-wider transition-all shadow-md active:scale-[0.98] uppercase flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Use This Code to Reset Password
            </button>
          </>
        ) : (
          // Email not found — generic message shown
          <div className="w-full bg-white/40 border border-white/40 rounded-2xl p-4 text-center text-[11px] text-slate-800 font-medium leading-relaxed">
            If an account with that email exists, a reset code would be sent there.
          </div>
        )}

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* Header */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="w-14 h-14 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center mb-1">
          <KeyRound className="w-6 h-6 text-navy" strokeWidth={1.5} />
        </div>
        <h4 className="font-display font-medium text-2xl text-slate-900">Forgot Password?</h4>
        <p className="text-slate-800 text-[11px] font-bold leading-relaxed max-w-[280px]">
          Enter your email address and we'll send a secure reset code if the account exists.
        </p>
      </div>

      {error && (
        <div className="w-full p-3 bg-danger-pale border border-danger/20 rounded-xl text-danger text-[11px] font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate/60">
            <Mail className="w-4 h-4" />
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            className="w-full pl-11 pr-4 py-3.5 glass-input rounded-full text-xs font-semibold placeholder-slate/50 transition-all"
            placeholder="Your registered email address"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#0B1F3A] hover:bg-[#142d50] disabled:bg-[#0B1F3A]/70 text-white rounded-full font-bold text-xs tracking-wider transition-all shadow-md active:scale-[0.98] uppercase flex items-center justify-center gap-2"
        >
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Code...</>
            : <><KeyRound className="w-4 h-4" /> Generate Reset Code</>}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Sign In
      </button>
    </div>
  );
}

// ─── Sub-component: Step 3 — Reset Password ──────────────────────────────────
function ResetStep({ prefillToken, onBack, onSuccess }) {
  const [token, setToken]               = useState(prefillToken || '');
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const passwordsMatch = newPassword && confirmPass && newPassword === confirmPass;
  const passwordStrength = newPassword.length >= 8
    ? (newPassword.match(/[A-Z]/) && newPassword.match(/[0-9]/) ? 'strong' : 'medium')
    : newPassword.length >= 6 ? 'weak' : '';

  const strengthColors = { weak: 'bg-red-400', medium: 'bg-amber-400', strong: 'bg-emerald-500' };
  const strengthLabels = { weak: 'Weak', medium: 'Medium', strong: 'Strong' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.resetPassword(token.trim().toUpperCase(), newPassword, confirmPass);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* Header */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="w-14 h-14 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center mb-1">
          <Lock className="w-6 h-6 text-navy" strokeWidth={1.5} />
        </div>
        <h4 className="font-display font-medium text-2xl text-slate-900">Set New Password</h4>
        <p className="text-slate-800 text-[11px] font-bold leading-relaxed max-w-[280px]">
          Enter your reset code and choose a strong new password.
        </p>
      </div>

      {error && (
        <div className="w-full p-3 bg-danger-pale border border-danger/20 rounded-xl text-danger text-[11px] font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        {/* Reset token input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate/60">
            <KeyRound className="w-4 h-4" />
          </span>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            className="w-full pl-11 pr-4 py-3.5 glass-input rounded-full font-mono text-sm font-black placeholder-slate/40 tracking-widest transition-all text-center uppercase"
            placeholder="RESET CODE"
            maxLength={8}
            autoFocus={!prefillToken}
          />
        </div>

        {/* New Password */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate/60">
            <Lock className="w-4 h-4" />
          </span>
          <input
            type={showNew ? 'text' : 'password'}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full pl-11 pr-11 py-3.5 glass-input rounded-full text-xs font-semibold placeholder-slate/50 transition-all"
            placeholder="New password (min. 6 characters)"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate/60 hover:text-navy transition-colors"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password strength bar */}
        {newPassword && (
          <div className="px-1 flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {['weak', 'medium', 'strong'].map((level, i) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    (passwordStrength === 'weak' && i === 0) ||
                    (passwordStrength === 'medium' && i <= 1) ||
                    (passwordStrength === 'strong' && i <= 2)
                      ? strengthColors[passwordStrength]
                      : 'bg-border-cream'
                  }`}
                />
              ))}
            </div>
            <span className={`text-[10px] font-bold ${
              passwordStrength === 'strong' ? 'text-emerald-600'
              : passwordStrength === 'medium' ? 'text-amber-600'
              : 'text-red-500'
            }`}>
              {strengthLabels[passwordStrength]}
            </span>
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate/60">
            <Lock className="w-4 h-4" />
          </span>
          <input
            type={showConfirm ? 'text' : 'password'}
            required
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            autoComplete="new-password"
            className={`w-full pl-11 pr-11 py-3.5 glass-input rounded-full text-xs font-semibold placeholder-slate/50 transition-all ${
              confirmPass
                ? passwordsMatch
                  ? 'border-emerald-500 focus:ring-emerald-300 focus:bg-white/60'
                  : 'border-red-400 focus:ring-red-300 focus:bg-white/60'
                : ''
            }`}
            placeholder="Confirm new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate/60 hover:text-navy transition-colors"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {/* Match indicator */}
          {confirmPass && (
            <div className={`absolute inset-y-0 right-10 flex items-center ${passwordsMatch ? 'text-emerald-500' : 'text-red-400'}`}>
              {passwordsMatch
                ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                : <span className="text-[10px] font-bold">✗</span>}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !passwordsMatch}
          className="w-full py-3.5 bg-[#0B1F3A] hover:bg-[#142d50] disabled:bg-[#0B1F3A]/50 text-white rounded-full font-bold text-xs tracking-wider transition-all shadow-md active:scale-[0.98] uppercase flex items-center justify-center gap-2 mt-1"
        >
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Resetting Password...</>
            : <><ShieldCheck className="w-4 h-4" /> Reset Password</>}
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Forgot Password
      </button>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
import logo from '../assets/logo.png';
import newLoginBg from '../assets/new_login_bg.png';

function Login() {
  const navigate = useNavigate();

  // View state: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState('login');

  // Login form
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [activeRole, setActiveRole]     = useState(null);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null); // { type: 'success'|'info', message }

  useEffect(() => {
    // Only show the "logged out" toast if the user was explicitly redirected
    // after a logout action (detected via ?loggedOut=1 query param).
    const params = new URLSearchParams(window.location.search);
    if (params.get('loggedOut') === '1') {
      setToast({ type: 'success', message: 'Logged out successfully' });
      // Clean the URL so it doesn't persist on refresh
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Pre-fill token from forgot step
  const [prefillToken, setPrefillToken] = useState('');

  /** Redirect helper using the role map */
  const redirectByRole = (userRole) => {
    const path = ROLE_REDIRECT[userRole] || '/';
    navigate(path);
  };

  /** Manual form submit */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await api.login(email, password);
      redirectByRole(session.user.userRole);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /** One-click demo role login */
  const handleRoleSelect = async (role) => {
    setError('');
    setActiveRole(role.name);
    setEmail(role.email);
    setPassword(role.password);
    try {
      const session = await api.login(role.email, role.password);
      redirectByRole(session.user.userRole);
    } catch (err) {
      setError(err.message || `Could not log in as ${role.name}. Make sure the backend is running.`);
    } finally {
      setActiveRole(null);
    }
  };

  // Called when reset succeeds
  const handleResetSuccess = () => {
    setView('login');
    setToast({ type: 'success', message: '✅ Password reset! Please sign in with your new password.' });
    setTimeout(() => setToast(null), 6000);
  };

  // Called when code is received → go to step 3
  const handleCodeReceived = (token) => {
    setPrefillToken(token);
    setView('reset');
  };

  const anyLoading = loading || activeRole !== null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream select-none relative overflow-hidden font-sans">

      {/* Premium Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${newLoginBg})` }}
      />
      {/* Luxury Color Overlay for Contrast & Glassmorphism Blur */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-navy/60 via-navy/20 to-gold/25" />

      {/* Liquid Glass Glowing Ambient Blobs */}
      <div className="absolute top-[35%] left-[38%] w-[280px] h-[280px] bg-gold/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-[30%] right-[32%] w-[320px] h-[320px] bg-navy/30 rounded-full blur-[90px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div className="absolute top-6 right-6 z-50 bg-white border border-border-cream/80 text-charcoal px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-stone-200/50 animate-slideIn">
          <span className="text-xs font-semibold">{toast.message}</span>
          <div className="w-5 h-5 bg-[#1E9E6A]/10 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-[#1E9E6A] stroke-[3px]" />
          </div>
        </div>
      )}

      {/* Main Card with Premium Liquid Glass */}
      <div className="w-full max-w-[440px] z-10 transition-all duration-500 hover:scale-[1.01]">
        <div className="liquid-glass rounded-[2rem] p-8 md:p-10 shadow-2xl flex flex-col items-center">

          {/* Brand Header — always visible */}
          <img src={logo} alt="Hoteloraa Logo" className="h-16 w-auto object-contain mb-4 select-none" />
          <span className="px-3.5 py-0.5 border border-[#D4AF37]/40 text-[9px] font-bold text-[#D4AF37] rounded-full tracking-widest uppercase mb-4 bg-[#D4AF37]/10 select-none">
            Staff Portal
          </span>

          {/* ── STEP 1: Normal Login ──────────────────────────────────────── */}
          {view === 'login' && (
            <>
              <h3 className="font-display font-medium text-4xl text-slate-900 tracking-tight mt-2 mb-1">Welcome Back</h3>
              <p className="text-slate-800 text-xs font-semibold tracking-wide text-center mb-6">Sign in to your property management software</p>

              {error && (
                <div className="w-full mb-4 p-3 bg-danger-pale border border-danger/20 rounded-xl text-danger text-[11px] font-bold text-center">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="w-full space-y-4">
                {/* Email */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate/60">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 glass-input rounded-full text-xs font-semibold placeholder-slate/50 transition-all"
                    placeholder="Email address"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate/60">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-3.5 glass-input rounded-full text-xs font-semibold placeholder-slate/50 transition-all"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate/60 hover:text-navy transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Remember me & forgot */}
                <div className="flex items-center justify-between text-xs font-bold text-navy pt-1 pb-2">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/40 text-navy focus:ring-gold accent-gold cursor-pointer bg-white/20"
                    />
                    <label htmlFor="remember-me" className="ml-2 font-medium text-navy/70 cursor-pointer text-[11px]">
                      Remember Me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setError(''); setView('forgot'); }}
                    className="text-[11px] font-semibold text-navy hover:text-gold hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={anyLoading}
                  className="w-full py-3.5 bg-[#0B1F3A] hover:bg-[#142d50] disabled:bg-[#0B1F3A]/70 text-white rounded-full font-semibold text-sm tracking-wider transition-all shadow-md active:scale-[0.98] uppercase"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative w-full my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white/50 backdrop-blur-md px-3 py-0.5 text-slate-800 font-extrabold uppercase tracking-widest text-[9px] rounded-full border border-white/30">
                    Quick Demo Access
                  </span>
                </div>
              </div>

              {/* Custom Demo Dropdown */}
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                  disabled={anyLoading}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-full glass-input text-xs font-bold text-slate-900 transition-all hover:bg-white/60 active:scale-[0.99] border border-white/40"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    {activeRole ? `Logging in as ${activeRole}...` : 'Select Demo Account...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-800 transition-transform duration-200 ${demoDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {demoDropdownOpen && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 z-50 rounded-2xl border border-white/50 bg-white/95 backdrop-blur-xl shadow-2xl p-2 space-y-1 max-h-56 overflow-y-auto">
                    {demoRoles.map((role) => {
                      const isThisLoading = activeRole === role.name;
                      return (
                        <button
                          key={role.name}
                          type="button"
                          onClick={() => {
                            setDemoDropdownOpen(false);
                            handleRoleSelect(role);
                          }}
                          disabled={anyLoading}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-navy/5 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center text-white text-[10px] font-black shadow-sm shrink-0`}>
                              {role.badge}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-tight">{role.name}</p>
                              <p className="text-[10px] text-slate-700 leading-tight">{role.desc}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md group-hover:bg-white transition-colors">
                            {role.email.split('@')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-[9px] text-slate-800 font-bold text-center mt-3">
                Select Super Admin to instantly log in
              </p>
            </>
          )}

          {/* ── STEP 2: Forgot Password ───────────────────────────────────── */}
          {view === 'forgot' && (
            <ForgotStep
              onBack={() => setView('login')}
              onCodeReceived={handleCodeReceived}
            />
          )}

          {/* ── STEP 3: Reset Password ────────────────────────────────────── */}
          {view === 'reset' && (
            <ResetStep
              prefillToken={prefillToken}
              onBack={() => setView('forgot')}
              onSuccess={handleResetSuccess}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default Login;
