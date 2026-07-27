import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlaceholderScreen({ viewName, groupName, user, onLogout, onOpenDrawer }) {
  // Generate some high-fidelity mock info based on the selected view to keep the UI rich
  const getMockContent = () => {
    switch (viewName) {
      case 'attendance':
        return {
          metric: 'Checked In',
          metricLabel: 'Shift Status',
          subtitle: 'Today shift: 09:00 AM - 06:00 PM',
          details: 'You checked in today at 08:54 AM from the local Wi-Fi network.',
          icon: 'time-outline'
        };
      case 'reports':
        return {
          metric: '₹48,250',
          metricLabel: 'Projected Net Profit',
          subtitle: 'Gross revenue: ₹1,85,400 today',
          details: 'Detailed reporting dashboard is active on the web console. Log in to view full cash flows.',
          icon: 'trending-up-outline'
        };
      case 'rooms':
        return {
          metric: '18 / 24',
          metricLabel: 'Rooms Occupied',
          subtitle: '6 rooms dirty/housekeeping',
          details: 'Access check-in and room layouts on your desktop console.',
          icon: 'business-outline'
        };
      case 'reservations':
        return {
          metric: '4 Arrivals',
          metricLabel: 'Upcoming Today',
          subtitle: '12 reservations active this week',
          details: 'Manage customer bookings, calendar grids, and group reservations via the web app.',
          icon: 'calendar-outline'
        };
      case 'inventory':
        return {
          metric: '3 items low',
          metricLabel: 'Inventory Alerts',
          subtitle: 'Spices, Flour, Toiletries below threshold',
          details: 'Create purchase orders and request supplier quotes on the desktop console.',
          icon: 'cube-outline'
        };
      case 'users':
        return {
          metric: '14 Active',
          metricLabel: 'Staff Checked-In',
          subtitle: '2 on leave, 3 shifts open',
          details: 'Add new staff members, set payroll, and assign custom roles using the admin panel on web.',
          icon: 'people-outline'
        };
      case 'settings':
        return {
          metric: 'v1.0.0 (API v1)',
          metricLabel: 'Mobile App Settings',
          subtitle: 'Backend: Active & Connected',
          details: 'To configure security policies, email templates, and invoice formats, please use the web console.',
          icon: 'settings-outline'
        };
      default:
        return {
          metric: 'Web Portal',
          metricLabel: 'Desktop Native Module',
          subtitle: 'Feature accessible on desktop browser',
          details: 'This operational panel is optimized for widescreen monitors. Please log in on a desktop to manage.',
          icon: 'desktop-outline'
        };
    }
  };

  const content = getMockContent();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onOpenDrawer && (
            <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
              <Ionicons name="menu" size={28} color="#D4AF37" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{viewName.toUpperCase()}</Text>
            <Text style={styles.headerSubtitle}>{groupName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main visual gold card */}
        <View style={styles.card}>
          <Ionicons name={content.icon} size={64} color="#D4AF37" style={{ marginBottom: 12 }} />
          <Text style={styles.metricTitle}>{content.metricLabel}</Text>
          <Text style={styles.metricValue}>{content.metric}</Text>
          <Text style={styles.metricSubtitle}>{content.subtitle}</Text>
        </View>

        {/* Informational Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoHeading}>Operational Details</Text>
          <Text style={styles.infoText}>{content.details}</Text>
          
          <View style={styles.webNoticeContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="globe-outline" size={14} color="#3182CE" style={{ marginRight: 4 }} />
              <Text style={styles.webNoticeBadge}>DESKTOP WEB MODULE</Text>
            </View>
            <Text style={styles.webNoticeText}>
              For the full operational suite, billing templates, audits, and settings, log in to your Hoteloraa console from your PC or Mac web browser.
            </Text>
          </View>
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
    paddingTop: Platform.OS === 'android' ? 36 : 16,
    backgroundColor: '#0C2340',
    borderBottomWidth: 2,
    borderColor: '#D4AF37',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTextContainer: {
    flexDirection: 'column',
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
    padding: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#0C2340',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  largeIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  metricTitle: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    color: '#D4AF37',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  metricSubtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 20,
    width: '100%',
  },
  infoHeading: {
    color: '#0C2340',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoText: {
    color: '#4A5568',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  webNoticeContainer: {
    backgroundColor: '#FEF9F1',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
    padding: 12,
  },
  webNoticeBadge: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  webNoticeText: {
    color: '#718096',
    fontSize: 11,
    lineHeight: 15,
  },
});
