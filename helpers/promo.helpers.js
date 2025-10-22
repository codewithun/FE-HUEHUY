/**
 * Helper functions untuk promo management integration
 */

/**
 * Prepare promo data untuk sync ke tabel promos
 * @param {Object} formData - Data dari form kubus
 * @returns {Object} - Prepared promo data
 */
export const prepareKubusPromoData = (formData) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[PROMO HELPER] Input form data:', formData);

    // Extract promo data menggunakan field yang sudah ada
    const promoData = {
      // Detail promo menggunakan ads[detail] yang terpisah dari description
      // Fallback ke description jika detail tidak ada
      promo_detail: formData['ads[detail]'] || formData.detail || formData['ads[description]'] || formData.description || '',
      
      // Jarak dan lokasi untuk promo offline
      promo_distance: parseFloat(formData.map_distance) || 0,
      promo_location: formData.address || '',
      
      // Owner info menggunakan manager tenant (owner_user_id)
      promo_owner_name: formData.owner_user_name || '',
      promo_owner_contact: formData.owner_user_phone || formData.owner_user_email || '',
      
      // Always available - default false (tidak ada UI untuk set ini)
      promo_always_available: false,
    };

    // eslint-disable-next-line no-console
    console.log('[PROMO HELPER] Prepared promo data:', promoData);

    return promoData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[PROMO HELPER] Error preparing promo data:', error);
    return {
      promo_detail: '',
      promo_distance: 0,
      promo_location: '',
      promo_owner_name: '',
      promo_owner_contact: '',
      promo_always_available: false,
    };
  }
};

/**
 * Validate promo data
 * @param {Object} promoData - Promo data to validate
 * @returns {Object} - Validation result
 */
export const validatePromoData = (promoData) => {
  const errors = [];

  // Optional validations - promo sync is tidak wajib
  if (promoData.promo_distance && (promoData.promo_distance < 0 || isNaN(promoData.promo_distance))) {
    errors.push('Jarak promo harus berupa angka positif');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Transform kubus promo data ke format untuk promo management
 * @param {Object} kubusData - Data dari form kubus
 * @returns {Object} - Transformed data untuk promo management
 */
export const transformKubusPromoToManagement = (kubusData) => {
  try {
    const transformed = {
      // Basic info - menggunakan field yang sudah ada
      title: kubusData.ads?.title || kubusData['ads[title]'] || '',
      description: kubusData.ads?.description || kubusData['ads[description]'] || '',
      detail: kubusData.ads?.detail || kubusData['ads[detail]'] || kubusData.ads?.description || kubusData['ads[description]'] || '', // Fallback ke description
      
      // Location info - menggunakan field existing
      location: kubusData.address || '',
      promo_distance: parseFloat(kubusData.map_distance) || 0,
      
      // Owner info - dari manager tenant
      owner_name: kubusData.owner_user_name || '',
      owner_contact: kubusData.owner_user_phone || kubusData.owner_user_email || '',
      
      // Promo settings
      promo_type: kubusData.ads?.promo_type || kubusData['ads[promo_type]'] || 'offline',
      validation_type: kubusData.ads?.validation_type || kubusData['ads[validation_type]'] || 'auto',
      always_available: false, // Default false, tidak ada UI untuk set
      
      // Stock and limits - default null (unlimited)
      stock: null,
      
      // Dates
      start_date: kubusData.ads?.start_validate || kubusData['ads[start_validate]'] || null,
      end_date: kubusData.ads?.finish_validate || kubusData['ads[finish_validate]'] || null,
      
      // Meta
      created_from_kubus: true,
      cube_integration: true,
    };

    // eslint-disable-next-line no-console
    console.log('[PROMO HELPER] Transformed data:', transformed);

    return transformed;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[PROMO HELPER] Error transforming data:', error);
    return null;
  }
};