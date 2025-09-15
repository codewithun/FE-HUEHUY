/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
import { faArrowLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';

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

/* -------------------- Page -------------------- */

function MenuEditVoucherPage() {
  const router = useRouter();
  const { id } = router.query; // /admin/voucher/menueditvoucher?id=123 (contoh)

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);

  const [modalDelete, setModalDelete] = useState(false);
  const [imageFile, setImageFile] = useState(null);

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
    target_type: 'all',
    target_user_id: '',
  });

  const apiBase = useMemo(() => getApiBase(), []);
  const authHeader = () => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch detail voucher
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/api/admin/vouchers/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const json = await res.json();
        const v = json?.data || json; // adaptif
        if (!v || !v.id) {
          setNotFound(true);
        } else {
          setFormData({
            name: v.name || '',
            description: v.description || '',
            image: v.image || '',
            type: v.type || '',
            valid_until: toDateInputValue(v.valid_until),
            tenant_location: v.tenant_location || '',
            stock: v.stock ?? 0,
            code: v.code || '',
            community_id: v.community_id || '',
            target_type: v.target_type || 'all',
            target_user_id: v.target_user_id || '',
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setImageFile(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, apiBase]);

  // Fetch users & communities (untuk dropdown)
  useEffect(() => {
    (async () => {
      try {
        const [uRes, cRes] = await Promise.all([
          fetch(`${apiBase}/api/admin/users`, {
            headers: { 'Content-Type': 'application/json', ...authHeader() },
          }),
          fetch(`${apiBase}/api/admin/communities`, {
            headers: { 'Content-Type': 'application/json', ...authHeader() },
          }),
        ]);
        const uJson = await uRes.json();
        const cJson = await cRes.json();
        setUsers(Array.isArray(uJson?.data) ? uJson.data : []);
        setCommunities(Array.isArray(cJson?.data) ? cJson.data : []);
      } catch {
        setUsers([]);
        setCommunities([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // Upload image (local preview)
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setFormData((s) => ({ ...s, image: '' }));
    }
  };

  // Update voucher
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;

    if (formData.target_type === 'user' && !formData.target_user_id) {
      alert('Pilih pengguna untuk target_type=user');
      return;
    }
    if (formData.target_type === 'community' && !formData.community_id) {
      alert('Pilih community untuk target_type=community');
      return;
    }

    const url = `${apiBase}/api/admin/vouchers/${id}`;

    const body = new FormData();
    body.append('_method', 'PUT');
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

    try {
      setSaving(true);
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
        alert('Gagal memperbarui voucher: ' + msg);
        return;
      }
      // sukses — balik ke list atau tampilkan badge success
      alert('Voucher berhasil diperbarui ✨');
      router.back();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/vouchers/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert('Gagal menghapus voucher: ' + (j?.message || res.statusText));
        return;
      }
      alert('Voucher dihapus.');
      router.back();
    } finally {
      setModalDelete(false);
    }
  };

  return (
    <>
      <div className="px-4 md:px-6 py-4 flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.back()}
          type="button"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Kembali
        </button>
        <h1 className="text-lg font-semibold">Ubah Voucher</h1>
      </div>

      {loading ? (
        <div className="p-6">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-2/3 mb-2" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      ) : notFound ? (
        <div className="p-6">
          <div className="alert alert-error">
            Data voucher tidak ditemukan.
          </div>
        </div>
      ) : (
        <FloatingPageComponent
          show={true}
          onClose={() => router.back()}
          title="Ubah Voucher"
          subtitle="Masukkan data yang valid dan benar!"
          size="lg"
          className="bg-background"
        >
          {/* Badge mode di pojok, sama kayak tambah baru */}
          <div className="px-6 pt-4">
            <span className="badge badge-warning">Mode Ubah</span>
          </div>

          <form className="p-6" onSubmit={handleSubmit}>
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
                  PNG/JPG. Jika tidak diubah, gambar lama dipertahankan.
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
            <div className="mt-10 flex flex-wrap justify-between gap-2">
              <div>
                <ButtonComponent
                  label="Hapus"
                  paint="danger"
                  variant="outline"
                  icon={faTrash}
                  onClick={() => setModalDelete(true)}
                  type="button"
                />
              </div>
              <div className="ml-auto flex gap-2">
                <ButtonComponent
                  label="Batal"
                  paint="secondary"
                  variant="outline"
                  onClick={() => router.back()}
                  type="button"
                />
                <ButtonComponent
                  label={saving ? 'Menyimpan...' : 'Perbarui'}
                  paint="primary"
                  type="submit"
                  disabled={saving}
                />
              </div>
            </div>
          </form>
        </FloatingPageComponent>
      )}

      {/* Modal Delete Confirmation */}
      <ModalConfirmComponent
        title="Hapus Voucher"
        show={modalDelete}
        onClose={() => setModalDelete(false)}
        onSubmit={handleDelete}
      />
    </>
  );
}

MenuEditVoucherPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default MenuEditVoucherPage;
