/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
  TableSupervisionComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import { useRouter } from 'next/router';
import VoucherForm from '../../../../components/voucher/VoucherForm';

/* -------------------- Helpers -------------------- */

// Normalisasi base API (hapus trailing /api)
const getApiBase = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return raw.replace(/\/api\/?$/, '');
};

// Build URL gambar (support path relatif dari storage)
const buildImageUrl = (raw) => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw; // absolute
  const base = getApiBase();
  let path = String(raw).replace(/^\/+/, '');
  path = path.replace(/^api\/storage\//, 'storage/');
  if (!/^storage\//.test(path)) path = `storage/${path}`;
  return `${base}/${path}`;
};

// Tanggal Indonesia
const formatDateID = (raw) => {
  if (!raw) return '-';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

// Untuk value <input type="date">
const toDateInputValue = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatStockVoucher = (n) => `${Number(n ?? 0)} voucher`;

/* -------------------- Page -------------------- */

function VoucherCrud() {
  const router = useRouter();

  const [voucherList, setVoucherList] = useState([]);
  const [modalForm, setModalForm] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    type: '',
    valid_until: '',
    tenant_location: '',
    stock: 0,
    code: '',
    community_id: '',
    target_type: 'all', // all | user | community
    target_user_id: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);

  const apiBase = useMemo(() => getApiBase(), []);
  const authHeader = () => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return { Authorization: `Bearer ${token}` };
  };

  const getUserLabel = (id) => {
    if (!id) return '';
    const u = users.find((x) => String(x.id) === String(id));
    return u?.name || u?.email || `User #${id}`;
  };
  const getCommunityLabel = (id) => {
    if (!id) return '';
    const c = communities.find((x) => String(x.id) === String(id));
    return c?.name || `Community #${id}`;
  };

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      const res = await fetch(`${apiBase}/api/admin/vouchers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const result = await res.json();
      setVoucherList(Array.isArray(result.data) ? result.data : []);
    } catch {
      setVoucherList([]);
    }
  };

  useEffect(() => {
    fetchVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // Fetch communities
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/communities`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        const result = await res.json();
        setCommunities(Array.isArray(result.data) ? result.data : []);
      } catch {
        setCommunities([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // Fetch users
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/users`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        const result = await res.json();
        setUsers(Array.isArray(result.data) ? result.data : []);
      } catch {
        setUsers([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // Upload image (hanya untuk local preview kalau kamu tetap pakai formData di halaman ini)
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setFormData((s) => ({ ...s, image: '' }));
    }
  };

  // Submit (create / update) — dipakai oleh VoucherForm via onSubmit
  const submitVoucher = async (body) => {
    const isUpdate = Boolean(selectedVoucher);
    const url = isUpdate
      ? `${apiBase}/api/admin/vouchers/${selectedVoucher.id}`
      : `${apiBase}/api/admin/vouchers`;

    const res = await fetch(url, { method: 'POST', headers: { ...authHeader() }, body });

    if (!res.ok) {
      let msg = 'server error';
      try {
        const j = await res.json();
        msg = j?.message || msg;
      } catch {}
      alert('Gagal menyimpan voucher: ' + msg);
      return;
    }

    resetForm();
    setRefreshToggle((s) => !s);
    setModalForm(false);
    fetchVouchers();
  };

  const resetForm = () => {
    setSelectedVoucher(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      type: '',
      valid_until: '',
      tenant_location: '',
      stock: 0,
      code: '',
      community_id: '',
      target_type: 'all',
      target_user_id: '',
    });
    setImageFile(null);
  };

  // Delete voucher
  const handleDelete = async () => {
    if (!selectedVoucher) return;
    try {
      await fetch(`${apiBase}/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      setVoucherList((prev) => prev.filter((v) => v.id !== selectedVoucher.id));
      setRefreshToggle((s) => !s);
    } finally {
      setModalDelete(false);
      setSelectedVoucher(null);
    }
  };

  /* --------- Tabel columns --------- */
  const columns = [
    {
      selector: 'name',
      label: 'Nama Voucher',
      sortable: true,
      item: ({ name }) => <span className="font-semibold">{name}</span>,
    },
    {
      selector: 'code',
      label: 'Kode',
      sortable: true,
      item: ({ code }) => code || '-',
    },
    {
      selector: 'image',
      label: 'Gambar',
      width: '100px',
      item: ({ image }) => {
        const src = buildImageUrl(image);
        return src ? (
          <img src={src} alt="Voucher" width={48} height={48} />
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      selector: 'stock',
      label: 'Sisa Voucher',
      sortable: true,
      item: ({ stock }) => <span>{formatStockVoucher(stock)}</span>,
    },
    {
      selector: 'target_type',
      label: 'Target',
      item: ({ target_type, target_user_id, community_id }) => {
        if (target_type === 'user') return getUserLabel(target_user_id);
        if (target_type === 'community') return getCommunityLabel(community_id);
        return 'Semua';
      },
    },
    {
      selector: 'valid_until',
      label: 'Berlaku Sampai',
      item: ({ valid_until }) => formatDateID(valid_until),
    },
  ];

  const topBarActions = (
    <ButtonComponent
      label="Tambah Baru"
      icon={faPlus}
      paint="primary"
      onClick={() => {
        resetForm();
        setModalForm(true);
      }}
    />
  );

  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Voucher"
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        searchable
        noControlBar={false}
        setToRefresh={refreshToggle}
        actionControl={{
          except: ['detail', 'add'],
          onEdit: (voucher) => {
            setSelectedVoucher(voucher);
            // formData di halaman ini tidak lagi menentukan UI; VoucherForm akan baca dari selectedVoucher via initialData
            setModalForm(true);
          },
          onDelete: (voucher) => {
            setSelectedVoucher(voucher);
            setModalDelete(true);
          },
        }}
        fetchControl={{
          path: 'admin/vouchers',
          includeHeaders: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
        }}
      />

      {/* Modal Tambah / Edit — UI sama karena 1 komponen */}
      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          resetForm();
        }}
        title="" // judul/badge dipindah ke VoucherForm agar konsisten
        subtitle=""
        size="lg"
        className="bg-background"
      >
        <VoucherForm
          mode={selectedVoucher ? 'edit' : 'create'}
          initialData={
            selectedVoucher
              ? { ...selectedVoucher, valid_until: selectedVoucher.valid_until ? selectedVoucher.valid_until : '' }
              : undefined
          }
          users={users}
          communities={communities}
          buildImageUrl={buildImageUrl}
          onCancel={() => {
            setModalForm(false);
            resetForm();
          }}
          onSubmit={submitVoucher}
        />
      </FloatingPageComponent>

      {/* Modal Delete Confirmation */}
      <ModalConfirmComponent
        title="Hapus Voucher"
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelectedVoucher(null);
        }}
        onSubmit={handleDelete}
      />
    </>
  );
}

VoucherCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default VoucherCrud;
