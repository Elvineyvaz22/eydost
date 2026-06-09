import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getReferralCode, getTrafficCampaign, getTrafficMedium, getTrafficReferrerHost, getTrafficSource, trackAgentLead } from '../utils/whatsapp';

export default function ReferralTracker() {
  const location = useLocation();

  useEffect(() => {
    const ref = getReferralCode();
    if (!ref) return;

    const signature = `${location.pathname}${location.search}`;
    const seenKey = 'eydost_referral_tracker_seen';
    const seen = sessionStorage.getItem(seenKey);
    if (seen === signature) return;
    sessionStorage.setItem(seenKey, signature);

    const source = getTrafficSource() || getTrafficReferrerHost();
    const medium = getTrafficMedium();
    const campaign = getTrafficCampaign();

    trackAgentLead({
      productType: location.pathname.includes('/taxi') ? 'taxi' : 'esim',
      packageCode: ref,
      packageName: source || undefined,
      viewedPackage: source ? `Source: ${source}` : undefined,
      page: location.pathname,
    }).catch(() => void 0);

    if (source || medium || campaign) {
      sessionStorage.setItem(
        'eydost_referral_tracker_meta',
        JSON.stringify({ source, medium, campaign, path: signature })
      );
    }
  }, [location.search]);

  return null;
}
