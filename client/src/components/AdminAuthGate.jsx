import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  ArrowLeft,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  DEFAULT_ADMIN_TOTP_SECRET,
  verifyTOTP
} from '../utils/totp.js';
import { securityService } from '../services/securityService.js';

/**
 * AdminAuthGate - Secure Passcode Verification Screen
 * Features 2-strike IP-based 5-minute lockout and automatic eviction.
 */
export default function AdminAuthGate({ onSuccess, onCancel, onLockout }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const inputRefs = useRef([]);
  const secretKey = DEFAULT_ADMIN_TOTP_SECRET;

  // Check IP lockout status on mount
  useEffect(() => {
    let isMounted = true;
    const checkBanStatus = async () => {
      try {
        const response = await fetch('/api/technotech/admin/check-ban');
        if (response.ok || response.status === 429) {
          const data = await response.json();
          if (isMounted && data.banned) {
            setIsLockedOut(true);
            setRemainingSeconds(data.remainingSeconds || 300);
            setError(`Accès verrouillé pour votre adresse IP suite à 2 tentatives échouées.`);
            // Automatically kick out after 1.5 seconds
            setTimeout(() => {
              if (onLockout) {
                onLockout(data.remainingSeconds || 300);
              } else if (onCancel) {
                onCancel();
              }
            }, 1500);
          }
        }
      } catch (e) {
        // Fallback or offline check
      }
    };

    checkBanStatus();

    // Auto-focus first input if not locked out
    if (inputRefs.current[0] && !isLockedOut) {
      inputRefs.current[0].focus();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown timer when locked out
  useEffect(() => {
    if (!isLockedOut || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsLockedOut(false);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut, remainingSeconds]);

  const formatRemainingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    if (isLockedOut) return;

    // Clean input to only take the last digit entered
    const numericValue = value.replace(/\D/g, '');
    const char = numericValue.slice(-1);

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    if (error) setError(null);

    // Auto-advance to next input if filled
    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // If all 6 digits are filled, automatically attempt verification
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      triggerVerification(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (isLockedOut) return;

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (isLockedOut) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    if (error) setError(null);

    if (pastedData.length === 6) {
      triggerVerification(pastedData);
      inputRefs.current[5]?.focus();
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const triggerVerification = async (codeToVerify) => {
    if (isVerifying || isLockedOut) return;
    setIsVerifying(true);
    setError(null);

    try {
      // First attempt server-side verification via reverse proxy (enforces IP tracking)
      let verified = false;
      let serverResponseData = null;

      try {
        const response = await fetch('/api/technotech/admin/verify-totp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeToVerify })
        });
        serverResponseData = await response.json().catch(() => ({}));

        if (response.ok && serverResponseData.success) {
          verified = true;
        }
      } catch (networkErr) {
        // Server offline or proxy unavailable, fallback to Web Crypto verification
      }

      // If server verification didn't succeed and no explicit ban was returned
      if (!verified && (!serverResponseData || !serverResponseData.banned)) {
        verified = await verifyTOTP(codeToVerify, secretKey);
      }

      if (verified) {
        setFailedAttempts(0);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Log unauthorized attempt to notification center
        securityService.logAttempt({ attemptedCode: codeToVerify }).catch(() => {});

        const isBanned = serverResponseData?.banned || (failedAttempts + 1 >= 2);
        const lockSeconds = serverResponseData?.remainingSeconds || 300;

        if (isBanned) {
          // 🚨 Strike 2: Lock out IP for 5 minutes and kick user out
          setIsLockedOut(true);
          setRemainingSeconds(lockSeconds);
          setFailedAttempts(2);
          setError(`2 tentatives incorrectes consécutives. Votre adresse IP est bloquée pendant 5 minutes.`);
          setIsShaking(true);
          setDigits(['', '', '', '', '', '']);

          // Evict from /admin after 1.5 seconds
          setTimeout(() => {
            if (onLockout) {
              onLockout(lockSeconds);
            } else if (onCancel) {
              onCancel();
            }
          }, 1500);
        } else {
          // Strike 1: Warning
          setFailedAttempts(1);
          setError(`Code d'accès incorrect. Attention : 1 seule tentative restante avant blocage de 5 minutes !`);
          setIsShaking(true);
          setDigits(['', '', '', '', '', '']);
          setTimeout(() => {
            setIsShaking(false);
            inputRefs.current[0]?.focus();
          }, 600);
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Erreur lors de la vérification. Veuillez réessayer.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLockedOut) return;

    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez saisir les 6 chiffres de votre code d\'accès.');
      return;
    }
    triggerVerification(fullCode);
  };

  return (
    <div className="admin-auth-container">
      {/* Background ambient lighting */}
      <div className="admin-auth-glow-orb" aria-hidden="true" />

      <div className={`admin-auth-card ${isShaking ? 'auth-card-shake' : ''} ${isLockedOut ? 'auth-card-locked' : ''}`}>
        {/* Brand header */}
        <div className="admin-auth-brand">
          <div className="admin-auth-logo-wrap">
            <img
              src="/images/technotech-logo-v2.png?v=20260922"
              alt="TechnoTech"
              className="admin-auth-logo-img"
            />
            <div className="admin-auth-logo-glow" />
          </div>
          <span className="brand-name">
            <span className="brand-techno">Techno</span><span className="brand-tech">Tech</span>
          </span>
        </div>

        {/* Header Titles */}
        <div className="admin-auth-header-text">
          <div className={`admin-auth-shield-badge ${isLockedOut ? 'badge-danger' : ''}`}>
            {isLockedOut ? (
              <ShieldAlert size={14} className="shield-icon" />
            ) : (
              <Lock size={14} className="shield-icon" />
            )}
            <span>{isLockedOut ? 'Accès Bloqué (IP)' : 'Portail d\'Administration'}</span>
          </div>
          <h1 className="admin-auth-title">
            {isLockedOut ? 'Accès Verrouillé' : 'Accès Sécurisé'}
          </h1>
          <p className="admin-auth-subtitle">
            {isLockedOut
              ? 'Votre adresse IP a été bloquée pendant 5 minutes suite à 2 tentatives consécutives échouées.'
              : 'Veuillez saisir votre code d\'accès confidentiel pour accéder à la console de gestion.'}
          </p>
        </div>

        {/* Lockout Countdown Card */}
        {isLockedOut ? (
          <div className="admin-lockout-card">
            <div className="admin-lockout-timer">
              <Clock size={20} className="timer-icon" />
              <span className="timer-digits">{formatRemainingTime(remainingSeconds)}</span>
            </div>
            <p className="admin-lockout-notice">
              Redirection immédiate en cours pour des raisons de sécurité...
            </p>
          </div>
        ) : (
          /* 6-Digit PIN Form */
          <form onSubmit={handleSubmit} className="admin-auth-form">
            <div className="admin-auth-input-group">
              <div className="admin-auth-label-row">
                <label className="admin-auth-label">
                  <Lock size={14} />
                  <span>Code d'accès confidentiel (6 chiffres)</span>
                </label>
                {failedAttempts > 0 && (
                  <span className="admin-attempt-warning">
                    Tentative {failedAttempts}/2
                  </span>
                )}
              </div>

              {/* 6 Individual PIN Boxes */}
              <div className="admin-totp-inputs-row" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`admin-totp-digit-box ${error ? 'box-error' : ''} ${digit ? 'box-filled' : ''}`}
                    disabled={isVerifying || isLockedOut}
                    autoComplete="off"
                    aria-label={`Chiffre ${idx + 1}`}
                  />
                ))}
              </div>

              {error && (
                <div className="admin-auth-error-msg" role="alert">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="admin-auth-submit-btn"
              id="admin-unlock-btn"
              disabled={isVerifying || digits.join('').length !== 6 || isLockedOut}
            >
              {isVerifying ? (
                <>
                  <RefreshCw size={18} className="spin-icon" />
                  <span>Vérification en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Déverrouiller l'accès</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer link to go back */}
        <div className="admin-auth-footer">
          <button
            type="button"
            className="admin-auth-back-btn"
            onClick={onCancel}
          >
            <ArrowLeft size={15} />
            <span>Retour à la boutique</span>
          </button>
        </div>
      </div>
    </div>
  );
}
