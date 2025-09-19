/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
import React, { useEffect, useMemo, useState } from 'react';
import InputImageComponent from '../base.components/input/InputImage.component';

const toDateInputValue = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function VoucherForm({
  mode,                 // 'create' | 'edit'
  initialData,          // data awal saat edit
  users = [],           // [{id, name/email}]
  communities = [],     // [{id, name}]
  buildImageUrl,        // fn(path) => url absolut
  onCancel,             // () => void
  onSubmit,             // (FormData) => Promise|void
}) {
  const [imageFile, setImageFile] = useState(null);

  const initial = useMemo(() => {
    const targetUserIds =
      initialData?.target_user_ids
        ? (Array.isArray(initialData?.target_user_ids)
            ? initialData?.target_user_ids
            : String(initialData?.target_user_ids).split(',').map((x) => Number(String(x).trim())).filter(Boolean))
        : (initialData?.target_user_id ? [Number(initialData.target_user_id)] : []);

    return {
      name: '',
      description: '',
      image: '',
      type: '',
      validation_type: 'auto', // default
      valid_until: '',
      tenant_location: '',
      stock: 0,
      code: '',
      community_id: '',
      target_type: 'all',
      target_user_ids: [],
      ...initialData,
      valid_until: toDateInputValue(initialData?.valid_until),
      validation_type: initialData?.validation_type || (initialData?.code ? 'manual' : 'auto'),
      target_user_ids: targetUserIds,
    };
  }, [initialData]);

  const [formData, setFormData] = useState(initial);

  useEffect(() => {
    setFormData(initial);
    setImageFile(null);
  }, [initial]);

  const title = mode === 'edit' ? 'Ubah Voucher' : 'Tambah Voucher';
  const badgeText = mode === 'edit' ? 'Mode Ubah' : 'Mode Tambah';
  const submitText = mode === 'edit' ? 'Perbarui' : 'Simpan';

  const handleImageChange = (file) => {
    setImageFile(file || null);
    if (file) {
      setFormData((s) => ({ ...s, image: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard sederhana biar gak 422
    if (formData.validation_type === 'manual' && !String(formData.code || '').trim()) {
      alert('Kode wajib diisi untuk tipe validasi manual.');
      return;
    }
    if (formData.target_type === 'user' && (!Array.isArray(formData.target_user_ids) || formData.target_user_ids.length === 0)) {
      alert('Pilih minimal 1 pengguna untuk target user.');
      return;
    }
    if (formData.target_type === 'community' && !formData.community_id) {
      alert('Pilih community untuk target_type=community.');
      return;
    }

    const body = new FormData();
    body.append('name', formData.name || '');
    if (formData.description) body.append('description', String(formData.description));
    if (formData.type) body.append('type', String(formData.type));
    if (formData.valid_until) body.append('valid_until', String(formData.valid_until));
    if (formData.tenant_location) body.append('tenant_location', String(formData.tenant_location));
    body.append('stock', String(formData.stock ?? 0));

    // Validation type handling
    body.append('validation_type', formData.validation_type || 'auto');
    if (formData.validation_type === 'manual') {
      body.append('code', String(formData.code).trim());
      body.append('barcode', String(formData.code).trim()); // kompatibilitas
    }

    // Targeting
    body.append('target_type', formData.target_type || 'all');

    if (formData.target_type === 'user') {
      // Backend expects 'target_user_ids' as array
      // FormData approach: send as multiple fields with same name
      (formData.target_user_ids || []).forEach((id) => {
        if (id != null && id !== '') {
          body.append('target_user_ids[]', String(id));
        }
      });
    }

    if (formData.target_type === 'community') {
      const cid = Number(formData.community_id);
      if (Number.isInteger(cid) && cid > 0) {
        body.append('community_id', String(cid));
      }
    }

    if (imageFile) body.append('image', imageFile);
    if (mode === 'edit') body.append('_method', 'PUT');

    await onSubmit(body);
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="px-6 pt-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">Masukkan data yang valid dan benar!</p>
        <div className="mt-3">
          <span className={`badge ${mode === 'edit' ? 'badge-warning' : 'badge-success'}`}>{badgeText}</span>
        </div>
      </div>

      <form className="p-6" onSubmit={handleSubmit}>
        {/* Informasi Umum */}
        <div className="mb-4">
          <h3 className="text-base font-semibold">Informasi Umum</h3>
          <p className="text-sm text-muted-foreground">Nama, deskripsi, dan identitas voucher.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nama */}
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

          {/* Tipe Validasi */}
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Tipe Validasi *</span></label>
            <select
              className="select select-bordered w-full"
              value={formData.validation_type || 'auto'}
              onChange={(e) =>
                setFormData((s) => ({
                  ...s,
                  validation_type: e.target.value,
                  code: e.target.value === 'auto' ? '' : s.code,
                }))
              }
              required
            >
              <option value="auto">Generate Otomatis (QR Code)</option>
              <option value="manual">Masukan Kode Unik</option>
            </select>
          </div>

          {/* Code (hanya manual) */}
          {formData.validation_type === 'manual' && (
            <div className="md:col-span-2 form-control">
              <label className="label">
                <span className="label-text font-medium">Kode Voucher *</span>
                <span className="label-text-alt text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Contoh: HH-20OFF"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <span className="text-xs text-gray-500 mt-1">
                Masukkan kode voucher yang akan digunakan pengguna untuk validasi
              </span>
            </div>
          )}

          {/* Deskripsi */}
          <div className="md:col-span-2 form-control">
            <label className="label"><span className="label-text font-medium">Deskripsi</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Tuliskan ketentuan singkat voucher"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Media */}
        <div className="mt-8 mb-4">
          <h3 className="text-base font-semibold">Media</h3>
          <p className="text-sm text-muted-foreground">Gambar voucher (opsional).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <InputImageComponent
              name="image"
              label="Gambar Voucher"
              value={imageFile || (formData.image && !imageFile ? buildImageUrl(formData.image) : '')}
              onChange={handleImageChange}
            />
            <span className="text-xs text-gray-500 mt-1">
              PNG/JPG. Jika tidak diubah saat edit, gambar lama dipertahankan.
            </span>
          </div>
        </div>

        {/* Pengaturan & Periode */}
        <div className="mt-8 mb-4">
          <h3 className="text-base font-semibold">Pengaturan & Periode</h3>
          <p className="text-sm text-muted-foreground">Tipe, masa berlaku, lokasi, dan stok.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipe voucher */}
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Tipe Voucher</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Contoh: percentage / nominal / buy1get1"
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>

          {/* Valid until */}
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Berlaku Sampai</span></label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={formData.valid_until || ''}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
            <span className="text-xs text-gray-500 mt-1">Format input YYYY-MM-DD.</span>
          </div>

          {/* Lokasi tenant */}
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Lokasi Tenant</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Contoh: Foodcourt Lantai 2"
              value={formData.tenant_location || ''}
              onChange={(e) => setFormData({ ...formData, tenant_location: e.target.value })}
            />
          </div>

          {/* Stok */}
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Stok Voucher</span></label>
            <div className="join w-full">
              <input
                type="number"
                min={0}
                className="input input-bordered join-item w-full"
                value={Number(formData.stock ?? 0)}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                required
              />
              <span className="btn btn-ghost join-item pointer-events-none">voucher</span>
            </div>
            <span className="text-xs text-gray-500 mt-1">Tampilan tabel: "{`{angka}`} voucher".</span>
          </div>
        </div>

        {/* Target Penerima */}
        <div className="mt-8 mb-4">
          <h3 className="text-base font-semibold">Target Penerima</h3>
          <p className="text-sm text-muted-foreground">Atur siapa yang berhak menerima voucher.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target type */}
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
                  // reset field sesuai target
                  target_user_ids: next === 'user' ? s.target_user_ids : [],
                  community_id: next === 'community' ? s.community_id : '',
                }));
              }}
            >
              <option value="all">Semua Pengguna</option>
              <option value="user">Pengguna Tertentu</option>
              <option value="community">Anggota Community</option>
            </select>
          </div>

          {/* Multi user (target_type=user) */}
          {formData.target_type === 'user' && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Pilih Pengguna (boleh banyak)</span>
                <span className="label-text-alt text-red-500">*</span>
              </label>
              <select
                multiple
                className="select select-bordered w-full h-40"
                value={(formData.target_user_ids || []).map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                  setFormData((s) => ({ ...s, target_user_ids: values }));
                }}
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email || `#${u.id}`}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500 mt-1">
                Tekan Ctrl/Cmd untuk memilih beberapa pengguna.
              </span>
            </div>
          )}

          {/* Community (opsional / wajib saat target_type=community) */}
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-medium">
                Community {formData.target_type === 'community' ? '(wajib)' : '(opsional)'}
              </span>
            </label>
            <select
              className="select select-bordered w-full"
              value={String(formData.community_id || '')}
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

        {/* Footer */}
        <div className="mt-10 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
          <button type="submit" className="btn btn-primary">{submitText}</button>
        </div>
      </form>
    </div>
  );
}
