import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Clock,
  Globe,
  Monitor,
  KeyRound,
  Copy,
  AlertTriangle,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import './SecurityNotificationCenter.css';

/**
 * High-tech Security Alert Audio Chime using native Web Audio API
 */
export function playSecurityAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    // Pulse 1: Urgent high-tech alert tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Pulse 2: Secondary confirmation tone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.14); // B5
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.35); // E6
    gain2.gain.setValueAtTime(0.22, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.55);
  } catch (err) {
    // AudioContext autoplay restrictions or disabled
  }
}

/**
 * Format relative time (e.g., "Il y a 2 min", "À l'instant")
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 30) return "À l'instant (الآن)";
  if (diffSec < 60) return `Il y a ${diffSec}s (منذ ${diffSec} ثانية)`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min (منذ ${diffMin} دقيقة)`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h (منذ ${diffHours} ساعة)`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''} (منذ ${diffDays} أيام)`;
}

export default function SecurityNotificationCenter({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onRefresh,
  isLoading = false,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'high'
  const [copiedIp, setCopiedIp] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setConfirmClear(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopyIp = (ip, e) => {
    e.stopPropagation();
    if (!ip) return;
    navigator.clipboard?.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === 'unread') return !item.isRead;
      if (filter === 'high') return item.severity === 'HIGH' || item.severity === 'CRITICAL';
      return true;
    });
  }, [notifications, filter]);

  if (!isOpen) return null;

  return (
    <div className="security-center-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="security-center-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="security-drawer-glow" />

        {/* 1. Header */}
        <div className="security-center-header">
          <div className="security-header-info">
            <div className="security-header-icon-wrap">
              <ShieldAlert size={22} className="security-header-icon" />
              {unreadCount > 0 && <span className="security-header-ping" />}
            </div>
            <div>
              <div className="security-header-title-row">
                <h2 className="security-header-title">TechnoTech Security</h2>
                <span className="security-status-pill">Surveillance Active</span>
              </div>
              <p className="security-header-subtitle">
                Alertes de sécurité et tentatives d'accès non autorisées (رصد المحاولات)
              </p>
            </div>
          </div>

          <button
            type="button"
            className="security-close-btn"
            onClick={onClose}
            aria-label="Fermer le centre de sécurité"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Controls & Filter Bar */}
        <div className="security-filter-bar">
          <div className="security-tabs-group">
            <button
              type="button"
              className={`security-tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span>Toutes</span>
              <span className="security-tab-badge">{notifications.length}</span>
            </button>
            <button
              type="button"
              className={`security-tab-btn ${filter === 'unread' ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
              onClick={() => setFilter('unread')}
            >
              <span>Non lues</span>
              {unreadCount > 0 && (
                <span className="security-tab-badge unread-badge">{unreadCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`security-tab-btn ${filter === 'high' ? 'active' : ''}`}
              onClick={() => setFilter('high')}
            >
              <span>Haute Priorité 🚨</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="security-actions-row">
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                type="button"
                className="security-action-btn"
                onClick={onMarkAllAsRead}
                title="Tout marquer comme lu"
              >
                <CheckCheck size={14} />
                <span>Tout marquer comme lu</span>
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                className={`security-action-btn ${isLoading ? 'is-loading' : ''}`}
                onClick={onRefresh}
                title="Actualiser"
              >
                <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
              </button>
            )}

            {notifications.length > 0 && onClearAll && (
              confirmClear ? (
                <div className="security-confirm-clear-wrap">
                  <span className="confirm-text">Confirmer ?</span>
                  <button
                    type="button"
                    className="security-action-btn danger-confirm"
                    onClick={() => {
                      onClearAll();
                      setConfirmClear(false);
                    }}
                  >
                    Oui, effacer
                  </button>
                  <button
                    type="button"
                    className="security-action-btn cancel-btn"
                    onClick={() => setConfirmClear(false)}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="security-action-btn danger-btn"
                  onClick={() => setConfirmClear(true)}
                  title="Vider l'historique"
                >
                  <Trash2 size={14} />
                  <span>Vider</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* 3. Notifications List Body */}
        <div className="security-list-container">
          {filteredNotifications.length === 0 ? (
            <div className="security-empty-state">
              <div className="security-empty-icon-wrap">
                <ShieldCheck size={44} className="security-empty-icon" />
              </div>
              <h3 className="security-empty-title">
                {filter === 'unread'
                  ? 'Toutes les alertes sont traitées'
                  : 'Console d’administration sécurisée'}
              </h3>
              <p className="security-empty-desc">
                {filter === 'unread'
                  ? 'Aucun nouvel avertissement en attente. Tout est en ordre.'
                  : 'Aucune tentative d’intrusion non autorisée enregistrée. Le système protège activement votre boutique en temps réel.'}
              </p>
              <div className="security-empty-badge">
                <span className="security-pulse-green" />
                <span>Protection TechnoTech Active (24/7)</span>
              </div>
            </div>
          ) : (
            <div className="security-cards-stream">
              {filteredNotifications.map((notif) => {
                const isUnread = !notif.isRead;
                const flag = notif.location?.flag || '🌐';
                const city = notif.location?.city || '';
                const country = notif.location?.country || '';
                const locationLabel = city && country ? `${city}, ${country}` : country || city || 'Localisation inconnue';
                const device = notif.deviceInfo?.device || 'Appareil';
                const os = notif.deviceInfo?.os || '';
                const browser = notif.deviceInfo?.browser || '';
                const deviceSummary = [device, os, browser].filter(Boolean).join(' • ');

                return (
                  <div
                    key={notif._id}
                    className={`security-card ${isUnread ? 'is-unread' : 'is-read'} ${notif.severity === 'CRITICAL' ? 'is-critical' : ''}`}
                  >
                    {/* Card Top Row */}
                    <div className="security-card-top">
                      <div className="security-card-badge-wrap">
                        <span className="security-alert-pill">
                          <span className="security-alert-dot" />
                          <span>TENTATIVE NON AUTORISÉE</span>
                        </span>
                        {isUnread && (
                          <span className="security-new-pill">NOUVEAU</span>
                        )}
                      </div>

                      <div className="security-card-time" title={notif.createdAt}>
                        <Clock size={12} />
                        <span>{formatRelativeTime(notif.createdAt)}</span>
                      </div>
                    </div>

                    {/* Card Title & Headline */}
                    <div className="security-card-headline">
                      <h4 className="security-card-title">
                        Tentative d'accès à la console d'administration 🚨
                      </h4>
                      <span className="security-card-ar-title">
                        محاولة دخول غير مصرح بها إلى لوحة الإدارة
                      </span>
                    </div>

                    {/* Meta Grid Details */}
                    <div className="security-meta-grid">
                      {/* IP Address */}
                      <div className="security-meta-item">
                        <span className="security-meta-label">
                          <Globe size={13} />
                          <span>Adresse IP :</span>
                        </span>
                        <div className="security-ip-box">
                          <code>{notif.ip || 'Inconnue'}</code>
                          {notif.ip && (
                            <button
                              type="button"
                              className="security-copy-ip-btn"
                              onClick={(e) => handleCopyIp(notif.ip, e)}
                              title="Copier l'IP"
                            >
                              {copiedIp === notif.ip ? (
                                <Check size={12} color="#10b981" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="security-meta-item">
                        <span className="security-meta-label">
                          <span>{flag}</span>
                          <span>Emplacement :</span>
                        </span>
                        <span className="security-meta-value location-text" title={locationLabel}>
                          {locationLabel}
                        </span>
                      </div>

                      {/* Device & Browser */}
                      <div className="security-meta-item full-width">
                        <span className="security-meta-label">
                          <Monitor size={13} />
                          <span>Appareil & Navigateur :</span>
                        </span>
                        <span className="security-meta-value device-text" title={notif.userAgent}>
                          {deviceSummary || notif.userAgent || 'Navigateur'}
                        </span>
                      </div>

                      {/* Attempted Code (Masked) */}
                      <div className="security-meta-item">
                        <span className="security-meta-label">
                          <KeyRound size={13} />
                          <span>Code testé :</span>
                        </span>
                        <span className="security-masked-code">
                          {notif.attemptedCode || '******'}
                        </span>
                      </div>

                      {/* Exact Date & Time */}
                      <div className="security-meta-item">
                        <span className="security-meta-label">
                          <Clock size={13} />
                          <span>Date exacte :</span>
                        </span>
                        <span className="security-meta-value">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="security-card-footer">
                      {isUnread && onMarkAsRead && (
                        <button
                          type="button"
                          className="security-card-btn mark-read"
                          onClick={() => onMarkAsRead(notif._id)}
                        >
                          <Check size={14} />
                          <span>Marquer comme lu (تحديد كمقروء)</span>
                        </button>
                      )}

                      {onDeleteNotification && (
                        <button
                          type="button"
                          className="security-card-btn delete-btn"
                          onClick={() => onDeleteNotification(notif._id)}
                          title="Supprimer cette alerte"
                        >
                          <Trash2 size={14} />
                          <span>Supprimer (حذف)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Footer Summary */}
        <div className="security-center-footer">
          <div className="security-footer-legend">
            <span className="security-legend-dot" />
            <span>Surveillance instantanée active • TechnoTech CyberShield v2.4</span>
          </div>
          <button
            type="button"
            className="security-footer-close-btn"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
