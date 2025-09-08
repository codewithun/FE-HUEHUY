import { faArrowLeft, faCheckCircle, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { token_cookie_name } from '../../../helpers';
import { get, post } from '../../../helpers/api.helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';

const DetailVoucherPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helper function to construct proper image URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-avatar.png';

    // Sudah absolut? langsung balikin
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    // Sudah root-relative? langsung pakai (opsional: prefix-kan base jika perlu)
    if (imagePath.startsWith('/')) return imagePath;

    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
    const u = new URL(raw);                // aman untuk hostname & protokol
    const origin = u.origin;               // contoh: https://api-159-223-48-146.nip.io

    // Hapus path "/api" di akhir (hanya path, bukan subdomain)
    // Misal: https://.../api → tetap origin yang sama, kita build path sendiri
    const cleaned = `${origin}/storage/${String(imagePath).replace(/^storage\//, '')}`;

    return cleaned;
  };
  
  useEffect(() => {
    if (id) {
      fetchVoucherDetails();
    }
  }, [id]);

  // --- MODIFIED: fetchVoucherDetails now returns fetched data (or null) ---
  const fetchVoucherDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get({
        path: `admin/vouchers/${id}`
      });

      if (response?.status === 200 && response?.data?.data) {
        const voucherData = response.data.data;
        setVoucher(voucherData);
        
        // Check if user already has this voucher (check voucher_items)
        const userVoucherItems = voucherData.voucher_items || [];
        const claimedVouchers = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
        const isAlreadyClaimed = claimedVouchers.some(v => v.voucher_id === voucherData.id || v.id === voucherData.id)
          || userVoucherItems.length > 0; // server-side info if available
        setIsClaimed(isAlreadyClaimed);

        return voucherData;
      } else if (response?.status === 404) {
        setError('Voucher tidak ditemukan');
        return null;
      } else {
        setError('Gagal memuat data voucher');
        return null;
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat voucher');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Cek apakah ada parameter autoRegister
    const autoRegister = router.query.autoRegister || router.query.source;
    
    if (autoRegister) {
      // Jika dari QR scan, redirect ke halaman utama app
      router.push('/app');
    } else {
      // Normal back behavior
      router.back();
    }
  };

  const handleClaim = async () => {
    if (!voucher || isClaimed) return;
    
    setClaimLoading(true);
    try {
      // In a real app, you'd get the current user ID from context/auth
      // For now, we'll use a dummy user ID or get from localStorage
      const userData = JSON.parse(localStorage.getItem('huehuy_user') || '{}');
      const userId = userData.id || 1; // fallback to dummy ID

      const response = await post({
        path: `admin/vouchers/${voucher.id}/send-to-user`,
        body: {
          user_id: userId
        }
      });

      if (response?.status === 200) {
        // Save to localStorage for offline access
        const claimedVouchers = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
        const newVoucherItem = {
          id: response.data.data.id,
          voucher_id: voucher.id,
          user_id: userId,
          code: response.data.data.code,
          claimed_at: new Date().toISOString(),
          expired_at: voucher.valid_until,
          validation_at: null,
          voucher: voucher
        };
        claimedVouchers.push(newVoucherItem);
        localStorage.setItem('huehuy_vouchers', JSON.stringify(claimedVouchers));
        
        setIsClaimed(true);
        setShowSuccessModal(true);
      } else if (response?.status === 400) {
        setError(response.data.message || 'Stock voucher habis!');
      } else {
        setError('Gagal mengklaim voucher');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengklaim voucher');
      // console.error('Error claiming voucher:', err);
    } finally {
      setClaimLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/app/saku');
  };

  // --- MODIFIED: handle autoRegister / source param and login check ---
  useEffect(() => {
    if (!router.isReady) return;
    const encrypted = Cookies.get(token_cookie_name);
    const token = encrypted ? Decrypt(encrypted) : null;

    // accept both `autoRegister` or `source=qr`
    const autoRegister = router.query.autoRegister || router.query.source;

    if (autoRegister) {
      // If user is not logged in -> redirect to create account (preserve absolute current URL)
      if (!token) {
        // gunakan absolute URL supaya next mengandung host + query
        const next = typeof window !== 'undefined' ? window.location.href : `/app/voucher/${id}`;
        // Gunakan window.location.href untuk memastikan redirect
        if (typeof window !== 'undefined') {
          window.location.href = `/buat-akun?next=${encodeURIComponent(next)}`;
        }
        return;
      }
      
      // Jika ada token, cek status verifikasi user
      checkUserVerificationStatus(token);
    }
  }, [router.isReady, router.query, id]);

  // Fungsi untuk cek status verifikasi - DIPERBAIKI
  const checkUserVerificationStatus = async (token) => {
    try {
      const response = await get({
        path: 'account-unverified',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      
      // PERBAIKAN: Cek dengan lebih teliti
      // Status 200 dengan verified: false = belum verifikasi
      // Status 404 atau error = sudah verifikasi
      if (response?.status === 200) {
        // Cek apakah response menunjukkan belum verifikasi
        const isUnverified = response?.data?.verified === false || 
                             response?.data?.message?.includes('not verified') ||
                             !response?.data?.profile?.email_verified_at;
        
        if (isUnverified) {
          const next = typeof window !== 'undefined' ? window.location.href : `/app/voucher/${id}`;
          window.location.href = `/verifikasi?next=${encodeURIComponent(next)}`;
          return;
        }
      }
      
      
    } catch (err) {
      // Jika error checking verification, asumsikan sudah terverifikasi
    }
  };

  const getToken = () => {
    const encrypted = Cookies.get(token_cookie_name);
    if (encrypted) return Decrypt(encrypted);
    // fallback: coba localStorage (beberapa flow menyimpan di sana)
    const ls = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return ls || null;
  };

  if (loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat detail voucher...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faCheckCircle} className="text-red-500 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Oops!</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={handleBack}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center p-8">
          <p className="text-slate-600">Voucher tidak ditemukan</p>
          <button 
            onClick={handleBack}
            className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-container lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen lg:min-h-0 lg:my-4 lg:rounded-2xl lg:shadow-xl lg:border lg:border-slate-200 lg:overflow-hidden">
      {/* Header */}
      <div className="bg-primary w-full h-[60px] px-4 relative overflow-hidden lg:rounded-t-2xl">
        <div className="absolute inset-0">
          <div className="absolute top-1 right-3 w-6 h-6 bg-white rounded-full opacity-10"></div>
          <div className="absolute bottom-2 left-3 w-4 h-4 bg-white rounded-full opacity-10"></div>
          <div className="absolute top-2 left-1/3 w-3 h-3 bg-white rounded-full opacity-10"></div>
        </div>
        <div className="flex items-center justify-between h-full relative z-10">
          <button onClick={handleBack} className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-[10px] hover:bg-opacity-30 transition-all">
            <FontAwesomeIcon icon={faArrowLeft} className="text-white text-sm" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-white font-bold text-sm">Voucher</h1>
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="bg-white min-h-screen w-full px-4 lg:px-6 pt-4 lg:pt-6 pb-28 lg:pb-4">
        <div className="lg:mx-auto lg:max-w-md">
          {/* Voucher Image */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] shadow-lg overflow-hidden border border-slate-100">
              <div className="relative h-80 bg-slate-50 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full">
                  <Image 
                    src={getImageUrl(voucher?.image)} 
                    alt={voucher?.name || 'Voucher'}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg=="
                    onError={() => {
                      const img = document.querySelector(`img[alt='${voucher?.name}']`);
                      if (img) img.src = '/default-avatar.png';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Info */}
          <div className="mb-4">
            <div className="bg-primary rounded-[20px] p-4 shadow-lg">
              <div className="mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">Kode Voucher</span>
                    <div className="text-xs text-white opacity-80">{voucher.code}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white opacity-80">Stock</span>
                    <div className="text-xs text-white opacity-70">{voucher.stock || 0}</div>
                  </div>
                </div>
              </div>
              <div className="mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">Tipe Delivery</span>
                    <div className="text-xs text-white opacity-80">{voucher.delivery || 'manual'}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white opacity-80">Berlaku Hingga</span>
                    <div className="text-xs text-white opacity-70">
                      {voucher.valid_until ? new Date(voucher.valid_until).toLocaleDateString() : 'Tidak terbatas'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Title & Description */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-4 text-left">
                {voucher.name}
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm text-left mb-4">
                {voucher.description || 'Tidak ada deskripsi'}
              </p>
              {voucher.type && (
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                  {voucher.type}
                </div>
              )}
            </div>
          </div>

          {/* Location Info */}
          {voucher.tenant_location && (
            <div className="mb-4">
              <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Lokasi Tenant</h4>
                <p className="text-slate-600 text-xs leading-relaxed mb-3">{voucher.tenant_location}</p>
                <button className="w-full bg-primary text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors text-sm font-semibold flex items-center justify-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm" />
                  Rute
                </button>
              </div>
            </div>
          )}

          {/* Community Info */}
          {voucher.community && (
            <div className="mb-4">
              <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Komunitas</h4>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900 text-xs">Nama: {voucher.community.name || '-'}</p>
                  <p className="text-xs text-slate-500">Deskripsi: {voucher.community.description || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button Bar */}
      {!isClaimed && voucher.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:static lg:mt-6 lg:mb-4 bg-white border-t border-slate-200 lg:border-t-0 p-4 lg:p-6 z-30">
          <div className="lg:max-w-sm lg:mx-auto">
            <button 
              onClick={handleClaim}
              disabled={claimLoading}
              className={`claim-button w-full py-4 lg:py-3.5 rounded-[15px] lg:rounded-xl font-bold text-lg lg:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] lg:max-w-sm lg:mx-auto ${
                claimLoading 
                  ? 'bg-slate-400 text-white cursor-not-allowed' 
                  : 'bg-green-700 text-white hover:bg-green-800 lg:hover:bg-green-600 focus:ring-4 focus:ring-green-300 lg:focus:ring-green-200'
              }`}
            >
              {claimLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Mengklaim Voucher...
                </div>
              ) : (
                'Klaim Voucher Sekarang'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Already Claimed or Out of Stock */}
      {(isClaimed || voucher.stock <= 0) && (
        <div className="fixed bottom-0 left-0 right-0 lg:static lg:mt-6 lg:mb-4 bg-white border-t border-slate-200 lg:border-t-0 p-4 lg:p-6 z-30">
          <div className="lg:max-w-sm lg:mx-auto">
            <div className={`w-full py-4 lg:py-3.5 rounded-[15px] lg:rounded-xl font-bold text-lg lg:text-base text-center ${
              isClaimed 
                ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                : 'bg-slate-100 text-slate-500 border-2 border-slate-200'
            }`}>
              {isClaimed ? (
                <div className="flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  Voucher Sudah Diklaim
                </div>
              ) : (
                'Stock Voucher Habis'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] w-full max-w-sm mx-auto p-6 text-center animate-bounce-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Selamat!</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Voucher berhasil diklaim dan masuk ke Saku Promo Anda!
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleSuccessModalClose}
                className="w-full bg-primary text-white py-3 rounded-[12px] font-semibold hover:bg-opacity-90 transition-all"
              >
                Lihat Saku Promo
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-[12px] font-semibold hover:bg-slate-200 transition-all"
              >
                Tetap di Halaman Ini
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @media (min-width: 1024px) {
          .desktop-container { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
        }
      `}</style>
    </div>
  );
};

export default DetailVoucherPage;
