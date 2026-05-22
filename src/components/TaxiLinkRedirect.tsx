import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Bot bəzən ana səhifəyə ?id= göndərir — birbaşa /taxi-yə yönləndir.
 */
export default function TaxiLinkRedirect() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const id = params.get('id') || params.get('bookingId');
    if (!id?.trim()) return;
    if (pathname === '/taxi' || pathname === '/taxi-order') return;
    navigate({ pathname: '/taxi', search: params.toString() }, { replace: true });
  }, [pathname, search, navigate]);

  return null;
}
