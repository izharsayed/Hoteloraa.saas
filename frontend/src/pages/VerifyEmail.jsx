import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import api from '../utils/api.js';
import logo from '../assets/logo.png';
import newLoginBg from '../assets/new_login_bg.png';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email link.');
      return;
    }

    const performVerification = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully! You can now log in to your portal.');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification token.');
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream select-none relative overflow-hidden font-sans">
      {/* Premium Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${newLoginBg})` }}
      />
      {/* Luxury Color Overlay for Contrast */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-navy/60 via-navy/20 to-gold/25" />

      {/* Liquid Glass Ambient Blobs */}
      <div className="absolute top-[35%] left-[38%] w-[280px] h-[280px] bg-gold/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[30%] right-[32%] w-[320px] h-[320px] bg-navy/30 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-[440px] z-10 transition-all duration-500 hover:scale-[1.01]">
        <div className="liquid-glass rounded-[2rem] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center">
          
          <img src={logo} alt="Hoteloraa Logo" className="h-16 w-auto object-contain mb-4 select-none" />
          <span className="px-3.5 py-0.5 border border-[#D4AF37]/40 text-[9px] font-bold text-[#D4AF37] rounded-full tracking-widest uppercase mb-6 bg-[#D4AF37]/10 select-none">
            Staff Portal
          </span>

          {status === 'verifying' && (
            <div className="space-y-4 py-6">
              <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto" />
              <h3 className="font-display font-medium text-2xl text-slate-900 tracking-tight">Verifying Email</h3>
              <p className="text-slate-800 text-xs font-semibold tracking-wide">Please wait while we activate your account...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-4 w-full">
              <div className="w-14 h-14 bg-[#1E9E6A]/10 border border-[#1E9E6A]/20 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <ShieldCheck className="w-8 h-8 text-[#1E9E6A]" />
              </div>
              <h3 className="font-display font-medium text-2xl text-slate-900 tracking-tight">Verified Successfully</h3>
              <p className="text-slate-800 text-xs font-semibold tracking-wide px-2 leading-relaxed">{message}</p>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-[#0B1F3A] hover:bg-[#142d50] text-white rounded-full font-bold text-xs tracking-wider transition-all shadow-md active:scale-[0.98] uppercase flex items-center justify-center gap-2 mt-6"
              >
                Proceed to Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-4 w-full">
              <div className="w-14 h-14 bg-danger/10 border border-danger/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldAlert className="w-8 h-8 text-danger" />
              </div>
              <h3 className="font-display font-medium text-2xl text-slate-900 tracking-tight">Verification Failed</h3>
              <p className="text-danger text-xs font-bold tracking-wide px-2 leading-relaxed">{message}</p>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold text-xs tracking-wider transition-all shadow-md active:scale-[0.98] uppercase flex items-center justify-center gap-2 mt-6"
              >
                Go Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
