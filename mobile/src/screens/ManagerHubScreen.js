import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ManagerHubScreen({ user, onLogout, onOpenDrawer }) {
  // Operational Metrics (Mock state matching web page)
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
  
  const [tempPrices, setTempPrices] = useState({});
  const [weekendMarkup, setWeekendMarkup] = useState('15'); // in %
  const [holidayRate, setHolidayRate] = useState(false);
  const [menuMultiplier, setMenuMultiplier] = useState('0'); // Happy hour discount in %

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
    const numericBase = parseFloat(newBase) || 0;
    const updated = roomRates.map(r => {
      if (r.id === id) {
        const final = holidayRate 
          ? numericBase * 1.3 
          : numericBase * (1 + (parseInt(weekendMarkup) || 0) / 100);
        return { ...r, basePrice: numericBase, currentPrice: Math.round(final) };
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
        : r.basePrice * (1 + (parseInt(weekendMarkup) || 0) / 100);
      return { ...r, currentPrice: Math.round(final) };
    });
    setRoomRates(updated);
    showToast(active ? 'Holiday Peak Season Rates Activated (+30%)' : 'Standard Dynamic Rates Restored');
  };

  const handleApplyWeekendMarkup = () => {
    const markupVal = parseInt(weekendMarkup) || 0;
    const updated = roomRates.map(r => ({
      ...r,
      currentPrice: Math.round(r.basePrice * (1 + markupVal / 100))
    }));
    setRoomRates(updated);
    setHolidayRate(false);
    showToast(`Weekend markup set to ${markupVal}%`);
  };

  const handleApplyHappyHour = () => {
    const discountVal = parseInt(menuMultiplier) || 0;
    showToast(`Happy Hour Food & Beverage discount set to ${discountVal}%`);
  };

  const handleLogExpense = () => {
    if (!expenseDesc || !expenseAmount) return;

    const newExpense = {
      id: Date.now(),
      description: expenseDesc,
      category: expenseCategory,
      amount: parseFloat(expenseAmount) || 0,
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

  const renderMetricCard = (title, value, subtitle, iconName) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Ionicons name={iconName} size={18} color="#D4AF37" />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle ? <Text style={styles.metricSubtitle}>{subtitle}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onOpenDrawer && (
            <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
              <Ionicons name="menu" size={28} color="#D4AF37" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Operations Hub</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Manager</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Toast Notification */}
       {toastMessage ? (
        <View style={styles.toast}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Operational Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Property Metrics</Text>
           <View style={styles.grid}>
            {renderMetricCard("Occupancy Rate", `${occupancyRate}%`, "Optimal level today", "business-outline")}
            {renderMetricCard("ADR", `₹${adr.toLocaleString()}`, "Daily avg per occupied room", "cash-outline")}
            {renderMetricCard("RevPAR", `₹${revpar.toLocaleString()}`, "Rev per available room", "trending-up-outline")}
            {renderMetricCard("Dining Covers", covers.toString(), "Covers served today", "restaurant-outline")}
          </View>
        </View>

        {/* Section 2: Pricing Controls */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Dynamic Pricing Controls</Text>
            <TouchableOpacity
              style={[styles.holidayBtn, holidayRate && styles.holidayBtnActive]}
              onPress={handleToggleHolidayRate}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {holidayRate && <Ionicons name="sparkles" size={12} color="#D4AF37" style={{ marginRight: 4 }} />}
                <Text style={[styles.holidayBtnText, holidayRate && styles.holidayBtnTextActive]}>
                  {holidayRate ? 'Peak Season Active' : 'Enable Peak Season'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Markups & Discounts Forms */}
          <View style={styles.formsGrid}>
            <View style={styles.formBox}>
              <Text style={styles.formBoxLabel}>Weekend Markup (%)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  value={weekendMarkup}
                  onChangeText={setWeekendMarkup}
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyWeekendMarkup}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formBox}>
              <Text style={styles.formBoxLabel}>Happy Hour Discount (%)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.inputField}
                  keyboardType="numeric"
                  value={menuMultiplier}
                  onChangeText={setMenuMultiplier}
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyHappyHour}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Room Rates List */}
          <Text style={styles.subLabel}>Base Room Price Configurations</Text>
          {roomRates.map((room) => {
            const tempPrice = tempPrices[room.id] || '';
            return (
              <View key={room.id} style={styles.roomRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roomName}>{room.type}</Text>
                  <Text style={styles.roomBasePrice}>Base: ₹{room.basePrice.toLocaleString()} / night</Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                  <Text style={styles.roomLabel}>Selling Price</Text>
                  <Text style={styles.roomSellPrice}>₹{room.currentPrice.toLocaleString()}</Text>
                </View>
                <TextInput
                  style={styles.rateInput}
                  placeholder="New Base"
                  placeholderTextColor="#718096"
                  keyboardType="numeric"
                  value={tempPrice}
                  onChangeText={(val) => setTempPrices(prev => ({ ...prev, [room.id]: val }))}
                  onSubmitEditing={() => {
                    handleUpdateRates(room.id, tempPrice);
                    setTempPrices(prev => ({ ...prev, [room.id]: '' }));
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* Section 3: Expense Logging */}
        <View style={styles.cardSection}>
          <Text style={styles.cardHeading}>Log Operational Expenses</Text>
          <View style={styles.expenseForm}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Linen laundry, AC repair, groceries"
              placeholderTextColor="#A0AEC0"
              value={expenseDesc}
              onChangeText={setExpenseDesc}
            />

            <View style={styles.inputGrid}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryPickerContainer}>
                  {/* Simplistic Selector using inline buttons or buttons row */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 38 }}>
                    {['Utilities', 'Food & Beverage', 'Laundry', 'Maintenance', 'Marketing'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catBadge, expenseCategory === cat && styles.catBadgeActive]}
                        onPress={() => setExpenseCategory(cat)}
                      >
                        <Text style={[styles.catBadgeText, expenseCategory === cat && styles.catBadgeTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={{ width: 100 }}>
                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  placeholder="₹ Amount"
                  placeholderTextColor="#A0AEC0"
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitExpenseBtn} onPress={handleLogExpense}>
              <Text style={styles.submitExpenseBtnText}>+ Record Payout Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Expense History List */}
          <View style={styles.expenseLedgerHeader}>
            <Text style={styles.ledgerTitle}>Recent Expense Ledger</Text>
            <Text style={styles.ledgerTotal}>Total: ₹{totalExpenses.toLocaleString()}</Text>
          </View>
          <View style={styles.ledgerList}>
            {expenses.map((exp) => (
              <View key={exp.id} style={styles.ledgerRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.ledgerDesc} numberOfLines={1}>{exp.description}</Text>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{exp.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.ledgerDate}>{exp.date}</Text>
                </View>
                <Text style={styles.ledgerAmount}>-₹{exp.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 4: Employee Shifts & Duty Board */}
        <View style={styles.cardSection}>
          <Text style={styles.cardHeading}>Employee Shifts & Attendance</Text>
          <Text style={styles.cardSubheading}>Assigned shifts board and real-time attendance toggle configurations</Text>

          {staffShifts.map((staff) => {
            const isDuty = staff.status === 'ON_DUTY';
            return (
              <View key={staff.id} style={styles.staffRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <Text style={styles.staffRole}>{staff.role} • <Text style={{ fontFamily: 'monospace' }}>{staff.shift}</Text></Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.statusBadge, isDuty ? styles.statusBadgeOn : styles.statusBadgeOff]}>
                    <Text style={[styles.statusBadgeText, isDuty ? styles.statusBadgeTextOn : styles.statusBadgeTextOff]}>
                      {isDuty ? 'ON DUTY' : 'OFF DUTY'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.clockBtn, isDuty ? styles.clockBtnOut : styles.clockBtnIn]}
                    onPress={() => handleToggleStaffStatus(staff.id)}
                  >
                    <Text style={[styles.clockBtnText, isDuty ? styles.clockBtnTextOut : styles.clockBtnTextIn]}>
                      {isDuty ? 'Clock Out' : 'Clock In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF9F1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 16,
    backgroundColor: '#0C2340',
    borderBottomWidth: 2,
    borderColor: '#D4AF37',
  },
  menuButton: {
    marginRight: 15,
    padding: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'sans-serif-medium',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 70,
    right: 20,
    left: 20,
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 12,
    padding: 12,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: '#FEF9F1',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 14,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricIcon: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 6,
  },
  metricSubtitle: {
    fontSize: 9,
    color: '#A0AEC0',
    marginTop: 3,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
    paddingBottom: 10,
    marginBottom: 14,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  cardSubheading: {
    fontSize: 11,
    color: '#718096',
    marginBottom: 15,
    marginTop: 4,
  },
  holidayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBE5DA',
  },
  holidayBtnActive: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  holidayBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
  },
  holidayBtnTextActive: {
    color: '#FFFFFF',
  },
  formsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  formBox: {
    width: '48%',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 12,
    padding: 10,
  },
  formBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C2340',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 0,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
    fontFamily: 'monospace',
  },
  applyBtn: {
    marginLeft: 6,
    backgroundColor: '#0C2340',
    paddingHorizontal: 10,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FEF9F1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C2340',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 5,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  roomName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  roomBasePrice: {
    fontSize: 9,
    color: '#718096',
    marginTop: 1,
    fontFamily: 'monospace',
  },
  roomLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A0AEC0',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  roomSellPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#0C2340',
  },
  rateInput: {
    width: 75,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    fontSize: 11,
    color: '#0C2340',
    fontFamily: 'monospace',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  expenseForm: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  textInput: {
    height: 38,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#2D3748',
    fontWeight: '600',
    marginBottom: 12,
  },
  inputGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryPickerContainer: {
    height: 38,
    justifyContent: 'center',
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
    justifyContent: 'center',
  },
  catBadgeActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#718096',
  },
  catBadgeTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  numberInput: {
    height: 38,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
    fontFamily: 'monospace',
  },
  submitExpenseBtn: {
    backgroundColor: '#0C2340',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  submitExpenseBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expenseLedgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: '#EBE5DA',
    paddingBottom: 4,
    marginBottom: 10,
    marginTop: 10,
  },
  ledgerTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C2340',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ledgerTotal: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0C2340',
    fontFamily: 'monospace',
  },
  ledgerList: {
    maxHeight: 180,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
    paddingVertical: 8,
  },
  ledgerDesc: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D3748',
    maxWidth: 120,
  },
  categoryPill: {
    backgroundColor: '#FEF9F1',
    borderWidth: 0.5,
    borderColor: '#EBE5DA',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  categoryPillText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
  },
  ledgerDate: {
    fontSize: 8,
    color: '#A0AEC0',
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E53E3E',
    fontFamily: 'monospace',
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
  },
  staffName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  staffRole: {
    fontSize: 10,
    color: '#718096',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 0.5,
  },
  statusBadgeOn: {
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
    borderColor: 'rgba(72, 187, 120, 0.2)',
  },
  statusBadgeOff: {
    backgroundColor: '#FEF9F1',
    borderColor: '#EBE5DA',
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  statusBadgeTextOn: {
    color: '#38A169',
  },
  statusBadgeTextOff: {
    color: '#718096',
  },
  clockBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  clockBtnIn: {
    borderColor: '#38A169',
    backgroundColor: 'rgba(72, 187, 120, 0.05)',
  },
  clockBtnOut: {
    borderColor: '#E53E3E',
    backgroundColor: 'rgba(229, 62, 62, 0.05)',
  },
  clockBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  clockBtnTextIn: {
    color: '#38A169',
  },
  clockBtnTextOut: {
    color: '#E53E3E',
  },
});
