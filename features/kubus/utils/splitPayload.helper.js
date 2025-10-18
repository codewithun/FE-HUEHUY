/* eslint-disable no-console */

/**
 * Memisahkan payload form menjadi cube dan ads
 * sesuai struktur BE (cube = kubus utama, ads = iklan/promo/voucher)
 */
export function splitCubeAndAdPayload(valuesInput) {
  // Kalau values bukan array, tapi object (atau undefined/null)
  // → ubah jadi array key-value biar bisa di-loop
  let values = [];

  if (Array.isArray(valuesInput)) {
    values = valuesInput;
  } else if (valuesInput && typeof valuesInput === 'object') {
    // Ubah object menjadi array {name, value}
    values = Object.entries(valuesInput).map(([k, v]) => ({ name: k, value: v }));
  } else {
    console.warn('⚠️ splitCubeAndAdPayload menerima values yang invalid:', valuesInput);
    return { cube: {}, ads: {} };
  }

  const cube = {};
  const ads = {};

  for (const v of values) {
    const { name, value } = v || {};
    if (!name) continue;

    if (name.startsWith('ads[')) {
      const key = name.replace(/^ads\[|\]$/g, '');
      ads[key] = value;
    } else if (!name.startsWith('_original_') && name !== 'change_map') {
      cube[name] = value;
    }
  }

  console.log('=== SPLIT PAYLOAD ===');
  console.log('Cube payload:', cube);
  console.log('Ads payload:', ads);
  console.log('=== END SPLIT ===');

  return { cube, ads };
}
