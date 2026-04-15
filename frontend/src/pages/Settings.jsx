import { useEffect, useState, useCallback } from 'react';
import { useAuthedApi } from '../lib/api';

export default function Settings() {
  const [pref, setPref] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const apiFetch = useAuthedApi();

  const loadPrefs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/me/notifications');
      setPref(data);
    } catch {
      setError('Could not load notification settings. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  async function handleToggle() {
    if (!pref || saving) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await apiFetch('/me/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ email_alerts_enabled: !pref.email_alerts_enabled }),
      });
      setPref(updated);
      setSuccessMsg(
        updated.email_alerts_enabled
          ? 'Email alerts enabled — you will receive notifications.'
          : 'Email alerts disabled — you will no longer receive email notifications.'
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-vg-text-muted mt-1">Manage your notification preferences</p>
      </div>

      {/* Notifications card */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-vg-accent/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-vg-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Email Notifications</h2>
            <p className="text-vg-text-muted text-sm">
              Receive email alerts when the system detects suspicious activity
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-vg-critical/40 bg-vg-critical/10 px-4 py-3 text-sm text-vg-critical">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg border border-vg-success/40 bg-vg-success/10 px-4 py-3 text-sm text-vg-success">
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-vg-accent/30 border-t-vg-accent rounded-full animate-spin" />
            <span className="text-vg-text-muted text-sm">Loading preferences…</span>
          </div>
        ) : pref ? (
          <div className="space-y-5">
            {/* Toggle row */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${pref.email_alerts_enabled ? 'bg-vg-success animate-pulse' : 'bg-white/20'}`} />
                <div>
                  <p className="text-white font-medium">
                    {pref.email_alerts_enabled ? 'Alerts enabled' : 'Alerts disabled'}
                  </p>
                  <p className="text-vg-text-muted text-sm mt-0.5">
                    Sending to <span className="text-white/80">{pref.email}</span>
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={pref.email_alerts_enabled}
                disabled={saving}
                onClick={handleToggle}
                className={`
                  relative w-12 h-7 rounded-full transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-vg-accent/50 focus:ring-offset-2 focus:ring-offset-vg-dark
                  ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                  ${pref.email_alerts_enabled ? 'bg-vg-accent' : 'bg-white/20'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md
                    transition-transform duration-200
                    ${pref.email_alerts_enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Info note */}
            <p className="text-vg-text-muted text-xs leading-relaxed">
              When enabled, you'll receive an email each time the VisionGuard pipeline
              detects an event that matches your configured alert rules (e.g. violent
              behavior, high-confidence actions). You can turn this off at any time.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
