import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ModalComponent } from '../../base.components/modal/Modal.component';
import { get } from '../../../helpers/api.helpers';

// Simple helper to build full image URL
const buildBaseUrl = (api?: string) => (api || '').replace(/\/$/, '').replace(/\/api\/?$/, '');
const toImageUrl = (raw?: string | null, base?: string) => {
  if (!raw) return '';
  const s = String(raw);
  if (/^https?:\/\//i.test(s)) return s;
  const b = buildBaseUrl(base);
  return [b, s.replace(/^\/+/, '')].filter(Boolean).join('/');
};

export default function HuehuyAdPopup() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [ad, setAd] = useState<any | null>(null);
  const api = process.env.NEXT_PUBLIC_API_URL as string | undefined;

  const isPromoOrVoucherPage = useMemo(() => {
    const pathOnly = (router.asPath || '').split('?')[0];
    return pathOnly.startsWith('/app/komunitas/promo/') || pathOnly.startsWith('/app/voucher/');
  }, [router.asPath]);

  const storageKey = useMemo(() => {
    // tie to the concrete path (with id) so different promo/voucher can show once each
    const pathOnly = (router.asPath || '').split('?')[0];
    return `huehuy_ad_popup_shown_${pathOnly}`;
  }, [router.asPath]);

  const fetchAd = useCallback(async (): Promise<boolean> => {
    // Try public cube ads first (no auth), then protected, then public list
    try {
      let resp = await get({ path: 'huehuy-ads-public/cube-ads' });
      let data = resp?.data?.data || null;

      if (!data) {
        // fallback to protected if user is authenticated
        const respAuth = await get({ path: 'huehuy-ads/cube-ads' });
        data = respAuth?.data?.data || null;
      }

      if (!data) {
        const list = await get({ path: 'huehuy-ads-public' });
        const items = list?.data?.data || [];
        if (Array.isArray(items) && items.length > 0) {
          const random = items[Math.floor(Math.random() * items.length)];
          setAd(random);
          setShow(true);
          return true;
        }
        setAd(null);
        setShow(false);
        return false;
      }

  setAd(data);
  setShow(true);
  return true;
    } catch (e) {
      setAd(null);
      setShow(false);
      return false;
    }
  }, []);

  useEffect(() => {
  if (!router.isReady) return;
  if (!isPromoOrVoucherPage) return;
  if (typeof window === 'undefined') return;

    // only show once per path per tab session
    const already = sessionStorage.getItem(storageKey);
    if (already === '1') return;

    (async () => {
      const ok = await fetchAd();
      if (ok) sessionStorage.setItem(storageKey, '1');
    })();
  }, [router.isReady, isPromoOrVoucherPage, storageKey, fetchAd]);

  const imgUrl = useMemo(() => toImageUrl(ad?.picture_source, api), [ad?.picture_source, api]);

  if (!show || !ad) return null;

  return (
    <ModalComponent
      show={show}
      onClose={() => setShow(false)}
      title={ad?.title || 'Iklan'}
      tip={ad?.description || ''}
      width="md"
      footer={null}
    >
      <div className="space-y-4">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={ad?.title || 'Iklan'}
            className="w-full h-auto rounded-md object-contain"
          />
        ) : null}
        {ad?.description ? (
          <p className="text-sm text-gray-600 whitespace-pre-line">{ad.description}</p>
        ) : null}
      </div>
    </ModalComponent>
  );
}
