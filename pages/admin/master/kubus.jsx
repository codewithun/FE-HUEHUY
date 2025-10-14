import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import Image from 'next/image';

import {
  ButtonComponent,
  CheckboxComponent,
  DateFormatComponent,
  FloatingPageComponent,
  FormSupervisionComponent,
  InputComponent,
  InputTimeComponent,
  InputMapComponent,
  InputNumberComponent,
  SelectComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';

import {
  faEdit,
  faFilePen,
  faInfinity,
  faTicket,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import moment from 'moment';

// Ubah import menjadi named import
import { InputImageComponent } from '../../../components/base.components/input/InputImage.component';
import { TextareaComponent } from '../../../components/base.components/input/Textarea.component';
import InputOpenHours from '../../../components/construct.components/input/InputOpenHours';
import ToggleComponent from '../../../components/construct.components/input/TogleComponet';
import UpdateCubeStatusModal from '../../../components/construct.components/modal/UpdateCubeStatus.modal';
import VoucherModal from '../../../components/construct.components/modal/Voucher.modal';
import GrabListComponent from '../../../components/construct.components/partial-page/GrabList.component';
import CropperDialog from '../../../components/crop.components/CropperDialog';
import MultiSelectDropdown from '../../../components/form/MultiSelectDropdown';
import { useUserContext } from '../../../context/user.context';
import { token_cookie_name, Decrypt } from '../../../helpers';

// Tambahkan debug untuk komponen yang bermasalah
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[DEBUG typeof]', {
    // dari barrel base.components
    FormSupervisionComponent: typeof FormSupervisionComponent,
    TableSupervisionComponent: typeof TableSupervisionComponent,
    FloatingPageComponent: typeof FloatingPageComponent,
    ButtonComponent: typeof ButtonComponent,
    CheckboxComponent: typeof CheckboxComponent,
    DateFormatComponent: typeof DateFormatComponent,
    InputComponent: typeof InputComponent,
    InputMapComponent: typeof InputMapComponent,
    InputNumberComponent: typeof InputNumberComponent,
    SelectComponent: typeof SelectComponent,

    // dari path spesifik
    InputImageComponent: typeof InputImageComponent,
    TextareaComponent: typeof TextareaComponent,
    ToggleComponent: typeof ToggleComponent,
    InputOpenHours: typeof InputOpenHours,
  });
}

function Kubus() {
  // === guards (biar konsisten) ===
  const getCT = (values) =>
    values.find(i => i.name === 'content_type')?.value || 'promo';
  const isInfo = (values) =>
    !!values.find(i => i.name === 'is_information')?.value?.at?.(0);
  const isPromoOrVoucher = (values) => ['promo', 'voucher'].includes(getCT(values));

  // Helper functions untuk Manager Tenant
  const getDisplayName = useCallback((u) =>
    u?.name || u?.full_name || u?.username || u?.display_name || `User #${u?.id}`, []);
  const getPhone = useCallback((u) =>
    u?.phone || u?.phone_number || u?.telp || u?.telpon || u?.mobile || u?.contact || "", []);

  // normalisasi role → 'manager_tenant'
  const norm = useCallback((v) =>
    String(v ?? "").toLowerCase().replace(/[-\s]+/g, "_"), []);
  const isManagerTenant = useCallback((u) => {
    const target = "manager_tenant";
    if (norm(u?.role?.name) === target) return true;   // { role: { name: '...' } }
    if (norm(u?.role) === target) return true;         // { role: '...' }
    if (norm(u?.user_role) === target) return true;    // { user_role: '...' }
    if (Array.isArray(u?.roles)) {                     // ['...'] / [{ name:'...' }]
      return u.roles.some((r) => norm(r?.name ?? r) === target);
    }
    return false;
  }, [norm]);

  // ROLE FILTER: hanya user (exclude admin/manager) - sama seperti di index.jsx
  const isUserRole = useCallback((u) => {
    if (!u) return false;
    const denyList = [
      'admin', 'superadmin', 'manager', 'tenant', 'tenant_manager', 'manager_tenant', 'staff', 'owner', 'operator', 'moderator'
    ];

    if (u.role && typeof u.role === 'object' && u.role.name) {
      return !denyList.includes(u.role.name.toLowerCase());
    }
    if (typeof u.role === 'string') {
      return !denyList.includes(u.role.toLowerCase());
    }
    if (Array.isArray(u.roles)) {
      return !u.roles.some((r) =>
        denyList.includes((r?.name ?? r)?.toLowerCase?.() ?? '')
      );
    }
    const boolTrue = (v) => v === true || v === 1 || v === '1';
    if (boolTrue(u.is_admin) || boolTrue(u.is_superadmin) || boolTrue(u.is_staff) || boolTrue(u.is_manager) || boolTrue(u.is_tenant_manager) || boolTrue(u.tenant_manager)) {
      return false;
    }
    if (typeof u.level === 'string' && denyList.includes(u.level.toLowerCase())) return false;
    if (typeof u.type === 'string' && denyList.includes(u.type.toLowerCase())) return false;
    return true; // fallback permisif
  }, []);

  const [selected, setSelected] = useState(null);
  const [formAds, setFormAds] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [voucherModal, setVoucherModal] = useState(false);
  const { profile: Profile } = useUserContext();

  // Manager Tenant states
  const [merchantManagers, setMerchantManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managersError, setManagersError] = useState(null);

  // User states untuk target penerima voucher
  const [users, setUsers] = useState([]);

  // Computed value untuk filtered users - harus setelah deklarasi users state
  const onlyUsers = useMemo(() => (users || []).filter(isUserRole), [users, isUserRole]);

  // Crop states
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [currentFormControl, setCurrentFormControl] = useState(null);
  // Owner key to tie a blob preview to a specific form instance
  const [previewOwnerKey, setPreviewOwnerKey] = useState('');

  // Form/list session (untuk remount TERKONTROL)
  const [formSessionId] = useState(0);

  // API helpers
  const getApiBase = () => {
    const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return raw.replace(/\/api\/?$/, "");
  };

  const authHeader = useCallback(() => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : "";
    return { Authorization: `Bearer ${token}` };
  }, []);

  const apiBase = getApiBase();
  const MANAGERS_ENDPOINT = `${apiBase}/api/admin/users?roles[]=manager_tenant&roles[]=manager%20tenant&paginate=all`;

  // Helper functions untuk crop functionality (sama seperti di voucher)
  const toStoragePath = useCallback((raw) => {
    if (!raw) return '';

    const s = String(raw).trim();

    // 🚨 Skip temporary files atau path Windows yang invalid
    if (s.includes('\\Temp\\') || s.includes('C:\\Users') || s.includes('.tmp') || s.includes('php')) {
      // eslint-disable-next-line no-console
      console.warn('🚨 toStoragePath: Skipping temporary/invalid path:', s);
      return '';
    }

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
  }, []);

  /** Tambahkan query param versing k=... */
  const withVersion = useCallback((base, ver) =>
    !base ? '' : `${base}${base.includes('?') ? '&' : '?'}k=${encodeURIComponent(String(ver ?? Date.now()))}`, []);

  // File input handlers (crop)
  const handleFileInput = useCallback((e, formControl, formKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      setRawImageUrl(url);
      setCurrentFormControl(formControl);
      setPreviewOwnerKey(formKey);
      setCropOpen(true);
    } catch (err) {
      alert('Error loading image: ' + err.message);
    }
  }, []);

  const handleCropSave = useCallback(async (croppedFile) => {
    setCropOpen(false);

    // Cleanup blob URL lama
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Buat preview baru
    const newPreviewUrl = URL.createObjectURL(croppedFile);
    setPreviewUrl(newPreviewUrl);

    // Set ke form control (immediate + delayed guard)
    if (currentFormControl) {
      currentFormControl.onChange(croppedFile);
      // Delayed guard untuk memastikan form state ter-update
      setTimeout(() => {
        if (currentFormControl.value !== croppedFile) {
          currentFormControl.onChange(croppedFile);
        }
      }, 100);
    }
  }, [previewUrl, currentFormControl]);

  const handleRecrop = useCallback((formControl) => {
    const existingValue = formControl.value;
    let imageUrl = '';
    if (previewUrl) {
      imageUrl = previewUrl;
    } else if (existingValue && typeof existingValue === 'string') {
      imageUrl = toStoragePath(existingValue);
    }
    if (imageUrl) {
      setRawImageUrl(imageUrl);
      setCurrentFormControl(formControl);
      setCropOpen(true);
    }
  }, [previewUrl, toStoragePath]);

  // Helper untuk mendapatkan URL gambar dari server berdasarkan field name
  const getServerImageUrl = useCallback((fieldName, values, selectedData) => {
    const valMap = (name) => values?.find?.((v) => v.name === name)?.value;

    let rawFromValues = '';

    // Mapping untuk different field names
    if (fieldName === 'image') {
      // Untuk cube logo
      rawFromValues = valMap('image_url_versioned') ||
        valMap('image_url') ||
        valMap('image') ||
        selectedData?.image || '';
    } else if (fieldName === 'ads[image]') {
      // Banner image
      rawFromValues = valMap('ads[image]') ||
        selectedData?.ads?.[0]?.image ||
        selectedData?.ads?.[0]?.picture_source || '';
    } else if (fieldName === 'ads[image_1]') {
      rawFromValues = valMap('ads[image_1]') ||
        selectedData?.ads?.[0]?.image_1 ||
        selectedData?.ads?.[0]?.image_1_source || '';
    } else if (fieldName === 'ads[image_2]') {
      rawFromValues = valMap('ads[image_2]') ||
        selectedData?.ads?.[0]?.image_2 ||
        selectedData?.ads?.[0]?.image_2_source || '';
    } else if (fieldName === 'ads[image_3]') {
      rawFromValues = valMap('ads[image_3]') ||
        selectedData?.ads?.[0]?.image_3 ||
        selectedData?.ads?.[0]?.image_3_source || '';
    } else {
      // Fallback untuk field lain seperti main form ads[image_1], ads[image_2], ads[image_3]
      // Cek juga selectedData jika ada
      rawFromValues = valMap(`${fieldName}_url_versioned`) ||
        valMap(`${fieldName}_url`) ||
        valMap(fieldName) || '';

      // Untuk main form, ads data mungkin ada di selectedData.ads[0]
      if (!rawFromValues && selectedData?.ads?.[0]) {
        const adData = selectedData.ads[0];
        if (fieldName === 'ads[image_1]') {
          rawFromValues = adData.image_1 || adData.image_1_source || '';
        } else if (fieldName === 'ads[image_2]') {
          rawFromValues = adData.image_2 || adData.image_2_source || '';
        } else if (fieldName === 'ads[image_3]') {
          rawFromValues = adData.image_3 || adData.image_3_source || '';
        } else if (fieldName === 'ads[image]') {
          rawFromValues = adData.image || adData.picture_source || '';
        }
      }
    }

    // Debug log untuk troubleshooting
    if (process.env.NODE_ENV === 'development' && fieldName?.includes('image')) {
      // eslint-disable-next-line no-console
      console.log('🔍 getServerImageUrl DEBUG:', {
        fieldName,
        rawFromValues,
        rawFromValuesType: typeof rawFromValues,
        rawFromValuesValue: rawFromValues,
        selectedDataAds: selectedData?.ads?.[0],
        valMapResults: {
          direct: valMap(fieldName),
          versioned: valMap(`${fieldName}_url_versioned`),
          url: valMap(`${fieldName}_url`)
        }
      });
    }

    if (!rawFromValues) return '';
    
    // ✅ PERBAIKAN: Pastikan rawFromValues adalah string sebelum memanggil includes
    const rawStr = String(rawFromValues || '').trim();
    if (!rawStr) return '';
    
    // Skip path yang mengandung temporary file atau path Windows yang salah
    if (rawStr.includes('\\Temp\\') || rawStr.includes('C:\\Users') || rawStr.includes('.tmp')) {
      // eslint-disable-next-line no-console
      console.warn('🚨 Skipping temporary/invalid path:', rawStr);
      return '';
    }
    
    return toStoragePath(rawStr);
  }, [toStoragePath]);

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (Profile?.role_id != 1) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/admin';
      }
    }
  }, [Profile]);

  // Fetch Manager Tenant
  useEffect(() => {
    const fetchManagers = async () => {
      setManagersLoading(true);
      setManagersError(null);
      try {
        const res = await fetch(MANAGERS_ENDPOINT, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
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

          // Filter Manager Tenant
          usersData = usersData.filter(isManagerTenant);
          // Sort by name
          usersData.sort((a, b) => (getDisplayName(a) || "").localeCompare(getDisplayName(b) || "", "id"));

          setMerchantManagers(usersData);
        } else {
          const errorText = await res.text();
          setManagersError(
            `Gagal ambil manager tenant: ${res.status} ${errorText?.slice?.(0, 120) || ""}`
          );
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
  }, [MANAGERS_ENDPOINT, isManagerTenant, getDisplayName, authHeader]);

  // Fetch Users untuk target penerima voucher
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/users?paginate=all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
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

          setUsers(usersData);
        } else {
          setUsers([]);
        }
      } catch (e) {
        setUsers([]);
      }
    };
    fetchUsers();
  }, [apiBase, authHeader]);

  let validate =
    selected?.ads?.at(0)?.start_validate &&
      selected?.ads?.at(0)?.finish_validate
      ? {
        start_validate: moment(selected?.ads[0].start_validate).format(
          'DD-MM-YYYY'
        ),
        finish_validate: moment(selected?.ads[0].finish_validate).format(
          'DD-MM-YYYY'
        ),
      }
      : null;

  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Kubus</h1>
      <TableSupervisionComponent
        setToRefresh={refresh}
        title="Kubus"
        fetchControl={{
          path: 'admin/cubes',
        }}
        columnControl={{
          custom: [
            {
              selector: 'code',
              label: 'Kubus',
              sortable: true,
              width: '150px',
              item: ({ code, cube_type }) => {
                return (
                  <>
                    <b>{code}</b>
                    <p className="text-slate-500 text-sm">{cube_type?.name}</p>
                  </>
                );
              },
            },
            {
              selector: 'ads',
              label: 'Iklan',
              sortable: true,
              width: '250px',
              item: ({ ads }) => {
                return (
                  <>
                    <b>{ads?.at(0)?.title}</b>
                  </>
                );
              },
            },
            {
              selector: 'address',
              label: 'Lokasi',
              sortable: true,
              width: '250px',
              item: ({ address }) => (
                <span className="limit__line__2">{address}</span>
              ),
            },
            {
              selector: 'status',
              label: 'Status',
              sortable: true,
              width: '130px',
              item: ({ status, inactive_at }) => (
                <div className="">
                  {status === 'active' ? (
                    <span className="uppercase font-medium text-green-600 py-1 px-2.5 rounded-md text-sm bg-green-100">
                      Aktif
                    </span>
                  ) : (
                    <span className="uppercase font-medium text-red-600 py-1 px-2.5 rounded-md text-sm bg-red-100">
                      Tidak Aktif
                    </span>
                  )}
                  <p className="text-xs mt-2">
                    Aktif Sampai:{' '}
                    {inactive_at ? (
                      <DateFormatComponent date={inactive_at} />
                    ) : (
                      <FontAwesomeIcon icon={faInfinity} />
                    )}
                  </p>
                </div>
              ),
            },
            {
              selector: 'max_grab',
              label: 'Sisa Promo',
              sortable: true,
              width: '200px',
              item: ({ ads }) =>
                ads?.at(0)?.max_grab == null ? (
                  <FontAwesomeIcon icon={faInfinity} />
                ) : ads?.at(0)?.is_daily_grab ? (
                  `${ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) ||
                  'Tidak ada'
                  } Promo / Hari`
                ) : (
                  `${ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) ||
                  'Tidak ada'
                  } Promo`
                ),
            },
            {
              selector: 'world_id',
              label: 'Dunia',
              sortable: true,
              width: '150px',
              item: ({ world }) =>
                world ? (
                  <span className="limit__line__2">{world.name}</span>
                ) : (
                  '-'
                ),
            },
            {
              selector: 'owner',
              label: 'Manager Tenant',
              sortable: true,
              width: '250px',
              item: ({ user, cube_type_id, corporate }) => {
                return (
                  <>
                    {cube_type_id == 2 ? (
                      <b className="font-semibold">
                        {corporate?.name ? corporate?.name : '-'}
                      </b>
                    ) : (
                      <>
                        <b className="font-semibold">
                          {user?.name ? user?.name : '-'}
                        </b>
                        <p className="text-slate-500 text-sm">
                          {user?.email ? user?.email : null}
                        </p>
                      </>
                    )}
                  </>
                );
              },
            },
          ],
        }}
        formControl={{
          contentType: 'multipart/form-data',
          customDefaultValue: {
            'ads[is_daily_grab]': 0,
            'ads[unlimited_grab]': 0,
            'content_type': 'promo',
            'cube_type_id': 1,
            'owner_user_id': null,
            'ads[validation_type]': 'auto',
            'ads[day_type]': 'custom',
            'target_type': 'all',
            'target_user_ids': [],
            'community_id': '',
            'is_information': [],
            'is_recommendation': []
          },
          onModalOpen: (isEdit) => {
            // Reset selected ketika mode add (bukan edit)
            if (!isEdit) {
              setSelected(null);
            }
            
            // Debug logging untuk form mode
            if (typeof window !== 'undefined') {
              // eslint-disable-next-line no-console
              console.log('[KUBUS DEBUG] Modal opened:', {
                isEdit,
                selected: selected,
                formMode: isEdit ? 'edit' : 'create'
              });
            }
          },
          custom: [
            // Content Type Selection (Radio Buttons)
            // === JENIS KONTEN (radio bulat hijau, sama gaya dgn "Hanya Di Waktu Tertentu") ===
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInformation = values.find((i) => i.name == 'is_information')?.value?.at?.(0);
                const currentTab = values.find((i) => i.name == 'content_type')?.value || 'promo';

                const handleContentTypeChange = (newType) => {
                  // set content_type
                  let next = [
                    ...values.filter((i) => i.name !== 'content_type'),
                    { name: 'content_type', value: newType },
                  ];

                  // auto-reset is_information jika bukan mode informasi
                  if (newType !== 'kubus-informasi') {
                    next = [
                      ...next.filter((i) => i.name !== 'is_information'),
                      { name: 'is_information', value: [] },
                    ];
                  }

                  // auto-set cube putih utk promo/voucher
                  if (['promo', 'voucher'].includes(newType)) {
                    next = [
                      ...next.filter((i) => i.name !== 'cube_type_id'),
                      { name: 'cube_type_id', value: 1 },
                    ];
                  }

                  setValues(next);
                };

                const options = [
                  { key: 'promo', label: 'Promo' },
                  { key: 'voucher', label: 'Voucher' },
                  { key: 'iklan', label: 'Iklan' },
                ];

                return (
                  <div className="space-y-3">
                    <div className="font-semibold text-base text-slate-700">Jenis Konten</div>

                    {/* Kontainer radio seperti "Hanya Di Waktu Tertentu" */}
                    <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                      <div className="flex items-center gap-6">
                        {options.map(opt => {
                          const checked = currentTab === opt.key;
                          return (
                            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="content_type"
                                value={opt.key}
                                checked={checked}
                                disabled={!!isInformation} // kalau kubus informasi aktif, kunci pilihan
                                onChange={() => handleContentTypeChange(opt.key)}
                                className="h-4 w-4 accent-green-600 disabled:opacity-50"
                                style={{ accentColor: '#16a34a' }} // fallback
                              />
                              <span className={checked ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              },
            },
            // Checkbox untuk Kubus Informasi
            // 1) tampilkan checkbox dg style yang sama seperti "Rekomendasi Di Beranda"
            {
              type: 'check',
              construction: {
                name: 'is_information',
                options: [{ label: 'Kubus Informasi', value: 1 }],
              },
            },

            // 2) watcher kecil untuk sinkronkan content_type
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInfo = !!values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const ct = values.find(i => i.name === 'content_type')?.value || 'promo';

                // set ke 'kubus-informasi' saat dicentang
                if (isInfo && ct !== 'kubus-informasi') {
                  setValues([
                    ...values.filter(i => i.name !== 'content_type'),
                    { name: 'content_type', value: 'kubus-informasi' },
                  ]);
                }

                // kembalikan ke 'promo' saat tidak dicentang
                if (!isInfo && ct === 'kubus-informasi') {
                  setValues([
                    ...values.filter(i => i.name !== 'content_type'),
                    { name: 'content_type', value: 'promo' },
                  ]);
                }

                return null; // tidak render UI apa-apa
              },
            },

            // Rekomendasi Section (moved here)
            {
              type: 'check',
              construction: {
                name: 'is_recommendation',
                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
              },
            },

            // Basic Cube Settings (always visible)
            {
              type: 'select',
              construction: {
                name: 'cube_type_id',
                label: 'Tipe Kubus',
                placeholder: 'Pilih Tipe Kubus..',
                serverOptionControl: {
                  path: 'admin/options/cube-type',
                },
              },
            },

            // Manager Tenant Section
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const cubeType = values.find(i => i.name == 'cube_type_id')?.value;
                const isInfo = !!values.find(i => i.name === 'is_information')?.value?.at?.(0);

                if (isInfo) return null; // sembunyikan saat Kubus Informasi

                return (
                  <>
                    {cubeType == 2 ? (
                      <SelectComponent
                        name="corporate_id"
                        label="Manager Tenant"
                        placeholder="Pilih Mitra..."
                        serverOptionControl={{ path: `admin/options/corporate` }}
                        {...formControl('corporate_id')}
                        searchable
                      />
                    ) : (
                      <div>
                        <SelectComponent
                          name="owner_user_id"
                          label="Manager Tenant"
                          placeholder={
                            managersLoading
                              ? "Loading manager tenant..."
                              : merchantManagers.length === 0
                                ? "Tidak ada manager tenant"
                                : "Pilih manager tenant..."
                          }
                          {...formControl('owner_user_id')}
                          options={merchantManagers.map((u) => ({
                            value: String(u.id),
                            label: `${getDisplayName(u)}${getPhone(u) ? " — " + getPhone(u) : ""}`,
                          }))}
                          disabled={managersLoading}
                        />
                        {managersError && (
                          <p className="text-red-500 text-sm mt-1">{managersError}</p>
                        )}
                      </div>
                    )}
                  </>
                );
              },
            },

            // Cube Logo/Image Section
            {
              col: 4,
              type: 'custom',
              custom: ({ values, formControl }) => {
                const cubeType = values.find(
                  (i) => i.name == 'cube_type_id'
                )?.value;

                // Tidak render jika bukan kubus merah/hijau
                if (cubeType != 2 && cubeType != 4) {
                  return null;
                }

                const fc = formControl('image');
                const formId = values?.find?.((v) => v.name === 'id')?.value;
                const cubeKey = `cube-${formSessionId}-${formId || 'new'}`;
                const isEditMode = Boolean(formId && formId !== 'new');

                // Server image - hanya untuk edit mode, tidak untuk create
                const serverImageUrl = isEditMode ? getServerImageUrl('image', values, selected) : null;

                const valMap = (name) => values?.find?.((v) => v.name === name)?.value;
                const imageVersion =
                  valMap('image_updated_at') ||
                  valMap('updated_at') ||
                  formId ||
                  Date.now();

                const serverSrc = serverImageUrl ? withVersion(serverImageUrl, imageVersion) : '';

                // Prioritas File object dan blob preview
                const currentValue = fc.value;
                const hasFileObject = currentValue instanceof File;
                const canUseBlob = Boolean(previewUrl) && String(previewOwnerKey) === String(cubeKey);

                let finalPreviewSrc = '';
                if (hasFileObject && canUseBlob) {
                  finalPreviewSrc = previewUrl;
                } else if (hasFileObject) {
                  // Fallback: buat blob baru untuk File object
                  finalPreviewSrc = URL.createObjectURL(currentValue);
                } else if (serverSrc) {
                  finalPreviewSrc = serverSrc;
                }

                // File input handler
                const handleFileChange = (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Set ke form dan trigger crop
                  fc.onChange(file);
                  setPreviewOwnerKey(cubeKey);
                  handleFileInput(e, fc, cubeKey);
                };

                const fileInfo = hasFileObject ? `File: ${currentValue.name} (${(currentValue.size / 1024).toFixed(1)}KB)` : '';
                const label = cubeType == 2 ? 'Logo Kubus Merah' : 'Logo Kubus Hijau';

                return (
                  <div className="form-control" key={`cube-img-field-${cubeKey}`}>
                    <label className="label">
                      <span className="label-text font-medium">{label}</span>
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
                        onChange={handleFileChange}
                        key={`cube-file-input-${cubeKey}-${imageVersion}`}
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
                              // Clear preview dan form value
                              if (previewUrl?.startsWith('blob:')) {
                                URL.revokeObjectURL(previewUrl);
                              }
                              setPreviewUrl('');
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

            // === CONTENT SECTIONS BY TAB ===

            // Kubus Informasi Content
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const info = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                if (!info) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-lg text-slate-700 border-b pb-2">
                      Kubus Informasi
                    </div>

                    {/* Link Youtube (opsional) */}
                    <InputComponent
                      name="link_information"
                      label="Link Youtube"
                      placeholder="Masukkan link youtube"
                      {...formControl('link_information')}
                    />

                    {/* Judul Iklan (WAJIB) */}
                    <InputComponent
                      name="ads[title]"
                      label="Judul Iklan"
                      placeholder="Masukan Judul Iklan..."
                      {...formControl('ads[title]')}
                      validations={{ required: true }}
                    />

                    {/* Deskripsi Iklan (WAJIB) */}
                    {TextareaComponent && (
                      <TextareaComponent
                        name="ads[description]"
                        label="Deskripsi Iklan"
                        placeholder="Masukan Deskripsi Iklan..."
                        {...formControl('ads[description]')}
                        rows={5}
                        validations={{ required: true }}
                      />
                    )}
                  </div>
                );
              },
            },

            // Promo/Voucher Content
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => { // Tambahkan setValues di parameter
                const isInformation = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-lg text-slate-700 border-b pb-2">
                      {contentType === 'promo' ? 'Promo' : 'Voucher'}
                    </div>

                    {/* Judul (WAJIB) */}
                    <InputComponent
                      name="ads[title]"
                      label={`Judul ${contentType === 'promo' ? 'Promo' : 'Voucher'}`}
                      placeholder={`Masukan Judul ${contentType === 'promo' ? 'Promo' : 'Voucher'}...`}
                      {...formControl('ads[title]')}
                      validations={{ required: true }}
                    />

                    {/* Deskripsi (WAJIB) */}
                    {TextareaComponent && (
                      <TextareaComponent
                        name="ads[description]"
                        label={`Deskripsi ${contentType === 'promo' ? 'Promo' : 'Voucher'}`}
                        placeholder={`Masukan Deskripsi ${contentType === 'promo' ? 'Promo' : 'Voucher'}...`}
                        {...formControl('ads[description]')}
                        rows={5}
                        validations={{ required: true }}
                      />
                    )}

                    {/* Level UMKM and Production fields in row */}
                    <div className="grid grid-cols-3 gap-4">
                      <SelectComponent
                        name="ads[level_umkm]"
                        label="Level UMKM (Opsional)"
                        placeholder="..."
                        {...formControl('ads[level_umkm]')}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                        ]}
                      />
                      <InputNumberComponent
                        name="ads[max_production_per_day]"
                        label="Produksi Per Hari (Opsional)"
                        placeholder="..."
                        {...formControl('ads[max_production_per_day]')}
                      />
                      <InputNumberComponent
                        name="ads[sell_per_day]"
                        label="Penjualan Per Hari (Opsional)"
                        placeholder="..."
                        {...formControl('ads[sell_per_day]')}
                      />
                    </div>

                    {/* Category and Promo Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <SelectComponent
                        name="ads[ad_category_id]"
                        label="Kategori Iklan"
                        placeholder="Pilih Kategori Iklan..."
                        {...formControl('ads[ad_category_id]')}
                        serverOptionControl={{ path: 'admin/options/ad-category' }}
                      />
                      {/* Tipe Promo (WAJIB) */}
                      <SelectComponent
                        name="ads[promo_type]"
                        label="Tipe Promo"
                        placeholder="Pilih Tipe Promo..."
                        {...formControl('ads[promo_type]')}
                        options={[
                          { label: 'Online', value: 'online' },
                          { label: 'Offline', value: 'offline' },
                        ]}
                      />
                    </div>

                    {/* Link untuk tipe online */}
                    {values.find(i => i.name === 'ads[promo_type]')?.value === 'online' && (
                      <InputComponent
                        type="url"
                        name="cube_tags[0][link]"
                        label="Tautan/Link"
                        placeholder="Masukkan tautan/link promo online..."
                        onChange={(e) => {
                          setValues([
                            ...values.filter(i => i.name !== 'cube_tags[0][link]'),
                            { name: 'cube_tags[0][link]', value: e || '' },
                          ]);
                        }}
                        value={values.find(i => i.name === 'cube_tags[0][link]')?.value || ''}
                        validations={{ required: true }}
                      />
                    )}
                  </div>
                );
              },
            },

            // Maps and Address for Offline Promo/Voucher (moved here)
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                if (!isPromoOrVoucher(values)) return null; // hanya promo|voucher
                if (values.find((val) => val.name == 'ads[promo_type]')?.value !== 'offline') return null;

                return (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-slate-600 font-semibold">Lokasi Validasi</p>
                    <div className="mx-10 hover:mx-8 hover:border-4 border-green-500 rounded-lg">
                      <InputMapComponent
                        name="map-tag"
                        onChange={(e) => {
                          setValues([
                            ...values.filter(
                              (i) => ![
                                'cube_tags[0][map_lat]',
                                'cube_tags[0][map_lng]',
                                'cube_tags[0][address]',
                                'map_lat',
                                'map_lng',
                                'address',
                              ].includes(i.name)
                            ),
                            { name: 'cube_tags[0][map_lat]', value: e?.lat },
                            { name: 'cube_tags[0][map_lng]', value: e?.lng },
                            { name: 'cube_tags[0][address]', value: e?.address },
                            { name: 'map_lat', value: e?.lat },
                            { name: 'map_lng', value: e?.lng },
                            { name: 'address', value: e?.address },
                          ]);
                        }}
                      />
                    </div>
                    <InputComponent
                      name="cube_tags[0][address]"
                      label="Alamat Validasi"
                      placeholder="Masukan alamat..."
                      onChange={(e) => {
                        setValues([
                          ...values.filter((i) => i.name != 'cube_tags[0][address]'),
                          { name: 'cube_tags[0][address]', value: e },
                          { name: 'address', value: e },
                        ]);
                      }}
                      value={values.find((i) => i.name == 'cube_tags[0][address]')?.value || ''}
                      errors={errors.filter((i) => i.name == 'cube_tags[0][address]')?.error}
                    />
                  </div>
                );
              },
            },

            // Iklan Content
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => { // Tambahkan setValues di parameter
                const isInformation = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                if (isInformation || contentType !== 'iklan') return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-lg text-slate-700 border-b pb-2">
                      Iklan
                    </div>

                    {/* Judul */}
                    <InputComponent
                      name="ads[title]"
                      label="Judul Iklan"
                      placeholder="Masukan Judul Iklan..."
                      {...formControl('ads[title]')}
                    />

                    {/* Deskripsi */}
                    {TextareaComponent && (
                      <TextareaComponent
                        name="ads[description]"
                        label="Deskripsi Iklan"
                        placeholder="Masukan Deskripsi Iklan..."
                        {...formControl('ads[description]')}
                        rows={5}
                      />
                    )}

                    {/* Level UMKM and Production fields in row */}
                    <div className="grid grid-cols-3 gap-4">
                      <SelectComponent
                        name="ads[level_umkm]"
                        label="Level UMKM (Opsional)"
                        placeholder="..."
                        {...formControl('ads[level_umkm]')}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                        ]}
                      />
                      <InputNumberComponent
                        name="ads[max_production_per_day]"
                        label="Produksi Per Hari (Opsional)"
                        placeholder="..."
                        {...formControl('ads[max_production_per_day]')}
                      />
                      <InputNumberComponent
                        name="ads[sell_per_day]"
                        label="Penjualan Per Hari (Opsional)"
                        placeholder="..."
                        {...formControl('ads[sell_per_day]')}
                      />
                    </div>

                    {/* Category and Promo Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <SelectComponent
                        name="ads[ad_category_id]"
                        label="Kategori Iklan"
                        placeholder="Pilih Kategori Iklan..."
                        {...formControl('ads[ad_category_id]')}
                        serverOptionControl={{
                          path: 'admin/options/ad-category',
                        }}
                      />
                      <SelectComponent
                        name="ads[promo_type]"
                        label="Tipe Promo"
                        placeholder="pilih Tipe Promo..."
                        {...formControl('ads[promo_type]')}
                        options={[
                          { label: 'Online', value: 'online' },
                          { label: 'Offline', value: 'offline' },
                        ]}
                      />
                    </div>

                    {/* Link untuk tipe online */}
                    {values.find(i => i.name === 'ads[promo_type]')?.value === 'online' && (
                      <InputComponent
                        type="url"
                        name="cube_tags[0][link]"
                        label="Tautan/Link"
                        placeholder="Masukkan tautan/link promo online..."
                        onChange={(e) => {
                          setValues([
                            ...values.filter(i => i.name !== 'cube_tags[0][link]'),
                            { name: 'cube_tags[0][link]', value: e || '' },
                          ]);
                        }}
                        value={values.find(i => i.name === 'cube_tags[0][link]')?.value || ''}
                        validations={{ required: true }}
                      />
                    )}
                  </div>
                );
              },
            },

            // Offline Iklan Location Validation
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                if (contentType !== 'iklan') return null;
                if (values.find((i) => i.name == 'ads[promo_type]')?.value !== 'offline') return null;

                return (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm text-slate-600 font-semibold">Lokasi Validasi</p>
                    <div className="mx-10 hover:mx-8 hover:border-4 border-green-500 rounded-lg transition">
                      <InputMapComponent
                        name="iklan-map"
                        onChange={(e) => {
                          setValues([
                            ...values.filter(
                              (i) =>
                                ![
                                  'cube_tags[0][map_lat]',
                                  'cube_tags[0][map_lng]',
                                  'cube_tags[0][address]',
                                  'map_lat',
                                  'map_lng',
                                  'address',
                                ].includes(i.name)
                            ),
                            { name: 'cube_tags[0][map_lat]', value: e?.lat },
                            { name: 'cube_tags[0][map_lng]', value: e?.lng },
                            { name: 'cube_tags[0][address]', value: e?.address },
                            { name: 'map_lat', value: e?.lat },
                            { name: 'map_lng', value: e?.lng },
                            { name: 'address', value: e?.address },
                          ]);
                        }}
                      />
                    </div>

                    <InputComponent
                      name="cube_tags[0][address]"
                      label="Alamat Validasi"
                      placeholder="Masukkan alamat..."
                      onChange={(e) => {
                        setValues([
                          ...values.filter((i) => i.name != 'cube_tags[0][address]'),
                          { name: 'cube_tags[0][address]', value: e },
                          { name: 'address', value: e },
                        ]);
                      }}
                      value={values.find((i) => i.name == 'cube_tags[0][address]')?.value || ''}
                    />
                  </div>
                );
              },
            },

            // === IMAGES SECTION ===

            // 3 Gambar untuk semua konten (Promo, Voucher, Iklan, Kubus Informasi)
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const ct = getCT(values); // 'promo' | 'voucher' | 'iklan' | 'kubus-informasi'
                const show =
                  ct === 'promo' || ct === 'voucher' || ct === 'iklan' || isInfo(values);
                if (!show) return null;

                // Helper untuk membuat field gambar dengan crop
                const createImageField = (fieldName, label) => {
                  const fc = formControl(fieldName);
                  const formId = values?.find?.((v) => v.name === 'id')?.value;
                  const imageKey = `${fieldName}-${formSessionId}-${formId || 'new'}`;
                  const isEditMode = Boolean(formId && formId !== 'new');

                  // Server image - hanya untuk edit mode, tidak untuk create
                  const serverImageUrl = isEditMode ? getServerImageUrl(fieldName, values, selected) : null;

                  const valMap = (name) => values?.find?.((v) => v.name === name)?.value;
                  const imageVersion =
                    valMap(`${fieldName}_updated_at`) ||
                    valMap('updated_at') ||
                    formId ||
                    Date.now();

                  const serverSrc = serverImageUrl ? withVersion(serverImageUrl, imageVersion) : '';

                  // Debug log untuk masing-masing field gambar
                  if (process.env.NODE_ENV === 'development' && isEditMode) {
                    // eslint-disable-next-line no-console
                    console.log(`🖼️ ${fieldName} createImageField DEBUG:`, {
                      fieldName,
                      formId,
                      isEditMode,
                      serverImageUrl,
                      serverSrc,
                      currentValue: fc.value,
                      selectedData: selected?.ads?.[0],
                      imageVersion
                    });
                  }

                  // Prioritas File object dan blob preview
                  const currentValue = fc.value;
                  const hasFileObject = currentValue instanceof File;
                  const canUseBlob = Boolean(previewUrl) && String(previewOwnerKey) === String(imageKey);

                  let finalPreviewSrc = '';
                  if (hasFileObject && canUseBlob) {
                    finalPreviewSrc = previewUrl;
                  } else if (hasFileObject) {
                    // Fallback: buat blob baru untuk File object
                    finalPreviewSrc = URL.createObjectURL(currentValue);
                  } else if (serverSrc) {
                    finalPreviewSrc = serverSrc;
                  } else if (isEditMode && currentValue && typeof currentValue === 'string') {
                    // ✅ PERBAIKAN: Jika ada value dari form tapi serverSrc gagal, gunakan langsung
                    const cleanPath = toStoragePath(currentValue);
                    if (cleanPath && !cleanPath.includes('.tmp')) {
                      finalPreviewSrc = withVersion(cleanPath, imageVersion);
                    }
                  }

                  // File input handler
                  const handleFileChange = (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Set ke form dan trigger crop
                    fc.onChange(file);
                    setPreviewOwnerKey(imageKey);
                    handleFileInput(e, fc, imageKey);
                  };

                  const fileInfo = hasFileObject ? `File: ${currentValue.name} (${(currentValue.size / 1024).toFixed(1)}KB)` : '';

                  // Debug final state sebelum render
                  if (process.env.NODE_ENV === 'development' && isEditMode) {
                    // eslint-disable-next-line no-console
                    console.log(`🎨 ${fieldName} FINAL RENDER STATE:`, {
                      fieldName,
                      finalPreviewSrc,
                      hasFileObject,
                      serverSrc,
                      currentValue,
                      canUseBlob,
                      imageKey,
                      previewOwnerKey
                    });
                  }

                  return (
                    <div className="form-control" key={`${fieldName}-field-${imageKey}`}>
                      <label className="label">
                        <span className="label-text font-medium">{label}</span>
                        {hasFileObject && (
                          <span className="label-text-alt text-green-600 text-xs">📁 {fileInfo}</span>
                        )}
                      </label>

                      <div className="mb-4">
                        {finalPreviewSrc ? (
                          <div className="w-full h-32 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                            <Image
                              src={finalPreviewSrc}
                              alt="Preview"
                              width={128}
                              height={128}
                              className="max-w-full max-h-full object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-gray-500 text-xs">Belum ada gambar</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="file-input file-input-bordered file-input-sm"
                          onChange={handleFileChange}
                          key={`${fieldName}-file-input-${imageKey}-${imageVersion}`}
                        />
                        {finalPreviewSrc && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => handleRecrop(fc)}
                              title="Crop ulang"
                            >
                              Crop
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-error btn-xs"
                              onClick={() => {
                                // Clear preview dan form value
                                if (previewUrl?.startsWith('blob:')) {
                                  URL.revokeObjectURL(previewUrl);
                                }
                                setPreviewUrl('');
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
                        PNG/JPG/WEBP, maks 10MB
                      </span>
                    </div>
                  );
                };

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-base text-slate-700">
                      {isInfo(values) ? 'Gambar Kubus Informasi' : 'Gambar Konten'}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {createImageField('ads[image_1]', 'Gambar 1')}
                      {createImageField('ads[image_2]', 'Gambar 2')}
                      {createImageField('ads[image_3]', 'Gambar 3')}
                    </div>
                  </div>
                );
              },
            },

            // Banner Image
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const fc = formControl('ads[image]');
                const formId = values?.find?.((v) => v.name === 'id')?.value;
                const bannerKey = `ads-image-${formSessionId}-${formId || 'new'}`;
                const isEditMode = Boolean(formId && formId !== 'new');

                // Server image - hanya untuk edit mode, tidak untuk create
                const serverImageUrl = isEditMode ? getServerImageUrl('ads[image]', values, selected) : null;

                const valMap = (name) => values?.find?.((v) => v.name === name)?.value;
                const imageVersion =
                  valMap('ads[image]_updated_at') ||
                  valMap('updated_at') ||
                  formId ||
                  Date.now();

                const serverSrc = serverImageUrl ? withVersion(serverImageUrl, imageVersion) : '';

                // Prioritas File object dan blob preview
                const currentValue = fc.value;
                const hasFileObject = currentValue instanceof File;
                const canUseBlob = Boolean(previewUrl) && String(previewOwnerKey) === String(bannerKey);

                let finalPreviewSrc = '';
                if (hasFileObject && canUseBlob) {
                  finalPreviewSrc = previewUrl;
                } else if (hasFileObject) {
                  // Fallback: buat blob baru untuk File object
                  finalPreviewSrc = URL.createObjectURL(currentValue);
                } else if (serverSrc) {
                  finalPreviewSrc = serverSrc;
                }

                // File input handler
                const handleFileChange = (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Set ke form dan trigger crop
                  fc.onChange(file);
                  setPreviewOwnerKey(bannerKey);
                  handleFileInput(e, fc, bannerKey);
                };

                const fileInfo = hasFileObject ? `File: ${currentValue.name} (${(currentValue.size / 1024).toFixed(1)}KB)` : '';

                return (
                  <div className="mt-6">
                    <div className="font-semibold text-base text-slate-700 mb-4">
                      Banner Gambar (Opsional)
                    </div>
                    <div className="px-32">
                      <div className="form-control" key={`banner-field-${bannerKey}`}>
                        <label className="label">
                          <span className="label-text font-medium">Banner</span>
                          {hasFileObject && (
                            <span className="label-text-alt text-green-600 text-xs">📁 {fileInfo}</span>
                          )}
                        </label>

                        <div className="mb-4">
                          {finalPreviewSrc ? (
                            <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                              <Image
                                src={finalPreviewSrc}
                                alt="Banner Preview"
                                width={384}
                                height={192}
                                className="max-w-full max-h-full object-contain"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <div className="text-center">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-500 text-sm">Belum ada banner dipilih</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="file-input file-input-bordered flex-1"
                            onChange={handleFileChange}
                            key={`banner-file-input-${bannerKey}-${imageVersion}`}
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
                                  // Clear preview dan form value
                                  if (previewUrl?.startsWith('blob:')) {
                                    URL.revokeObjectURL(previewUrl);
                                  }
                                  setPreviewUrl('');
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
                    </div>
                  </div>
                );
              },
            },

            // === PROMO/VOUCHER SPECIFIC SECTIONS ===

            // Validation Type (for promo/voucher only)
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <div className="space-y-3">
                    <SelectComponent
                      name="ads[validation_type]"
                      label="Tipe Validasi *"
                      placeholder="Pilih tipe validasi..."
                      required
                      options={[
                        { label: "Generate Otomatis (QR Code)", value: "auto" },
                        { label: "Masukan Kode Unik", value: "manual" },
                      ]}
                      value={values.find((i) => i.name == 'ads[validation_type]')?.value || 'auto'}
                      onChange={(value) => {
                        // Debug log untuk tracking perubahan
                        if (typeof window !== 'undefined') {
                          // eslint-disable-next-line no-console
                          console.log('[DEBUG validation_type onChange]', {
                            newValue: value,
                            currentCode: values.find((i) => i.name == 'ads[code]')?.value,
                            allAdsFields: values.filter(i => i.name.startsWith('ads[') || i.name.startsWith('ads.'))
                          });
                        }

                        setValues([
                          ...values.filter((i) => i.name != 'ads[validation_type]'),
                          { name: 'ads[validation_type]', value: value },
                        ]);

                        // Clear kode unik jika beralih ke auto
                        if (value === 'auto') {
                          setValues(prev => [
                            ...prev.filter((i) => i.name != 'ads[code]'),
                            { name: 'ads[code]', value: '' },
                          ]);
                        }
                      }}
                      validations={{ required: true }}
                    />
                  </div>
                );
              },
            },

            // Kode Unik (hanya tampil jika validation_type = manual)
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                const validationType = values.find((i) => i.name == 'ads[validation_type]')?.value;

                if (isInformation || !['promo', 'voucher'].includes(contentType) || validationType !== 'manual') {
                  return null;
                }

                return (
                  <div className="space-y-3">
                    <InputComponent
                      name="ads[code]"
                      label="Kode Unik *"
                      placeholder="Masukan kode unik untuk validasi manual..."
                      required
                      value={values.find((i) => i.name == 'ads[code]')?.value || ''}
                      onChange={(e) => {
                        // Debug log untuk tracking perubahan code
                        if (typeof window !== 'undefined') {
                          // eslint-disable-next-line no-console
                          console.log('[DEBUG ads[code] onChange]', {
                            newValue: e,
                            validationType: values.find((i) => i.name == 'ads[validation_type]')?.value
                          });
                        }

                        setValues([
                          ...values.filter((i) => i.name != 'ads[code]'),
                          { name: 'ads[code]', value: e },
                        ]);
                      }}
                      error={errors.find((i) => i.name == 'ads[code]')?.error}
                      validations={{ required: true }}
                    />
                    <p className="text-sm text-gray-500">
                      Kode ini akan digunakan untuk validasi manual oleh user. Pastikan kode mudah diingat dan unik.
                    </p>
                  </div>
                );
              },
            },

            // Promo Settings (Unlimited, Daily, Quantity)
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-base text-slate-700">
                      Pengaturan {contentType === 'promo' ? 'Promo' : 'Voucher'}
                    </div>

                    {/* Promo Unlimited and Daily Settings */}
                    <div className="flex gap-4">
                      <CheckboxComponent
                        label="Promo Tak Terbatas"
                        name="ads[unlimited_grab]"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[unlimited_grab]'),
                            {
                              name: 'ads[unlimited_grab]',
                              value: !values.find((i) => i.name == 'ads[unlimited_grab]')?.value ? 1 : 0,
                            },
                          ]);
                        }}
                        checked={values?.find((i) => i.name == 'ads[unlimited_grab]')?.value || false}
                      />

                      <CheckboxComponent
                        label="Promo Harian"
                        name="ads[is_daily_grab]"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[is_daily_grab]'),
                            {
                              name: 'ads[is_daily_grab]',
                              value: !values.find((i) => i.name == 'ads[is_daily_grab]')?.value ? 1 : 0,
                            },
                          ]);
                        }}
                        checked={values?.find((i) => i.name == 'ads[is_daily_grab]')?.value}
                        disabled={values?.find((i) => i.name == 'ads[unlimited_grab]')?.value || false}
                      />
                    </div>

                    {/* Layout baru sesuai permintaan */}
                    {/* Row 1: Jumlah Promo + Batas Waktu Validasi */}
                    <div className="grid grid-cols-2 gap-4">
                      <InputNumberComponent
                        type="number"
                        name="ads[max_grab]"
                        label={
                          values?.find((i) => i.name == 'ads[is_daily_grab]')?.value
                            ? 'Jumlah Promo Per Hari'
                            : 'Jumlah Promo'
                        }
                        placeholder={
                          values?.find((i) => i.name == 'ads[is_daily_grab]')?.value
                            ? 'Promo yang bisa diambil dalam satu hari...'
                            : 'Masukan Jumlah Promo...'
                        }
                        validations={{ required: true }}
                        onChange={(e) =>
                          setValues([
                            ...values.filter((i) => i.name != 'ads[max_grab]'),
                            { name: 'ads[max_grab]', value: e },
                          ])
                        }
                        value={values.find((i) => i.name == 'ads[max_grab]')?.value}
                        error={errors.find((i) => i.name == 'ads[max_grab]')?.error}
                        disabled={values?.find((i) => i.name == 'ads[unlimited_grab]')?.value}
                      />
                      <InputTimeComponent
                        name="ads[validation_time_limit]"
                        label="Batas Waktu Validasi"
                        placeholder="Masukan Batas Waktu Validasi..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'ads[validation_time_limit]'),
                            { name: 'ads[validation_time_limit]', value: v }, // format HH:mm
                          ]);
                        }}
                        value={values.find((i) => i.name === 'ads[validation_time_limit]')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>

                    {/* Row 2: Berlaku Mulai + Berakhir Pada */}
                    <div className="grid grid-cols-2 gap-4">
                      <InputComponent
                        type="date"
                        name="ads[start_validate]"
                        label="Berlaku Mulai"
                        placeholder="Pilih Tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[start_validate]'),
                            { name: 'ads[start_validate]', value: moment(e).format('DD-MM-YYYY') },
                          ]);
                        }}
                        value={values.find((i) => i.name == 'ads[start_validate]')?.value || ''}
                        errors={errors.filter((i) => i.name == 'ads[start_validate]')?.error}
                        validations={{ required: true }}
                      />
                      <InputComponent
                        type="date"
                        name="ads[finish_validate]"
                        label="Berakhir Pada"
                        placeholder="Pilih Tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[finish_validate]'),
                            { name: 'ads[finish_validate]', value: moment(e)?.format('DD-MM-YYYY') },
                          ]);
                        }}
                        value={values.find((i) => i.name == 'ads[finish_validate]')?.value || ''}
                        errors={errors.filter((i) => i.name == 'ads[finish_validate]')?.error}
                        validations={{ required: true }}
                      />
                    </div>

                    {/* Row 3: Jam Mulai + Jam Berakhir */}
                    <div className="grid grid-cols-2 gap-4">
                      <InputTimeComponent
                        name="ads[jam_mulai]"
                        label="Jam Mulai"
                        placeholder="Pilih Jam..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'ads[jam_mulai]'),
                            { name: 'ads[jam_mulai]', value: v }, // HH:mm
                          ]);
                        }}
                        value={values.find((i) => i.name === 'ads[jam_mulai]')?.value || ''}
                        validations={{ required: true }}
                      />
                      <InputTimeComponent
                        name="ads[jam_berakhir]"
                        label="Jam Berakhir"
                        placeholder="Pilih Jam..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'ads[jam_berakhir]'),
                            { name: 'ads[jam_berakhir]', value: v }, // HH:mm
                          ]);
                        }}
                        value={values.find((i) => i.name === 'ads[jam_berakhir]')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>

                    {/* Row 4: Hanya Di Waktu Tertentu (versi hijau, mirip screenshot) */}
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-slate-700">
                        Hanya Di Waktu Tertentu
                      </div>

                      {/* Segmented radio -> ganti ke radio bulat (accent hijau) */}
                      <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                        <div className="flex items-center gap-6">
                          {[
                            { key: 'weekend', label: 'Weekend' },
                            { key: 'weekday', label: 'Weekdays' },
                            { key: 'custom', label: 'Hari Lain' },
                          ].map(opt => {
                            const checked = values.find(i => i.name == 'ads[day_type]')?.value === opt.key;

                            return (
                              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="day_type"
                                  value={opt.key}
                                  checked={checked}
                                  onChange={() => {
                                    // set day_type dengan prefix ads.
                                    const next = [
                                      ...values.filter(i => i.name !== 'ads[day_type]'),
                                      { name: 'ads[day_type]', value: opt.key },
                                    ];

                                    // bersihkan pilihan hari kustom
                                    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                    const cleaned = next.filter(i => !dayNames.some(d => i.name === `ads[custom_days][${d}]`));

                                    // prefill utk weekend/weekday (agar pill hari di bawah tampil aktif)
                                    if (opt.key !== 'custom') {
                                      const preset = {
                                        weekend: { saturday: true, sunday: true },
                                        weekday: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
                                      }[opt.key] || {};
                                      const injected = Object.entries(preset).map(([d, v]) => ({
                                        name: `ads[custom_days][${d}]`,
                                        value: v
                                      }));
                                      setValues([...cleaned, ...injected]);
                                    } else {
                                      setValues(cleaned);
                                    }
                                  }}
                                  className="h-4 w-4 accent-green-600"
                                  style={{ accentColor: '#16a34a' }} // fallback kalau Tailwind accent-color belum aktif
                                />
                                <span className={checked ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                                  {opt.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      {/* Baris kedua: “Hanya Di Hari” dengan pill hari */}
                      <div className="font-medium text-sm text-slate-700">
                        Hanya Di Hari
                      </div>
                      {(() => {
                        const dayType = values.find(i => i.name == 'ads[day_type]')?.value || 'custom';
                        const isCustom = dayType === 'custom';

                        const days = [
                          { label: 'Senin', key: 'monday' },
                          { label: 'Selasa', key: 'tuesday' },
                          { label: 'Rabu', key: 'wednesday' },
                          { label: 'Kamis', key: 'thursday' },
                          { label: 'Jumat', key: 'friday' },
                          { label: 'Sabtu', key: 'saturday' },
                          { label: 'Minggu', key: 'sunday' },
                        ];

                        // status terpilih
                        const selected = (k) =>
                          !!values.find(i => i.name === `ads[custom_days][${k}]`)?.value;

                        return (
                          <div className="flex flex-wrap gap-2">
                            {days.map(d => {
                              const active = selected(d.key);
                              return (
                                <button
                                  type="button"
                                  key={d.key}
                                  onClick={() => {
                                    if (!isCustom) return; // weekend/weekday = readonly
                                    const exists = values.find(i => i.name === `ads[custom_days][${d.key}]`)?.value || false;
                                    setValues([
                                      ...values.filter(i => i.name !== `ads[custom_days][${d.key}]`),
                                      { name: `ads[custom_days][${d.key}]`, value: !exists },
                                    ]);
                                  }}
                                  className={[
                                    "px-3 py-1.5 rounded-md border text-sm font-medium transition",
                                    active
                                      ? "bg-green-600 text-white border-green-600 shadow"
                                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-400",
                                    isCustom ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
                                  ].join(' ')}
                                >
                                  {d.label}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              },
            },

            // === VOUCHER TARGET RECIPIENT SECTION ===

            // Target Type Selection for Voucher
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => {
                const contentType = getCT(values);
                if (contentType !== 'voucher') return null;

                const fc = formControl('target_type');
                const current = fc.value ?? 'all';

                // Normalisasi onChange apapun bentuknya (event / {value,label} / string)
                const handleChange = (valOrEvent) => {
                  const newValue = valOrEvent?.target?.value ?? valOrEvent?.value ?? valOrEvent;

                  // 1) Update field target_type via formControl (biar konsisten dengan TableSupervision)
                  fc.onChange(newValue);

                  // 2) Hanya bersihkan field turunan, JANGAN set { name:'target_type' } lagi
                  setValues(prev =>
                    prev.filter(v => !['target_user_ids', 'community_id'].includes(v.name))
                  );
                };

                return (
                  <div className="space-y-3">
                    <div className="font-semibold text-base text-slate-700">Target Penerima Voucher</div>
                    <SelectComponent
                      name="target_type"
                      label="Siapa Yang Bisa Menggunakan Voucher?"
                      required
                      value={current}
                      onChange={handleChange}
                      options={[
                        { label: 'Semua User', value: 'all' },
                        { label: 'User Tertentu', value: 'user' },
                        { label: 'Komunitas Tertentu', value: 'community' },
                      ]}
                    />
                  </div>
                );
              },
            },

            // Community Selection for Voucher
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const contentType = getCT(values);
                const targetType = values.find(i => i.name === 'target_type')?.value;
                if (contentType !== 'voucher' || targetType !== 'community') return null;

                const currentValue = values?.find(i => i.name === 'community_id')?.value || '';

                return (
                  <SelectComponent
                    name="community_id"
                    label="Pilih Komunitas"
                    placeholder="Pilih komunitas yang bisa menggunakan voucher"
                    required
                    value={currentValue}
                    onChange={(selectedValue) => {
                      setValues([
                        ...values.filter(i => i.name !== 'community_id'),
                        { name: 'community_id', value: selectedValue }
                      ]);
                    }}
                    serverOptionControl={{
                      path: 'admin/options/community',
                    }}
                  />
                );
              },
            },

            // User Selection for Voucher
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const contentType = getCT(values);
                const targetType = values.find(i => i.name === 'target_type')?.value;
                if (contentType !== 'voucher' || targetType !== 'user') return null;

                return (
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
                );
              },
            },

            // === OPENING HOURS SECTION ===

            // Opening Hours Toggle and Input
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                if (contentType === 'kubus-informasi' || isInformation || contentType === 'iklan') return null;

                return (
                  <div className="mt-3">
                    <ToggleComponent
                      label="Tambahkan Jam Buka"
                      name="openHours"
                      onChange={() =>
                        setValues([
                          ...values.filter((i) => i.name != 'openHours'),
                          {
                            name: 'openHours',
                            value: !values.find((i) => i.name == 'openHours')?.value,
                          },
                        ])
                      }
                      checked={values?.find((i) => i.name == 'openHours')?.value}
                    />
                    {values.find((i) => i.name == 'openHours')?.value && (
                      <div className="bg-stone-50 py-6">
                        <InputOpenHours
                          values={values}
                          setValues={setValues}
                          errors={errors}
                        />
                      </div>
                    )}
                  </div>
                );
              },
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            // Set selected ke data yang sedang diedit
            setSelected(data);

            let worldID = data.world_id ? { world_id: data.world_id } : null;
            let ownerUserID = data.user_id ? { owner_user_id: data.user_id } : null;
            let corporateID = data.corporate_id ? { corporate_id: data.corporate_id } : null;

            // tentukan content_type dari data
            const ad = data?.ads?.[0];
            const contentType =
              data?.is_information
                ? 'kubus-informasi'
                : ad?.type === 'voucher'
                  ? 'voucher'
                  : ad?.type === 'iklan'
                    ? 'iklan'
                    : 'promo'; // termasuk 'general' tetap dianggap promo

            // Debug log untuk memeriksa mapping gambar (development only)
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('🔧 FORM UPDATE MAPPING:', {
                cubeId: data?.id,
                cubePictureSource: data?.picture_source,
                adId: ad?.id,
                adPictureSource: ad?.picture_source,
                adImage1: ad?.image_1,
                adImage2: ad?.image_2,
                adImage3: ad?.image_3,
                contentType,
                // Debug semua field ads
                fullAdData: ad,
                // Debug data mentah
                rawData: data
              });
            }

            return {
              cube_type_id: data?.cube_type_id,
              is_recommendation: data?.is_recommendation ? 1 : 0,
              is_information: data?.is_information ? 1 : 0,
              link_information: data?.link_information || '',
              // Simpan data map original untuk ditampilkan saat toggle aktif
              _original_map_lat: data?.map_lat,
              _original_map_lng: data?.map_lng,
              _original_address: data?.address,
              status: data?.status,

              // penting: prefill untuk kondisi link
              content_type: contentType,
              'ads[promo_type]': ad?.promo_type || '',

              // prefill validation type dan code (untuk promo/voucher)
              'ads[validation_type]': ad?.validation_type || 'auto',
              'ads[code]': ad?.code || '',

              // prefill link dari tag pertama
              'cube_tags[0][link]': data?.tags?.at(0)?.link || '',

              // Kembalikan data map existing untuk menjaga konsistensi
              // Server akan mengabaikan perubahan lokasi jika update_location = 0
              'cube_tags[0][map_lat]': data?.tags?.at(0)?.map_lat || data?.map_lat || '',
              'cube_tags[0][map_lng]': data?.tags?.at(0)?.map_lng || data?.map_lng || '',
              'cube_tags[0][address]': data?.tags?.at(0)?.address || data?.address || '',

              // Default value untuk field voucher target penerima
              target_type: ad?.target_type || 'all',
              target_user_ids: ad?.target_user_ids || [],
              community_id: ad?.community_id || '',

              // ✅ PERBAIKAN: Mapping gambar untuk form edit
              // Gambar cube (logo untuk tipe kubus merah/hijau)
              image: data?.picture_source || '',
              
              // Gambar ads (banner dan 3 gambar konten)
              'ads[image]': ad?.picture_source || '',      // banner
              'ads[image_1]': ad?.image_1 || '',           // gambar 1
              'ads[image_2]': ad?.image_2 || '',           // gambar 2  
              'ads[image_3]': ad?.image_3 || '',           // gambar 3

              // ✅ TAMBAHAN: Mapping field ads lainnya untuk konsistensi
              'ads[title]': ad?.title || '',
              'ads[description]': ad?.description || '',
              'ads[ad_category_id]': ad?.ad_category_id || '',
              'ads[level_umkm]': ad?.level_umkm || '',
              'ads[max_production_per_day]': ad?.max_production_per_day || '',
              'ads[sell_per_day]': ad?.sell_per_day || '',
              'ads[is_daily_grab]': ad?.is_daily_grab ? 1 : 0,
              'ads[unlimited_grab]': ad?.unlimited_grab ? 1 : 0,
              'ads[max_grab]': ad?.max_grab || '',

              // ✅ TAMBAHAN: Field time dan validation
              'ads[jam_mulai]': ad?.jam_mulai ? String(ad.jam_mulai).substring(0, 5) : '',
              'ads[jam_berakhir]': ad?.jam_berakhir ? String(ad.jam_berakhir).substring(0, 5) : '',
              'ads[day_type]': ad?.day_type || 'custom',
              
              // ✅ Custom days mapping
              ...(ad?.custom_days && typeof ad.custom_days === 'object' ? 
                Object.entries(ad.custom_days).reduce((acc, [day, value]) => {
                  acc[`ads[custom_days][${day}]`] = value;
                  return acc;
                }, {}) : {}
              ),

              // ✅ Date validation fields
              ...(ad?.start_validate ? {
                'ads[start_validate]': moment(ad.start_validate).format('DD-MM-YYYY')
              } : {}),
              ...(ad?.finish_validate ? {
                'ads[finish_validate]': moment(ad.finish_validate).format('DD-MM-YYYY')
              } : {}),

              ...worldID,
              ...ownerUserID,
              ...corporateID,
            };
          },
          contentType: 'multipart/form-data',
          custom: [
            // --- MANAGER TENANT (bisa diubah) ---
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const cubeType = values?.find(i => i.name == 'cube_type_id')?.value;
                const isInfo = !!values.find(i => i.name === 'is_information')?.value;

                if (isInfo) return null; // sembunyikan saat Kubus Informasi

                return (
                  <>
                    {cubeType == 2 ? (
                      <SelectComponent
                        name="corporate_id"
                        label="Manager Tenant (Mitra) - Opsional"
                        placeholder="Pilih Mitra..."
                        serverOptionControl={{ path: `admin/options/corporate` }}
                        {...formControl('corporate_id')}
                        searchable
                      />
                    ) : (
                      <div>
                        <SelectComponent
                          name="owner_user_id"
                          label="Manager Tenant"
                          placeholder={
                            managersLoading
                              ? "Loading manager tenant..."
                              : merchantManagers.length === 0
                                ? "Tidak ada manager tenant"
                                : "Pilih manager tenant..."
                          }
                          {...formControl('owner_user_id')}
                          options={merchantManagers.map((u) => ({
                            value: String(u.id),
                            label: `${getDisplayName(u)}${getPhone(u) ? " — " + getPhone(u) : ""}`,
                          }))}
                          disabled={managersLoading}
                        />
                        {managersError && (
                          <p className="text-red-500 text-sm mt-1">{managersError}</p>
                        )}
                      </div>
                    )}
                  </>
                );
              },
            },

            // --- REKOMENDASI BERANDA ---
            {
              type: 'check',
              construction: {
                name: 'is_recommendation',
                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
              },
            },

            // --- UBAH LOKASI (toggle + map) ---
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInfo = !!values?.find(i => i.name == 'is_information')?.value;
                if (isInfo) return null;

                const changeMapActive = values?.find(i => i.name == 'change_map')?.value;

                // ✅ Pastikan nilai lama tetap dikirim saat toggle off
                const ensure = (name, fallbackName) => {
                  const exists = values.some(i => i.name === name);
                  if (!exists) {
                    const fallback = values.find(i => i.name === fallbackName)?.value || '';
                    if (fallback !== '') {
                      setValues([...values, { name, value: fallback }]);
                    }
                  }
                };

                // Ambil data lokasi asli dari default
                ensure('map_lat', '_original_map_lat');
                ensure('map_lng', '_original_map_lng');
                ensure('address', '_original_address');
                ensure('cube_tags[0][map_lat]', '_original_map_lat');
                ensure('cube_tags[0][map_lng]', '_original_map_lng');
                ensure('cube_tags[0][address]', '_original_address');

                return (
                  <ToggleComponent
                    label="Ubah Lokasi Kubus"
                    onChange={() =>
                      setValues([
                        ...values.filter(i => i.name != 'change_map'),
                        { name: 'change_map', value: !changeMapActive },
                      ])
                    }
                    checked={!!changeMapActive}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInfo = !!values?.find((i) => i.name == 'is_information')?.value;
                if (isInfo) return null;

                const change = values?.find(i => i.name == 'change_map')?.value;
                const lat0 = values?.find(i => i.name == '_original_map_lat')?.value;
                const lng0 = values?.find(i => i.name == '_original_map_lng')?.value;
                const addr0 = values?.find(i => i.name == '_original_address')?.value;

                if (!change) return null;

                return (
                  <div className="mx-10 hover:mx-8 hover:border-4 border-green-500 rounded-lg">
                    <InputMapComponent
                      name="map"
                      initialLat={lat0}
                      initialLng={lng0}
                      initialAddress={addr0}
                      onChange={(e) => {
                        const keep = (arr, names) => arr.filter(i => !names.includes(i.name));
                        const rm = [
                          'map_lat', 'map_lng', 'address',
                          'cube_tags[0][map_lat]', 'cube_tags[0][map_lng]', 'cube_tags[0][address]'
                        ];
                        setValues([
                          ...keep(values, rm),
                          { name: 'map_lat', value: e?.lat },
                          { name: 'map_lng', value: e?.lng },
                          { name: 'address', value: e?.address },
                          { name: 'cube_tags[0][map_lat]', value: e?.lat },
                          { name: 'cube_tags[0][map_lng]', value: e?.lng },
                          { name: 'cube_tags[0][address]', value: e?.address },
                        ]);
                      }}
                    />
                  </div>
                );
              },
            },

            // --- TIPE VALIDASI (untuk promo/voucher saja) ---
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const contentType = values?.find(i => i.name === 'content_type')?.value || 'promo';
                const isInformation = values?.find(i => i.name === 'is_information')?.value;

                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <div className="space-y-3">
                    <SelectComponent
                      name="ads[validation_type]"
                      label="Tipe Validasi *"
                      placeholder="Pilih tipe validasi..."
                      required
                      options={[
                        { label: "Generate Otomatis (QR Code)", value: "auto" },
                        { label: "Masukan Kode Unik", value: "manual" },
                      ]}
                      value={values?.find((i) => i.name == 'ads[validation_type]')?.value || 'auto'}
                      onChange={(value) => {
                        setValues([
                          ...values.filter((i) => i.name != 'ads[validation_type]'),
                          { name: 'ads[validation_type]', value: value },
                        ]);

                        // Clear kode unik jika beralih ke auto
                        if (value === 'auto') {
                          setValues(prev => [
                            ...prev.filter((i) => i.name != 'ads[code]'),
                            { name: 'ads[code]', value: '' },
                          ]);
                        }
                      }}
                      validations={{ required: true }}
                    />
                  </div>
                );
              },
            },

            // --- KODE UNIK (hanya tampil jika validation_type = manual) ---
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const contentType = values?.find(i => i.name === 'content_type')?.value || 'promo';
                const isInformation = values?.find(i => i.name === 'is_information')?.value;
                const validationType = values?.find((i) => i.name == 'ads[validation_type]')?.value;

                if (isInformation || !['promo', 'voucher'].includes(contentType) || validationType !== 'manual') {
                  return null;
                }

                return (
                  <div className="space-y-3">
                    <InputComponent
                      name="ads[code]"
                      label="Kode Unik *"
                      placeholder="Masukan kode unik untuk validasi manual..."
                      required
                      value={values?.find((i) => i.name == 'ads[code]')?.value || ''}
                      onChange={(e) => {
                        setValues([
                          ...values.filter((i) => i.name != 'ads[code]'),
                          { name: 'ads[code]', value: e.target.value },
                        ]);
                      }}
                      error={errors?.find((i) => i.name == 'ads[code]')?.error}
                      validations={{ required: true }}
                    />
                  </div>
                );
              },
            },

            // --- TAUTAN / LINK ---
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const ct = values?.find(i => i.name === 'content_type')?.value || 'promo';
                const promoType = values?.find(i => i.name === 'ads[promo_type]')?.value || '';

                // Hilangkan untuk IKLAN
                if (ct === 'iklan') return null;

                // Untuk Promo/Voucher: tampilkan hanya jika ONLINE
                if (!['promo', 'voucher'].includes(ct)) return null;
                if (promoType !== 'online') return null;

                return (
                  <InputComponent
                    type="url"
                    name="cube_tags[0][link]"
                    label="Tautan/Link"
                    placeholder="Masukkan tautan/link..."
                    onChange={(e) => {
                      setValues([
                        ...values.filter((i) => i.name !== 'cube_tags[0][link]'),
                        { name: 'cube_tags[0][link]', value: e || '' },
                      ]);
                    }}
                    value={values.find((i) => i.name === 'cube_tags[0][link]')?.value || ''}
                  />
                );
              },
            },

            // --- HIDDEN FIELDS UNTUK MEMASTIKAN KONSISTENSI DATA ---
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const changeMapActive = values?.find((i) => i.name == 'change_map')?.value;

                // Tambahkan flag untuk server mengetahui apakah lokasi perlu diupdate
                const hasUpdateLocationFlag = values.some((i) => i.name === 'update_location');

                if (!hasUpdateLocationFlag) {
                  setValues([
                    ...values,
                    { name: 'update_location', value: changeMapActive ? 1 : 0 }
                  ]);
                }

                return null; // Hidden component
              },
            },

            // === VOUCHER TARGET RECIPIENT SECTION FOR UPDATE ===

            // Target Type Selection for Voucher (Update Mode)
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => {
                const contentType = getCT(values);
                if (contentType !== 'voucher') return null;

                const fc = formControl('target_type');
                const current = fc.value ?? 'all';

                // Normalisasi onChange apapun bentuknya (event / {value,label} / string)
                const handleChange = (valOrEvent) => {
                  const newValue = valOrEvent?.target?.value ?? valOrEvent?.value ?? valOrEvent;

                  // 1) Update field target_type via formControl (biar konsisten dengan TableSupervision)
                  fc.onChange(newValue);

                  // 2) Hanya bersihkan field turunan, JANGAN set { name:'target_type' } lagi
                  setValues(prev =>
                    prev.filter(v => !['target_user_ids', 'community_id'].includes(v.name))
                  );
                };

                return (
                  <div className="space-y-3">
                    <div className="font-semibold text-base text-slate-700">Target Penerima Voucher</div>
                    <SelectComponent
                      name="target_type"
                      label="Siapa Yang Bisa Menggunakan Voucher?"
                      required
                      value={current}
                      onChange={handleChange}
                      options={[
                        { label: 'Semua User', value: 'all' },
                        { label: 'User Tertentu', value: 'user' },
                        { label: 'Komunitas Tertentu', value: 'community' },
                      ]}
                    />
                  </div>
                );
              },
            },

            // Community Selection for Voucher (Update Mode)
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const contentType = values?.find(i => i.name === 'content_type')?.value || 'promo';
                const targetType = values?.find(i => i.name === 'target_type')?.value;
                if (contentType !== 'voucher' || targetType !== 'community') return null;

                const currentValue = values?.find(i => i.name === 'community_id')?.value || '';

                return (
                  <SelectComponent
                    name="community_id"
                    label="Pilih Komunitas"
                    placeholder="Pilih komunitas yang bisa menggunakan voucher"
                    required
                    value={currentValue}
                    onChange={(selectedValue) => {
                      setValues([
                        ...values.filter(i => i.name !== 'community_id'),
                        { name: 'community_id', value: selectedValue }
                      ]);
                    }}
                    serverOptionControl={{
                      path: 'admin/options/community',
                    }}
                  />
                );
              },
            },

            // User Selection for Voucher (Update Mode)
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const contentType = values?.find(i => i.name === 'content_type')?.value || 'promo';
                const targetType = values?.find(i => i.name === 'target_type')?.value;
                if (contentType !== 'voucher' || targetType !== 'user') return null;

                return (
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
                );
              },
            }
          ],
        }}

        customDetail={(data) => {
          return (
            <GrabListComponent
              data={data}
              filter={[
                {
                  column: 'ad_id',
                  type: 'equal',
                  value: data?.ads.at(0)?.id,
                },
              ]}
            />
          );
        }}
        actionControl={{
          except: ['edit'],
          include: (data, { setModalForm, setDataSelected }) => {
            return (
              <>
                <ButtonComponent
                  icon={faEdit}
                  label={'Ubah Kubus'}
                  variant="outline"
                  paint="warning"
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setModalForm(true);
                    setDataSelected();
                  }}
                />
                <ButtonComponent
                  icon={faFilePen}
                  label={data.ads.at(0)?.id ? 'Ubah Iklan' : 'buat Iklan'}
                  variant="outline"
                  paint={data.ads.at(0)?.id ? 'warning' : 'primary'}
                  size={'xs'}
                  rounded
                  // infer jenis dari data yang ada
                  onClick={() => {
                    const inferred =
                      data?.ads?.at(0)?.type            // 'iklan' | 'voucher' | 'general'
                      ?? (data?.is_information ? 'kubus-informasi' : 'promo'); // fallback

                    setFormAds(inferred);
                    setSelected(data);
                  }}
                />
                <ButtonComponent
                  // icon={faBriefcase}
                  label={
                    data?.status === 'active' ? 'Non-Aktifkan' : 'Aktifkan'
                  }
                  variant="outline"
                  paint={data?.status === 'active' ? 'danger' : 'success'}
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setSelected(data);
                    setUpdateStatus(true);
                  }}
                />
              </>
            );
          },
        }}
        onStoreSuccess={(data) => {
          // Debug log untuk berhasil create
          if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('[KUBUS DEBUG] Store success:', data);
          }
          
          // Reset selected setelah berhasil create
          setSelected(null);
          setRefresh(!refresh);
        }}
        onUpdateSuccess={() => {
          // Reset selected setelah berhasil update
          setSelected(null);
          setRefresh(!refresh);
        }}
        onModalClose={() => {
          // Reset selected ketika modal ditutup
          setSelected(null);
        }}
      />

      <FloatingPageComponent
        show={formAds}
        title={`${formAds == 'huehuy'
          ? selected?.ads.some((obj) => obj.type == 'huehuy')
            ? 'Ubah iklan Huehuy'
            : 'Tambahkan iklan Huehuy'
          : selected?.ads?.at(0)?.id
            ? 'Ubah Iklan Utama'
            : 'Buat Iklan Utama'
          }`}
        onClose={() => {
          setFormAds(false);
        }}
      >
        <div className="px-6 pt-4 pb-20 h-full overflow-scroll scroll_control">
          <FormSupervisionComponent
            submitControl={{
              path:
                formAds == 'huehuy'
                  ? selected?.ads.some((obj) => obj.type != 'huehuy')
                    ? 'admin/ads'
                    : `admin/ads/${selected?.id}`
                  : selected?.ads?.at(0)?.id
                    ? `admin/ads/${selected?.ads?.at(0)?.id}`
                    : 'admin/ads',
              contentType: 'multipart/form-data',
            }}
            defaultValue={(() => {
              // Helper functions untuk mapping data edit
              const formatTime = (time) => {
                if (!time) return '';
                return typeof time === 'string' && time.includes(':') ? time.substring(0, 5) : time;
              };

              const mapCustomDays = (customDays) => {
                if (!customDays || typeof customDays !== 'object') return {};
                const result = {};
                Object.entries(customDays).forEach(([day, value]) => {
                  result[`custom_days[${day}]`] = value;
                });
                return result;
              };

              if (!selected?.ads?.at(0)?.id) {
                // Create mode
                return {
                  cube_id: selected?.id,
                  type: formAds || 'promo',
                  is_daily_grab: 0,
                  unlimited_grab: 0,
                  validation_type: 'auto',
                  content_type: formAds === 'iklan' ? 'iklan' : formAds === 'voucher' ? 'voucher' : 'promo',
                };
              }

              // Edit mode - map data dengan benar
              const ad = selected.ads[0];
              
              // eslint-disable-next-line no-console
              console.log('🔍 MAPPING ADS DATA FOR EDIT:', {
                adId: ad.id,
                title: ad.title,
                validationType: ad.validation_type,
                code: ad.code,
                jamMulai: ad.jam_mulai,
                jamBerakhir: ad.jam_berakhir,
                dayType: ad.day_type,
                customDays: ad.custom_days,
                image1: ad.image_1,
                image2: ad.image_2,
                image3: ad.image_3,
                pictureSource: ad.picture_source
              });

              return {
                _method: 'PUT',
                title: ad.title || '',
                description: ad.description || '',
                ad_category_id: ad.ad_category_id || '',
                promo_type: ad.promo_type || '',
                is_daily_grab: ad.is_daily_grab ? 1 : 0,
                unlimited_grab: ad.unlimited_grab ? 1 : 0,
                max_grab: ad.max_grab || '',
                cube_id: selected.id,
                type: ad.type || 'general',
                
                // ✅ PERBAIKI - Field gambar yang benar (tanpa _source)
                'ads[image]': ad.picture_source || '',
                'ads[image_1]': ad.image_1 || '',
                'ads[image_2]': ad.image_2 || '',
                'ads[image_3]': ad.image_3 || '',
                
                // ✅ PERBAIKI - Validation dan code
                validation_type: ad.validation_type || 'auto',
                code: ad.code || '',
                
                // ✅ PERBAIKI - Format time fields (HH:mm:ss -> HH:mm)
                validation_time_limit: formatTime(ad.validation_time_limit),
                jam_mulai: formatTime(ad.jam_mulai),
                jam_berakhir: formatTime(ad.jam_berakhir),
                
                // ✅ PERBAIKI - Day type dan custom days
                day_type: ad.day_type || 'custom',
                ...mapCustomDays(ad.custom_days),
                
                // ✅ Date fields (validate variable sudah benar)
                ...validate,
                
                // Other fields
                is_information: selected.is_information ? 1 : 0,
                link_information: selected.link_information || '',
                level_umkm: ad.level_umkm || '',
                max_production_per_day: ad.max_production_per_day || '',
                sell_per_day: ad.sell_per_day || '',
                
                // ✅ PERBAIKI - Content type mapping
                content_type: ad.type === 'voucher' ? 'voucher' : ad.type === 'iklan' ? 'iklan' : 'promo',
              };
            })()}
            onSuccess={() => {
              setFormAds(false);
              setRefresh(!refresh);
            }}
            forms={[
              // Pastikan content_type ada di values (ambil dari 'type' kalau belum)
              {
                type: 'custom',
                custom: ({ values, setValues }) => {
                  const hasCT = values.some(i => i.name === 'content_type');
                  const t = values.find(i => i.name === 'type')?.value; // 'iklan' | 'promo' | 'voucher'
                  if (!hasCT && t) {
                    setValues([...values, { name: 'content_type', value: t }]);
                  }
                  return null;
                },
              },

              // --- JUDUL ---
              {
                col: 12,
                type: 'custom',
                custom: ({ formControl }) => (
                  <InputComponent
                    name="title"
                    label="Judul"
                    placeholder="Masukan judul..."
                    {...formControl('title')}
                    validations={{ required: true }}
                  />
                ),
              },
              // --- DESKRIPSI ---
              {
                col: 12,
                type: 'custom',
                custom: ({ formControl }) => (
                  <TextareaComponent
                    name="description"
                    label="Deskripsi"
                    placeholder="Masukan deskripsi..."
                    {...formControl('description')}
                    rows={5}
                    validations={{ required: true }}
                  />
                ),
              },
              // Kategori
              {
                col: 12,
                type: 'custom',
                custom: ({ formControl }) => (
                  <SelectComponent
                    name="ad_category_id"
                    label="Kategori"
                    placeholder="Pilih kategori..."
                    {...formControl('ad_category_id')}
                    serverOptionControl={{ path: `admin/options/ad-category` }}
                  />
                ),
              },

              // --- TIPE VALIDASI (untuk promo/voucher saja) ---
              {
                col: 12,
                type: 'custom',
                custom: ({ formControl, values }) => {
                  const contentType = values?.find(i => i.name === 'content_type')?.value || 'promo';

                  if (!['promo', 'voucher'].includes(contentType)) return null;

                  return (
                    <SelectComponent
                      name="validation_type"
                      label="Tipe Validasi *"
                      placeholder="Pilih tipe validasi..."
                      required
                      {...formControl('validation_type')}
                      options={[
                        { label: "Generate Otomatis (QR Code)", value: "auto" },
                        { label: "Masukan Kode Unik", value: "manual" },
                      ]}
                      validations={{ required: true }}
                    />
                  );
                },
              },

              // --- KODE UNIK (hanya tampil jika validation_type = manual) ---
              {
                col: 12,
                type: 'custom',
                custom: ({ formControl, values }) => {
                  const contentType = values?.find(i => i.name === 'content_type')?.value || 'promo';
                  const validationType = values?.find(i => i.name === 'validation_type')?.value;

                  if (!['promo', 'voucher'].includes(contentType) || validationType !== 'manual') {
                    return null;
                  }

                  return (
                    <InputComponent
                      name="code"
                      label="Kode Unik *"
                      placeholder="Masukan kode unik untuk validasi manual..."
                      required
                      {...formControl('code')}
                      validations={{ required: true }}
                    />
                  );
                },
              },

              // 3 gambar konten
              // 3 gambar konten (tampil untuk semua jenis termasuk iklan)
              {
                type: 'custom',
                custom: ({ formControl, values }) => {
                  // Helper untuk membuat field gambar dengan crop di form ads
                  const createAdsImageField = (fieldName, label) => {
                    const fc = formControl(fieldName);
                    const formId = values?.find?.((v) => v.name === 'id')?.value;
                    const adsImageKey = `ads-${fieldName}-${formSessionId}-${formId || 'new'}`;
                    const isEditMode = Boolean(selected?.ads?.at(0)?.id);

                    // Debug: lihat data yang tersedia (hanya di development)
                    // eslint-disable-next-line no-console
                    if (process.env.NODE_ENV === 'development' && selected?.ads?.at(0)) {
                      // eslint-disable-next-line no-console
                      console.log('🔍 ADS DEBUG:', {
                        fieldName,
                        selectedAds: selected.ads[0],
                        currentFormValue: fc.value,
                        allValues: values,
                        isEditMode
                      });
                    }

                    // Server image - hanya untuk edit mode, tidak untuk create
                    const serverImageUrl = isEditMode ? getServerImageUrl(fieldName, values, selected) : null;

                    const valMap = (name) => values?.find?.((v) => v.name === name)?.value;
                    const imageVersion =
                      valMap(`${fieldName}_updated_at`) ||
                      valMap('updated_at') ||
                      selected?.ads?.[0]?.updated_at ||
                      formId ||
                      Date.now();

                    const serverSrc = serverImageUrl ? withVersion(serverImageUrl, imageVersion) : '';

                    // Debug server image (hanya di development)
                    // eslint-disable-next-line no-console
                    if (process.env.NODE_ENV === 'development' && serverSrc) {
                      // eslint-disable-next-line no-console
                      console.log('🖼️ Server image:', {
                        fieldName,
                        serverImageUrl,
                        serverSrc
                      });
                    }

                    // Prioritas File object dan blob preview
                    const currentValue = fc.value;
                    const hasFileObject = currentValue instanceof File;
                    const canUseBlob = Boolean(previewUrl) && String(previewOwnerKey) === String(adsImageKey);

                    let finalPreviewSrc = '';
                    if (hasFileObject && canUseBlob) {
                      finalPreviewSrc = previewUrl;
                    } else if (hasFileObject) {
                      // Fallback: buat blob baru untuk File object
                      finalPreviewSrc = URL.createObjectURL(currentValue);
                    } else if (serverSrc) {
                      finalPreviewSrc = serverSrc;
                    }

                    // File input handler
                    const handleFileChange = (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Set ke form dan trigger crop
                      fc.onChange(file);
                      setPreviewOwnerKey(adsImageKey);
                      handleFileInput(e, fc, adsImageKey);
                    };

                    const fileInfo = hasFileObject ? `File: ${currentValue.name} (${(currentValue.size / 1024).toFixed(1)}KB)` : '';

                    return (
                      <div className="form-control" key={`${fieldName}-ads-field-${adsImageKey}`}>
                        <label className="label">
                          <span className="label-text font-medium">{label}</span>
                          {hasFileObject && (
                            <span className="label-text-alt text-green-600 text-xs">📁 {fileInfo}</span>
                          )}
                        </label>

                        <div className="mb-4">
                          {finalPreviewSrc ? (
                            <div className="w-full h-32 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                              <Image
                                src={finalPreviewSrc}
                                alt="Preview"
                                width={128}
                                height={128}
                                className="max-w-full max-h-full object-contain"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-full h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <div className="text-center">
                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-500 text-xs">Belum ada gambar</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="file-input file-input-bordered file-input-sm"
                            onChange={handleFileChange}
                            key={`${fieldName}-ads-file-input-${adsImageKey}-${imageVersion}`}
                          />
                          {finalPreviewSrc && (
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                onClick={() => handleRecrop(fc)}
                                title="Crop ulang"
                              >
                                Crop
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-error btn-xs"
                                onClick={() => {
                                  // Clear preview dan form value
                                  if (previewUrl?.startsWith('blob:')) {
                                    URL.revokeObjectURL(previewUrl);
                                  }
                                  setPreviewUrl('');
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
                          PNG/JPG/WEBP, maks 10MB
                        </span>
                      </div>
                    );
                  };

                  return (
                    <div className="mt-6 space-y-4">
                      <div className="font-semibold text-base text-slate-700">Gambar</div>
                      <div className="grid grid-cols-3 gap-4 px-6">
                        {createAdsImageField('ads[image_1]', 'Gambar 1')}
                        {createAdsImageField('ads[image_2]', 'Gambar 2')}
                        {createAdsImageField('ads[image_3]', 'Gambar 3')}
                      </div>
                    </div>
                  );
                },
              },

              // Banner
              {
                type: 'custom',
                custom: ({ formControl, values }) => {
                  const fc = formControl('ads[image]');
                  const formId = values?.find?.((v) => v.name === 'id')?.value;
                  const adsBannerKey = `ads-banner-${formSessionId}-${formId || 'new'}`;

                  // Server image - menggunakan helper function
                  const serverImageUrl = getServerImageUrl('ads[image]', values, selected);

                  const valMap = (name) => values?.find?.((v) => v.name === name)?.value;
                  const imageVersion =
                    valMap('ads[image]_updated_at') ||
                    valMap('updated_at') ||
                    selected?.ads?.[0]?.updated_at ||
                    formId ||
                    Date.now();

                  const serverSrc = serverImageUrl ? withVersion(serverImageUrl, imageVersion) : '';

                  // Prioritas File object dan blob preview
                  const currentValue = fc.value;
                  const hasFileObject = currentValue instanceof File;
                  const canUseBlob = Boolean(previewUrl) && String(previewOwnerKey) === String(adsBannerKey);

                  let finalPreviewSrc = '';
                  if (hasFileObject && canUseBlob) {
                    finalPreviewSrc = previewUrl;
                  } else if (hasFileObject) {
                    // Fallback: buat blob baru untuk File object
                    finalPreviewSrc = URL.createObjectURL(currentValue);
                  } else if (serverSrc) {
                    finalPreviewSrc = serverSrc;
                  }

                  // File input handler
                  const handleFileChange = (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Set ke form dan trigger crop
                    fc.onChange(file);
                    setPreviewOwnerKey(adsBannerKey);
                    handleFileInput(e, fc, adsBannerKey);
                  };

                  const fileInfo = hasFileObject ? `File: ${currentValue.name} (${(currentValue.size / 1024).toFixed(1)}KB)` : '';

                  return (
                    <div className="mt-6">
                      <div className="font-semibold text-base text-slate-700 mb-4">Banner Gambar (Opsional)</div>
                      <div className="px-32">
                        <div className="form-control" key={`ads-banner-field-${adsBannerKey}`}>
                          <label className="label">
                            <span className="label-text font-medium">Banner</span>
                            {hasFileObject && (
                              <span className="label-text-alt text-green-600 text-xs">📁 {fileInfo}</span>
                            )}
                          </label>

                          <div className="mb-4">
                            {finalPreviewSrc ? (
                              <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                <Image
                                  src={finalPreviewSrc}
                                  alt="Banner Preview"
                                  width={384}
                                  height={192}
                                  className="max-w-full max-h-full object-contain"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div className="text-center">
                                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-gray-500 text-sm">Belum ada banner dipilih</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="file-input file-input-bordered flex-1"
                              onChange={handleFileChange}
                              key={`ads-banner-file-input-${adsBannerKey}-${imageVersion}`}
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
                                    // Clear preview dan form value
                                    if (previewUrl?.startsWith('blob:')) {
                                      URL.revokeObjectURL(previewUrl);
                                    }
                                    setPreviewUrl('');
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
                      </div>
                    </div>
                  );
                },
              },

              // Promo tak terbatas & Promo harian
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="flex gap-4 mt-2">
                      <CheckboxComponent
                        label="Promo Tak Terbatas"
                        name="unlimited_grab"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name !== 'unlimited_grab'),
                            {
                              name: 'unlimited_grab',
                              value: !values.find((i) => i.name === 'unlimited_grab')?.value
                                ? 1
                                : 0,
                            },
                          ]);
                        }}
                        checked={values?.find((i) => i.name === 'unlimited_grab')?.value || false}
                      />

                      <CheckboxComponent
                        label="Promo Harian"
                        name="is_daily_grab"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name !== 'is_daily_grab'),
                            {
                              name: 'is_daily_grab',
                              value: !values.find((i) => i.name === 'is_daily_grab')?.value
                                ? 1
                                : 0,
                            },
                          ]);
                        }}
                        checked={values?.find((i) => i.name === 'is_daily_grab')?.value}
                        disabled={values?.find((i) => i.name === 'unlimited_grab')?.value || false}
                      />
                    </div>
                  );
                },
              },

              // Jumlah promo & Batas waktu validasi (HH:mm)
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <InputNumberComponent
                        type="number"
                        name="max_grab"
                        label={
                          values?.find((i) => i.name === 'is_daily_grab')?.value
                            ? 'Jumlah Promo Per Hari'
                            : 'Jumlah Promo'
                        }
                        placeholder={
                          values?.find((i) => i.name === 'is_daily_grab')?.value
                            ? 'Promo yang bisa diambil dalam satu hari...'
                            : 'Masukan jumlah promo...'
                        }
                        validations={{ required: true }}
                        onChange={(e) =>
                          setValues([
                            ...values.filter((i) => i.name !== 'max_grab'),
                            { name: 'max_grab', value: e },
                          ])
                        }
                        value={values.find((i) => i.name === 'max_grab')?.value}
                        error={errors.find((i) => i.name === 'max_grab')?.error}
                        disabled={values?.find((i) => i.name === 'unlimited_grab')?.value}
                      />
                      <InputTimeComponent
                        name="validation_time_limit"
                        label="Batas Waktu Validasi"
                        placeholder="Masukan batas waktu (HH:mm)..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'validation_time_limit'),
                            { name: 'validation_time_limit', value: v },
                          ]);
                        }}
                        value={values.find((i) => i.name === 'validation_time_limit')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>
                  );
                },
              },

              // Berlaku Mulai & Berakhir Pada (tanggal)
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <InputComponent
                        type="date"
                        name="start_validate"
                        label="Berlaku Mulai"
                        placeholder="Pilih tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'start_validate'),
                            { name: 'start_validate', value: moment(e)?.format('DD-MM-YYYY') },
                          ]);
                        }}
                        value={
                          values.find((i) => i.name === 'start_validate')?.value
                            ? moment(values.find((i) => i.name === 'start_validate')?.value, 'DD-MM-YYYY').format('YYYY-MM-DD')
                            : ''
                        }
                        errors={errors.filter((i) => i.name === 'start_validate')?.error}
                        validations={{ required: true }}
                      />
                      <InputComponent
                        type="date"
                        name="finish_validate"
                        label="Berakhir Pada"
                        placeholder="Pilih tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'finish_validate'),
                            { name: 'finish_validate', value: moment(e)?.format('DD-MM-YYYY') },
                          ]);
                        }}
                        value={
                          values.find((i) => i.name === 'finish_validate')?.value
                            ? moment(values.find((i) => i.name === 'finish_validate')?.value, 'DD-MM-YYYY').format('YYYY-MM-DD')
                            : ''
                        }
                        errors={errors.filter((i) => i.name === 'finish_validate')?.error}
                        validations={{ required: true }}
                      />
                    </div>
                  );
                },
              },

              // Jam Mulai & Jam Berakhir (HH:mm)
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <InputTimeComponent
                        name="jam_mulai"
                        label="Jam Mulai"
                        placeholder="Pilih jam..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'jam_mulai'),
                            { name: 'jam_mulai', value: v },
                          ]);
                        }}
                        value={values.find((i) => i.name === 'jam_mulai')?.value || ''}
                        validations={{ required: true }}
                      />
                      <InputTimeComponent
                        name="jam_berakhir"
                        label="Jam Berakhir"
                        placeholder="Pilih jam..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'jam_berakhir'),
                            { name: 'jam_berakhir', value: v },
                          ]);
                        }}
                        value={values.find((i) => i.name === 'jam_berakhir')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>
                  );
                },
              },

              // Hanya di Waktu Tertentu + Hanya di Hari
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-slate-700">Hanya Di Waktu Tertentu</div>
                      <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                        <div className="flex items-center gap-6">
                          {[
                            { key: 'weekend', label: 'Weekend' },
                            { key: 'weekday', label: 'Weekdays' },
                            { key: 'custom', label: 'Hari Lain' },
                          ].map(opt => {
                            const checked = values.find(i => i.name === 'day_type')?.value === opt.key;
                            return (
                              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="day_type"
                                  value={opt.key}
                                  checked={checked}
                                  onChange={() => {
                                    const next = [
                                      ...values.filter(i => i.name !== 'day_type'),
                                      { name: 'day_type', value: opt.key },
                                    ];
                                    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                    const cleaned = next.filter(i => !dayNames.some(d => i.name === `custom_days[${d}]`));
                                    if (opt.key !== 'custom') {
                                      const preset = {
                                        weekend: { saturday: true, sunday: true },
                                        weekday: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
                                      }[opt.key] || {};
                                      const injected = Object.entries(preset).map(([d, v]) => ({
                                        name: `custom_days[${d}]`,
                                        value: v
                                      }));
                                      setValues([...cleaned, ...injected]);
                                    } else {
                                      setValues(cleaned);
                                    }
                                  }}
                                  className="h-4 w-4 accent-green-600"
                                  style={{ accentColor: '#16a34a' }}
                                />
                                <span className={checked ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                                  {opt.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="font-medium text-sm text-slate-700">Hanya Di Hari</div>
                      {(() => {
                        const dayType = values.find(i => i.name === 'day_type')?.value || 'custom';
                        const isCustom = dayType === 'custom';
                        const days = [
                          { label: 'Senin', key: 'monday' },
                          { label: 'Selasa', key: 'tuesday' },
                          { label: 'Rabu', key: 'wednesday' },
                          { label: 'Kamis', key: 'thursday' },
                          { label: 'Jumat', key: 'friday' },
                          { label: 'Sabtu', key: 'saturday' },
                          { label: 'Minggu', key: 'sunday' },
                        ];
                        const selected = (k) => !!values.find(i => i.name === `custom_days[${k}]`)?.value;

                        return (
                          <div className="flex flex-wrap gap-2">
                            {days.map(d => {
                              const active = selected(d.key);
                              return (
                                <button
                                  type="button"
                                  key={d.key}
                                  onClick={() => {
                                    if (!isCustom) return;
                                    const exists = values.find(i => i.name === `custom_days[${d.key}]`)?.value || false;
                                    setValues([
                                      ...values.filter(i => i.name !== `custom_days[${d.key}]`),
                                      { name: `custom_days[${d.key}]`, value: !exists },
                                    ]);
                                  }}
                                  className={[
                                    "px-3 py-1.5 rounded-md border text-sm font-medium transition",
                                    active
                                      ? "bg-green-600 text-white border-green-600 shadow"
                                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-400",
                                    isCustom ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
                                  ].join(' ')}
                                >
                                  {d.label}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                },
              },

              // Tambahkan Jam Buka (toggle + input)
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="mt-3">
                      <ToggleComponent
                        label="Tambahkan Jam Buka"
                        name="openHours"
                        onChange={() =>
                          setValues([
                            ...values.filter((i) => i.name !== 'openHours'),
                            {
                              name: 'openHours',
                              value: !values.find((i) => i.name === 'openHours')?.value,
                            },
                          ])
                        }
                        checked={values?.find((i) => i.name === 'openHours')?.value}
                      />
                      {values.find((i) => i.name === 'openHours')?.value && (
                        <div className="bg-stone-50 py-6">
                          <InputOpenHours values={values} setValues={setValues} errors={errors} />
                        </div>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      </FloatingPageComponent>

      <UpdateCubeStatusModal
        data={selected}
        show={updateStatus}
        setShow={setUpdateStatus}
        onSuccess={() => {
          setRefresh(!refresh);
          setUpdateStatus(false);
        }}
      />
      <VoucherModal
        data={selected}
        show={voucherModal}
        setShow={setVoucherModal}
        onSuccess={() => {
          setRefresh(!refresh);
          setVoucherModal(false);
        }}
      />

      {/* Cropper Dialog */}
      <CropperDialog
        open={cropOpen}
        imageUrl={rawImageUrl}
        onClose={() => setCropOpen(false)}
        onSave={handleCropSave}
        aspect={1}
      />
    </div>
  );
}

export default Kubus;
Kubus.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
