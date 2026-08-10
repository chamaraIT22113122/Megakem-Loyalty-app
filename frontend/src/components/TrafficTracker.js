import { useEffect } from 'react';
import { analyticsAPI } from '../services/api';

function TrafficTracker({ view, subView }) {
  useEffect(() => {
    // Detect device type
    const getDeviceType = () => {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'Tablet';
      }
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'Mobile';
      }
      return 'Desktop';
    };

    let memberId = null;
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        memberId = userInfo._id || userInfo.id || null;
      }
    } catch (e) {
      // ignore parsing errors
    }

    const currentPath = `/${view}${subView ? `/${subView}` : ''}`;

    const payload = {
      path: currentPath,
      url: window.location.href,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      memberId
    };

    // Fire and forget
    analyticsAPI.trackPageView(payload).catch((err) => {
      console.error('Failed to track page view', err);
    });
  }, [view, subView]); // Re-run whenever view or subView changes

  return null; // Silent component
}

export default TrafficTracker;
