/* eslint-disable no-console */
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const QRCodeCanvas = dynamic(
  () => import('qrcode.react').then(m => m.QRCodeCanvas),
  { ssr: false }
);
import React, { useRef, useState } from 'react';
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

  // ref kontainer QR di modal view (lebih aman daripada querySelector global)
  const qrContainerRef = useRef(null);

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
          <img src={`http://localhost:8000/storage/${qr_code}`} alt="QR" width={48} height={48} />
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch data QR code saat halaman dibuka
  React.useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      try {
        const res = await fetch(`${apiUrl}/admin/qrcodes`, {
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
            dataArray.map(item => ({
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
              promo: item.promo, // keep as object
              qr_code: item.qr_code || item.path,
              created_at: item.created_at,
            }))
          );
        }
      } catch (err) {
        // bisa tambahkan alert jika gagal
      }
    };
    fetchData();
  }, [apiUrl]);

  // Fetch data voucher, promo saat modalForm dibuka
  React.useEffect(() => {
    if (modalForm) {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      // Fetch voucher
      fetch(`${apiUrl}/admin/vouchers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(res => setVoucherList(res.data || []));
      // Fetch promo
      fetch(`${apiUrl}/admin/promos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(res => setPromoList(res.data || []));
    }
  }, [modalForm, apiUrl]);

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
      const res = await fetch(`${apiUrl}/admin/qrcodes/generate`, {
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
      const result = await res.json();
      if (res.ok && result.qrcode) {
        setFormData({ voucher_id: '', promo_id: '', tenant_name: '' });
        setModalForm(false);
        // fetch ulang data
        const resList = await fetch(`${apiUrl}/admin/qrcodes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const resultList = await resList.json();
        const dataArray = Array.isArray(resultList) ? resultList : resultList.data;
        if (resList.ok && Array.isArray(dataArray)) {
          setQrList(
            dataArray.map(item => ({
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
              promo: item.promo, // keep as object
              qr_code: item.qr_code || item.path,
              created_at: item.created_at,
            }))
          );
        }
      } else {
        alert(result.message || 'Gagal membuat QR code');
      }
    } catch (err) {
      alert('Gagal membuat QR code');
    }
  };

  const handleUpdate = () => {
    if (!formData.text) return;
    const qr_code_value = formData.text + (formData.voucher ? `|${formData.voucher}` : '');
    setQrList(
      qrList.map(item =>
        item.id === selectedItem.id
          ? { ...item, text: formData.text, voucher: formData.voucher, qr_code: qr_code_value }
          : item
      )
    );
    setFormData({ text: '', voucher: '' });
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
        setFormData({ text: '', voucher: '' });
        setModalForm(true);
      }}
    />
  );

  // helper to build target URL
  const buildTargetUrl = item => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    if (!item) return '';

    console.log('=== QR GENERATION DEBUG ===');
    console.log('Item:', item);

    if (item.promo) {
      const communityId = item.promo.community?.id || item.promo.community_id || 'default';
      console.log('Promo Community ID:', communityId);
      console.log('Promo ID:', item.promo.id);
      const qrValue = `${origin}/app/komunitas/promo/detail_promo?promoId=${item.promo.id}&communityId=${communityId}&autoRegister=1&source=qr_scan`;
      console.log('Generated QR Value:', qrValue);
      return qrValue;
    }
    if (item.voucher) {
      const id = item.voucher.id ?? item.voucher.voucher_item?.id ?? item.voucher.voucherId;
      // Voucher tidak memerlukan community_id karena bersifat global
      console.log('Voucher ID:', id);
      const qrValue = `${origin}/app/voucher/${id}?autoRegister=1&source=qr_scan`;
      console.log('Generated QR Value:', qrValue);
      return qrValue;
    }
    return '';
  };

  // Download PNG dari SVG dalam kontainer khusus
  const handleDownloadPng = () => {
    const container = qrContainerRef.current;
    const canvas = container?.querySelector('canvas');
    if (!canvas) {
      alert('Canvas QR tidak ditemukan.');
      return;
    }

    // simpan PNG
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png'); // hasil PNG base64
    link.download = `qr-${selectedItem?.tenant_name || selectedItem?.id || 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          mapData: result => {
            // Jika result sudah array, bungkus ke { data: [...] }
            if (Array.isArray(result)) {
              return { data: result, totalRow: result.length };
            }
            // Jika result.data sudah ada, biarkan
            return result;
          },
        }}
        // opsional: onRowClick untuk buka modalView
        onRowClick={item => {
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
          onSubmit={e => {
            e.preventDefault();
            selectedItem ? handleUpdate() : handleAdd();
          }}
        >
          <div>
            <label className="font-semibold">Voucher</label>
            <select
              className="input input-bordered w-full"
              value={formData.voucher_id}
              onChange={e => setFormData({ ...formData, voucher_id: e.target.value })}
            >
              <option value="">Pilih Voucher</option>
              {voucherList.length === 0 && <option value="" disabled>Tidak ada voucher</option>}
              {voucherList.map(v => (
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
              onChange={e => setFormData({ ...formData, promo_id: e.target.value })}
            >
              <option value="">Pilih Promo</option>
              {promoList.length === 0 && <option value="" disabled>Tidak ada promo</option>}
              {promoList.map(p => (
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
              onChange={e => setFormData({ ...formData, tenant_name: e.target.value })}
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
        }}
        title="QR Code Event"
        size="md"
        className="bg-background"
      >
        {selectedItem && (selectedItem.promo || selectedItem.voucher) ? (
          <div className="flex flex-col items-center gap-4 p-6" ref={qrContainerRef}>
            {/* build url and use as QR value (not JSON) */}
            {(() => {
               const qrUrl = buildTargetUrl(selectedItem);
                return (
                  <>
                    <QRCodeCanvas
                      value={qrUrl}
                      size={512}            // lebih tajam untuk cetak
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

                    <ButtonComponent
                      label="Download QR (PNG)"
                      icon={faDownload}
                      paint="primary"
                      onClick={handleDownloadPng}
                    />
                  </>
                );
            })()}
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
