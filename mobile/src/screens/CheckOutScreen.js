import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { api } from '../api';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons';

export default function CheckOutScreen({ user, onLogout, onOpenDrawer, checkoutRoomId, setCheckoutRoomId }) {
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Settlement Form Inputs
  const [extraChargesInput, setExtraChargesInput] = useState('0');
  const [discountInput, setDiscountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(18); // default to 18%

  // Custom Extra Charges added at checkout
  const [customExtras, setCustomExtras] = useState([]); // { id, desc, amount }
  const [newExtraDesc, setNewExtraDesc] = useState('');
  const [newExtraAmount, setNewExtraAmount] = useState('');

  // Settle invoice state copy for final confirmation invoice display
  const [completedCheckoutDetails, setCompletedCheckoutDetails] = useState(null);

  const fetchPendingCheckOuts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/check-out/pending');
      setOccupiedRooms(data || []);
    } catch (e) {
      console.warn(e);
      setError('Failed to fetch pending departures');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.get('/settings');
      if (data && typeof data.taxRate === 'number') {
        setTaxRate(data.taxRate);
      }
    } catch (e) {
      console.warn('Could not fetch settings, using default 18% tax rate');
    }
  };

  useEffect(() => {
    fetchPendingCheckOuts();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (checkoutRoomId && occupiedRooms.length > 0) {
      const room = occupiedRooms.find(r => r.id === checkoutRoomId);
      if (room) {
        handleSelectRoom(room);
        if (setCheckoutRoomId) setCheckoutRoomId(null);
      }
    }
  }, [checkoutRoomId, occupiedRooms]);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setCheckoutComplete(false);
    setExtraChargesInput('0');
    setCustomExtras([]);
    setNewExtraDesc('');
    setNewExtraAmount('');
    setDiscountInput('0');
    setPaymentMethod('CASH');
    setNotes('');
  };

  const handleAddCustomExtra = () => {
    if (!newExtraDesc.trim() || !newExtraAmount.trim()) return;
    const amountVal = parseFloat(newExtraAmount) || 0;
    if (amountVal <= 0) return;

    const newItem = {
      id: Date.now().toString(),
      desc: newExtraDesc.trim(),
      amount: amountVal
    };

    const updatedList = [...customExtras, newItem];
    setCustomExtras(updatedList);
    
    // Recalculate extra sum
    const totalExtras = updatedList.reduce((sum, item) => sum + item.amount, 0);
    setExtraChargesInput(totalExtras.toString());

    setNewExtraDesc('');
    setNewExtraAmount('');
  };

  const handleRemoveCustomExtra = (itemId) => {
    const updatedList = customExtras.filter(item => item.id !== itemId);
    setCustomExtras(updatedList);

    const totalExtras = updatedList.reduce((sum, item) => sum + item.amount, 0);
    setExtraChargesInput(totalExtras.toString());
  };

  // Build guest folio items
  const buildFolio = (room, includeCustomExtras = false) => {
    if (!room) return [];
    const items = [];

    // 1. Room Charges
    items.push({
      desc: `Room Charges (${room.totalNights} night(s) @ ₹${room.ratePerNight}/night)`,
      amount: room.roomCharges
    });

    // 2. Existing Extra Charges
    if (room.extraCharges > 0) {
      items.push({
        desc: 'Room Extras (Mini Bar, Laundry, etc.)',
        amount: room.extraCharges
      });
    }

    // 3. Dynamic Custom Extras Added at Checkout
    if (includeCustomExtras) {
      customExtras.forEach(item => {
        items.push({
          desc: item.desc,
          amount: item.amount
        });
      });
    }

    // 4. Existing Discount
    if (room.discount > 0) {
      items.push({
        desc: 'Discount Applied',
        amount: -room.discount
      });
    }

    // 5. Restaurant Dine-In Orders
    if (room.orders && room.orders.length > 0) {
      room.orders.forEach((order) => {
        items.push({
          desc: `Restaurant Order (${order.orderNumber})`,
          amount: order.totalAmount
        });
      });
    }

    return items;
  };

  const handleCheckoutSettle = async () => {
    if (!selectedRoom) return;
    try {
      setSubmitting(true);
      setError(null);

      const extraVal = parseFloat(extraChargesInput) || 0;
      const discVal = parseFloat(discountInput) || 0;
      const subtotal = baseTotal + extraVal - discVal;
      const taxAmount = Math.round(subtotal * (taxRate / 100));
      const grandTotal = Math.max(0, subtotal + taxAmount);

      const payload = {
        reservationId: selectedRoom.id,
        extraCharges: extraVal + taxAmount,
        discount: discVal,
        paymentMethod,
        notes: notes || undefined,
      };

      await api.post('/check-out', payload);

      setCompletedCheckoutDetails({
        roomNumber: selectedRoom.room?.number,
        roomType: selectedRoom.room?.roomType?.name || 'Standard Room',
        guestName: selectedRoom.guest?.name,
        guestEmail: selectedRoom.guest?.email,
        guestPhone: selectedRoom.guest?.phone,
        bookingRef: selectedRoom.bookingRef,
        checkInDate: selectedRoom.checkInDate,
        checkOutDate: selectedRoom.checkOutDate,
        totalNights: selectedRoom.totalNights,
        ratePerNight: selectedRoom.ratePerNight,
        folioItems: [
          ...folioList,
          ...(discVal > 0 ? [{ desc: 'Additional Discount Added', amount: -discVal }] : [])
        ],
        subtotal: subtotal,
        taxAmount: taxAmount,
        grandTotal: grandTotal,
        paymentMethod: paymentMethod,
        notes: notes,
      });

      setCheckoutComplete(true);
      setOccupiedRooms(occupiedRooms.filter(r => r.id !== selectedRoom.id));
    } catch (err) {
      console.warn(err);
      Alert.alert('Checkout Failed', err.message || 'Failed to complete check-out.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintInvoice = async (isDraft, format) => {
    const data = isDraft ? {
      roomNumber: selectedRoom.room?.number,
      roomType: selectedRoom.room?.roomType?.name || 'Standard Room',
      guestName: selectedRoom.guest?.name,
      guestEmail: selectedRoom.guest?.email,
      guestPhone: selectedRoom.guest?.phone,
      bookingRef: selectedRoom.bookingRef,
      checkInDate: selectedRoom.checkInDate,
      checkOutDate: selectedRoom.checkOutDate,
      totalNights: selectedRoom.totalNights,
      ratePerNight: selectedRoom.ratePerNight,
      folioItems: [
        ...folioList,
        ...(parseFloat(discountInput) > 0 ? [{ desc: 'Additional Discount Added', amount: -(parseFloat(discountInput) || 0) }] : [])
      ],
      subtotal: baseTotal + (parseFloat(extraChargesInput) || 0) - (parseFloat(discountInput) || 0),
      taxAmount: Math.round((baseTotal + (parseFloat(extraChargesInput) || 0) - (parseFloat(discountInput) || 0)) * (taxRate / 100)),
      grandTotal: Math.max(0, (baseTotal + (parseFloat(extraChargesInput) || 0) - (parseFloat(discountInput) || 0)) + Math.round((baseTotal + (parseFloat(extraChargesInput) || 0) - (parseFloat(discountInput) || 0)) * (taxRate / 100))),
      paymentMethod: paymentMethod,
      notes: notes,
    } : completedCheckoutDetails;

    if (!data) return;

    const dateStr = new Date().toLocaleDateString();
    const hotelName = user.tenantName || 'Your Hotel Name';
    
    let html = '';
    
    if (format === 'pos') {
      html = `
        <html>
        <head>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              color: #333;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 10px; }
            .divider { border-top: 1px dashed #999; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .title { font-size: 18px; text-transform: uppercase; }
            .subtitle { font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <div class="center header">
            <div class="bold title">${hotelName}</div>
            <div class="subtitle">${isDraft ? 'DRAFT FOLIO' : 'OFFICIAL RECEIPT'}</div>
            <div class="divider"></div>
          </div>
          
          <div class="row"><span class="bold">Booking Ref:</span><span>${data.bookingRef}</span></div>
          <div class="row"><span>Date:</span><span>${dateStr}</span></div>
          <div class="row"><span>Guest:</span><span>${data.guestName}</span></div>
          <div class="row"><span>Room:</span><span>Room ${data.roomNumber} (${data.roomType})</span></div>
          <div class="row"><span>Stay:</span><span>${data.checkInDate} to ${data.checkOutDate}</span></div>
          <div class="divider"></div>
          
          <div class="bold row"><span>Description</span><span>Amount</span></div>
          ${data.folioItems.map(item => `
            <div class="row">
              <span>• ${item.desc}</span>
              <span class="bold">₹${item.amount.toLocaleString()}</span>
            </div>
          `).join('')}
          ${isDraft ? customExtras.map(item => `
            <div class="row">
              <span>• ${item.desc}</span>
              <span class="bold">₹${item.amount.toLocaleString()}</span>
            </div>
          `).join('') : ''}
          <div class="divider"></div>
          
          <div class="row"><span>Subtotal:</span><span>₹${(data.subtotal + (isDraft ? customExtras.reduce((s, e) => s + e.amount, 0) : 0)).toLocaleString()}</span></div>
          <div class="row"><span>GST Tax (${taxRate}%):</span><span>₹${Math.round((data.subtotal + (isDraft ? customExtras.reduce((s, e) => s + e.amount, 0) : 0)) * (taxRate / 100)).toLocaleString()}</span></div>
          <div class="divider"></div>
          
          <div class="row bold" style="font-size: 16px;"><span>GRAND TOTAL:</span><span>₹${Math.round((data.subtotal + (isDraft ? customExtras.reduce((s, e) => s + e.amount, 0) : 0)) * (1 + taxRate / 100)).toLocaleString()}</span></div>
          <div class="row bold"><span>Status:</span><span>${isDraft ? 'UNSETTLED (DRAFT)' : `PAID via ${data.paymentMethod}`}</span></div>
          <div class="divider"></div>
          
          <div class="center" style="font-size: 11px; margin-top: 15px;">
            Thank you for staying with us!<br/>
            Powered by Hoteloraa SaaS
          </div>
        </body>
        </html>
      `;
    } else {
      html = `
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.5;
            }
            .header-table { width: 100%; border-bottom: 2px solid #0C2340; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0C2340; text-transform: uppercase; }
            .meta-table { width: 100%; margin-bottom: 30px; font-size: 14px; }
            .meta-title { font-weight: bold; color: #0C2340; margin-bottom: 5px; text-transform: uppercase; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
            .items-table th { background-color: #FEF9F1; border: 1px solid #EBE5DA; padding: 12px; font-weight: bold; color: #0C2340; }
            .items-table td { border: 1px solid #EBE5DA; padding: 12px; }
            .summary-table { width: 50%; float: right; font-size: 14px; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; }
            .summary-total { border-top: 2px solid #0C2340; font-size: 16px; font-weight: bold; color: #0C2340; margin-top: 10px; padding-top: 10px; }
            .footer { border-top: 1px solid #EBE5DA; margin-top: 100px; padding-top: 20px; text-align: center; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="title">${hotelName}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">Powered by Hoteloraa</div>
              </td>
              <td style="text-align: right;">
                <div style="font-size: 20px; font-weight: bold; color: #0C2340; text-transform: uppercase;">
                  ${isDraft ? 'Draft Folio Invoice' : 'Official Guest Receipt'}
                </div>
                <div style="font-family: monospace; font-size: 13px; margin-top: 5px;">REF: ${data.bookingRef}</div>
                <div style="font-size: 13px; color: #666;">Date: ${dateStr}</div>
              </td>
            </tr>
          </table>
          
          <table class="meta-table">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div class="meta-title">Billed To:</div>
                <div style="font-weight: bold;">${data.guestName}</div>
                ${data.guestEmail ? `<div style="color: #666; margin-top: 3px;">${data.guestEmail}</div>` : ''}
                ${data.guestPhone ? `<div style="color: #666; margin-top: 3px;">${data.guestPhone}</div>` : ''}
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <div class="meta-title">Room Details:</div>
                <div style="font-weight: bold;">Room ${data.roomNumber}</div>
                <div style="color: #666; margin-top: 3px;">${data.roomType}</div>
                <div style="color: #666; margin-top: 3px;">Stay: ${data.checkInDate} to ${data.checkOutDate} (${data.totalNights} Nights)</div>
              </td>
            </tr>
          </table>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">Line Item Description</th>
                <th style="text-align: right; width: 150px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.folioItems.map(item => `
                <tr>
                  <td>${item.desc}</td>
                  <td style="text-align: right; font-weight: bold;">₹${item.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              ${isDraft ? customExtras.map(item => `
                <tr>
                  <td>${item.desc}</td>
                  <td style="text-align: right; font-weight: bold;">₹${item.amount.toLocaleString()}</td>
                </tr>
              `).join('') : ''}
            </tbody>
          </table>
          
          <div style="width: 100%; overflow: hidden;">
            <div class="summary-table">
              <div class="summary-row">
                <span>Folio Subtotal:</span>
                <span>₹${(data.subtotal + (isDraft ? customExtras.reduce((s, e) => s + e.amount, 0) : 0)).toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>GST Tax (${taxRate}%):</span>
                <span>₹${Math.round((data.subtotal + (isDraft ? customExtras.reduce((s, e) => s + e.amount, 0) : 0)) * (taxRate / 100)).toLocaleString()}</span>
              </div>
              <div class="summary-row summary-total">
                <span>Grand Total:</span>
                <span>₹${Math.round((data.subtotal + (isDraft ? customExtras.reduce((s, e) => s + e.amount, 0) : 0)) * (1 + taxRate / 100)).toLocaleString()}</span>
              </div>
              <div class="summary-row" style="font-weight: bold; border-top: 1px dashed #EBE5DA; margin-top: 5px; padding-top: 5px;">
                <span>Settlement Status:</span>
                <span>${isDraft ? 'UNSETTLED (DRAFT)' : `PAID via ${data.paymentMethod}`}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            Thank you for staying with us! • Powered by Hoteloraa SaaS
          </div>
        </body>
        </html>
      `;
    }

    try {
      await Print.printAsync({ html });
    } catch (err) {
      Alert.alert('Printing Error', 'Could not print invoice: ' + err.message);
    }
  };

  const triggerPrintSelection = (isDraft) => {
    Alert.alert(
      'Select Print Format',
      'Choose print template size:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '3" POS Receipt', onPress: () => handlePrintInvoice(isDraft, 'pos') },
        { text: 'Standard A4 Invoice', onPress: () => handlePrintInvoice(isDraft, 'a4') }
      ]
    );
  };

  // Calculations
  const folioList = buildFolio(selectedRoom, true);
  const baseTotal = buildFolio(selectedRoom, false).reduce((acc, curr) => acc + curr.amount, 0);
  const extraVal = parseFloat(extraChargesInput) || 0;
  const discVal = parseFloat(discountInput) || 0;
  const subtotal = baseTotal + extraVal - discVal;
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const grandTotal = Math.max(0, subtotal + taxAmount);

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
            <Text style={styles.headerTitle}>Folio & Check-Out</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Departures</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleHeading}>Folio & Check-Out</Text>
              <Text style={styles.titleSubheading}>Review guest ledgers, settle room folios, and complete checkout departure</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchPendingCheckOuts} disabled={loading}>
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Settle Screen */}
        {checkoutComplete && completedCheckoutDetails ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Checkout Completed!</Text>
            <Text style={styles.successSubtitle}>Room {completedCheckoutDetails.roomNumber} has been successfully cleared</Text>

            {/* Bill Summary */}
            <View style={styles.invoiceBox}>
              <Text style={styles.invoiceHeader}>OFFICIAL RECEIPT</Text>
              <Text style={styles.invoiceMeta}>REF: {completedCheckoutDetails.bookingRef}</Text>
              <Text style={styles.invoiceMeta}>GUEST: {completedCheckoutDetails.guestName}</Text>
              <Text style={styles.invoiceMeta}>ROOM: {completedCheckoutDetails.roomNumber} ({completedCheckoutDetails.roomType})</Text>

              <View style={styles.invoiceDivider} />
              
              {completedCheckoutDetails.folioItems.map((item, index) => (
                <View key={index} style={styles.invoiceRow}>
                  <Text style={styles.invoiceRowDesc} numberOfLines={1}>{item.desc}</Text>
                  <Text style={styles.invoiceRowVal}>₹{item.amount.toLocaleString()}</Text>
                </View>
              ))}

              <View style={styles.invoiceDivider} />

              <View style={styles.invoiceRow}>
                <Text style={{ fontSize: 11, color: '#718096' }}>Subtotal</Text>
                <Text style={{ fontSize: 11, color: '#718096' }}>₹{completedCheckoutDetails.subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={{ fontSize: 11, color: '#718096' }}>GST Tax ({taxRate}%)</Text>
                <Text style={{ fontSize: 11, color: '#718096' }}>₹{completedCheckoutDetails.taxAmount.toLocaleString()}</Text>
              </View>
              <View style={[styles.invoiceRow, { marginTop: 6 }]}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0C2340' }}>Total Paid</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#D4AF37' }}>₹{completedCheckoutDetails.grandTotal.toLocaleString()}</Text>
              </View>

              <View style={styles.invoiceDivider} />
              <Text style={styles.invoiceFooter}>Settled via {completedCheckoutDetails.paymentMethod} • Thank you!</Text>
            </View>

            {/* Print Final Receipt */}
            <TouchableOpacity
              style={styles.successPrintBtn}
              onPress={() => triggerPrintSelection(false)}
            >
              <Text style={styles.successPrintBtnText}>🖨️ Print Final Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.successCloseBtn}
              onPress={() => {
                setSelectedRoom(null);
                setCompletedCheckoutDetails(null);
                setCheckoutComplete(false);
              }}
            >
              <Text style={styles.successCloseBtnText}>Return to Checkout Registry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Occupied Rooms Cards */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Occupied Rooms</Text>

              {loading ? (
                <View style={styles.centerLoading}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.loadingText}>Loading departures...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : occupiedRooms.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No currently occupied rooms found.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomsRow}>
                  {occupiedRooms.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    return (
                      <TouchableOpacity
                        key={room.id}
                        style={[styles.roomCard, isSelected && styles.roomCardActive]}
                        onPress={() => handleSelectRoom(room)}
                      >
                        <Text style={[styles.roomNum, isSelected && styles.roomNumActive]}>Room {room.room?.number}</Text>
                        <Text style={[styles.roomGuest, isSelected && styles.roomGuestActive]}>{room.guest?.name}</Text>
                        <Text style={[styles.roomPrice, isSelected && styles.roomPriceActive]}>REF: {room.bookingRef}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Settle Checkout Registration */}
            {selectedRoom ? (
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Checkout Folio Details</Text>

                {/* Folio Items List */}
                <View style={styles.folioBox}>
                  <Text style={styles.folioTitle}>FOLIO TRANSACTION LIST</Text>
                  
                  {folioList.map((item, idx) => (
                    <View key={idx} style={styles.folioRow}>
                      <Text style={styles.folioRowDesc} numberOfLines={1}>{item.desc}</Text>
                      <Text style={[styles.folioRowVal, item.amount < 0 && { color: '#E53E3E' }]}>
                        {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount).toLocaleString()}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.folioDivider} />

                  {/* Calculations Row */}
                  <View style={styles.calculationRow}>
                    <Text style={styles.calcLabel}>Subtotal:</Text>
                    <Text style={styles.calcVal}>₹{subtotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.calculationRow}>
                    <Text style={styles.calcLabel}>GST Tax ({taxRate}%):</Text>
                    <Text style={styles.calcVal}>₹{taxAmount.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.calculationRow, { marginTop: 6 }]}>
                    <Text style={[styles.calcLabel, { fontWeight: 'bold', fontSize: 13, color: '#0C2340' }]}>Grand Total:</Text>
                    <Text style={[styles.calcVal, { fontWeight: 'bold', fontSize: 13, color: '#D4AF37' }]}>₹{grandTotal.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Add Custom Extras charges */}
                <Text style={styles.formLabel}>Add Extra Service Charges</Text>
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  <TextInput
                    style={[styles.formInput, { flex: 2, marginRight: 6, marginBottom: 0 }]}
                    placeholder="Description (e.g. Mini bar)"
                    placeholderTextColor="#A0AEC0"
                    value={newExtraDesc}
                    onChangeText={setNewExtraDesc}
                  />
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginRight: 6, marginBottom: 0 }]}
                    placeholder="Amount (₹)"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="numeric"
                    value={newExtraAmount}
                    onChangeText={setNewExtraAmount}
                  />
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomExtra}>
                    <Text style={styles.addBtnText}>＋ Add</Text>
                  </TouchableOpacity>
                </View>

                {/* List of Custom Extras added */}
                {customExtras.length > 0 && (
                  <View style={styles.customExtrasWrapper}>
                    {customExtras.map((item) => (
                      <View key={item.id} style={styles.customExtraItem}>
                        <Text style={styles.customExtraDesc}>{item.desc} (₹{item.amount})</Text>
                        <TouchableOpacity onPress={() => handleRemoveCustomExtra(item.id)}>
                          <Text style={styles.customExtraRemove}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Additional Discount */}
                <Text style={styles.formLabel}>Additional Settle Discount (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter discount amount"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="numeric"
                  value={discountInput}
                  onChangeText={setDiscountInput}
                />

                {/* Payment Method Selector */}
                <Text style={styles.formLabel}>Payment Settlement Method</Text>
                <View style={styles.methodRow}>
                  {['CASH', 'CARD', 'UPI'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.methodBadge, paymentMethod === method && styles.methodBadgeActive]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text style={[styles.methodBadgeText, paymentMethod === method && styles.methodBadgeTextActive]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Notes */}
                <Text style={styles.formLabel}>Checkout Remarks / Notes</Text>
                <TextInput
                  style={[styles.formInput, { height: 60 }]}
                  placeholder="Guest feedback, late checkout approvals..."
                  placeholderTextColor="#A0AEC0"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />

                 {/* Checkout Trigger */}
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCheckoutSettle}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#D4AF37" />
                  ) : (
                    <Text style={styles.submitBtnText}>🧾 Settle Folio & Complete Checkout</Text>
                  )}
                </TouchableOpacity>

                {/* Print Draft Folio Button */}
                <TouchableOpacity
                  style={styles.draftBtn}
                  onPress={() => triggerPrintSelection(true)}
                >
                  <Text style={styles.draftBtnText}>📄 View & Print Draft Folio</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>🧾</Text>
                <Text style={styles.placeholderText}>Select an occupied room above to load guest folio records and process checkout</Text>
              </View>
            )}
          </>
        )}
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
    paddingVertical: 16,
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
  scrollContent: {
    padding: 15,
  },
  titleSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  titleHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  titleSubheading: {
    fontSize: 11,
    color: '#718096',
    marginTop: 4,
    lineHeight: 15,
  },
  refreshBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#0C2340',
    fontSize: 10,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 12,
  },
  centerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#718096',
    fontSize: 11,
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    color: '#C53030',
    fontSize: 11,
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EBE5DA',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#718096',
  },
  roomsRow: {
    flexDirection: 'row',
  },
  roomCard: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    width: 110,
    alignItems: 'center',
  },
  roomCardActive: {
    backgroundColor: '#0C2340',
    borderColor: '#D4AF37',
  },
  roomNum: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  roomNumActive: { color: '#D4AF37' },
  roomGuest: {
    fontSize: 9,
    color: '#718096',
    marginTop: 3,
    textAlign: 'center',
  },
  roomGuestActive: { color: '#E2E8F0' },
  roomPrice: {
    fontSize: 8,
    color: '#A0AEC0',
    marginTop: 3,
  },
  roomPriceActive: { color: '#A0AEC0' },
  folioBox: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
  },
  folioTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  folioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  folioRowDesc: {
    fontSize: 10.5,
    color: '#2D3748',
    flex: 1,
    marginRight: 10,
  },
  folioRowVal: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  folioDivider: {
    height: 1,
    backgroundColor: '#EBE5DA',
    marginVertical: 10,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calcLabel: {
    fontSize: 10.5,
    color: '#718096',
  },
  calcVal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#2D3748',
  },
  formLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#0C2340',
    fontWeight: '600',
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#D4AF37',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  customExtrasWrapper: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  customExtraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  customExtraDesc: {
    fontSize: 10,
    color: '#2D3748',
  },
  customExtraRemove: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  methodRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  methodBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 8,
  },
  methodBadgeActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#718096',
  },
  methodBadgeTextActive: {
    color: '#D4AF37',
  },
  submitBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#D4AF37',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  placeholderBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EBE5DA',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  placeholderText: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 16,
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  successSubtitle: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  invoiceBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  invoiceHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2340',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#718096',
    marginBottom: 2,
  },
  invoiceDivider: {
    height: 0.5,
    backgroundColor: '#EBE5DA',
    marginVertical: 8,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  invoiceRowDesc: {
    fontSize: 9.5,
    color: '#2D3748',
    flex: 1,
    marginRight: 8,
  },
  invoiceRowVal: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#0C2340',
  },
  invoiceFooter: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
  },
  successCloseBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 15,
  },
  successCloseBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  draftBtn: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  draftBtnText: {
    color: '#0C2340',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  successPrintBtn: {
    backgroundColor: '#48BB78',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    width: '100%',
  },
  successPrintBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
