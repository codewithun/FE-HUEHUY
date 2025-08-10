import { faGift, faPercent, faSearch, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CommunityBottomBar from './dashboard/CommunityBottomBar';

const CommunityPromoPage = () => {
  const router = useRouter();
  const { communityId } = router.query;
  const [communityData, setCommunityData] = useState(null);
  const [promoData, setPromoData] = useState([]);
  const [limitedDeals, setLimitedDeals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (communityId) {
      // Mock data untuk komunitas
      setCommunityData({
        id: communityId,
        name: 'dbotanica Bandung',
        location: 'Bandung'
      });

      // Mock data untuk promo terdekat
      setPromoData([
        {
          id: 1,
          title: 'Paket Kenyang Cuma 40 Ribu - Beef Sausage & Chicken di Lalaunch!',
          merchant: 'Bandung Trade Center (BTC) Dr. Djunjunan...',
          distance: '320 KM',
          location: 'dbotanica Bandung',
          image: '/default-avatar.png',
          originalPrice: 80000,
          discountPrice: 40000,
          discount: '50%'
        },
        {
          id: 2,
          title: 'Beli 1 Gratis 1! Brown Sugar Coffee di Boba Thai',
          merchant: 'Bandung Trade Center (BTC) Dr. Djunjunan...',
          distance: '320 KM',
          location: 'dbotanica Bandung',
          image: '/default-avatar.png',
          originalPrice: 25000,
          discountPrice: 12500,
          discount: 'BELI 1 GRATIS 1'
        },
        {
          id: 3,
          title: 'Makan Bertiga Lebih Hemat - Paket Ayam di Chicken Star Cuma 59 Ribu!',
          merchant: 'Bandung Trade Center (BTC) Dr. Djunjunan...',
          distance: '320 KM',
          location: 'dbotanica Bandung',
          image: '/default-avatar.png',
          originalPrice: 89000,
          discountPrice: 59000,
          discount: '34%'
        },
        {
          id: 4,
          title: 'Diskon 50% Bubble Tea untuk 15 Pelanggan Pertama!',
          merchant: 'Bandung Trade Center (BTC) Dr. Djunjunan...',
          distance: '320 KM',
          location: 'dbotanica Bandung',
          image: '/default-avatar.png',
          originalPrice: 30000,
          discountPrice: 15000,
          discount: '50% DISKON'
        }
      ]);

      // Mock data untuk limited deals
      setLimitedDeals([
        {
          id: 1,
          title: 'Flash Sale - Burger Combo',
          merchant: 'McDonald\'s BTC',
          originalPrice: 45000,
          discountPrice: 25000,
          discount: '44%',
          timeLeft: '2 jam 30 menit',
          image: '/default-avatar.png'
        },
        {
          id: 2,
          title: 'Limited Time - Pizza Medium',
          merchant: 'Pizza Hut BTC',
          originalPrice: 75000,
          discountPrice: 50000,
          discount: '33%',
          timeLeft: '1 jam 15 menit',
          image: '/default-avatar.png'
        }
      ]);
    }
  }, [communityId]);

  const PromoCard = ({ promo }) => (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-neuro overflow-hidden mb-3 hover:scale-[1.01] transition-all duration-300">
      <div className="flex p-3">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0 mr-3 overflow-hidden shadow-neuro-in">
          <img 
            src={promo.image} 
            alt={promo.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
            {promo.title}
          </h3>
          
          <p className="text-xs text-gray-600 mb-2">{promo.merchant}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-base font-bold text-gray-900">
                Rp {promo.discountPrice?.toLocaleString('id-ID')}
              </span>
              {promo.originalPrice && (
                <span className="text-xs text-gray-500 line-through">
                  Rp {promo.originalPrice.toLocaleString('id-ID')}
                </span>
              )}
            </div>
            <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
              {promo.discount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const LimitedDealCard = ({ deal }) => (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-sm rounded-2xl shadow-neuro overflow-hidden hover:scale-[1.01] transition-all duration-300 border border-orange-200 border-opacity-30">
      <div className="flex p-3">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex-shrink-0 mr-3 overflow-hidden shadow-neuro-in">
          <img 
            src={deal.image} 
            alt={deal.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1 mb-1">
            {deal.title}
          </h4>
          
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-bold text-gray-900">
                Rp {deal.discountPrice?.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-gray-500 line-through">
                Rp {deal.originalPrice?.toLocaleString('id-ID')}
              </span>
            </div>
            <span className="bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
              {deal.discount}
            </span>
          </div>
          
          <p className="text-xs text-orange-600 font-medium">
            {deal.timeLeft}
          </p>
        </div>
      </div>
    </div>
  );

  if (!communityData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen flex items-center justify-center px-2 py-2">
        <div className="text-center bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl shadow-neuro p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data komunitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
      {/* Header */}
      <div className="bg-primary w-full h-[120px] rounded-b-[40px] shadow-neuro px-6 mb-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full opacity-10"></div>
          <div className="absolute bottom-6 left-6 w-8 h-8 bg-white rounded-full opacity-10"></div>
          <div className="absolute top-8 left-1/3 w-6 h-6 bg-white rounded-full opacity-10"></div>
        </div>
        
        <div className="flex items-center justify-center h-full relative z-10">
          {/* Search Bar */}
          <div className="w-full bg-white border border__primary px-6 py-4 rounded-[25px] flex items-center shadow-neuro-in backdrop-blur-sm">
            <FontAwesomeIcon icon={faSearch} className="text__primary mr-3 text-lg" />
            <input
              type="text"
              placeholder="Cari promo makanan, minuman, atau merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-gray-700 placeholder-gray-500 bg-transparent outline-none font-medium"
            />
            <FontAwesomeIcon icon={faTag} className="text-primary ml-2 opacity-50" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20 px-4 pt-6 pb-24">
        <div className="lg:mx-auto lg:max-w-md">
          {/* Promo Terdekat Section */}
          <div className="mb-6">
            <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-xl p-3 shadow-neuro mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Promo Terdekat</h2>
                  <p className="text-xs text-gray-600">Rekomendasi terbaik</p>
                </div>
                <div className="bg-primary bg-opacity-20 p-2 rounded-xl">
                  <FontAwesomeIcon icon={faTag} className="text-primary text-lg" />
                </div>
              </div>
            </div>

            {/* Promo Cards */}
            {promoData.length > 0 ? (
              promoData
                .filter(promo => 
                  searchQuery === '' || 
                  promo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  promo.merchant.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((promo) => (
                  <PromoCard key={promo.id} promo={promo} />
                ))
            ) : (
              <div className="text-center py-8 bg-white bg-opacity-50 backdrop-blur-sm rounded-2xl shadow-neuro">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-neuro-in">
                  <FontAwesomeIcon icon={faGift} className="text-gray-400 text-lg" />
                </div>
                <p className="text-gray-600 font-medium text-sm">Belum ada promo tersedia</p>
              </div>
            )}
          </div>

          {/* Limited Deals Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-sm rounded-xl p-3 shadow-neuro mb-3 border border-orange-200 border-opacity-30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Limited Deals</h2>
                  <p className="text-xs text-orange-600 font-medium">Penawaran terbatas</p>
                </div>
                <div className="bg-gradient-to-r from-orange-400 to-red-400 p-2 rounded-xl shadow-sm">
                  <FontAwesomeIcon icon={faPercent} className="text-white text-lg" />
                </div>
              </div>
            </div>
            
            {limitedDeals.length > 0 ? (
              <div className="space-y-3">
                {limitedDeals
                  .filter(deal => 
                    searchQuery === '' || 
                    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    deal.merchant.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((deal) => (
                    <LimitedDealCard key={deal.id} deal={deal} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-sm rounded-2xl shadow-neuro">
                <div className="bg-gradient-to-r from-orange-100 to-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-neuro-in">
                  <FontAwesomeIcon icon={faPercent} className="text-orange-500 text-lg" />
                </div>
                <p className="text-gray-600 font-medium text-sm">Belum ada limited deals</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <CommunityBottomBar active="promo" communityId={communityId} />
    </div>
  );
};

export default CommunityPromoPage;
