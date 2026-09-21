import React, { useState, useEffect } from 'react';
import {
  Link2,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Package,
  AlertCircle,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { linkService } from '../services/linkService.js';

export default function LinksManager({ products = [], notify }) {
  const [linksData, setLinksData] = useState({ links: [], stats: { totalLinks: 0, availableCount: 0, usedCount: 0, byProduct: [] } });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State: Add Links
  const [selectedProductForAdd, setSelectedProductForAdd] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [linksInputText, setLinksInputText] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Import State (استيراد رابط)
  const [selectedProductForImport, setSelectedProductForImport] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [lastClaimedResult, setLastClaimedResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // View Filter State
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'available' | 'used'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('byProduct'); // 'byProduct' | 'allLinks'

  // Fetch Links from API
  const fetchLinks = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await linkService.getAll();
      setLinksData(res || { links: [], stats: { totalLinks: 0, availableCount: 0, usedCount: 0, byProduct: [] } });
    } catch (err) {
      console.error('Erreur chargement liens :', err);
      if (notify) notify('Erreur lors du chargement des liens.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLinks(true);
  }, []);

  // Calculate parsed link count from textarea
  const parsedLinks = linksInputText
    .split(/[\r\n,]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Handle Add Links
  const handleAddLinks = async (e) => {
    e.preventDefault();
    const finalProductName =
      selectedProductForAdd === 'custom' || !selectedProductForAdd
        ? customProductName.trim()
        : selectedProductForAdd.trim();

    if (!finalProductName) {
      alert('Veuillez sélectionner ou entrer un nom de produit/service.');
      return;
    }

    if (parsedLinks.length === 0) {
      alert('Veuillez saisir au moins un lien valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProdObj = products.find(
        (p) => p.name && p.name.trim().toLowerCase() === finalProductName.toLowerCase()
      );

      const res = await linkService.addLinks({
        productName: finalProductName,
        productId: selectedProdObj ? selectedProdObj._id || selectedProdObj.id : '',
        urls: parsedLinks,
        notes: notesInput,
      });

      if (notify) {
        notify(`✅ ${parsedLinks.length} lien(s) enregistré(s) avec succès pour "${finalProductName}" !`);
      }

      setLinksInputText('');
      setNotesInput('');
      fetchLinks(false);
    } catch (err) {
      console.error('Erreur ajout liens :', err);
      alert(err.message || 'Erreur lors de l’enregistrement des liens.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Claim / Import Link (زر استيراد رابط)
  const handleClaimLink = async (targetProductName = '') => {
    const prodName = targetProductName || selectedProductForImport;
    setIsImporting(true);
    setCopiedLink(false);

    try {
      const res = await linkService.claimLink({
        productName: prodName,
      });

      if (res && res.link) {
        setLastClaimedResult({
          link: res.link.url,
          productName: res.link.productName,
          remainingCount: res.remainingCount,
          claimedAt: new Date(),
        });

        if (notify) {
          notify(`⚡ الرابط جاهز! المتبقي: ${res.remainingCount} رابط (${res.link.productName})`);
        }

        // Refresh stock
        fetchLinks(false);
      }
    } catch (err) {
      console.error('Erreur importation lien :', err);
      alert(err.message || 'Aucun lien disponible.');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Copy Link
  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    if (notify) notify('تم نسخ الرابط بنجاح! 📋');
  };

  // Handle Delete Single Link
  const handleDeleteLink = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce lien ?')) return;
    try {
      await linkService.deleteLink(id);
      fetchLinks(false);
      if (notify) notify('Lien supprimé.');
    } catch (err) {
      console.error('Erreur suppression :', err);
    }
  };

  // Handle Clear Used Links
  const handleClearUsed = async () => {
    if (!window.confirm('Voulez-vous vraiment effacer tous les liens déjà utilisés / importés ?')) return;
    try {
      const res = await linkService.clearUsedLinks();
      fetchLinks(false);
      if (notify) notify(`🧹 ${res.deletedCount || ''} lien(s) utilisé(s) nettoyé(s).`);
    } catch (err) {
      console.error('Erreur nettoyage :', err);
    }
  };

  // Filtered links list
  const filteredLinks = (linksData.links || []).filter((l) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'available'
        ? !l.isUsed
        : l.isUsed;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (l.productName && l.productName.toLowerCase().includes(q)) ||
      (l.url && l.url.toLowerCase().includes(q)) ||
      (l.usedByOrderNumber && l.usedByOrderNumber.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // Available count for selected import product
  const selectedProdStats = linksData.stats?.byProduct?.find(
    (p) => p.productName.toLowerCase() === selectedProductForImport.toLowerCase()
  );
  const currentImportAvailable = selectedProductForImport
    ? selectedProdStats?.availableCount || 0
    : linksData.stats?.availableCount || 0;

  return (
    <div className="links-manager-wrapper">
      {/* -------------------------------------------------------------
          TOP BAR: TITLE & REFRESH
          ------------------------------------------------------------- */}
      <div className="links-header-banner">
        <div className="links-header-info">
          <div className="links-header-icon-box">
            <Link2 size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="links-header-title">إدارة الروابط الجاهزة والمخزون الرقمي</h2>
              <span className="links-admin-only-tag">قسم الأدمن فقط 🔒</span>
            </div>
            <p className="links-header-subtitle">
              سجّل روابط الحسابات والاشتراكات الجاهزة مسبقاً، واستورد رابطاً فورياً بضغطة زر مع إنقاص الكمية تلقائياً من المخزون. (غير مرئي للمستخدمين في المتجر).
            </p>
          </div>
        </div>

        <button
          type="button"
          className="refresh-orders-btn"
          onClick={() => fetchLinks(false)}
          disabled={isRefreshing}
          title="Actualiser la liste des liens"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          <span>تحديث المخزون</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          STATS CARDS
          ------------------------------------------------------------- */}
      <div className="orders-stats-grid">
        <div className="order-stat-card total">
          <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Layers size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">إجمالي الروابط المسجلة</span>
            <span className="stat-card-value">{linksData.stats?.totalLinks || 0}</span>
          </div>
        </div>

        <div className="order-stat-card confirmed" style={{ borderColor: 'rgba(34, 197, 94, 0.4)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">الروابط المتوفرة (الكمية المتاحة)</span>
            <span className="stat-card-value" style={{ color: '#22c55e' }}>
              {linksData.stats?.availableCount || 0}
            </span>
          </div>
        </div>

        <div className="order-stat-card pending">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">الروابط المستوردة / المستخدمة</span>
            <span className="stat-card-value">{linksData.stats?.usedCount || 0}</span>
          </div>
        </div>

        <div className="order-stat-card revenue">
          <div className="stat-card-icon" style={{ background: 'rgba(226, 88, 22, 0.15)', color: '#e25816' }}>
            <Package size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">المنتجات المغطاة بروابط</span>
            <span className="stat-card-value">{linksData.stats?.byProduct?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MAIN 2-COLUMN ACTION PANELS: QUICK IMPORT & ADD LINKS
          ------------------------------------------------------------- */}
      <div className="links-actions-grid">
        {/* PANEL 1: زر استيراد رابط (Quick Claim / Import Link) */}
        <div className="links-action-card import-card">
          <div className="action-card-header">
            <div className="action-card-title-group">
              <Sparkles size={20} className="action-title-icon text-orange" />
              <h3>استيراد رابط فوري (جلب وإنقاص الكمية)</h3>
            </div>
            <span className="stock-pill">
              الكمية المتوفرة: <strong>{currentImportAvailable}</strong>
            </span>
          </div>

          <p className="action-card-desc">
            اختر المنتج واضغط على زر الاستيراد لجلب رابط جاهز متاح فوراً وإنقاصه من الكمية المسجلة.
          </p>

          <div className="import-controls-row">
            <div className="import-select-box">
              <label className="input-label-sm">حدد المنتج المطلوب :</label>
              <select
                className="links-native-select"
                value={selectedProductForImport}
                onChange={(e) => {
                  setSelectedProductForImport(e.target.value);
                  setLastClaimedResult(null);
                }}
              >
                <option value="">-- أي رابط متاح في المخزون --</option>
                {(linksData.stats?.byProduct || []).map((p) => (
                  <option key={p.productName} value={p.productName}>
                    {p.productName} ({p.availableCount} متوفر)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="claim-link-btn"
              onClick={() => handleClaimLink()}
              disabled={isImporting || (selectedProductForImport ? currentImportAvailable === 0 : linksData.stats?.availableCount === 0)}
            >
              {isImporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>جاري الجلب...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>استيراد رابط الآن</span>
                </>
              )}
            </button>
          </div>

          {/* Result Alert of Last Claimed Link */}
          {lastClaimedResult && (
            <div className="claimed-result-box">
              <div className="claimed-result-header">
                <span className="claimed-badge">
                  <CheckCircle2 size={14} /> تم استيراد الرابط بنجاح!
                </span>
                <span className="remaining-alert">
                  الكمية المتبقية الآن: <strong>{lastClaimedResult.remainingCount}</strong>
                </span>
              </div>

              <div className="claimed-link-row">
                <div className="claimed-url-display" title={lastClaimedResult.link}>
                  {lastClaimedResult.link}
                </div>
                <button
                  type="button"
                  className={`copy-btn ${copiedLink ? 'copied' : ''}`}
                  onClick={() => handleCopy(lastClaimedResult.link)}
                  title="نسخ الرابط إلى الحافظة"
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>

              <div className="claimed-details-bar">
                <span>المنتج: <strong>{lastClaimedResult.productName}</strong></span>
                <span>تاريخ الاستيراد: <strong>{new Date().toLocaleTimeString('ar-TN')}</strong></span>
              </div>
            </div>
          )}

          {currentImportAvailable === 0 && (
            <div className="stock-exhausted-alert">
              <AlertCircle size={16} />
              <span>لا توجد روابط متوفرة حالياً لهذا المنتج. يمكنك تسجيل روابط جديدة عبر النموذج المجاور.</span>
            </div>
          )}
        </div>

        {/* PANEL 2: تسجيل روابط جاهزة جديدة (Add Links) */}
        <div className="links-action-card add-card">
          <div className="action-card-header">
            <div className="action-card-title-group">
              <Plus size={20} className="action-title-icon text-blue" />
              <h3>تسجيل روابط جاهزة جديدة</h3>
            </div>
            {parsedLinks.length > 0 && (
              <span className="parsed-count-badge">
                {parsedLinks.length} رابط تم كشفه
              </span>
            )}
          </div>

          <form onSubmit={handleAddLinks} className="add-links-form">
            <div className="form-group-sm">
              <label className="input-label-sm">المنتج أو الخدمة :</label>
              <select
                className="links-native-select"
                value={selectedProductForAdd}
                onChange={(e) => setSelectedProductForAdd(e.target.value)}
              >
                <option value="">-- اختر منتجاً من الكتالوج --</option>
                {products.map((p) => (
                  <option key={p._id || p.id || p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
                <option value="custom">✏️ إدخال اسم خدمة / منتج يدوي...</option>
              </select>
            </div>

            {(selectedProductForAdd === 'custom' || (!selectedProductForAdd && customProductName)) && (
              <div className="form-group-sm">
                <input
                  type="text"
                  className="links-native-input"
                  placeholder="مثال: ChatGPT Plus, Canva Pro, Netflix..."
                  value={customProductName}
                  onChange={(e) => setCustomProductName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group-sm">
              <label className="input-label-sm">
                الروابط (يمكنك لصق روابط متعددة دفعة واحدة، رابط في كل سطر) :
              </label>
              <textarea
                className="links-native-textarea"
                rows={4}
                placeholder="https://chatgpt.com/invite/...&#10;https://chatgpt.com/invite/...&#10;https://chatgpt.com/invite/..."
                value={linksInputText}
                onChange={(e) => setLinksInputText(e.target.value)}
                required
              />
            </div>

            <div className="form-group-sm">
              <input
                type="text"
                className="links-native-input"
                placeholder="ملاحظات اختيارية (مثال: دفعة مارس 2026، حسابات 1 شهر)"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="save-links-btn"
              disabled={isSubmitting || parsedLinks.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>جاري التسجيل...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>تسجيل {parsedLinks.length > 0 ? `(${parsedLinks.length})` : ''} في المخزون</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* -------------------------------------------------------------
          TABLE & STOCK BREAKDOWN TABS
          ------------------------------------------------------------- */}
      <div className="links-table-section">
        <div className="links-table-header-bar">
          <div className="links-subtabs-group">
            <button
              type="button"
              className={`links-subtab ${activeSubTab === 'byProduct' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('byProduct')}
            >
              <Package size={16} />
              <span>المخزون حسب المنتج ({linksData.stats?.byProduct?.length || 0})</span>
            </button>
            <button
              type="button"
              className={`links-subtab ${activeSubTab === 'allLinks' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('allLinks')}
            >
              <Link2 size={16} />
              <span>سجل كافة الروابط ({linksData.stats?.totalLinks || 0})</span>
            </button>
          </div>

          <div className="links-table-tools">
            {activeSubTab === 'allLinks' && (
              <>
                <div className="links-filter-pills">
                  <button
                    type="button"
                    className={`pill-btn ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    className={`pill-btn available ${filterStatus === 'available' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('available')}
                  >
                    المتوفرة ({linksData.stats?.availableCount || 0})
                  </button>
                  <button
                    type="button"
                    className={`pill-btn used ${filterStatus === 'used' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('used')}
                  >
                    المستوردة ({linksData.stats?.usedCount || 0})
                  </button>
                </div>

                {linksData.stats?.usedCount > 0 && (
                  <button
                    type="button"
                    className="clear-used-btn"
                    onClick={handleClearUsed}
                    title="حذف الروابط التي تم استيرادها مسبقاً"
                  >
                    <Trash2 size={14} />
                    <span>تنظيف المستوردة</span>
                  </button>
                )}
              </>
            )}

            <div className="links-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="بحث عن منتج، رابط..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SUBTAB 1: BY PRODUCT BREAKDOWN */}
        {activeSubTab === 'byProduct' && (
          <div className="links-product-grid">
            {(linksData.stats?.byProduct || []).length === 0 ? (
              <div className="links-empty-state">
                <Link2 size={40} className="empty-icon" />
                <h4>لا توجد روابط مسجلة في المخزون حتى الآن</h4>
                <p>استخدم نموذج "تسجيل روابط جاهزة" في الأعلى لإضافة روابط اشتراكاتك الأولى.</p>
              </div>
            ) : (
              (linksData.stats?.byProduct || [])
                .filter((p) => !searchQuery || p.productName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <div key={item.productName} className="stock-product-card">
                    <div className="stock-card-top">
                      <h4 className="stock-prod-name">{item.productName}</h4>
                      <span className={`stock-qty-badge ${item.availableCount > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {item.availableCount > 0 ? `${item.availableCount} متاح` : 'نفدت الكمية'}
                      </span>
                    </div>

                    <div className="stock-card-metrics">
                      <div className="metric-row">
                        <span>إجمالي المسجل:</span>
                        <strong>{item.totalCount}</strong>
                      </div>
                      <div className="metric-row">
                        <span>المستورد:</span>
                        <strong>{item.usedCount}</strong>
                      </div>
                      <div className="metric-row">
                        <span>الكمية المتبقية:</span>
                        <strong className={item.availableCount > 0 ? 'text-green' : 'text-red'}>
                          {item.availableCount}
                        </strong>
                      </div>
                    </div>

                    <div className="stock-card-actions">
                      <button
                        type="button"
                        className="stock-btn claim"
                        onClick={() => handleClaimLink(item.productName)}
                        disabled={item.availableCount === 0 || isImporting}
                        title="استيراد رابط فوري وإنقاص الكمية"
                      >
                        <Sparkles size={14} />
                        <span>استيراد رابط</span>
                      </button>

                      <button
                        type="button"
                        className="stock-btn add"
                        onClick={() => {
                          setSelectedProductForAdd(item.productName);
                          window.scrollTo({ top: 100, behavior: 'smooth' });
                        }}
                        title="إضافة المزيد من الروابط لهذا المنتج"
                      >
                        <Plus size={14} />
                        <span>إضافة روابط</span>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* SUBTAB 2: ALL LINKS TABLE */}
        {activeSubTab === 'allLinks' && (
          <div className="links-table-container">
            {filteredLinks.length === 0 ? (
              <div className="links-empty-state">
                <Search size={36} className="empty-icon" />
                <h4>لا توجد روابط مطابقة للبحث أو الفلتر</h4>
              </div>
            ) : (
              <table className="links-native-table">
                <thead>
                  <tr>
                    <th>المنتج / الخدمة</th>
                    <th>الرابط المسجل</th>
                    <th>الحالة</th>
                    <th>تاريخ الإضافة / الاستيراد</th>
                    <th>رقم الطلب</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((l) => (
                    <tr key={l._id || l.url} className={l.isUsed ? 'row-used' : 'row-available'}>
                      <td className="cell-product">
                        <strong>{l.productName}</strong>
                        {l.notes && <span className="cell-notes">{l.notes}</span>}
                      </td>
                      <td className="cell-url">
                        <span className="url-truncate" title={l.url}>
                          {l.url}
                        </span>
                      </td>
                      <td className="cell-status">
                        {l.isUsed ? (
                          <span className="status-badge used">
                            <CheckCircle2 size={12} /> مستورد
                          </span>
                        ) : (
                          <span className="status-badge available">
                            <Sparkles size={12} /> متاح
                          </span>
                        )}
                      </td>
                      <td className="cell-date">
                        {l.isUsed && l.usedAt
                          ? `استورد: ${new Date(l.usedAt).toLocaleDateString('fr-FR')} à ${new Date(l.usedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                          : `أضيف: ${new Date(l.createdAt).toLocaleDateString('fr-FR')}`}
                      </td>
                      <td className="cell-order">
                        {l.usedByOrderNumber ? (
                          <span className="order-pill">{l.usedByOrderNumber}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="cell-actions">
                        <button
                          type="button"
                          className="table-action-btn copy"
                          onClick={() => handleCopy(l.url)}
                          title="نسخ الرابط"
                        >
                          <Copy size={13} />
                        </button>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-btn external"
                          title="فتح الرابط"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          type="button"
                          className="table-action-btn delete"
                          onClick={() => handleDeleteLink(l._id)}
                          title="حذف الرابط"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
