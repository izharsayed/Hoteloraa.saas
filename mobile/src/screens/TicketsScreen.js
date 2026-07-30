import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, getAbsoluteAssetUrl } from '../api';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { value: 'BUG', label: 'Bug / Error' },
  { value: 'QUESTION', label: 'Question' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'BILLING', label: 'Billing / Subscription' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#718096', bg: '#EDF2F7' },
  { value: 'MEDIUM', label: 'Medium', color: '#D69E2E', bg: '#FEF9F1' },
  { value: 'HIGH', label: 'High', color: '#DD6B20', bg: '#FFFAF0' },
  { value: 'URGENT', label: 'Urgent', color: '#E53E3E', bg: '#FFF5F5' },
];

const MODULES = [
  { value: 'DASHBOARD', label: 'Dashboard & Overview' },
  { value: 'TABLES', label: 'Dining Tables / Seating' },
  { value: 'MENU', label: 'Menu Management' },
  { value: 'ORDERS', label: 'POS Orders' },
  { value: 'KOT', label: 'Kitchen (KOT)' },
  { value: 'POS', label: 'POS Billing Checkout' },
  { value: 'ROOMS', label: 'Rooms Directory' },
  { value: 'RESERVATIONS', label: 'Room Reservations' },
  { value: 'CHECKIN_CHECKOUT', label: 'Check-In / Check-Out' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
  { value: 'INVENTORY', label: 'Inventory & Stock' },
  { value: 'VENDORS_PURCHASES', label: 'Vendors & Procurement' },
  { value: 'ATTENDANCE_SHIFTS', label: 'Attendance & Shifts' },
  { value: 'REPORTS', label: 'Reports & Analytics' },
  { value: 'SETTINGS_USERS', label: 'System Settings & Users' },
  { value: 'OTHER', label: 'Other / General' },
];

export default function TicketsScreen({ user, onLogout, onOpenDrawer }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

  // Selected Ticket Detail Modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('BUG');
  const [ticketModule, setTicketModule] = useState('OTHER');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketAttachment, setTicketAttachment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/tickets');
      setTickets(data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const timer = setInterval(() => fetchTickets(true), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleUploadScreenshot = async (useCamera = false) => {
    const options = {
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    };

    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take photo.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Photo library access is required.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const localUri = result.assets[0].uri;
    const filename = localUri.split('/').pop() || 'screenshot.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: filename,
      type,
    });

    try {
      setUploading(true);
      const res = await api.upload('/tickets/upload', formData);
      setTicketAttachment(res.attachmentUrl);
      Alert.alert('Success', 'Screenshot uploaded successfully.');
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Failed to upload screenshot.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim() || !ticketDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a ticket title and description.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: ticketTitle.trim(),
        description: ticketDescription.trim(),
        category: ticketCategory,
        module: ticketModule,
        priority: ticketPriority,
        attachmentUrl: ticketAttachment || undefined,
      };

      await api.post('/tickets', payload);
      Alert.alert('Success', 'Support ticket submitted successfully.');
      setShowCreateModal(false);
      resetForm();
      fetchTickets();
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Could not create support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTicketTitle('');
    setTicketCategory('BUG');
    setTicketModule('OTHER');
    setTicketPriority('MEDIUM');
    setTicketDescription('');
    setTicketAttachment('');
  };

  // KPIs
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  // Filtered List
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id?.includes(searchQuery);

    let matchesStatus = true;
    if (statusFilter === 'OPEN') matchesStatus = t.status === 'OPEN' || t.status === 'IN_PROGRESS';
    else if (statusFilter === 'RESOLVED') matchesStatus = t.status === 'RESOLVED' || t.status === 'CLOSED';
    else if (statusFilter !== 'ALL') matchesStatus = t.status === statusFilter;

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
            <Text style={styles.headerTitle}>Support Helpdesk</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Support</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Card */}
        <View style={styles.titleSection}>
          <Text style={styles.titleHeading}>Report System Issue</Text>
          <Text style={styles.titleSubheading}>Create a support ticket to platform administrators about any system error or problem.</Text>
          <TouchableOpacity style={styles.goldBtn} onPress={() => { resetForm(); setShowCreateModal(true); }}>
            <Text style={styles.goldBtnText}>＋ Report New Issue</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Row */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIndicatorBar, { backgroundColor: '#0C2340' }]} />
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>TOTAL LOGGED</Text>
              <Text style={styles.kpiValue}>{totalCount}</Text>
            </View>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIndicatorBar, { backgroundColor: '#DD6B20' }]} />
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>ACTIVE ISSUES</Text>
              <Text style={styles.kpiValue}>{openCount}</Text>
            </View>
          </View>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIndicatorBar, { backgroundColor: '#38A169' }]} />
            <View style={styles.kpiContent}>
              <Text style={styles.kpiLabel}>RESOLVED</Text>
              <Text style={styles.kpiValue}>{resolvedCount}</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search ticket title, desc, or ID..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterButtonsRow}>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'OPEN', label: 'Active' },
              { key: 'RESOLVED', label: 'Resolved' },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBadge, statusFilter === f.key && styles.filterBadgeActive]}
                onPress={() => setStatusFilter(f.key)}
              >
                <Text style={[styles.filterBadgeText, statusFilter === f.key && styles.filterBadgeTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tickets Feed */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Ticket Feed</Text>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Fetching helpdesk tickets...</Text>
            </View>
          ) : filteredTickets.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="ticket-outline" size={40} color="#D4AF37" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTextBold}>No Tickets Logged</Text>
              <Text style={styles.emptyText}>Create a new support ticket if you experience bugs or errors.</Text>
            </View>
          ) : (
            filteredTickets.map((ticket) => {
              const priorityInfo = PRIORITIES.find(p => p.value === ticket.priority) || PRIORITIES[0];
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              
              return (
                <TouchableOpacity 
                  key={ticket.id} 
                  style={styles.ticketCard}
                  onPress={() => setSelectedTicket(ticket)}
                >
                  <View style={styles.ticketHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
                      <Text style={styles.ticketSubtitle}>
                        ID: {ticket.id.slice(0, 8).toUpperCase()} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.bg, borderColor: priorityInfo.color }]}>
                        <Text style={[styles.priorityBadgeText, { color: priorityInfo.color }]}>{ticket.priority}</Text>
                      </View>
                      <View style={[styles.statusBadge, isResolved ? styles.statusResolved : styles.statusOpen]}>
                        <Text style={[styles.statusBadgeText, isResolved ? styles.textResolved : styles.textOpen]}>
                          {ticket.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.ticketDescSummary} numberOfLines={2}>
                    {ticket.description}
                  </Text>

                  <View style={[styles.divider, { marginVertical: 8 }]} />
                  
                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketModule}>Category: {ticket.category} • Module: {ticket.module}</Text>
                    <Text style={styles.ticketAuthor}>By: {ticket.user?.name || 'Staff'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* MODAL 1: CREATE TICKET */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="#0C2340" />
          <View style={[styles.modalContent, { maxHeight: '92%', flex: 1, padding: 0, overflow: 'hidden' }]}>
            
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeading}>Report System Issue</Text>
                <Text style={styles.modalSubheading}>Submit a support request to Hoteloraa Platform Admins</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={{ padding: 4, marginLeft: 8 }}>
                <Ionicons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            {/* Form Scroll Body */}
            <ScrollView 
              style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}
              contentContainerStyle={{ paddingBottom: 25 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalLabel}>Issue Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Printer disconnected during POS checkout"
                placeholderTextColor="#A0AEC0"
                value={ticketTitle}
                onChangeText={setTicketTitle}
              />

              <Text style={styles.modalLabel}>Category</Text>
              <View style={styles.dropdownGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.pickerBadge, ticketCategory === cat.value && styles.pickerBadgeActive, { marginBottom: 6 }]}
                    onPress={() => setTicketCategory(cat.value)}
                  >
                    <Text style={[styles.pickerBadgeText, ticketCategory === cat.value && styles.pickerBadgeTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Priority Level</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 15 }}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.pickerBadge, 
                      { flex: 1, alignItems: 'center' },
                      ticketPriority === p.value && { backgroundColor: p.color, borderColor: p.color }
                    ]}
                    onPress={() => setTicketPriority(p.value)}
                  >
                    <Text style={[
                      styles.pickerBadgeText, 
                      ticketPriority === p.value && { color: '#FFFFFF', fontWeight: 'bold' }
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Affected Module</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 38, marginBottom: 15 }}>
                {MODULES.map((mod) => (
                  <TouchableOpacity
                    key={mod.value}
                    style={[styles.pickerBadge, ticketModule === mod.value && styles.pickerBadgeActive]}
                    onPress={() => setTicketModule(mod.value)}
                  >
                    <Text style={[styles.pickerBadgeText, ticketModule === mod.value && styles.pickerBadgeTextActive]}>
                      {mod.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>Detailed Description *</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                multiline
                placeholder="What exactly happened? What screen were you on? Any details will help us fix it quickly."
                placeholderTextColor="#A0AEC0"
                value={ticketDescription}
                onChangeText={setTicketDescription}
              />

              <Text style={styles.modalLabel}>Attach Screenshot / Photo</Text>
              <View style={styles.imageSelectorRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadScreenshot(false)} disabled={uploading}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                    <Text style={styles.uploadBtnText}>Choose Gallery</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadScreenshot(true)} disabled={uploading}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="camera-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                    <Text style={styles.uploadBtnText}>Take Photo</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {uploading ? (
                <ActivityIndicator size="small" color="#D4AF37" style={{ marginVertical: 10 }} />
              ) : ticketAttachment ? (
                <View style={styles.attachmentPreviewContainer}>
                  <Image source={{ uri: getAbsoluteAssetUrl(ticketAttachment) }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeAttachmentBtn}
                    onPress={() => setTicketAttachment('')}
                  >
                    <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalActionsFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={handleCreateTicket}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#D4AF37" />
                ) : (
                  <Text style={styles.confirmBtnText}>Submit Ticket</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: TICKET DETAILS */}
      <Modal visible={!!selectedTicket} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', padding: 0, overflow: 'hidden' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeading}>Ticket Details</Text>
                <Text style={styles.modalSubheading}>
                  ID: {selectedTicket?.id || ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTicket(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            {selectedTicket && (
              <ScrollView style={{ flex: 1, padding: 16 }}>
                <Text style={styles.detailTitle}>{selectedTicket.title}</Text>
                
                <View style={styles.detailMetaRow}>
                  <View style={[styles.statusBadge, selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED' ? styles.statusResolved : styles.statusOpen]}>
                    <Text style={[styles.statusBadgeText, selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED' ? styles.textResolved : styles.textOpen]}>
                      {selectedTicket.status}
                    </Text>
                  </View>
                  <View style={styles.detailMetaBadge}>
                    <Text style={styles.detailMetaBadgeText}>Priority: {selectedTicket.priority}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.metaLabel}>Detailed Report:</Text>
                <View style={styles.descriptionBox}>
                  <Text style={styles.detailDescText}>{selectedTicket.description}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Submitted By:</Text>
                  <Text style={styles.infoVal}>{selectedTicket.user?.name || 'Staff'} ({selectedTicket.user?.email || 'N/A'})</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Created On:</Text>
                  <Text style={styles.infoVal}>{new Date(selectedTicket.createdAt).toLocaleString()}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Category / Module:</Text>
                  <Text style={styles.infoVal}>{selectedTicket.category} / {selectedTicket.module}</Text>
                </View>

                {selectedTicket.attachmentUrl ? (
                  <View style={{ marginTop: 15 }}>
                    <Text style={styles.metaLabel}>Attachment Screenshot:</Text>
                    <Image 
                      source={{ uri: getAbsoluteAssetUrl(selectedTicket.attachmentUrl) }} 
                      style={styles.detailAttachmentImage} 
                      resizeMode="contain"
                    />
                  </View>
                ) : null}
              </ScrollView>
            )}

            <View style={styles.modalActionsFooter}>
              <TouchableOpacity style={styles.closeBtnFull} onPress={() => setSelectedTicket(null)}>
                <Text style={styles.closeBtnFullText}>Close Detail View</Text>
              </TouchableOpacity>
            </View>
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
  goldBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  goldBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 12,
    height: 75,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  kpiIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  kpiContent: {
    flex: 1,
    paddingLeft: 4,
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C2340',
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
    gap: 6,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
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
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  emptyTextBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  ticketCard: {
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  ticketSubtitle: {
    fontSize: 9.5,
    color: '#A0AEC0',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  priorityBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusOpen: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statusResolved: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  textOpen: { color: '#D97706' },
  textResolved: { color: '#059669' },
  ticketDescSummary: {
    fontSize: 11,
    color: '#4A5568',
    lineHeight: 15,
    marginBottom: 10,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderColor: '#FEF9F1',
    paddingTop: 8,
  },
  ticketModule: {
    fontSize: 9,
    color: '#A0AEC0',
    fontWeight: '600',
  },
  ticketAuthor: {
    fontSize: 9,
    color: '#718096',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 12,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    backgroundColor: '#FFFFFF',
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  modalSubheading: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 2,
  },
  modalLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
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
    marginBottom: 8,
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  imageSelectorRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  uploadBtnText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  attachmentPreviewContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EBE5DA',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeAttachmentBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(229, 62, 99, 0.85)',
    borderRadius: 6,
    padding: 4,
  },
  modalActionsFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#EBE5DA',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 8,
  },
  detailMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailMetaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#EBE5DA',
    backgroundColor: '#FEF9F1',
  },
  detailMetaBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#718096',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBE5DA',
    marginVertical: 12,
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  descriptionBox: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 12,
  },
  detailDescText: {
    fontSize: 11.5,
    color: '#2D3748',
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#718096',
  },
  infoVal: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  detailAttachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginTop: 6,
    backgroundColor: '#000000',
  },
  closeBtnFull: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  closeBtnFullText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
