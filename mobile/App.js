import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// API, Permissions, Navigation and Screens
import { initApi, getCurrentUser, api } from './src/api';
import { canAccess, ROLES } from './src/permissions';
import { getNavigationGroups } from './src/navigationConfig';
import LoginScreen from './src/screens/LoginScreen';
import HousekeepingScreen from './src/screens/HousekeepingScreen';
import CaptainScreen from './src/screens/CaptainScreen';
import ManagerScreen from './src/screens/ManagerScreen';
import ManagerHubScreen from './src/screens/ManagerHubScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import ReservationsScreen from './src/screens/ReservationsScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import CheckOutScreen from './src/screens/CheckOutScreen';
import HousekeepingBoardScreen from './src/screens/HousekeepingBoardScreen';
import CRMScreen from './src/screens/CRMScreen';
import TablesScreen from './src/screens/TablesScreen';
import KitchenScreen from './src/screens/KitchenScreen';
import MenuManagerScreen from './src/screens/MenuManagerScreen';
import POSTerminalScreen from './src/screens/POSTerminalScreen';
import POSBillingScreen from './src/screens/POSBillingScreen';
import ActiveOrdersHistoryScreen from './src/screens/ActiveOrdersHistoryScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import SuperAdminScreen from './src/screens/SuperAdminScreen';
import TenantAdminScreen from './src/screens/TenantAdminScreen';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  
  // Navigation State
  const [navigationGroups, setNavigationGroups] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeGroupName, setActiveGroupName] = useState('General');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [checkoutRoomId, setCheckoutRoomId] = useState(null);

  // Authentication check on boot
  useEffect(() => {
    const startup = async () => {
      await initApi(handleAuthFailure);

      const cachedUser = getCurrentUser();
      if (cachedUser) {
        setUser(cachedUser);
        resolveNavigation(cachedUser);
      }
      setInitializing(false);
    };

    startup();
  }, []);

  const handleAuthFailure = (message) => {
    setUser(null);
    setNavigationGroups([]);
    setIsDrawerOpen(false);
    Alert.alert('Session Expired', message || 'Your session has expired. Please log in again.');
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    resolveNavigation(loggedInUser);
  };

  const handleLogout = async () => {
    setInitializing(true);
    try {
      await api.logout();
    } catch (err) {
      console.warn('Network logout failed', err);
    } finally {
      setUser(null);
      setNavigationGroups([]);
      setIsDrawerOpen(false);
      setInitializing(false);
    }
  };

  // Resolve which modules the user can access and construct navigation groups matching web sidebar
  const resolveNavigation = (currentUser) => {
    if (!currentUser) return;

    const groups = getNavigationGroups(currentUser);
    setNavigationGroups(groups);

    // Count total accessible items
    let totalItems = 0;
    groups.forEach(g => totalItems += g.items.length);
    console.log("resolveNavigation - userRole:", currentUser.userRole, "groups count:", groups.length, "totalItems:", totalItems);

    // Determine initial view based on role
    let initialView = 'dashboard';
    let initialGroupName = 'General';
    const role = currentUser.userRole;

    if (role === ROLES.HOUSEKEEPING) {
      initialView = 'housekeeping';
      initialGroupName = 'Lodging Operations';
    } else if (role === ROLES.CAPTAIN) {
      initialView = 'captain';
      initialGroupName = 'Captain Dashboard';
    } else if (role === ROLES.SUPER_ADMIN) {
      initialView = 'super_cluster';
      initialGroupName = 'Super Admin Portal';
    } else if (role === ROLES.TENANT_ADMIN) {
      initialView = 'tenant_overview';
      initialGroupName = 'Tenant Administration';
    } else {
      // Find the first available item in the resolved groups
      if (groups.length > 0 && groups[0].items.length > 0) {
        initialView = groups[0].items[0].view;
        initialGroupName = groups[0].category;
      }
    }

    setActiveView(initialView);
    setActiveGroupName(initialGroupName);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Render active view screen component
  const renderActiveScreen = (onOpenDrawerAction) => {
    switch (activeView) {
      case 'dashboard':
        return <ManagerScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'manager_hub':
        return <ManagerHubScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'attendance':
        return <AttendanceScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'reports':
        return <ReportsScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'rooms':
        return <RoomsScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'reservations':
        return <ReservationsScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} onNavigate={setActiveView} setCheckoutRoomId={setCheckoutRoomId} />;
      case 'checkin':
        return <CheckInScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'checkout':
        return <CheckOutScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} checkoutRoomId={checkoutRoomId} setCheckoutRoomId={setCheckoutRoomId} />;
      case 'crm':
        return <CRMScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'tables':
        return <TablesScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'kitchen':
        return <KitchenScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'menu':
        return <MenuManagerScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'orders':
        return <POSTerminalScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'pos':
        return <POSBillingScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'captain':
        return <CaptainScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'captain_history':
        return <ActiveOrdersHistoryScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'housekeeping':
        if (user?.userRole === 'TENANT_ADMIN' || user?.userRole === 'MANAGER' || user?.userRole === 'RECEPTIONIST') {
          return <HousekeepingBoardScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
        }
        return <HousekeepingScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} />;
      case 'super_cluster':
      case 'super_tenants':
      case 'super_plans':
      case 'super_tickets':
      case 'super_users':
      case 'super_rbac':
      case 'super_audit':
        return <SuperAdminScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} activeTab={activeView} onNavigate={setActiveView} />;
      case 'tenant_overview':
      case 'tenant_staff':
      case 'tenant_rbac':
      case 'tenant_features':
      case 'tenant_settings':
        return <TenantAdminScreen user={user} onLogout={handleLogout} onOpenDrawer={onOpenDrawerAction} activeTab={activeView} onNavigate={setActiveView} />;
      default:
        return (
          <PlaceholderScreen
            viewName={activeView}
            groupName={activeGroupName}
            user={user}
            onLogout={handleLogout}
            onOpenDrawer={onOpenDrawerAction}
          />
        );
    }
  };

  // Main UI switcher
  const renderContent = () => {
    if (!user) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    // Render screen + slide drawer
    return (
      <View style={styles.appContainer}>
        {/* Active Screen View */}
        <View style={styles.screenContainer}>
          {renderActiveScreen(toggleDrawer)}
        </View>

        {/* Drawer Backdrop Overlay */}
        {isDrawerOpen && (
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Dynamic Luxury Side Pane Drawer */}
        {isDrawerOpen && (
          <View style={styles.drawerContainer}>
            {/* Drawer Brand Header */}
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.brandTitle}>HOTELORAA</Text>
                <Text style={styles.brandSubtitle}>Property Management Suite</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDrawerOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#D4AF37" />
              </TouchableOpacity>
            </View>

            {/* Profile Summary */}
            <View style={styles.profileSummary}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
              </View>
              <View style={styles.profileText}>
                <Text style={styles.profileName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.profileRole} numberOfLines={1}>{user.userRole.replace('_', ' ')}</Text>
              </View>
            </View>

            {/* Scrollable Navigation Items */}
            <ScrollView style={styles.drawerNavList} contentContainerStyle={styles.drawerNavContent}>
              {navigationGroups.map((group) => (
                <View key={group.category} style={styles.navGroup}>
                  <Text style={styles.navGroupCategory}>{group.category.toUpperCase()}</Text>
                  
                  {group.items.map((item) => {
                    const isActive = activeView === item.view;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[styles.navItem, isActive && styles.navItemActive]}
                        onPress={() => {
                          setActiveView(item.view);
                          setActiveGroupName(group.category);
                          setIsDrawerOpen(false);
                        }}
                      >
                        <Ionicons 
                          name={item.icon} 
                          size={18} 
                          color={isActive ? '#D4AF37' : '#A0AEC0'} 
                          style={{ marginRight: 12, width: 20, textAlign: 'center' }} 
                        />
                        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.name}</Text>
                        {isActive && <View style={styles.activeIndicator} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.drawerLogoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#E53E3E" style={{ marginRight: 12 }} />
                <Text style={styles.drawerLogoutText}>Exit Platform</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Initializing Hoteloraa Suite...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" translucent={false} backgroundColor="#0C2340" />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#FEF9F1',
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0C2340',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99,
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 290,
    backgroundColor: '#0C2340',
    borderRightWidth: 2,
    borderColor: '#D4AF37',
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: 'rgba(254, 249, 241, 0.1)',
  },
  brandTitle: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'sans-serif-medium',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: '#E2E8F0',
    fontSize: 9,
    marginTop: 1,
    opacity: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(254, 249, 241, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(254, 249, 241, 0.1)',
    backgroundColor: 'rgba(12, 35, 64, 0.4)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#FEF9F1',
  },
  avatarText: {
    color: '#0C2340',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    color: '#FEF9F1',
    fontSize: 14,
    fontWeight: '600',
  },
  profileRole: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerNavList: {
    flex: 1,
  },
  drawerNavContent: {
    paddingVertical: 15,
  },
  navGroup: {
    marginBottom: 20,
  },
  navGroupCategory: {
    color: '#718096',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    height: 42,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
    paddingHorizontal: 16, // Offset for left border
  },
  navIcon: {
    fontSize: 16,
    marginRight: 12,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    right: 15,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },
  drawerFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderColor: 'rgba(254, 249, 241, 0.1)',
    backgroundColor: '#0A1E37',
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.2)',
  },
  drawerLogoutIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  drawerLogoutText: {
    color: '#FEB2B2',
    fontSize: 13,
    fontWeight: '600',
  },
});
