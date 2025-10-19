import { useState, useEffect } from 'react';
import { post, postProps } from './api.helpers';
import { validationHelper, validationRules } from './validation.helpers';

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
    setFormValues([
      ...formValues.filter((val) => val.name != name),
      { name, value: value != undefined ? value : '' },
    ]);
  };
  // console.log(formValues);

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
    if (isAnyUpdate) formData.set('_method', 'PUT');

    // field khusus cube—SKIP saat update ads
    const cubeOnly = new Set([
      'cube_type_id', 'is_recommendation', 'is_information', 'link_information',
      '_original_map_lat', '_original_map_lng', '_original_address',
      'map_lat', 'map_lng', 'address',
      'cube_tags[0][map_lat]', 'cube_tags[0][map_lng]', 'cube_tags[0][address]',
      'content_type', 'status', 'owner_user_id', 'world_id', 'corporate_id', 'image'
    ]);

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

      if (isAdUpdate) {
        // ---------------------------
        // MODE UPDATE ADS
        // ---------------------------

        // a) skip semua field khusus cube saat update ads
        if (cubeOnly.has(name)) continue;

        // b) flatten ads[...] → root, dan JANGAN kirim 'ads.xxx' (dot)
        const m = name.match(/^ads\[(.+)\]$/);

        if (m) {
          const inner = m[1]; // e.g. 'title', 'custom_days][saturday', dst.

          // nested: ads[custom_days][saturday] -> custom_days[saturday]
          if (inner.includes('][')) {
            const [main, sub] = inner.split('][');     // 'custom_days', 'saturday'
            const flat = `${main}[${sub}]`;            // 'custom_days[saturday]'

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

        if (Array.isArray(v) && (name === 'is_information' || name === 'is_recommendation')) {
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
        if (Array.isArray(v) && (name === 'is_information' || name === 'is_recommendation')) {
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
    if (!isAdUpdate && Object.keys(adsFields).length > 0) {
      formData.append('ads', JSON.stringify(adsFields));
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Sending ads JSON object:', adsFields);
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
        // eslint-disable-next-line no-console
        console.log('[DEBUG] Sending opening_hours JSON with days:', openingHoursData);
      }
    }

    // Debug logging
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Form submission data:');
    if (formData instanceof FormData) {
      const entries = Array.from(formData.entries());

      const adsEntries = entries.filter(([key]) => key.startsWith('ads'));
      if (adsEntries.length > 0) {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] ADS FIELDS BEING SENT:');
        adsEntries.forEach(([key, value]) => {
          // eslint-disable-next-line no-console
          console.log(`  ${key}:`, value, typeof value);
        });
      }

      entries.forEach(([key, value]) => {
        // eslint-disable-next-line no-console
        console.log(`  ${key}:`, value);
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('  Form data:', formData);
    }

    // === Request ===
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
      // eslint-disable-next-line no-console
      console.log('[DEBUG] 422 Validation Error Response:', mutate.data);
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Detailed errors:', mutate.data.errors);

      if (mutate.data.errors) {
        Object.entries(mutate.data.errors).forEach(([field, messages]: [string, any]) => {
          // eslint-disable-next-line no-console
          console.log(`[DEBUG] Field "${field}" error:`, Array.isArray(messages) ? messages[0] : messages);
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
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Error Response:', {
        status: mutate?.status,
        data: mutate?.data,
        message: mutate?.message
      });

      onFailed?.(mutate?.status || 500);
      setShowConfirm(false);
      setLoading(false);
    }
  };

  const submit = async (e: any) => {
    e?.preventDefault();
    setFormErrors([]);

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
    const newValues: { name: string; value?: any }[] = [];

    Object.keys(values).map((keyName: string) => {
      // if (formRegisters.find((form) => form.name == keyName)) {
      newValues.push({
        name: keyName,
        value: values[keyName as keyof object],
      });
      // }
    });
    setFormValues(newValues);
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
