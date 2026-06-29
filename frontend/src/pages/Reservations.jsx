import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CalendarRange, Plus, Search, Calendar, ChevronRight, ChevronLeft, UserPlus, X,
  User, Phone, Mail, Bed, FileText, Users, DollarSign, Camera, Upload, Trash2,
  Image, Check, Clock, MapPin, Building, Car, Briefcase, Star, CheckCircle,
  AlertCircle, Printer, Send, CreditCard, Banknote, Smartphone, RefreshCw,
  Shield, Globe, Hash, ChevronDown, Filter, Hotel, Info, XCircle
} from 'lucide-react';
import api from '../utils/api';
import { createPortal } from 'react-dom';

// ─── Constants ────────────────────────────────────────────────────────────────

const BOOKING_SOURCES = [
  'WALK_IN', 'PHONE', 'WEBSITE', 'BOOKING_COM', 'AGODA', 'EXPEDIA',
  'MAKEMYTRIP', 'GOIBIBO', 'CORPORATE', 'TRAVEL_AGENT'
];
const SOURCE_LABELS = {
  WALK_IN: 'Walk-in', PHONE: 'Phone', WEBSITE: 'Website',
  BOOKING_COM: 'Booking.com', AGODA: 'Agoda', EXPEDIA: 'Expedia',
  MAKEMYTRIP: 'MakeMyTrip', GOIBIBO: 'Goibibo',
  CORPORATE: 'Corporate', TRAVEL_AGENT: 'Travel Agent'
};
const RATE_PLANS = [
  { value: 'EP', label: 'EP — Room Only' },
  { value: 'CP', label: 'CP — Breakfast Included' },
  { value: 'MAP', label: 'MAP — Breakfast + Dinner' },
  { value: 'AP', label: 'AP — All Meals' },
  { value: 'CORPORATE', label: 'Corporate Rate' },
  { value: 'STANDARD', label: 'Standard Rate' },
];
const ID_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'VOTER_ID', label: 'Voter ID' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'OTHER', label: 'Other' },
];
const SPECIAL_REQUESTS = [
  'Extra Bed', 'Late Check-in', 'Early Check-in', 'Airport Pickup',
  'Non-Smoking Room', 'High Floor', 'Anniversary Decoration', 'Birthday Decoration',
  'Quiet Room', 'Sea View', 'Twin Beds', 'Double Bed'
];
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building },
  { value: 'CORPORATE', label: 'Corporate Billing', icon: Briefcase },
  { value: 'PAY_LATER', label: 'Pay Later', icon: Clock },
];
const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  CONFIRMED:  { label: 'Confirmed',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CHECKED_IN: { label: 'Checked In',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  CHECKED_OUT:{ label: 'Checked Out', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  CANCELLED:  { label: 'Cancelled',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
  NO_SHOW:    { label: 'No Show',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
};
const TAX_RATE = 0.12; // 12% GST

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps, stepLabels }) {
  return (
    <div className="flex items-center w-full px-2">
      {stepLabels.map((label, idx) => {
        const step = idx + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                  isActive ? 'bg-navy border-navy text-white shadow-lg' :
                  'bg-white border-border-cream text-slate'}`}>
                {isCompleted ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
                ${isActive ? 'text-navy' : isCompleted ? 'text-emerald-600' : 'text-slate/50'}`}>
                {label}
              </span>
            </div>
            {idx < totalSteps - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded transition-all duration-300
                ${isCompleted ? 'bg-emerald-400' : 'bg-border-cream'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1: Reservation Details ─────────────────────────────────────────────

function Step1({ data, onChange, roomTypes }) {
  const nights = data.checkInDate && data.checkOutDate
    ? Math.max(0, Math.round((new Date(data.checkOutDate) - new Date(data.checkInDate)) / 86400000))
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-navy">Reservation Details</h2>
        <p className="text-slate text-xs mt-0.5">Enter booking dates, guest count, and room preferences</p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Check-in Date *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
            <input type="date" value={data.checkInDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => onChange('checkInDate', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold transition-all" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Check-out Date *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
            <input type="date" value={data.checkOutDate}
              min={data.checkInDate || new Date().toISOString().split('T')[0]}
              onChange={e => onChange('checkOutDate', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold transition-all" />
          </div>
        </div>
      </div>

      {/* Nights badge */}
      {nights > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gold-pale/40 border border-gold/20 rounded-xl">
          <Hotel className="w-4 h-4 text-gold" />
          <span className="text-xs font-bold text-navy">{nights} Night{nights > 1 ? 's' : ''}</span>
          <span className="text-xs text-slate ml-1">
            {new Date(data.checkInDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' → '}
            {new Date(data.checkOutDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}

      {/* Guests & Rooms */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Adults *</label>
          <div className="flex items-center border border-border-cream/80 rounded-xl overflow-hidden bg-cream/20">
            <button type="button" onClick={() => onChange('adults', Math.max(1, data.adults - 1))}
              className="px-3 py-2 text-navy font-bold hover:bg-gold-pale/30 transition-all">−</button>
            <span className="flex-1 text-center font-bold text-navy text-sm">{data.adults}</span>
            <button type="button" onClick={() => onChange('adults', Math.min(10, data.adults + 1))}
              className="px-3 py-2 text-navy font-bold hover:bg-gold-pale/30 transition-all">+</button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Children</label>
          <div className="flex items-center border border-border-cream/80 rounded-xl overflow-hidden bg-cream/20">
            <button type="button" onClick={() => onChange('children', Math.max(0, data.children - 1))}
              className="px-3 py-2 text-navy font-bold hover:bg-gold-pale/30 transition-all">−</button>
            <span className="flex-1 text-center font-bold text-navy text-sm">{data.children}</span>
            <button type="button" onClick={() => onChange('children', Math.min(10, data.children + 1))}
              className="px-3 py-2 text-navy font-bold hover:bg-gold-pale/30 transition-all">+</button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Rooms *</label>
          <div className="flex items-center border border-border-cream/80 rounded-xl overflow-hidden bg-cream/20">
            <button type="button" onClick={() => onChange('numberOfRooms', Math.max(1, data.numberOfRooms - 1))}
              className="px-3 py-2 text-navy font-bold hover:bg-gold-pale/30 transition-all">−</button>
            <span className="flex-1 text-center font-bold text-navy text-sm">{data.numberOfRooms}</span>
            <button type="button" onClick={() => onChange('numberOfRooms', Math.min(20, data.numberOfRooms + 1))}
              className="px-3 py-2 text-navy font-bold hover:bg-gold-pale/30 transition-all">+</button>
          </div>
        </div>
      </div>

      {/* Room Type & Rate Plan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Room Type *</label>
          <div className="relative">
            <Bed className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
            <select value={data.roomTypeId} onChange={e => onChange('roomTypeId', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold appearance-none transition-all">
              <option value="">Any Room Type</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name} — ₹{rt.basePrice?.toLocaleString('en-IN')}/night</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Rate Plan *</label>
          <div className="relative">
            <Star className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
            <select value={data.ratePlan} onChange={e => onChange('ratePlan', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold appearance-none transition-all">
              {RATE_PLANS.map(rp => <option key={rp.value} value={rp.value}>{rp.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Source & Arrival */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Booking Source *</label>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
            <select value={data.source} onChange={e => onChange('source', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold appearance-none transition-all">
              {BOOKING_SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Expected Arrival</label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
            <input type="time" value={data.expectedArrival}
              onChange={e => onChange('expectedArrival', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Guest Information ────────────────────────────────────────────────

// ─── Step 2: Guest Information ────────────────────────────────────────────────

function Step2({ guestData, onChange, onSelectGuest, selectedGuest, onClearGuest, idDocuments, setIdDocuments }) {
  const [guestTab, setGuestTab] = useState(selectedGuest ? 'existing' : 'new');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [capturingState, setCapturingState] = useState(null); // { docId, side }
  const [stream, setStream] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const videoRef = useRef(null);

  const searchGuests = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const data = await api.get(`/guests?search=${encodeURIComponent(q)}`);
      setSearchResults(data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchGuests(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery, searchGuests]);

  const startCamera = async (docId, side) => {
    if (stream) {
      stopCamera();
    }
    try {
      setCapturingState({ docId, side });
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      alert('Could not access camera. Please upload an image instead.');
      setCapturingState(null);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCapturingState(null);
  };

  const stitchFrontAndBack = async (frontUrl, backUrl) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const imgFront = new window.Image();
      const imgBack = new window.Image();
      imgFront.crossOrigin = 'anonymous';
      imgBack.crossOrigin = 'anonymous';

      let loaded = 0;
      const checkLoaded = () => {
        loaded++;
        if (loaded === 2) {
          const targetHeight = 400;
          const frontWidth = imgFront.height ? (imgFront.width / imgFront.height) * targetHeight : 400;
          const backWidth = imgBack.height ? (imgBack.width / imgBack.height) * targetHeight : 400;

          canvas.width = frontWidth + backWidth + 20; // 20px gap
          canvas.height = targetHeight + 20; // padding

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.drawImage(imgFront, 10, 10, frontWidth, targetHeight);
          ctx.drawImage(imgBack, 10 + frontWidth + 10, 10, backWidth, targetHeight);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Stitching failed'));
            }
          }, 'image/jpeg', 0.9);
        }
      };

      imgFront.onload = checkLoaded;
      imgBack.onload = checkLoaded;
      imgFront.onerror = () => reject(new Error('Failed to load front image'));
      imgBack.onerror = () => reject(new Error('Failed to load back image'));

      const getAbsoluteUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `http://localhost:5000${url}`;
      };

      imgFront.src = getAbsoluteUrl(frontUrl);
      imgBack.src = getAbsoluteUrl(backUrl);
    });
  };

  const handleDocumentChange = async (docId, side, file) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.upload('/guests/upload-id', fd);

      const updatedDocs = await Promise.all(idDocuments.map(async (doc) => {
        if (doc.id === docId) {
          const newDoc = { ...doc, [`${side}Url`]: res.url };
          if (newDoc.frontUrl && newDoc.backUrl) {
            try {
              const stitchedBlob = await stitchFrontAndBack(newDoc.frontUrl, newDoc.backUrl);
              const stitchedFd = new FormData();
              stitchedFd.append('file', stitchedBlob, `stitched_${docId}.jpg`);
              const stitchedRes = await api.upload('/guests/upload-id', stitchedFd);
              newDoc.idProofUrl = stitchedRes.url;
            } catch (mergeErr) {
              console.error('Stitching failed:', mergeErr);
            }
          }
          return newDoc;
        }
        return doc;
      }));

      setIdDocuments(updatedDocs);
    } catch (e) {
      alert(e.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (docId, side, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleDocumentChange(docId, side, file);
  };

  const capturePhoto = (docId, side) => {
    if (!videoRef.current) return;
    setUploadingImage(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) { setUploadingImage(false); return; }
      try {
        const fd = new FormData();
        fd.append('file', blob, `${side}_${docId}.jpg`);
        const res = await api.upload('/guests/upload-id', fd);

        const updatedDocs = await Promise.all(idDocuments.map(async (doc) => {
          if (doc.id === docId) {
            const newDoc = { ...doc, [`${side}Url`]: res.url };
            if (newDoc.frontUrl && newDoc.backUrl) {
              try {
                const stitchedBlob = await stitchFrontAndBack(newDoc.frontUrl, newDoc.backUrl);
                const stitchedFd = new FormData();
                stitchedFd.append('file', stitchedBlob, `stitched_${docId}.jpg`);
                const stitchedRes = await api.upload('/guests/upload-id', stitchedFd);
                newDoc.idProofUrl = stitchedRes.url;
              } catch (mergeErr) {
                console.error('Stitching failed:', mergeErr);
              }
            }
            return newDoc;
          }
          return doc;
        }));

        setIdDocuments(updatedDocs);
        stopCamera();
      } catch (e) {
        alert(e.message || 'Upload failed');
      } finally {
        setUploadingImage(false);
      }
    }, 'image/jpeg', 0.92);
  };

  const addIdDocument = () => {
    setIdDocuments(prev => [
      ...prev,
      { id: Date.now(), idType: 'AADHAAR', idNumber: '', frontUrl: '', backUrl: '', idProofUrl: '', label: `Co-Guest ID Document`, guestName: '', gender: '', dateOfBirth: '' }
    ]);
  };

  const removeIdDocument = (docId) => {
    setIdDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const updateDocField = (docId, key, val) => {
    setIdDocuments(prev => prev.map(d => d.id === docId ? { ...d, [key]: val } : d));
  };

  const getGuestTier = (stays) => {
    if (stays >= 15) return { label: 'Diamond', cls: 'bg-navy text-gold border border-gold/40' };
    if (stays >= 8) return { label: 'Platinum', cls: 'bg-gold text-navy' };
    if (stays >= 3) return { label: 'Gold', cls: 'bg-gold-pale text-gold border border-gold/30' };
    return { label: 'Silver', cls: 'bg-surface-linen text-slate' };
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-navy">Guest Information</h2>
        <p className="text-slate text-xs mt-0.5">Search for an existing guest or register a new one</p>
      </div>

      {/* If a guest is already selected, show profile card */}
      {selectedGuest && (
        <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                {selectedGuest.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy text-sm">{selectedGuest.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getGuestTier(selectedGuest.totalStays || 0).cls}`}>
                    {getGuestTier(selectedGuest.totalStays || 0).label}
                  </span>
                </div>
                <span className="text-xs text-slate flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedGuest.phone}</span>
                {selectedGuest.email && <span className="text-xs text-slate flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedGuest.email}</span>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-slate font-medium">🏨 {selectedGuest.totalStays || 0} stays</span>
                  <span className="text-[10px] text-slate font-medium">💰 ₹{(selectedGuest.totalSpent || 0).toLocaleString('en-IN')} spent</span>
                </div>
              </div>
            </div>
            <button onClick={onClearGuest} className="p-1.5 text-slate hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab selector */}
      {!selectedGuest && (
        <div className="flex bg-cream/30 border border-border-cream rounded-xl p-1">
          <button onClick={() => setGuestTab('existing')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
              ${guestTab === 'existing' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'}`}>
            <Search className="w-3.5 h-3.5" /> Search Existing
          </button>
          <button onClick={() => setGuestTab('new')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
              ${guestTab === 'new' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'}`}>
            <UserPlus className="w-3.5 h-3.5" /> New Guest
          </button>
        </div>
      )}

      {/* Existing Guest Search */}
      {!selectedGuest && guestTab === 'existing' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
            {searching && <RefreshCw className="absolute right-3 top-2.5 w-4 h-4 text-gold animate-spin" />}
            <input type="text" placeholder="Search by name, mobile or email..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold transition-all" />
          </div>
          {searchResults.length > 0 && (
            <div className="border border-border-cream rounded-2xl divide-y divide-border-cream/40 max-h-64 overflow-y-auto">
              {searchResults.map(g => {
                const tier = getGuestTier(g.totalStays || 0);
                return (
                  <button key={g.id} onClick={() => { onSelectGuest(g); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gold-pale/10 transition-all text-left">
                    <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {g.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy truncate">{g.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase flex-shrink-0 ${tier.cls}`}>{tier.label}</span>
                      </div>
                      <span className="text-[11px] text-slate">{g.phone}{g.email ? ` · ${g.email}` : ''}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-semibold text-slate block">{g.totalStays || 0} stays</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div className="text-center py-6 text-slate text-xs font-medium">
              No guests found. <button onClick={() => setGuestTab('new')} className="text-gold font-bold underline">Create new guest →</button>
            </div>
          )}
        </div>
      )}

      {/* New Guest Form */}
      {!selectedGuest && guestTab === 'new' && (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Full Name *</label>
              <div className="relative"><User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/40" />
                <input type="text" placeholder="e.g. Rahul Sharma" value={guestData.name}
                  onChange={e => onChange('name', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Mobile Number *</label>
              <div className="relative"><Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/40" />
                <input type="tel" placeholder="e.g. 9876543210" value={guestData.phone}
                  onChange={e => onChange('phone', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Email</label>
              <div className="relative"><Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/40" />
                <input type="email" placeholder="e.g. rahul@email.com" value={guestData.email}
                  onChange={e => onChange('email', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Gender</label>
              <select value={guestData.gender} onChange={e => onChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Date of Birth</label>
              <input type="date" value={guestData.dateOfBirth} onChange={e => onChange('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Nationality</label>
              <div className="relative"><Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/40" />
                <input type="text" placeholder="e.g. Indian" value={guestData.nationality}
                  onChange={e => onChange('nationality', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Address</label>
            <input type="text" placeholder="Street / Colony / Area" value={guestData.address}
              onChange={e => onChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">City</label>
              <input type="text" placeholder="City" value={guestData.city} onChange={e => onChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">State</label>
              <input type="text" placeholder="State" value={guestData.state} onChange={e => onChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">PIN Code</label>
              <input type="text" placeholder="000000" value={guestData.postalCode} onChange={e => onChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Country</label>
            <input type="text" placeholder="Country" value={guestData.country} onChange={e => onChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
          </div>

          {/* ID Verification */}
          <div className="pt-4 border-t border-border-cream/40 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-navy uppercase tracking-wider">Identity Verification</span>
              </div>
              <button type="button" onClick={addIdDocument}
                className="flex items-center gap-1.5 px-3 py-1 bg-navy/5 text-navy hover:bg-navy/10 border border-navy/20 rounded-xl text-xs font-bold transition-all active:scale-95">
                <UserPlus className="w-3.5 h-3.5 text-gold" /> Add Co-Guest
              </button>
            </div>

            {idDocuments.map((doc, idx) => {
              const isCapFront = capturingState?.docId === doc.id && capturingState?.side === 'front';
              const isCapBack = capturingState?.docId === doc.id && capturingState?.side === 'back';

              return (
                <div key={doc.id} className="p-4 bg-cream/5 border border-border-cream/60 rounded-2xl space-y-4 relative">
                  {idx > 0 && (
                    <button type="button" onClick={() => removeIdDocument(doc.id)}
                      className="absolute top-3 right-3 text-slate hover:text-rose-600 p-1.5 bg-white border border-border-cream hover:bg-rose-50 rounded-xl transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <h4 className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-navy/10 text-navy flex items-center justify-center text-[10px] font-mono">{idx + 1}</span>
                    {doc.label} {idx > 0 && <span className="text-[10px] text-slate font-normal">(Co-Guest)</span>}
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">ID Proof Type *</label>
                      <select value={doc.idType} onChange={e => updateDocField(doc.id, 'idType', e.target.value)}
                        className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all">
                        {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">ID Number *</label>
                      <div className="relative"><Hash className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/40" />
                        <input type="text" placeholder="Enter ID number" value={doc.idNumber}
                          onChange={e => updateDocField(doc.id, 'idNumber', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
                      </div>
                    </div>
                  </div>

                  {idx > 0 && (
                    <div className="space-y-3 pt-3 border-t border-border-cream/40">
                      {/* Name & Phone */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Full Name *</label>
                          <input type="text" placeholder="Co-guest full name" value={doc.guestName || ''}
                            onChange={e => updateDocField(doc.id, 'guestName', e.target.value)}
                            className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Mobile Number *</label>
                          <input type="tel" placeholder="Co-guest phone number" value={doc.phone || ''}
                            onChange={e => updateDocField(doc.id, 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
                        </div>
                      </div>

                      {/* Email, Gender, DOB */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1 col-span-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Email</label>
                          <input type="email" placeholder="Email address" value={doc.email || ''}
                            onChange={e => updateDocField(doc.id, 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Gender</label>
                          <select value={doc.gender || ''} onChange={e => updateDocField(doc.id, 'gender', e.target.value)}
                            className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all">
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">DOB</label>
                          <input type="date" value={doc.dateOfBirth || ''} onChange={e => updateDocField(doc.id, 'dateOfBirth', e.target.value)}
                            className="w-full px-2 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-[10px] font-semibold transition-all" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Front Side */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate text-center">Front Side</label>
                      {isCapFront ? (
                        <div className="border border-dashed border-gold/50 rounded-xl overflow-hidden bg-black/5 flex flex-col items-center p-2 gap-2 h-44 justify-center">
                          <video ref={videoRef} className="w-full h-28 object-cover rounded-lg bg-black" playsInline muted />
                          <div className="flex gap-1.5 w-full">
                            <button type="button" onClick={() => capturePhoto(doc.id, 'front')} disabled={uploadingImage}
                              className="w-1/2 flex items-center justify-center gap-1 bg-navy text-white font-bold rounded-lg text-[10px] py-1.5 transition-all">
                              <Camera className="w-3 h-3" /> Capture
                            </button>
                            <button type="button" onClick={stopCamera}
                              className="w-1/2 border border-border-cream text-slate font-bold rounded-lg text-[10px] py-1.5 hover:bg-cream/20 transition-all">Cancel</button>
                          </div>
                        </div>
                      ) : doc.frontUrl ? (
                        <div className="border border-border-cream rounded-xl p-2 bg-white flex flex-col items-center justify-center gap-2 h-44 relative">
                          <img src={`http://localhost:5000${doc.frontUrl}`} alt="Front" className="w-full h-28 object-contain rounded-lg border" />
                          <button type="button" onClick={() => updateDocField(doc.id, 'frontUrl', '')}
                            className="absolute top-3 right-3 p-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg shadow-sm transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[9px] text-slate font-medium truncate w-full text-center">Front side uploaded ✓</span>
                        </div>
                      ) : (
                        <div className="border border-dashed border-border-cream rounded-xl p-4 bg-white/40 flex flex-col items-center justify-center gap-2 h-44">
                          <Image className="w-5 h-5 text-slate/30" />
                          <span className="text-[9px] text-slate font-medium text-center">Front side preview</span>
                          <div className="flex gap-1.5 w-full mt-2">
                            <label className="w-1/2 flex items-center justify-center gap-1 border border-border-cream hover:bg-cream/10 bg-white text-navy font-bold rounded-lg text-[10px] py-1.5 cursor-pointer transition-all">
                              <Upload className="w-3 h-3" /> Upload
                              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(doc.id, 'front', e)} disabled={uploadingImage} className="hidden" />
                            </label>
                            <button type="button" onClick={() => startCamera(doc.id, 'front')}
                              className="w-1/2 flex items-center justify-center gap-1 border border-border-cream hover:bg-cream/10 bg-white text-navy font-bold rounded-lg text-[10px] py-1.5 transition-all">
                              <Camera className="w-3 h-3" /> Camera
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Back Side */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate text-center">Back Side</label>
                      {isCapBack ? (
                        <div className="border border-dashed border-gold/50 rounded-xl overflow-hidden bg-black/5 flex flex-col items-center p-2 gap-2 h-44 justify-center">
                          <video ref={videoRef} className="w-full h-28 object-cover rounded-lg bg-black" playsInline muted />
                          <div className="flex gap-1.5 w-full">
                            <button type="button" onClick={() => capturePhoto(doc.id, 'back')} disabled={uploadingImage}
                              className="w-1/2 flex items-center justify-center gap-1 bg-navy text-white font-bold rounded-lg text-[10px] py-1.5 transition-all">
                              <Camera className="w-3 h-3" /> Capture
                            </button>
                            <button type="button" onClick={stopCamera}
                              className="w-1/2 border border-border-cream text-slate font-bold rounded-lg text-[10px] py-1.5 hover:bg-cream/20 transition-all">Cancel</button>
                          </div>
                        </div>
                      ) : doc.backUrl ? (
                        <div className="border border-border-cream rounded-xl p-2 bg-white flex flex-col items-center justify-center gap-2 h-44 relative">
                          <img src={`http://localhost:5000${doc.backUrl}`} alt="Back" className="w-full h-28 object-contain rounded-lg border" />
                          <button type="button" onClick={() => updateDocField(doc.id, 'backUrl', '')}
                            className="absolute top-3 right-3 p-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg shadow-sm transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[9px] text-slate font-medium truncate w-full text-center">Back side uploaded ✓</span>
                        </div>
                      ) : (
                        <div className="border border-dashed border-border-cream rounded-xl p-4 bg-white/40 flex flex-col items-center justify-center gap-2 h-44">
                          <Image className="w-5 h-5 text-slate/30" />
                          <span className="text-[9px] text-slate font-medium text-center">Back side preview</span>
                          <div className="flex gap-1.5 w-full mt-2">
                            <label className="w-1/2 flex items-center justify-center gap-1 border border-border-cream hover:bg-cream/10 bg-white text-navy font-bold rounded-lg text-[10px] py-1.5 cursor-pointer transition-all">
                              <Upload className="w-3 h-3" /> Upload
                              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(doc.id, 'back', e)} disabled={uploadingImage} className="hidden" />
                            </label>
                            <button type="button" onClick={() => startCamera(doc.id, 'back')}
                              className="w-1/2 flex items-center justify-center gap-1 border border-border-cream hover:bg-cream/10 bg-white text-navy font-bold rounded-lg text-[10px] py-1.5 transition-all">
                              <Camera className="w-3 h-3" /> Camera
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>


                  {doc.idProofUrl && (
                    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-2.5">
                        <img src={`http://localhost:5000${doc.idProofUrl}`} alt="Stitched ID"
                          className="w-16 h-10 object-cover rounded-lg border border-emerald-200 shadow-sm" />
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 block">Stitched & Merged ID ✓</span>
                          <span className="text-[8px] text-slate font-mono block truncate max-w-56">{doc.idProofUrl}</span>
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Step 3: Room Allocation ──────────────────────────────────────────────────

function Step3({ availableRooms, selectedRoomId, onSelectRoom, loading, roomTypes, filterTypeId, onFilterType }) {
  const [priceFilter, setPriceFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');

  const filtered = availableRooms.filter(r => {
    if (filterTypeId && r.roomTypeId !== filterTypeId) return false;
    if (floorFilter && r.floor !== floorFilter) return false;
    if (priceFilter && r.roomType?.basePrice > Number(priceFilter)) return false;
    return true;
  });

  const floors = [...new Set(availableRooms.map(r => r.floor).filter(Boolean))].sort();
  const statusDot = (s) => ({
    AVAILABLE: 'bg-emerald-400', CLEANING: 'bg-amber-400',
    RESERVED: 'bg-blue-400', OCCUPIED: 'bg-rose-400',
    MAINTENANCE: 'bg-orange-400', CHECKOUT_PENDING: 'bg-purple-400'
  }[s] || 'bg-slate-300');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-xl text-navy">Room Allocation</h2>
        <p className="text-slate text-xs mt-0.5">Select a room for this reservation</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-32">
          <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate/40" />
          <select value={filterTypeId} onChange={e => onFilterType(e.target.value)}
            className="w-full pl-8 pr-2 py-2 border border-border-cream/80 rounded-lg bg-white text-xs font-semibold focus:outline-none focus:border-gold">
            <option value="">All Types</option>
            {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
          </select>
        </div>
        <select value={floorFilter} onChange={e => setFloorFilter(e.target.value)}
          className="px-3 py-2 border border-border-cream/80 rounded-lg bg-white text-xs font-semibold focus:outline-none focus:border-gold">
          <option value="">All Floors</option>
          {floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
        </select>
        <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)}
          className="px-3 py-2 border border-border-cream/80 rounded-lg bg-white text-xs font-semibold focus:outline-none focus:border-gold">
          <option value="">Any Price</option>
          <option value="3000">Under ₹3,000</option>
          <option value="6000">Under ₹6,000</option>
          <option value="10000">Under ₹10,000</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate text-sm font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin text-gold" /> Loading available rooms...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <Bed className="w-10 h-10 text-slate/20 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate">No rooms available for selected dates</p>
          <p className="text-xs text-slate/60 mt-1">Try adjusting dates or room type filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
          {filtered.map(room => {
            const isSelected = room.id === selectedRoomId;
            return (
              <button key={room.id} onClick={() => onSelectRoom(room)}
                className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md active:scale-98
                  ${isSelected ? 'border-navy bg-navy/5 shadow-lg ring-2 ring-navy/20' : 'border-border-cream bg-white hover:border-gold/40'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy text-base">Room {room.number}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <span className="text-[11px] text-slate font-medium">{room.roomType?.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-navy text-sm">₹{(room.roomType?.basePrice || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate block">/night</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {room.floor && (
                    <span className="flex items-center gap-1 text-[10px] text-slate font-medium">
                      <MapPin className="w-3 h-3" /> Floor {room.floor}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-slate font-medium">
                    <Users className="w-3 h-3" /> {room.roomType?.maxOccupancy || 2} guests
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold">
                    <span className={`w-2 h-2 rounded-full ${statusDot(room.status)}`} />
                    {room.status?.replace('_', ' ')}
                  </span>
                </div>
                {room.roomType?.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.roomType.amenities.slice(0, 3).map((a, i) => (
                      <span key={i} className="text-[9px] bg-cream/50 border border-border-cream px-2 py-0.5 rounded-full font-medium text-slate">{a}</span>
                    ))}
                    {room.roomType.amenities.length > 3 && (
                      <span className="text-[9px] text-slate/50">+{room.roomType.amenities.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Rate & Payment ───────────────────────────────────────────────────

function Step4({ data, onChange, selectedRoom, nights }) {
  const roomCharges = nights * (data.ratePerNight || 0);
  const extraCharges = Number(data.extraCharges) || 0;
  const discount = Number(data.discount) || 0;
  const subtotal = roomCharges + extraCharges - discount;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax;
  const advance = Number(data.advancePaid) || 0;
  const balance = Math.max(0, total - advance);

  useEffect(() => {
    onChange('taxAmount', tax);
    onChange('totalAmount', total);
  }, [roomCharges, extraCharges, discount, tax]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-navy">Rate & Payment</h2>
        <p className="text-slate text-xs mt-0.5">Review the pricing breakdown and collect advance payment</p>
      </div>

      {/* Rate input */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Rate Per Night (₹) *</label>
          <div className="relative"><DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
            <input type="number" min="0" placeholder="0" value={data.ratePerNight}
              onChange={e => onChange('ratePerNight', Number(e.target.value))}
              className="w-full pl-9 pr-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-bold transition-all" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Extra Charges (₹)</label>
          <input type="number" min="0" placeholder="0" value={data.extraCharges}
            onChange={e => onChange('extraCharges', Number(e.target.value))}
            className="w-full px-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Discount (₹)</label>
          <input type="number" min="0" placeholder="0" value={data.discount}
            onChange={e => onChange('discount', Number(e.target.value))}
            className="w-full px-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold transition-all" />
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="bg-navy/3 border border-border-cream rounded-2xl p-4 space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate mb-3">Pricing Breakdown</h4>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate">Room Rate (₹{(data.ratePerNight || 0).toLocaleString('en-IN')} × {nights} nights)</span>
          <span className="font-semibold text-charcoal">₹{roomCharges.toLocaleString('en-IN')}</span>
        </div>
        {extraCharges > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate">Extra Charges</span>
            <span className="font-semibold text-charcoal">+ ₹{extraCharges.toLocaleString('en-IN')}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate">Discount</span>
            <span className="font-semibold text-emerald-600">− ₹{discount.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-xs border-t border-border-cream/60 pt-2">
          <span className="text-slate">GST (12%)</span>
          <span className="font-semibold text-charcoal">₹{tax.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold border-t border-border-cream pt-2">
          <span className="text-navy">Grand Total</span>
          <span className="text-navy">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Advance Payment */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate">Advance Payment</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate">Advance Amount (₹)</label>
            <input type="number" min="0" max={total} placeholder="0" value={data.advancePaid}
              onChange={e => onChange('advancePaid', Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-bold transition-all" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate">Balance Due</label>
            <div className={`px-3 py-2.5 rounded-xl border text-sm font-bold ${balance > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              ₹{balance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => onChange('advanceMethod', value)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all
                  ${data.advanceMethod === value ? 'bg-navy text-white border-navy shadow-sm' : 'bg-white border-border-cream text-slate hover:border-gold/40 hover:text-navy'}`}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Additional Information ──────────────────────────────────────────

const SERVICE_CHARGES = {
  'Extra Bed': 1000,
  'Airport Pickup': 1500,
  'Anniversary Decoration': 2000,
  'Birthday Decoration': 1500,
  'Early Check-in': 500,
  'Late Check-in': 500,
  'Sea View': 1000,
};

function Step5({ data, onChange }) {
  const toggleRequest = (req) => {
    const current = data.specialRequests || [];
    const next = current.includes(req) ? current.filter(r => r !== req) : [...current, req];
    onChange('specialRequests', next);

    // Calculate sum of extra service charges
    let extraSum = 0;
    next.forEach(r => {
      extraSum += SERVICE_CHARGES[r] || 0;
    });
    onChange('extraCharges', extraSum);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-navy">Additional Information</h2>
        <p className="text-slate text-xs mt-0.5">Optional guest preferences and operational details</p>
      </div>

      {/* Special Requests */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Special Requests</label>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_REQUESTS.map(req => {
            const active = (data.specialRequests || []).includes(req);
            const charge = SERVICE_CHARGES[req] || 0;
            return (
              <button key={req} type="button" onClick={() => toggleRequest(req)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 flex items-center gap-1
                  ${active ? 'bg-navy text-white border-navy' : 'bg-white border-border-cream text-slate hover:border-gold/50 hover:text-navy'}`}>
                {active && <span>✓</span>}
                <span>{req}</span>
                {charge > 0 && <span className={`text-[10px] font-bold ${active ? 'text-gold' : 'text-slate/60'}`}>(+₹{charge})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Internal Notes */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Internal Flags</label>
        <div className="flex flex-wrap gap-2">
          {['VIP Guest', 'Repeat Guest', 'Blacklisted', 'Special Assistance'].map(flag => {
            const active = (data.internalFlags || []).includes(flag);
            return (
              <button key={flag} type="button"
                onClick={() => {
                  const cur = data.internalFlags || [];
                  onChange('internalFlags', active ? cur.filter(f => f !== flag) : [...cur, flag]);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95
                  ${flag === 'Blacklisted' && active ? 'bg-rose-600 text-white border-rose-600' :
                    active ? 'bg-gold text-navy border-gold' : 'bg-white border-border-cream text-slate hover:border-gold/50'}`}>
                {active && <span className="mr-1">✓</span>}{flag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">Receptionist Notes</label>
        <textarea placeholder="e.g. Guest requested extra towels, prefers quiet room away from elevator..." value={data.notes}
          onChange={e => onChange('notes', e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all resize-none" />
      </div>

      {/* Optional Fields */}
      <div className="pt-2 border-t border-border-cream/40">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate mb-3">Optional Details</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate">Vehicle Number</label>
            <div className="relative"><Car className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/40" />
              <input type="text" placeholder="e.g. MH 01 AB 1234" value={data.vehicleNumber}
                onChange={e => onChange('vehicleNumber', e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate">Company Name</label>
            <div className="relative"><Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/40" />
              <input type="text" placeholder="e.g. Acme Corp" value={data.companyName}
                onChange={e => onChange('companyName', e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate">GST Number</label>
            <input type="text" placeholder="e.g. 27AAAPZ0108P1ZV" value={data.gstNumber}
              onChange={e => onChange('gstNumber', e.target.value)}
              className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold transition-all" />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-slate">Purpose of Visit</label>
            <div className="relative"><Briefcase className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/40" />
              <select value={data.purposeOfVisit} onChange={e => onChange('purposeOfVisit', e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-xs font-semibold appearance-none transition-all">
                <option value="">Select</option>
                <option value="Business">Business</option>
                <option value="Leisure">Leisure</option>
                <option value="Medical">Medical</option>
                <option value="Wedding">Wedding</option>
                <option value="Event">Event</option>
                <option value="Transit">Transit</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6: Review & Confirm ─────────────────────────────────────────────────

function Step6({ bookingData, guestData, selectedGuest, selectedRoom, nights, idDocuments, onSave, onConfirm, saving }) {
  const guest = selectedGuest || guestData;
  const roomCharges = nights * (bookingData.ratePerNight || 0);
  const extra = Number(bookingData.extraCharges) || 0;
  const discount = Number(bookingData.discount) || 0;
  const subtotal = roomCharges + extra - discount;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax;
  const advance = Number(bookingData.advancePaid) || 0;
  const balance = Math.max(0, total - advance);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-navy">Review & Confirm</h2>
        <p className="text-slate text-xs mt-0.5">Verify all details before confirming the reservation</p>
      </div>

      {/* Summary Card */}
      <div className="border border-border-cream rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-navy px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-gold text-xs font-bold uppercase tracking-widest">Reservation Summary</span>
            <p className="text-white font-bold text-sm mt-0.5">Auto-generated on confirmation</p>
          </div>
          <Hotel className="w-8 h-8 text-gold/60" />
        </div>

        <div className="p-4 space-y-4">
          {/* Guest */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate mb-2">Guest & ID Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><span className="text-slate">Name</span><span className="float-right font-semibold text-navy">{guest?.name || '—'}</span></div>
              <div><span className="text-slate">Mobile</span><span className="float-right font-semibold text-navy">{guest?.phone || '—'}</span></div>
              {guest?.email && <div className="col-span-2"><span className="text-slate">Email</span><span className="float-right font-semibold text-navy">{guest.email}</span></div>}
            </div>

            {/* Show ID documents summary */}
            <div className="bg-cream/10 border border-border-cream/40 rounded-xl p-2.5 space-y-1.5 mt-2.5">
              <span className="text-[9px] font-bold text-slate uppercase block">Documents Verified:</span>
              {idDocuments.map((doc, idx) => (
                <div key={doc.id} className="flex justify-between items-center text-[10px] text-charcoal">
                  <span>{idx + 1}. {doc.idType} ({doc.idNumber || 'No Number'})</span>
                  <span className={doc.idProofUrl ? 'text-emerald-600 font-bold' : doc.frontUrl || doc.backUrl ? 'text-slate font-medium' : 'text-slate/40'}>
                    {doc.idProofUrl ? '✓ Stitched Image' : doc.frontUrl || doc.backUrl ? '✓ Part Photo' : 'No Photo'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border-cream/40" />

          {/* Booking */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate mb-2">Booking Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><span className="text-slate">Check-in</span><span className="float-right font-semibold text-navy">{bookingData.checkInDate ? new Date(bookingData.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div>
              <div><span className="text-slate">Check-out</span><span className="float-right font-semibold text-navy">{bookingData.checkOutDate ? new Date(bookingData.checkOutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div>
              <div><span className="text-slate">Nights</span><span className="float-right font-semibold text-navy">{nights}</span></div>
              <div><span className="text-slate">Guests</span><span className="float-right font-semibold text-navy">{bookingData.adults}A + {bookingData.children}C</span></div>
              <div><span className="text-slate">Room</span><span className="float-right font-semibold text-navy">{selectedRoom ? `${selectedRoom.number} (${selectedRoom.roomType?.name})` : '—'}</span></div>
              <div><span className="text-slate">Floor</span><span className="float-right font-semibold text-navy">{selectedRoom?.floor || '—'}</span></div>
              <div><span className="text-slate">Rate Plan</span><span className="float-right font-semibold text-navy">{bookingData.ratePlan || '—'}</span></div>
              <div><span className="text-slate">Source</span><span className="float-right font-semibold text-navy">{SOURCE_LABELS[bookingData.source] || bookingData.source || '—'}</span></div>
            </div>
          </div>

          <div className="border-t border-border-cream/40" />

          {/* Financial */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate mb-2">Financial Summary</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate">Room Charges</span><span className="font-semibold">₹{roomCharges.toLocaleString('en-IN')}</span></div>
              {extra > 0 && <div className="flex justify-between"><span className="text-slate">Extra Charges</span><span className="font-semibold">₹{extra.toLocaleString('en-IN')}</span></div>}
              {discount > 0 && <div className="flex justify-between"><span className="text-slate">Discount</span><span className="font-semibold text-emerald-600">−₹{discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between"><span className="text-slate">GST (12%)</span><span className="font-semibold">₹{tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-border-cream/40">
                <span className="text-navy">Grand Total</span><span className="text-navy">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Advance Paid</span><span>₹{advance.toLocaleString('en-IN')}</span>
              </div>
              <div className={`flex justify-between font-bold pt-1 border-t border-border-cream/40 ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                <span>Balance Due</span><span>₹{balance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onSave} disabled={saving}
          className="flex items-center justify-center gap-2 border-2 border-navy text-navy font-bold rounded-xl py-2.5 text-sm hover:bg-navy/5 active:scale-95 transition-all disabled:opacity-50">
          <FileText className="w-4 h-4" /> Save Draft
        </button>
        <button type="button" onClick={onConfirm} disabled={saving}
          className="flex items-center justify-center gap-2 bg-navy text-white font-bold rounded-xl py-2.5 text-sm hover:bg-navy/90 active:scale-95 transition-all disabled:opacity-50 shadow-lg">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {saving ? 'Confirming...' : 'Confirm Reservation'}
        </button>
        <button type="button" onClick={handlePrint}
          className="flex items-center justify-center gap-2 border border-border-cream text-slate font-bold rounded-xl py-2 text-xs hover:bg-cream/20 active:scale-95 transition-all">
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
        <button type="button"
          className="flex items-center justify-center gap-2 border border-border-cream text-slate font-bold rounded-xl py-2 text-xs hover:bg-cream/20 active:scale-95 transition-all">
          <Send className="w-3.5 h-3.5" /> Email Confirmation
        </button>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

function NewReservationWizard({ onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 6;
  const STEP_LABELS = ['Details', 'Guest', 'Room', 'Extra', 'Payment', 'Confirm'];

  // Step 1 data
  const [bookingData, setBookingData] = useState({
    checkInDate: '', checkOutDate: '', adults: 1, children: 0, numberOfRooms: 1,
    roomTypeId: '', ratePlan: 'EP', source: 'WALK_IN', expectedArrival: '',
    ratePerNight: '', extraCharges: 0, discount: 0, taxAmount: 0, advancePaid: 0,
    advanceMethod: 'CASH', vehicleNumber: '', companyName: '', gstNumber: '',
    purposeOfVisit: '', specialRequests: [], internalFlags: [], notes: '',
  });
  const changeBooking = (key, val) => setBookingData(p => ({ ...p, [key]: val }));

  // Step 2 data
  const [guestData, setGuestData] = useState({
    name: '', phone: '', email: '', gender: '', dateOfBirth: '', nationality: '',
    address: '', city: '', state: '', country: 'India', postalCode: '',
    idType: 'AADHAAR', idNumber: '', idProofUrl: '',
  });
  const changeGuest = (key, val) => setGuestData(p => ({ ...p, [key]: val }));
  const [selectedGuest, setSelectedGuest] = useState(null);

  const [idDocuments, setIdDocuments] = useState([
    { id: 'primary', idType: 'AADHAAR', idNumber: '', frontUrl: '', backUrl: '', idProofUrl: '', label: 'Primary Guest ID' }
  ]);

  useEffect(() => {
    const primaryDoc = idDocuments.find(d => d.id === 'primary');
    if (primaryDoc) {
      setGuestData(prev => ({
        ...prev,
        idType: primaryDoc.idType,
        idNumber: primaryDoc.idNumber,
        idProofUrl: primaryDoc.idProofUrl
      }));
    }
  }, [idDocuments]);


  // Step 3 data
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [filterTypeId, setFilterTypeId] = useState('');

  // Room types
  const [roomTypes, setRoomTypes] = useState([]);

  // Misc
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/room-types').then(d => setRoomTypes(d || [])).catch(() => {});
  }, []);

  // Load available rooms when step 3 is reached or when dates change
  const loadAvailableRooms = useCallback(async () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate) return;
    setRoomsLoading(true);
    try {
      const url = `/rooms/available?checkIn=${bookingData.checkInDate}&checkOut=${bookingData.checkOutDate}${bookingData.roomTypeId ? `&roomTypeId=${bookingData.roomTypeId}` : ''}`;
      const data = await api.get(url);
      setAvailableRooms(data || []);
    } catch { setAvailableRooms([]); }
    finally { setRoomsLoading(false); }
  }, [bookingData.checkInDate, bookingData.checkOutDate, bookingData.roomTypeId]);

  useEffect(() => {
    if (currentStep === 3) loadAvailableRooms();
  }, [currentStep, loadAvailableRooms]);

  // Auto-set rate from room type
  useEffect(() => {
    if (selectedRoom && !bookingData.ratePerNight) {
      changeBooking('ratePerNight', selectedRoom.roomType?.basePrice || '');
    }
  }, [selectedRoom]);

  const nights = bookingData.checkInDate && bookingData.checkOutDate
    ? Math.max(0, Math.round((new Date(bookingData.checkOutDate) - new Date(bookingData.checkInDate)) / 86400000))
    : 0;

  const validateStep = () => {
    const errs = [];
    if (currentStep === 1) {
      if (!bookingData.checkInDate) errs.push('Check-in date is required');
      if (!bookingData.checkOutDate) errs.push('Check-out date is required');
      if (nights <= 0) errs.push('Check-out must be after check-in');
      if (!bookingData.source) errs.push('Booking source is required');
    }
    if (currentStep === 2) {
      if (!selectedGuest) {
        if (!guestData.name || guestData.name.length < 2) errs.push('Guest name is required (min 2 chars)');
        if (!guestData.phone || guestData.phone.length < 7) errs.push('Valid mobile number is required');
      }
    }
    if (currentStep === 3) {
      if (!selectedRoom) errs.push('Please select a room');
    }
    if (currentStep === 5) {
      if (!bookingData.ratePerNight || Number(bookingData.ratePerNight) <= 0) errs.push('Rate per night must be positive');
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setErrors([]);
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => { setErrors([]); setCurrentStep(s => Math.max(s - 1, 1)); };

  const submitReservation = async (status = 'CONFIRMED') => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      let guestId = selectedGuest?.id;

      if (!guestId) {
        const createdGuest = await api.post('/guests', {
          name: guestData.name, phone: guestData.phone,
          email: guestData.email || undefined, gender: guestData.gender || undefined,
          dateOfBirth: guestData.dateOfBirth || undefined,
          nationality: guestData.nationality || undefined,
          address: guestData.address || '',
          city: guestData.city || '', state: guestData.state || undefined,
          country: guestData.country || 'India', postalCode: guestData.postalCode || undefined,
          idType: guestData.idType,
          idNumber: guestData.idNumber || undefined,
          idProofUrl: guestData.idProofUrl || undefined,
        });
        guestId = createdGuest.id;
      }

      let specialRequestText = [
        ...(bookingData.specialRequests || []),
        ...(bookingData.internalFlags || []).map(f => `[${f}]`),
      ].join(', ');

      const coGuestInfos = idDocuments.slice(1).map((doc, idx) => {
        const contact = [doc.phone && `Ph: ${doc.phone}`, doc.email && `Em: ${doc.email}`].filter(Boolean).join(', ');
        const profile = doc.guestName 
          ? `${doc.guestName} (${doc.gender || 'N/A'}, DOB: ${doc.dateOfBirth || 'N/A'}${contact ? `, ${contact}` : ''})` 
          : 'Unnamed';
        return `[Co-Guest ${idx + 1}: ${profile} - ID: ${doc.idType} ${doc.idNumber || 'N/A'} (Img: ${doc.idProofUrl || 'N/A'})]`;
      });
      if (coGuestInfos.length > 0) {
        specialRequestText = specialRequestText 
          ? `${specialRequestText}, ${coGuestInfos.join(', ')}`
          : coGuestInfos.join(', ');
      }

      const payload = {
        roomId: selectedRoom.id,
        guestId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        adults: bookingData.adults,
        children: bookingData.children,
        numberOfRooms: bookingData.numberOfRooms,
        ratePerNight: Number(bookingData.ratePerNight),
        ratePlan: bookingData.ratePlan,
        extraCharges: Number(bookingData.extraCharges) || 0,
        discount: Number(bookingData.discount) || 0,
        advancePaid: Number(bookingData.advancePaid) || 0,
        advanceMethod: bookingData.advanceMethod || undefined,
        source: bookingData.source,
        expectedArrival: bookingData.expectedArrival || undefined,
        vehicleNumber: bookingData.vehicleNumber || undefined,
        companyName: bookingData.companyName || undefined,
        gstNumber: bookingData.gstNumber || undefined,
        purposeOfVisit: bookingData.purposeOfVisit || undefined,
        specialRequest: specialRequestText || undefined,
        notes: bookingData.notes || undefined,
      };

      await api.post('/reservations', payload);
      onSuccess('Reservation confirmed successfully! 🎉');
      onClose();
    } catch (err) {
      setErrors([err.message || 'Failed to create reservation']);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-navy/20 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_20px_60px_-5px_rgba(0,0,0,0.25)] border border-border-cream flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-navy px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-display font-bold text-white text-lg">New Reservation</h1>
            <p className="text-gold/70 text-xs">Step {currentStep} of {TOTAL_STEPS}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-border-cream bg-cream/10">
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <div>
                {errors.map((e, i) => <p key={i} className="text-xs font-semibold text-rose-700">{e}</p>)}
              </div>
            </div>
          )}

          {currentStep === 1 && <Step1 data={bookingData} onChange={changeBooking} roomTypes={roomTypes} />}
          {currentStep === 2 && <Step2 guestData={guestData} onChange={changeGuest} selectedGuest={selectedGuest} onSelectGuest={setSelectedGuest} onClearGuest={() => { setSelectedGuest(null); setIdDocuments([{ id: 'primary', idType: 'AADHAAR', idNumber: '', frontUrl: '', backUrl: '', idProofUrl: '', label: 'Primary Guest ID' }]); }} idDocuments={idDocuments} setIdDocuments={setIdDocuments} />}
          {currentStep === 3 && <Step3 availableRooms={availableRooms} selectedRoomId={selectedRoom?.id} onSelectRoom={room => { setSelectedRoom(room); if (!bookingData.ratePerNight) changeBooking('ratePerNight', room.roomType?.basePrice || ''); }} loading={roomsLoading} roomTypes={roomTypes} filterTypeId={filterTypeId} onFilterType={setFilterTypeId} />}
          {currentStep === 4 && <Step5 data={bookingData} onChange={changeBooking} />}
          {currentStep === 5 && <Step4 data={bookingData} onChange={changeBooking} selectedRoom={selectedRoom} nights={nights} />}
          {currentStep === 6 && <Step6 bookingData={bookingData} guestData={guestData} selectedGuest={selectedGuest} selectedRoom={selectedRoom} nights={nights} idDocuments={idDocuments} onSave={() => submitReservation('PENDING')} onConfirm={() => submitReservation('CONFIRMED')} saving={saving} />}
        </div>

        {/* Footer Navigation */}
        {currentStep < 6 && (
          <div className="px-6 py-4 border-t border-border-cream bg-cream/5 flex items-center justify-between flex-shrink-0">
            <button onClick={handleBack} disabled={currentStep === 1}
              className="flex items-center gap-2 text-sm font-bold text-slate border border-border-cream px-4 py-2 rounded-xl hover:bg-cream/20 disabled:opacity-30 active:scale-95 transition-all">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-[10px] font-semibold text-slate">
              {currentStep < 5 ? 'Fill in required fields to continue' : 'Last step before confirmation'}
            </span>
            <button onClick={handleNext}
              className="flex items-center gap-2 text-sm font-bold text-white bg-navy px-5 py-2 rounded-xl hover:bg-navy/90 active:scale-95 transition-all shadow-md">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── Parsers for Co-Guest Info in Special Request ─────────────────────────────

const parseCoGuestsFromSpecialRequest = (specialRequestStr) => {
  if (!specialRequestStr) return [];
  const coGuests = [];
  const regex = /\[Co-Guest (\d+):\s*([^\(]+)\s*\(([^\)]+)\)\s*-\s*ID:\s*([^\s]+)\s*([^(\[]*)(?:\(Img:\s*([^\)]+)\))?\]/g;
  let match;
  
  while ((match = regex.exec(specialRequestStr)) !== null) {
    const num = match[1];
    const name = match[2].trim();
    const detailsPart = match[3];
    const idType = match[4].trim();
    const idNumber = match[5].trim();
    const idProofUrl = match[6] ? match[6].trim() : '';
    
    let gender = 'N/A';
    let dob = 'N/A';
    let phone = 'N/A';
    let email = 'N/A';
    
    const details = detailsPart.split(',').map(d => d.trim());
    if (details.length > 0) {
      if (details[0] === 'Male' || details[0] === 'Female' || details[0] === 'Other') {
        gender = details[0];
      }
      
      details.forEach(item => {
        if (item.startsWith('DOB:')) {
          dob = item.replace('DOB:', '').trim();
        } else if (item.startsWith('Ph:')) {
          phone = item.replace('Ph:', '').trim();
        } else if (item.startsWith('Em:')) {
          email = item.replace('Em:', '').trim();
        }
      });
    }
    
    coGuests.push({
      num,
      name: name === 'N/A' || name === 'Unnamed' ? '' : name,
      gender,
      dob: dob === 'N/A' ? '' : dob,
      phone: phone === 'N/A' ? '' : phone,
      email: email === 'N/A' ? '' : email,
      idType,
      idNumber: idNumber.trim() === 'N/A' ? '' : idNumber.trim(),
      idProofUrl
    });
  }
  
  return coGuests;
};

const cleanSpecialRequests = (text) => {
  if (!text) return '';
  return text.replace(/\[Co-Guest[^\]]+\]/g, '').replace(/^[,\s]+|[,\s]+$/g, '').trim();
};

// ─── Main Reservations Page ───────────────────────────────────────────────────

function Reservations() {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [showWizard, setShowWizard] = useState(false);
  const [savingStatus, setSavingStatus] = useState({});
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await api.get('/reservations');
      setBookings(data || []);
    } catch (err) {
      showToast('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    setSavingStatus(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/reservations/${id}/status`, { status: newStatus });
      showToast(`Reservation ${newStatus.toLowerCase().replace('_', '-')} successfully`);
      fetchReservations();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setSavingStatus(p => ({ ...p, [id]: false }));
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setSavingStatus(p => ({ ...p, [id]: true }));
    try {
      await api.delete(`/reservations/${id}`);
      showToast('Reservation cancelled');
      fetchReservations();
    } catch (err) {
      showToast(err.message || 'Failed to cancel', 'error');
    } finally {
      setSavingStatus(p => ({ ...p, [id]: false }));
    }
  };

  const statuses = ['All', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];

  const filtered = bookings.filter(b => {
    if (selectedStatus !== 'All' && b.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.bookingRef?.toLowerCase().includes(q) ||
        b.guest?.name?.toLowerCase().includes(q) ||
        b.guest?.phone?.includes(q) ||
        b.room?.number?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 transition-all
          ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Wizard */}
      {showWizard && (
        <NewReservationWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(msg) => { showToast(msg); fetchReservations(); }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Reservations</h1>
          <p className="text-slate text-sm font-medium mt-1">Manage guest bookings, check-ins and check-outs</p>
        </div>
        <button onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-navy text-white font-bold px-5 py-2.5 rounded-xl hover:bg-navy/90 active:scale-95 transition-all shadow-md text-sm self-start md:self-auto">
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', val: stats.total, color: 'text-navy', bg: 'bg-navy/5 border-navy/10' },
          { label: 'Confirmed', val: stats.confirmed, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Checked In', val: stats.checkedIn, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Pending', val: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map((s, i) => (
          <div key={i} className={`soft-card p-4 border ${s.bg} flex flex-col justify-between h-24`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate">{s.label}</span>
            <span className={`font-mono text-3xl font-bold ${s.color}`}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="soft-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate/40" />
          <input type="text" placeholder="Search by booking ref, guest name, phone or room..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold bg-cream/20 text-sm font-semibold transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                ${selectedStatus === s ? 'bg-navy text-white' : 'bg-cream/30 text-slate hover:text-navy border border-border-cream'}`}>
              {s === 'All' ? 'All' : (STATUS_CONFIG[s]?.label || s)}
            </button>
          ))}
        </div>
        <button onClick={fetchReservations} className="flex items-center gap-2 text-xs font-bold text-navy border border-border-cream px-3 py-2 rounded-xl hover:bg-cream/10 active:scale-95 transition-all flex-shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="soft-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-cream bg-cream/10">
                {['', 'Booking Ref', 'Guest', 'Room', 'Dates', 'Amount', 'Status', 'Actions'].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-[10px] font-bold text-slate uppercase tracking-wider whitespace-nowrap ${i === 0 ? 'w-10 text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-cream/30">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate text-sm font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin text-gold" /> Loading reservations...
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center">
                  <CalendarRange className="w-10 h-10 text-slate/20 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate">No reservations found</p>
                  <button onClick={() => setShowWizard(true)} className="mt-2 text-gold text-xs font-bold hover:underline">+ Create first booking</button>
                </td></tr>
              ) : filtered.map(b => {
                const nights = b.checkInDate && b.checkOutDate
                  ? Math.max(0, Math.round((new Date(b.checkOutDate) - new Date(b.checkInDate)) / 86400000)) : 0;
                const cfg = STATUS_CONFIG[b.status] || { label: b.status, color: 'bg-slate-100 text-slate-600' };
                const isBusy = savingStatus[b.id];
                const isExpanded = expandedBookingId === b.id;
                return (
                  <React.Fragment key={b.id}>
                    <tr className={`hover:bg-gold-pale/5 transition-colors ${isExpanded ? 'bg-gold-pale/5' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                          className="p-1 hover:bg-navy/5 text-slate hover:text-navy rounded-lg transition-all active:scale-90">
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-gold' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold text-navy bg-navy/5 px-2 py-1 rounded-lg">{b.bookingRef}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-charcoal text-xs block">{b.guest?.name}</span>
                        <span className="text-[10px] text-slate">{b.guest?.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-charcoal text-xs block">Room {b.room?.number}</span>
                        <span className="text-[10px] text-slate">{b.room?.roomType?.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-charcoal block">
                          {new Date(b.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          {' → '}
                          {new Date(b.checkOutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-[10px] text-slate">{nights} night{nights !== 1 ? 's' : ''} · {b.adults}A {b.children}C</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-navy text-xs block">₹{(b.totalAmount || 0).toLocaleString('en-IN')}</span>
                        {(b.advancePaid || 0) > 0 && (
                          <span className="text-[10px] text-emerald-600 font-medium">Adv: ₹{b.advancePaid.toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {b.status === 'CONFIRMED' && (
                            <button onClick={() => handleStatusChange(b.id, 'CHECKED_IN')} disabled={isBusy}
                              className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap">
                              Check In
                            </button>
                          )}
                          {b.status === 'CHECKED_IN' && (
                            <button onClick={() => handleStatusChange(b.id, 'CHECKED_OUT')} disabled={isBusy}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap">
                              Check Out
                            </button>
                          )}
                          {b.status === 'PENDING' && (
                            <button onClick={() => handleStatusChange(b.id, 'CONFIRMED')} disabled={isBusy}
                              className="px-2.5 py-1 bg-navy text-white rounded-lg text-[10px] font-bold hover:bg-navy/80 active:scale-95 transition-all disabled:opacity-50">
                              Confirm
                            </button>
                          )}
                          {!['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'].includes(b.status) && (
                            <button onClick={() => handleCancel(b.id)} disabled={isBusy}
                              className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isBusy && <RefreshCw className="w-3.5 h-3.5 text-gold animate-spin" />}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-cream/5 border-b border-border-cream/40">
                        <td colSpan={8} className="px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs animate-fadeIn">
                            {/* Guest Profile */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-navy uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-border-cream/30 pb-1.5">
                                <User className="w-3.5 h-3.5 text-gold" /> Guest Profile
                              </h4>
                              <div className="space-y-1.5 text-slate">
                                <p><strong className="text-charcoal font-semibold">Email:</strong> {b.guest?.email || 'N/A'}</p>
                                <p><strong className="text-charcoal font-semibold">DOB:</strong> {b.guest?.dateOfBirth ? new Date(b.guest.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'}</p>
                                <p><strong className="text-charcoal font-semibold">Gender:</strong> {b.guest?.gender || 'N/A'}</p>
                                <p><strong className="text-charcoal font-semibold">Nationality:</strong> {b.guest?.nationality || 'N/A'}</p>
                                <p><strong className="text-charcoal font-semibold">Address:</strong> {[b.guest?.address, b.guest?.city, b.guest?.state, b.guest?.postalCode, b.guest?.country].filter(Boolean).join(', ') || 'N/A'}</p>
                              </div>
                            </div>

                            {/* ID Document Details */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-navy uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-border-cream/30 pb-1.5">
                                <Shield className="w-3.5 h-3.5 text-gold" /> Identity Verification
                              </h4>
                              <div className="space-y-2">
                                <div className="space-y-1 text-slate">
                                  <p><strong className="text-charcoal font-semibold">Type:</strong> {b.guest?.idType || 'N/A'}</p>
                                  <p><strong className="text-charcoal font-semibold">Number:</strong> {b.guest?.idNumber || 'N/A'}</p>
                                </div>
                                {b.guest?.idProofUrl ? (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate uppercase block">Stitched ID Card</span>
                                    <a href={`http://localhost:5000${b.guest.idProofUrl}`} target="_blank" rel="noreferrer"
                                      className="group block relative w-full h-24 border border-border-cream rounded-xl overflow-hidden shadow-sm hover:border-gold transition-all bg-white">
                                      <img src={`http://localhost:5000${b.guest.idProofUrl}`} alt="Guest ID"
                                        className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white font-bold text-[10px] gap-1">
                                        <Search className="w-3 h-3" /> View Large
                                      </div>
                                    </a>
                                  </div>
                                ) : (
                                  <p className="text-slate italic">No ID image uploaded</p>
                                )}
                              </div>
                            </div>

                            {/* Stay Details */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-navy uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-border-cream/30 pb-1.5">
                                <Info className="w-3.5 h-3.5 text-gold" /> Stay & Booking Info
                              </h4>
                              <div className="space-y-1.5 text-slate">
                                <p><strong className="text-charcoal font-semibold">Rate Plan:</strong> {b.ratePlan || 'EP'}</p>
                                <p><strong className="text-charcoal font-semibold">Source:</strong> {SOURCE_LABELS[b.source] || b.source}</p>
                                <p><strong className="text-charcoal font-semibold">Arrival Time:</strong> {b.expectedArrival || 'N/A'}</p>
                                <p><strong className="text-charcoal font-semibold">Purpose:</strong> {b.purposeOfVisit || 'N/A'}</p>
                                {b.vehicleNumber && <p><strong className="text-charcoal font-semibold">Vehicle No:</strong> {b.vehicleNumber}</p>}
                                {b.companyName && <p><strong className="text-charcoal font-semibold">Company:</strong> {b.companyName} {b.gstNumber ? `(GST: ${b.gstNumber})` : ''}</p>}
                                {cleanSpecialRequests(b.specialRequest) && (
                                  <div className="mt-2 p-2 bg-cream/20 border border-border-cream/40 rounded-xl space-y-1">
                                    <span className="text-[9px] font-bold text-navy uppercase tracking-wider block">Special Requests</span>
                                    <span className="text-[10px] font-semibold text-slate block leading-relaxed">{cleanSpecialRequests(b.specialRequest)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stay Bill Details */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-navy uppercase tracking-wider text-[10px] flex items-center gap-1.5 border-b border-border-cream/30 pb-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-gold" /> Financial Summary
                              </h4>
                              <div className="space-y-1.5 text-xs text-slate">
                                <div className="flex justify-between">
                                  <span>Room Charges ({nights} nights)</span>
                                  <span className="font-semibold text-charcoal">₹{((b.ratePerNight || 0) * nights).toLocaleString('en-IN')}</span>
                                </div>
                                {b.extraCharges > 0 && (
                                  <div className="flex justify-between text-rose-600">
                                    <span>Extra Charges</span>
                                    <span className="font-semibold">₹{b.extraCharges.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {b.discount > 0 && (
                                  <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span className="font-semibold">-₹{b.discount.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-border-cream/40 pt-1.5 font-bold text-navy">
                                  <span>Total Amount</span>
                                  <span>₹{(b.totalAmount || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-emerald-600 font-medium">
                                  <span>Advance Paid</span>
                                  <span>₹{(b.advancePaid || 0).toLocaleString('en-IN')} {b.advanceMethod ? `(${b.advanceMethod})` : ''}</span>
                                </div>
                                <div className={`flex justify-between border-t border-border-cream/40 pt-1.5 font-bold ${b.totalAmount - (b.advancePaid || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  <span>Balance Due</span>
                                  <span>₹{(Math.max(0, b.totalAmount - (b.advancePaid || 0))).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Co-Guests Dedicated Section */}
                          {(() => {
                            const coGuests = parseCoGuestsFromSpecialRequest(b.specialRequest);
                            if (coGuests.length === 0) return null;
                            return (
                              <div className="mt-5 pt-4 border-t border-border-cream/40 space-y-3">
                                <h4 className="font-bold text-navy uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-gold" /> Co-Guests Information ({coGuests.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {coGuests.map(cg => (
                                    <div key={cg.num} className="bg-cream/10 border border-border-cream/50 rounded-2xl p-4 flex gap-4 items-start shadow-sm hover:border-gold/45 transition-colors">
                                      <div className="w-9 h-9 rounded-full bg-navy/10 text-navy flex items-center justify-center font-bold text-xs flex-shrink-0">
                                        {cg.name?.[0]?.toUpperCase() || 'C'}
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <h5 className="font-bold text-navy text-xs truncate">{cg.name || 'Unnamed Co-Guest'}</h5>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate">
                                          <p><span className="font-semibold text-charcoal">Phone:</span> {cg.phone || 'N/A'}</p>
                                          <p><span className="font-semibold text-charcoal">Email:</span> {cg.email || 'N/A'}</p>
                                          <p><span className="font-semibold text-charcoal">Gender:</span> {cg.gender || 'N/A'}</p>
                                          <p><span className="font-semibold text-charcoal">DOB:</span> {cg.dob || 'N/A'}</p>
                                          <p className="col-span-2"><span className="font-semibold text-charcoal">ID:</span> {cg.idType} - {cg.idNumber || 'N/A'}</p>
                                        </div>
                                      </div>
                                      {cg.idProofUrl && cg.idProofUrl !== 'N/A' && (
                                        <a href={`http://localhost:5000${cg.idProofUrl}`} target="_blank" rel="noreferrer"
                                          className="group relative w-20 h-14 border border-border-cream rounded-lg overflow-hidden flex-shrink-0 bg-white shadow-sm hover:border-gold transition-all">
                                          <img src={`http://localhost:5000${cg.idProofUrl}`} alt="Co-guest ID"
                                            className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300" />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[8px] font-bold">
                                            View
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border-cream bg-cream/5">
            <span className="text-[10px] font-semibold text-slate">Showing {filtered.length} of {bookings.length} reservations</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reservations;
