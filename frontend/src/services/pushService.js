import api from './api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeUser = async () => {
  if (!('serviceWorker' in navigator)) {
    return { success: false, error: 'Service workers are not supported.' };
  }
  
  if (!('PushManager' in window)) {
    return { success: false, error: 'Push notifications are not supported.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get public key from backend
    const { data } = await api.get('/push/vapidPublicKey');
    const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    // Send subscription to backend
    await api.post('/push/subscribe', subscription);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to subscribe user:', error);
    return { success: false, error: error.message };
  }
};
