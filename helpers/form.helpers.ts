import { useState, useEffect } from 'react';
import { post, postProps } from './api.helpers';
import { validationHelper, validationRules } from './validation.helpers';
import { prepareKubusVoucherData } from './voucher.helpers';

export const useForm = (
  submitControl: postProps,
  confirmation?: boolean,
  onSuccess?: (data: any) => void,
  onFailed?: (code: number) => void
) => {
  const [formRegisters, setFormRegisters] = useState<
    { name: string; validations?: validationRules }[]
  >([]);
  const [formValues, setFormValues] = useState<{ name: string; value?: any }[]>(
    []
  );
  const [formErrors, setFormErrors] = useState<{ name: string; error?: any }[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  useEffect(() => {
    setFormRegisters([]);
    setFormValues([]);
    setFormErrors([]);
  }, [submitControl?.path]);

  const onChange = (name: string, value?: any) => {
    // Debug: log change attempts to trace unexpected resets/clears
    try {
      
    } catch (e) {}

    setFormValues([
      ...formValues.filter((val) => val.name != name),
      { name, value: value != undefined ? value : '' },
    ]);
  };
  

  const formControl = (name: string) => {
    return {
      onChange: (e: any) => onChange(name, e),
      value: formValues.find((val) => val.name == name)?.value || undefined,
      error: formErrors.find((val) => val.name == name)?.error || undefined,
      register: (regName: string, regValidations?: validationRules) => {
        if (!formRegisters.find((reg) => reg.name == regName)) {
          setFormRegisters([
            ...formRegisters.filter((reg) => reg.name != regName),
            { name: regName, validations: regValidations },
          ]);
        }
      },
      unregister: () => {
        setFormValues([...formValues.filter((val) => val.name != name)]);
        setFormRegisters([...formRegisters.filter((reg) => reg.name != name)]);
      },
    };
  };

  const fetch = async () => {
    setLoading(true);

    const formData = new FormData();

    // --- endpoint override opsional dari form values
    const endpointOverrideField =
      formValues.find(v => v.name === '__endpoint_override')?.value ||
      formValues.find(v => v.name === '__endpoint')?.value;

    // Path efektif untuk request
    let effectivePath = submitControl?.path || '';
    if (endpointOverrideField) {
      effectivePath = String(endpointOverrideField).replace(/^\/+/, '');
    }

    // URL full (untuk regex deteksi)
    const requestUrlFull = submitControl?.url
      ? `${submitControl.url.replace(/\/+$/, '')}/${effectivePath.replace(/^\/+/, '')}`
      : effectivePath;

    // Deteksi mode update ads/cube BERDASARKAN effectivePath
    const isAdUpdate =
      /(^|\/)admin\/ads\/\d+($|\/)/.test(effectivePath) ||
      /(^|\/)admin\/ads\/\d+($|\/)/.test(requestUrlFull);

    const isCubeUpdate =
      /(^|\/)admin\/cubes\/\d+($|\/)/.test(effectivePath) ||
      /(^|\/)admin\/cubes\/\d+($|\/)/.test(requestUrlFull);

    const isAnyUpdate = isAdUpdate || isCubeUpdate;
    if (isAnyUpdate) {
      console.log('🔧 FormData - Setting _method to PUT');
      formData.set('_method', 'PUT');
    }

    // field khusus cube—SKIP saat update ads
    const cubeOnly = new Set([
      'cube_type_id', 'is_recommendation', 'is_information', 'link_information',
      '_original_map_lat', '_original_map_lng', '_original_address',
      'map_lat', 'map_lng', 'address',
      'cube_tags[0][map_lat]', 'cube_tags[0][map_lng]', 'cube_tags[0][address]',
      'content_type', 'status', 'owner_user_id', 'world_id', 'corporate_id', 'image'
    ]);

    // Deteksi field ads yang perlu di-update
    const adsFieldNames = new Set([
      'level_umkm', 'max_production_per_day', 'sell_per_day',
      'title', 'description', 'detail', 'ad_category_id', 'promo_type',
      'is_daily_grab', 'validation_type', 'code',
      'target_type', 'target_user_ids', 'community_id', 'start_validate',
      'finish_validate', 'validation_time_limit', 'jam_mulai', 'jam_berakhir',
      'day_type', 'custom_days', 'image_1', 'image_2', 'image_3'
    ]);

    // Periksa apakah ada field ads yang akan di-update
    const hasAdsFieldUpdate = formValues.some(val => {
      const name = val.name;
      return adsFieldNames.has(name) || 
             name.startsWith('ads[') || 
             name.startsWith('ads.') || 
             name.startsWith('ads_');
    });

    
    const problemFieldsInForm = formValues.filter(val => {
      const name = val.name;
      return ['ads[level_umkm]', 'ads[max_production_per_day]', 'ads[sell_per_day]'].includes(name) ||
             ['level_umkm', 'max_production_per_day', 'sell_per_day'].includes(name);
    });
    
    if (problemFieldsInForm.length > 0) {
      
    }

    // Periksa apakah ada field cube yang akan di-update  
    const hasCubeFieldUpdate = formValues.some(val => {
      const name = val.name;
      return cubeOnly.has(name) || 
             name === '__endpoint_override' || 
             name === '__endpoint';
    });

    // === STRATEGY FOR MIXED UPDATES ===
    // Jika ada mixed update (cube + ads), lakukan 2 request terpisah
    if (hasAdsFieldUpdate && hasCubeFieldUpdate && isAdUpdate) {
      
      
      try {
        // 1. Update cube fields first
        const cubeId = formValues.find(v => v.name === 'cube_id')?.value;
        if (cubeId) {
          const cubeFormData = new FormData();
          cubeFormData.set('_method', 'PUT');
          
          // Kirim hanya field cube
          for (const val of formValues) {
            const name = val.name;
            let v = val.value;
            
            if (cubeOnly.has(name)) {
              if (Array.isArray(v) && (name === 'is_information' || name === 'is_recommendation')) {
                cubeFormData.append(name, v.length > 0 ? '1' : '0');
              } else if (v instanceof File) {
                cubeFormData.append(name, v);
              } else if (Array.isArray(v)) {
                v.forEach((item: any) => cubeFormData.append(`${name}[]`, String(item)));
              } else if (v !== undefined && v !== null && typeof v === 'object') {
                cubeFormData.append(name, JSON.stringify(v));
              } else {
                cubeFormData.append(name, v != null ? String(v) : '');
              }
            }
          }

          
          const cubeResult = await post({
            url: submitControl.url,
            path: `admin/cubes/${cubeId}`,
            bearer: submitControl.bearer,
            includeHeaders: submitControl.includeHeaders,
            contentType: submitControl.contentType,
            body: cubeFormData,
          });

          if (cubeResult?.status !== 200 && cubeResult?.status !== 201) {
            setLoading(false);
            onFailed?.(cubeResult?.status || 500);
            return;
          }
        }

        // 2. Continue with ads update menggunakan logica original
        
        
        // Tidak perlu reset formData, lanjut ke logika build FormData normal
        // Logika di bawah akan handle field ads dengan benar
        
      } catch (error) {
        
        setLoading(false);
        onFailed?.(500);
        return;
      }
    }

    // Override detection: Jika ada field cube yang diubah, gunakan endpoint cube
    let actualIsAdUpdate = isAdUpdate;
    if (hasCubeFieldUpdate && !hasAdsFieldUpdate) {
      actualIsAdUpdate = false; // Paksa ke mode cube update
      
      // Override endpoint untuk update cube jika sedang dalam mode ads update
      if (isAdUpdate) {
        const adsIdMatch = effectivePath.match(/admin\/ads\/(\d+)/);
        if (adsIdMatch) {
          const adsId = adsIdMatch[1];
          // Ambil cube_id dari form values
          const cubeId = formValues.find(v => v.name === 'cube_id')?.value;
          if (cubeId) {
            effectivePath = `admin/cubes/${cubeId}`;
            
          }
        }
      }
      
      
    }

    // helper: convert HH:mm:ss → HH:mm
    const normalizeTime = (s?: string) =>
      (typeof s === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(s)) ? s.substring(0, 5) : s;

    // untuk hindari duplikasi key append
    const appended = new Set<string>();

    // Kumpulkan ads object JSON hanya untuk create/edit cube (BUKAN update ads)
    const adsFields: Record<string, any> = {};

    // === Build FormData ===
    for (const val of formValues) {
      const name = val.name;
      let v = val.value;

      // Skip _method because it's already set above
      if (name === '_method') continue;

      if (actualIsAdUpdate) {
        // ---------------------------
        // MODE UPDATE ADS
        // ---------------------------

        // a) skip semua field khusus cube saat update ads, KECUALI sudah diproses di mixed update
        if (cubeOnly.has(name) && !(hasAdsFieldUpdate && hasCubeFieldUpdate && isAdUpdate)) continue;

        // b) flatten ads[...] → root, dan JANGAN kirim 'ads.xxx' (dot)
        const m = name.match(/^ads\[(.+)\]$/);

        if (m) {
          const inner = m[1]; // e.g. 'title', 'custom_days][saturday', dst.

          // nested: ads[custom_days][saturday] -> custom_days[saturday]
          if (inner.includes('][')) {
            const [main, sub] = inner.split('][');     // 'custom_days', 'saturday'
            const flat = `${main}[${sub}]`;            // 'custom_days[saturday]'

            if (main === 'custom_days') {
            }

            if (v instanceof File) {
              if (!appended.has(flat)) { formData.append(flat, v); appended.add(flat); }
            } else {
              if (typeof v === 'boolean') v = v ? '1' : '0';
              if (!appended.has(flat)) { formData.append(flat, v ?? ''); appended.add(flat); }
            }
            continue;
          }

          // waktu: normalisasi HH:mm:ss ke HH:mm di root
          if (['validation_time_limit', 'jam_mulai', 'jam_berakhir'].includes(inner)) {
            v = normalizeTime(v);
          }

          // regular ads field → root: 'title', 'image_1', ...
          const flatKey = inner;

          

          if (v instanceof File) {
            if (!appended.has(flatKey)) { formData.append(flatKey, v); appended.add(flatKey); }
          } else if (Array.isArray(v)) {
            for (const item of v) formData.append(`${flatKey}[]`, String(item));
          } else if (v !== undefined && v !== null && typeof v === 'object') {
            if (!appended.has(flatKey)) { formData.append(flatKey, JSON.stringify(v)); appended.add(flatKey); }
          } else {
            if (!appended.has(flatKey)) { formData.append(flatKey, v != null ? String(v) : ''); appended.add(flatKey); }
          }
          continue;
        }

        // c) untuk field non-ads[...], kirim seperti biasa (kecuali ads.dot sisa log)
        if (name.startsWith('ads.')) continue;

        if (Array.isArray(v) && (name === 'is_information' || name === 'is_recommendation' || name === 'is_active')) {
          // Khusus checkbox boolean: kirim selalu '1' atau '0' (bukan array [])
          if (!appended.has(name)) { formData.append(name, v.length > 0 ? '1' : '0'); appended.add(name); }
        } else if (v instanceof File) {
          if (!appended.has(name)) { formData.append(name, v); appended.add(name); }
        } else if (Array.isArray(v)) {
          v.forEach((item: any) => formData.append(`${name}[]`, String(item)));
        } else if (v !== undefined && v !== null && typeof v === 'object') {
          if (!appended.has(name)) { formData.append(name, JSON.stringify(v)); appended.add(name); }
        } else {
          if (!appended.has(name)) { formData.append(name, v != null ? String(v) : ''); appended.add(name); }
        }

      } else {
        // ---------------------------
        // MODE CREATE / EDIT CUBE
        // ---------------------------

        // Tangkap pola ads[...] utk bangun JSON ads + kirim multi format (seperti sebelumnya)
        const m = name.match(/^ads\[(.+)\]$/);
        if (m) {
          const inner = m[1];

          // Simpan ke adsFields (kecuali File)
          if (!(v instanceof File)) {
            // Normalisasi time di JSON juga
            let jsonValue = v;
            if (['validation_time_limit', 'jam_mulai', 'jam_berakhir'].includes(inner)) {
              jsonValue = normalizeTime(jsonValue);
            }

            // nested ads[custom_days][saturday]
            if (inner.includes('][')) {
              const [main, sub] = inner.split('][');
              adsFields[main] = adsFields[main] || {};
              adsFields[main][sub] = jsonValue;
              
              if (main === 'custom_days') {
              }
            } else {
              adsFields[inner] = jsonValue;
            }
          }

          // 1) Kirim dalam bentuk dot notation (ads.inner)
          const dot = `ads.${inner}`;
          if (v instanceof File) {
            if (!appended.has(dot)) { formData.append(dot, v); appended.add(dot); }
          } else if (Array.isArray(v)) {
            v.forEach((item: any) => formData.append(`${dot}[]`, String(item)));
          } else if (v !== undefined && v !== null && typeof v === 'object') {
            if (!appended.has(dot)) { formData.append(dot, JSON.stringify(v)); appended.add(dot); }
          } else {
            let processed = v != null ? String(v) : '';
            if (['validation_time_limit', 'jam_mulai', 'jam_berakhir'].includes(inner)) {
              processed = normalizeTime(processed) || processed;
            }
            if (!appended.has(dot)) { formData.append(dot, processed); appended.add(dot); }
          }

          // 2) Kirim versi root (inner)
          const root = inner;
          if (v instanceof File) {
            if (!appended.has(root)) { formData.append(root, v); appended.add(root); }
          } else if (Array.isArray(v)) {
            v.forEach((item: any) => formData.append(`${root}[]`, String(item)));
          } else if (v !== undefined && v !== null && typeof v === 'object') {
            if (!appended.has(root)) { formData.append(root, JSON.stringify(v)); appended.add(root); }
          } else {
            let processed = v != null ? String(v) : '';
            if (['validation_time_limit', 'jam_mulai', 'jam_berakhir'].includes(inner)) {
              processed = normalizeTime(processed) || processed;
            }
            if (!appended.has(root)) { formData.append(root, processed); appended.add(root); }
          }

          continue;
        }

        // Handler umum non-ads
        if (Array.isArray(v) && (name === 'is_information' || name === 'is_recommendation' || name === 'is_active')) {
          // Khusus checkbox boolean: kirim selalu '1' atau '0' (bukan array [])
          if (!appended.has(name)) { formData.append(name, v.length > 0 ? '1' : '0'); appended.add(name); }
        } else if (v instanceof File) {
          if (!appended.has(name)) { formData.append(name, v); appended.add(name); }
        } else if (Array.isArray(v)) {
          v.forEach((item: any) => formData.append(`${name}[]`, String(item)));
        } else if (v !== undefined && v !== null && typeof v === 'object') {
          if (!appended.has(name)) { formData.append(name, JSON.stringify(v)); appended.add(name); }
        } else {
          if (!appended.has(name)) { formData.append(name, v != null ? String(v) : ''); appended.add(name); }
        }
      }
    }

    // Kirim ads JSON HANYA saat BUKAN update ads
    if (!actualIsAdUpdate && Object.keys(adsFields).length > 0) {
  formData.append('ads', JSON.stringify(adsFields));
    }

    // Handle opening hours data conversion (tetap)
    const openingHoursData: any[] = [];
    const openingHoursFields = formValues.filter(val => val.name.startsWith('data[') && val.name.includes(']['));

    if (openingHoursFields.length > 0) {
      const hoursGrouped: { [key: string]: any } = {};

      openingHoursFields.forEach(val => {
        const match = val.name.match(/data\[(\d+)\]\[([^\]]+)\]/);
        if (match) {
          const index = match[1];
          const field = match[2];

          if (!hoursGrouped[index]) {
            hoursGrouped[index] = {};
          }
          hoursGrouped[index][field] = val.value;
        }
      });

      const dayMapping = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

      Object.keys(hoursGrouped).forEach(index => {
        const hourData = hoursGrouped[index];
        if (!hourData.day && dayMapping[parseInt(index)]) {
          hourData.day = dayMapping[parseInt(index)];
        }
        openingHoursData.push(hourData);
      });

      if (openingHoursData.length > 0) {
        formData.append('opening_hours', JSON.stringify(openingHoursData));
      }
    }

    if (formData instanceof FormData) {
      const entries = Array.from(formData.entries());

      // Debug khusus untuk field yang bermasalah
      const problemFields = ['level_umkm', 'max_production_per_day', 'sell_per_day'];
      const foundProblemFields = entries.filter(([key]) => 
        problemFields.some(field => key === field || key.includes(field))
      );
      
      

      const adsEntries = entries.filter(([key]) => key.startsWith('ads'));
    } else {
    }

    // === VOUCHER SYNC PREPARATION ===
    // Check if this is a voucher creation from kubus
    const contentType = formData.get('content_type');
    
    
    if (contentType === 'voucher' && (submitControl.path?.includes('/admin/cubes') || submitControl.path?.includes('cubes'))) {
      
      
      // Convert FormData to object for voucher helper
      const formDataObject: any = {};
      const entries = Array.from(formData.entries());
      
      entries.forEach(([key, value]) => {
        // Handle nested fields like ads[title], cube_tags[0][address], etc.
        if (key.includes('[') && key.includes(']')) {
          const parts = key.split(/[\[\]]+/).filter(Boolean);
          let current = formDataObject;
          
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
              // Check if next part is number (array index)
              const nextPart = parts[i + 1];
              current[part] = /^\d+$/.test(nextPart) ? [] : {};
            }
            current = current[part];
          }
          
          const lastPart = parts[parts.length - 1];
          current[lastPart] = value;
        } else {
          formDataObject[key] = value;
        }
      });

      

      // Prepare voucher sync data
      const voucherData = prepareKubusVoucherData(formDataObject);
      
      
      
      // Add voucher sync data to form
      if (voucherData._sync_to_voucher_management && voucherData._voucher_sync_data) {
        formData.append('_sync_to_voucher_management', 'true');
        
        // ✅ FIX: Parse _voucher_sync_data as JSON string if it's string
        let voucherSyncData = voucherData._voucher_sync_data;
        if (typeof voucherSyncData === 'string') {
          try {
            voucherSyncData = JSON.parse(voucherSyncData);
          } catch (e) {
          }
        }
        
        formData.append('_voucher_sync_data', JSON.stringify(voucherSyncData));
        
        // ✅ CRITICAL FIX: Handle code based on validation_type
        // DON'T auto-generate code here - it's already handled in voucher.helpers.js
        // The code is already in voucherSyncData.code
        const validationType = voucherSyncData.validation_type || 'auto';
        const voucherCode = voucherSyncData.code || '';
        
        
        
        // Set code field di root level untuk backend
        // Code sudah di-generate/validate di prepareKubusVoucherData
        if (voucherCode) {
          formData.set('code', voucherCode);
        }
        
        // Clean up potential duplicate fields
        const fieldsToClean = ['ads.code', 'ads[code]'];
        fieldsToClean.forEach(field => {
          if (formData.has(field)) {
            formData.delete(field);
          }
        });
        
        
      } else {
      
      }
    }

    // === PROMO SYNC PREPARATION ===
    // Check if this is a promo creation from kubus
    if (contentType === 'promo' && (submitControl.path?.includes('/admin/cubes') || submitControl.path?.includes('cubes'))) {
      
      
      // Promo menggunakan field yang sudah ada, tidak perlu field tambahan
      const existingPromoFields = [
        'ads[title]',           // Judul promo
        'ads[description]',     // Deskripsi/detail promo 
        'ads[promo_type]',      // Tipe promo (online/offline)
        'address',              // Lokasi promo (untuk offline)
        'map_distance',         // Jarak maksimal (untuk offline)
        'owner_user_id',        // Manager tenant sebagai pemilik
      ];
      
      
    }

    // === Request ===
    // Debug: Log final FormData contents
    console.log('📦 FormData - Final entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    
    const mutate = await post({
      url: submitControl.url,
      path: effectivePath, // <— PAKAI effectivePath
      bearer: submitControl.bearer,
      includeHeaders: submitControl.includeHeaders,
      contentType: submitControl.contentType,
      body: formData,
    });

    if (mutate?.status == 200 || mutate?.status == 201) {
      setLoading(false);
      onSuccess?.(mutate.data);
      setFormValues([]);
      setFormValues([]);
      setShowConfirm(false);
    } else if (mutate?.status == 422) {
      // Debug logging for validation errors
      

      if (mutate.data.errors) {
        Object.entries(mutate.data.errors).forEach(([field, messages]: [string, any]) => {
        });
      }

      let errors: { name: string; error?: any }[] = [];

      if (typeof mutate.data == 'string') {
        let strRes = mutate.data;

        let sliced = strRes.slice(
          strRes.indexOf('{'),
          strRes.lastIndexOf('}') + 1
        );
        Object.keys(JSON.parse(sliced).errors).map((key) => {
          errors.push({
            name: key,
            error: JSON.parse(sliced).errors[key][0],
          });
        });
      } else {
        Object.keys(mutate.data.errors).map((key) => {
          errors.push({
            name: key,
            error: mutate.data.errors[key][0],
          });
        });
      }

      setFormErrors(errors);
      onFailed?.(mutate?.status || 500);
      setLoading(false);
      setShowConfirm(false);
    } else {
      // Debug logging for other errors (including 500)
      

      onFailed?.(mutate?.status || 500);
      setShowConfirm(false);
      setLoading(false);
    }
  };

  const submit = async (e: any) => {
    e?.preventDefault();
    setFormErrors([]);

    // Debug: Log formValues before submission
    console.log('📤 Form Submit - formValues:', formValues);
    console.log('📤 Form Submit - _method values:', formValues.filter(v => v.name === '_method'));

    const newErrors: { name: string; error?: any }[] = [];

    formRegisters.map((form) => {
      const { valid, message } = validationHelper({
        value: formValues.find((val) => val.name == form.name)?.value,
        rules: form.validations,
      });

      if (!valid) {
        newErrors.push({ name: form.name, error: message });
      }
    });

    if (newErrors.length) {
      setFormErrors(newErrors);
      return;
    }

    if (confirmation) {
      setShowConfirm(true);
    } else {
      fetch();
    }
  };

  const onConfirm = () => {
    fetch();
  };

  const setDefaultValues = (values: object) => {
    // Merge incoming defaults with existing form values instead of fully replacing.
    // This prevents accidental clearing of fields when a partial default object is applied
    // (e.g., when FormSupervision passes a subset of fields).
    const merged = new Map<string, any>();

    // Start with current values so we preserve any user-typed fields
    formValues.forEach((fv) => merged.set(fv.name, fv.value));

    // Override/add incoming defaults, but do NOT overwrite existing values with undefined
    Object.keys(values).forEach((keyName: string) => {
      const incoming = values[keyName as keyof object];
      const existing = merged.has(keyName) ? merged.get(keyName) : undefined;

      // Do not overwrite an existing non-empty value with defaults.
      const existingHasValue = existing !== undefined && existing !== null && existing !== '';

      if (incoming === undefined || incoming === null) {
        // Skip undefined/null incoming to avoid clearing user input
        try {
        } catch (e) {}
        return;
      }

      if (existingHasValue) {
        try {
        } catch (e) {}
        return;
      }

      // Safe to set incoming default
      merged.set(keyName, incoming);
    });

    const newValuesArr = Array.from(merged.entries()).map(([name, value]) => ({ name, value }));
    // Debug: log default values being applied (helps detect unintended resets)
    try {
    } catch (e) {}

    setFormValues(newValuesArr);
  };

  return [
    {
      formControl,
      values: formValues,
      setValues: setFormValues,
      errors: formErrors,
      setErrors: setFormErrors,
      setDefaultValues,
      registers: formRegisters,
      setRegisters: setFormRegisters,
      submit,
      loading,
      confirm: {
        show: showConfirm,
        onConfirm,
        onClose: () => setShowConfirm(false),
      },
    },
  ];
};
