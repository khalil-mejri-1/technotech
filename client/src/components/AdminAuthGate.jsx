import React, { useState, useRef, useEffect } from 'react';
import { Lock, ArrowLeft, Key, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

/**
 * AdminAuthGate - Secure Passcode Verification Screen for TechnoTech Admin
 * Requires secret code (123), masked by default for privacy.
 */
export default function AdminAuthGate({ onSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim();

    if (cleanCode === '123') {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setError('Code d\'accès incorrect. Veuillez réessayer.');
      setIsShaking(true);
      setCode('');
      setTimeout(() => {
        setIsShaking(false);
      }, 600);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
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
            <Lock size={15} className="shield-icon" />
            <span>Portail d'Administration</span>
          </div>
          <h1 className="admin-auth-title">Accès Sécurisé</h1>
          <p className="admin-auth-subtitle">
            Veuillez saisir votre code secret pour accéder à la console de gestion.
          </p>
        </div>

        {/* Passcode Form */}
        <form onSubmit={handleSubmit} className="admin-auth-form">
          <div className="admin-auth-input-group">
            <label htmlFor="admin-passcode" className="admin-auth-label">
              <Key size={14} />
              <span>Code d'accès confidentiel</span>
            </label>

            <div className="admin-auth-input-wrapper">
              <input
                ref={inputRef}
                id="admin-passcode"
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••"
                autoComplete="current-password"
                className={`admin-auth-input ${error ? 'input-error' : ''}`}
                maxLength={10}
                required
              />

              <button
                type="button"
                className="admin-auth-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Masquer le code" : "Afficher le code"}
                aria-label={showPassword ? "Masquer le code" : "Afficher le code"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
          >
            <ShieldCheck size={18} />
            <span>Déverrouiller l'accès</span>
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
