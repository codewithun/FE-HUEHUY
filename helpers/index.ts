// ✅ Export helper buat ambil token (bisa dipake di komponen mana aja)
export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const plain = localStorage.getItem('huehuy_token_plain');
  if (plain && plain.trim() !== '') return plain;
  
  try {
    const { Decrypt } = require('./encryption.helpers');
    const { token_cookie_name, admin_token_cookie_name, corporate_token_cookie_name } = require('./middleware.helpers');
    const Cookies = require('js-cookie');
    
    const isBrowser = typeof window !== 'undefined';
    const isAdminScope = isBrowser && window.location?.pathname?.startsWith('/admin');
    const isCorporateScope = isBrowser && window.location?.pathname?.startsWith('/corporate');
    
    let cookieName = isAdminScope ? admin_token_cookie_name : 
                     isCorporateScope ? corporate_token_cookie_name : 
                     token_cookie_name;
    
    const enc = Cookies.get(cookieName) || localStorage.getItem(cookieName);
    if (!enc) return null;
    
    const dec = Decrypt(enc);
    return dec && dec.trim() !== '' ? dec : null;
  } catch {
    return null;
  }
};

export * from './api.helpers';
export * from './encryption.helpers';
export * from './form.helpers';
export * from './middleware.helpers';
export * from './promo-entry.helpers';
export * from './promo.helpers';
export * from './search.helpers';
export * from './validation.helpers';

