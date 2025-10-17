import { useState, useCallback } from 'react';
import { toStoragePath, withVersion } from '../utils/helpers';

export const useCropFunctionality = () => {
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [currentFormControl, setCurrentFormControl] = useState(null);
  const [previewOwnerKey, setPreviewOwnerKey] = useState('');

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
      setRawImageUrl(URL.createObjectURL(file));
      setCurrentFormControl(formControl);
      setPreviewOwnerKey(formKey);
      setCropOpen(true);
    } catch (err) {
      alert('Error reading file');
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
      setTimeout(() => {
        if (currentFormControl?.onChange) {
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
  }, [previewUrl]);

  // Helper untuk mendapatkan URL gambar dari server berdasarkan field name
  const getServerImageUrl = useCallback((fieldName, values, selectedData) => {
    const valMap = (name) => values?.find?.((v) => v.name === name)?.value;

    let rawFromValues = '';

    // Mapping untuk different field names
    if (fieldName === 'image') {
      rawFromValues =
        valMap('image') ||
        selectedData?.image ||
        selectedData?.cube?.image ||
        selectedData?.picture_source ||
        '';
    } else if (fieldName === 'ads[image]') {
      rawFromValues =
        valMap('ads[image]') ||
        selectedData?.ads?.[0]?.image ||
        selectedData?.ads?.[0]?.picture_source ||
        '';
    } else if (fieldName === 'ads[image_1]') {
      rawFromValues =
        valMap('ads[image_1]') ||
        selectedData?.ads?.[0]?.image_1 ||
        '';
    } else if (fieldName === 'ads[image_2]') {
      rawFromValues =
        valMap('ads[image_2]') ||
        selectedData?.ads?.[0]?.image_2 ||
        '';
    } else if (fieldName === 'ads[image_3]') {
      rawFromValues =
        valMap('ads[image_3]') ||
        selectedData?.ads?.[0]?.image_3 ||
        '';
    } else {
      // Generic fallback
      rawFromValues = valMap(fieldName) || '';
    }

    if (!rawFromValues) return null;
    
    // ✅ PERBAIKAN: Pastikan rawFromValues adalah string sebelum memanggil includes
    const rawStr = String(rawFromValues || '').trim();
    if (!rawStr) return null;
    
    // Skip path yang mengandung temporary file atau path Windows yang salah
    if (rawStr.includes('\\Temp\\') || rawStr.includes('C:\\Users') || rawStr.includes('.tmp')) {
      return null;
    }
    
    return toStoragePath(rawStr);
  }, []);

  const resetCropState = useCallback(() => {
    setCropOpen(false);
    setRawImageUrl('');
    setCurrentFormControl(null);
    setPreviewOwnerKey('');
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
  }, [previewUrl]);

  return {
    cropOpen,
    setCropOpen,
    rawImageUrl,
    setRawImageUrl,
    previewUrl,
    setPreviewUrl,
    currentFormControl,
    setCurrentFormControl,
    previewOwnerKey,
    setPreviewOwnerKey,
    handleFileInput,
    handleCropSave,
    handleRecrop,
    getServerImageUrl,
    resetCropState,
    withVersion
  };
};