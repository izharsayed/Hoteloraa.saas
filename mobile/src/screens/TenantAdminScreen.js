import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  Switch
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function TenantAdminScreen({ user, onLogout, onOpenDrawer, activeTab, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [featuresList, setFeaturesList] = useState([]);
  const [settingsData, setSettingsData] = useState(null);

  // Modal States
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  // Add Staff Form States
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('MANAGER');
  const [newStaffRoleId, setNewStaffRoleId] = useState('');
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Add Role Form States
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);

  // Edit Settings Form States
  const [settingsName, setSettingsName] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsTax, setSettingsTax] = useState('18');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchTabData = async (tabKey) => {
    try {
      setLoading(true);
      setError(null);

      if (tabKey === 'tenant_overview') {
        // Load combined hotel metrics, settings (to display plan name) & staff count
        const dbStats = await api.get('/dashboard');
        const setts = await api.get('/settings');
        const stf = await api.get('/users');
        setDashboardData(dbStats || {});
        setSettingsData(setts || {});
        setStaffList(stf || []);
      } else if (tabKey === 'tenant_staff') {
        const data = await api.get('/users');
        const roles = await api.get('/roles');
        setStaffList(data || []);
        setRolesList(roles || []);
      } else if (tabKey === 'tenant_rbac') {
        const data = await api.get('/roles');
        setRolesList(data || []);
      } else if (tabKey === 'tenant_features') {
        const data = await api.get('/features');
        setFeaturesList(data || []);
      } else if (tabKey === 'tenant_settings') {
        const data = await api.get('/settings');
        setSettingsData(data || {});
        if (data) {
          setSettingsName(data.propertyName || '');
          setSettingsPhone(data.phone || '');
          setSettingsEmail(data.email || '');
          setSettingsTax(String(data.taxRate ?? '18'));
        }
      }
    } catch (e) {
      console.warn(e);
      setError(`Failed to synchronize ${tabKey.replace('tenant_', '')} configurations.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const handleToggleStaffStatus = async (staffId) => {
    try {
      await api.patch(`/users/${staffId}/toggle-status`);
      Alert.alert('Status Updated', 'Staff membership status toggled.');
      fetchTabData('tenant_staff');
    } catch (e) {
      Alert.alert('Action Failed', e.message || 'Could not update user state.');
    }
  };

  const handleToggleFeature = async (featureName) => {
    try {
      await api.patch(`/features/${featureName}/toggle`);
      Alert.alert('Module Toggled', `${featureName} feature state changed.`);
      fetchTabData('tenant_features');
    } catch (e) {
      Alert.alert('Action Failed', e.message || 'Could not toggle feature module.');
    }
  };

  const handleAddStaffSubmit = async () => {
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) {
      Alert.alert('Validation Error', 'Name, email, and password are required.');
      return;
    }

    try {
      setSubmittingStaff(true);
      const payload = {
        name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        password: newStaffPassword.trim(),
        phone: newStaffPhone.trim() || undefined,
        userRole: newStaffRole,
        roleId: newStaffRoleId || undefined
      };

      await api.post('/users', payload);
      Alert.alert('Staff Added', 'Employee registered successfully!');
      
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffPhone('');
      setNewStaffRoleId('');
      setShowAddStaffModal(false);
      fetchTabData('tenant_staff');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to create staff member.');
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleAddRoleSubmit = async () => {
    if (!newRoleName.trim()) {
      Alert.alert('Validation Error', 'Role Name is required.');
      return;
    }

    try {
      setSubmittingRole(true);
      const payload = {
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
        permissions: []
      };

      await api.post('/roles', payload);
      Alert.alert('Role Added', 'Custom role created successfully!');
      setNewRoleName('');
      setNewRoleDesc('');
      setShowAddRoleModal(false);
      fetchTabData('tenant_rbac');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to create role.');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleSaveSettingsSubmit = async () => {
    if (!settingsName.trim() || !settingsEmail.trim()) {
      Alert.alert('Validation Error', 'Property Name and Email are required.');
      return;
    }

    try {
      setSavingSettings(true);
      const payload = {
        propertyName: settingsName.trim(),
        phone: settingsPhone.trim(),
        email: settingsEmail.trim(),
        taxRate: parseFloat(settingsTax) || 0,
        address: settingsData?.address || '',
        currency: settingsData?.currency || 'INR'
      };

      await api.put('/settings', payload);
      Alert.alert('Success', 'Property settings updated successfully!');
      fetchTabData('tenant_settings');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onOpenDrawer && (
            <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
              <Ionicons name="menu" size={28} color="#D4AF37" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>{settingsData?.propertyName || user.tenantName || 'Hoteloraa'}</Text>
            <Text style={styles.headerSubtitle}>TENANT ADMINISTRATION PANEL</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Fetching Command Console...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTabData(activeTab)}>
            <Text style={styles.retryBtnText}>🔄 Retry Sync</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* TAB 1: ADMIN OVERVIEW */}
          {activeTab === 'tenant_overview' && dashboardData && (
            <View style={styles.tabView}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeading}>Property Control Command</Text>
                <Text style={styles.cardSubheading}>SaaS administrative dashboard for {user.tenantName}.</Text>
              </View>

              {/* KPI Cards Row */}
              <View style={styles.kpiGrid}>
                <TouchableOpacity style={styles.kpiCard} onPress={() => { if (onNavigate) onNavigate('tenant_staff'); }}>
                  <Text style={styles.kpiValue}>
                    {staffList.filter(s => s.isActive).length}/{staffList.length} Active
                  </Text>
                  <Text style={styles.kpiTitle}>STAFF PERSONNEL</Text>
                  <Text style={[styles.kpiFootnote, { color: '#D4AF37' }]}>Manage Staff Registry ➔</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.kpiCard} onPress={() => { if (onNavigate) onNavigate('tenant_features'); }}>
                  <Text style={styles.kpiValue}>{user.businessType?.replace('_', ' ') || 'HOTEL'}</Text>
                  <Text style={styles.kpiTitle}>BUSINESS CATEGORY</Text>
                  <Text style={[styles.kpiFootnote, { color: '#D4AF37' }]}>Configure Modules ➔</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.kpiCard} onPress={() => { if (onNavigate) onNavigate('tenant_settings'); }}>
                  <Text style={styles.kpiValue}>{settingsData?.planName || 'STARTER'}</Text>
                  <Text style={styles.kpiTitle}>TENANT SUBSCRIPTION</Text>
                  <Text style={[styles.kpiFootnote, { color: '#D4AF37' }]}>Billing Settings & Plans ➔</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionHeading}>⭐ Live Operations Dashboard</Text>

              {/* Lodging Command card */}
              <View style={styles.card}>
                <View style={styles.commandHeader}>
                  <Text style={styles.commandTitle}>🏨 LODGING COMMAND</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>LIVE SYNC</Text></View>
                </View>
                <Text style={styles.commandDesc}>Rooms allocation & front desk heartbeat</Text>
                
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>
                    Room Occupancy ({dashboardData.lodging?.occupiedRooms || 0}/{dashboardData.lodging?.totalRooms || 0} Rooms)
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${((dashboardData.lodging?.occupiedRooms || 0) / Math.max(1, dashboardData.lodging?.totalRooms || 1)) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { borderLeftColor: '#3182CE' }]}>
                    <Text style={styles.statVal}>{dashboardData.lodging?.todayCheckIns || 0}</Text>
                    <Text style={styles.statLabel}>CHECK-INS</Text>
                  </View>
                  <View style={[styles.statBox, { borderLeftColor: '#D4AF37' }]}>
                    <Text style={styles.statVal}>{dashboardData.lodging?.todayCheckOuts || 0}</Text>
                    <Text style={styles.statLabel}>CHECK-OUTS</Text>
                  </View>
                  <View style={[styles.statBox, { borderLeftColor: '#E53E3E' }]}>
                    <Text style={styles.statVal}>{dashboardData.lodging?.pendingHousekeeping || 0}</Text>
                    <Text style={styles.statLabel}>DIRTY ROOMS</Text>
                  </View>
                </View>
              </View>

              {/* Kitchen & POS Command card */}
              <View style={styles.card}>
                <View style={styles.commandHeader}>
                  <Text style={styles.commandTitle}>🍕 KITCHEN & POS COMMAND</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>LIVE SYNC</Text></View>
                </View>
                <Text style={styles.commandDesc}>Dining tables status & kitchen ticket stream</Text>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>
                    Table Occupancy ({dashboardData.restaurant?.occupiedTables || 0}/{dashboardData.restaurant?.totalTables || 0} Tables)
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${((dashboardData.restaurant?.occupiedTables || 0) / Math.max(1, dashboardData.restaurant?.totalTables || 1)) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statBox, { borderLeftColor: '#3182CE' }]}>
                    <Text style={styles.statVal}>{dashboardData.restaurant?.totalOrders || 0}</Text>
                    <Text style={styles.statLabel}>TODAY ORDERS</Text>
                  </View>
                  <View style={[styles.statBox, { borderLeftColor: '#D4AF37' }]}>
                    <Text style={styles.statVal}>{dashboardData.restaurant?.pendingKOTs || 0}</Text>
                    <Text style={styles.statLabel}>PENDING KOTS</Text>
                  </View>
                  <View style={[styles.statBox, { borderLeftColor: '#48BB78', backgroundColor: '#F0FFF4' }]}>
                    <Text style={[styles.statVal, { color: '#276749' }]}>₹{(dashboardData.restaurant?.todayRevenue || 0).toLocaleString()}</Text>
                    <Text style={styles.statLabel}>TODAY SALES</Text>
                  </View>
                </View>
              </View>

              {/* Administrative Checklist */}
              <View style={styles.card}>
                <Text style={styles.commandTitle}>📋 Administrative Checklist</Text>
                <Text style={styles.commandDesc}>Verify property setup logs & parameters</Text>
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.checkItem}>✓ Verify employee staff profiles</Text>
                  <Text style={styles.checkItem}>✓ Audit shift timer configurations</Text>
                  <Text style={styles.checkItem}>✓ Set property tax settings ({settingsData?.taxRate || 18}%)</Text>
                  <Text style={styles.checkItem}>✓ Configure module feature toggles</Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: STAFF REGISTRY */}
          {activeTab === 'tenant_staff' && (
            <View style={styles.tabView}>
              <View style={styles.searchHeader}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search staff by name or email..."
                  placeholderTextColor="#718096"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowAddStaffModal(true)}>
                  <Text style={styles.createBtnText}>➕ Add Staff</Text>
                </TouchableOpacity>
              </View>

              {staffList
                .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((staff) => (
                  <View key={staff.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View>
                        <Text style={styles.itemTitle}>{staff.name}</Text>
                        <Text style={styles.itemSubtitle}>{staff.email}</Text>
                      </View>
                      <View style={[styles.statusBadge, staff.isActive ? styles.statusActive : styles.statusSuspended]}>
                        <Text style={styles.statusText}>{staff.isActive ? 'ACTIVE' : 'SUSPENDED'}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Mobile Phone:</Text>
                      <Text style={styles.detailValue}>{staff.phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Assigned Role:</Text>
                      <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{staff.role || staff.userRole}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Last Session Login:</Text>
                      <Text style={styles.detailValue}>{staff.lastLogin || 'Never'}</Text>
                    </View>

                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, staff.isActive ? styles.actionSuspendBtn : styles.actionActiveBtn]}
                        onPress={() => handleToggleStaffStatus(staff.id)}
                      >
                        <Text style={styles.actionBtnText}>
                          {staff.isActive ? '🔒 Suspend Account' : '🔓 Activate Account'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* TAB 3: ROLES & PERMISSIONS */}
          {activeTab === 'tenant_rbac' && (
            <View style={styles.tabView}>
              <View style={styles.searchHeader}>
                <Text style={{ flex: 1, fontSize: 13, color: '#4A5568', fontWeight: '500' }}>Roles & Permission Scopes</Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowAddRoleModal(true)}>
                  <Text style={styles.createBtnText}>➕ Add Role</Text>
                </TouchableOpacity>
              </View>

              {rolesList.map((roleObj) => (
                <View key={roleObj.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{roleObj.name}</Text>
                    {roleObj.isSystem && (
                      <View style={{ backgroundColor: '#EDF2F7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: '#4A5568', fontWeight: 'bold' }}>SYSTEM SEED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11.5, color: '#718096', marginTop: 4 }}>{roleObj.description || 'No description provided'}</Text>

                  <View style={styles.divider} />
                  <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#0C2340', marginBottom: 6 }}>Scope Permissions:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {roleObj.permissions?.length > 0 ? (
                      roleObj.permissions.map((p, i) => (
                        <View key={i} style={styles.featureBadge}>
                          <Text style={{ fontSize: 9, color: '#2B6CB0' }}>{p}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ fontSize: 11, color: '#A0AEC0', fontStyle: 'italic' }}>No permissions assigned.</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 4: FEATURE TOGGLES */}
          {activeTab === 'tenant_features' && (
            <View style={styles.tabView}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeading}>Module Configurations</Text>
                <Text style={styles.cardSubheading}>Configure and toggle properties module access states</Text>
              </View>

              {featuresList.map((feat) => (
                <View key={feat.id} style={[styles.itemCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.itemTitle, { fontSize: 14 }]}>{feat.feature} Module</Text>
                    <Text style={styles.itemSubtitle}>Enable or disable property {feat.feature} configurations</Text>
                  </View>
                  <Switch
                    value={feat.isEnabled}
                    onValueChange={() => handleToggleFeature(feat.feature)}
                    trackColor={{ false: '#CBD5E0', true: '#D4AF37' }}
                  />
                </View>
              ))}
            </View>
          )}

          {/* TAB 5: TENANT SETTINGS */}
          {activeTab === 'tenant_settings' && (
            <View style={styles.tabView}>
              <View style={styles.card}>
                <Text style={styles.sectionHeading}>🔧 Property Workspace Settings</Text>
                
                <Text style={styles.fieldLabel}>PropertyName / Hotel Brand</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={settingsName}
                  onChangeText={setSettingsName}
                  placeholder="e.g. Royal Palace Hotel"
                  placeholderTextColor="#A0AEC0"
                />

                <Text style={styles.fieldLabel}>Support Phone Number</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={settingsPhone}
                  onChangeText={setSettingsPhone}
                  placeholder="e.g. +919876543210"
                  placeholderTextColor="#A0AEC0"
                />

                <Text style={styles.fieldLabel}>Admin Email Address</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={settingsEmail}
                  onChangeText={setSettingsEmail}
                  placeholder="e.g. info@property.com"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.fieldLabel}>GST Tax Rate (%)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={settingsTax}
                  onChangeText={setSettingsTax}
                  placeholder="e.g. 18"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={[styles.saveSettingsBtn, savingSettings && { opacity: 0.7 }]}
                  onPress={handleSaveSettingsSubmit}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <ActivityIndicator size="small" color="#0C2340" />
                  ) : (
                    <Text style={styles.saveSettingsBtnText}>💾 Update Property Settings</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* MODAL: ADD STAFF */}
      <Modal visible={showAddStaffModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add Staff Member</Text>

            <ScrollView style={{ maxHeight: 350, marginVertical: 12 }}>
              <Text style={styles.fieldLabel}>Employee Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#A0AEC0"
                value={newStaffName}
                onChangeText={setNewStaffName}
              />

              <Text style={styles.fieldLabel}>Work Email Address</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="rahul@palace.com"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newStaffEmail}
                onChangeText={setNewStaffEmail}
              />

              <Text style={styles.fieldLabel}>Staff Login Password</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="••••••"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={newStaffPassword}
                onChangeText={setNewStaffPassword}
              />

              <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#A0AEC0"
                keyboardType="phone-pad"
                value={newStaffPhone}
                onChangeText={setNewStaffPhone}
              />

              <Text style={styles.fieldLabel}>Employee Role Class</Text>
              <View style={styles.rowChoices}>
                {['MANAGER', 'RECEPTIONIST', 'CAPTAIN', 'CHEF', 'HOUSEKEEPING', 'CASHIER'].map(roleOpt => (
                  <TouchableOpacity
                    key={roleOpt}
                    style={[styles.choiceBtn, newStaffRole === roleOpt && styles.choiceBtnActive]}
                    onPress={() => setNewStaffRole(roleOpt)}
                  >
                    <Text style={[styles.choiceBtnText, newStaffRole === roleOpt && styles.choiceBtnTextActive]}>{roleOpt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>RBAC Custom Role (Optional)</Text>
              <View style={styles.rowChoices}>
                <TouchableOpacity
                  style={[styles.choiceBtn, !newStaffRoleId && styles.choiceBtnActive]}
                  onPress={() => setNewStaffRoleId('')}
                >
                  <Text style={[styles.choiceBtnText, !newStaffRoleId && styles.choiceBtnTextActive]}>None (Default)</Text>
                </TouchableOpacity>
                {rolesList.map(role => (
                  <TouchableOpacity
                    key={role.id}
                    style={[styles.choiceBtn, newStaffRoleId === role.id && styles.choiceBtnActive]}
                    onPress={() => setNewStaffRoleId(role.id)}
                  >
                    <Text style={[styles.choiceBtnText, newStaffRoleId === role.id && styles.choiceBtnTextActive]}>{role.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.cancelBtn]}
                onPress={() => setShowAddStaffModal(false)}
                disabled={submittingStaff}
              >
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.saveBtn]}
                onPress={handleAddStaffSubmit}
                disabled={submittingStaff}
              >
                {submittingStaff ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Register</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD ROLE */}
      <Modal visible={showAddRoleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add Custom Role</Text>

            <View style={{ marginVertical: 12 }}>
              <Text style={styles.fieldLabel}>Role Name / ID</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Night Manager"
                placeholderTextColor="#A0AEC0"
                value={newRoleName}
                onChangeText={setNewRoleName}
              />

              <Text style={styles.fieldLabel}>Role Description</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Access to front desk logs during night shifts"
                placeholderTextColor="#A0AEC0"
                value={newRoleDesc}
                onChangeText={setNewRoleDesc}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.cancelBtn]}
                onPress={() => setShowAddRoleModal(false)}
                disabled={submittingRole}
              >
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.saveBtn]}
                onPress={handleAddRoleSubmit}
                disabled={submittingRole}
              >
                {submittingRole ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Create Role</Text>
                )}
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
    backgroundColor: '#FBFBF9',
  },
  header: {
    backgroundColor: '#0C2340',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderColor: '#D4AF37',
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: '#E2E8F0',
    letterSpacing: 0.5,
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
    padding: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
    fontSize: 13,
  },
  errorText: {
    fontSize: 14,
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryBtn: {
    backgroundColor: '#0C2340',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabView: {
    width: '100%',
  },
  cardHeader: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  cardSubheading: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    width: '31%',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'space-between',
  },
  kpiValue: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  kpiTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#718096',
    marginTop: 4,
  },
  kpiFootnote: {
    fontSize: 8,
    marginTop: 4,
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commandTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  commandDesc: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#B2F5EA',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 8.5,
    color: '#234E52',
    fontWeight: 'bold',
  },
  progressRow: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 10.5,
    color: '#4A5568',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#EDF2F7',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '31%',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  statLabel: {
    fontSize: 8.5,
    color: '#718096',
    marginTop: 2,
    fontWeight: 'bold',
  },
  checkItem: {
    fontSize: 11,
    color: '#4A5568',
    paddingVertical: 4,
  },
  searchHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 12.5,
    color: '#0C2340',
    marginRight: 8,
  },
  createBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#0C2340',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#C6F6D5',
  },
  statusSuspended: {
    backgroundColor: '#FED7D7',
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  divider: {
    height: 1,
    backgroundColor: '#EBE5DA',
    marginVertical: 12,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#718096',
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0C2340',
  },
  itemActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionSuspendBtn: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  actionActiveBtn: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  featureBadge: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 10,
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  saveSettingsBtn: {
    backgroundColor: '#D4AF37',
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveSettingsBtnText: {
    color: '#0C2340',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: '#0C2340',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5DA',
    paddingBottom: 10,
    textAlign: 'center',
  },
  rowChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  choiceBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  choiceBtnActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  choiceBtnText: {
    fontSize: 10,
    color: '#4A5568',
  },
  choiceBtnTextActive: {
    color: '#0C2340',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EBE5DA',
    paddingTop: 12,
  },
  modalActionBtn: {
    width: '48%',
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#EDF2F7',
  },
  cancelBtnText: {
    color: '#4A5568',
    fontSize: 12.5,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#0C2340',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
});
