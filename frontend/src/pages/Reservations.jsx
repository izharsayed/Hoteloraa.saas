import React, { useState, useEffect, useRef } from 'react';
import { CalendarRange, Plus, Search, Calendar, ChevronRight, UserPlus, X, Info, User, Phone, Mail, Bed, FileText, Users, DollarSign, Camera, Upload, Trash2, Image } from 'lucide-react';
import api from '../utils/api';

function Reservations() {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isNewGuest, setIsNewGuest] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  
  // Quick Guest Creation State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Guest ID and Document capture states
  const [guestIdType, setGuestIdType] = useState('NATIONAL_ID');
  const [guestIdNumber, setGuestIdNumber] = useState('');
  const [guestIdProofUrl, setGuestIdProofUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const videoRef = useRef(null);

  // Booking details state
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [ratePerNight, setRatePerNight] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [specialRequest, setSpecialRequest] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('WALK_IN');
  const [saving, setSaving] = useState(false);

  // Fetch all reservations and guests
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await api.get('/reservations');
      setBookings(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const data = await api.get('/guests');
      setGuests(data);
    } catch (err) {
      console.error('Error fetching guests:', err);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchGuests();
  }, []);

  // Fetch available rooms when check-in or check-out changes
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      if (d2 > d1) {
        api.get(`/rooms/available?checkIn=${checkInDate}&checkOut=${checkOutDate}`)
          .then((data) => {
            setAvailableRooms(data);
            setSelectedRoomId(''); // Reset room selection
          })
          .catch((err) => {
            console.error('Error fetching available rooms:', err);
            setAvailableRooms([]);
          });
      } else {
        setAvailableRooms([]);
      }
    } else {
      setAvailableRooms([]);
    }
  }, [checkInDate, checkOutDate]);

  // Clear default rate when room selection is cleared
  useEffect(() => {
    if (!selectedRoomId) {
      setRatePerNight('');
    }
  }, [selectedRoomId]);

  const showToast = (message, isSuccess = true) => {
    if (isSuccess) {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetForm = () => {
    setIsNewGuest(false);
    setSelectedGuestId('');
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setGuestIdType('NATIONAL_ID');
    setGuestIdNumber('');
    setGuestIdProofUrl('');
    stopCamera();
    setCheckInDate('');
    setCheckOutDate('');
    setAvailableRooms([]);
    setSelectedRoomId('');
    setRatePerNight('');
    setAdults(1);
    setChildren(0);
    setSpecialRequest('');
    setNotes('');
    setSource('WALK_IN');
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Failed to open camera:', err);
      alert('Could not access camera. Please check permissions or upload an image instead.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      setUploadingImage(true);
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to capture photo');
          setUploadingImage(false);
          return;
        }
        try {
          const formData = new FormData();
          formData.append('file', blob, 'guest_id.jpg');
          const response = await api.upload('/guests/upload-id', formData);
          setGuestIdProofUrl(response.url);
          stopCamera();
        } catch (err) {
          console.error(err);
          alert(err.message || 'Failed to upload captured image');
        } finally {
          setUploadingImage(false);
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error(err);
      alert('Capture failed');
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.upload('/guests/upload-id', formData);
      setGuestIdProofUrl(response.url);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to upload file');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!checkInDate || !checkOutDate || !selectedRoomId || !ratePerNight) {
      showToast('Please fill out all required fields', false);
      return;
    }

    try {
      setSaving(true);
      let guestId = selectedGuestId;

      // 1. Quick Guest Creation if checked
      if (isNewGuest) {
        if (!guestName || !guestPhone) {
          showToast('Guest Name and Phone are required', false);
          setSaving(false);
          return;
        }

        const createdGuest = await api.post('/guests', {
          name: guestName,
          phone: guestPhone,
          email: guestEmail || undefined,
          idType: guestIdType,
          idNumber: guestIdNumber || undefined,
          idProofUrl: guestIdProofUrl || undefined,
          address: 'Not Provided',
          city: 'Not Provided',
          country: 'India'
        });

        guestId = createdGuest.id;
        // Refresh guest list
        fetchGuests();
      }

      if (!guestId) {
        showToast('Please select or create a guest', false);
        setSaving(false);
        return;
      }

      // 2. Create Reservation
      await api.post('/reservations', {
        roomId: selectedRoomId,
        guestId,
        checkInDate,
        checkOutDate,
        adults: parseInt(adults),
        children: parseInt(children),
        ratePerNight: parseFloat(ratePerNight),
        specialRequest: specialRequest || undefined,
        notes: notes || undefined,
        source
      });

      showToast('Booking created successfully!');
      setShowAddModal(false);
      resetForm();
      fetchReservations();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to create booking', false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      showToast('Reservation cancelled successfully!');
      fetchReservations();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to cancel reservation', false);
    }
  };

  // Filter logic
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = selectedStatus === 'All' || booking.status === selectedStatus;
    const matchesSearch = 
      (booking.bookingRef && booking.bookingRef.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (booking.guest?.name && booking.guest.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (booking.room?.number && booking.room.number.includes(searchQuery));
    return matchesStatus && matchesSearch;
  });

  // Calculate live summary
  const nights = checkInDate && checkOutDate ? (() => {
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    if (d2 <= d1) return 0;
    const ms = 1000 * 60 * 60 * 24;
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / ms));
  })() : 0;

  const totalCost = nights * (parseFloat(ratePerNight) || 0);

  return (
    <div className="space-y-8 animate-fadeIn flex flex-col h-full">
      {/* Alert Banners */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-sm fixed top-4 right-4 z-50 animate-slideIn">
          <Info className="w-4 h-4 text-emerald-600" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-sm fixed top-4 right-4 z-50 animate-slideIn">
          <Info className="w-4 h-4 text-red-600" /> {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Reservations Registry</h1>
          <p className="text-slate text-sm font-medium mt-1">Manage guest bookings, check dates, and allocate rooms</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4 text-gold" /> New Booking
        </button>
      </div>

      {/* Filter and search */}
      <div className="soft-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shrink-0">
        <div className="flex items-center gap-2 bg-cream/20 border border-border-cream rounded-xl px-3 py-1.5 w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate" />
          <input 
            id="searchInput"
            name="searchQuery"
            type="text" 
            placeholder="Search by Guest name, Room # or Res ID..." 
            aria-label="Search bookings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent focus:outline-none text-xs w-full text-charcoal font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {['All', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap
                ${selectedStatus === status 
                  ? 'bg-navy border-navy text-gold shadow-sm' 
                  : 'bg-white border-border-cream text-slate hover:bg-gold-pale/10'
                }
              `}
            >
              {status === 'All' ? 'All' : status.replace('_', '-')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="soft-card p-6 bg-white flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-20 text-slate font-semibold text-xs animate-pulse">Loading reservations registry...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 text-slate text-xs font-semibold">
            No reservations found. Click 'New Booking' to reserve a room.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-cream text-[10px] font-bold text-slate uppercase tracking-wider">
                  <th className="pb-3">Reservation ID</th>
                  <th className="pb-3">Guest Name</th>
                  <th className="pb-3">Room / Category</th>
                  <th className="pb-3"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Check-In</span></th>
                  <th className="pb-3"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Check-Out</span></th>
                  <th className="pb-3 text-right">Est. Cost</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-cream/40 text-xs">
                {filteredBookings.map((book) => (
                  <tr key={book.id} className="hover:bg-gold-pale/10 transition-colors">
                    <td className="py-4 font-mono font-semibold text-navy">{book.bookingRef}</td>
                    <td className="py-4 font-semibold text-charcoal">
                      <div>{book.guest?.name}</div>
                      <div className="text-[10px] text-slate font-normal">{book.guest?.phone}</div>
                    </td>
                    <td className="py-4 text-slate">
                      <span className="font-semibold text-charcoal">Room {book.room?.number}</span>
                      <span className="text-[10px] block">{book.room?.roomType?.name}</span>
                    </td>
                    <td className="py-4 font-mono">{new Date(book.checkInDate).toISOString().split('T')[0]}</td>
                    <td className="py-4 font-mono">{new Date(book.checkOutDate).toISOString().split('T')[0]}</td>
                    <td className="py-4 font-mono font-bold text-navy text-right">₹{book.totalAmount.toLocaleString()}</td>
                    <td className="py-4 text-center">
                      <span className={`
                        px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider inline-block
                        ${(book.status === 'PENDING' || book.status === 'CONFIRMED') && 'bg-gold-pale text-gold border border-gold/20'}
                        ${book.status === 'CHECKED_IN' && 'bg-blue-50 text-blue-800 border border-blue-200'}
                        ${book.status === 'CHECKED_OUT' && 'bg-success-pale text-success border border-success/20'}
                        ${book.status === 'CANCELLED' && 'bg-danger-pale text-danger border border-danger/20'}
                        ${book.status === 'NO_SHOW' && 'bg-slate-100 text-slate-700 border border-slate-200'}
                      `}>
                        {book.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-2">
                      {['PENDING', 'CONFIRMED'].includes(book.status) && (
                        <button
                          onClick={() => handleCancelReservation(book.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 hover:border-red-200 transition-all"
                          title="Cancel Booking"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border border-border-cream">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-cream flex justify-between items-center bg-white/60 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-gold" />
                <h3 className="font-display font-bold text-lg text-navy">New Reservation Booking</h3>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-1.5 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateBooking} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Guest, Dates, Occupancy */}
                <div className="space-y-4">
                  
                  {/* Guest Selection Card */}
                  <div className="bg-white border border-border-cream p-5 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-border-cream/40">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-navy">Guest Profile</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-navy font-bold cursor-pointer">
                        <input 
                          id="isNewGuestCheck"
                          name="isNewGuest"
                          type="checkbox" 
                          checked={isNewGuest}
                          onChange={(e) => {
                            setIsNewGuest(e.target.checked);
                            setSelectedGuestId('');
                          }}
                          className="rounded border-border-cream text-gold focus:ring-gold"
                        />
                        New Guest?
                      </label>
                    </div>

                    {!isNewGuest ? (
                      <div className="space-y-1">
                        <label htmlFor="selectedGuestId" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Select Existing Guest</label>
                        <select
                          id="selectedGuestId"
                          name="guestId"
                          value={selectedGuestId}
                          onChange={(e) => setSelectedGuestId(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                        >
                          <option value="">Select Guest...</option>
                          {guests.map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.phone})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <label htmlFor="guestNameInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Guest Name *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/50" />
                            <input 
                              id="guestNameInput"
                              name="guestName"
                              type="text"
                              required
                              placeholder="e.g. Amit Sharma"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200 shadow-inner"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="guestPhoneInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Phone Number *</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/50" />
                              <input 
                                id="guestPhoneInput"
                                name="guestPhone"
                                type="text"
                                required
                                placeholder="e.g. 9988776655"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200 shadow-inner"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="guestEmailInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/50" />
                              <input 
                                id="guestEmailInput"
                                name="guestEmail"
                                type="email"
                                placeholder="e.g. amit@gmail.com"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200 shadow-inner"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label htmlFor="guestIdTypeSelect" className="block text-[10px] font-bold uppercase tracking-wider text-slate">ID Proof Type *</label>
                            <select
                              id="guestIdTypeSelect"
                              value={guestIdType}
                              onChange={(e) => setGuestIdType(e.target.value)}
                              className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                            >
                              <option value="NATIONAL_ID">National ID / Aadhaar</option>
                              <option value="PASSPORT">Passport</option>
                              <option value="DRIVING_LICENSE">Driving License</option>
                              <option value="AADHAAR">Aadhaar Card</option>
                              <option value="OTHER">Other ID</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="guestIdNumberInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">ID Number</label>
                            <input 
                              id="guestIdNumberInput"
                              type="text"
                              placeholder="e.g. ID-483920"
                              value={guestIdNumber}
                              onChange={(e) => setGuestIdNumber(e.target.value)}
                              className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200 shadow-inner"
                            />
                          </div>
                        </div>

                        {/* ID Photo Uploader & Camera Capture */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate">ID Document Image</label>
                          
                          {isCapturing ? (
                            <div className="relative border border-dashed border-gold/40 rounded-2xl overflow-hidden bg-navy/5 flex flex-col items-center p-3 gap-3">
                              <video 
                                ref={videoRef} 
                                className="w-full max-h-56 object-cover rounded-xl bg-black"
                                playsInline 
                                muted
                              />
                              <div className="flex gap-2 w-full">
                                <button 
                                  type="button"
                                  onClick={capturePhoto}
                                  disabled={uploadingImage}
                                  className="w-1/2 btn-primary flex items-center justify-center gap-1 text-[11px] py-2"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  {uploadingImage ? 'Uploading...' : 'Take Photo'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={stopCamera}
                                  className="w-1/2 btn-secondary text-[11px] py-2"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : guestIdProofUrl ? (
                            <div className="relative border border-border-cream rounded-2xl p-2 bg-cream/5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-cream/30 overflow-hidden border border-border-cream/60 flex items-center justify-center">
                                  <img 
                                    src={`http://localhost:5000${guestIdProofUrl}`} 
                                    alt="ID Proof" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-navy block">Document Uploaded</span>
                                  <span className="text-[9px] text-slate font-mono block truncate max-w-44">{guestIdProofUrl}</span>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setGuestIdProofUrl('')}
                                className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Remove photo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-border-cream rounded-2xl p-5 bg-cream/5 flex flex-col items-center justify-center text-center gap-3">
                              <div className="p-3 bg-white border border-border-cream rounded-2xl shadow-sm text-slate">
                                <Image className="w-6 h-6 text-slate/60" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-navy block">Add ID Document Photo</span>
                                <span className="text-[10px] text-slate font-medium block mt-0.5">Upload a copy or take a photo with your device camera</span>
                              </div>
                              <div className="flex gap-2 w-full mt-1">
                                <label className="w-1/2 flex items-center justify-center gap-1.5 border border-border-cream hover:bg-cream/10 bg-white text-navy font-bold rounded-xl text-xs py-2 px-3 cursor-pointer shadow-sm active:scale-95 transition-all text-center">
                                  <Upload className="w-3.5 h-3.5" />
                                  Upload File
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploadingImage}
                                    className="hidden"
                                  />
                                </label>
                                <button 
                                  type="button"
                                  onClick={startCamera}
                                  className="w-1/2 flex items-center justify-center gap-1.5 border border-border-cream hover:bg-cream/10 bg-white text-navy font-bold rounded-xl text-xs py-2 px-3 shadow-sm active:scale-95 transition-all"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  Use Camera
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates & Source Card */}
                  <div className="bg-white border border-border-cream p-5 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-border-cream/40">
                      <Calendar className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy">Dates & Booking Source</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="checkInDateInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Check-In Date *</label>
                        <input 
                          id="checkInDateInput"
                          name="checkInDate"
                          type="date"
                          required
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="checkOutDateInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Check-Out Date *</label>
                        <input 
                          id="checkOutDateInput"
                          name="checkOutDate"
                          type="date"
                          required
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {checkInDate && checkOutDate && (
                      <div className="space-y-1 pt-1 animate-fadeIn">
                        <label htmlFor="sourceSelect" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Booking Source</label>
                        <select
                          id="sourceSelect"
                          name="source"
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                        >
                          <option value="WALK_IN">Walk-In</option>
                          <option value="PHONE">Phone Booking</option>
                          <option value="ONLINE">Online Portal</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Occupancy Card */}
                  <div className="bg-white border border-border-cream p-5 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-border-cream/40">
                      <Users className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy">Room Occupants</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="adultsInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Adults *</label>
                        <input 
                          id="adultsInput"
                          name="adults"
                          type="number"
                          required
                          min="1"
                          value={adults}
                          onChange={(e) => setAdults(e.target.value)}
                          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="childrenInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Children</label>
                        <input 
                          id="childrenInput"
                          name="children"
                          type="number"
                          min="0"
                          value={children}
                          onChange={(e) => setChildren(e.target.value)}
                          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                </div>
                
                {/* Right Column: Room allocation, special requests, cost details */}
                <div className="space-y-4">
                  
                  {/* Room Allocation Card */}
                  <div className="bg-white border border-border-cream p-5 rounded-2xl space-y-3 shadow-sm flex flex-col justify-center min-h-[160px]">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-border-cream/40 shrink-0">
                      <Bed className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy">Room Allocation</span>
                    </div>

                    {!checkInDate || !checkOutDate ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-1.5">
                        <Calendar className="w-6 h-6 text-slate/30" />
                        <span className="text-[11px] text-slate font-medium">Select Check-in & Check-out dates on the left to load available rooms.</span>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1 animate-fadeIn flex-1 flex flex-col justify-center">
                        <div className="space-y-1">
                          <label htmlFor="selectedRoomSelect" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Select Available Room *</label>
                          <select
                            id="selectedRoomSelect"
                            name="roomId"
                            value={selectedRoomId}
                            onChange={(e) => {
                              const roomId = e.target.value;
                              setSelectedRoomId(roomId);
                              if (roomId) {
                                const room = availableRooms.find(r => r.id === roomId);
                                if (room && room.roomType) {
                                  setRatePerNight(String(room.roomType.basePrice));
                                } else {
                                  setRatePerNight('');
                                }
                              } else {
                                setRatePerNight('');
                              }
                            }}
                            required
                            className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                          >
                            <option value="">Choose Room...</option>
                            {availableRooms.length === 0 ? (
                              <option disabled>No rooms available for selected dates</option>
                            ) : (
                              availableRooms.map(r => (
                                <option key={r.id} value={r.id}>
                                  Room {r.number} - {r.roomType?.name} (₹{r.roomType?.basePrice}/night)
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {selectedRoomId && (
                          <div className="space-y-1 pt-1 animate-fadeIn">
                            <label htmlFor="ratePerNightInput" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Rate per Night (₹) *</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate/50" />
                              <input 
                                id="ratePerNightInput"
                                name="ratePerNight"
                                type="number"
                                required
                                value={ratePerNight}
                                onChange={(e) => setRatePerNight(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Special Requests & Notes Card */}
                  <div className="bg-white border border-border-cream p-5 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-border-cream/40">
                      <FileText className="w-3.5 h-3.5 text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy">Additional Information</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label htmlFor="specialRequestTextarea" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Special Requests</label>
                        <textarea 
                          id="specialRequestTextarea"
                          name="specialRequest"
                          placeholder="e.g. Extra bed, early check-in..."
                          value={specialRequest}
                          onChange={(e) => setSpecialRequest(e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200 resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="notesTextarea" className="block text-[10px] font-bold uppercase tracking-wider text-slate">Internal Notes</label>
                        <textarea 
                          id="notesTextarea"
                          name="notes"
                          placeholder="Staff visible notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold focus:bg-white text-xs font-semibold bg-cream/20 transition-all duration-200 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Cost Summary / Digital Bill Ticket */}
                  {selectedRoomId && nights > 0 ? (
                    <div className="bg-navy border border-gold/25 text-gold p-4 rounded-2xl space-y-3 shadow-md animate-fadeIn">
                      <div className="flex items-center justify-between pb-2 border-b border-gold/15">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Booking Estimate</span>
                        <span className="bg-gold/10 text-gold text-[9px] px-2 py-0.5 rounded font-mono font-bold tracking-wider">{nights} NIGHTS</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-cream/70 font-medium">
                        <div className="flex justify-between">
                          <span>Room Rate:</span>
                          <span className="font-mono">₹{(parseFloat(ratePerNight) || 0).toLocaleString()} / night</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stay Duration:</span>
                          <span>{nights} night(s)</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gold/15">
                        <span className="text-xs font-bold text-gold">Estimated Total:</span>
                        <span className="text-xl font-bold text-gold font-mono">₹{totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-border-cream p-5 rounded-2xl flex items-center justify-between text-slate text-xs font-medium h-[86px] shrink-0 shadow-sm">
                      <span className="text-slate/60 text-[11px] font-semibold uppercase tracking-wider">Estimated Total</span>
                      <span className="text-lg font-bold font-mono text-slate/40">₹0</span>
                    </div>
                  )}

                </div>

              </div>

              {/* Modal Footer / Actions */}
              <div className="flex gap-4 pt-4 border-t border-border-cream shrink-0 justify-end bg-white/60 backdrop-blur-sm p-6 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="btn-secondary px-6 py-2.5 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedRoomId}
                  className="btn-primary px-8 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Book Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reservations;
