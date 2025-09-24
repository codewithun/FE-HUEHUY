/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  InputComponent,
  ModalConfirmComponent,
  SelectComponent,
  TableSupervisionComponent,
  TextareaComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import CropperDialog from '../../../../components/crop.components/CropperDialog';
import MultiSelectDropdown from '../../../../components/form/MultiSelectDropdown';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

const toDateInput = (raw) => {
  if (!raw) return '';
  const s = String(raw);
  if (s.includes('T')) return s.split('T')[0];
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/* -------------------- Helpers -------------------- */
const getApiBase = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return raw.replace(/\/api\/?$/, '');
};

const buildImageUrl = (raw) => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = getApiBase();
  let path = String(raw).replace(/^\/+/, '');
  path = path.replace(/^api\/storage\//, 'storage/');
  if (!/^storage\//.test(path)) path = `storage/${path}`;
  return `${base}/${path}`;
};

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

const formatStockVoucher = (n) => `${Number(n ?? 0)} voucher`;

/* -------------------- Page -------------------- */
function VoucherCrud() {
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Crop states
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState('');
  const [currentImageFile, setCurrentImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [currentFormControl, setCurrentFormControl] = useState(null);

  // New: session key to force remount + full reset helper
  const [formSessionKey, setFormSessionKey] = useState(0);

  const resetImageStates = useCallback(() => {
    try {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      if (rawImageUrl && rawImageUrl.startsWith('blob:')) URL.revokeObjectURL(rawImageUrl);
    } catch {}
    setPreviewUrl('');
    setCurrentImageFile(null);
    setRawImageUrl('');
    setCropOpen(false);
    setCurrentFormControl(null);
  }, [previewUrl, rawImageUrl]);

  // Pastikan state preview ter-reset saat sesi form berubah
  useEffect(() => {
    resetImageStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formSessionKey]);

  const apiBase = useMemo(() => getApiBase(), []);
  const authHeader = useCallback(() => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return { Authorization: `Bearer ${token}` };
  }, []);

  const getUserLabel = useCallback(
    (id) => {
      if (!id) return '';
      const u = users.find((x) => String(x.id) === String(id));
      return u?.name || u?.email || `User #${id}`;
    },
    [users]
  );

  const getCommunityLabel = useCallback(
    (id) => {
      if (!id) return '';
      const c = communities.find((x) => String(x.id) === String(id));
      return c?.name || `Community #${id}`;
    },
    [communities]
  );

  // ==== ROLE FILTER: hanya user (exclude admin & manager/tenant manager) ====
  const isUserRole = useCallback((u) => {
    if (!u) return false;

    const denyList = ['admin','superadmin','manager','tenant','tenant_manager','manager_tenant','staff','owner','operator','moderator'];

    // 0) role object { name: '...' }
    if (u.role && typeof u.role === 'object' && u.role.name) {
      const r = String(u.role.name).toLowerCase();
      return r === 'user';
    }

    // 1) kolom role tunggal (string)
    if (typeof u.role === 'string') {
      const r = u.role.toLowerCase();
      return r === 'user';
    }

    // 2) kolom roles (array of strings / objects)
    if (Array.isArray(u.roles)) {
      const roles = u.roles.map((r) => {
        if (typeof r === 'string') return r.toLowerCase();
        if (r && typeof r === 'object' && r.name) return String(r.name).toLowerCase();
        return String(r ?? '').toLowerCase();
      });
      const hasDeny = roles.some((r) => denyList.includes(r));
      const hasUser = roles.includes('user');
      return hasUser && !hasDeny;
    }

    // 3) kolom level/type string
    if (typeof u.level === 'string') {
      const r = u.level.toLowerCase();
      if (denyList.includes(r)) return false;
      return r === 'user';
    }
    if (typeof u.type === 'string') {
      const r = u.type.toLowerCase();
      if (denyList.includes(r)) return false;
      return r === 'user';
    }

    // 4) berbagai flag boolean umum
    const boolTrue = (v) => v === true || v === 1 || v === '1';
    if (boolTrue(u.is_admin)) return false;
    if (boolTrue(u.is_superadmin)) return false;
    if (boolTrue(u.is_staff)) return false;
    if (boolTrue(u.is_manager)) return false;
    if (boolTrue(u.is_tenant_manager)) return false;
    if (boolTrue(u.tenant_manager)) return false;

    // 5) fallback: kalau sama sekali nggak ada info role,
    //    anggap user biasa (permisif). Kalau mau super ketat, return false.
    return true;
  }, []);

  const onlyUsers = useMemo(() => (users || []).filter(isUserRole), [users, isUserRole]);

  // Crop handlers
  const handleFileInput = (e, formControl) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG/PNG)');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }
    
    try {
      const url = URL.createObjectURL(file);
      setRawImageUrl(url);
      setCurrentFormControl(formControl);
      setCropOpen(true);
    } catch (error) {
      console.error('Error creating image URL:', error);
      alert('Gagal memproses gambar. Silakan coba lagi.');
    }
  };

  const handleCropSave = async (croppedFile) => {
    setCropOpen(false);
    
    // Clean up previous preview URL if it's a blob
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Set the cropped file and preview
    setCurrentImageFile(croppedFile);
    const newPreviewUrl = URL.createObjectURL(croppedFile);
    setPreviewUrl(newPreviewUrl);
    
    if (currentFormControl) {
      // Set the cropped File object as the form value
      currentFormControl.onChange(croppedFile);
    }
  };

  const handleRecrop = (formControl) => {
    const existingValue = formControl.value;
    let imageUrl = '';
    
    if (previewUrl) {
      // Use cropped preview
      imageUrl = previewUrl;
    } else if (existingValue && !(existingValue instanceof File)) {
      // Use existing server image
      imageUrl = buildImageUrl(String(existingValue));
    }
    
    if (imageUrl) {
      setRawImageUrl(imageUrl);
      setCurrentFormControl(formControl);
      setCropOpen(true);
    }
  };

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/communities`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (res.ok) {
          const result = await res.json();
          setCommunities(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
        setCommunities([]);
      }
    };
    fetchCommunities();
  }, [apiBase, authHeader]);

  // Fetch users (pastikan BE kirim role info: minimal u.role.name atau u.role string)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/users?paginate=all`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (res.ok) {
          const result = await res.json();
          setUsers(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };
    fetchUsers();
  }, [apiBase, authHeader]);

  const handleDelete = async () => {
    if (!selectedVoucher) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setRefreshToggle((s) => !s);
        alert('Voucher berhasil dihapus');
      } else {
        console.error('Delete failed:', body);
        alert(body?.message || 'Gagal menghapus voucher');
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert('Gagal menghapus voucher: Network error');
    } finally {
      setModalDelete(false);
      setSelectedVoucher(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        selector: 'name',
        label: 'Nama Voucher',
        sortable: true,
        item: ({ name }) => <span className="font-semibold">{name || '-'}</span>,
      },
      {
        selector: 'code',
        label: 'Kode',
        sortable: true,
        item: ({ code }) => <span className="font-mono text-sm">{code || '-'}</span>,
      },
      {
        selector: 'image',
        label: 'Gambar',
        width: '100px',
        item: ({ image }) => {
          const src = buildImageUrl(image);
          return src ? (
            <Image src={src} alt="Voucher" width={48} height={48} className="w-12 h-12 object-cover rounded-lg" />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">No Image</span>
            </div>
          );
        },
      },
      {
        selector: 'stock',
        label: 'Sisa Voucher',
        sortable: true,
        item: ({ stock }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              Number(stock) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {formatStockVoucher(stock)}
          </span>
        ),
      },
      {
        selector: 'target_type',
        label: 'Target',
        item: ({ target_type, target_user_names, target_user_total, community_id }) => {
          if (target_type === 'user') {
            const names = Array.isArray(target_user_names) ? target_user_names : [];
            const total = Number(target_user_total ?? names.length);
            if (total === 0) return 'Pengguna Tertentu';
            const rest = Math.max(0, total - names.length);
            return `${names.join(', ')}${rest > 0 ? ` +${rest} lainnya` : ''}`;
          }
          if (target_type === 'community') return getCommunityLabel(community_id);
          return 'Semua (role: user)';
        },
      },
      {
        selector: 'valid_until',
        label: 'Berlaku Sampai',
        item: ({ valid_until }) => <span className="text-sm">{formatDateID(valid_until)}</span>,
      },
    ],
    [getCommunityLabel]
  );

  const topBarActions = null;

  // ===== Transform payload (konversi "all" => semua ID role user saja) =====
  const transformData = useCallback(
    (data) => {
      data.target_type = data.target_type || 'all';
      data.validation_type = data.validation_type || 'auto';

      // Handle image properly - only remove if it's not a File object
      if (data.image && !(data.image instanceof File)) {
        // If it's a string (URL), don't include it in FormData for update
        if (typeof data.image === 'string') {
          delete data.image;
        }
      }

      if (!data.valid_until) delete data.valid_until;

      if (data.target_type !== 'community' || !data.community_id) {
        delete data.community_id;
      } else {
        data.community_id = String(data.community_id);
      }

      if (data.target_type === 'user' && Array.isArray(data.target_user_ids) && data.target_user_ids.length) {
        data.target_user_ids
          .map(Number)
          .filter((id) => Number.isFinite(id) && id > 0)
          .forEach((id, i) => {
            data[`target_user_ids[${i}]`] = id;
          });
      } else if (data.target_type === 'all') {
        // >>> "Semua Pengguna" = hanya role user (exclude admin & manager tenant)
        const ids = onlyUsers
          .map((u) => Number(u.id))
          .filter((n) => Number.isFinite(n) && n > 0);

        // ubah jadi target_type user dengan daftar id
        data.target_type = 'user';
        ids.forEach((id, i) => {
          data[`target_user_ids[${i}]`] = id;
        });
      }
      delete data.target_user_ids;
      delete data.target_user_id;

      if (data.validation_type === 'manual') {
        if (data.code) data.code = String(data.code).trim();
      } else {
        if (!data.code) delete data.code;
      }

      data.stock = Number(data.stock ?? 0);
      return data;
    },
    [onlyUsers]
  );

  return (
    <>
      {/* Cropper Dialog */}
      <CropperDialog
        open={cropOpen}
        imageUrl={rawImageUrl}
        onClose={() => setCropOpen(false)}
        onSave={handleCropSave}
        aspect={1}
      />
      
      <TableSupervisionComponent
        key={formSessionKey}
        title="Manajemen Voucher"
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        searchable
        noControlBar={false}
        setToRefresh={refreshToggle}
        actionControl={{
          except: ['detail'],
          onAdd: () => {
            resetImageStates();
            setSelectedVoucher(null);
            setFormSessionKey((k) => k + 1);
          },
          onEdit: (voucher) => {
            resetImageStates();
            setSelectedVoucher(voucher);
            setFormSessionKey((k) => k + 1);
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
        /* ===== DEFAULT VALUE supaya tidak 422 ===== */
        formDefaultValue={{
          validation_type: 'auto',
          target_type: 'all',
          stock: 0,
          image: '', // ensure image field exists and is empty by default
        }}
        /* ===== GUARD opsional sebelum submit ===== */
        beforeSubmit={(payload) => {
          const tt = payload?.target_type || 'all';
          if (tt === 'user' && (!payload.target_user_ids || payload.target_user_ids.length === 0)) {
            alert('Pilih minimal 1 pengguna untuk target user.');
            return false;
          }
          if ((payload.validation_type || 'auto') === 'manual' && !payload.code?.trim()) {
            alert('Kode wajib diisi untuk tipe validasi manual.');
            return false;
          }
          return true;
        }}
        formControl={{
          contentType: 'multipart/form-data',
          transformData,
          custom: [
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="name"
                  label="Nama Voucher"
                  placeholder="Contoh: Diskon 20% Semua Menu"
                  {...formControl('name')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <TextareaComponent
                  name="description"
                  label="Deskripsi"
                  placeholder="Tuliskan ketentuan singkat voucher"
                  {...formControl('description')}
                  rows={3}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('image');
                const raw = fc.value;

                // baru: nilai form -> file crop -> url server -> kosong
                const hasCroppedFile = raw instanceof File;
                const hasServerImage = !!raw && !(raw instanceof File);

                const previewSrc = hasCroppedFile
                  ? previewUrl                 // file hasil crop pada sesi ini
                  : hasServerImage
                  ? buildImageUrl(String(raw)) // gambar server saat edit
                  : '';

                return (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Gambar Voucher</span>
                    </label>

                    <div className="mb-4">
                      {previewSrc ? (
                        <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                          <Image
                            key={previewSrc}          // paksa rerender saat src berubah
                            src={previewSrc}
                            alt="Preview"
                            width={192}
                            height={192}
                            className="max-w-full max-h-full object-contain"
                            unoptimized               // agar blob: bisa dirender
                          />
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

                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input file-input-bordered flex-1"
                        onChange={(e) => handleFileInput(e, fc)}
                      />
                      {previewSrc && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRecrop(fc)}
                          >
                            Crop Ulang
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-gray-500 mt-1">
                      PNG/JPG/WEBP, maksimal 10MB. Dialog crop akan terbuka otomatis setelah memilih file.
                    </span>
                  </div>
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="type"
                  label="Tipe Voucher"
                  placeholder="Contoh: percentage / nominal / buy1get1"
                  {...formControl('type')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('validation_type');
                const current = fc.value ?? 'auto';
                const onChange = (e) => {
                  fc.onChange?.(e);
                  const val = e?.target?.value ?? e?.value ?? null;
                  if (val === 'auto') {
                    formControl('code')?.onChange?.({ target: { value: '' } });
                  }
                };
                return (
                  <SelectComponent
                    name="validation_type"
                    label="Tipe Validasi *"
                    required
                    value={current}
                    onChange={onChange}
                    options={[
                      { label: 'Generate Otomatis (QR Code)', value: 'auto' },
                      { label: 'Masukan Kode Unik', value: 'manual' },
                    ]}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const vt = values.find((i) => i.name === 'validation_type')?.value ?? 'auto';
                if (vt !== 'manual') return null;
                return (
                  <InputComponent
                    name="code"
                    label="Kode Voucher *"
                    placeholder="Contoh: HH-20OFF"
                    required
                    {...formControl('code')}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent type="date" name="valid_until" label="Berlaku Sampai" {...formControl('valid_until')} />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('stock');
                const current = fc.value ?? 0;
                return (
                  <InputComponent
                    type="number"
                    name="stock"
                    label="Stok Voucher"
                    placeholder="Jumlah voucher tersedia"
                    value={current}
                    onChange={fc.onChange}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('target_type');
                const current = fc.value ?? 'all';
                return (
                  <SelectComponent
                    name="target_type"
                    label="Target Penerima"
                    value={current}
                    onChange={fc.onChange}
                    options={[
                      { label: 'Semua Pengguna (role: user)', value: 'all' },
                      { label: 'Pengguna Tertentu', value: 'user' },
                      { label: 'Anggota Community', value: 'community' },
                    ]}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const targetType = values.find((i) => i.name === 'target_type')?.value ?? 'all';
                return targetType === 'user' ? (
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Pilih Pengguna</span>
                      <span className="label-text-alt text-red-500">*</span>
                    </label>
                    <MultiSelectDropdown
                      options={onlyUsers.map((u) => ({
                        label: `${u.name || u.email || `#${u.id}`}`,
                        value: u.id,
                      }))}
                      value={formControl('target_user_ids').value || []}
                      onChange={formControl('target_user_ids').onChange}
                      placeholder="Pilih satu atau lebih pengguna..."
                      maxHeight={200}
                    />
                    <label className="label">
                      <span className="label-text-alt text-gray-500">
                        Anda dapat memilih beberapa pengguna sekaligus
                      </span>
                    </label>
                  </div>
                ) : null;
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const tt = values.find((i) => i.name === 'target_type')?.value ?? 'all';
                const fc = formControl('community_id');
                return (
                  <SelectComponent
                    name="community_id"
                    label="Community (opsional)"
                    placeholder="Pilih community..."
                    {...fc}
                    clearable={true}
                    disabled={tt !== 'community'}
                    options={communities.map((c) => ({
                      label: c.name,
                      value: c.id,
                    }))}
                  />
                );
              },
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => ({
            ...data,
            valid_until: toDateInput(data?.valid_until),
            image: data?.image ? buildImageUrl(data.image) : '',
            target_user_ids: data.target_user_ids
              ? Array.isArray(data.target_user_ids)
                ? data.target_user_ids
                : String(data.target_user_ids)
                    .split(',')
                    .map((id) => Number(String(id).trim()))
              : [],
            validation_type: data.validation_type || (data.code ? 'manual' : 'auto'),
            target_type: data.target_type || 'all',
            stock: data.stock ?? 0,
          }),
        }}
      />

      <ModalConfirmComponent
        title="Hapus Voucher"
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelectedVoucher(null);
        }}
        onSubmit={handleDelete}
      >
        <p className="text-gray-600 mb-4">
          Apakah Anda yakin ingin menghapus voucher "{selectedVoucher?.name}"?
        </p>
        <p className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
      </ModalConfirmComponent>
    </>
  );
}

VoucherCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default VoucherCrud;
