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
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { api } from '../api';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons';

export default function POSBillingScreen({ user, onLogout, onOpenDrawer }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Discount / Collection States
  const [customDiscount, setCustomDiscount] = useState('');
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'Card/UPI' | 'Bank Transfer' | 'Room Charge'
  const [paymentReference, setPaymentReference] = useState('');
  const [activeActionTab, setActiveActionTab] = useState('settle'); // 'settle' | 'discount'

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Paid' | 'Unpaid'

  const calculateTaxes = (amount, discount, gstRate = 5, serviceChargeRate = 0) => {
    const taxable = Math.max(0, amount - discount);
    const serviceCharge = (taxable * serviceChargeRate) / 100;
    const baseWithService = taxable + serviceCharge;
    const cgst = (baseWithService * (gstRate / 2)) / 100;
    const sgst = (baseWithService * (gstRate / 2)) / 100;
    const total = baseWithService + cgst + sgst;
    return { taxable, serviceCharge, cgst, sgst, total };
  };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/orders');
      const mappedInvoices = data.map(order => ({
        id: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
        orderId: order.id,
        type: order.table ? 'POS Table' : 'Room Service',
        guest: order.table ? `Table ${order.table.name}` : (order.user ? order.user.name : 'Walk-in'),
        amount: order.subtotal || 0,
        room: order.table?.floor || 'Restaurant',
        status: order.status === 'COMPLETED' ? 'Paid' : 'Unpaid',
        orderStatus: order.status,
        discount: order.discountAmount || 0,
        paidAmount: order.payment ? order.payment.amount : 0,
        gstRate: 5,
        serviceChargeRate: 0,
        items: order.items ? order.items.map(item => ({
          name: item.menuItem?.name || 'Item',
          price: item.totalPrice
        })) : [],
        payments: order.payment ? [{ 
          method: order.payment.method, 
          amount: order.payment.amount, 
          date: order.payment.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
        }] : []
      }));
      setInvoices(mappedInvoices);
    } catch (err) {
      console.warn(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    
    let mappedMethod = 'CASH';
    if (paymentMethod === 'Card/UPI') mappedMethod = 'CARD';
    if (paymentMethod === 'Bank Transfer') mappedMethod = 'BANK_TRANSFER';
    if (paymentMethod === 'Room Charge') mappedMethod = 'ROOM_CHARGE';

    setSubmitting(true);
    try {
      const payload = {
        orderId: selectedInvoice.orderId,
        paymentMethod: mappedMethod,
        discountAmount: selectedInvoice.discount || 0,
        reference: ['Card/UPI', 'Bank Transfer'].includes(paymentMethod) ? paymentReference : undefined,
        notes: `Collected via ${paymentMethod}`
      };
      
      await api.post('/billing/generate', payload);
      setSelectedInvoice(null);
      setPaymentReference('');
      setCustomDiscount('');
      Alert.alert('Success', `Bill settled successfully via ${paymentMethod}`);
      loadOrders(true);
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'Failed to settle bill.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyDiscount = () => {
    if (!selectedInvoice) return;
    const discountVal = parseFloat(customDiscount) || 0;
    if (discountVal < 0) {
      Alert.alert('Error', 'Invalid discount amount.');
      return;
    }

    let finalDiscountAmount = discountVal;
    if (discountType === 'percent') {
      finalDiscountAmount = (selectedInvoice.amount * discountVal) / 100;
    }

    if (finalDiscountAmount > selectedInvoice.amount) {
      Alert.alert('Error', 'Discount cannot exceed the base amount.');
      return;
    }

    const updated = invoices.map(inv => {
      if (inv.id === selectedInvoice.id) {
        return { ...inv, discount: finalDiscountAmount };
      }
      return inv;
    });
    setInvoices(updated);
    setSelectedInvoice(updated.find(inv => inv.id === selectedInvoice.id));
    Alert.alert('Discount Applied', `Discount of ₹${finalDiscountAmount} applied to invoice.`);
    setCustomDiscount('');
  };

  const handlePrintBill = async (format) => {
    if (!selectedInvoice) return;
    
    const taxes = calculateTaxes(
      selectedInvoice.amount,
      selectedInvoice.discount,
      selectedInvoice.gstRate,
      selectedInvoice.serviceChargeRate
    );
    const grandTotal = Math.round(taxes.total);
    const remaining = Math.max(0, grandTotal - selectedInvoice.paidAmount);
    const dateStr = new Date().toLocaleString();
    const hotelName = user.tenantName || 'Your Hotel Name';
    
    let html = '';
    
    if (format === 'pos') {
      // 3" POS Receipt Format
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
            .item-row { font-size: 14px; }
            .title { font-size: 20px; text-transform: uppercase; }
            .subtitle { font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <div class="center header">
            <div class="bold title">${hotelName}</div>
            <div class="subtitle">F&B POS RECEIPT</div>
            <div class="divider"></div>
          </div>
          
          <div class="row"><span class="bold">Receipt No:</span><span>INV-${selectedInvoice.id}</span></div>
          <div class="row"><span>Date/Time:</span><span>${dateStr}</span></div>
          <div class="row"><span>Table:</span><span>${selectedInvoice.guest} / ${selectedInvoice.room}</span></div>
          <div class="divider"></div>
          
          <div class="bold row"><span>Description</span><span>Amount</span></div>
          ${selectedInvoice.items.map(item => `
            <div class="row">
              <span>• ${item.name}</span>
              <span class="bold">₹${item.price.toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          
          <div class="row"><span>Subtotal:</span><span>₹${selectedInvoice.amount.toFixed(2)}</span></div>
          ${selectedInvoice.discount > 0 ? `<div class="row"><span>Discount:</span><span>-₹${selectedInvoice.discount.toFixed(2)}</span></div>` : ''}
          ${taxes.serviceCharge > 0 ? `<div class="row"><span>Service Charge (${selectedInvoice.serviceChargeRate}%):</span><span>₹${taxes.serviceCharge.toFixed(2)}</span></div>` : ''}
          <div class="row"><span>GST (${selectedInvoice.gstRate}%):</span><span>₹${(taxes.cgst + taxes.sgst).toFixed(2)}</span></div>
          <div class="divider"></div>
          
          <div class="row bold" style="font-size: 16px;"><span>GRAND TOTAL:</span><span>₹${grandTotal.toFixed(2)}</span></div>
          <div class="row bold"><span>Total Paid:</span><span>₹${selectedInvoice.paidAmount.toFixed(2)}</span></div>
          <div class="row bold"><span>Balance Due:</span><span>₹${remaining.toFixed(2)}</span></div>
          <div class="divider"></div>
          
          <div class="center" style="font-size: 11px; margin-top: 15px;">
            Thank you for dining with us!<br/>
            Powered by Hoteloraa SaaS
          </div>
        </body>
        </html>
      `;
    } else {
      // Standard A4 Format
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
            .footer { border-top: 1px solid #EBE5DA; margin-top: 150px; padding-top: 20px; text-align: center; font-size: 12px; color: #777; }
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
                <div style="font-size: 20px; font-weight: bold; color: #0C2340; text-transform: uppercase;">Guest Invoice</div>
                <div style="font-family: monospace; font-size: 13px; margin-top: 5px;">INV-${selectedInvoice.id}</div>
                <div style="font-size: 13px; color: #666;">Date: ${new Date().toLocaleDateString()}</div>
              </td>
            </tr>
          </table>
          
          <table class="meta-table">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div class="meta-title">Billed To:</div>
                <div style="font-weight: bold;">${selectedInvoice.guest}</div>
                <div style="color: #666; margin-top: 3px;">${selectedInvoice.room}</div>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <div class="meta-title">Property Info:</div>
                <div style="font-weight: bold;">${hotelName}</div>
              </td>
            </tr>
          </table>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">Description</th>
                <th style="text-align: right; width: 150px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${selectedInvoice.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: right; font-weight: bold;">₹${item.price.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="width: 100%; overflow: hidden;">
            <div class="summary-table">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${selectedInvoice.amount.toLocaleString()}</span>
              </div>
              ${selectedInvoice.discount > 0 ? `
                <div class="summary-row" style="color: #E53E3E;">
                  <span>Discount:</span>
                  <span>-₹${selectedInvoice.discount.toLocaleString()}</span>
                </div>
              ` : ''}
              ${taxes.serviceCharge > 0 ? `
                <div class="summary-row">
                  <span>Service Charge (${selectedInvoice.serviceChargeRate}%):</span>
                  <span>₹${taxes.serviceCharge.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="summary-row">
                <span>CGST (2.5%):</span>
                <span>₹${taxes.cgst.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>SGST (2.5%):</span>
                <span>₹${taxes.sgst.toFixed(2)}</span>
              </div>
              <div class="summary-row summary-total">
                <span>Grand Total:</span>
                <span>₹${grandTotal.toLocaleString()}</span>
              </div>
              <div class="summary-row" style="color: #38A169; font-weight: bold;">
                <span>Total Paid:</span>
                <span>₹${selectedInvoice.paidAmount.toLocaleString()}</span>
              </div>
              <div class="summary-row" style="font-weight: bold; border-top: 1px dashed #EBE5DA; margin-top: 5px; padding-top: 5px;">
                <span>Balance Due:</span>
                <span>₹${remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            Thank you for dining with us! • Powered by Hoteloraa SaaS
          </div>
        </body>
        </html>
      `;
    }
    
    try {
      await Print.printAsync({ html });
    } catch (err) {
      Alert.alert('Printing Error', 'Could not start print job: ' + err.message);
    }
  };

  // KPIs
  const outstandingDues = invoices.reduce((acc, inv) => {
    if (inv.status === 'Paid') return acc;
    const taxes = calculateTaxes(inv.amount, inv.discount, inv.gstRate, inv.serviceChargeRate);
    const grandTotal = Math.round(taxes.total);
    return acc + (grandTotal - inv.paidAmount);
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const settlementsToday = invoices.reduce((acc, inv) => {
    const todayPayments = inv.payments
      .filter(p => p.date === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);
    return acc + todayPayments;
  }, 0);

  const pendingChecksCount = invoices.filter(inv => inv.status !== 'Paid').length;

  const paymentShare = invoices.reduce((acc, inv) => {
    inv.payments.forEach(p => {
      const methodKey = p.method === 'CARD' ? 'Card/UPI' : p.method === 'CASH' ? 'Cash' : p.method;
      acc[methodKey] = (acc[methodKey] || 0) + p.amount;
    });
    return acc;
  }, { 'Cash': 0, 'Card/UPI': 0, 'Bank Transfer': 0, 'Room Charge': 0 });

  // Filtered List
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      inv.guest?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
            <Text style={styles.headerTitle}>POS Billing</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Cashier</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleHeading}>Cashier Billing & Folios Control</Text>
          <Text style={styles.titleSubheading}>Audit active guest ledger checks, apply discounts, process settlements, and print receipts</Text>
        </View>

        {/* Metrics Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiContainer}>
          <View style={[styles.kpiCard, { borderLeftColor: '#F56565', borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>OUTSTANDING DUES</Text>
            <Text style={styles.kpiValue}>₹{outstandingDues.toLocaleString()}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#48BB78', borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>SETTLED TODAY</Text>
            <Text style={styles.kpiValue}>₹{settlementsToday.toLocaleString()}</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#ECC94B', borderLeftWidth: 4 }]}>
            <Text style={styles.kpiLabel}>ACTIVE CHECKS</Text>
            <Text style={styles.kpiValue}>{pendingChecksCount} pending</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#4299E1', borderLeftWidth: 4, width: 160 }]}>
            <Text style={styles.kpiLabel}>COLLECTION SHARE</Text>
            <Text style={styles.kpiSubValue}>Cash: ₹{paymentShare.Cash}</Text>
            <Text style={styles.kpiSubValue}>Card/UPI: ₹{paymentShare['Card/UPI']}</Text>
          </View>
        </ScrollView>

        {/* Filter / Search Bar */}
        <View style={styles.filterSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search guest, invoice or room..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterButtonsRow}>
            {['All', 'Unpaid', 'Paid'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterBadge, statusFilter === status && styles.filterBadgeActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterBadgeText, statusFilter === status && styles.filterBadgeTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active & Pending Checks List */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Active & Pending Checks</Text>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Updating checks feed...</Text>
            </View>
          ) : filteredInvoices.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No checks logged matching criteria.</Text>
            </View>
          ) : (
            filteredInvoices.map((inv) => {
              const taxes = calculateTaxes(inv.amount, inv.discount, inv.gstRate, inv.serviceChargeRate);
              const total = Math.round(taxes.total);
              const isPaid = inv.status === 'Paid';

              return (
                <View key={inv.id} style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <View>
                      <Text style={styles.invoiceIdText}>INV-{inv.id}</Text>
                      <Text style={styles.invoiceType}>{inv.type}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusUnpaid]}>
                        <Text style={[styles.statusBadgeText, isPaid ? styles.textPaid : styles.textUnpaid]}>
                          {inv.status.toUpperCase()}
                        </Text>
                      </View>
                      {!isPaid && (
                        <View style={[
                          styles.statusBadge,
                          inv.orderStatus === 'SERVED' ? { backgroundColor: '#EBF8FF', borderColor: '#BEE3F8' } :
                          inv.orderStatus === 'READY' ? { backgroundColor: '#F0FFF4', borderColor: '#C6F6D5' } :
                          { backgroundColor: '#FFF5F5', borderColor: '#FED7D7' }
                        ]}>
                          <Text style={[
                            styles.statusBadgeText,
                            inv.orderStatus === 'SERVED' ? { color: '#2B6CB0' } :
                            inv.orderStatus === 'READY' ? { color: '#22543D' } :
                            { color: '#C53030' }
                          ]}>
                            {inv.orderStatus}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.invoiceBody}>
                    <Text style={styles.guestText}>📍 {inv.guest} • {inv.room}</Text>
                    <View style={styles.priceGrid}>
                      <View style={styles.priceCol}>
                        <Text style={styles.priceLabel}>BASE</Text>
                        <Text style={styles.priceVal}>₹{inv.amount}</Text>
                      </View>
                      <View style={styles.priceCol}>
                        <Text style={styles.priceLabel}>DISCOUNT</Text>
                        <Text style={styles.priceVal}>- ₹{inv.discount}</Text>
                      </View>
                      <View style={styles.priceCol}>
                        <Text style={styles.priceLabel}>GRAND TOTAL</Text>
                        <Text style={styles.priceValBold}>₹{total}</Text>
                      </View>
                    </View>
                  </View>

                  {!isPaid && (
                    inv.orderStatus === 'SERVED' ? (
                      <TouchableOpacity
                        style={styles.settleBtn}
                        onPress={() => {
                          setSelectedInvoice(inv);
                          setActiveActionTab('settle');
                        }}
                      >
                        <Text style={styles.settleBtnText}>Settle Check ➔</Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={[styles.settleBtn, { backgroundColor: '#EDF2F7', borderColor: '#E2E8F0' }]}
                      >
                        <Text style={[styles.settleBtnText, { color: '#A0AEC0' }]}>
                          Settle Check (Only if Served)
                        </Text>
                      </View>
                    )
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* SETTLEMENT / FOLIOS CONTROL MODAL */}
      <Modal visible={!!selectedInvoice} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', flex: 1 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Checkout & Folio - INV-{selectedInvoice?.id}</Text>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Inner scroll view */}
            <ScrollView style={{ flex: 1, marginVertical: 10 }}>
              {/* Order breakdown */}
              <Text style={styles.modalSectionLabel}>Itemized Bill</Text>
              <View style={styles.billBox}>
                {(selectedInvoice?.items || []).map((item, idx) => (
                  <View key={idx} style={styles.billRow}>
                    <Text style={styles.billItemName}>• {item.name}</Text>
                    <Text style={styles.billItemPrice}>₹{item.price}</Text>
                  </View>
                ))}
                
                <View style={styles.divider} />

                {/* Subtotals & Taxes */}
                {selectedInvoice && (() => {
                  const taxes = calculateTaxes(selectedInvoice.amount, selectedInvoice.discount, selectedInvoice.gstRate, selectedInvoice.serviceChargeRate);
                  return (
                    <View style={styles.billCalculation}>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Subtotal</Text>
                        <Text style={styles.calcVal}>₹{selectedInvoice.amount}</Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Discount</Text>
                        <Text style={styles.calcVal}>- ₹{selectedInvoice.discount}</Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>CGST (2.5%)</Text>
                        <Text style={styles.calcVal}>₹{taxes.cgst.toFixed(2)}</Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>SGST (2.5%)</Text>
                        <Text style={styles.calcVal}>₹{taxes.sgst.toFixed(2)}</Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabelBold}>Grand Total</Text>
                        <Text style={styles.calcValBold}>₹{Math.round(taxes.total)}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>

              {/* Action Tab bar */}
              <View style={styles.modalTabHeader}>
                <TouchableOpacity
                  style={[styles.modalTabBtn, activeActionTab === 'settle' && styles.modalTabBtnActive]}
                  onPress={() => setActiveActionTab('settle')}
                >
                  <Text style={[styles.modalTabBtnText, activeActionTab === 'settle' && styles.modalTabBtnTextActive]}>
                    Settle Bill
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalTabBtn, activeActionTab === 'discount' && styles.modalTabBtnActive]}
                  onPress={() => setActiveActionTab('discount')}
                >
                  <Text style={[styles.modalTabBtnText, activeActionTab === 'discount' && styles.modalTabBtnTextActive]}>
                    Apply Discount
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab 1: Settle form */}
              {activeActionTab === 'settle' ? (
                <View style={styles.formContainer}>
                  <Text style={styles.modalLabel}>Payment Method</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 35, marginBottom: 12 }}>
                    {['Cash', 'Card/UPI', 'Bank Transfer', 'Room Charge'].map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[styles.pickerBadge, paymentMethod === method && styles.pickerBadgeActive]}
                        onPress={() => setPaymentMethod(method)}
                      >
                        <Text style={[styles.pickerBadgeText, paymentMethod === method && styles.pickerBadgeTextActive]}>
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {['Card/UPI', 'Bank Transfer'].includes(paymentMethod) && (
                    <View>
                      <Text style={styles.modalLabel}>Reference Number / Transaction ID</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. TXN9876543210"
                        placeholderTextColor="#A0AEC0"
                        value={paymentReference}
                        onChangeText={setPaymentReference}
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.processBtn}
                    onPress={handleRecordPayment}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#D4AF37" />
                    ) : (
                      <Text style={styles.processBtnText}>Process Settlement</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Tab 2: Discount form */
                <View style={styles.formContainer}>
                  <Text style={styles.modalLabel}>Discount Type</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <TouchableOpacity
                      style={[styles.pickerBadge, discountType === 'flat' && styles.pickerBadgeActive, { flex: 1 }]}
                      onPress={() => setDiscountType('flat')}
                    >
                      <Text style={[styles.pickerBadgeText, discountType === 'flat' && styles.pickerBadgeTextActive, { textAlign: 'center' }]}>
                        Flat Amount (₹)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pickerBadge, discountType === 'percent' && styles.pickerBadgeActive, { flex: 1 }]}
                      onPress={() => setDiscountType('percent')}
                    >
                      <Text style={[styles.pickerBadgeText, discountType === 'percent' && styles.pickerBadgeTextActive, { textAlign: 'center' }]}>
                        Percentage (%)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalLabel}>Discount Value</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    placeholder="e.g. 50 or 10"
                    placeholderTextColor="#A0AEC0"
                    value={customDiscount}
                    onChangeText={setCustomDiscount}
                  />

                  <TouchableOpacity
                    style={styles.processBtn}
                    onPress={handleApplyDiscount}
                  >
                    <Text style={styles.processBtnText}>Apply Discount</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* View/Print Receipt trigger */}
            <TouchableOpacity 
              style={styles.printBtn} 
              onPress={() => {
                Alert.alert(
                  'Select Print Format',
                  'Choose print template size:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: '3" POS Receipt', onPress: () => handlePrintBill('pos') },
                    { text: 'Standard A4 Invoice', onPress: () => handlePrintBill('a4') }
                  ]
                );
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="document-text-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                <Text style={styles.printBtnText}>View & Print Bill</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: 15,
  },
  titleSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
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
  kpiContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 12,
    width: 130,
    height: 80,
    marginRight: 10,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  kpiSubValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 1,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#0C2340',
    marginBottom: 10,
  },
  filterButtonsRow: {
    flexDirection: 'row',
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
  },
  filterBadgeActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#718096',
  },
  filterBadgeTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
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
    marginBottom: 15,
  },
  centerLoading: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#718096',
    fontSize: 11,
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EBE5DA',
    borderRadius: 12,
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#718096',
  },
  invoiceCard: {
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceIdText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  invoiceType: {
    fontSize: 9.5,
    color: '#A0AEC0',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusPaid: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusUnpaid: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statusBadgeText: { fontSize: 8.5, fontWeight: 'bold' },
  textPaid: { color: '#059669' },
  textUnpaid: { color: '#D97706' },
  invoiceBody: {
    marginVertical: 10,
  },
  guestText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A5568',
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FEF9F1',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  priceCol: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#A0AEC0',
  },
  priceVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 2,
  },
  priceValBold: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 2,
  },
  settleBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  settleBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'android' ? 24 : 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 12,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#EBE5DA',
    paddingBottom: 10,
  },
  modalHeading: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  closeX: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#718096',
    padding: 4,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  billBox: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billItemName: {
    fontSize: 11,
    color: '#4A5568',
  },
  billItemPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  billCalculation: {
    marginTop: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  calcLabel: {
    fontSize: 10,
    color: '#718096',
  },
  calcVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4A5568',
  },
  calcLabelBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  calcValBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  modalTabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    marginBottom: 10,
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalTabBtnActive: {
    borderBottomWidth: 2,
    borderColor: '#0C2340',
  },
  modalTabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
  },
  modalTabBtnTextActive: {
    color: '#0C2340',
    fontWeight: '700',
  },
  formContainer: {
    paddingVertical: 4,
  },
  modalLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pickerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
    justifyContent: 'center',
  },
  pickerBadgeActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  pickerBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#718096',
  },
  pickerBadgeTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  modalInput: {
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
  processBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  processBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  printBtn: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  printBtnText: {
    color: '#0C2340',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
});
