/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import CropperDialog from '../crop.components/CropperDialog';

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
  // Crop states
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

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
    
    // Clear all image-related states first
    setImageFile(null);
    setRawImageUrl('');
    setCropOpen(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Then set the appropriate preview based on mode
    if (mode === 'edit' && initial.image) {
      const serverImageUrl = buildImageUrl(initial.image);
      setPreviewUrl(serverImageUrl);
    } else {
      setPreviewUrl('');
    }
  }, [initial, mode, buildImageUrl]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (rawImageUrl && rawImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(rawImageUrl);
      }
    };
  }, [previewUrl, rawImageUrl]);

  const title = mode === 'edit' ? 'Ubah Voucher' : 'Tambah Voucher';
  const badgeText = mode === 'edit' ? 'Mode Ubah' : 'Mode Tambah';
  const submitText = mode === 'edit' ? 'Perbarui' : 'Simpan';

  // When user selects file, open cropper
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG/PNG)');
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 10MB');
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    try {
      // Cleanup previous rawImageUrl if it's a blob
      if (rawImageUrl && rawImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(rawImageUrl);
      }
      
      const url = URL.createObjectURL(file);
      console.log('Image URL created:', url);
      setRawImageUrl(url);
      console.log('Setting cropOpen to true');
      setCropOpen(true);
    } catch (error) {
      console.error('Error creating image URL:', error);
      alert('Gagal memproses gambar. Silakan coba lagi.');
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // When cropper saves
  const handleCropSave = async (croppedBlob) => {
    setCropOpen(false);
    
    // Cleanup previous blob URL if it exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setImageFile(croppedBlob);
    setPreviewUrl(URL.createObjectURL(croppedBlob));
    // Clear the image field in formData since we now have a new file
    setFormData((s) => ({ ...s, image: '' }));
  };

  // Recrop existing image
  const handleRecrop = () => {
    // Priority order:
    // 1. If we have a new cropped image, use that
    // 2. If in edit mode, use the original server image
    // 3. Otherwise use current preview
    
    if (imageFile && previewUrl) {
      // We have a newly cropped image
      setRawImageUrl(previewUrl);
      setCropOpen(true);
    } else if (mode === 'edit' && initial.image) {
      // In edit mode, always start from server image
      const serverImageUrl = buildImageUrl(initial.image);
      setRawImageUrl(serverImageUrl);
      setCropOpen(true);
    } else if (previewUrl) {
      // Fallback to current preview
      setRawImageUrl(previewUrl);
      setCropOpen(true);
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

        {/* Cropper Dialog */}
        <CropperDialog
          open={cropOpen}
          imageUrl={rawImageUrl}
          onClose={() => setCropOpen(false)}
          onSave={handleCropSave}
          aspect={1}
        />

        <div className="space-y-6">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Gambar Voucher</span></label>
            
            {/* Preview Area */}
            <div className="mb-4">
              {previewUrl ? (
                <div className="relative">
                  <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                    <Image 
                      src={previewUrl} 
                      alt="Preview voucher" 
                      width={192}
                      height={192}
                      className="max-w-full max-h-full object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Hasil Crop
                    </span>
                  </div>
                </div>
              ) : mode === 'edit' && initial.image && !imageFile ? (
                <div className="relative">
                  <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                    <Image 
                      src={buildImageUrl(initial.image)} 
                      alt="Gambar existing" 
                      width={192}
                      height={192}
                      className="max-w-full max-h-full object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                      Gambar Existing
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">Belum ada gambar dipilih</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* File Input with Action Buttons */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="file-input file-input-bordered flex-1"
                onChange={handleFileInput}
                id="voucher-image-upload"
              />
              
              {/* Action Buttons - positioned at the right */}
              {(previewUrl || (mode === 'edit' && initial.image)) && (
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline btn-primary btn-sm px-4 py-2 min-h-[40px] font-medium border-2" 
                    onClick={handleRecrop}
                    title="Crop ulang untuk menyesuaikan gambar"
                  >
                    Crop Ulang
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-error btn-sm px-4 py-2 min-h-[40px] font-medium border-2"
                    onClick={() => {
                      // Cleanup blob URLs
                      if (previewUrl && previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      if (rawImageUrl && rawImageUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(rawImageUrl);
                      }
                      
                      // Reset input file
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      
                      setPreviewUrl('');
                      setImageFile(null);
                      setRawImageUrl('');
                      setFormData((s) => ({ ...s, image: mode === 'edit' ? initial.image : '' }));
                    }}
                    title="Hapus gambar yang sudah dipilih"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
            
            <span className="text-xs text-gray-500 mt-1">
              PNG/JPG/WEBP, maksimal 5MB. Dialog crop akan terbuka otomatis setelah memilih file.
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
