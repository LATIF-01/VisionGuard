/**
 * Dashboard Page - Live Camera Feed View
 *
 * VIDEO FILE PLACEMENT INSTRUCTIONS:
 * ----------------------------------
 * Place your video files in the following location:
 *   frontend/public/videos/
 *
 * Required files:
 *   - cam1.mp4 (Main Entrance feed)
 *   - cam2.mp4 (Parking Lot feed)
 *   - cam3.mp4 (Hallway A feed)
 *   - cam4.mp4 (Server Room feed)
 *
 * MP4 is only a container — use H.264 (AVC) + AAC inside for reliable browser playback.
 * Re-encode with: bash scripts/encode_dashboard_videos.sh (needs ffmpeg)
 *
 * After placing the files, they will be accessible at:
 *   /videos/cam1.mp4, /videos/cam2.mp4, etc.
 */

import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/useI18n';

const feedDefs = [
  { id: 1, name: 'CAM 01', locKey: 'dashboard.cam01.loc', src: '/videos/cam1.mp4', status: 'live' },
  { id: 2, name: 'CAM 02', locKey: 'dashboard.cam02.loc', src: '/videos/cam2.mp4', status: 'live' },
  { id: 3, name: 'CAM 03', locKey: 'dashboard.cam03.loc', src: '/videos/cam3.mp4', status: 'live' },
  { id: 4, name: 'CAM 04', locKey: 'dashboard.cam04.loc', src: '/videos/cam4.mp4', status: 'live' },
];

export default function Dashboard() {
  const { t } = useI18n();

  const cameraFeeds = useMemo(
    () => feedDefs.map((c) => ({ ...c, location: t(c.locKey) })),
    [t]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
          <p className="text-vg-text-muted mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-vg-success/20 text-vg-success">
            <div className="w-2 h-2 rounded-full bg-vg-success animate-pulse" />
            <span>{t('dashboard.camerasOnline', { count: String(cameraFeeds.length) })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {cameraFeeds.map((camera) => (
          <CameraPanel key={camera.id} camera={camera} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('dashboard.activeCameras')} value="4" icon="📹" />
        <StatCard label={t('dashboard.eventsToday')} value="127" icon="⚡" />
        <StatCard label={t('dashboard.alerts')} value="3" icon="🔔" />
        <StatCard label={t('dashboard.recordings')} value="24h" icon="💾" />
      </div>
    </div>
  );
}

function CameraPanel({ camera }) {
  const { t } = useI18n();
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="card overflow-hidden group">
      <div className="relative aspect-video bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className={`w-full h-full object-cover ${videoError ? 'invisible' : ''}`}
          onError={() => setVideoError(true)}
        >
          <source src={camera.src} type="video/mp4" />
          {t('dashboard.videoNotSupported')}
        </video>
        {videoError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <span className="text-white/50 text-sm tracking-wide">{t('dashboard.noSignal')}</span>
          </div>
        )}

        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{camera.name}</span>
              <span className="text-vg-text-muted text-xs">— {camera.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-medium uppercase">{t('dashboard.live')}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center justify-between text-xs text-vg-text-muted">
            <span>{new Date().toLocaleDateString()}</span>
            <span className="font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button type="button" className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </button>
          <button type="button" className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-vg-text-muted text-sm">{label}</p>
      </div>
    </div>
  );
}
