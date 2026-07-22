import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { api, getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl } from '../api';

const DEMO_ACCOUNTS = [
  {
    label: 'Global Administrator (Super Admin)',
    email: 'SuperAdmin@hoteloraa.com',
    password: 'superadminsecret',
    role: 'SUPER_ADMIN',
    tenant: 'Hoteloraa System Node',
  },
  {
    label: 'Royal Palace Admin (Manager)',
    email: 'faisal@royalpalace.com',
    password: 'password123',
    role: 'MANAGER',
    tenant: 'Royal Palace Hotel',
  },
  {
    label: 'Quresh Manager (Manager - qureshi)',
    email: 'manager@gmail.com',
    password: 'password123',
    role: 'MANAGER',
    tenant: 'qureshi',
  },
  {
    label: 'Sunita Devi (Housekeeping)',
    email: 'sunita@royalpalace.com',
    password: 'password123',
    role: 'HOUSEKEEPING',
    tenant: 'Royal Palace Hotel',
  },
  {
    label: 'Ravi Verma (Captain/Waitet)',
    email: 'ravi@royalpalace.com',
    password: 'password123',
    role: 'CAPTAIN',
    tenant: 'Royal Palace Hotel',
  },
  {
    label: 'Mustkim (Cashier)',
    email: 'mustkim@caferoma.com',
    password: 'password123',
    role: 'CASHIER',
    tenant: 'Cafe Aroma',
  },
];

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // API settings modal
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());

  // Demo accounts modal
  const [demoVisible, setDemoVisible] = useState(false);

  useEffect(() => {
    setApiBaseUrlState(getApiBaseUrl());
  }, [settingsVisible]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(email.trim(), password);
      onLoginSuccess(data.user);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Check your credentials or API connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setApiBaseUrl(apiBaseUrl);
      setSettingsVisible(false);
      Alert.alert('Success', `API Base URL updated to:\n${apiBaseUrl}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to save API URL.');
    }
  };

  const handleResetSettings = async () => {
    await resetApiBaseUrl();
    setApiBaseUrlState(getApiBaseUrl());
    Alert.alert('Reset', 'API Base URL reset to default local server.');
  };

  const selectDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setDemoVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header Branding */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>H</Text>
            </View>
            <Text style={styles.appName}>HOTELORAA</Text>
            <Text style={styles.appSubtitle}>Luxury Property Management Suite</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Sign In</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="enter your corporate email"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#A0AEC0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0C2340" />
              ) : (
                <Text style={styles.loginBtnText}>Log In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.demoTrigger} 
              onPress={() => setDemoVisible(true)}
            >
              <Text style={styles.demoTriggerText}>⚡ Quick Demo Accounts</Text>
            </TouchableOpacity>
          </View>

          {/* Footer controls */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.settingsBtn} 
              onPress={() => setSettingsVisible(true)}
            >
              <Text style={styles.settingsBtnText}>⚙️ Developer API Settings</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>v1.0.0 (Expo Go Edition)</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>API Server Settings</Text>
            <Text style={styles.modalDesc}>
              Set the backend API endpoint. For physical phones using Expo Go, use your computer's local IP address instead of localhost.
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>API Base URL</Text>
              <TextInput
                style={styles.settingsInput}
                placeholder="http://192.168.1.XX:5000/api/v1"
                placeholderTextColor="#A0AEC0"
                value={apiBaseUrl}
                onChangeText={setApiBaseUrlState}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSecondary]} 
                onPress={handleResetSettings}
              >
                <Text style={styles.modalBtnSecText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnPrimary]} 
                onPress={handleSaveSettings}
              >
                <Text style={styles.modalBtnPriText}>Save</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setSettingsVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Demo Accounts Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={demoVisible}
        onRequestClose={() => setDemoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Select Demo Account</Text>
            <Text style={styles.modalDesc}>Tap a role below to pre-fill credentials for testing:</Text>

            <ScrollView style={styles.demoScroll}>
              {DEMO_ACCOUNTS.map((acc, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.demoAccountItem}
                  onPress={() => selectDemoAccount(acc)}
                >
                  <View style={styles.demoHeader}>
                    <Text style={styles.demoRole}>{acc.role}</Text>
                    <Text style={styles.demoTenant}>{acc.tenant}</Text>
                  </View>
                  <Text style={styles.demoName}>{acc.label}</Text>
                  <Text style={styles.demoEmail}>{acc.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalCloseBtn, { marginTop: 15 }]} 
              onPress={() => setDemoVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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
    backgroundColor: '#FEF9F1', // Elegant cream background
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0C2340', // Deep Navy
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37', // Gold
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logoBadgeText: {
    color: '#D4AF37',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0C2340',
    letterSpacing: 4,
    marginTop: 15,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'sans-serif-medium',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 5,
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EBE5DA',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0C2340',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2933',
  },
  loginBtn: {
    backgroundColor: '#D4AF37', // Gold primary button
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#0C2340',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  demoTrigger: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  demoTriggerText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  settingsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  settingsBtnText: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 35, 64, 0.45)', // Tinted navy overlay
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#EBE5DA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
    marginBottom: 20,
  },
  settingsInput: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2933',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: '#D4AF37',
  },
  modalBtnSecondary: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
  },
  modalBtnPriText: {
    color: '#0C2340',
    fontWeight: 'bold',
  },
  modalBtnSecText: {
    color: '#718096',
    fontWeight: '600',
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  modalCloseText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '500',
  },
  demoScroll: {
    marginTop: 10,
  },
  demoAccountItem: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  demoRole: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0C2340',
    backgroundColor: '#EBE5DA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  demoTenant: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '500',
  },
  demoName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2933',
  },
  demoEmail: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
});
