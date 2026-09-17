import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Search,
  RefreshCw,
  Phone,
  MessageCircle,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  Printer,
  Volume2,
  VolumeX,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';
import { orderService } from '../services/orderService.js';
import { getImageUrl } from '../config/api.js';

// Play a pleasant luxury notification chime using Web Audio API
function playOrderChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    // First pleasant harmonic tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Second bell tone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (e) {
    // Audio context not allowed until first interaction
  }
}

export default function OrdersManager({ notify }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrderModal, setActiveOrderModal] = useState(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track known orders to detect newly arrived orders during live polling
  const knownOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Fetch orders from API
  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setIsRefreshing(true);
    try {
      const data = await orderService.getAll();
      const currentOrders = Array.isArray(data) ? data : [];

      // Check if new orders arrived in background
      if (!isFirstLoadRef.current && currentOrders.length > 0) {
        const newOrders = currentOrders.filter(
          (ord) => !knownOrderIdsRef.current.has(ord._id || ord.orderNumber)
        );
        if (newOrders.length > 0) {
          if (soundEnabled) {
            playOrderChime();
          }
          if (notify) {
            notify(`⚡ ${newOrders.length} nouvelle(s) commande(s) reçue(s) !`);
          }
        }
      }

      // Update known ids
      currentOrders.forEach((o) => {
        knownOrderIdsRef.current.add(o._id || o.orderNumber);
      });

      isFirstLoadRef.current = false;
      setOrders(currentOrders);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Erreur récupération commandes :', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders(false);
  }, []);

  // Live Auto-Polling every 5 seconds without page reload
  useEffect(() => {
    const timer = setInterval(() => {
      fetchOrders(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [soundEnabled]);

  // Handle status update
  const handleStatusChange = async (orderId, newStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
    );
    if (activeOrderModal && activeOrderModal._id === orderId) {
      setActiveOrderModal((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      await orderService.updateStatus(orderId, newStatus);
      if (notify) {
        const labels = {
          en_attente: 'En attente ⏳',
          confirmee: 'Confirmée ✅',
          livree: 'Livrée 📦',
          annulee: 'Annulée ❌',
        };
        notify(`Statut mis à jour : ${labels[newStatus] || newStatus}`);
      }
    } catch (err) {
      console.error('Erreur mise à jour statut :', err);
      // Revert on failure
      fetchOrders(true);
    }
  };

  // Handle order deletion
  const handleDeleteOrder = async () => {
    if (!deleteConfirmOrder) return;
    setIsDeleting(true);
    try {
      await orderService.delete(deleteConfirmOrder._id);
      setOrders((prev) => prev.filter((o) => o._id !== deleteConfirmOrder._id));
      if (activeOrderModal && activeOrderModal._id === deleteConfirmOrder._id) {
        setActiveOrderModal(null);
      }
      setDeleteConfirmOrder(null);
      if (notify) notify('Commande supprimée avec succès. 🗑️');
    } catch (err) {
      console.error('Erreur suppression commande :', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Status stats counts
  const stats = {
    total: orders.length,
    enAttente: orders.filter((o) => o.status === 'en_attente').length,
    confirmee: orders.filter((o) => o.status === 'confirmee').length,
    livree: orders.filter((o) => o.status === 'livree').length,
    annulee: orders.filter((o) => o.status === 'annulee').length,
    totalRevenue: orders
      .filter((o) => o.status !== 'annulee')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedStatus === 'all' ? true : order.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (order.customerName && order.customerName.toLowerCase().includes(q)) ||
      (order.customerPhone && order.customerPhone.includes(q)) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(q)) ||
      (order.customerCity && order.customerCity.toLowerCase().includes(q)) ||
      (order.items &&
        order.items.some((i) => i.name && i.name.toLowerCase().includes(q)));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'en_attente':
        return (
          <span className="order-status-badge en-attente">
            <Clock size={13} /> En attente
          </span>
        );
      case 'confirmee':
        return (
          <span className="order-status-badge confirmee">
            <CheckCircle2 size={13} /> Confirmée
          </span>
        );
      case 'livree':
        return (
          <span className="order-status-badge livree">
            <PackageCheck size={13} /> Livrée
          </span>
        );
      case 'annulee':
        return (
          <span className="order-status-badge annulee">
            <XCircle size={13} /> Annulée
          </span>
        );
      default:
        return <span className="order-status-badge">{status}</span>;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' à ' +
      d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  return (
    <div className="orders-manager-layout">
      {/* -------------------------------------------------------------
          TOP BAR: LIVE STATUS & REFRESH & SOUND TOGGLE
          ------------------------------------------------------------- */}
      <div className="orders-top-control-bar">
        <div className="live-status-indicator">
          <span className="live-pulse-dot" />
          <span className="live-status-text">En direct (Temps réel)</span>
          <span className="live-sync-time">
            &bull; Synchro {lastSyncTime.toLocaleTimeString('fr-FR')}
          </span>
        </div>

        <div className="orders-top-actions">
          {/* Sound Toggle */}
          <button
            type="button"
            className={`sound-toggle-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled((p) => !p)}
            title={soundEnabled ? 'Son activé lors des commandes' : 'Son désactivé'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Son Activé' : 'Son Coupé'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            className="refresh-orders-btn"
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          STATISTICS CARDS
          ------------------------------------------------------------- */}
      <div className="orders-stats-grid">
        <div className="order-stat-card total">
          <div className="stat-card-icon">
            <ShoppingBag size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Total Commandes</span>
            <span className="stat-card-value">{stats.total}</span>
          </div>
        </div>

        <div className="order-stat-card pending">
          <div className="stat-card-icon">
            <Clock size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">En attente</span>
            <span className="stat-card-value">{stats.enAttente}</span>
          </div>
        </div>

        <div className="order-stat-card confirmed">
          <div className="stat-card-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Confirmées</span>
            <span className="stat-card-value">{stats.confirmee}</span>
          </div>
        </div>

        <div className="order-stat-card delivered">
          <div className="stat-card-icon">
            <PackageCheck size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Livrées</span>
            <span className="stat-card-value">{stats.livree}</span>
          </div>
        </div>

        <div className="order-stat-card revenue">
          <div className="stat-card-icon">
            <DollarSign size={22} />
          </div>
          <div className="stat-card-data">
            <span className="stat-card-label">Chiffre d'Affaires</span>
            <span className="stat-card-value">{stats.totalRevenue} DT</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FILTERS & SEARCH BAR
          ------------------------------------------------------------- */}
      <div className="orders-filter-bar">
        {/* Status Filter Tabs */}
        <div className="orders-status-tabs">
          <button
            type="button"
            className={`status-tab ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            Toutes ({stats.total})
          </button>
          <button
            type="button"
            className={`status-tab en-attente ${selectedStatus === 'en_attente' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('en_attente')}
          >
            En attente ({stats.enAttente})
          </button>
          <button
            type="button"
            className={`status-tab confirmee ${selectedStatus === 'confirmee' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('confirmee')}
          >
            Confirmées ({stats.confirmee})
          </button>
          <button
            type="button"
            className={`status-tab livree ${selectedStatus === 'livree' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('livree')}
          >
            Livrées ({stats.livree})
          </button>
          <button
            type="button"
            className={`status-tab annulee ${selectedStatus === 'annulee' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('annulee')}
          >
            Annulées ({stats.annulee})
          </button>
        </div>

        {/* Search Input */}
        <div className="orders-search-box">
          <Search size={16} className="search-box-icon" />
          <input
            type="text"
            className="orders-search-input"
            placeholder="Rechercher par nom, téléphone, #CMD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* -------------------------------------------------------------
          ORDERS LIST
          ------------------------------------------------------------- */}
      {isLoading ? (
        <div className="orders-loading-state">
          <Loader2 size={36} className="animate-spin text-orange" />
          <span>Chargement des commandes en direct...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty-state">
          <div className="empty-icon-circle">
            <ShoppingBag size={40} />
          </div>
          <h3>Aucune commande trouvée</h3>
          <p>
            {searchQuery
              ? 'Aucune commande ne correspond à votre recherche.'
              : 'Les nouvelles commandes apparaîtront ici automatiquement sans recharger la page.'}
          </p>
        </div>
      ) : (
        <div className="orders-cards-list">
          {filteredOrders.map((order) => {
            const clientName = order.customerName || 'Client';
            const clientPhone = order.customerPhone || '';
            const whatsAppText = encodeURIComponent(
              `Bonjour ${clientName}, c'est l'équipe TechnoTech concernant votre commande #${order.orderNumber} d'un montant de ${order.totalAmount} DT.`
            );
            const whatsAppLink = `https://wa.me/216${clientPhone}?text=${whatsAppText}`;

            return (
              <div
                key={order._id || order.orderNumber}
                className={`order-item-card ${order.status}`}
              >
                {/* Order Card Header */}
                <div className="order-card-header">
                  <div className="order-ref-group">
                    <span className="order-number-tag">{order.orderNumber}</span>
                    <span className="order-date-tag">
                      <Calendar size={12} /> {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="order-status-controller">
                    {/* Status Dropdown */}
                    <div className="status-select-wrap">
                      <select
                        className={`status-native-select ${order.status}`}
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                      >
                        <option value="en_attente">⏳ En attente</option>
                        <option value="confirmee">✅ Confirmée</option>
                        <option value="livree">📦 Livrée</option>
                        <option value="annulee">❌ Annulée</option>
                      </select>
                      <ChevronDown size={14} className="select-chevron" />
                    </div>
                  </div>
                </div>

                {/* Order Main Details Grid */}
                <div className="order-card-body-grid">
                  {/* Customer Information with Quick Contact Actions */}
                  <div className="customer-info-block">
                    <div className="customer-name-heading">
                      <span className="client-name">{clientName}</span>
                      {order.customerCity && (
                        <span className="client-city-pill">
                          <MapPin size={11} /> {order.customerCity}
                        </span>
                      )}
                    </div>

                    <div className="customer-phone-row">
                      <span className="phone-digits">+216 {clientPhone}</span>

                      {/* Quick Contact Buttons */}
                      <div className="quick-contact-actions">
                        <a
                          href={`tel:+216${clientPhone}`}
                          className="contact-action-btn phone"
                          title="Appeler le client"
                        >
                          <Phone size={14} />
                          <span>Appeler</span>
                        </a>

                        <a
                          href={whatsAppLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="contact-action-btn whatsapp"
                          title="Discuter sur WhatsApp"
                        >
                          <MessageCircle size={14} />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {order.customerAddress && (
                      <div className="customer-address-note">
                        <MapPin size={12} />
                        <span>{order.customerAddress}</span>
                      </div>
                    )}

                    {order.customerNotes && (
                      <div className="customer-custom-notes">
                        <FileText size={12} />
                        <span>Note : {order.customerNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Products ordered in this order */}
                  <div className="order-products-summary-block">
                    <div className="order-items-mini-list">
                      {(order.items || []).map((item, idx) => (
                        <div
                          key={`${item.id || idx}-${idx}`}
                          className="order-item-mini-row"
                        >
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="order-item-mini-thumb"
                          />
                          <div className="order-item-mini-details">
                            <span className="mini-item-title">{item.name}</span>
                            <span className="mini-item-sub">
                              {item.size || 'Standard'} &bull; Qté : {item.quantity}
                            </span>
                          </div>
                          <span className="mini-item-price">
                            {(Number(item.price) || 0) * (Number(item.quantity) || 1)} DT
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total Amount */}
                    <div className="order-total-bar">
                      <span className="total-title">Total Commande :</span>
                      <span className="total-highlight">
                        {order.totalAmount} DT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Details Modal, Delete */}
                <div className="order-card-footer">
                  <span className="payment-method-tag">
                    {order.paymentMethod || 'Paiement à la livraison'}
                  </span>

                  <div className="order-footer-btns">
                    <button
                      type="button"
                      className="order-btn-view"
                      onClick={() => setActiveOrderModal(order)}
                    >
                      <Eye size={14} />
                      <span>Facture / Détails</span>
                    </button>

                    <button
                      type="button"
                      className="order-btn-delete"
                      onClick={() => setDeleteConfirmOrder(order)}
                      title="Supprimer la commande"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 1: ORDER DETAILS / INVOICE VIEW
          ------------------------------------------------------------- */}
      {activeOrderModal && (
        <div
          className="admin-dialog-backdrop"
          onClick={() => setActiveOrderModal(null)}
        >
          <div
            className="order-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-banner">
              <div>
                <span className="modal-top-tag">FACTURE &amp; DÉTAILS DE COMMANDE</span>
                <h3 className="modal-order-number">{activeOrderModal.orderNumber}</h3>
                <span className="modal-date">
                  {formatDateTime(activeOrderModal.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveOrderModal(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body-content">
              {/* Customer Box */}
              <div className="modal-section-card">
                <h4>Informations Client</h4>
                <div className="client-details-grid">
                  <div>
                    <strong>Nom :</strong> {activeOrderModal.customerName}
                  </div>
                  <div>
                    <strong>Téléphone :</strong> +216 {activeOrderModal.customerPhone}
                  </div>
                  <div>
                    <strong>Gouvernorat :</strong> {activeOrderModal.customerCity || 'N/A'}
                  </div>
                  <div>
                    <strong>Adresse :</strong> {activeOrderModal.customerAddress || 'Non spécifiée'}
                  </div>
                  {activeOrderModal.customerNotes && (
                    <div className="full-width">
                      <strong>Remarques :</strong> {activeOrderModal.customerNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="modal-section-card">
                <h4>Articles commandés</h4>
                <div className="modal-items-table">
                  {(activeOrderModal.items || []).map((it, idx) => (
                    <div key={idx} className="modal-table-row">
                      <img
                        src={getImageUrl(it.image)}
                        alt={it.name}
                        className="modal-table-thumb"
                      />
                      <div className="modal-table-name">
                        <strong>{it.name}</strong>
                        <span>{it.size || 'Standard'}</span>
                      </div>
                      <div className="modal-table-qty">Qté: {it.quantity}</div>
                      <div className="modal-table-price">
                        {(Number(it.price) || 0) * (Number(it.quantity) || 1)} DT
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-total-summary">
                  <span>Montant Total à encaisser :</span>
                  <span className="amount">{activeOrderModal.totalAmount} DT</span>
                </div>
              </div>
            </div>

            <div className="modal-footer-bar">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>Imprimer</span>
              </button>
              <button
                type="button"
                className="admin-btn primary"
                onClick={() => setActiveOrderModal(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 2: DELETE CONFIRMATION
          ------------------------------------------------------------- */}
      {deleteConfirmOrder && (
        <div
          className="admin-dialog-backdrop"
          onClick={() => setDeleteConfirmOrder(null)}
        >
          <div
            className="admin-confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon danger">
              <AlertTriangle size={32} />
            </div>
            <h3>Supprimer cette commande ?</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer définitivement la commande{' '}
              <strong>{deleteConfirmOrder.orderNumber}</strong> de{' '}
              <strong>{deleteConfirmOrder.customerName}</strong> ?
            </p>
            <div className="confirm-buttons">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setDeleteConfirmOrder(null)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="admin-btn danger"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
