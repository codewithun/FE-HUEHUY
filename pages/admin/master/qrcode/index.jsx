/* eslint-disable no-console */
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
  SelectComponent,
  TableSupervisionComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import QRForm from '../../../../components/qr-generate-form/qr-form';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

export default function QRCodeCrud() {
  // HAPUS state daftar manual, serahkan fetch ke TableSupervision
  // const [qrList, setQrList] = useState([]);
  const [modalForm, setModalForm] = useState(false);
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

  // Helper membentuk URL image storage yang aman
  const toStorageUrl = (path) => {
    if (!path) return '';
    // kalau backend sudah kirim absolute URL, langsung pakai
    if (/^https?:\/\//i.test(path)) return path;
    return `${storageBase}/storage/${path}`.replace(/([^:]\/)\/+/g, '$1');
  };

  const columns = [
    {
      selector: 'tenant_name',
      label: 'Nama Tenant',
      sortable: true,
      item: ({ tenant_name }) => <span className="font-semibold">{tenant_name}</span>,
    },
    {
      selector: 'voucher',
      label: 'Voucher',
      item: ({ voucher }) =>
        voucher ? (voucher.name || voucher.kode || voucher.code || voucher.id) : '-',
    },
    {
      selector: 'promo',
      label: 'Promo',
      item: ({ promo }) =>
        promo ? (promo.name || promo.kode || promo.code || promo.id) : '-',
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
      item: ({ created_at }) => created_at,
    },
  ];

  // Fetch data voucher & promo (sekali) agar opsi tersedia untuk form edit bawaan TableSupervision
  useEffect(() => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${apiBase}/admin/vouchers`, { headers })
      .then((res) => res.json())
      .then((res) => setVoucherList(res?.data || []))
      .catch(() => setVoucherList([]));

    fetch(`${apiBase}/admin/promos`, { headers })
      .then((res) => res.json())
      .then((res) => setPromoList(res?.data || []))
      .catch(() => setPromoList([]));
  }, [apiBase]);

  const handleAdd = async (payload) => {
    // payload: { voucher_id|null, promo_id|null, tenant_name }
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      const res = await fetch(`${apiBase}/admin/qrcodes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          voucher_id: payload.voucher_id || null,
          promo_id: payload.promo_id || null,
          tenant_name: payload.tenant_name,
        }),
      });

      let result = {};
      try { result = await res.json(); } catch { result = {}; }

      if (res.ok) {
        setModalForm(false);
        setSelectedItem(null);
        setRefreshToggle((s) => !s); // trigger TableSupervision refetch
      } else {
        alert(result.message || 'Gagal membuat QR code');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuat QR code');
    }
  };

  const handleUpdate = async (payload) => {
    if (!selectedItem?.id) {
      setModalForm(false);
      return;
    }
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      const res = await fetch(`${apiBase}/admin/qrcodes/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          voucher_id: payload.voucher_id || null,
          promo_id: payload.promo_id || null,
          tenant_name: payload.tenant_name,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setModalForm(false);
        setSelectedItem(null);
        setRefreshToggle((s) => !s);
      } else {
        alert(result.message || 'Gagal memperbarui QR code');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui QR code');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem?.id) return;
    try {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      const res = await fetch(`${apiBase}/admin/qrcodes/${selectedItem.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setModalDelete(false);
        setSelectedItem(null);
        setRefreshToggle((s) => !s);
      } else {
        alert(result.message || 'Gagal menghapus QR code');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus QR code');
    }
  };

  const topBarActions = (
    <ButtonComponent
      label="Tambah Baru"
      icon={faPlus}
      paint="primary"
      onClick={() => {
        setSelectedItem(null);
        setModalForm(true);
      }}
    />
  );

  // helper to build target URL (untuk nilai QR yang dipreview)
  const buildTargetUrl = (item) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    if (!item) return '';

    if (item.promo) {
      const communityId = item.promo?.community?.id || item.promo?.community_id || 'default';
      return `${origin}/app/komunitas/promo/detail_promo?promoId=${item.promo.id}&communityId=${communityId}&autoRegister=1&source=qr_scan`;
    }
    if (item.voucher) {
      const id = item.voucher.id ?? item.voucher.voucher_item?.id ?? item.voucher.voucherId;
      return `${origin}/app/voucher/${id}?autoRegister=1&source=qr_scan`;
    }
    return '';
  };

  // setiap selectedItem berubah, stabilkan qrUrl di state
  useEffect(() => {
    if (!selectedItem) return setQrUrl('');
    setQrUrl(buildTargetUrl(selectedItem));
    // reset ref biar clean
    qrCanvasRef.current = null;
  }, [selectedItem]);

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
        // Set form bawaan TableSupervision (khusus EDIT) agar hanya tampil field penting
        formControl={{
          contentType: 'multipart/form-data',
        }}
        formUpdateControl={{
          size: 'md',
          customDefaultValue: (row) => ({
            voucher_id: row?.voucher?.id || '',
            promo_id: row?.promo?.id || '',
            tenant_name: row?.tenant_name || '',
          }),
          custom: [
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const v = formControl('voucher_id');
                const p = formControl('promo_id');

                const onVoucherChange = (val) => {
                  if (val === undefined || val === null || val === '') {
                    // kosongkan voucher_id -> unregister agar tidak terkirim sebagai ''
                    v.unregister?.();
                  } else {
                    v.onChange?.(val);
                    // saat pilih voucher, kosongkan promo
                    p.unregister?.();
                  }
                };

                return (
                  <div className="col-span-12">
                    <SelectComponent
                      name="voucher_id"
                      label="Voucher"
                      placeholder="Pilih voucher…"
                      tip="Pilih salah satu: Voucher atau Promo"
                      options={(voucherList || []).map((vv) => ({
                        label: vv.name || vv.kode || vv.code || vv.id,
                        value: vv.id,
                      }))}
                      clearable
                      searchable
                      value={v.value}
                      onChange={onVoucherChange}
                    />
                    {v.value ? (
                      <div className="mt-1">
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => v.unregister?.()}
                        >
                          Kosongkan pilihan voucher
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              },
              col: 12,
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const v = formControl('voucher_id');
                const p = formControl('promo_id');

                const onPromoChange = (val) => {
                  if (val === undefined || val === null || val === '') {
                    p.unregister?.();
                  } else {
                    p.onChange?.(val);
                    // saat pilih promo, kosongkan voucher
                    v.unregister?.();
                  }
                };

                return (
                  <div className="col-span-12">
                    <SelectComponent
                      name="promo_id"
                      label="Promo"
                      placeholder="Pilih promo…"
                      tip="Kosongkan jika menggunakan Voucher"
                      options={(promoList || []).map((pp) => ({
                        label: pp.name || pp.kode || pp.code || pp.id,
                        value: pp.id,
                      }))}
                      clearable
                      searchable
                      value={p.value}
                      onChange={onPromoChange}
                    />
                    {p.value ? (
                      <div className="mt-1">
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => p.unregister?.()}
                        >
                          Kosongkan pilihan promo
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              },
              col: 12,
            },
            {
              type: 'default',
              construction: {
                name: 'tenant_name',
                label: 'Nama Tenant',
                placeholder: 'Masukkan nama tenant',
                validations: { required: 'Nama tenant wajib diisi' },
              },
              col: 12,
            },
          ],
        }}
        customTopBar={topBarActions}
        noControlBar={false}
        searchable={true}
        setToRefresh={refreshToggle}
        actionControl={{
          // Matikan detail bawaan karena kita pakai modal view custom
          except: ['detail'],
        }}
        fetchControl={{
          path: 'admin/qrcodes',
          // gunakan header default (helpers akan sisipkan Authorization otomatis dari cookie)
        }}
        onRowClick={(item) => {
          setSelectedItem(item);
          setModalView(true);
        }}
      />

      {/* Modal Form (pakai komponen QRForm) */}
      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          setSelectedItem(null);
        }}
        title={selectedItem ? 'Ubah QR Event' : 'Tambah QR Event'}
        size="md"
        className="bg-background"
      >
        <QRForm
          mode={selectedItem ? 'edit' : 'create'}
          initialData={{
            voucher_id: selectedItem?.voucher?.id || '',
            promo_id: selectedItem?.promo?.id || '',
            tenant_name: selectedItem?.tenant_name || '',
          }}
          voucherList={voucherList}
          promoList={promoList}
          onCancel={() => {
            setModalForm(false);
            setSelectedItem(null);
          }}
          onSubmit={(payload) => (selectedItem ? handleUpdate(payload) : handleAdd(payload))}
        />
      </FloatingPageComponent>

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
        {selectedItem && (selectedItem.promo || selectedItem.voucher) ? (
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
                    {selectedItem.promo
                      ? `Promo: ${selectedItem.promo.name || selectedItem.promo.kode || selectedItem.promo.id}`
                      : `Voucher: ${selectedItem.voucher.name || selectedItem.voucher.kode || selectedItem.voucher.id}`}
                  </div>
                  <div className="text-sm text-secondary mt-1">
                    Community:{' '}
                    {selectedItem.promo?.community_id ||
                      selectedItem.voucher?.community?.id ||
                      selectedItem.voucher?.community_id ||
                      'default'}
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
        open={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDelete}
        title="Hapus QR Event"
        message={`Apakah Anda yakin ingin menghapus QR Event "${selectedItem?.tenant_name || selectedItem?.id || ''}"?`}
      />
    </>
  );
}

QRCodeCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};