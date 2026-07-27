import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  User, 
  Search, 
  DoorOpen, 
  ClipboardList, 
  Info, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import api from '../utils/api';

function CheckIn() {
  const [pendingReservations, setPendingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [idType, setIdType] = useState('AADHAAR');
  const [idNumber, setIdNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingCheckIns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/check-in/pending');
      setPendingReservations(data || []);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to fetch pending check-ins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCheckIns();
  }, []);

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    setIsCheckedIn(false);
    setIdType(booking.guest?.idType || 'AADHAAR');
    setIdNumber(booking.guest?.idNumber || '');
    setNotes('');
  };

  const handleCompleteCheckIn = async (e) => {
    e.preventDefault();
    if (selectedBooking?.room?.status === 'CLEANING') {
      alert('Room is under cleaning. Please select/allocate another room.');
      return;
    }

    if (!idNumber) {
      alert('Please enter a guest ID verification number.');
      return;
    }

    try {
      setSubmitting(true);
      // 1. Update guest ID info if it has changed
      if (
        selectedBooking.guest?.idType !== idType ||
        selectedBooking.guest?.idNumber !== idNumber
      ) {
        await api.put(`/guests/${selectedBooking.guest?.id}`, {
          idType,
          idNumber,
        });
      }

      // 2. Perform check-in
      await api.post('/check-in', {
        reservationId: selectedBooking.id,
        notes: notes || undefined,
      });

      setIsCheckedIn(true);
      // Refresh pending checkins list
      fetchPendingCheckIns();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to complete check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBookings = pendingReservations.filter((booking) => {
    const searchLower = searchId.toLowerCase();
    const guestName = booking.guest?.name?.toLowerCase() || '';
    const guestPhone = booking.guest?.phone?.toLowerCase() || '';
    const ref = booking.bookingRef?.toLowerCase() || '';
    return (
      guestName.includes(searchLower) ||
      guestPhone.includes(searchLower) ||
      ref.includes(searchLower)
    );
  });

  const idTypes = [
    { value: 'AADHAAR', label: 'Aadhaar Card' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENSE', label: 'Driving License' },
    { value: 'NATIONAL_ID', label: 'National ID' },
    { value: 'OTHER', label: 'Other ID' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Front Desk Check-In</h1>
          <p className="text-slate text-sm font-medium mt-1">Verify guests, assign room numbers, and issue room access keys</p>
        </div>
        <button 
          onClick={fetchPendingCheckIns}
          className="flex items-center gap-2 text-xs font-bold text-navy bg-white border border-border-cream px-4 py-2 rounded-xl hover:bg-cream/10 active:scale-95 transition-all shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Search & Checkin Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reservation Search & List Card */}
          <div className="soft-card p-6 bg-white space-y-4">
            <h3 className="font-display font-semibold text-lg text-navy">Search Reservations</h3>
            <div className="relative">
              <Search className="w-5 h-5 absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate" />
              <input 
                type="text"
                placeholder="Search by Guest Name, Booking Ref, or Phone..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-cream/10 border border-border-cream rounded-2xl focus:outline-none focus:border-gold text-sm"
              />
            </div>

            {/* List of Pending Check-Ins */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate text-sm font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                  Loading pending check-ins...
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 py-4 px-4 bg-danger-pale border border-danger/20 rounded-xl text-danger text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-slate text-xs font-semibold border border-dashed border-border-cream rounded-xl">
                  {searchId ? 'No matching pending reservations found.' : 'No pending check-ins today.'}
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const isSelected = selectedBooking?.id === booking.id;
                  return (
                    <div 
                      key={booking.id}
                      onClick={() => handleSelectBooking(booking)}
                      className={`
                        p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center group
                        ${isSelected 
                          ? 'bg-gold-pale/35 border-gold shadow-sm' 
                          : 'bg-white border-border-cream hover:border-gold/40 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-navy group-hover:text-gold transition-colors">
                            {booking.guest?.name}
                          </span>
                          <span className="font-mono text-[9px] font-bold text-slate bg-cream/50 px-1.5 py-0.5 rounded">
                            {booking.bookingRef}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate font-medium">
                          {booking.guest?.phone} | Pre-assigned: <span className="font-semibold text-navy">Room {booking.room?.number}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gold uppercase tracking-wider">
                          {booking.room?.roomType?.name}
                        </span>
                        <div className="text-[9px] text-slate font-semibold mt-0.5">
                          {new Date(booking.checkInDate).toLocaleDateString()} to {new Date(booking.checkOutDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Guest Checkin Detail Card */}
          {selectedBooking && !isCheckedIn && (
            <form onSubmit={handleCompleteCheckIn} className="soft-card p-6 bg-white space-y-6 animate-scaleUp">
              <div className="flex justify-between items-center border-b border-border-cream pb-4">
                <h3 className="font-display font-semibold text-lg text-navy">Check-In Registration</h3>
                <span className="font-mono text-xs font-bold text-gold bg-gold-pale px-2.5 py-1 rounded">
                  {selectedBooking.bookingRef}
                </span>
              </div>

              {/* Cleaning Warning Banner */}
              {selectedBooking.room?.status === 'CLEANING' && (
                <div className="flex items-center gap-2.5 p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Room is under cleaning. Please select/allocate another room.</span>
                </div>
              )}

              {/* Guest Profile summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-cream/20 p-4 rounded-2xl border border-border-cream/40">
                <div>
                  <span className="text-slate block text-[10px] uppercase font-bold tracking-wider">Primary Guest</span>
                  <span className="font-semibold text-charcoal text-sm flex items-center gap-1.5 mt-0.5"><User className="w-4 h-4 text-gold" /> {selectedBooking.guest?.name}</span>
                </div>
                <div>
                  <span className="text-slate block text-[10px] uppercase font-bold tracking-wider">Assigned Room</span>
                  <span className="font-semibold text-charcoal text-sm flex items-center gap-1.5 mt-0.5"><DoorOpen className="w-4 h-4 text-gold" /> Room {selectedBooking.room?.number} ({selectedBooking.room?.roomType?.name})</span>
                </div>
                <div>
                  <span className="text-slate block text-[10px] uppercase font-bold tracking-wider">Dates & Pax</span>
                  <span className="font-semibold text-charcoal text-sm flex items-center gap-1.5 mt-0.5">
                    <ClipboardList className="w-4 h-4 text-gold" /> 
                    {new Date(selectedBooking.checkInDate).toLocaleDateString()} to {new Date(selectedBooking.checkOutDate).toLocaleDateString()} ({selectedBooking.adults} Adults)
                  </span>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID verification */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider block">Identity Document Type</label>
                  <select 
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-4 py-3 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                  >
                    {idTypes.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider block">ID Document Number</label>
                  <input 
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Enter ID document number"
                    className="w-full px-4 py-3 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider block">Check-In Notes / Comments</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add special requests, baggage notes, or check-in remarks..."
                    rows={3}
                    className="w-full px-4 py-3 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-medium text-charcoal resize-none"
                  />
                </div>
              </div>

              {/* Complete checkin button */}
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 btn-primary rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-gold" /> Completing Check-In...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 text-gold" /> Check-In Guest & Activate Room Keys
                  </>
                )}
              </button>
            </form>
          )}

          {/* Success Banner */}
          {isCheckedIn && (
            <div className="soft-card p-8 bg-success-pale border-success/30 text-center space-y-4 animate-scaleUp">
              <ShieldCheck className="w-16 h-16 text-success mx-auto" />
              <div>
                <h3 className="font-display font-bold text-xl text-navy">Check-In Completed!</h3>
                <p className="text-xs text-slate mt-1">
                  Room <span className="font-bold text-navy">{selectedBooking.room?.number}</span> is now marked as **Occupied**.
                </p>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => {
                    setSelectedBooking(null);
                    setSearchId('');
                    setIsCheckedIn(false);
                  }}
                  className="btn-primary mx-auto"
                >
                  Return to Front Desk
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Front desk checkin guidelines */}
        <div className="soft-card p-6 bg-white h-fit space-y-4">
          <h3 className="font-display font-semibold text-navy text-sm border-b border-border-cream pb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-gold" /> Front Desk Guidelines
          </h3>
          <ul className="text-xs text-slate space-y-2 list-disc pl-4 leading-relaxed">
            <li>Verify guest photo matches ID document provided.</li>
            <li>Take print or digital scan of the ID document for tenant records.</li>
            <li>Verify that pre-assigned room {selectedBooking ? `(Room ${selectedBooking.room?.number})` : ''} matches the category booked.</li>
            <li>Configure digital room card keys on the encoder terminal.</li>
            <li>Add any initial deposit charges to the guest folio ledger.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CheckIn;
