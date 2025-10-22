/**
 * Helper functions untuk voucher management
 * Menggabungkan data voucher dari kubus dengan management voucher
 */

/**
 * Generate unique voucher code
 */
const generateUniqueVoucherCode = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `KUBUS-${timestamp}-${random}`;
};

/**
 * Format tanggal untuk backend (YYYY-MM-DD)
 */
const formatDateForBackend = (dateStr) => {
  if (!dateStr) return null;
  try {
    // Jika sudah format YYYY-MM-DD, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Jika format DD-MM-YYYY, convert ke YYYY-MM-DD
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      return `${year}-${month}-${day}`;
    }
    // Fallback: parse dengan Date dan format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch (e) {
    return null;
  }
};

/**
 * Transform data voucher dari form kubus ke format voucher management
 */
export const transformKubusVoucherToManagement = (formData, adId) => {
  const voucherData = {
    // Data dari ads (kubus)
    ad_id: adId,
    name: formData.ads?.title || formData.title,
    description: formData.ads?.description || formData.description,

    // Data voucher management
    type: 'voucher',
    stock: parseInt(formData.voucher?.stock || formData.stock || 0),
    valid_until: formData.voucher?.valid_until || formData.valid_until,
    target_type: formData.voucher?.target_type || formData.target_type || 'all',
    validation_type: formData.ads?.validation_type || formData.validation_type || 'auto',
    code: null, // akan di-generate otomatis

    // Info tenant dari kubus
    owner_name: formData.owner_name || null,
    owner_phone: formData.owner_phone || null,
    tenant_location: formData.address || formData.tenant_location || null,

    // Target users jika ada
    community_id: formData.voucher?.target_type === 'community' ? formData.community_id : null,
    target_user_id: formData.voucher?.target_type === 'user' ? formData.target_user_id : null,
  };

  // Handle gambar voucher
  if (formData.voucher_image || formData.voucher?.image) {
    voucherData.image = formData.voucher_image || formData.voucher.image;
  }

  return voucherData;
};

/**
 * Prepare form data untuk dikirim ke backend saat create/update kubus dengan voucher
 * Menggunakan field yang SUDAH ADA di form kubus - tidak ada field ganda/duplikasi
 * 
 * ✅ FIELD YANG DIGUNAKAN BERSAMA (tanpa duplikasi):
 * - Judul: ads[title] → ke ads.title + vouchers.name
 * - Deskripsi: ads[description] → ke ads.description + vouchers.description  
 * - Berakhir Pada: ads[finish_validate] → ke ads.finish_validate + vouchers.valid_until
 * - Jumlah Promo: ads[max_grab] → ke ads.max_grab + vouchers.stock
 * - Lokasi: address → ke cubes.address + vouchers.tenant_location
 * - Kode: ads[code] → ke ads.code + vouchers.code
 * - Target: target_type → ke ads.target_type + vouchers.target_type
 */
export const prepareKubusVoucherData = (formData) => {
  // Debug logging untuk cek data masuk
  // eslint-disable-next-line no-console
  console.log('[VOUCHER HELPER] 🔍 Input formData:', formData);
  // eslint-disable-next-line no-console
  console.log('[VOUCHER HELPER] 📋 content_type check:', formData.content_type);

  // ✅ CRITICAL FIX: Hanya process jika content_type adalah 'voucher'
  if (formData.content_type !== 'voucher') {
    // eslint-disable-next-line no-console
    console.log('[VOUCHER HELPER] ❌ SKIPPING - Not a voucher content_type:', formData.content_type);
    return formData; // Return original data tanpa modifikasi
  }

  // eslint-disable-next-line no-console
  console.log('[VOUCHER HELPER] ✅ PROCESSING VOUCHER - content_type is voucher');

  // eslint-disable-next-line no-console
  console.log('[VOUCHER HELPER] 📋 ads data available:', {
    'ads': formData.ads,
    'ads.title': formData['ads.title'],
    'ads.description': formData['ads.description'],
    'ads.max_grab': formData['ads.max_grab'],
    'ads.finish_validate': formData['ads.finish_validate'],
    'ads.validation_type': formData['ads.validation_type'],
    'title': formData.title,
    'max_grab': formData.max_grab,
    'address': formData.address
  });

  // ✅ Extract owner info dari form data
  const ownerUserId = formData.owner_user_id;
  let ownerName = formData.owner_name || null;
  let ownerPhone = formData.owner_phone || null;

  // Jika ada owner_user_id yang dipilih, kirim ke backend untuk di-resolve
  if (ownerUserId && !ownerName && !ownerPhone) {
    // Backend akan resolve nama dan phone dari user_id
    ownerName = formData.owner_name || 'TO_BE_RESOLVED';
    ownerPhone = formData.owner_phone || 'TO_BE_RESOLVED';
  }

  const enrichedData = {
    ...formData,

    // Data untuk tabel ads (kubus) - menggunakan field yang sudah ada
    ads: {
      ...formData.ads,
      type: 'voucher',
      promo_type: 'offline', // default untuk voucher kubus
      validation_type: formData.ads?.validation_type || 'auto',
      target_type: formData.target_type || 'all',
      community_id: formData.target_type === 'community' ? formData.community_id : null,
    },

    // ✅ PERBAIKAN: Flag untuk backend dengan data lengkap
    _sync_to_voucher_management: true,

    // ✅ PERBAIKAN: Data voucher management - SEMUA FIELD yang dibutuhkan
    _voucher_sync_data: {
      // Data dasar voucher - FIX FIELD MAPPING
      name: formData.ads?.title || formData['ads.title'] || formData.title || 'Voucher Tanpa Nama',
      description: formData.ads?.description || formData['ads.description'] || formData.description || '',
      type: 'voucher',

      // ✅ STOCK DAN VALIDITAS (field yang hilang) - FIX FIELD MAPPING
      stock: parseInt(formData.ads?.max_grab || formData['ads.max_grab'] || formData.max_grab || 0),
      valid_until: formatDateForBackend(formData.ads?.finish_validate || formData['ads.finish_validate'] || formData.finish_validate),

      // ✅ GAMBAR: Backend akan handle image upload dari FormData terpisah
      // Jangan kirim File object di voucher sync data karena akan cause error
      image: null, // Backend akan set ini setelah process file upload
      image_updated_at: null, // Backend akan set ini setelah process file upload

      // ✅ LOKASI TENANT (field yang hilang) - FIX FIELD MAPPING
      tenant_location: formData.address || formData['cube_tags[0][address]'] || formData['cube_tags.0.address'] || '',

      // ✅ INFO MANAGER TENANT (field yang hilang)
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_user_id: ownerUserId, // untuk backend resolve jika perlu

      // ✅ VALIDASI SETTINGS - FIX FIELD MAPPING
      validation_type: formData.ads?.validation_type || formData['ads.validation_type'] || formData.validation_type || 'auto',
      code: generateUniqueVoucherCode(), // Generate unique code untuk avoid duplicate

      // ✅ TARGET SETTINGS
      target_type: formData.target_type || 'all',
      community_id: formData.target_type === 'community' ? formData.community_id : null,
      target_user_id: formData.target_type === 'user' ? formData.target_user_id : null,
      target_user_ids: formData.target_type === 'user' ? formData.target_user_ids : null,

      // ✅ METADATA TAMBAHAN
      ad_id: null, // akan diisi oleh backend setelah ads dibuat
      cube_id: formData.id || null, // ID kubus jika update

      // ✅ ADDITIONAL TIMESTAMPS
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),

      // ✅ METADATA UNTUK BACKEND PROCESSING
      // Backend akan copy image dari ads.image_1 ke voucher.image setelah upload
      _copy_image_from_ads: true,
      _image_source_field: 'image_1', // Backend akan copy dari ads.image_1

      // ✅ DEBUG INFO untuk backend troubleshooting
      _debug_source: 'kubus_voucher_creation',
      _frontend_version: '1.0.0'
    }
  };

  // eslint-disable-next-line no-console
  console.log('[VOUCHER HELPER] ✅ VOUCHER DATA PREPARED:', enrichedData);

  return enrichedData;
};

/**
 * Validasi data voucher sebelum submit
 * Memvalidasi field yang SUDAH ADA di form kubus (no duplikasi)
 * Field ini akan disync ke 2 tabel secara otomatis oleh backend
 */
export const validateVoucherData = (formData) => {
  const errors = {};

  if (formData.content_type === 'voucher') {
    // ✅ VALIDASI FIELD YANG SUDAH ADA (akan di-sync ke 2 tabel)

    // Judul (ads[title] → ads.title + vouchers.name)  
    if (!formData.ads?.title) {
      errors.title = 'Judul voucher wajib diisi';
    }

    // Jumlah Promo (ads[max_grab] → ads.max_grab + vouchers.stock)
    const maxGrab = formData.ads?.max_grab;
    if (!maxGrab) {
      errors.max_grab = 'Jumlah promo wajib diisi (akan menjadi stok voucher)';
    } else if (parseInt(maxGrab || 0) < 1) {
      errors.max_grab = 'Jumlah promo minimal 1';
    }

    // Berakhir Pada (ads[finish_validate] → ads.finish_validate + vouchers.valid_until)
    if (!formData.ads?.finish_validate) {
      errors.finish_validate = 'Tanggal berakhir pada wajib diisi';
    }

    // Lokasi Validasi (address → cubes.address + vouchers.tenant_location)
    if (!formData.address && !formData['cube_tags[0][address]']) {
      errors.address = 'Lokasi validasi wajib diisi untuk voucher';
    }

    // ✅ VALIDASI FIELD TAMBAHAN VOUCHER

    // Target type
    const targetType = formData.target_type || 'all';
    if (!targetType) {
      errors.target_type = 'Target voucher wajib dipilih';
    }

    // Target community
    if (targetType === 'community' && !formData.community_id) {
      errors.community_id = 'Komunitas wajib dipilih untuk target komunitas';
    }

    // Target user
    if (targetType === 'user') {
      if (!formData.target_user_id && !formData.target_user_ids?.length) {
        errors.target_user = 'User target wajib dipilih';
      }
    }

    // Kode manual (ads[code] → ads.code + vouchers.code)
    if (formData.ads?.validation_type === 'manual' && !formData.ads?.code) {
      errors.code = 'Kode validasi wajib diisi untuk tipe validasi manual';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Format data untuk ditampilkan di form update
 */
export const formatVoucherDataForEdit = (kubus, voucher = null) => {
  const formData = {
    ...kubus,
    content_type: 'voucher',

    // Data ads
    ads: {
      ...kubus.ads?.[0],
      title: kubus.ads?.[0]?.title || voucher?.name,
      description: kubus.ads?.[0]?.description || voucher?.description,
    },

    // Data voucher management jika ada
    voucher: voucher ? {
      stock: voucher.stock,
      valid_until: voucher.valid_until,
      target_type: voucher.target_type,
      validation_type: voucher.validation_type,
      image: voucher.image,
    } : {
      stock: kubus.ads?.[0]?.max_grab || 0,
      valid_until: kubus.ads?.[0]?.finish_validate,
      target_type: kubus.ads?.[0]?.target_type || 'all',
      validation_type: kubus.ads?.[0]?.validation_type || 'auto',
    },

    // Info tenant
    owner_name: voucher?.owner_name || kubus.user?.name,
    owner_phone: voucher?.owner_phone || kubus.user?.phone,
  };

  return formData;
};