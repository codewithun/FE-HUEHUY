import {
    faArrowLeft,
    faClock,
    faFire,
    faGift,
    faHeart,
    faMapMarkerAlt,
    faShare,
    faStar,
    faStore,
    faUsers,
    faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';

export default function KomunitasPromo() {
  const router = useRouter();
  const { newMember, tenantId, customerId } = router.query;
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeFilter, setActiveFilter] = useState('semua');
  const [savedPromos, setSavedPromos] = useState([]);

  useEffect(() => {
    if (newMember === 'true') {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 3000);
    }

    // Load saved promos from localStorage
    const saved = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
    setSavedPromos(saved);
  }, [newMember]);

  // Demo data promo komunitas
  const [promos] = useState([
    {
      id: 1,
      title: 'Diskon 50% Menu Favorit',
      description: 'Nikmati diskon hingga 50% untuk semua menu favorit di food court',
      image: '/images/promo1.jpg',
      discount: '50%',
      originalPrice: 25000,
      discountPrice: 12500,
      validUntil: '2024-12-31',
      category: 'makanan',
      isExclusive: true,
      isLimited: true,
      stock: 25,
      totalStock: 50,
      likes: 89,
      merchant: 'Food Court Plaza',
      location: 'Mall Central Jakarta',
      tags: ['Best Seller', 'Limited Time'],
      isSaved: false
    },
    {
      id: 2,
      title: 'Buy 1 Get 1 Coffee Special',
      description: 'Beli 1 gratis 1 untuk semua varian kopi spesial',
      image: '/images/promo2.jpg',
      discount: 'BOGO',
      originalPrice: 35000,
      discountPrice: 35000,
      validUntil: '2024-11-30',
      category: 'minuman',
      isExclusive: false,
      isLimited: false,
      stock: null,
      totalStock: null,
      likes: 156,
      merchant: 'Cafe Corner',
      location: 'Plaza Indonesia',
      tags: ['Popular', 'Weekend Only'],
      isSaved: true
    },
    {
      id: 3,
      title: 'Cashback 30% Pembelian Minimal 100K',
      description: 'Dapatkan cashback 30% untuk pembelian minimal Rp 100.000',
      image: '/images/promo3.jpg',
      discount: '30%',
      originalPrice: 100000,
      discountPrice: 70000,
      validUntil: '2024-12-15',
      category: 'cashback',
      isExclusive: true,
      isLimited: false,
      stock: null,
      totalStock: null,
      likes: 234,
      merchant: 'Department Store',
      location: 'Grand Indonesia',
      tags: ['Cashback', 'High Value'],
      isSaved: false
    },
    {
      id: 4,
      title: 'Paket Hemat Keluarga',
      description: 'Paket makan untuk 4 orang dengan harga spesial',
      image: '/images/promo4.jpg',
      discount: '40%',
      originalPrice: 120000,
      discountPrice: 72000,
      validUntil: '2024-11-25',
      category: 'makanan',
      isExclusive: false,
      isLimited: true,
      stock: 8,
      totalStock: 20,
      likes: 67,
      merchant: 'Family Restaurant',
      location: 'Senayan City',
      tags: ['Family Pack', 'Best Deal'],
      isSaved: false
    }
  ]);

  const handleSavePromo = (promoId) => {
    const promo = promos.find(p => p.id === promoId);
    if (promo) {
      // Simulasi menyimpan ke saku promo
      const savedVouchers = JSON.parse(localStorage.getItem('huehuy_vouchers') || '[]');
      const newVoucher = {
        id: `voucher_${Date.now()}`,
        code: `PROMO${promoId}${Date.now()}`,
        ad: {
          title: promo.title,
          picture_source: promo.image,
          status: 'active',
          cube: {
            code: `CUBE${promoId}`,
            address: promo.location,
            user: {
              name: promo.merchant,
              phone: '081234567890'
            }
          }
        },
        voucher_item: {
          code: `VOUCHER${promoId}${Date.now()}`
        },
        expired_at: promo.validUntil,
        validation_at: null,
        created_at: new Date().toISOString()
      };

      savedVouchers.push(newVoucher);
      localStorage.setItem('huehuy_vouchers', JSON.stringify(savedVouchers));
      setSavedPromos(savedVouchers);
      alert('Promo berhasil disimpan ke saku!');
    }
  };

  const filteredPromos = promos.filter(promo => {
    if (activeFilter === 'semua') return true;
    return promo.category === activeFilter;
  });

  const getTimeRemaining = (validUntil) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diff = expiry - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} hari lagi` : 'Segera berakhir';
  };

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faUsers} className="text-primary text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Selamat Bergabung!</h3>
            <p className="text-gray-600 mb-4">
              Anda telah bergabung dengan komunitas merchant. Nikmati promo eksklusif!
            </p>
            <button
              onClick={() => setShowWelcome(false)}
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium"
            >
              Mulai Jelajahi Promo
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-primary text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/app/komunitas/komunitas">
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Promo Komunitas</h1>
            <p className="text-sm opacity-90">Dapatkan promo eksklusif member</p>
          </div>
          <Link href="/app/saku">
            <div className="bg-white/20 p-2 rounded-lg">
              <FontAwesomeIcon icon={faWallet} className="text-xl" />
            </div>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-primary">{promos.length}</p>
            <p className="text-xs text-gray-600">Promo Aktif</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">{savedPromos.length}</p>
            <p className="text-xs text-gray-600">Tersimpan</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-600">{promos.filter(p => p.isLimited).length}</p>
            <p className="text-xs text-gray-600">Terbatas</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-600">{promos.filter(p => p.isExclusive).length}</p>
            <p className="text-xs text-gray-600">Eksklusif</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'semua', label: 'Semua' },
            { key: 'makanan', label: 'Makanan' },
            { key: 'minuman', label: 'Minuman' },
            { key: 'cashback', label: 'Cashback' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeFilter === filter.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Promo List */}
      <div className="bg-slate-50 min-h-screen pb-32">
        <div className="px-4 py-4 space-y-4">
          {filteredPromos.map((promo) => (
            <div key={promo.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Promo Image */}
              <div className="relative h-48 bg-gradient-to-r from-primary/20 to-blue-500/20">
                <div className="absolute top-3 left-3 flex gap-2">
                  {promo.isExclusive && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <FontAwesomeIcon icon={faStar} className="text-xs" />
                      Eksklusif
                    </span>
                  )}
                  {promo.isLimited && (
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <FontAwesomeIcon icon={faFire} className="text-xs" />
                      Terbatas
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleSavePromo(promo.id)}
                    className={`p-2 rounded-full ${promo.isSaved ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600'}`}
                  >
                    <FontAwesomeIcon icon={faHeart} className="text-sm" />
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">{promo.discount}</span>
                        <span className="text-sm text-gray-600 ml-2">OFF</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 line-through">Rp {promo.originalPrice.toLocaleString()}</p>
                        <p className="text-lg font-bold text-green-600">Rp {promo.discountPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-base leading-tight flex-1">{promo.title}</h3>
                  <button className="ml-2 p-1 text-gray-400 hover:text-primary">
                    <FontAwesomeIcon icon={faShare} className="text-sm" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{promo.description}</p>

                {/* Merchant Info */}
                <div className="flex items-center gap-2 mb-3">
                  <FontAwesomeIcon icon={faStore} className="text-primary text-sm" />
                  <span className="text-sm font-medium text-gray-700">{promo.merchant}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 text-xs" />
                  <span className="text-xs text-gray-500">{promo.location}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {promo.tags.map((tag, index) => (
                    <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stock Progress */}
                {promo.isLimited && promo.stock !== null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Sisa: {promo.stock}</span>
                      <span>Total: {promo.totalStock}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${(promo.stock / promo.totalStock) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faHeart} />
                      <span>{promo.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} />
                      <span>{getTimeRemaining(promo.validUntil)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSavePromo(promo.id)}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <FontAwesomeIcon icon={faGift} />
                    Ambil Promo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomBarComponent active={'community'} />
    </div>
  );
}