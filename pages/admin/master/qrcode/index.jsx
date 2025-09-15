/* eslint-disable no-console */
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import React, { useRef, useState, useEffect } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
  TableSupervisionComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

export default function QRCodeCrud() {
  const [qrList, setQrList] = useState([]);
  const [modalForm, setModalForm] = useState(false);
  const [modalView, setModalView] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ voucher_id: '', promo_id: '', tenant_name: '' });
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

  // Fetch data QR code saat halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      try {
        const res = await fetch(`${apiBase}/admin/qrcodes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        const dataArray = Array.isArray(result) ? result : result.data;
        if (res.ok && Array.isArray(dataArray)) {
          setQrList(
            dataArray.map((item) => ({
              id: item.id,
              tenant_name: item.tenant_name,
              text: [
                item.tenant_name,
                item.voucher?.name || item.voucher?.kode || item.voucher?.code,
                item.promo?.name || item.promo?.kode || item.promo?.code,
              ]
                .filter(Boolean)
                .join(' | '),
              voucher: item.voucher, // keep as object
              promo: item.promo,     // keep as object
              // backend bisa kirim path relatif (qr_code/path) atau absolute url
              qr_code: item.qr_code || item.path,
              created_at: item.created_at,
            }))
          );
        }
      } catch (err) {
        console.error('Fetch qrcodes failed:', err);
      }
    };
    fetchData();
  }, [apiBase]);

  // Fetch data voucher, promo saat modalForm dibuka
  useEffect(() => {
    if (modalForm) {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      // Fetch voucher
      fetch(`${apiBase}/admin/vouchers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(res => setVoucherList(res.data || []))
        .catch(() => setVoucherList([]));
      // Fetch promo
      fetch(`${apiBase}/admin/promos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(res => setPromoList(res.data || []))
        .catch(() => setPromoList([]));
    }
  }, [modalForm, apiBase]);

  const handleAdd = async () => {
    if (!formData.tenant_name) {
      alert('Nama tenant wajib diisi');
      return;
    }
    if (!formData.voucher_id && !formData.promo_id) {
      alert('Voucher atau Promo harus diisi salah satu.');
      return;
    }
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
          voucher_id: formData.voucher_id || null,
          promo_id: formData.promo_id || null,
          tenant_name: formData.tenant_name,
        }),
      });

      let result = {};
      try {
        result = await res.json(); // antisipasi 204/500 tanpa body
      } catch {
        result = {};
      }

      if (res.ok && result.qrcode) {
        setFormData({ voucher_id: '', promo_id: '', tenant_name: '' });
        setModalForm(false);
        // trigger TableSupervisionComponent to refresh via setToRefresh prop
        setRefreshToggle((s) => !s);
      } else {
        alert(result.message || 'Gagal membuat QR code');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuat QR code');
    }
  };

  const handleUpdate = () => {
    // FE-only placeholder; sambungkan ke API update jika diperlukan
    if (!formData.tenant_name) return;
    setModalForm(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    setQrList(qrList.filter(item => item.id !== selectedItem.id));
    setModalDelete(false);
    setSelectedItem(null);
  };

  const topBarActions = (
    <ButtonComponent
      label="Tambah Baru"
      icon={faPlus}
      paint="primary"
      onClick={() => {
        setSelectedItem(null);
        setFormData({ voucher_id: '', promo_id: '', tenant_name: '' });
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
        data={qrList}
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        noControlBar={false}
        searchable={true}
        setToRefresh={refreshToggle}
        // 🔴 Nonaktifkan modal detail default (klik row tidak ngapa2in)
        actionControl={{ except: ['detail'] }}
        fetchControl={{
          path: 'admin/qrcodes',
          method: 'GET',
          headers: () => {
            const encryptedToken = Cookies.get(token_cookie_name);
            const token = encryptedToken ? Decrypt(encryptedToken) : '';
            return {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            };
          },
          mapData: (result) => {
            if (Array.isArray(result)) {
              return { data: result, totalRow: result.length };
            }
            return result;
          },
        }}
        // Keep your custom row click handler for the QR view modal
        onRowClick={(item) => {
          setSelectedItem(item);
          setModalView(true);
        }}
      />

      {/* Modal Form */}
      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          setSelectedItem(null);
          setFormData({ voucher_id: '', promo_id: '', tenant_name: '' });
        }}
        title={selectedItem ? 'Ubah QR Event' : 'Tambah QR Event'}
        size="md"
        className="bg-background"
      >
        <form
          className="flex flex-col gap-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            selectedItem ? handleUpdate() : handleAdd();
          }}
        >
          <div>
            <label className="font-semibold">Voucher</label>
            <select
              className="input input-bordered w-full"
              value={formData.voucher_id}
              onChange={(e) => setFormData({ ...formData, voucher_id: e.target.value })}
            >
              <option value="">Pilih Voucher</option>
              {voucherList.length === 0 && <option value="" disabled>Tidak ada voucher</option>}
              {voucherList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name || v.kode || v.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold">Promo</label>
            <select
              className="input input-bordered w-full"
              value={formData.promo_id}
              onChange={(e) => setFormData({ ...formData, promo_id: e.target.value })}
            >
              <option value="">Pilih Promo</option>
              {promoList.length === 0 && <option value="" disabled>Tidak ada promo</option>}
              {promoList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.kode || p.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold">Nama Tenant</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan nama tenant"
              value={formData.tenant_name}
              onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <ButtonComponent
              label="Batal"
              paint="secondary"
              variant="outline"
              onClick={() => {
                setModalForm(false);
                setSelectedItem(null);
                setFormData({ voucher_id: '', promo_id: '', tenant_name: '' });
              }}
            />
            <ButtonComponent label={selectedItem ? 'Perbarui' : 'Simpan'} paint="primary" type="submit" />
          </div>
        </form>
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
        message={`Apakah Anda yakin ingin menghapus QR Event "${selectedItem?.text}"?`}
      />
    </>
  );
}

QRCodeCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};