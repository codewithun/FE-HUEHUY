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

  // Add this edit handler function
  const handleEdit = (voucher) => {
    setSelectedVoucher(voucher);
    setFormData({
      name: voucher.name || '',
      description: voucher.description || '',
      image: voucher.image || '',
      type: voucher.type || '',
      valid_until: toDateInputValue(voucher.valid_until),
      tenant_location: voucher.tenant_location || '',
      stock: voucher.stock || 0,
      code: voucher.code || '',
      community_id: voucher.community_id || '',
      target_type: voucher.target_type || 'all',
      target_user_id: voucher.target_user_id || '',
    });
    setImageFile(null); // Reset new image file
    setModalForm(true);
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
        // 🔴 Nonaktifkan semua form otomatis dari TableSupervision
        actionControl={{ 
          except: ['detail', 'add', 'edit'], // Hapus add & edit otomatis
          onEdit: handleEdit, // Gunakan handler custom
          onDelete: (voucher) => {
            setSelectedVoucher(voucher);
            setModalDelete(true);
          }
        }}
        // 🔴 Hapus atau nonaktifkan formControl dan formUpdateControl
        // formControl={null}
        // formUpdateControl={null}
        fetchControl={{
          path: 'admin/vouchers',
          includeHeaders: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
        }}
      />
      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          resetForm();
        }}
        title={selectedVoucher ? 'Ubah Voucher' : 'Tambah Voucher'}
        subtitle="Masukkan data yang valid dan benar!"
        size="lg"
        className="bg-background"
      >
        {/* Badge mode di pojok, sama kayak promo */}
        <div className="px-6 pt-4">
          <span className={`badge ${selectedVoucher ? 'badge-warning' : 'badge-success'}`}>
            {selectedVoucher ? 'Mode Ubah' : 'Mode Tambah'}
          </span>
        </div>

        <form className="p-6">
          {/* Section: Informasi Umum */}
          <div className="mb-4">
            <h3 className="text-base font-semibold">Informasi Umum</h3>
            <p className="text-sm text-muted-foreground">
              Nama, deskripsi, dan identitas voucher.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Nama Voucher</span></label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Contoh: Diskon 20% Semua Menu"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <span className="text-xs text-gray-500 mt-1">Nama akan tampil di daftar voucher.</span>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Kode Unik</span></label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Contoh: HH-20OFF"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <span className="text-xs text-gray-500 mt-1">Wajib & tidak boleh duplikat.</span>
            </div>

            <div className="md:col-span-2 form-control">
              <label className="label"><span className="label-text font-medium">Deskripsi</span></label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Tuliskan ketentuan singkat voucher"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Section: Pengaturan & Periode */}
          <div className="mt-8 mb-4">
            <h3 className="text-base font-semibold">Pengaturan & Periode</h3>
            <p className="text-sm text-muted-foreground">Tipe, masa berlaku, lokasi, dan stok.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Tipe Voucher</span></label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Contoh: percentage / nominal / buy1get1"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Berlaku Sampai</span></label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
              <span className="text-xs text-gray-500 mt-1">Format input YYYY-MM-DD.</span>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Lokasi Tenant</span></label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Contoh: Foodcourt Lantai 2"
                value={formData.tenant_location}
                onChange={(e) => setFormData({ ...formData, tenant_location: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Stok Voucher</span></label>
              <div className="join w-full">
                <input
                  type="number"
                  className="input input-bordered join-item w-full"
                  min={0}
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  required
                />
                <span className="btn btn-ghost join-item pointer-events-none">voucher</span>
              </div>
              <span className="text-xs text-gray-500 mt-1">Tampilan tabel: “{`{angka}`} voucher”.</span>
            </div>
          </div>

          {/* Section: Target Penerima */}
          <div className="mt-8 mb-4">
            <h3 className="text-base font-semibold">Target Penerima</h3>
            <p className="text-sm text-muted-foreground">Atur siapa yang berhak menerima voucher.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Target</span></label>
              <select
                className="select select-bordered w-full"
                value={formData.target_type}
                onChange={(e) => {
                  const next = e.target.value;
                  setFormData((s) => ({
                    ...s,
                    target_type: next,
                    target_user_id: next === 'user' ? s.target_user_id : '',
                    community_id: next === 'community' ? s.community_id : '',
                  }));
                }}
              >
                <option value="all">Semua Pengguna</option>
                <option value="user">Pengguna Tertentu</option>
                <option value="community">Anggota Community</option>
              </select>
            </div>

            {formData.target_type === 'user' && (
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Pilih Pengguna</span></label>
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
              </div>
            )}

            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">
                  Community {formData.target_type === 'community' ? '(wajib)' : '(opsional)'}
                </span>
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
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Media */}
          <div className="mt-8 mb-4">
            <h3 className="text-base font-semibold">Media</h3>
            <p className="text-sm text-muted-foreground">Gambar voucher (opsional).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Upload Gambar</span></label>
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                onChange={handleImageChange}
              />
              <span className="text-xs text-gray-500 mt-1">
                PNG/JPG. Jika tidak diubah saat edit, gambar lama dipertahankan.
              </span>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Preview</span></label>
              <div className="flex items-center gap-3">
                {/* preview lama */}
                {formData.image && !imageFile && (
                  <img
                    src={buildImageUrl(formData.image) || formData.image}
                    alt="Voucher"
                    width={96}
                    height={96}
                    className="rounded-xl border"
                  />
                )}
                {/* preview baru */}
                {imageFile && (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="rounded-xl border"
                  />
                )}
                {!formData.image && !imageFile && (
                  <span className="text-sm text-muted-foreground">Belum ada gambar</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-10 flex justify-end gap-2">
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
              onClick={handleSubmit}
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
