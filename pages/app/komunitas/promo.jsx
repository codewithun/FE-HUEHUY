import {
    faArrowLeft,
    faCheckCircle,
    faClock,
    faCopy,
    faExclamationCircle,
    faFire,
    faGift,
    faQrcode,
    faStore,
    faWallet
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import QRCode from 'qrcode.react';
import { useEffect, useState } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import BottomSheetComponent from '../../../components/construct.components/BottomSheetComponent';

export default function KomunitasPromo() {
  const router = useRouter();
  const { tenantId, customerId } = router.query;
  const [activeFilter, setActiveFilter] = useState('semua');
  const [savedPromos, setSavedPromos] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [userQRData, setUserQRData] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [showVoucherSuccess, setShowVoucherSuccess] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState('');
  const [showAlreadyClaimedModal, setShowAlreadyClaimedModal] = useState(false);
  const [claimedVoucherData, setClaimedVoucherData] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Helper function untuk safely access localStorage
  const getLocalStorage = (key, defaultValue = '[]') => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(key) || defaultValue;
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const setLocalStorage = (key, value) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting localStorage:', error);
      }
    }
  };

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);

    // Load saved promos from localStorage
    const saved = JSON.parse(getLocalStorage('huehuy_vouchers', '[]'));
    setSavedPromos(saved);

    // Load tenant info dari localStorage
    const registration = JSON.parse(getLocalStorage('tenant_registration', '{}'));
    if (registration.tenantId) {
      setTenantInfo({
        name: registration.tenantName || getTenantName(registration.tenantId),
        id: registration.tenantId
      });
    }

    // Generate user info for QR code
    const userInfo = JSON.parse(getLocalStorage('user_info', '{}'));
    const userQRId = userInfo.userId || `USER${Date.now().toString().slice(-8)}`;
    setLocalStorage('user_info', JSON.stringify({...userInfo, userId: userQRId}));
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID').format(price);
  };

  const getTenantName = (id) => {
    const tenantNames = {
      'FOODCOURT01': 'Food Court Plaza',
      'CAFE_RESTO': 'Cafe & Restaurant',
      'RETAIL_STORE': 'Retail Store'
    };
    return tenantNames[id] || 'Merchant Partner';
  };

  const [promos, setPromos] = useState([
    {
      id: 1,
      title: 'Diskon 50% Menu Favorit',
      description: 'Nikmati diskon hingga 50% untuk semua menu favorit di food court',
      discount: '50%',
      originalPrice: 25000,
      discountPrice: 12500,
      validUntil: '2024-12-31',
      category: 'makanan',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 8,
      totalStock: 50,
      isLimited: true,
      voucherCodes: ['FOOD50A', 'FOOD50B', 'FOOD50C', 'FOOD50D', 'FOOD50E', 'FOOD50F', 'FOOD50G', 'FOOD50H']
    },
    {
      id: 2,
      title: 'Buy 1 Get 1 Coffee Special',
      description: 'Beli 1 gratis 1 untuk semua varian kopi spesial',
      discount: 'BOGO',
      originalPrice: 35000,
      discountPrice: 35000,
      validUntil: '2024-11-30',
      category: 'minuman',
      merchant: 'Food Court Plaza',
      isSaved: false, // Changed to false untuk demo
      stock: 25,
      totalStock: 100,
      isLimited: false,
      voucherCodes: Array.from({length: 25}, (_, i) => `BOGO${i + 1}`)
    },
    {
      id: 3,
      title: 'Cashback 30% Pembelian Minimal 100K',
      description: 'Dapatkan cashback 30% untuk pembelian minimal Rp 100.000',
      discount: '30%',
      originalPrice: 100000,
      discountPrice: 70000,
      validUntil: '2024-12-15',
      category: 'cashback',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 3,
      totalStock: 20,
      isLimited: true,
      voucherCodes: ['CASH30A', 'CASH30B', 'CASH30C']
    },
    {
      id: 4,
      title: 'Paket Hemat Keluarga',
      description: 'Paket makan untuk 4 orang dengan harga spesial',
      discount: '40%',
      originalPrice: 120000,
      discountPrice: 72000,
      validUntil: '2024-11-25',
      category: 'makanan',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 1,
      totalStock: 15,
      isLimited: true,
      voucherCodes: ['FAMILY40A']
    },
    // Tambahan promo yang belum direbut
    {
      id: 5,
      title: 'Diskon 25% Snack & Dessert',
      description: 'Diskon 25% untuk semua jenis snack dan dessert',
      discount: '25%',
      originalPrice: 20000,
      discountPrice: 15000,
      validUntil: '2024-12-20',
      category: 'makanan',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 15,
      totalStock: 30,
      isLimited: false,
      voucherCodes: Array.from({length: 15}, (_, i) => `SNACK25${String.fromCharCode(65 + i)}`)
    },
    {
      id: 6,
      title: 'Free Upgrade Size Minuman',
      description: 'Gratis upgrade ke size large untuk semua minuman',
      discount: 'FREE',
      originalPrice: 15000,
      discountPrice: 0,
      validUntil: '2024-12-10',
      category: 'minuman',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 20,
      totalStock: 40,
      isLimited: false,
      voucherCodes: Array.from({length: 20}, (_, i) => `UPGRADE${i + 1}`)
    },
    {
      id: 7,
      title: 'Cashback 20% Weekend Special',
      description: 'Cashback 20% khusus weekend untuk semua pembelian',
      discount: '20%',
      originalPrice: 50000,
      discountPrice: 40000,
      validUntil: '2024-11-30',
      category: 'cashback',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 12,
      totalStock: 25,
      isLimited: false,
      voucherCodes: Array.from({length: 12}, (_, i) => `WEEKEND20${String.fromCharCode(65 + i)}`)
    },
    {
      id: 8,
      title: 'Combo Hemat Makan Siang',
      description: 'Paket combo hemat makan siang dengan minuman gratis',
      discount: '35%',
      originalPrice: 40000,
      discountPrice: 26000,
      validUntil: '2024-12-05',
      category: 'makanan',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 2,
      totalStock: 10,
      isLimited: true,
      voucherCodes: ['LUNCH35A', 'LUNCH35B']
    },
    {
      id: 9,
      title: 'Happy Hour 50% Off Beverages',
      description: 'Diskon 50% untuk semua minuman di jam 14:00-16:00',
      discount: '50%',
      originalPrice: 25000,
      discountPrice: 12500,
      validUntil: '2024-11-28',
      category: 'minuman',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 8,
      totalStock: 20,
      isLimited: true,
      voucherCodes: ['HAPPY50A', 'HAPPY50B', 'HAPPY50C', 'HAPPY50D', 'HAPPY50E', 'HAPPY50F', 'HAPPY50G', 'HAPPY50H']
    },
    {
      id: 10,
      title: 'Mega Cashback 40% Minimum 150K',
      description: 'Cashback fantastis 40% untuk pembelian minimal Rp 150.000',
      discount: '40%',
      originalPrice: 150000,
      discountPrice: 90000,
      validUntil: '2024-12-31',
      category: 'cashback',
      merchant: 'Food Court Plaza',
      isSaved: false,
      stock: 5,
      totalStock: 8,
      isLimited: true,
      voucherCodes: ['MEGA40A', 'MEGA40B', 'MEGA40C', 'MEGA40D', 'MEGA40E']
    }
  ]);

  // Fungsi untuk check apakah promo sudah diambil
  const checkIfPromoAlreadyClaimed = (promoId) => {
    if (!isClient) return null;
    
    const savedVouchers = JSON.parse(getLocalStorage('huehuy_vouchers', '[]'));
    return savedVouchers.find(voucher => {
      // Check berdasarkan promo title atau ID
      return voucher.ad?.title === promos.find(p => p.id === promoId)?.title;
    });
  };

  // Update status isSaved berdasarkan localStorage
  useEffect(() => {
    if (isClient) {
      setPromos(prevPromos => 
        prevPromos.map(promo => ({
          ...promo,
          isSaved: !!checkIfPromoAlreadyClaimed(promo.id)
        }))
      );
    }
  }, [isClient, savedPromos]);

  const handleClaimPromo = (promoId) => {
    if (!isClient) return;
    
    const promo = promos.find(p => p.id === promoId);
    
    if (!promo) return;

    // Check jika stock habis
    if (promo.stock === 0) {
      alert('Maaf, promo sudah habis!');
      return;
    }

    // Check jika promo sudah diambil sebelumnya
    const existingVoucher = checkIfPromoAlreadyClaimed(promoId);
    if (existingVoucher) {
      setClaimedVoucherData(existingVoucher);
      setShowAlreadyClaimedModal(true);
      return;
    }

    // Jika belum diambil, lanjut proses claim
    if (promo.stock > 0) {
      const userInfo = JSON.parse(getLocalStorage('user_info', '{}'));
      const userQRId = userInfo.userId || `USER${Date.now().toString().slice(-8)}`;
      const transactionId = `TXN${Date.now()}${promoId}`.slice(-12);
      
      const qrData = {
        userId: userQRId,
        promoId: promo.id,
        transactionId: transactionId,
        qrValue: JSON.stringify({
          type: 'promo_claim',
          userId: userQRId,
          promoId: promo.id,
          transactionId: transactionId,
          merchant: promo.merchant,
          discount: promo.discount,
          timestamp: Date.now()
        })
      };

      setSelectedPromo(promo);
      setUserQRData(qrData);
      setShowVoucherModal(true);
      setShowVoucherSuccess(false);
      setManualCode('');
      setManualError('');
    }
  };

  const handleManualCodeSubmit = async () => {
    if (!manualCode.trim()) {
      setManualError('Masukkan kode voucher');
      return;
    }

    setIsSubmittingManual(true);
    setManualError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const promo = selectedPromo;
      const isValidCode = promo.voucherCodes.includes(manualCode.toUpperCase());
      const usedVouchers = JSON.parse(getLocalStorage('used_voucher_codes', '[]'));
      const isCodeUsed = usedVouchers.includes(manualCode.toUpperCase());

      if (!isValidCode) {
        setManualError('Kode voucher tidak valid');
        setIsSubmittingManual(false);
        return;
      }

      if (isCodeUsed) {
        setManualError('Kode voucher sudah digunakan');
        setIsSubmittingManual(false);
        return;
      }

      handleTenantValidation(manualCode.toUpperCase());
      
    } catch (error) {
      setManualError('Terjadi kesalahan, coba lagi');
      setIsSubmittingManual(false);
    }
  };

  const handleTenantValidation = (providedVoucherCode) => {
    if (!isClient) return;
    
    const promo = selectedPromo;
    
    // Update stock
    setPromos(prevPromos => 
      prevPromos.map(p => 
        p.id === promo.id 
          ? { 
              ...p, 
              stock: p.stock - 1, 
              isSaved: true,
              voucherCodes: p.voucherCodes.filter(code => code !== providedVoucherCode)
            }
          : p
      )
    );

    // Mark kode sebagai sudah digunakan
    const usedVouchers = JSON.parse(getLocalStorage('used_voucher_codes', '[]'));
    usedVouchers.push(providedVoucherCode);
    setLocalStorage('used_voucher_codes', JSON.stringify(usedVouchers));

    // Generate voucher QR data
    const voucherQRData = JSON.stringify({
      type: 'voucher',
      code: providedVoucherCode,
      promoId: promo.id,
      merchant: promo.merchant,
      discount: promo.discount,
      timestamp: Date.now()
    });

    // Simpan voucher ke localStorage
    const savedVouchers = JSON.parse(getLocalStorage('huehuy_vouchers', '[]'));
    const newVoucher = {
      id: `voucher_${Date.now()}`,
      code: providedVoucherCode,
      qrData: voucherQRData,
      ad: {
        title: promo.title,
        picture_source: '/images/default-promo.jpg',
        status: 'active',
        cube: {
          code: `CUBE${promo.id}`,
          address: promo.merchant,
          user: {
            name: promo.merchant,
            phone: '081234567890'
          }
        }
      },
      voucher_item: {
        code: providedVoucherCode
      },
      expired_at: promo.validUntil,
      validation_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    savedVouchers.push(newVoucher);
    setLocalStorage('huehuy_vouchers', JSON.stringify(savedVouchers));
    setSavedPromos(savedVouchers);

    // Update state untuk show success
    setVoucherCode(providedVoucherCode);
    setUserQRData({
      ...userQRData,
      voucherCode: providedVoucherCode,
      voucherQRData: voucherQRData
    });
    setIsSubmittingManual(false);
    setShowVoucherSuccess(true);
  };

  const copyToClipboard = (text) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Berhasil disalin!');
      });
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

  const getStockStatus = (stock, totalStock) => {
    const percentage = (stock / totalStock) * 100;
    if (percentage <= 10) return { color: 'bg-red-500', text: 'Hampir Habis!', urgent: true };
    if (percentage <= 30) return { color: 'bg-orange-500', text: 'Terbatas', urgent: true };
    return { color: 'bg-green-500', text: 'Tersedia', urgent: false };
  };

  // Show loading state until client-side hydration
  if (!isClient) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/app">
              <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Promo Eksklusif</h1>
              <p className="text-sm opacity-90">Loading...</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 min-h-screen pb-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
        <BottomBarComponent active={'home'} />
      </div>
    );
  }

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        {/* Header */}
        <div className="bg-primary text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/app">
              <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Promo Eksklusif</h1>
              <p className="text-sm opacity-90">{tenantInfo?.name || 'Merchant Partner'}</p>
            </div>
            <Link href="/app/saku">
              <div className="bg-white/20 p-2 rounded-lg">
                <FontAwesomeIcon icon={faWallet} className="text-xl" />
              </div>
            </Link>
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

        {/* Promo Counter */}
        <div className="bg-white px-4 py-2 border-b">
          <p className="text-sm text-gray-600">
            {filteredPromos.length} promo tersedia • {filteredPromos.filter(p => p.isSaved).length} sudah diambil
          </p>
        </div>

        {/* Promo List */}
        <div className="bg-slate-50 min-h-screen pb-32">
          <div className="px-4 py-4 space-y-3">
            {filteredPromos.map((promo) => {
              const stockStatus = getStockStatus(promo.stock, promo.totalStock);
              const stockPercentage = (promo.stock / promo.totalStock) * 100;
              const isAlreadyClaimed = checkIfPromoAlreadyClaimed(promo.id);
              
              return (
                <div key={promo.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 relative">
                  {/* Urgent Badge */}
                  {stockStatus.urgent && !isAlreadyClaimed && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className={`${stockStatus.color} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
                        <FontAwesomeIcon icon={faFire} className="text-xs" />
                        {stockStatus.text}
                      </div>
                    </div>
                  )}

                  {/* Already Claimed Badge */}
                  {isAlreadyClaimed && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                        Sudah Diambil
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-primary text-white px-2 py-1 rounded text-sm font-bold">
                            {promo.discount}
                          </div>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FontAwesomeIcon icon={faStore} />
                            {promo.merchant}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {promo.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
                      </div>
                    </div>

                    {/* Price & Time */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {promo.discount === 'FREE' ? (
                          <span className="text-lg font-bold text-green-600">GRATIS</span>
                        ) : (
                          <>
                            <span className="text-xs text-gray-500 line-through">Rp {formatPrice(promo.originalPrice)}</span>
                            <span className="text-lg font-bold text-green-600">
                              {promo.discountPrice === 0 ? 'GRATIS' : `Rp ${formatPrice(promo.discountPrice)}`}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FontAwesomeIcon icon={faClock} />
                        <span>{getTimeRemaining(promo.validUntil)}</span>
                      </div>
                    </div>

                    {/* Stock Info */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">
                          Sisa <span className="font-bold text-primary">{promo.stock}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(stockPercentage)}% tersisa
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            stockPercentage <= 10 ? 'bg-red-500' :
                            stockPercentage <= 30 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${stockPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleClaimPromo(promo.id)}
                      disabled={promo.stock === 0}
                      className={`w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        promo.stock === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isAlreadyClaimed
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : promo.isSaved
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : stockStatus.urgent
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      <FontAwesomeIcon icon={faGift} />
                      {promo.stock === 0 ? 'Promo Habis' : 
                       isAlreadyClaimed ? 'Lihat Voucher' :
                       promo.isSaved ? 'Sudah Diambil' : 
                       stockStatus.urgent ? 'Rebut Sekarang!' : 'Rebut Promo'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <BottomBarComponent active={'home'} />
      </div>

      {/* Already Claimed Modal */}
      <BottomSheetComponent
        title="Promo Sudah Diambil"
        show={showAlreadyClaimedModal}
        onClose={() => {
          setShowAlreadyClaimedModal(false);
          setClaimedVoucherData(null);
        }}
        height={450}
      >
        <div className="p-4 space-y-4">
          {/* Info Message */}
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-blue-500 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Voucher Sudah Ada!
            </h3>
            <p className="text-sm text-gray-600">
              Anda sudah memiliki voucher untuk promo ini di saku Anda
            </p>
          </div>

          {/* Voucher Info */}
          {claimedVoucherData && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-center mb-3">
                <span className="text-blue-800 text-sm font-medium">Kode Voucher Anda</span>
              </div>
              
              <div className="bg-white rounded-lg p-4 mb-3">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-2 tracking-wider">
                    {claimedVoucherData.code || claimedVoucherData.voucher_item?.code}
                  </h4>
                  <button
                    onClick={() => copyToClipboard(claimedVoucherData.code || claimedVoucherData.voucher_item?.code)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    <FontAwesomeIcon icon={faCopy} className="mr-1" />
                    Salin Kode
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-center">
                  <QRCode
                    value={claimedVoucherData.qrData || JSON.stringify({ 
                      code: claimedVoucherData.code || claimedVoucherData.voucher_item?.code, 
                      type: 'voucher' 
                    })}
                    size={120}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Link href="/app/saku">
              <button
                className="w-full bg-primary text-white font-medium py-3 rounded-lg"
                onClick={() => setShowAlreadyClaimedModal(false)}
              >
                <FontAwesomeIcon icon={faWallet} className="mr-2" />
                Buka Saku Promo
              </button>
            </Link>
            
            <button
              onClick={() => setShowAlreadyClaimedModal(false)}
              className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      </BottomSheetComponent>

      {/* Voucher Modal - Simplified */}
      <BottomSheetComponent
        title={showVoucherSuccess ? "Voucher Berhasil!" : "Rebut Promo"}
        show={showVoucherModal}
        onClose={() => {
          setShowVoucherModal(false);
          setSelectedPromo(null);
          setUserQRData(null);
          setShowVoucherSuccess(false);
          setManualCode('');
          setManualError('');
        }}
        height={showVoucherSuccess ? 500 : 550}
      >
        <div className="p-4 space-y-4">
          {!showVoucherSuccess ? (
            <>
              {/* Promo Info */}
              <div className="text-center py-3">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {selectedPromo?.title}
                </h3>
                <p className="text-sm text-gray-600">
                  Tunjukkan QR code atau masukkan kode voucher
                </p>
              </div>

              {/* QR Code Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-center mb-3">
                  <span className="text-primary text-sm font-medium flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faQrcode} />
                    QR Code Customer
                  </span>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-center">
                    <QRCode
                      value={userQRData?.qrValue || JSON.stringify({ userId: 'USER123456', type: 'promo_claim' })}
                      size={160}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-xs text-gray-500">ATAU</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Manual Input */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value.toUpperCase());
                    setManualError('');
                  }}
                  placeholder="Masukkan kode voucher"
                  className={`w-full px-4 py-3 border rounded-lg text-center font-mono text-lg tracking-wider ${
                    manualError 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                  }`}
                  maxLength={10}
                  disabled={isSubmittingManual}
                />
                {manualError && (
                  <p className="text-red-500 text-sm text-center">{manualError}</p>
                )}

                <button
                  onClick={handleManualCodeSubmit}
                  disabled={!manualCode.trim() || isSubmittingManual}
                  className="w-full bg-primary text-white font-medium py-3 rounded-lg disabled:opacity-50"
                >
                  {isSubmittingManual ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Memverifikasi...
                    </div>
                  ) : (
                    'Submit Kode'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Voucher Berhasil!
                </h3>
                <p className="text-sm text-gray-600">
                  Voucher telah disimpan ke saku Anda
                </p>
              </div>

              {/* Voucher Code */}
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-center mb-3">
                  <span className="text-green-800 text-sm font-medium">Kode Voucher</span>
                </div>
                
                <div className="bg-white rounded-lg p-4 mb-3">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2 tracking-wider">
                      {voucherCode}
                    </h4>
                    <button
                      onClick={() => copyToClipboard(voucherCode)}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      <FontAwesomeIcon icon={faCopy} className="mr-1" />
                      Salin Kode
                    </button>
                  </div>
                </div>

                {/* QR Code Voucher */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-center">
                    <QRCode
                      value={userQRData?.voucherQRData || JSON.stringify({ code: voucherCode, type: 'voucher' })}
                      size={140}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Link href="/app/saku">
                  <button
                    className="w-full bg-primary text-white font-medium py-3 rounded-lg"
                    onClick={() => setShowVoucherModal(false)}
                  >
                    <FontAwesomeIcon icon={faWallet} className="mr-2" />
                    Lihat di Saku Promo
                  </button>
                </Link>
                
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </>
          )}
        </div>
      </BottomSheetComponent>
    </>
  );
}