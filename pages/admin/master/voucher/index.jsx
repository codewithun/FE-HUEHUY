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

/* -------------------- Helpers -------------------- */
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

/**
 * Normalisasi URL gambar agar:
 * - Selalu jadi PATH RELATIF (lewat Next rewrites) → /storage/...
 * - Aman untuk both absolute URL dari BE atau path raw (vouchers/...).
 */
const toStoragePath = (raw) => {
  if (!raw) return '';

  const s = String(raw).trim();

  // Sudah berupa path absolut FE
  if (s.startsWith('/')) return s;

  // Bentuk absolut ke BE → petakan ke path FE
  // contoh: http://localhost:8000/storage/xxx → /storage/xxx
  const m1 = s.match(/^https?:\/\/[^/]+\/(api\/)?storage\/(.+)$/i);
  if (m1) return `/storage/${m1[2]}`;

  // Kasus BE kirim "api/storage/xxx" → /storage/xxx
  if (/^api\/storage\//i.test(s)) return `/${s.replace(/^api\//i, '')}`;

  // Kasus BE kirim "storage/xxx" → /storage/xxx
  if (/^storage\//i.test(s)) return `/${s}`;

  // Kasus BE kirim hanya "vouchers/xxx" → /storage/vouchers/xxx
  return `/storage/${s.replace(/^\/+/, '')}`;
};

/** Tambahkan query param versing k=... */
const withVersion = (base, ver) =>
  !base ? '' : `${base}${base.includes('?') ? '&' : '?'}k=${encodeURIComponent(String(ver ?? Date.now()))}`;

const getApiBase = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return raw.replace(/\/api\/?$/, '');
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

const getDisplayName = (u) =>
  u?.name || u?.full_name || u?.username || u?.display_name || `User #${u?.id}`;
const getPhone = (u) =>
  u?.phone || u?.phone_number || u?.telp || u?.telpon || u?.mobile || u?.contact || '';
const norm = (v) => String(v ?? '').toLowerCase().replace(/[-\s]+/g, '_');
const isManagerTenant = (u) => {
  const target = 'manager_tenant';
  if (norm(u?.role?.name) === target) return true;
  if (norm(u?.role) === target) return true;
  if (norm(u?.user_role) === target) return true;
  if (Array.isArray(u?.roles)) {
    return u.roles.some((r) => norm(r?.name ?? r) === target);
  }
  return false;
};

/* -------------------- Page -------------------- */
function VoucherCrud() {
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);

  /* State Manager Tenant */
  const [merchantManagers, setMerchantManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managersError, setManagersError] = useState(null);

  // Crop states
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [currentFormControl, setCurrentFormControl] = useState(null);
  // Owner key to tie a blob preview to a specific form instance (voucherKey)
  const [previewOwnerKey, setPreviewOwnerKey] = useState('');
  // Add missing state used throughout handlers
  const [currentImageFile, setCurrentImageFile] = useState(null);

  // Form/list session (untuk remount TERKONTROL)
  const [formSessionId, setFormSessionId] = useState(0);
  const [listSessionId, setListSessionId] = useState(0);

  const apiBase = useMemo(() => getApiBase(), []);
  const authHeader = useCallback(() => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return { Authorization: `Bearer ${token}` };
  }, []);

  /* Endpoint Manager Tenant */
  const MANAGERS_ENDPOINT = useMemo(
    () => `${apiBase}/api/admin/users?roles[]=manager_tenant&roles[]=manager%20tenant&paginate=all`,
    [apiBase]
  );

  const getCommunityLabel = useCallback(
    (id) => {
      if (!id) return '';
      const c = communities.find((x) => String(x.id) === String(id));
      return c?.name || `Community #${id}`;
    },
    [communities]
  );

  // ROLE FILTER: hanya user (exclude admin/manager)
  const isUserRole = useCallback((u) => {
    if (!u) return false;
    const denyList = [
      'admin','superadmin','manager','tenant','tenant_manager','manager_tenant','staff','owner','operator','moderator'
    ];

    if (u.role && typeof u.role === 'object' && u.role.name) {
      return String(u.role.name).toLowerCase() === 'user';
    }
    if (typeof u.role === 'string') {
      return u.role.toLowerCase() === 'user';
    }
    if (Array.isArray(u.roles)) {
      const roles = u.roles.map((r) => (typeof r === 'string' ? r : r?.name || r) ?? '')
        .map((r) => String(r).toLowerCase());
      const hasDeny = roles.some((r) => denyList.includes(r));
      const hasUser = roles.includes('user');
      return hasUser && !hasDeny;
    }
    const boolTrue = (v) => v === true || v === 1 || v === '1';
    if (boolTrue(u.is_admin) || boolTrue(u.is_superadmin) || boolTrue(u.is_staff) || boolTrue(u.is_manager) || boolTrue(u.is_tenant_manager) || boolTrue(u.tenant_manager)) {
      return false;
    }
    if (typeof u.level === 'string' && denyList.includes(u.level.toLowerCase())) return false;
    if (typeof u.type === 'string' && denyList.includes(u.type.toLowerCase())) return false;
    return true; // fallback permisif
  }, []);
  const onlyUsers = useMemo(() => (users || []).filter(isUserRole), [users, isUserRole]);

  // File input handlers (crop)
  const handleFileInput = (e, formControl, formKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG/PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      setRawImageUrl(url);
      setCurrentFormControl(formControl);
      if (formKey) setPreviewOwnerKey(String(formKey));
      setCropOpen(true);
    } catch (err) {
      console.error('Error creating image URL:', err);
      alert('Gagal memproses gambar. Silakan coba lagi.');
    }
  };

  const handleCropSave = async (croppedFile) => {
    console.log('💾 Crop save:', { fileName: croppedFile?.name, size: croppedFile?.size });
    setCropOpen(false);

    // Cleanup blob URL lama
    if (previewUrl?.startsWith('blob:')) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }

    // Buat preview baru
    const newPreviewUrl = URL.createObjectURL(croppedFile);
    setPreviewUrl(newPreviewUrl);
    setCurrentImageFile(croppedFile); // persistent file

    // Set ke form control (immediate + delayed guard)
    if (currentFormControl) {
      console.log('📝 Setting file to form control:', croppedFile?.name);
      currentFormControl.onChange(croppedFile);
      setTimeout(() => {
        try {
          if (currentFormControl?.value !== croppedFile) {
            console.log('🔄 Re-setting file after delay');
            currentFormControl.onChange(croppedFile);
          }
        } catch {}
      }, 100);
    }
  };

  const handleRecrop = (formControl) => {
    const existingValue = formControl.value;
    let imageUrl = '';
    if (previewUrl) {
      imageUrl = previewUrl;
    } else if (existingValue && !(existingValue instanceof File)) {
      imageUrl = toStoragePath(String(existingValue));
    }
    if (imageUrl) {
      setRawImageUrl(imageUrl);
      setCurrentFormControl(formControl);
      setCropOpen(true);
    }
  };

  // Data fetch
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/communities`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (res.ok) {
          const result = await res.json();
          setCommunities(Array.isArray(result.data) ? result.data : []);
        }
      } catch (e) {
        console.error('Error fetching communities:', e);
        setCommunities([]);
      }
    })();
  }, [apiBase, authHeader]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/users?paginate=all`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (res.ok) {
          const result = await res.json();
          setUsers(Array.isArray(result.data) ? result.data : []);
        }
      } catch (e) {
        console.error('Error fetching users:', e);
        setUsers([]);
      }
    })();
  }, [apiBase, authHeader]);

  /* Fetch Manager Tenant */
  useEffect(() => {
    const fetchManagers = async () => {
      setManagersLoading(true);
      setManagersError(null);
      try {
        const res = await fetch(MANAGERS_ENDPOINT, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeader(),
          },
        });
        if (res.ok) {
          const result = await res.json();
          let usersData = [];
          if (result?.success && Array.isArray(result?.data)) usersData = result.data;
          else if (Array.isArray(result?.data)) usersData = result.data;
          else if (Array.isArray(result?.users)) usersData = result.users;
          else if (Array.isArray(result)) usersData = result;

          usersData = usersData.filter(isManagerTenant);
          usersData.sort((a, b) =>
            (getDisplayName(a) || '').localeCompare(getDisplayName(b) || '', 'id')
          );

          setMerchantManagers(usersData);
        } else {
          const errorText = await res.text();
          setManagersError(`Gagal ambil manager tenant: ${res.status} ${errorText?.slice?.(0, 120) || ''}`);
          setMerchantManagers([]);
        }
      } catch (e) {
        setManagersError(`Network error: ${e.message}`);
        setMerchantManagers([]);
      } finally {
        setManagersLoading(false);
      }
    };
    fetchManagers();
  }, [MANAGERS_ENDPOINT, authHeader]);

  // Delete
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
    } catch (e) {
      console.error('Error deleting voucher:', e);
      alert('Gagal menghapus voucher: Network error');
    } finally {
      setModalDelete(false);
      setSelectedVoucher(null);
    }
  };

  // Table columns
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
        item: (row) => {
          const raw =
            row?.image_url_versioned ||
            row?.image_url ||
            row?.image?.url ||
            row?.image ||
            '';

          const base = toStoragePath(raw);
          if (!base) {
            return (
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500">No Image</span>
              </div>
            );
          }

          // Always append our own cache-buster based on updated fields
          const ver = row?.image_updated_at || row?.updated_at || row?.id || Date.now();
          const src = withVersion(base, ver);

          return (
            <Image
              key={`img-${row.id}-${String(ver)}`}
              src={src}
              alt="Voucher"
              width={48}
              height={48}
              className="w-12 h-12 object-cover rounded-lg"
              unoptimized
            />
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

  // Transform payload sebelum submit - PERBAIKAN
  const transformData = useCallback(
    (data) => {
      console.log('🔄 Transform data input:', {
        owner_user_id: data.owner_user_id,
        id: data.id,
        isUpdate: !!data.id
      });

      // Pastikan owner_user_id ada dan valid
      if (data.owner_user_id) {
        data.owner_user_id = String(data.owner_user_id);
        
        // TAMBAH: Log untuk memastikan manager tenant yang dipilih
        const selectedManager = merchantManagers.find(m => String(m.id) === data.owner_user_id);
        if (selectedManager) {
          console.log('✅ Selected manager tenant:', {
            id: selectedManager.id,
            name: getDisplayName(selectedManager),
            phone: getPhone(selectedManager)
          });
        } else {
          console.error('❌ Manager tenant not found in list:', data.owner_user_id);
        }
      } else {
        console.error('❌ owner_user_id is missing:', data.owner_user_id);
      }

      data.target_type = data.target_type || 'all';
      data.validation_type = data.validation_type || 'auto';

      // Jangan hapus File; hapus hanya string kosong atau path URL lama
      if (data.image) {
        if (data.image instanceof File) {
          console.log('✅ Keeping File object:', data.image.name);
        } else if (typeof data.image === 'string' && !data.image.trim()) {
          console.log('🗑️ Removing empty string image');
          delete data.image;
        } else if (typeof data.image === 'string' && data.image.startsWith('/storage/')) {
          console.log('🗑️ Removing URL string (no new file)');
          delete data.image;
        }
      } else {
        console.log('🗑️ No image data');
        delete data.image;
      }

      // PERBAIKAN: Hapus field yang tidak perlu dikirim ke server
      delete data.image_url_versioned;
      delete data.image_url;
      delete data.image_updated_at;
      delete data.updated_at;

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
        const ids = onlyUsers
          .map((u) => Number(u.id))
          .filter((n) => Number.isFinite(n) && n > 0);
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

      console.log('📤 Final transformed data before send:', {
        owner_user_id: data.owner_user_id,
        hasOwnerUserId: !!data.owner_user_id,
        id: data.id,
        target_type: data.target_type,
        validation_type: data.validation_type,
        hasImage: !!data.image,
        imageType: typeof data.image
      });

      return data;
    },
    [onlyUsers, merchantManagers] // TAMBAH merchantManagers ke dependency
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
        key={`voucher-${formSessionId}-${listSessionId}-${refreshToggle}-${selectedVoucher?.id || 'new'}`}
        title="Manajemen Voucher"
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        searchable
        noControlBar={false}
        setToRefresh={refreshToggle}
        actionControl={{
          except: ['detail'],
          onAdd: () => {
            console.log('🆕 ADD clicked - AGGRESSIVE reset');
            
            // STEP 1: Force cleanup ALL blob URLs
            const blobUrls = [previewUrl, rawImageUrl].filter(url => 
              url && url.startsWith('blob:')
            );
            blobUrls.forEach(url => {
              try {
                URL.revokeObjectURL(url);
                console.log('✅ Revoked blob:', url.substring(0, 50));
              } catch (e) {
                console.warn('Failed to revoke:', e);
              }
            });
            
            // STEP 2: Reset ALL image states
            setPreviewUrl('');
            setPreviewOwnerKey('');
            setRawImageUrl('');
            setCurrentImageFile(null);
            setCurrentFormControl(null);
            setCropOpen(false);
            setSelectedVoucher(null);
            
            // STEP 3: Force session bump
            setFormSessionId((n) => {
              console.log('🔄 Form session:', n, '->', n + 1);
              return n + 1;
            });
          },
          onEdit: (voucher) => {
            console.log('✏️ EDIT clicked for voucher:', voucher.id);
            
            // STEP 1: Force cleanup ALL blob URLs
            const blobUrls = [previewUrl, rawImageUrl].filter(url => 
              url && url.startsWith('blob:')
            );
            blobUrls.forEach(url => {
              try {
                URL.revokeObjectURL(url);
                console.log('✅ Edit cleanup revoked:', url.substring(0, 50));
              } catch (e) {}
            });
            
            // STEP 2: Reset ALL image states FIRST
            setPreviewUrl('');
            setPreviewOwnerKey('');
            setRawImageUrl('');
            setCurrentImageFile(null);
            setCurrentFormControl(null);
            setCropOpen(false);
            
            // STEP 3: Set voucher dan bump session
            setSelectedVoucher(voucher);
            setFormSessionId((n) => {
              console.log('✏️ Edit session:', n, '->', n + 1);
              return n + 1;
            });
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
        onFormClose={() => {
          // cleanup
          if (previewUrl?.startsWith('blob:')) { try { URL.revokeObjectURL(previewUrl); } catch {} }
          if (rawImageUrl?.startsWith('blob:')) { try { URL.revokeObjectURL(rawImageUrl); } catch {} }
          setPreviewUrl('');
          setRawImageUrl('');
          setCurrentImageFile(null);
          setCurrentFormControl(null);
          setCropOpen(false);
          setSelectedVoucher(null);
          setFormSessionId((n) => n + 1);
          setListSessionId((n) => n + 1);
        }}
        formDefaultValue={{
          validation_type: 'auto',
          target_type: 'all',
          stock: 0,
          image: '', // create selalu kosong
        }}
        beforeSubmit={(payload) => {
          console.log('🚀 Before submit payload:', {
            owner_user_id: payload.owner_user_id,
            id: payload.id,
            isUpdate: !!payload.id,
            fullPayload: payload
          });

          // Wajib: Manager Tenant harus dipilih
          if (!payload.owner_user_id) {
            alert('Manager tenant wajib dipilih.');
            return false;
          }

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
        onStoreSuccess={() => {
          if (previewUrl?.startsWith('blob:')) { try { URL.revokeObjectURL(previewUrl); } catch {} }
          if (rawImageUrl?.startsWith('blob:')) { try { URL.revokeObjectURL(rawImageUrl); } catch {} }
          setPreviewUrl('');
          setPreviewOwnerKey('');
          setRawImageUrl('');
          setCurrentImageFile(null);
          setCurrentFormControl(null);
          setCropOpen(false);
          setSelectedVoucher(null);
          setFormSessionId((n) => n + 1);
          setListSessionId((n) => n + 1);
          setRefreshToggle((s) => !s);
        }}
        onUpdateSuccess={() => {
          console.log('💾 Update success - aggressive refresh');

          // Cleanup blob URLs
          [previewUrl, rawImageUrl].forEach((url) => {
            if (url?.startsWith('blob:')) {
              try { URL.revokeObjectURL(url); } catch {}
            }
          });

          // Reset states
          setPreviewUrl('');
          setPreviewOwnerKey('');
          setRawImageUrl('');
          setCurrentImageFile(null);
          setCurrentFormControl(null);
          setCropOpen(false);
          setSelectedVoucher(null);

          // Aggressive refresh bertahap
          setTimeout(() => {
            setFormSessionId((n) => n + 1);
            setListSessionId((n) => n + 1);
            setRefreshToggle((s) => !s);
          }, 100);

          // Invalidate cache image di DOM
          setTimeout(() => {
            if (typeof document === 'undefined') return;
            const images = document.querySelectorAll('img[src*="/storage/vouchers/"]');
            images.forEach((img) => {
              const originalSrc = (img.getAttribute('src') || img.src || '').split('?')[0];
              if (!originalSrc) return;
              img.setAttribute('src', `${originalSrc}?force=${Date.now()}`);
            });
          }, 500);
        }}
        onSubmitSuccess={() => {
          if (previewUrl?.startsWith('blob:')) { try { URL.revokeObjectURL(previewUrl); } catch {} }
          if (rawImageUrl?.startsWith('blob:')) { try { URL.revokeObjectURL(rawImageUrl); } catch {} }
          setPreviewUrl('');
          setPreviewOwnerKey('');
          setRawImageUrl('');
          setCurrentImageFile(null);
          setCurrentFormControl(null);
          setCropOpen(false);
          setSelectedVoucher(null);
          setFormSessionId((n) => n + 1);
          setListSessionId((n) => n + 1);
          setRefreshToggle((s) => !s);
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
            // ======== FIELD GAMBAR ========
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const fc = formControl('image');
                const formId = values?.find?.((v) => v.name === 'id')?.value;
                const isEditMode = Boolean(formId && formId !== 'new');
                const voucherKey = `${formSessionId}-${formId || 'new'}`;

                // Server image
                const valMap = (name) => values?.find?.((v) => v.name === name)?.value;
                const rawFromValues = valMap('image_url_versioned') || valMap('image_url') || '';
                const serverImageUrl = (() => {
                  if (!isEditMode || !rawFromValues || typeof rawFromValues !== 'string') return '';
                  return toStoragePath(rawFromValues);
                })();

                const imageVersion =
                  valMap('image_updated_at') ||
                  valMap('updated_at') ||
                  formId ||
                  Date.now();

                const serverSrc = serverImageUrl ? withVersion(serverImageUrl, imageVersion) : '';

                // Prioritas File object dan blob preview
                const currentValue = fc.value;
                const hasFileObject = currentValue instanceof File;
                const canUseBlob = Boolean(previewUrl) && String(previewOwnerKey) === String(voucherKey);

                let finalPreviewSrc = '';
                if (hasFileObject && canUseBlob) {
                  finalPreviewSrc = previewUrl;
                } else if (canUseBlob) {
                  finalPreviewSrc = previewUrl;
                } else {
                  finalPreviewSrc = serverSrc;
                }

                // File input handler (prevent override)
                const handleFileChange = (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  console.log('📁 File selected:', {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    voucherKey,
                    currentFormValue: typeof fc.value,
                  });

                  // Set file segera lalu buka crop
                  fc.onChange(file);
                  setCurrentImageFile(file);
                  handleFileInput(e, fc, voucherKey);
                };

                const fileInfo = hasFileObject ? `File: ${currentValue.name} (${(currentValue.size / 1024).toFixed(1)}KB)` : '';

                return (
                  <div className="form-control" key={`img-field-${voucherKey}`}>
                    <label className="label">
                      <span className="label-text font-medium">Gambar Voucher</span>
                      {hasFileObject && (
                        <span className="label-text-alt text-green-600 text-xs">📁 {fileInfo}</span>
                      )}
                    </label>

                    <div className="mb-4">
                      {finalPreviewSrc ? (
                        <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                          <Image
                            src={finalPreviewSrc}
                            alt="Preview"
                            width={192}
                            height={192}
                            className="max-w-full max-h-full object-contain"
                            unoptimized
                            onLoad={() => console.log('✅ Preview loaded:', finalPreviewSrc.substring(0, 80))}
                            onError={() => console.error('❌ Preview failed:', finalPreviewSrc.substring(0, 80))}
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

                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded border">
                        <div><strong>🔍 Debug Form State:</strong></div>
                        <div>Form Value Type: <span className="font-mono">{typeof currentValue}</span></div>
                        <div>Is File Object: <span className={hasFileObject ? 'text-green-600' : 'text-red-600'}>{hasFileObject ? '✅' : '❌'}</span></div>
                        <div>Has Preview Blob: <span className={canUseBlob ? 'text-green-600' : 'text-red-600'}>{canUseBlob ? '✅' : '❌'}</span></div>
                        <div>Preview Source: <span className="font-mono">{finalPreviewSrc ? 'SHOWING' : 'EMPTY'}</span></div>
                        <div>Owner Key: <span className="font-mono">{previewOwnerKey}</span></div>
                        <div>Current Key: <span className="font-mono">{voucherKey}</span></div>
                        <div>File State: <span className="font-mono">{currentImageFile ? currentImageFile.name : 'NULL'}</span></div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input file-input-bordered flex-1"
                        onChange={handleFileChange}
                        key={`file-input-${voucherKey}-${imageVersion}`}
                      />
                      {finalPreviewSrc && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRecrop(fc)}
                            title="Crop ulang untuk menyesuaikan gambar"
                          >
                            Crop Ulang
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-error btn-sm"
                            onClick={() => {
                              console.log('🗑️ Clearing image preview and file');
                              if (previewUrl?.startsWith('blob:')) {
                                try { URL.revokeObjectURL(previewUrl); } catch {}
                              }
                              setPreviewUrl('');
                              setCurrentImageFile(null);
                              setPreviewOwnerKey('');
                              fc.onChange('');
                            }}
                            title="Hapus gambar"
                          >
                            Hapus
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
            // ===============================================================
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

            /* Dropdown Manager Tenant (WAJIB) */
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('owner_user_id');
                const options = merchantManagers.map((u) => ({
                  value: String(u.id),
                  label: `${getDisplayName(u)}${getPhone(u) ? ' — ' + getPhone(u) : ''}`,
                }));

                // PERBAIKAN: Pastikan onChange bekerja
                const handleChange = (selectedValue) => {
                  console.log('👤 Manager tenant changed:', {
                    from: fc.value,
                    to: selectedValue
                  });
                  fc.onChange(selectedValue);
                };

                return (
                  <SelectComponent
                    name="owner_user_id"
                    label="Manager Tenant *"
                    placeholder={
                      managersLoading
                        ? 'Loading manager tenant...'
                        : options.length === 0
                        ? 'Tidak ada manager tenant'
                        : 'Pilih manager tenant...'
                    }
                    required
                    value={fc.value}
                    onChange={handleChange}
                    options={options}
                    disabled={managersLoading || options.length === 0}
                  />
                );
              },
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
          customDefaultValue: (data) => {
            console.log('🔧 Setting form default values for edit:', {
              id: data?.id,
              owner_name: data?.owner_name,
              owner_phone: data?.owner_phone,
              merchantManagersCount: merchantManagers.length,
            });

            // PERBAIKAN: Resolve berdasarkan nama dan phone yang tersimpan
            let resolvedOwnerUserId = '';
            
            if (data?.owner_name || data?.owner_phone) {
              const matchedManager = merchantManagers.find(manager => {
                const managerName = getDisplayName(manager).toLowerCase();
                const managerPhone = getPhone(manager).replace(/[^\d+]/g, '');
                
                // Match berdasarkan nama
                const nameMatch = data.owner_name && 
                  managerName.includes(data.owner_name.toLowerCase());
                
                // Match berdasarkan phone (normalisasi dulu)
                const phoneMatch = data.owner_phone && managerPhone && 
                  managerPhone.includes(data.owner_phone.replace(/[^\d+]/g, ''));
                
                return nameMatch || phoneMatch;
              });
              
              if (matchedManager) {
                resolvedOwnerUserId = String(matchedManager.id);
                console.log('🔍 Resolved manager tenant:', {
                  stored_name: data.owner_name,
                  stored_phone: data.owner_phone,
                  resolved_id: resolvedOwnerUserId,
                  manager_name: getDisplayName(matchedManager),
                  manager_phone: getPhone(matchedManager)
                });
              } else {
                console.warn('⚠️ Could not resolve owner from stored name/phone:', {
                  stored_name: data.owner_name,
                  stored_phone: data.owner_phone,
                  available_managers: merchantManagers.length
                });
              }
            }

            const result = {
              id: data?.id,
              ...data,
              valid_until: toDateInput(data?.valid_until),

              // Image handling
              image: currentImageFile ||
                data?.image_url_versioned ||
                data?.image_url ||
                data?.image?.url ||
                data?.image ||
                '',

              // Image versioning fields
              image_url_versioned: data?.image_url_versioned || null,
              image_url: data?.image_url || null,
              image_updated_at: data?.image_updated_at || null,
              updated_at: data?.updated_at || null,

              // PERBAIKAN: Set owner_user_id yang sudah di-resolve
              owner_user_id: resolvedOwnerUserId,

              target_user_ids: Array.isArray(data?.target_user_ids)
                ? data.target_user_ids
                : String(data?.target_user_ids || '')
                    .split(',')
                    .map((id) => Number(String(id).trim()))
                    .filter(Boolean),
              validation_type: data?.validation_type || (data?.code ? 'manual' : 'auto'),
              target_type: data?.target_type || 'all',
              stock: data?.stock ?? 0,
            };

            console.log('📋 Final form default values:', {
              owner_user_id: result.owner_user_id,
              owner_name: result.owner_name,
              owner_phone: result.owner_phone,
              id: result.id
            });

            return result;
          },
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
