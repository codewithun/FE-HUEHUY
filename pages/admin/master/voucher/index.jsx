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

  // Upload image
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setFormData((s) => ({ ...s, image: '' }));
    }
  };

  // Submit (create / update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.target_type === 'user' && !formData.target_user_id) {
      alert('Pilih pengguna untuk target_type=user');
      return;
    }
    if (formData.target_type === 'community' && !formData.community_id) {
      alert('Pilih community untuk target_type=community');
      return;
    }

    const isUpdate = Boolean(selectedVoucher);
    const url = isUpdate
      ? `${apiBase}/api/admin/vouchers/${selectedVoucher.id}`
      : `${apiBase}/api/admin/vouchers`;

    const body = new FormData();
    body.append('name', formData.name);
    if (formData.description) body.append('description', formData.description);
    if (formData.type) body.append('type', formData.type);
    if (formData.valid_until) body.append('valid_until', formData.valid_until);
    if (formData.tenant_location) body.append('tenant_location', formData.tenant_location);
    body.append('stock', String(formData.stock ?? 0));
    body.append('code', formData.code);

    body.append('target_type', formData.target_type || 'all');
    if (formData.target_type === 'user' && formData.target_user_id) {
      body.append('target_user_id', formData.target_user_id);
    }
    if (formData.target_type === 'community' && formData.community_id) {
      body.append('community_id', formData.community_id);
    }

    if (imageFile) body.append('image', imageFile);
    if (isUpdate) body.append('_method', 'PUT');

    try {
      const res = await fetch(url, { method: 'POST', headers: { ...authHeader() }, body });
      const text = await res.text();
      let result;
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { raw: text };
      }

      if (!res.ok) {
        const msg = result?.message || 'server error';
        alert('Gagal menyimpan voucher: ' + msg);
        return;
      }

      resetForm();
      setRefreshToggle((s) => !s);
      setModalForm(false);
      fetchVouchers();
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
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
        // 🔴 Nonaktifkan modal detail default (klik row tidak ngapa2in)
        actionControl={{ except: ['detail'] }}
        // fetchControl untuk useGet internal
        fetchControl={{
          path: 'admin/vouchers', // jangan pakai prefix /api di sini
          includeHeaders: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
        }}
      />

      {/* Modal Form */}
      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          resetForm();
        }}
        title={selectedVoucher ? 'Ubah Voucher' : 'Tambah Voucher'}
        size="md"
        className="bg-background"
      >
        <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
          <div>
            <label className="font-semibold">Nama Voucher</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan nama voucher"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="font-semibold">Deskripsi</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan deskripsi"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold">Kode Unik</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan kode unik voucher"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <span className="text-xs text-gray-500">
              Kode unik voucher, wajib diisi dan tidak boleh sama.
            </span>
          </div>

          <div>
            <label className="font-semibold">Tipe Voucher</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan tipe voucher"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold">Berlaku Sampai</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
            <span className="text-xs text-gray-500">
              Ditampilkan sebagai “DD MMMM YYYY” di tabel.
            </span>
          </div>

          <div>
            <label className="font-semibold">Lokasi Tenant</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan lokasi tenant"
              value={formData.tenant_location}
              onChange={(e) => setFormData({ ...formData, tenant_location: e.target.value })}
            />
          </div>

          <div>
            <label className="font-semibold">Stock</label>
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="Masukkan stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              required
            />
            <span className="text-xs text-gray-500">
              Tampilan di tabel: “{`{angka}`} voucher”.
            </span>
          </div>

          {/* Targeting */}
          <div>
            <label className="font-semibold">Target Penerima</label>
            <select
              className="select select-bordered w-full"
              value={formData.target_type}
              onChange={(e) => {
                const next = e.target.value; // 'all' | 'user' | 'community'
                setFormData((s) => ({
                  ...s,
                  target_type: next,
                  target_user_id: '',
                  community_id: next === 'community' ? s.community_id : '',
                }));
              }}
            >
              <option value="all">Semua Pengguna</option>
              <option value="user">Pengguna Tertentu</option>
              <option value="community">Anggota Community</option>
            </select>
            <span className="text-xs text-gray-500">Pilih target penerima voucher.</span>
          </div>

          {formData.target_type === 'user' && (
            <div>
              <label className="font-semibold">Pilih Pengguna</label>
              <select
                className="select select-bordered w-full"
                value={formData.target_user_id}
                onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value })}
                required
              >
                <option value="">Pilih Pengguna</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email || `#${u.id}`}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Voucher akan dikirim ke pengguna ini.</span>
            </div>
          )}

          <div>
            <label className="font-semibold">
              Community (opsional / wajib jika target=community)
            </label>
            <select
              className="select select-bordered w-full"
              value={formData.community_id}
              onChange={(e) => setFormData({ ...formData, community_id: e.target.value })}
              required={formData.target_type === 'community'}
              disabled={formData.target_type !== 'community'}
            >
              <option value="">Pilih Community</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">
              Pilih community untuk voucher ini (wajib jika targetnya "community").
            </span>
          </div>

          <div>
            <label className="font-semibold">Upload Gambar</label>
            <input
              type="file"
              accept="image/*"
              className="input input-bordered w-full"
              onChange={handleImageChange}
            />
            {formData.image && !imageFile && (
              <div className="mt-2">
                <img
                  src={buildImageUrl(formData.image) || formData.image}
                  alt="Voucher"
                  width={80}
                  height={80}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}
            {imageFile && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  width={80}
                  height={80}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}
            <span className="text-xs text-gray-500">Upload gambar voucher (opsional).</span>
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <ButtonComponent
              label="Batal"
              paint="secondary"
              variant="outline"
              onClick={() => {
                setModalForm(false);
                resetForm();
              }}
            />
            <ButtonComponent
              label={selectedVoucher ? 'Perbarui' : 'Simpan'}
              paint="primary"
              type="submit"
            />
          </div>
        </form>
      </FloatingPageComponent>

      {/* Modal Delete Confirmation (pakai show + onSubmit) */}
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
