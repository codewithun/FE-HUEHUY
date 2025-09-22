const CryptoJS = require('crypto-js');

export function Encrypt(data: any, key = process.env.NEXT_PUBLIC_COOKIE_KEY): string {
  if (!data || !key) return '';
  try {
    let encJson = CryptoJS.AES.encrypt(String(data), key).toString();
    let encData = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encJson));
    return encData;
  } catch (err) {
    return '';
  }
}

export function Decrypt(data: any, key = process.env.NEXT_PUBLIC_COOKIE_KEY): string {
  if (!data || !key) return '';
  try {
    let decData = CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
    let bytes = CryptoJS.AES.decrypt(decData, key).toString(CryptoJS.enc.Utf8);
    return bytes;
  } catch (err) {
    return '';
  }
}
