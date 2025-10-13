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
    
    // Group ads fields for backend processing
    const adsFields: Record<string, any> = {};
    
    formValues.map((val) => {
      const v = val.value;
      let fieldName = val.name;
      
      // Handle ads fields specially  
      if (fieldName.startsWith('ads[') && fieldName.endsWith(']')) {
        const innerField = fieldName.slice(4, -1); // Extract field name from ads[field]
        
        // Handle nested custom_days fields specially
        if (innerField.includes('][')) {
          // This is a nested field like custom_days][saturday
          const parts = innerField.split('][');
          const mainField = parts[0]; // custom_days
          const subField = parts[1]; // saturday
          
          if (!adsFields[mainField]) {
            adsFields[mainField] = {};
          }
          adsFields[mainField][subField] = v;
          
          // Send as nested dot notation
          const nestedDotName = `ads.${mainField}.${subField}`;
          formData.append(nestedDotName, v != undefined ? String(v) : '');
          
          // Debug log
          // eslint-disable-next-line no-console
          console.log(`[DEBUG] Processing nested ads field: ${fieldName} -> ${nestedDotName}`, { value: v });
          
          return; // Skip further processing for nested fields
        }
        
        // Regular ads field processing
        // Don't include File objects in JSON - handle them separately
        if (!(v instanceof File)) {
          // Handle time format conversion for JSON object too
          let jsonValue = v;
          if (innerField === 'validation_time_limit' || innerField === 'jam_mulai' || innerField === 'jam_berakhir') {
            if (typeof jsonValue === 'string' && jsonValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
              jsonValue = jsonValue.substring(0, 5); // Remove seconds for JSON too
            }
          }
          adsFields[innerField] = jsonValue;
        }
        
        // Send in multiple formats for maximum backend compatibility
        const dotNotationName = `ads.${innerField}`;
        
        // Debug log for field conversion
        // eslint-disable-next-line no-console
        console.log(`[DEBUG] Processing ads field: ${fieldName} -> ${dotNotationName}`, { value: v, type: typeof v });
        
        // Send as dot notation (ads.field)
        if (v instanceof File) {
          formData.append(dotNotationName, v);
        } else if (Array.isArray(v)) {
          v.forEach((item) => formData.append(`${dotNotationName}[]`, String(item)));
        } else if (v !== undefined && v !== null && typeof v === 'object') {
          formData.append(dotNotationName, JSON.stringify(v));
        } else {
          // Handle time format conversion for specific fields
          let processedValue = v != undefined ? String(v) : '';
          if (innerField === 'validation_time_limit' || innerField === 'jam_mulai' || innerField === 'jam_berakhir') {
            // Convert HH:mm:ss to HH:mm format for backend validation
            if (processedValue && processedValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
              processedValue = processedValue.substring(0, 5); // Remove seconds
              // eslint-disable-next-line no-console
              console.log(`[DEBUG] Time format conversion for ${innerField}: ${v} -> ${processedValue}`);
            }
          }
          formData.append(dotNotationName, processedValue);
        }
        
        // Also send as root level field (fallback for backend's $request->input($field))
        const rootFieldName = innerField;
        if (v instanceof File) {
          formData.append(rootFieldName, v);
        } else if (Array.isArray(v)) {
          v.forEach((item) => formData.append(`${rootFieldName}[]`, String(item)));
        } else if (v !== undefined && v !== null && typeof v === 'object') {
          formData.append(rootFieldName, JSON.stringify(v));
        } else {
          // Handle time format conversion for specific fields
          let processedValue = v != undefined ? String(v) : '';
          if (innerField === 'validation_time_limit' || innerField === 'jam_mulai' || innerField === 'jam_berakhir') {
            // Convert HH:mm:ss to HH:mm format for backend validation
            if (processedValue && processedValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
              processedValue = processedValue.substring(0, 5); // Remove seconds
            }
          }
          formData.append(rootFieldName, processedValue);
        }
        
        return; // Skip regular processing for ads fields
      }
      
      // Regular field processing
      // Special handling for boolean checkbox fields
      if (Array.isArray(v) && (val.name === 'is_information' || val.name === 'is_recommendation')) {
        // For boolean checkboxes, send 1 if checked, 0 if not checked
        formData.append(fieldName, v.length > 0 ? '1' : '0');
      } else if (v instanceof File) {
        formData.append(fieldName, v);
      } else if (Array.isArray(v)) {
        // Append arrays with [] notation for backend (e.g., dynamic_content_cubes[])
        v.forEach((item) => formData.append(`${fieldName}[]`, String(item)));
      } else if (v !== undefined && v !== null && typeof v === 'object') {
        // Serialize objects safely
        formData.append(fieldName, JSON.stringify(v));
      } else {
        formData.append(fieldName, v != undefined ? String(v) : '');
      }
    });
    
    // Send ads object as JSON for backend's normalizeArrayInput method
    if (Object.keys(adsFields).length > 0) {
      formData.append('ads', JSON.stringify(adsFields));
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Sending ads JSON object:', adsFields);
    }
    
    // Handle opening hours data conversion
    const openingHoursData: any[] = [];
    const openingHoursFields = formValues.filter(val => val.name.startsWith('data[') && val.name.includes(']['));
    
    if (openingHoursFields.length > 0) {
      // Group opening hours by index
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
      
      // Convert to array format with day mapping
      const dayMapping = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
      
      Object.keys(hoursGrouped).forEach(index => {
        const hourData = hoursGrouped[index];
        // Add day field based on index
        if (!hourData.day && dayMapping[parseInt(index)]) {
          hourData.day = dayMapping[parseInt(index)];
        }
        openingHoursData.push(hourData);
      });
      
      // Send as opening_hours JSON
      if (openingHoursData.length > 0) {
        formData.append('opening_hours', JSON.stringify(openingHoursData));
        // eslint-disable-next-line no-console
        console.log('[DEBUG] Sending opening_hours JSON with days:', openingHoursData);
      }
    }

    // Debug logging for form data
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Form submission data:');
    if (formData instanceof FormData) {
      // Convert FormData to array for logging
      const entries = Array.from(formData.entries());
      
      // Special attention to ads fields
      const adsEntries = entries.filter(([key]) => key.startsWith('ads'));
      if (adsEntries.length > 0) {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] ADS FIELDS BEING SENT:');
        adsEntries.forEach(([key, value]) => {
          // eslint-disable-next-line no-console
          console.log(`  ${key}:`, value, typeof value);
        });
      }
      
      // Log all entries
      entries.forEach(([key, value]) => {
        // eslint-disable-next-line no-console
        console.log(`  ${key}:`, value);
      });
    } else {
      // eslint-disable-next-line no-console
      console.log('  Form data:', formData);
    }

    const mutate = await post({
      url: submitControl.url,
      path: submitControl.path,
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
      
      // Log specific error messages
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
