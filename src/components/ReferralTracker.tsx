import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getReferralCode } from '../utils/whatsapp';

export default function ReferralTracker() {
  const location = useLocation();

  useEffect(() => {
    getReferralCode();
  }, [location.search]);

  return null;
}
