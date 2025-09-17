/* eslint-disable no-console */
/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from 'react';
import { InputImageComponent } from '../base.components';

const toDateInputValue = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function PromoForm({
  mode,                 // 'create' | 'edit'
  initialData,          // data awal saat edit
  buildImageUrl,        // fn(path) => url absolut
  onCancel,             // () => void
  onSubmit,             // (FormData) => Promise|void
}) {
  console.log('PromoForm rendered with:', { mode, initialData });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [previewObjectUrl, setPreviewObjectUrl] = useState(null);
  
  // Fix: Initialize with proper defaults and then spread initialData
  const [formData, setFormData] = useState(() => {
    const defaults = {
      title: '',
      description: '',
      detail: '',
      promo_distance: 0,
      start_date: '',
      end_date: '',
      always_available: false,
      stock: 0,
      promo_type: 'offline',
      location: '',
      owner_name: '',
      owner_contact: '',
      code: '',
      image: '',
      community_id: initialData?.community_id ?? '', // pastikan ada
    };

    // If we have initialData, merge it with defaults
    if (initialData) {
      return {
        ...defaults,
        ...initialData,
        community_id: initialData.community_id || '',
        start_date: toDateInputValue(initialData.start_date),
        end_date: toDateInputValue(initialData.end_date),
      };
    }

    return defaults;
  });

  useEffect(() => {
    console.log('UseEffect triggered with initialData:', initialData);
    
    if (initialData) {
      setFormData((s) => ({
        ...s,
        ...initialData,
        community_id: initialData.community_id || '',   // Ensure community_id is always set
        start_date: toDateInputValue(initialData.start_date),
        end_date: toDateInputValue(initialData.end_date),
      }));
      
      // Reset image file when initialData changes (for new form or edit)
      setImageFile(null);
      
      // Set image preview for edit mode
      if (mode === 'edit' && initialData.image && buildImageUrl) {
        const imageUrl = buildImageUrl(initialData.image);
        setImagePreview(imageUrl);
      } else {
        setImagePreview('');
      }
    }
  }, [initialData, mode, buildImageUrl]);

  // Cleanup object URL on component unmount
  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  const title = mode === 'edit' ? 'Ubah Promo' : 'Tambah Promo';
  const badgeText = mode === 'edit' ? 'Mode Ubah' : 'Mode Tambah';
  const submitText = mode === 'edit' ? 'Perbarui' : 'Simpan';

  const handleImageChange = (file) => {
    // Cleanup previous object URL to prevent memory leak
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }

    setImageFile(file || null);
    if (file) {
      // Clear existing image path when new file is selected
      setFormData((s) => ({ ...s, image: '' }));
      // Create preview URL for new file
      const previewUrl = URL.createObjectURL(file);
      setPreviewObjectUrl(previewUrl);
      setImagePreview(previewUrl);
    } else {
      // If no file selected, restore original image for edit mode
      if (mode === 'edit' && initialData?.image && buildImageUrl) {
        const imageUrl = buildImageUrl(initialData.image);
        setImagePreview(imageUrl);
      } else {
        setImagePreview('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form data before submit:', formData);

    const body = new FormData();
    
    // Required fields - always send
    body.append('title', formData.title || '');
    body.append('description', formData.description || '');
    body.append('owner_name', formData.owner_name || '');
    body.append('owner_contact', formData.owner_contact || '');
    body.append('promo_type', formData.promo_type || 'offline');
    
    // wajib sertakan community_id saat update
    const cid = formData.community_id ?? initialData?.community_id;
    if (cid) {
      body.append('community_id', String(cid));
      console.log('Community ID being sent:', cid);
    } else {
      console.error('community_id is required but not provided');
      alert('Community ID is required');
      return;
    }

    // Optional fields - only send if not empty
    if (formData.detail) body.append('detail', String(formData.detail));
    if (formData.code) body.append('code', String(formData.code));
    if (formData.location) body.append('location', String(formData.location));
    
    // Numeric fields - always send with default values
    body.append('promo_distance', String(formData.promo_distance ?? 0));
    body.append('stock', String(formData.stock ?? 0));
    
    // Boolean field - convert to string
    body.append('always_available', formData.always_available ? '1' : '0');
    
    // Date fields - only send if not empty
    if (formData.start_date) body.append('start_date', String(formData.start_date));
    if (formData.end_date) body.append('end_date', String(formData.end_date));

    // Image file
    if (imageFile) body.append('image', imageFile);
    
    // Method override for edit
    if (mode === 'edit') body.append('_method', 'PUT');

    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let [key, value] of body.entries()) {
      console.log(`${key}:`, value);
    }

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
          <p className="text-sm text-muted-foreground">Judul, deskripsi, dan identitas promo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Judul Promo *</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Contoh: Diskon 50% Semua Menu"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <span className="text-xs text-gray-500 mt-1">Judul akan tampil di daftar promo.</span>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Kode Promo</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Contoh: PROMO50OFF"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <span className="text-xs text-gray-500 mt-1">Opsional, biarkan kosong untuk generate otomatis.</span>
          </div>

          <div className="md:col-span-2 form-control">
            <label className="label"><span className="label-text font-medium">Deskripsi Singkat *</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Tuliskan deskripsi singkat promo"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-2 form-control">
            <label className="label"><span className="label-text font-medium">Detail Promo</span></label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Tuliskan detail lengkap promo, syarat dan ketentuan"
              value={formData.detail || ''}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        {/* Media */}
        <div className="mt-8 mb-4">
          <h3 className="text-base font-semibold">Media</h3>
          <p className="text-sm text-muted-foreground">Gambar promo (opsional).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <InputImageComponent
              name="image"
              label="Gambar Promo"
              aspect="16/9"
              value={imageFile ? imageFile : imagePreview}
              onChange={handleImageChange}
            />
            <span className="text-xs text-gray-500 mt-1">
              PNG/JPG. Aspect ratio 16:9 untuk banner promo. Jika tidak diubah saat edit, gambar lama dipertahankan.
            </span>
          </div>
        </div>

        {/* Pengaturan & Periode */}
        <div className="mt-8 mb-4">
          <h3 className="text-base font-semibold">Pengaturan & Periode</h3>
          <p className="text-sm text-muted-foreground">Tipe, masa berlaku, lokasi, dan stok.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Tipe Promo *</span></label>
            <select
              className="select select-bordered w-full"
              value={formData.promo_type || 'offline'}
              onChange={(e) => setFormData({ ...formData, promo_type: e.target.value })}
              required
            >
              <option value="offline">Offline</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Jarak Promo (KM)</span></label>
            <input
              type="number"
              min={0}
              step={0.1}
              className="input input-bordered w-full"
              placeholder="Contoh: 5"
              value={Number(formData.promo_distance ?? 0)}
              onChange={(e) => setFormData({ ...formData, promo_distance: Number(e.target.value) || 0 })}
            />
            <span className="text-xs text-gray-500 mt-1">Jarak maksimal untuk promo dalam kilometer.</span>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Tanggal Mulai</span></label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={formData.start_date || ''}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Tanggal Berakhir</span></label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={formData.end_date || ''}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Lokasi Promo</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Contoh: Mall Central Park Lt. 2"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Stok Promo</span></label>
            <div className="join w-full">
              <input
                type="number"
                min={0}
                className="input input-bordered join-item w-full"
                value={Number(formData.stock ?? 0)}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) || 0 })}
              />
              <span className="btn btn-ghost join-item pointer-events-none">promo</span>
            </div>
            <span className="text-xs text-gray-500 mt-1">Jumlah promo yang tersedia.</span>
          </div>

          <div className="md:col-span-2 form-control">
            <label className="label">
              <span className="label-text font-medium">Selalu Tersedia</span>
            </label>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={formData.always_available || false}
                  onChange={(e) => setFormData({ ...formData, always_available: e.target.checked })}
                />
                <span className="label-text">Promo selalu tersedia (tidak terbatas waktu)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Informasi Pemilik */}
        <div className="mt-8 mb-4">
          <h3 className="text-base font-semibold">Informasi Pemilik</h3>
          <p className="text-sm text-muted-foreground">Data pemilik atau penyelenggara promo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Nama Pemilik *</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Contoh: PT. Restaurant ABC"
              value={formData.owner_name || ''}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              required
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Kontak Pemilik *</span></label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Contoh: 08123456789 atau email@domain.com"
              value={formData.owner_contact || ''}
              onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h4 className="font-semibold">Debug Info:</h4>
            <p>Community ID: {formData.community_id || 'NOT SET'}</p>
            <p>Mode: {mode}</p>
            <p>Initial Data Community ID: {initialData?.community_id || 'NOT SET'}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Batal</button>
          <button type="submit" className="btn btn-primary">{submitText}</button>
        </div>
      </form>
    </div>
  );
}