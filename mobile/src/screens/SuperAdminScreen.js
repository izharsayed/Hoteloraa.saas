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

const TABS = [
  { key: 'super_cluster', label: 'Overview', icon: 'globe-outline' },
  { key: 'super_tenants', label: 'Tenants', icon: 'business-outline' },
  { key: 'super_plans', label: 'Plans', icon: 'card-outline' },
  { key: 'super_tickets', label: 'Tickets', icon: 'bookmark-outline' },
  { key: 'super_users', label: 'Users', icon: 'people-outline' },
  { key: 'super_rbac', label: 'RBAC', icon: 'shield-half-outline' },
  { key: 'super_audit', label: 'Audit Logs', icon: 'document-text-outline' },
];

export default function SuperAdminScreen({ user, onLogout, onOpenDrawer, activeTab, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded Data states
  const [overview, setOverview] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [rbacRoles, setRbacRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modal States
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showSimulateLog, setShowSimulateLog] = useState(false);

  // New Tenant Form
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantPassword, setNewTenantPassword] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('FREE');
  const [newTenantBusiness, setNewTenantBusiness] = useState('HOTEL_RESTAURANT');
  const [newTenantFeatures, setNewTenantFeatures] = useState({
    POS: true,
    ROOMS: true,
    HOUSEKEEPING: true
  });
  const [creatingTenant, setCreatingTenant] = useState(false);

  // New Simulated Log Form
  const [simLogAction, setSimLogAction] = useState('PLATFORM_BACKUP');
  const [simLogActor, setSimLogActor] = useState('System Daemon');
  const [simLogEntity, setSimLogEntity] = useState('PostgreSQL Database');
  const [simLogPrev, setSimLogPrev] = useState('v1.0.4');
  const [simLogNext, setSimLogNext] = useState('v1.0.5');
  const [simulatingLog, setSimulatingLog] = useState(false);

  const fetchTabData = async (tabKey) => {
    try {
      setLoading(true);
      setError(null);

      if (tabKey === 'super_cluster') {
        const data = await api.get('/superadmin/overview');
        setOverview(data);
      } else if (tabKey === 'super_tenants') {
        const data = await api.get('/superadmin/tenants');
        setTenants(data || []);
      } else if (tabKey === 'super_plans') {
        const data = await api.get('/superadmin/subscriptions');
        setPlans(data || []);
      } else if (tabKey === 'super_tickets') {
        const data = await api.get('/superadmin/tickets');
        setTickets(data || []);
      } else if (tabKey === 'super_users') {
        const data = await api.get('/superadmin/users');
        setUsersList(data || []);
      } else if (tabKey === 'super_rbac') {
        const data = await api.get('/superadmin/roles');
        setRbacRoles(data || []);
      } else if (tabKey === 'super_audit') {
        const data = await api.get('/superadmin/audit-logs');
        setAuditLogs(data || []);
      }
    } catch (e) {
      console.warn(e);
      setError(`Failed to load ${tabKey.replace('super_', '')} details.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const handleToggleTenant = async (tenantId) => {
    try {
      const res = await api.patch(`/superadmin/tenants/${tenantId}/status`);
      Alert.alert('Status Updated', 'Tenant status toggled successfully.');
      fetchTabData('super_tenants');
    } catch (e) {
      Alert.alert('Action Failed', e.message || 'Could not update tenant state.');
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await api.patch(`/superadmin/users/${userId}/status`);
      Alert.alert('Status Updated', 'User status toggled successfully.');
      fetchTabData('super_users');
    } catch (e) {
      Alert.alert('Action Failed', e.message || 'Could not toggle user state.');
    }
  };

  const handleUpdateTicket = async (ticketId, newStatus) => {
    try {
      await api.patch(`/superadmin/tickets/${ticketId}`, { status: newStatus });
      Alert.alert('Success', `Ticket marked as ${newStatus}`);
      fetchTabData('super_tickets');
    } catch (e) {
      Alert.alert('Error', 'Failed to update ticket status.');
    }
  };

  const handleCreateTenantSubmit = async () => {
    if (!newTenantName.trim() || !newTenantSlug.trim() || !newTenantEmail.trim() || !newTenantPassword.trim()) {
      Alert.alert('Validation Error', 'Please fill in all tenant registration fields.');
      return;
    }

    try {
      setCreatingTenant(true);
      const enabledFeatures = Object.keys(newTenantFeatures).filter(k => newTenantFeatures[k]);

      const payload = {
        name: newTenantName.trim(),
        slug: newTenantSlug.trim(),
        adminEmail: newTenantEmail.trim(),
        adminPassword: newTenantPassword.trim(),
        plan: newTenantPlan,
        businessType: newTenantBusiness,
        features: enabledFeatures
      };

      await api.post('/superadmin/tenants', payload);
      Alert.alert('Success', 'Tenant Workspace provisioned successfully!');
      
      // Reset forms
      setNewTenantName('');
      setNewTenantSlug('');
      setNewTenantEmail('');
      setNewTenantPassword('');
      setShowCreateTenant(false);
      fetchTabData('super_tenants');
    } catch (e) {
      Alert.alert('Creation Failed', e.message || 'Error occurred while provisioning workspace.');
    } finally {
      setCreatingTenant(false);
    }
  };

  const handleSimulateLogSubmit = async () => {
    try {
      setSimulatingLog(true);
      const payload = {
        action: simLogAction,
        actor: simLogActor,
        entity: simLogEntity,
        previousValue: simLogPrev,
        newValue: simLogNext,
        severity: 'INFO'
      };
      await api.post('/superadmin/audit-logs/simulate', payload);
      Alert.alert('Log Added', 'Audit log entry simulated successfully!');
      setShowSimulateLog(false);
      fetchTabData('super_audit');
    } catch (e) {
      Alert.alert('Error', 'Failed to push simulated audit log.');
    } finally {
      setSimulatingLog(false);
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
            <Text style={styles.headerTitle}>Hoteloraa</Text>
            <Text style={styles.headerSubtitle}>GLOBAL SUPER ADMIN PORTAL</Text>
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
          <Text style={styles.loadingText}>Fetching Platform Logs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchTabData(activeTab)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="refresh" size={14} color="#D4AF37" style={{ marginRight: 4 }} />
              <Text style={styles.retryBtnText}>Retry Sync</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'super_cluster' && overview && (
            <View style={styles.tabView}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeading}>Cluster Metrics</Text>
                <Text style={styles.cardSubheading}>Realtime multi-tenant platform analytics</Text>
              </View>

              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{overview.totalTenants || 0}</Text>
                  <Text style={styles.kpiTitle}>ACTIVE CUSTOMERS</Text>
                  <Text style={styles.kpiFootnote}>{overview.trialCustomers || 0} in Free Trial</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{overview.mrr || '₹0'}</Text>
                  <Text style={styles.kpiTitle}>MONTHLY RECURRING (MRR)</Text>
                  <Text style={styles.kpiFootnote}>ARR: {overview.arr || '₹0'}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{overview.churnRate || '0.0%'}</Text>
                  <Text style={styles.kpiTitle}>PLATFORM CHURN</Text>
                  <Text style={styles.kpiFootnote}>Industry standard range</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{overview.averageRevenuePerTenant || '₹0'}</Text>
                  <Text style={styles.kpiTitle}>AVG REV PER TENANT</Text>
                  <Text style={styles.kpiFootnote}>Monthly averages</Text>
                </View>
              </View>

              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="settings-outline" size={16} color="#D4AF37" style={{ marginRight: 6 }} />
                  <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>System Cluster Resources Status</Text>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressMeta}>
                    <Text style={styles.progressLabel}>CPU Core Load:</Text>
                    <Text style={styles.progressVal}>{overview.systemStats?.cpuLoad || 0}% / 100%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${overview.systemStats?.cpuLoad || 5}%` }]} />
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressMeta}>
                    <Text style={styles.progressLabel}>RAM Memory:</Text>
                    <Text style={styles.progressVal}>{overview.systemStats?.ramUsage || '2.9'} GB / 8.0 GB</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '36%' }]} />
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressMeta}>
                    <Text style={styles.progressLabel}>DB Pool Cache Hit Ratio:</Text>
                    <Text style={styles.progressVal}>{overview.systemStats?.dbCacheHit || 65}% Hit Ratio</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${overview.systemStats?.dbCacheHit || 65}%` }]} />
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="bar-chart-outline" size={16} color="#D4AF37" style={{ marginRight: 6 }} />
                  <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>SaaS Subscriptions Ledger</Text>
                </View>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>MONTHLY RECURRING REVENUE</Text>
                  <Text style={styles.ledgerVal}>{overview.mrr || '₹0'}</Text>
                </View>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>ANNUAL RECURRING REVENUE</Text>
                  <Text style={styles.ledgerVal}>{overview.arr || '₹0'}</Text>
                </View>
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>PENDING RENEWALS (THIS WEEK)</Text>
                  <Text style={[styles.ledgerVal, { color: '#D4AF37' }]}>{overview.pendingRenewals || 0} tenants</Text>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: TENANTS REGISTRY */}
          {activeTab === 'super_tenants' && (
            <View style={styles.tabView}>
              <View style={styles.searchHeader}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search tenants by name, slug or admin email..."
                  placeholderTextColor="#718096"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateTenant(true)}>
                  <Text style={styles.createBtnText}>Create Tenant</Text>
                </TouchableOpacity>
              </View>

              {tenants
                .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.slug.toLowerCase().includes(searchQuery.toLowerCase()) || t.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((tenant) => (
                  <View key={tenant.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View>
                        <Text style={styles.itemTitle}>{tenant.name}</Text>
                        <Text style={styles.itemSubtitle}>slug: /{tenant.slug} • type: {tenant.businessType}</Text>
                      </View>
                      <View style={[styles.statusBadge, tenant.status === 'ACTIVE' ? styles.statusActive : tenant.status === 'TRIAL' ? styles.statusTrial : styles.statusSuspended]}>
                        <Text style={styles.statusText}>{tenant.status}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Admin Email:</Text>
                      <Text style={styles.detailValue}>{tenant.adminEmail}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Plan Tier:</Text>
                      <Text style={styles.detailValue}>{tenant.plan}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Joined On:</Text>
                      <Text style={styles.detailValue}>{tenant.dateJoined}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Modules Enabled:</Text>
                      <Text style={styles.detailValue}>
                        {Object.keys(tenant.features).filter(k => tenant.features[k]).join(', ') || 'None'}
                      </Text>
                    </View>

                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, tenant.status === 'SUSPENDED' ? styles.actionActiveBtn : styles.actionSuspendBtn]}
                        onPress={() => handleToggleTenant(tenant.id)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons 
                            name={tenant.status === 'SUSPENDED' ? "lock-open-outline" : "lock-closed-outline"} 
                            size={12} 
                            color={tenant.status === 'SUSPENDED' ? "#2B6CB0" : "#C53030"} 
                            style={{ marginRight: 6 }} 
                          />
                          <Text style={styles.actionBtnText}>
                            {tenant.status === 'SUSPENDED' ? 'Activate Workspace' : 'Suspend Workspace'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* TAB 3: SUBSCRIPTION PLANS */}
          {activeTab === 'super_plans' && (
            <View style={styles.tabView}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeading}>Available Subscription Plans</Text>
                <Text style={styles.cardSubheading}>SaaS pricing plans tiers and limits</Text>
              </View>

              {plans.map((plan) => (
                <View key={plan.id} style={styles.planCard}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>₹{plan.monthlyPrice.toLocaleString()}/mo</Text>
                  </View>
                  <Text style={styles.planSubtitle}>Yearly Billing Price: ₹{plan.yearlyPrice.toLocaleString()}/yr</Text>

                  <View style={styles.divider} />

                  <View style={styles.planDetailRow}>
                    <Text style={styles.planDetailLabel}>User Limit:</Text>
                    <Text style={styles.planDetailVal}>{plan.userLimit} user seats</Text>
                  </View>
                  <View style={styles.planDetailRow}>
                    <Text style={styles.planDetailLabel}>Cloud Storage:</Text>
                    <Text style={styles.planDetailVal}>{plan.storageLimit} GB</Text>
                  </View>
                  <View style={styles.planDetailRow}>
                    <Text style={styles.planDetailLabel}>Active Tenant Workspaces:</Text>
                    <Text style={[styles.planDetailVal, { fontWeight: 'bold', color: '#D4AF37' }]}>{plan.activeTenantsCount} active</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  <Text style={styles.planFeatureHeader}>Enabled Modules Included:</Text>
                  <View style={styles.featuresContainer}>
                    {plan.features.map((f, i) => (
                      <View key={i} style={styles.featureBadge}>
                        <Text style={styles.featureBadgeText}>{f.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 4: SUPPORT TICKETS */}
          {activeTab === 'super_tickets' && (
            <View style={styles.tabView}>
              <View style={styles.searchHeader}>
                <TextInput
                  style={[styles.searchInput, { marginRight: 0 }]}
                  placeholder="Filter tickets by subject, priority or tenant..."
                  placeholderTextColor="#718096"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {tickets
                .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.priority.toLowerCase().includes(searchQuery.toLowerCase()) || t.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((ticket) => (
                  <View key={ticket.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.itemTitle}>{ticket.title}</Text>
                        <Text style={styles.itemSubtitle}>Tenant: {ticket.tenant?.name || 'Unknown'} | Created: {new Date(ticket.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <View style={[styles.priorityBadge, ticket.priority === 'HIGH' ? styles.priorityHigh : styles.priorityLow]}>
                          <Text style={styles.priorityText}>{ticket.priority}</Text>
                        </View>
                        <View style={[styles.statusBadge, ticket.status === 'RESOLVED' ? styles.statusActive : styles.statusTrial, { marginTop: 4 }]}>
                          <Text style={styles.statusText}>{ticket.status}</Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.ticketDesc}>{ticket.description}</Text>

                    <View style={styles.divider} />
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Author:</Text>
                      <Text style={styles.detailValue}>{ticket.user?.name} ({ticket.user?.email})</Text>
                    </View>

                    <View style={styles.itemActions}>
                      {ticket.status !== 'RESOLVED' ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionActiveBtn]}
                          onPress={() => handleUpdateTicket(ticket.id, 'RESOLVED')}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="checkmark-circle-outline" size={12} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.actionBtnText}>Resolve Ticket</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionSuspendBtn]}
                          onPress={() => handleUpdateTicket(ticket.id, 'PENDING')}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="alert-circle-outline" size={12} color="#C53030" style={{ marginRight: 6 }} />
                            <Text style={styles.actionBtnText}>Reopen Ticket</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* TAB 5: PLATFORM USERS */}
          {activeTab === 'super_users' && (
            <View style={styles.tabView}>
              <View style={styles.searchHeader}>
                <TextInput
                  style={[styles.searchInput, { marginRight: 0 }]}
                  placeholder="Search user registry by name or email..."
                  placeholderTextColor="#718096"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {usersList
                .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((pUser) => (
                  <View key={pUser.id} style={styles.userCard}>
                    <View style={styles.avatarRow}>
                      <View style={styles.avatarBox}>
                        <Text style={styles.avatarText}>{pUser.initials}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.userCardTitle}>{pUser.name}</Text>
                        <Text style={styles.userCardEmail}>{pUser.email}</Text>
                      </View>
                      <View style={[styles.statusBadge, pUser.isActive ? styles.statusActive : styles.statusSuspended]}>
                        <Text style={styles.statusText}>{pUser.isActive ? 'ACTIVE' : 'BLOCKED'}</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Property Tenant Workspace:</Text>
                      <Text style={styles.detailValue}>{pUser.tenant}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>RBAC Profile Role:</Text>
                      <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>{pUser.role}</Text>
                    </View>
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.detailLabel}>Last Login Session:</Text>
                      <Text style={styles.detailValue}>{pUser.lastLogin}</Text>
                    </View>

                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, pUser.isActive ? styles.actionSuspendBtn : styles.actionActiveBtn]}
                        onPress={() => handleToggleUser(pUser.id)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons 
                            name={pUser.isActive ? "ban-outline" : "checkmark-circle-outline"} 
                            size={12} 
                            color={pUser.isActive ? "#C53030" : "#2B6CB0"} 
                            style={{ marginRight: 6 }} 
                          />
                          <Text style={styles.actionBtnText}>
                            {pUser.isActive ? 'Block Account' : 'Unblock Account'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* TAB 6: GLOBAL RBAC PANEL */}
          {activeTab === 'super_rbac' && (
            <View style={styles.tabView}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeading}>Global RBAC Controls</Text>
                <Text style={styles.cardSubheading}>Standard system roles and global permission maps</Text>
              </View>

              {rbacRoles.map((role) => (
                <View key={role.id} style={styles.rbacCard}>
                  <View style={styles.rbacHeader}>
                    <Text style={styles.rbacName}>{role.name}</Text>
                    {role.isSystem && (
                      <View style={styles.systemBadge}>
                        <Text style={styles.systemBadgeText}>SYSTEM SEED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rbacDesc}>{role.description}</Text>

                  <View style={styles.divider} />
                  <Text style={styles.rbacPermissionHeader}>Permissions Scope:</Text>
                  <View style={styles.permissionsGrid}>
                    {role.permissions.map((p, i) => (
                      <View key={i} style={styles.permissionBadge}>
                        <Text style={styles.permissionBadgeText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 7: AUDIT LOGS */}
          {activeTab === 'super_audit' && (
            <View style={styles.tabView}>
              <View style={styles.searchHeader}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Filter logs by action, actor, or entity..."
                  placeholderTextColor="#718096"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                 <TouchableOpacity style={styles.simulateBtn} onPress={() => setShowSimulateLog(true)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="flask-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                    <Text style={styles.simulateBtnText}>Simulate Log</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {auditLogs
                .filter(l => !searchQuery || l.action.toLowerCase().includes(searchQuery.toLowerCase()) || l.actor.toLowerCase().includes(searchQuery.toLowerCase()) || l.entity.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((log) => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logAction}>{log.action}</Text>
                      <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
                    </View>
                    <View style={styles.logDetailRow}>
                      <Text style={styles.logLabel}>Actor:</Text>
                      <Text style={styles.logVal}>{log.actor}</Text>
                    </View>
                    <View style={styles.logDetailRow}>
                      <Text style={styles.logLabel}>Target Entity:</Text>
                      <Text style={styles.logVal}>{log.entity}</Text>
                    </View>
                    {log.previousValue && log.previousValue !== 'None' && (
                      <View style={styles.logDetailRow}>
                        <Text style={styles.logLabel}>Previous:</Text>
                        <Text style={[styles.logVal, { color: '#E53E3E' }]}>{log.previousValue}</Text>
                      </View>
                    )}
                    {log.newValue && (
                      <View style={styles.logDetailRow}>
                        <Text style={styles.logLabel}>Updated To:</Text>
                        <Text style={[styles.logVal, { color: '#38A169' }]}>{log.newValue}</Text>
                      </View>
                    )}
                  </View>
                ))}
            </View>
          )}

        </ScrollView>
      )}

      {/* MODAL: CREATE TENANT */}
      <Modal visible={showCreateTenant} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Provision Workspace Tenant</Text>

            <ScrollView style={{ maxHeight: 350, marginVertical: 12 }}>
              <Text style={styles.fieldLabel}>Tenant Business Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Royal Palace Hotel"
                placeholderTextColor="#A0AEC0"
                value={newTenantName}
                onChangeText={setNewTenantName}
              />

              <Text style={styles.fieldLabel}>URL Path Slug</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. royalpalace"
                placeholderTextColor="#A0AEC0"
                value={newTenantSlug}
                onChangeText={setNewTenantSlug}
              />

              <Text style={styles.fieldLabel}>Primary Admin Email</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="admin@hotelname.com"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newTenantEmail}
                onChangeText={setNewTenantEmail}
              />

              <Text style={styles.fieldLabel}>Initial Account Password</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="••••••••"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={newTenantPassword}
                onChangeText={setNewTenantPassword}
              />

              <Text style={styles.fieldLabel}>SaaS Subscription Plan</Text>
              <View style={styles.rowChoices}>
                {['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.choiceBtn, newTenantPlan === p && styles.choiceBtnActive]}
                    onPress={() => setNewTenantPlan(p)}
                  >
                    <Text style={[styles.choiceBtnText, newTenantPlan === p && styles.choiceBtnTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Property Business Type</Text>
              <View style={styles.rowChoices}>
                {['HOTEL_RESTAURANT', 'RESTAURANT', 'LODGING'].map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.choiceBtn, newTenantBusiness === b && styles.choiceBtnActive]}
                    onPress={() => setNewTenantBusiness(b)}
                  >
                    <Text style={[styles.choiceBtnText, newTenantBusiness === b && styles.choiceBtnTextActive]}>
                      {b.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Modules Enabled</Text>
              {Object.keys(newTenantFeatures).map(f => (
                <View key={f} style={styles.switchRow}>
                  <Text style={styles.switchRowLabel}>{f} Module</Text>
                  <Switch
                    value={newTenantFeatures[f]}
                    onValueChange={(val) => setNewTenantFeatures(prev => ({ ...prev, [f]: val }))}
                    trackColor={{ false: '#CBD5E0', true: '#D4AF37' }}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.cancelBtn]}
                onPress={() => setShowCreateTenant(false)}
                disabled={creatingTenant}
              >
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.saveBtn]}
                onPress={handleCreateTenantSubmit}
                disabled={creatingTenant}
              >
                {creatingTenant ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Provision</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SIMULATE LOG */}
      <Modal visible={showSimulateLog} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Simulate Audit Event Log</Text>

            <View style={{ marginVertical: 12 }}>
              <Text style={styles.fieldLabel}>Action Event Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. BACKUP_COMPLETED"
                placeholderTextColor="#A0AEC0"
                value={simLogAction}
                onChangeText={setSimLogAction}
              />

              <Text style={styles.fieldLabel}>Actor Name</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. System Cron"
                placeholderTextColor="#A0AEC0"
                value={simLogActor}
                onChangeText={setSimLogActor}
              />

              <Text style={styles.fieldLabel}>Target Entity</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. S3 Storage Bucket"
                placeholderTextColor="#A0AEC0"
                value={simLogEntity}
                onChangeText={setSimLogEntity}
              />

              <Text style={styles.fieldLabel}>Previous Value</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. status: offline"
                placeholderTextColor="#A0AEC0"
                value={simLogPrev}
                onChangeText={setSimLogPrev}
              />

              <Text style={styles.fieldLabel}>New Value</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. status: active"
                placeholderTextColor="#A0AEC0"
                value={simLogNext}
                onChangeText={setSimLogNext}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.cancelBtn]}
                onPress={() => setShowSimulateLog(false)}
                disabled={simulatingLog}
              >
                <Text style={styles.cancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.saveBtn]}
                onPress={handleSimulateLogSubmit}
                disabled={simulatingLog}
              >
                {simulatingLog ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Simulate</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
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
  tabsContainer: {
    backgroundColor: '#0C2340',
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    paddingVertical: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeTabButton: {
    backgroundColor: '#D4AF37',
  },
  tabIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 11.5,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#0C2340',
    fontWeight: 'bold',
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  kpiTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#718096',
    marginTop: 4,
  },
  kpiFootnote: {
    fontSize: 8.5,
    color: '#A0AEC0',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 12,
  },
  progressRow: {
    marginBottom: 12,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#4A5568',
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0C2340',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#EDF2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  ledgerLabel: {
    fontSize: 10.5,
    color: '#718096',
    fontWeight: '600',
  },
  ledgerVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
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
  simulateBtn: {
    backgroundColor: '#4A5568',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulateBtnText: {
    color: '#FFFFFF',
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
  statusTrial: {
    backgroundColor: '#FEFCBF',
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
  planCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  planPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  planSubtitle: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 2,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  planDetailLabel: {
    fontSize: 11,
    color: '#4A5568',
  },
  planDetailVal: {
    fontSize: 11.5,
    color: '#2D3748',
  },
  planFeatureHeader: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureBadge: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 6,
  },
  featureBadgeText: {
    fontSize: 9,
    color: '#4A5568',
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityHigh: {
    backgroundColor: '#FED7D7',
  },
  priorityLow: {
    backgroundColor: '#EDF2F7',
  },
  priorityText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  ticketDesc: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 8,
    backgroundColor: '#F7FAFC',
    padding: 8,
    borderRadius: 8,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0C2340',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  avatarText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: 'bold',
  },
  userCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  userCardEmail: {
    fontSize: 11,
    color: '#718096',
  },
  rbacCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  rbacHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rbacName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  systemBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#4A5568',
  },
  rbacDesc: {
    fontSize: 11.5,
    color: '#718096',
    marginTop: 4,
  },
  rbacPermissionHeader: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 6,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  permissionBadge: {
    backgroundColor: '#F0F4F8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  permissionBadgeText: {
    fontSize: 9,
    color: '#1A365D',
    fontWeight: '500',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logAction: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  logTime: {
    fontSize: 9.5,
    color: '#A0AEC0',
  },
  logDetailRow: {
    flexDirection: 'row',
    paddingVertical: 1,
  },
  logLabel: {
    fontSize: 10.5,
    color: '#718096',
    width: 90,
  },
  logVal: {
    fontSize: 10.5,
    color: '#2D3748',
    flex: 1,
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
  fieldLabel: {
    fontSize: 11,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  switchRowLabel: {
    fontSize: 11,
    color: '#2D3748',
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
