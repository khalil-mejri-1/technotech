import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import {
  DEFAULT_ADMIN_TOTP_SECRET,
  verifyTOTP
} from '../utils/totp.js';

/**
 * AdminAuthGate - 2FA Google Authenticator Verification Screen
 * Protects /admin with standard RFC 6238 Time-based One-Time Password (TOTP).
 */
export default function AdminAuthGate({ onSuccess, onCancel }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  const inputRefs = useRef([]);
  const secretKey = DEFAULT_ADMIN_TOTP_SECRET;

  useEffect(() => {
    // Auto-focus the first digit input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
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
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // Move to previous input on backspace if current is empty
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
    if (isVerifying) return;
    setIsVerifying(true);
    setError(null);

    try {
      // First attempt server-side verification via reverse proxy
      let verified = false;
      try {
        const response = await fetch('/api/technotech/admin/verify-totp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeToVerify })
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            verified = true;
          }
        }
      } catch (networkErr) {
        // Server offline or proxy unavailable, fallback to Web Crypto verification
      }

      // If server verification didn't succeed, verify with native Web Crypto API
      if (!verified) {
        verified = await verifyTOTP(codeToVerify, secretKey);
      }

      if (verified) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError('Code Google Authenticator invalide ou expiré. Veuillez vérifier l\'heure de votre téléphone.');
        setIsShaking(true);
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          setIsShaking(false);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    } catch (err) {
      console.error('TOTP verification error:', err);
      setError('Erreur lors de la vérification. Veuillez réessayer.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez saisir les 6 chiffres du code Google Authenticator.');
      return;
    }
    triggerVerification(fullCode);
  };

  return (
    <div className="admin-auth-container">
      {/* Background ambient lighting */}
      <div className="admin-auth-glow-orb" aria-hidden="true" />

      <div className={`admin-auth-card ${isShaking ? 'auth-card-shake' : ''}`}>
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
          <div className="admin-auth-shield-badge">
            <ShieldCheck size={15} className="shield-icon" />
            <span>Google Authenticator 2FA</span>
          </div>
          <h1 className="admin-auth-title">Vérification 2FA</h1>
          <p className="admin-auth-subtitle">
            Entrez le code à 6 chiffres généré par votre application Google Authenticator.
          </p>
        </div>

        {/* 6-Digit PIN Form */}
        <form onSubmit={handleSubmit} className="admin-auth-form">
          <div className="admin-auth-input-group">
            <label className="admin-auth-label">
              <Smartphone size={14} />
              <span>Code de sécurité temporaire (TOTP)</span>
            </label>

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
                  disabled={isVerifying}
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
            disabled={isVerifying || digits.join('').length !== 6}
          >
            {isVerifying ? (
              <>
                <RefreshCw size={18} className="spin-icon" />
                <span>Vérification en cours...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Valider le code 2FA</span>
              </>
            )}
          </button>
        </form>

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
