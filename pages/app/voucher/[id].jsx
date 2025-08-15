import { faArrowLeft, faCheckCircle, faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const DetailVoucherPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClaimed, setIsClaimed] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (id) {
      const vouchers = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
      const found = vouchers.find(v => v.id == id || v.code == id || (v.ad && v.ad.id == id));
      setVoucher(found || null);
      setIsClaimed(!!found);
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    router.push('/app');
  };

  const handleClaim = () => {
    if (!voucher && id) {
      setClaimLoading(true);
      // Simulate claim logic (in real app, fetch promo data by id, here just dummy)
      const dummyVoucher = {
        id,
        code: 'PROMO' + Date.now().toString().slice(-8),
        claimed_at: new Date().toISOString(),
        expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        validation_at: null,
        voucher_item: null,
        ad: {
          id,
          title: 'Voucher Promo',
          picture_source: '/default-avatar.png',
          status: 'active',
          cube: {
            code: 'community-1',
            user: { name: 'Admin', phone: '-' },
            corporate: null,
            tags: [{ address: '-', link: null, map_lat: null, map_lng: null }]
          }
        }
      };
      const vouchers = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
      vouchers.push(dummyVoucher);
      localStorage.setItem('huehuy_vouchers', JSON.stringify(vouchers));
      setTimeout(() => {
        setClaimLoading(false);
        setShowSuccessModal(true);
      }, 1000);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/app/saku');
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
      {/* Content */}
      <div className="bg-white min-h-screen w-full px-4 lg:px-6 pt-4 lg:pt-6 pb-28 lg:pb-4">
        <div className="lg:mx-auto lg:max-w-md">
          {/* Voucher Image */}
          <div className="mb-4">
            <div className="bg-white rounded-[20px] shadow-lg overflow-hidden border border-slate-100">
              <div className="relative h-80 bg-slate-50 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full">
                  <Image 
                    src={voucher?.ad?.picture_source || '/default-avatar.png'} 
                    alt={voucher?.ad?.title || 'Voucher'}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg=="
                    onError={() => {
                      const img = document.querySelector(`img[alt='${voucher?.ad?.title}']`);
                      if (img) img.src = '/default-avatar.png';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Voucher Info */}
          {voucher && (
            <>
              <div className="mb-4">
                <div className="bg-primary rounded-[20px] p-4 shadow-lg">
                  <div className="mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-white">Kode Voucher</span>
                        <div className="text-xs text-white opacity-80">{voucher.code}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-white opacity-80">Status</span>
                        <div className="text-xs text-white opacity-70">{voucher.ad?.status || 'active'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-[12px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-white">Tanggal Klaim</span>
                        <div className="text-xs text-white opacity-80">{voucher.claimed_at && new Date(voucher.claimed_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-white opacity-80">Kadaluarsa</span>
                        <div className="text-xs text-white opacity-70">{voucher.expired_at && new Date(voucher.expired_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Voucher Title & Description */}
              <div className="mb-4">
                <div className="bg-white rounded-[20px] p-5 shadow-lg border border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight mb-4 text-left">
                    {voucher.ad?.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed text-sm text-left mb-4">
                    {voucher.ad?.description || '-'}
                  </p>
                </div>
              </div>
              {/* Location Info */}
              <div className="mb-4">
                <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">Lokasi Promo / Iklan</h4>
                  <p className="text-slate-600 text-xs leading-relaxed mb-3">{voucher.ad?.cube?.tags?.[0]?.address || '-'}</p>
                  <button className="w-full bg-primary text-white py-2 px-6 rounded-[12px] hover:bg-opacity-90 transition-colors text-sm font-semibold flex items-center justify-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm" />
                    Rute
                  </button>
                </div>
              </div>
              {/* Seller Contact */}
              <div className="mb-4">
                <div className="bg-white rounded-[20px] p-4 shadow-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">Penjual / Pemilik Iklan</h4>
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900 text-xs">Nama: {voucher.ad?.cube?.user?.name || '-'}</p>
                    <p className="text-xs text-slate-500">No Hp/WA: {voucher.ad?.cube?.user?.phone || '-'}</p>
                    <button className="w-full bg-primary text-white p-3 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center">
                      <FontAwesomeIcon icon={faPhone} className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Bottom Button Bar */}
      {!isClaimed && (
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
                  Merebut Voucher...
                </div>
              ) : (
                'Rebut Voucher Sekarang'
              )}
            </button>
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
              Voucher berhasil direbut dan masuk ke Saku Promo Anda!
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
