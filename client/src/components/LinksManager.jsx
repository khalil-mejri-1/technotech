import React, { useState, useEffect } from 'react';
import {
  Link2,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
} from 'lucide-react';
import { linkService } from '../services/linkService.js';

const TARGET_PRODUCT = 'Gemini Pro';

export default function LinksManager({ notify }) {
  const [links, setLinks] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form: Ajouter des liens
  const [inputText, setInputText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Extraction: Extraire des liens
  const [extractCount, setExtractCount] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedLinks, setExtractedLinks] = useState([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Charger les liens de Gemini Pro
  const fetchGeminiLinks = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await linkService.getAll({ productName: TARGET_PRODUCT });
      const allLinks = Array.isArray(res?.links) ? res.links : [];
      const geminiLinks = allLinks.filter(
        (l) => l.productName?.toLowerCase() === TARGET_PRODUCT.toLowerCase()
      );
      setLinks(geminiLinks);
      setAvailableCount(geminiLinks.filter((l) => !l.isUsed).length);
      setUsedCount(geminiLinks.filter((l) => l.isUsed).length);
    } catch (err) {
      console.error('Erreur chargement liens Gemini Pro :', err);
      if (notify) notify('Erreur de chargement du stock');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGeminiLinks(true);
  }, []);

  // Détection des liens saisis
  const parsedLinks = inputText
    .split(/[\r\n,]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Ajouter des liens au stock
  const handleAddLinks = async (e) => {
    e.preventDefault();
    if (parsedLinks.length === 0) {
      alert('Veuillez saisir au moins un lien.');
      return;
    }

    setIsSaving(true);
    try {
      await linkService.addLinks({
        productName: TARGET_PRODUCT,
        urls: parsedLinks,
      });

      if (notify) {
        notify(`✅ ${parsedLinks.length} lien(s) ajouté(s) au stock de ${TARGET_PRODUCT} !`);
      }

      setInputText('');
      fetchGeminiLinks(false);
    } catch (err) {
      alert(err.message || 'Erreur lors de l’enregistrement des liens.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Extraire un ou plusieurs liens du stock
  const handleExtractLinks = async () => {
    if (extractCount <= 0) return;
    if (availableCount < extractCount) {
      alert(`Stock insuffisant. Vous demandez ${extractCount} lien(s) mais seulement ${availableCount} disponible(s).`);
      return;
    }

    setIsExtracting(true);
    setCopiedAll(false);
    setCopiedIndex(null);

    try {
      const res = await linkService.claimLink({
        productName: TARGET_PRODUCT,
        count: extractCount,
      });

      const claimed = Array.isArray(res?.links) ? res.links : (res?.link ? [res.link] : []);
      setExtractedLinks(claimed);

      if (notify) {
        notify(`⚡ ${claimed.length} lien(s) extrait(s) ! Stock restant : ${res.remainingCount}`);
      }

      fetchGeminiLinks(false);
    } catch (err) {
      alert(err.message || 'Erreur lors de l’extraction.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Copier un seul lien
  const handleCopySingle = (url, idx) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
    if (notify) notify('Lien copié ! 📋');
  };

  // Copier tous les liens extraits
  const handleCopyAll = () => {
    if (extractedLinks.length === 0) return;
    const text = extractedLinks.map((l) => l.url).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    if (notify) notify(`${extractedLinks.length} lien(s) copié(s) dans le presse-papier ! 📋`);
  };

  // Supprimer un lien individuel du stock
  const handleDeleteLink = async (id) => {
    if (!window.confirm('Voulez-vous supprimer ce lien ?')) return;
    try {
      await linkService.deleteLink(id);
      fetchGeminiLinks(false);
      if (notify) notify('Lien supprimé.');
    } catch (err) {
      console.error(err);
    }
  };

  const unusedLinks = links.filter((l) => !l.isUsed);

  return (
    <div className="gemini-links-container">
      {/* -------------------------------------------------------------
          HEADER SIMPLE & ÉPURÉ
          ------------------------------------------------------------- */}
      <div className="gemini-header-box">
        <div className="gemini-header-left">
          <div className="gemini-icon-circle">
            <Link2 size={26} />
          </div>
          <div>
            <div className="gemini-title-row">
              <h2>Gestion des Liens — Gemini Pro</h2>
              <span className="admin-lock-badge">Section Admin Privée 🔒</span>
            </div>
            <p className="gemini-subtitle">
              Enregistrez vos liens d'invitation Gemini Pro et extrayez-les du stock à la demande en 1 clic.
            </p>
          </div>
        </div>

        {/* Stock Status Badge */}
        <div className="gemini-header-right">
          <div className="gemini-stock-counter">
            <span className="stock-counter-label">Stock Disponible</span>
            <span className="stock-counter-value">
              {isLoading ? '...' : availableCount}
              <small> lien{availableCount > 1 ? 's' : ''}</small>
            </span>
          </div>

          <button
            type="button"
            className="gemini-refresh-btn"
            onClick={() => fetchGeminiLinks(false)}
            disabled={isRefreshing}
            title="Actualiser le stock"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          DEUX BLOCS SIMPLES : AJOUTER & EXTRAIRE
          ------------------------------------------------------------- */}
      <div className="gemini-cards-grid">
        {/* BLOC 1 : AJOUTER DES LIENS (ENTRÉE DE STOCK) */}
        <div className="gemini-card add-card">
          <div className="gemini-card-header">
            <div className="card-header-title">
              <Plus size={18} className="text-blue" />
              <h3>1. Enregistrer des liens (Entrée)</h3>
            </div>
            {parsedLinks.length > 0 && (
              <span className="badge-pill blue">
                {parsedLinks.length} lien{parsedLinks.length > 1 ? 's' : ''} détecté{parsedLinks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <p className="gemini-card-help">
            Collez vos liens d'invitation Gemini Pro ci-dessous (un lien par ligne) :
          </p>

          <form onSubmit={handleAddLinks} className="gemini-form">
            <textarea
              className="gemini-textarea"
              rows={3}
              placeholder="https://g.co/gemini/invite/...&#10;https://g.co/gemini/invite/...&#10;https://g.co/gemini/invite/..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              required
            />

            <button
              type="submit"
              className="gemini-submit-btn blue"
              disabled={isSaving || parsedLinks.length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>
                    Ajouter {parsedLinks.length > 0 ? `(${parsedLinks.length}) ` : ''}au Stock Gemini Pro
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* BLOC 2 : EXTRAIRE DES LIENS (SORTIE DE STOCK) */}
        <div className="gemini-card extract-card">
          <div className="gemini-card-header">
            <div className="card-header-title">
              <Sparkles size={18} className="text-orange" />
              <h3>2. Extraire des liens (Sortie)</h3>
            </div>
            <span className={`badge-pill ${availableCount > 0 ? 'green' : 'red'}`}>
              {availableCount > 0 ? `${availableCount} disponible(s)` : 'Stock épuisé'}
            </span>
          </div>

          <p className="gemini-card-help">
            Choisissez combien de liens vous voulez récupérer. Chaque lien extrait est automatiquement déduit du stock.
          </p>

          <div className="gemini-extract-controls">
            <div className="extract-qty-selector">
              <label className="selector-label">Nombre de liens à extraire :</label>
              <div className="qty-input-group">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setExtractCount((prev) => Math.max(1, prev - 1))}
                  disabled={extractCount <= 1}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, availableCount)}
                  className="qty-number-input"
                  value={extractCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setExtractCount(isNaN(val) ? 1 : Math.max(1, val));
                  }}
                />
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setExtractCount((prev) => prev + 1)}
                  disabled={availableCount > 0 && extractCount >= availableCount}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Boutons rapides */}
              <div className="quick-qty-pills">
                {[1, 2, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`quick-pill ${extractCount === num ? 'active' : ''}`}
                    onClick={() => setExtractCount(num)}
                    disabled={availableCount > 0 && num > availableCount}
                  >
                    {num} lien{num > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="gemini-submit-btn orange"
              onClick={handleExtractLinks}
              disabled={isExtracting || availableCount === 0 || extractCount > availableCount}
            >
              {isExtracting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Extraction en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>
                    Extraire {extractCount} lien{extractCount > 1 ? 's' : ''} maintenant
                  </span>
                </>
              )}
            </button>
          </div>

          {/* RÉSULTAT : LIENS EXTRAITS */}
          {extractedLinks.length > 0 && (
            <div className="extracted-result-box">
              <div className="extracted-result-top">
                <span className="extracted-success-label">
                  <CheckCircle2 size={15} />
                  <strong>{extractedLinks.length} lien{extractedLinks.length > 1 ? 's' : ''} extrait{extractedLinks.length > 1 ? 's' : ''} avec succès !</strong>
                </span>

                <button
                  type="button"
                  className={`copy-all-btn ${copiedAll ? 'copied' : ''}`}
                  onClick={handleCopyAll}
                >
                  {copiedAll ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedAll ? 'Tous copiés !' : 'Copier tout'}</span>
                </button>
              </div>

              <div className="extracted-links-list">
                {extractedLinks.map((item, idx) => (
                  <div key={item._id || idx} className="extracted-link-row">
                    <span className="link-num">{idx + 1}.</span>
                    <span className="link-text" title={item.url}>{item.url}</span>
                    <button
                      type="button"
                      className={`copy-single-btn ${copiedIndex === idx ? 'copied' : ''}`}
                      onClick={() => handleCopySingle(item.url, idx)}
                      title="Copier ce lien"
                    >
                      {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedIndex === idx ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="extracted-footer-note">
                Stock Gemini Pro restant : <strong>{availableCount} lien{availableCount > 1 ? 's' : ''}</strong>
              </div>
            </div>
          )}

          {availableCount === 0 && (
            <div className="gemini-empty-alert">
              <AlertCircle size={16} />
              <span>Le stock est vide. Ajoutez de nouveaux liens via le formulaire à gauche.</span>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          BLOC 3 : APERÇU DES LIENS EN STOCK (SIMPLE & DISCRET)
          ------------------------------------------------------------- */}
      <div className="gemini-stock-preview">
        <div className="preview-header">
          <h4>Liens actuellement en attente dans le stock ({unusedLinks.length})</h4>
          <span className="preview-subtitle">Ces liens n'ont pas encore été extraits</span>
        </div>

        {unusedLinks.length === 0 ? (
          <p className="no-links-text">Aucun lien en attente dans le stock.</p>
        ) : (
          <div className="simple-links-list">
            {unusedLinks.map((l, idx) => (
              <div key={l._id || idx} className="simple-link-item">
                <span className="item-index">#{idx + 1}</span>
                <span className="item-url" title={l.url}>{l.url}</span>
                <div className="item-actions">
                  <button
                    type="button"
                    className="item-btn copy"
                    onClick={() => handleCopySingle(l.url, `list-${idx}`)}
                    title="Copier"
                  >
                    {copiedIndex === `list-${idx}` ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="item-btn external"
                    title="Tester le lien"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    className="item-btn delete"
                    onClick={() => handleDeleteLink(l._id)}
                    title="Supprimer du stock"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
