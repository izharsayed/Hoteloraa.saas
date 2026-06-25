import React, { useState } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Clock, 
  Plus, 
  Check, 
  Settings, 
  Sliders, 
  Percent, 
  PlusCircle, 
  ListOrdered,
  Briefcase
} from 'lucide-react';

function ManagerPage() {
  // Operational Metrics
  const [occupancyRate] = useState(78);
  const [adr] = useState(6500);
  const [revpar] = useState(5070);
  const [covers] = useState(148);

  // Pricing State
  const [roomRates, setRoomRates] = useState([
    { id: 1, type: 'Standard Room', basePrice: 3500, currentPrice: 3500 },
    { id: 2, type: 'Deluxe Suite', basePrice: 6000, currentPrice: 6900 }, // With markup
    { id: 3, type: 'Presidential Penthouse', basePrice: 15000, currentPrice: 15000 },
  ]);
  
  const [weekendMarkup, setWeekendMarkup] = useState(15); // in %
  const [holidayRate, setHolidayRate] = useState(false);
  const [menuMultiplier, setMenuMultiplier] = useState(0); // Happy hour discount in %

  // Expenses State
  const [expenses, setExpenses] = useState([
    { id: 1, description: 'Linen Laundry Service', category: 'Laundry', amount: 6200, date: '2026-06-18' },
    { id: 2, description: 'Fresh Seafood Supplies', category: 'Food & Beverage', amount: 14500, date: '2026-06-19' },
    { id: 3, description: 'AC Repair (Room 304)', category: 'Maintenance', amount: 4800, date: '2026-06-19' },
    { id: 4, description: 'Monthly Electricity Payout', category: 'Utilities', amount: 28400, date: '2026-06-15' },
  ]);

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Utilities');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Staff Shift State
  const [staffShifts, setStaffShifts] = useState([
    { id: 1, name: 'Priya Iyer', role: 'Receptionist', shift: 'Morning (07:00 - 15:00)', status: 'ON_DUTY' },
    { id: 2, name: 'Aarav Patel', role: 'Captain', shift: 'Evening (15:00 - 23:00)', status: 'ON_DUTY' },
    { id: 3, name: 'Siddharth Roy', role: 'Chef', shift: 'Morning (07:00 - 15:00)', status: 'ON_DUTY' },
    { id: 4, name: 'Rohan Verma', role: 'Housekeeper', shift: 'Night (23:00 - 07:00)', status: 'OFF_DUTY' },
    { id: 5, name: 'Meera Sen', role: 'Accountant', shift: 'Morning (09:00 - 17:00)', status: 'OFF_DUTY' },
  ]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdateRates = (id, newBase) => {
    const updated = roomRates.map(r => {
      if (r.id === id) {
        const final = holidayRate 
          ? newBase * 1.3 
          : newBase * (1 + weekendMarkup / 100);
        return { ...r, basePrice: newBase, currentPrice: Math.round(final) };
      }
      return r;
    });
    setRoomRates(updated);
    showToast('Base pricing updated successfully!');
  };

  const handleToggleHolidayRate = () => {
    const active = !holidayRate;
    setHolidayRate(active);
    
    const updated = roomRates.map(r => {
      const final = active 
        ? r.basePrice * 1.3 
        : r.basePrice * (1 + weekendMarkup / 100);
      return { ...r, currentPrice: Math.round(final) };
    });
    setRoomRates(updated);
    showToast(active ? 'Holiday Peak Season Rates Activated (+30%)' : 'Standard Dynamic Rates Restored');
  };

  const handleLogExpense = (e) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;

    const newExpense = {
      id: Date.now(),
      description: expenseDesc,
      category: expenseCategory,
      amount: parseFloat(expenseAmount),
      date: new Date().toISOString().split('T')[0]
    };

    setExpenses([newExpense, ...expenses]);
    setExpenseDesc('');
    setExpenseAmount('');
    showToast('Expense recorded successfully!');
  };

  const handleToggleStaffStatus = (id) => {
    const updated = staffShifts.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY';
        showToast(`${s.name} status updated to ${newStatus.replace('_', ' ')}`);
        return { ...s, status: newStatus };
      }
      return s;
    });
    setStaffShifts(updated);
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-navy border border-gold text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-stone-900/10 animate-slideIn">
          <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Manager Operations Hub</h1>
          <p className="text-slate text-sm font-medium mt-1">Audit daily operational performance, adjust room rates, record company expenses, and coordinate shifts</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Occupancy */}
        <div className="soft-card p-6 bg-white flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Occupancy Rate</p>
            <h3 className="font-display font-bold text-2xl text-navy">{occupancyRate}%</h3>
            <span className="text-[10px] text-success font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Optimal level
            </span>
          </div>
          <div className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center border border-border-cream/50 text-gold">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* ADR */}
        <div className="soft-card p-6 bg-white flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Average Daily Rate (ADR)</p>
            <h3 className="font-display font-bold text-2xl text-navy">₹{adr.toLocaleString()}</h3>
            <span className="text-[10px] text-slate font-medium">Daily average per occupied room</span>
          </div>
          <div className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center border border-border-cream/50 text-gold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* RevPAR */}
        <div className="soft-card p-6 bg-white flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate uppercase tracking-wider">RevPAR</p>
            <h3 className="font-display font-bold text-2xl text-navy">₹{revpar.toLocaleString()}</h3>
            <span className="text-[10px] text-slate font-medium">Revenue per available room</span>
          </div>
          <div className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center border border-border-cream/50 text-gold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Restaurant Covers */}
        <div className="soft-card p-6 bg-white flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Dining Covers Served</p>
            <h3 className="font-display font-bold text-2xl text-navy">{covers}</h3>
            <span className="text-[10px] text-slate font-medium">Restaurant guest count today</span>
          </div>
          <div className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center border border-border-cream/50 text-gold">
            <ListOrdered className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Pricing Policy Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="soft-card bg-white p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-border-cream pb-3">
              <h3 className="font-display font-semibold text-lg text-navy flex items-center gap-2">
                <Sliders className="w-5 h-5 text-gold" /> Dynamic Pricing Controls
              </h3>
              <button 
                onClick={handleToggleHolidayRate}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  holidayRate 
                    ? 'bg-danger border-danger text-white' 
                    : 'border-border-cream hover:border-gold text-slate'
                }`}
              >
                {holidayRate ? '🎄 Peak Season Active' : 'Enable Peak Season'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 bg-cream/10 border border-border-cream/50 rounded-2xl">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1">
                  <Percent className="w-4 h-4 text-gold" /> Weekend Base Markups (%)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    value={weekendMarkup}
                    onChange={(e) => setWeekendMarkup(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-border-cream rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-gold"
                  />
                  <button 
                    onClick={() => {
                      const updated = roomRates.map(r => ({
                        ...r,
                        currentPrice: Math.round(r.basePrice * (1 + weekendMarkup / 100))
                      }));
                      setRoomRates(updated);
                      showToast(`Weekend markup set to ${weekendMarkup}%`);
                    }}
                    className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 shrink-0"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[10px] text-slate">Automatically applies markup configurations to standard weekend bookings.</p>
              </div>

              <div className="space-y-2 p-4 bg-cream/10 border border-border-cream/50 rounded-2xl">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1">
                  <Percent className="w-4 h-4 text-gold" /> Happy Hour Menu Discounts (%)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    value={menuMultiplier}
                    onChange={(e) => setMenuMultiplier(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-border-cream rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-gold"
                  />
                  <button 
                    onClick={() => showToast(`Happy Hour Food & Beverage discount set to ${menuMultiplier}%`)}
                    className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 shrink-0"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[10px] text-slate">Applies discount markdowns on POS restaurant items checkout ledger.</p>
              </div>
            </div>

            {/* Room Rates List */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-navy uppercase tracking-wider block">Base Room Price Configurations</span>
              <div className="space-y-2">
                {roomRates.map((room) => (
                  <div key={room.id} className="flex justify-between items-center p-4 bg-cream/5 border border-border-cream/40 rounded-2xl">
                    <div>
                      <span className="text-xs font-bold text-charcoal">{room.type}</span>
                      <p className="text-[10px] text-slate mt-0.5 font-mono">
                        Base: ₹{room.basePrice.toLocaleString()} / night
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate uppercase tracking-wider block">Selling Price</span>
                        <span className="text-xs font-bold font-mono text-navy">₹{room.currentPrice.toLocaleString()}</span>
                      </div>
                      <input 
                        type="number" 
                        placeholder="New Base"
                        className="w-20 px-2 py-1 bg-white border border-border-cream rounded-lg text-xs font-mono text-center focus:outline-none focus:border-gold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateRates(room.id, parseFloat(e.target.value) || room.basePrice);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Expense Logging Board */}
        <div className="soft-card bg-white p-6 space-y-6">
          <div>
            <h3 className="font-display font-semibold text-navy text-sm border-b border-border-cream pb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" /> Log Operational Expenses
            </h3>
          </div>

          <form onSubmit={handleLogExpense} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Description</label>
              <input 
                type="text" 
                required
                placeholder="Cleaning supplies, hardware repair..."
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full px-3 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                >
                  <option value="Utilities">Utilities</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  placeholder="5000"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-mono font-bold"
                />
              </div>
            </div>

            <button type="submit" className="w-full btn-primary text-xs py-2.5 flex justify-center items-center gap-2 mt-2">
              <PlusCircle className="w-4 h-4" /> Record Payout Expense
            </button>
          </form>

          {/* Expense History List */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-navy uppercase tracking-wider border-b border-border-cream pb-1">
              <span>Recent Expense Ledger</span>
              <span className="font-mono text-navy">Total: ₹{totalExpenses.toLocaleString()}</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center text-xs border-b border-border-cream/30 pb-2">
                  <div>
                    <span className="font-bold text-charcoal">{exp.description}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-cream text-slate rounded ml-2 border border-border-cream/50 uppercase font-bold tracking-wide">
                      {exp.category}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-navy">-₹{exp.amount.toLocaleString()}</span>
                    <span className="text-[9px] text-slate block mt-0.5">{exp.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Shift Scheduling Board */}
      <div className="soft-card bg-white p-6 space-y-6">
        <div className="border-b border-border-cream pb-3 flex justify-between items-center">
          <div>
            <h3 className="font-display font-semibold text-lg text-navy flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gold" /> Employee Shifts & Duty Schedule
            </h3>
            <p className="text-[11px] text-slate mt-0.5">Assigned shifts board and real-time attendance toggle configurations</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-cream/70 text-[10px] font-bold text-navy uppercase tracking-wider bg-cream/10">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Assigned Shift</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-cream/40 text-xs font-semibold">
              {staffShifts.map((staff) => (
                <tr key={staff.id} className="hover:bg-cream/5 transition-colors">
                  <td className="py-3.5 px-4 text-navy font-bold">{staff.name}</td>
                  <td className="py-3.5 px-4 text-slate">{staff.role}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-charcoal">{staff.shift}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase border ${
                      staff.status === 'ON_DUTY' 
                        ? 'bg-success/10 text-success border-success/20' 
                        : 'bg-stone-50 text-slate border-stone-200'
                    }`}>
                      {staff.status === 'ON_DUTY' ? 'On Duty' : 'Off Duty'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button 
                      onClick={() => handleToggleStaffStatus(staff.id)}
                      className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${
                        staff.status === 'ON_DUTY' 
                          ? 'border-danger-pale text-danger hover:bg-danger-pale' 
                          : 'border-success/20 text-success hover:bg-success/10'
                      }`}
                    >
                      {staff.status === 'ON_DUTY' ? 'Clock Out' : 'Clock In'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManagerPage;
