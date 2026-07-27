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
import { Ionicons } from '@expo/vector-icons';

const DEMO_ACCOUNTS = [
  {
    label: 'Global Administrator (Super Admin)',
    email: 'SuperAdmin@hoteloraa.com',
    password: 'superadminsecret',
    role: 'SUPER_ADMIN',
    tenant: 'Hoteloraa System Node',
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

  // Forgot password flow states
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = request verification code, 2 = reset password
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    setApiBaseUrlState(getApiBaseUrl());
  }, [settingsVisible]);

  const handleForgotPasswordRequest = async () => {
    if (!forgotEmail || !forgotEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter your corporate email address.');
      return;
    }
    setForgotLoading(true);
    try {
      await api.forgotPassword(forgotEmail.trim());
      Alert.alert('Verification Sent', 'If this email is registered, we have sent a 8-character verification code.');
      setForgotStep(2);
    } catch (e) {
      Alert.alert('Request Failed', e.message || 'Could not request password reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetToken.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Please fill in all inputs.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'Passwords must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.resetPassword(resetToken.trim().toUpperCase(), newPassword, confirmPassword);
      Alert.alert('Success', res.message || 'Password updated successfully. Please log in.');
      setForgotVisible(false);
      // Reset form
      setForgotEmail('');
      setForgotStep(1);
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      Alert.alert('Reset Failed', e.message || 'Could not reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

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
              style={styles.forgotPasswordLink}
              onPress={() => {
                setForgotEmail(email); // autofill email from login input if present
                setForgotStep(1);
                setForgotVisible(true);
              }}
            >
              <Text style={styles.forgotPasswordLinkText}>Forgot Password?</Text>
            </TouchableOpacity>

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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="flash" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                <Text style={styles.demoTriggerText}>Quick Demo Accounts</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer controls */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.settingsBtn} 
              onPress={() => setSettingsVisible(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="settings-outline" size={14} color="#718096" style={{ marginRight: 6 }} />
                <Text style={styles.settingsBtnText}>Developer API Settings</Text>
              </View>
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

      {/* Forgot Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={forgotVisible}
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            
            {forgotStep === 1 ? (
              <View>
                <Text style={styles.modalDesc}>
                  Enter your registered corporate email address. We will email you a verification code to reset your password.
                </Text>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Corporate Email</Text>
                  <TextInput
                    style={styles.settingsInput}
                    placeholder="name@hoteloraa.com"
                    placeholderTextColor="#A0AEC0"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.modalBtnStacked, styles.modalBtnPrimary, { marginTop: 15 }, forgotLoading && { opacity: 0.7 }]} 
                  onPress={handleForgotPasswordRequest}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#0C2340" />
                  ) : (
                    <Text style={styles.modalBtnPriText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalBtnStacked, styles.modalBtnSecondary, { marginTop: 10 }]} 
                  onPress={() => setForgotStep(2)}
                >
                  <Text style={styles.modalBtnSecText}>Already Have a Code?</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.modalDesc}>
                  Enter the verification code sent to your email along with your new password.
                </Text>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <TextInput
                    style={styles.settingsInput}
                    placeholder="Enter Code"
                    placeholderTextColor="#A0AEC0"
                    value={resetToken}
                    onChangeText={setResetToken}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.settingsInput}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#A0AEC0"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.settingsInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#A0AEC0"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.modalBtnStacked, styles.modalBtnPrimary, { marginTop: 20 }, forgotLoading && { opacity: 0.7 }]} 
                  onPress={handleResetPasswordSubmit}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#0C2340" />
                  ) : (
                    <Text style={styles.modalBtnPriText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalBtnStacked, styles.modalBtnSecondary, { marginTop: 10 }]} 
                  onPress={() => setForgotStep(1)}
                >
                  <Text style={styles.modalBtnSecText}>Request New Code</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setForgotVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
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
  modalBtnStacked: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -5,
    paddingVertical: 5,
  },
  forgotPasswordLinkText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '600',
  },
});
