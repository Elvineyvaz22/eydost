import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchTaxiProfile,
  saveTaxiSession,
  addTaxiOrder,
  type TaxiOrderRecord,
} from '../services/taxiSessionApi';
import type { TaxiOrderDraft } from '../utils/taxiLinkSession';

type Step = 'select_pickup' | 'select_dropoff' | 'confirm_ride';

type DraftInput = {
  step: Step;
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoords: google.maps.LatLngLiteral | null;
  dropoffCoords: google.maps.LatLngLiteral | null;
  pickupCountryCode: string | null;
};

type RestoreCallbacks = {
  setPickupAddress: (v: string) => void;
  setDropoffAddress: (v: string) => void;
  setPickupCoords: (v: google.maps.LatLngLiteral | null) => void;
  setDropoffCoords: (v: google.maps.LatLngLiteral | null) => void;
  setPickupCountryCode: (v: string | null) => void;
  setMapCenter: (v: google.maps.LatLngLiteral) => void;
  setMobileStep?: (s: Step) => void;
};

export function useTaxiLinkStorage(
  linkId: string | null,
  waId: string | null,
  draft: DraftInput,
  restore: RestoreCallbacks
) {
  const [orders, setOrders] = useState<TaxiOrderRecord[]>([]);
  const [profileReady, setProfileReady] = useState(!linkId);
  const [activeTab, setActiveTab] = useState<'home' | 'requests'>('home');
  const skipSaveRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildDraft = useCallback((): TaxiOrderDraft => ({
    step: draft.step,
    pickupAddress: draft.pickupAddress,
    dropoffAddress: draft.dropoffAddress,
    pickupCoords: draft.pickupCoords ?? undefined,
    dropoffCoords: draft.dropoffCoords ?? undefined,
    pickupCountryCode: draft.pickupCountryCode,
  }), [draft]);

  const persistDraft = useCallback(async () => {
    if (!linkId) return;
    await saveTaxiSession(linkId, buildDraft(), { waId });
  }, [linkId, buildDraft, waId]);

  const saveOrderToHistory = useCallback(async () => {
    if (!linkId) return;
    await saveTaxiSession(linkId, buildDraft(), { waId });
    await addTaxiOrder(linkId, buildDraft());
    const profile = await fetchTaxiProfile(linkId);
    setOrders(profile.orders.slice(0, 4));
  }, [linkId, buildDraft, waId]);

  const reloadOrders = useCallback(async () => {
    if (!linkId) return;
    const profile = await fetchTaxiProfile(linkId);
    setOrders(profile.orders.slice(0, 4));
  }, [linkId]);

  useEffect(() => {
    if (!linkId) {
      setProfileReady(true);
      return;
    }
    let cancelled = false;
    setProfileReady(false);
    fetchTaxiProfile(linkId)
      .then((profile) => {
        if (cancelled) return;
        const list = profile.orders.slice(0, 4);
        setOrders(list);

        const session = profile.session;
        let resumeStep: Step | undefined;
        if (session) {
          if (session.pickupAddress) restore.setPickupAddress(session.pickupAddress);
          if (session.dropoffAddress) restore.setDropoffAddress(session.dropoffAddress);
          if (session.pickupCoords) restore.setPickupCoords(session.pickupCoords);
          if (session.dropoffCoords) restore.setDropoffCoords(session.dropoffCoords);
          if (session.pickupCountryCode !== undefined) restore.setPickupCountryCode(session.pickupCountryCode);
          if (session.pickupCoords) restore.setMapCenter(session.pickupCoords);
          resumeStep = session.step as Step | undefined;
          if (
            restore.setMobileStep &&
            (resumeStep === 'select_pickup' || resumeStep === 'select_dropoff' || resumeStep === 'confirm_ride')
          ) {
            restore.setMobileStep(resumeStep);
          }
        }
      })
      .catch((e) => console.warn('[taxi] profile load', e))
      .finally(() => {
        if (!cancelled) {
          setProfileReady(true);
          skipSaveRef.current = false;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  useEffect(() => {
    if (!linkId || !profileReady || skipSaveRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistDraft().catch((e) => console.warn('[taxi] autosave', e));
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    linkId,
    profileReady,
    draft.step,
    draft.pickupAddress,
    draft.dropoffAddress,
    draft.pickupCoords,
    draft.dropoffCoords,
    draft.pickupCountryCode,
    persistDraft,
  ]);

  return {
    orders,
    activeTab,
    setActiveTab,
    profileReady,
    saveOrderToHistory,
    reloadOrders,
  };
}
