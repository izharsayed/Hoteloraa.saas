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
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

export default function CRMScreen({ user, onLogout, onOpenDrawer }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGuests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/guests');
      setGuests(data || []);
    } catch (e) {
      console.warn(e);
      setError('Failed to fetch guest registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const getGuestTier = (stays) => {
    if (stays >= 15) return 'Diamond';
    if (stays >= 8) return 'Platinum';
    if (stays >= 3) return 'Gold';
    return 'Silver';
  };

  const getGuestTierStyle = (tier) => {
    switch (tier) {
      case 'Diamond': return styles.tierDiamond;
      case 'Platinum': return styles.tierPlatinum;
      case 'Gold': return styles.tierGold;
      default: return styles.tierSilver;
    }
  };

  const getGuestTierTextStyle = (tier) => {
    switch (tier) {
      case 'Diamond': return styles.tierTextDiamond;
      case 'Platinum': return styles.tierTextPlatinum;
      case 'Gold': return styles.tierTextGold;
      default: return styles.tierTextSilver;
    }
  };

  const getGuestPoints = (spent) => {
    return Math.round((spent || 0) * 0.1);
  };

  const diamondCount = guests.filter(g => getGuestTier(g.totalStays) === 'Diamond').length;
  const platinumCount = guests.filter(g => getGuestTier(g.totalStays) === 'Platinum').length;
  const goldCount = guests.filter(g => getGuestTier(g.totalStays) === 'Gold').length;
  const silverCount = guests.filter(g => getGuestTier(g.totalStays) === 'Silver').length;

  const filteredGuests = guests.filter(g => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.phone?.includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.city?.toLowerCase().includes(q)
    );
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
            <Text style={styles.headerTitle}>CRM & Guests</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Directory</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Block */}
        <View style={styles.titleSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleHeading}>CRM & Guest Management</Text>
              <Text style={styles.titleSubheading}>Manage guest database, review histories, and check loyalty tiers</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchGuests} disabled={loading}>
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loyalty Tiers Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tiersContainer}>
          <View style={[styles.tierCard, { borderLeftColor: '#0C2340', borderLeftWidth: 4 }]}>
            <Text style={styles.tierName}>DIAMOND MEMBER</Text>
            <View style={styles.tierBottom}>
              <Text style={styles.tierCount}>{diamondCount}</Text>
              <Text style={styles.tierIcon}>🎖️</Text>
            </View>
          </View>

          <View style={[styles.tierCard, { borderLeftColor: '#D4AF37', borderLeftWidth: 4 }]}>
            <Text style={styles.tierName}>PLATINUM MEMBER</Text>
            <View style={styles.tierBottom}>
              <Text style={styles.tierCount}>{platinumCount}</Text>
              <Text style={styles.tierIcon}>🏅</Text>
            </View>
          </View>

          <View style={[styles.tierCard, { borderLeftColor: '#B5A642', borderLeftWidth: 4 }]}>
            <Text style={styles.tierName}>GOLD MEMBER</Text>
            <View style={styles.tierBottom}>
              <Text style={styles.tierCount}>{goldCount}</Text>
              <Text style={styles.tierIcon}>🎖️</Text>
            </View>
          </View>

          <View style={[styles.tierCard, { borderLeftColor: '#A0AEC0', borderLeftWidth: 4 }]}>
            <Text style={styles.tierName}>SILVER MEMBER</Text>
            <View style={styles.tierBottom}>
              <Text style={styles.tierCount}>{silverCount}</Text>
              <Text style={styles.tierIcon}>🥈</Text>
            </View>
          </View>
        </ScrollView>

        {/* Directory Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>VIP Guest Directory</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search guests by name, phone, email..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Updating loyalty metrics...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : filteredGuests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No matching guests found.</Text>
            </View>
          ) : (
            filteredGuests.map((g) => {
              const tier = getGuestTier(g.totalStays);
              return (
                <View key={g.id} style={styles.guestCard}>
                  <View style={styles.guestHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guestName}>{g.name}</Text>
                      {g.city ? (
                        <Text style={styles.guestCity}>📍 {g.city}, {g.country || 'India'}</Text>
                      ) : null}
                    </View>
                    
                    {/* Tier badge */}
                    <View style={[styles.tierBadge, getGuestTierStyle(tier)]}>
                      <Text style={[styles.tierBadgeText, getGuestTierTextStyle(tier)]}>
                        ★ {tier.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.guestDivider} />

                  {/* Contact details */}
                  <View style={styles.metaRow}>
                    {g.email ? <Text style={styles.metaLabel}>✉️ {g.email}</Text> : null}
                    {g.phone ? <Text style={styles.metaLabel}>📞 {g.phone}</Text> : null}
                  </View>

                  {/* Stays & Points */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statSubLabel}>VISITS / STAYS</Text>
                      <Text style={styles.statVal}>{g.totalStays} stay(s)</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statSubLabel}>LOYALTY POINTS</Text>
                      <Text style={styles.statVal}>{getGuestPoints(g.totalSpent).toLocaleString()} pts</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statSubLabel}>GUEST ID</Text>
                      <Text style={styles.statValId}>{g.id.slice(0, 8)}...</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
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
  tiersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tierCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 12,
    width: 140,
    height: 85,
    marginRight: 10,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  tierName: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.5,
  },
  tierBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tierCount: {
    fontSize: 22,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#0C2340',
  },
  tierIcon: {
    fontSize: 20,
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
    marginBottom: 12,
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
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  guestName: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  guestCity: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tierDiamond: { backgroundColor: '#0C2340', borderWidth: 0.5, borderColor: '#D4AF37' },
  tierPlatinum: { backgroundColor: '#FEF3C7' },
  tierGold: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 0.5, borderColor: 'rgba(212, 175, 55, 0.3)' },
  tierSilver: { backgroundColor: '#F3F4F6' },
  
  tierBadgeText: { fontSize: 8, fontWeight: 'bold' },
  tierTextDiamond: { color: '#D4AF37' },
  tierTextPlatinum: { color: '#B45309' },
  tierTextGold: { color: '#D4AF37' },
  tierTextSilver: { color: '#4B5563' },

  guestDivider: {
    height: 0.5,
    backgroundColor: '#FEF9F1',
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 10.5,
    color: '#4A5568',
    marginRight: 15,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FEF9F1',
    borderRadius: 8,
    padding: 8,
  },
  statCol: {
    flex: 1,
  },
  statSubLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#A0AEC0',
    letterSpacing: 0.3,
  },
  statVal: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 2,
  },
  statValId: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#A0AEC0',
    marginTop: 2,
  },
});
