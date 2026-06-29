import React, { useState, useEffect } from 'react';
import { 
  Settings, MapPin, CheckCircle, Save, Loader2, AlertTriangle, Shield 
} from 'lucide-react';
import api from '../utils/api';

const AttendanceSettings = () => {
  const [settings, setSettings] = useState({
    isGeoFenceEnabled: false,
    latitude: 0,
    longitude: 0,
    allowedRadiusMeters: 50,
    isAutoCheckoutEnabled: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/settings');
      if (res) {
        setSettings({
          isGeoFenceEnabled: res.isGeoFenceEnabled || false,
          latitude: res.latitude || 0,
          longitude: res.longitude || 0,
          allowedRadiusMeters: res.allowedRadiusMeters || 50,
          isAutoCheckoutEnabled: res.isAutoCheckoutEnabled || false,
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await api.put('/attendance/settings', {
        isGeoFenceEnabled: settings.isGeoFenceEnabled,
        latitude: parseFloat(settings.latitude),
        longitude: parseFloat(settings.longitude),
        allowedRadiusMeters: parseInt(settings.allowedRadiusMeters, 10),
        isAutoCheckoutEnabled: settings.isAutoCheckoutEnabled,
      });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
      },
      (err) => {
        alert(`Failed to get location: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
            <Settings className="w-6 h-6 text-gold" />
            Attendance Settings
          </h1>
          <p className="text-slate text-sm">Configure geofencing and global attendance rules.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Geofence Settings */}
        <div className="bg-white rounded-3xl shadow-sm border border-border-cream overflow-hidden">
          <div className="p-6 border-b border-border-cream bg-cream/10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-display font-bold text-navy text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold" />
                  Geofence Security
                </h2>
                <p className="text-slate text-xs mt-1">Restrict check-ins to a specific physical location.</p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.isGeoFenceEnabled}
                  onChange={(e) => setSettings({...settings, isGeoFenceEnabled: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {settings.isGeoFenceEnabled && (
            <div className="p-6 space-y-6">
              
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3">
                <Shield className="w-5 h-5 shrink-0" />
                <p>
                  When enabled, employees can only check in if their GPS coordinates are within the specified radius of the allowed location.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={settings.latitude}
                    onChange={(e) => setSettings({...settings, latitude: e.target.value})}
                    className="w-full px-4 py-3 border border-border-cream rounded-xl focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={settings.longitude}
                    onChange={(e) => setSettings({...settings, longitude: e.target.value})}
                    className="w-full px-4 py-3 border border-border-cream rounded-xl focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={captureCurrentLocation}
                className="px-4 py-2 bg-cream text-navy font-bold rounded-lg hover:bg-cream/70 transition-colors text-sm border border-border-cream"
              >
                Use My Current Location
              </button>

              <div>
                <label className="block text-xs font-bold text-slate uppercase mb-1">Allowed Radius (Meters)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="10" 
                    max="1000" 
                    step="10"
                    value={settings.allowedRadiusMeters}
                    onChange={(e) => setSettings({...settings, allowedRadiusMeters: e.target.value})}
                    className="w-full md:w-1/2 accent-gold"
                  />
                  <span className="font-bold text-navy">{settings.allowedRadiusMeters} m</span>
                </div>
                <p className="text-[10px] text-slate mt-2">Recommended: 50m - 100m depending on GPS accuracy inside your building.</p>
              </div>
            </div>
          )}
        </div>

        {/* Global Rules */}
        <div className="bg-white rounded-3xl shadow-sm border border-border-cream overflow-hidden">
          <div className="p-6 border-b border-border-cream bg-cream/10 flex justify-between items-center">
            <div>
              <h2 className="font-display font-bold text-navy text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gold" />
                Auto-Checkout
              </h2>
              <p className="text-slate text-xs mt-1">Automatically check out employees who forget to clock out.</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.isAutoCheckoutEnabled}
                onChange={(e) => setSettings({...settings, isAutoCheckoutEnabled: e.target.checked})}
              />
              <div className="w-11 h-6 bg-slate/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          {settings.isAutoCheckoutEnabled && (
             <div className="p-6">
                <p className="text-sm text-slate">
                  The system will automatically run every 5 minutes and check out any employees based on their shift's configured <strong>Auto-Checkout Time</strong>. The record will be marked as "Missed Checkout" and managers will be notified.
                </p>
             </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-navy text-gold font-bold rounded-xl shadow-md hover:bg-navy-light transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Settings
          </button>
        </div>

      </form>
    </div>
  );
};

export default AttendanceSettings;
