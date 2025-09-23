/* eslint-disable no-console */
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  InputComponent,
  ModalConfirmComponent,
  SelectComponent,
  TableSupervisionComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

export default function QRCodeCrud() {
  const [modalView, setModalView] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [voucherList, setVoucherList] = useState([]);
  const [promoList, setPromoList] = useState([]);
  const [refreshToggle, setRefreshToggle] = useState(false);

  // container untuk render QR + ref langsung ke canvas (hanya untuk preview)
  const qrContainerRef = useRef(null);
  const qrCanvasRef = useRef(null);

  // qrUrl disimpan di state supaya tidak re-render aneh
  const [qrUrl, setQrUrl] = useState('');

  // Base API & Storage
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiBase = apiUrl.replace(/\/+$/, '');
  // Hapus '/api' hanya jika berada di UJUNG string
  const storageBase = apiBase.replace(/\/api\/?$/, '');

  const authHeader = useCallback(() => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Helper membentuk URL image storage yang aman
  const toStorageUrl = (path) => {
    if (!path) return '';
    // kalau backend sudah kirim absolute URL, langsung pakai
    if (/^https?:\/\//i.test(path)) return path;
    return `${storageBase}/storage/${path}`.replace(/([^:]\/)\/+/g, '$1');
  };

  // Helper format tanggal (lokal Indonesia)
  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper ambil label/ nama terbaik dari object voucher/promo
  const getLabel = (item) => {
    if (!item) return '';
    return (
      item.name ||
      item.nama ||
      item.title ||
      item.kode ||
      item.code ||
      item.label ||
      (item.id !== undefined ? String(item.id) : JSON.stringify(item))
    );
  };

  const getVoucherLabel = useCallback((id) => {
    if (!id) return '';
    const v = voucherList.find((x) => String(x.id) === String(id));
    return v ? getLabel(v) : `Voucher #${id}`;
  }, [voucherList]);

  const getPromoLabel = useCallback((id) => {
    if (!id) return '';
    const p = promoList.find((x) => String(x.id) === String(id));
    return p ? getLabel(p) : `Promo #${id}`;
  }, [promoList]);

  // Fetch vouchers dan promos
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch voucher - Remove /api/ prefix
        const voucherRes = await fetch(`${apiBase}/admin/vouchers`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (voucherRes.ok) {
          const voucherResult = await voucherRes.json();
          console.log('Voucher result:', voucherResult); // Add debug log
          setVoucherList(Array.isArray(voucherResult.data) ? voucherResult.data : []);
        } else {
          console.error('Failed to fetch vouchers:', voucherRes.status);
        }

        // Fetch promo - Remove /api/ prefix
        const promoRes = await fetch(`${apiBase}/admin/promos`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (promoRes.ok) {
          const promoResult = await promoRes.json();
          console.log('Promo result:', promoResult); // Add debug log
          setPromoList(Array.isArray(promoResult.data) ? promoResult.data : []);
        } else {
          console.error('Failed to fetch promos:', promoRes.status);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
        setVoucherList([]);
        setPromoList([]);
      }
    };
    fetchOptions();
  }, [apiBase, authHeader]);

  const columns = useMemo(() => [
    {
      selector: 'tenant_name',
      label: 'Nama Tenant',
      sortable: true,
      item: ({ tenant_name }) => <span className="font-semibold">{tenant_name}</span>,
    },
    {
      selector: 'voucher_id',
      label: 'Voucher',
      item: ({ voucher_id, voucher }) => {
        if (voucher) return getLabel(voucher);
        return voucher_id ? getVoucherLabel(voucher_id) : '-';
      },
    },
    {
      selector: 'promo_id',
      label: 'Promo',
      item: ({ promo_id, promo }) => {
        if (promo) return getLabel(promo);
        return promo_id ? getPromoLabel(promo_id) : '-';
      },
    },
    {
      selector: 'qr_code',
      label: 'QR Code',
      width: '120px',
      item: ({ qr_code }) =>
        qr_code ? (
          <Image
            src={toStorageUrl(qr_code)}
            alt="QR"
            width={48}
            height={48}
            unoptimized
          />
        ) : (
          '-'
        ),
    },
    {
      selector: 'created_at',
      label: 'Tanggal Dibuat',
      sortable: true,
      item: ({ created_at }) => formatDate(created_at),
    },
  ], [getVoucherLabel, getPromoLabel]);

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      // Also fix the delete endpoint - remove /api/ prefix
      const res = await fetch(`${apiBase}/admin/qrcodes/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setRefreshToggle((s) => !s);
        alert('QR Code berhasil dihapus');
      } else {
        console.error('Delete failed:', body);
        alert(body?.message || 'Gagal menghapus QR Code');
      }
    } catch (error) {
      console.error('Error deleting QR Code:', error);
      alert('Gagal menghapus QR Code: Network error');
    } finally {
      setModalDelete(false);
      setSelectedItem(null);
    }
  };

  // helper to build target URL (untuk nilai QR yang dipreview)
  const buildTargetUrl = (item) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    if (!item) return '';

    if (item.promo || item.promo_id) {
      const promo = item.promo || promoList.find(p => String(p.id) === String(item.promo_id));
      if (promo) {
        const communityId = promo?.community?.id || promo?.community_id || 'default';
        return `${origin}/app/komunitas/promo/detail_promo?promoId=${promo.id}&communityId=${communityId}&autoRegister=1&source=qr_scan`;
      }
    }
    if (item.voucher || item.voucher_id) {
      const voucher = item.voucher || voucherList.find(v => String(v.id) === String(item.voucher_id));
      if (voucher) {
        const id = voucher.id ?? voucher.voucher_item?.id ?? voucher.voucherId;
        return `${origin}/app/voucher/${id}?autoRegister=1&source=qr_scan`;
      }
    }
    return '';
  };

  // setiap selectedItem berubah, stabilkan qrUrl di state
  useEffect(() => {
    if (!selectedItem) return setQrUrl('');
    setQrUrl(buildTargetUrl(selectedItem));
    // reset ref biar clean
    qrCanvasRef.current = null;
  }, [selectedItem, promoList, voucherList]);

  // === Download: pilih otomatis server-PNG atau FE konversi SVG -> PNG ===
  const smartDownload = async () => {
    try {
      const path = selectedItem?.qr_code || selectedItem?.path;
      if (!path) {
        alert('Path QR di server tidak ditemukan.');
        return;
      }

      const fileUrl = toStorageUrl(path);

      // Hindari mixed-content: FE https, file http
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fileUrl.startsWith('http:')) {
        alert('Gagal karena mixed-content (FE https, API http). Pastikan API/storage pakai HTTPS.');
        return;
      }

      // Coba GET untuk cek content-type
      const res = await fetch(fileUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image/png') || /\.png(\?|#|$)/i.test(fileUrl)) {
        // langsung unduh PNG dari server
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `qr-${selectedItem?.tenant_name || selectedItem?.id || 'code'}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Kalau SVG, ambil sebagai text lalu convert ke PNG
      const svgText = await res.text();

      // Buat Image dari data:URL SVG (hindari unicode issue)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));

      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = svg64;
      });

      // Render ke canvas resolusi besar (tajam cetak)
      const TARGET = 2048; // px sisi lebar
      const ratio = img.width && img.height ? img.height / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = TARGET;
      canvas.height = Math.round(TARGET * ratio);

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngDataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngDataUrl;
      a.download = `qr-${selectedItem?.tenant_name || selectedItem?.id || 'code'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Unduh QR gagal:', e);
      alert('Tidak bisa mengunduh QR. Cek URL /storage, HTTPS, dan CORS server.');
    }
  };

  return (
    <>
      <TableSupervisionComponent
        title="Generator QR Event"
        columnControl={{ custom: columns }}
        searchable
        noControlBar={false}
        setToRefresh={refreshToggle}
        actionControl={{
          except: ['detail', 'edit'], // Remove edit from actions
          onAdd: () => setSelectedItem(null),
          onDelete: (item) => {
            setSelectedItem(item);
            setModalDelete(true);
          },
        }}
        fetchControl={{
          path: 'admin/qrcodes',
          includeHeaders: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
        }}
        // Default values untuk form
        formDefaultValue={{
          voucher_id: '',
          promo_id: '',
          tenant_name: '',
        }}
        // Validasi sebelum submit
        beforeSubmit={(payload) => {
          if (!payload.tenant_name?.trim()) {
            alert('Nama tenant wajib diisi');
            return false;
          }
          if (!payload.voucher_id && !payload.promo_id) {
            alert('Voucher atau Promo harus diisi salah satu.');
            return false;
          }
          return true;
        }}
        formControl={{
          contentType: 'application/json',
          endpoint: 'admin/qrcodes', // Changed from 'admin/qrcodes/generate'
          method: 'POST',
          transformData: (data) => {
            console.log('Sending data:', data); // Debug log
            return {
              voucher_id: data.voucher_id || null,
              promo_id: data.promo_id || null,
              tenant_name: data.tenant_name,
            };
          },
          custom: [
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('voucher_id');
                const current = fc.value ?? '';
                return (
                  <div className="col-span-12">
                    <SelectComponent
                      name="voucher_id"
                      label="Voucher"
                      placeholder="Pilih Voucher..."
                      value={current}
                      onChange={fc.onChange}
                      clearable={true}
                      options={voucherList.map((v) => ({
                        label: getLabel(v),
                        value: v.id,
                      }))}
                    />
                  </div>
                );
              },
              col: 12,
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('promo_id');
                const current = fc.value ?? '';
                return (
                  <div className="col-span-12">
                    <SelectComponent
                      name="promo_id"
                      label="Promo"
                      placeholder="Pilih Promo..."
                      value={current}
                      onChange={fc.onChange}
                      clearable={true}
                      options={promoList.map((p) => ({
                        label: getLabel(p),
                        value: p.id,
                      }))}
                    />
                  </div>
                );
              },
              col: 12,
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <div className="col-span-12">
                  <InputComponent
                    name="tenant_name"
                    label="Nama Tenant *"
                    placeholder="Masukkan nama tenant"
                    required
                    {...formControl('tenant_name')}
                  />
                </div>
              ),
              col: 12,
            },
          ],
        }}
        // Custom row click untuk modal view
        onRowClick={(item) => {
          setSelectedItem(item);
          setModalView(true);
        }}
      />

      {/* Modal View QR */}
      <FloatingPageComponent
        show={modalView}
        onClose={() => {
          setModalView(false);
          setSelectedItem(null);
          setQrUrl('');
        }}
        title="QR Code Event"
        size="md"
        className="bg-background"
      >
        {selectedItem && (selectedItem.promo || selectedItem.voucher || selectedItem.promo_id || selectedItem.voucher_id) ? (
          <div className="flex flex-col items-center gap-4 p-6" ref={qrContainerRef}>
            {qrUrl ? (
              <>
                {/* Preview QR untuk discan langsung */}
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={qrUrl}
                  size={512}
                  includeMargin={true}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
                <div className="text-center">
                  <div className="font-bold text-primary text-lg">
                    {selectedItem.promo || selectedItem.promo_id
                      ? `Promo: ${selectedItem.promo ? getLabel(selectedItem.promo) : getPromoLabel(selectedItem.promo_id)}`
                      : `Voucher: ${selectedItem.voucher ? getLabel(selectedItem.voucher) : getVoucherLabel(selectedItem.voucher_id)}`}
                  </div>
                  <div className="text-sm text-secondary mt-1">
                    Tenant: {selectedItem.tenant_name}
                  </div>
                </div>

                {/* Satu tombol unduh pintar */}
                <div className="flex gap-2">
                  <ButtonComponent
                    label="Download QR (PNG)"
                    icon={faDownload}
                    paint="primary"
                    onClick={smartDownload}
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-lg text-gray-500 font-semibold">Menyiapkan QR…</div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="text-center text-lg text-gray-500 font-semibold">QR CODE BELUM DI BUAT</div>
          </div>
        )}
      </FloatingPageComponent>

      {/* Modal Delete Confirmation */}
      <ModalConfirmComponent
        title="Hapus QR Code"
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelectedItem(null);
        }}
        onSubmit={handleDelete}
      >
        <p className="text-gray-600 mb-4">
          Apakah Anda yakin ingin menghapus QR Code untuk tenant {selectedItem?.tenant_name}?
        </p>
        <p className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
      </ModalConfirmComponent>
    </>
  );
}

QRCodeCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};