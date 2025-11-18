/* eslint-disable @next/next/no-img-element */
import PromoCardIcons from '../../base.components/card-icons/PromoCardIcons';

// Util: normalisasi boolean dari berbagai bentuk
const normalizeBoolLike = (val) => {
  if (val === true || val === 1) return true;
  if (typeof val === 'number') return val === 1;
  if (Array.isArray(val)) return val.length > 0 && (val.includes(1) || val.includes('1') || val.includes(true));
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (['1', 'true', 'y', 'yes', 'ya', 'iya', 'on'].includes(s)) return true;
    if (['0', 'false', 'n', 'no', 'off', ''].includes(s)) return false;
    try { return normalizeBoolLike(JSON.parse(val)); } catch { }
  }
  return !!val;
};

// Util: tipe normalisasi antara ad/cube
const getNormalizedType = (ad = {}, cube = {}) => {
  const t1 = String(ad?.type || '').toLowerCase();
  const t2 = String(cube?.type || ad?.cube?.type || '').toLowerCase();
  const ct = String(cube?.content_type || ad?.content_type || '').toLowerCase();

  if (normalizeBoolLike(ad?.is_information) || normalizeBoolLike(ad?.cube?.is_information) || normalizeBoolLike(cube?.is_information)) return 'information';
  if (t1 === 'information' || t2 === 'information' || ['kubus-informasi', 'information', 'informasi'].includes(ct)) return 'information';

  if (t1 === 'voucher' || normalizeBoolLike(ad?.is_voucher) || normalizeBoolLike(ad?.voucher)) return 'voucher';

  if (t1 === 'iklan' || t2 === 'iklan' || normalizeBoolLike(ad?.is_advertising) || normalizeBoolLike(ad?.advertising)) return 'iklan';

  return 'promo';
};

const getCategoryLabel = (ad, cube) => {
  const t = getNormalizedType(ad, cube);
  if (t === 'information') return 'Informasi';
  if (t === 'voucher') return 'Voucher';
  if (t === 'iklan') return 'Advertising';
  return 'Promo';
};

// Util: normalisasi URL gambar untuk path storage maupun absolute
const normalizeImageSrc = (raw) => {
  if (!raw || typeof raw !== 'string') return '/default-avatar.png';
  const s = raw.trim();
  if (!s) return '/default-avatar.png';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^data:/i.test(s)) return s;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const apiBase = baseUrl.replace(/\/api\/?$/, '');

  let path = s.replace(/^\/+/, '').replace(/^api\/storage\//i, 'storage/');
  if (/^(ads|promos|uploads|images|files|banners|communities)\//i.test(path)) {
    path = `storage/${path}`;
  }
  if (!path.startsWith('storage/') && !path.startsWith('/')) {
    path = `/${path}`;
  }
  if (path.startsWith('storage/')) {
    return `${apiBase}/${path}`.replace(/([^:]\/)\/+/g, '$1');
  }
  return path.startsWith('/') ? path : `/${path}`;
};

// SVG icon kecil untuk label kategori
const CategoryIcons = {
  advertising: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" />
    </svg>
  ),
  information: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
    </svg>
  ),
  voucher: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4,4A2,2 0 0,0 2,6V10C3.11,10 4,10.9 4,12A2,2 0 0,1 2,14V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V14C20.89,14 20,13.1 20,12A2,2 0 0,1 22,10V6A2,2 0 0,0 20,4H4M4,6H20V8.54C18.81,9.23 18,10.53 18,12C18,13.47 18.81,14.77 20,15.46V18H4V15.46C5.19,14.77 6,13.47 6,12C6,10.53 5.19,9.23 4,8.54V6Z" />
    </svg>
  ),
  promo: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.77,14.05 22,13.55 22,13C22,12.45 21.77,11.95 21.41,11.58Z" />
    </svg>
  ),
};

const getCategoryIcon = (label) => {
  const k = String(label || '').toLowerCase();
  if (k === 'advertising') return CategoryIcons.advertising;
  if (k === 'informasi' || k === 'information') return CategoryIcons.information;
  if (k === 'voucher') return CategoryIcons.voucher;
  return CategoryIcons.promo;
};

export default function KomunitasCard({ item, size = 'M', onClick }) {
  // Dukungan bentuk data fleksibel: ad langsung, {ad,cube}, raw cube dengan ads[0]
  const ad = item?.ad || (Array.isArray(item?.ads) ? item.ads[0] : null) || (item?.type ? item : null) || null;
  const cube = item?.cube || item?.rawCube || ad?.cube || (item?.ads ? item : null) || null;

  // Debug logging
  // eslint-disable-next-line no-console
  console.log('🎴 KomunitasCard received:', {
    has_ad: !!ad,
    has_cube: !!cube,
    ad_id: ad?.id,
    ad_title: ad?.title,
    cube_id: cube?.id,
    cube_label: cube?.label,
    cube_name: cube?.name,
    size: size
  });

  // Prioritas gambar: ad.image_1 > ad.image_2 > ad.image_3 > ad.picture_source > ad.image > cube.image > cube.picture_source
  const imageUrl =
    ad?.image_1 ||
    ad?.image_2 ||
    ad?.image_3 ||
    ad?.picture_source ||
    ad?.image ||
    cube?.image ||
    cube?.picture_source ||
    cube?.image_1 ||
    cube?.image_2 ||
    cube?.image_3 ||
    '/default-avatar.png';

  // Prioritas title: ad.title > cube.label > cube.name > cube.code > address > "Kubus #ID"
  const title = ad?.title ||
    cube?.label ||
    cube?.name ||
    (cube?.code ? `Kubus ${cube.code}` : null) ||
    (cube?.address ? cube.address.substring(0, 30) : null) ||
    (cube?.id ? `Kubus #${cube.id}` : 'Promo');

  // Prioritas address: ad.cube.address > cube.address
  const address = ad?.cube?.address || cube?.address || '';

  const categoryLabel = getCategoryLabel(ad, cube);
  const icon = getCategoryIcon(categoryLabel);

  const img = normalizeImageSrc(imageUrl);

  // Debug final values
  // eslint-disable-next-line no-console
  console.log('🎴 KomunitasCard final values:', {
    cube_id: cube?.id,
    title: title,
    imageUrl: imageUrl,
    img: img,
    address: address,
    categoryLabel: categoryLabel
  });

  // Theme konsisten untuk halaman komunitas (glassmorphism)
  const wrapperBase = 'flex-shrink-0 cursor-pointer transition-all duration-300';
  const borderGlass = 'border border-white/20 bg-white/10 backdrop-blur-md';
  const hoverGlass = 'hover:scale-[1.02] hover:bg-white/15 hover:shadow-xl';

  if (size === 'XL-Ads') {
    return (
      <div
        className={`relative rounded-[18px] overflow-hidden shadow-lg ${borderGlass} ${wrapperBase} ${hoverGlass}`}
        style={{ minWidth: 320, maxWidth: 340, height: 400 }}
        onClick={onClick}
      >
        <div className="relative w-full bg-transparent flex items-center justify-center flex-shrink-0" style={{ height: '100%' }}>
          <img
            src={img}
            alt={title}
            className="object-cover w-full h-full rounded-[18px] p-2"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 backdrop-blur-sm p-4 border-t border-white/20"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <h3 title={title} className="text-[15px] font-bold text-white leading-snug mb-2 line-clamp-1 drop-shadow-sm">
            {title}
          </h3>
          <div className="flex flex-col gap-1.5">
            <span className="bg-white/30 text-white text-[11px] font-semibold px-3 py-[3px] rounded-md border border-white/40 flex items-center gap-1 w-fit">
              {icon}
              {categoryLabel}
            </span>
            <div className="w-full" style={{ minHeight: 32 }}>
              <PromoCardIcons ad={ad} variant="sm" layout="horizontal" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (size === 'XL') {
    return (
      <div
        className={`rounded-[12px] overflow-hidden shadow-xl ${borderGlass} ${wrapperBase} ${hoverGlass}`}
        style={{ minWidth: 330, maxWidth: 330, width: 330 }}
        onClick={onClick}
      >
        <div className="relative w-full bg-transparent flex items-center justify-center flex-shrink-0 p-2" style={{ height: '200px' }}>
          <img src={img} alt={title} className="object-cover w-full h-full rounded-[12px]" />
        </div>
        <div className="p-2 bg-white/5 border-t border-white/20" style={{ minHeight: 130 }}>
          <h3 title={title} className="text-[14px] font-bold text-white line-clamp-1 mb-0.5 drop-shadow-sm">{title}</h3>
          {address ? (
            <p className="text-[12px] text-white/90 line-clamp-1 mb-1 drop-shadow-sm">{address}</p>
          ) : (
            <div className="h-4 mb-1" />
          )}
          <div className="flex flex-col gap-1.5">
            <span className="bg-white/30 text-white text-[10px] font-semibold px-2 py-[2px] rounded-md border border-white/40 flex items-center gap-1 w-fit">
              {icon}
              {categoryLabel}
            </span>
            <div className="w-full" style={{ minHeight: 32 }}>
              <PromoCardIcons ad={ad} variant="sm" layout="horizontal" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (size === 'L') {
    return (
      <div
        className={`flex items-stretch rounded-[14px] overflow-hidden shadow-xl ${borderGlass} ${wrapperBase} ${hoverGlass}`}
        style={{ minWidth: 280, maxWidth: 325, height: 150 }}
        onClick={onClick}
      >
        <div className="relative w-[40%] bg-transparent flex items-center justify-center overflow-hidden p-2">
          <img src={img} alt={title} className="object-cover w-full h-full rounded-[14px]" />
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between bg-white/5 border-l border-white/20">
          <div>
            <h3 className="text-[14px] font-bold text-white line-clamp-1 leading-snug mb-1 drop-shadow-sm">{title}</h3>
            {address ? (
              <p className="text-[12px] text-white/90 line-clamp-1 mb-1 drop-shadow-sm">{address}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="bg-white/30 text-white text-[10px] font-semibold px-2 py-[2px] rounded-md border border-white/40 flex items-center gap-1 w-fit">
              {icon}
              {categoryLabel}
            </span>
            <div className="w-full" style={{ minHeight: 30 }}>
              <PromoCardIcons ad={ad} variant="sm" layout="horizontal" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (size === 'M') {
    return (
      <div
        className={`flex flex-col rounded-[12px] overflow-hidden shadow-lg ${borderGlass} ${wrapperBase} hover:scale-[1.02] transition-all duration-300`}
        style={{ minWidth: 180, maxWidth: 200 }}
        onClick={onClick}
      >
        <div className="relative w-full bg-transparent flex items-center justify-center overflow-hidden p-2" style={{ height: '150px' }}>
          <img src={img} alt={title} className="object-cover w-full h-full rounded-[12px]" />
        </div>
        <div className="p-2 bg-white/5 border-t border-white/20" style={{ minHeight: 130 }}>
          <h3 title={title} className="text-[14px] font-bold text-white line-clamp-1 mb-0.5 drop-shadow-sm">{title}</h3>
          {address ? (
            <p className="text-[12px] text-white/90 line-clamp-1 drop-shadow-sm">{address}</p>
          ) : (
            <div className="h-4 mb-1" />
          )}
          <div className="flex flex-col gap-1.5">
            <span className="bg-white/30 text-white text-[10px] font-semibold px-2 py-[2px] rounded-md border border-white/40 flex items-center gap-1 w-fit">
              {icon}
              {categoryLabel}
            </span>
            <div className="w-full" style={{ minHeight: 32 }}>
              <PromoCardIcons ad={ad} variant="sm" layout="horizontal" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // S
  return (
    <div
      className={`flex flex-col rounded-[12px] overflow-hidden shadow-lg ${borderGlass} ${wrapperBase} hover:scale-[1.02] transition-all duration-300`}
      style={{ minWidth: 140, maxWidth: 160 }}
      onClick={onClick}
    >
      <div className="relative w-full bg-transparent flex items-center justify-center overflow-hidden p-2" style={{ height: '120px' }}>
        <img src={img} alt={title} className="object-cover w-full h-full rounded-[12px]" />
      </div>
      <div className="p-2 bg-white/5 border-t border-white/20" style={{ minHeight: 110 }}>
        <h3 title={title} className="text-[13px] font-bold text-white line-clamp-1 mb-0.5 drop-shadow-sm">{title}</h3>
        {address ? (
          <p className="text-[11px] text-white/90 line-clamp-1 drop-shadow-sm">{address}</p>
        ) : (
          <div className="h-3 mb-1" />
        )}
        <div className="flex flex-col gap-1.5">
          <span className="bg-white/30 text-white text-[10px] font-semibold px-2 py-[2px] rounded-md border border-white/40 flex items-center gap-1 w-fit">
            {icon}
            {categoryLabel}
          </span>
          <div className="w-full" style={{ minHeight: 28 }}>
            <PromoCardIcons ad={ad} variant="xs" layout="horizontal" />
          </div>
        </div>
      </div>
    </div>
  );
}