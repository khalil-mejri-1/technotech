import AdminPushToken from '../models/AdminPushToken.js';

/**
 * Send an Expo Push Notification to all active admin devices
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} [options.data] - Additional JSON data payload
 * @param {string} [options.sound='default'] - Notification sound
 * @param {string} [options.channelId='orders'] - Android notification channel
 */
export async function sendExpoPushNotification({
  title,
  body,
  data = {},
  sound = 'default',
  channelId = 'orders',
}) {
  try {
    const activeTokensDoc = await AdminPushToken.find({ isActive: true });
    if (!activeTokensDoc || activeTokensDoc.length === 0) {
      console.log('ℹ️ [Push] Aucun token admin enregistré pour recevoir les notifications.');
      return { success: false, reason: 'no_active_tokens' };
    }

    const tokens = activeTokensDoc.map((d) => d.token).filter(Boolean);
    console.log(`🔔 [Push] Envoi de notification à ${tokens.length} appareil(s) admin :`, tokens);

    const messages = tokens.map((pushToken) => ({
      to: pushToken,
      sound,
      title,
      body,
      data,
      priority: 'high',
      channelId,
      badge: 1,
      _displayInForeground: true,
    }));

    // Expo allows up to 100 messages per chunk
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('✅ [Push] Réponse Expo Push API :', JSON.stringify(result));

    // Handle invalid / unregistered tokens cleanup
    if (result && Array.isArray(result.data)) {
      result.data.forEach((ticket, idx) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const badToken = tokens[idx];
          console.warn(`⚠️ [Push] Désactivation du token non enregistré : ${badToken}`);
          AdminPushToken.updateOne({ token: badToken }, { isActive: false }).exec();
        }
      });
    }

    return { success: true, result };
  } catch (error) {
    console.error('❌ [Push] Erreur lors de l’envoi de notification Expo :', error);
    return { success: false, error: error.message };
  }
}
