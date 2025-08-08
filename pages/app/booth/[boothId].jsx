import {
    faArrowLeft,
    faCalendarAlt,
    faCheckCircle,
    faClock,
    faGift,
    faMapMarkerAlt,
    faPhone,
    faQrcode,
    faStar,
    faTicket,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import QrScannerComponent from '../../../components/construct.components/QrScannerComponent';

export default function EventBoothPromo() {
  const router = useRouter();
  const { boothId, registered } = router.query;
  
  const [boothData, setBoothData] = useState(null);
  const [activeMethod, setActiveMethod] = useState('code');
  const [promoCode, setPromoCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [voucherClaimed, setVoucherClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [joinedCommunity, setJoinedCommunity] = useState(false);

  useEffect(() => {
    if (boothId) {
      loadBoothData(boothId);
    }
    
    // Silent auto join komunitas tanpa notification
    if (registered === 'true') {
      autoJoinCommunity();
    }
  }, [boothId, registered]);

  useEffect(() => {
    if (activeMethod === 'scan') {
      setIsScanning(true);
    } else {
      setIsScanning(false);
    }
  }, [activeMethod]);

  const loadBoothData = (id) => {
    const boothDatabase = {
      'BOOTH01': {
        name: 'Tech Innovation Expo',
        category: 'Technology & Innovation',
        description: 'Pameran teknologi terdepan dengan produk-produk inovatif terbaru dan demo interaktif',
        address: 'Jakarta Convention Center, Hall A, Jakarta Pusat',
        phone: '(021) 5678-9012',
        hours: '09:00 - 18:00 WIB',
        eventDate: '15-17 Desember 2024',
        rating: 4.9,
        totalReviews: 2156,
        promo: {
          title: 'Early Bird 30% + Bonus Merchandise',
          description: 'Dapatkan tiket masuk dengan diskon 30% plus merchandise eksklusif berupa tas branded dan powerbank portable',
          validUntil: '10 Desember 2024',
          discount: '30%',
          minPurchase: 'Rp 100.000',
          terms: [
            'Berlaku untuk pembelian tiket online',
            'Merchandise akan diberikan saat check-in',
            'Tidak dapat digabung dengan promo lain',
            'Satu voucher per customer',
            'Berlaku untuk semua kategori tiket'
          ]
        },
        validCodes: ['TECH30', 'INNOVATION30', 'EXPO30'],
        community: {
          name: 'Tech Enthusiast Community',
          members: 5247,
          description: 'Komunitas pecinta teknologi dan inovasi'
        },
        features: [
          'Demo Produk Interaktif',
          'Workshop Gratis',
          'Networking Session',
          'Free WiFi & Charging Station'
        ]
      },
      'BOOTH02': {
        name: 'Fashion Week Jakarta',
        category: 'Fashion & Lifestyle',
        description: 'Event fashion terbesar dengan koleksi designer lokal dan internasional plus fashion show eksklusif',
        address: 'Senayan City, Exhibition Hall, Jakarta Selatan',
        phone: '(021) 7890-1234',
        hours: '10:00 - 21:00 WIB',
        eventDate: '20-22 Desember 2024',
        rating: 4.7,
        totalReviews: 1876,
        promo: {
          title: 'VIP Access 25% + Meet & Greet',
          description: 'Akses VIP dengan diskon 25% termasuk meet & greet dengan designer terkenal dan goodie bag eksklusif',
          validUntil: '18 Desember 2024',
          discount: '25%',
          minPurchase: 'Rp 150.000',
          terms: [
            'Berlaku untuk tiket VIP dan Premium',
            'Meet & greet terbatas 50 orang per hari',
            'Goodie bag senilai Rp 500.000',
            'Prioritas akses fashion show',
            'Complimentary refreshment'
          ]
        },
        validCodes: ['FASHION25', 'VIP25', 'DESIGNER25'],
        community: {
          name: 'Jakarta Fashion Community',
          members: 3891,
          description: 'Komunitas fashion enthusiast Jakarta'
        },
        features: [
          'Fashion Show Eksklusif',
          'Designer Collections',
          'Photo Booth Professional',
          'Personal Styling Service'
        ]
      },
      'BOOTH03': {
        name: 'Food Festival Nusantara',
        category: 'Culinary & Food',
        description: 'Festival kuliner terbesar dengan 100+ stand makanan khas nusantara dan kompetisi chef',
        address: 'Taman Mini Indonesia Indah, Jakarta Timur',
        phone: '(021) 9876-5432',
        hours: '08:00 - 22:00 WIB',
        eventDate: '25-27 Desember 2024',
        rating: 4.8,
        totalReviews: 3241,
        promo: {
          title: 'All You Can Eat 20% + Cooking Class',
          description: 'Paket hemat tiket masuk diskon 20% plus voucher cooking class dengan chef profesional',
          validUntil: '23 Desember 2024',
          discount: '20%',
          minPurchase: 'Rp 75.000',
          terms: [
            'Berlaku untuk weekend pass',
            'Cooking class maksimal 30 peserta',
            'Termasuk bahan masak dan peralatan',
            'Sertifikat participation',
            'Recipe book gratis'
          ]
        },
        validCodes: ['FOOD20', 'NUSANTARA20', 'CHEF20'],
        community: {
          name: 'Foodie Nusantara Community',
          members: 4567,
          description: 'Komunitas pecinta kuliner tradisional'
        },
        features: [
          '100+ Stand Makanan',
          'Live Cooking Demo',
          'Traditional Music',
          'Kids Playground'
        ]
      }
    };

    const booth = boothDatabase[id] || {
      name: 'Event Partner Booth',
      category: 'Event & Exhibition',
      description: 'Booth event partner dengan berbagai aktivitas menarik dan penawaran eksklusif',
      address: 'Jakarta, Indonesia',
      phone: '(021) 1234-5678',
      hours: '09:00 - 18:00 WIB',
      eventDate: '31 Desember 2024',
      rating: 4.5,
      totalReviews: 500,
      promo: {
        title: 'Special Event Promo',
        description: 'Dapatkan penawaran menarik khusus untuk pengunjung event',
        validUntil: '31 Desember 2024',
        discount: '15%',
        minPurchase: 'Rp 50.000',
        terms: [
          'Berlaku sesuai syarat dan ketentuan',
          'Tidak dapat digabung dengan promo lain',
          'Satu voucher per customer'
        ]
      },
      validCodes: ['EVENT15', 'BOOTH15', 'SPECIAL15'],
      community: {
        name: `Event Community ${id}`,
        members: 500,
        description: 'Komunitas pengunjung event eksklusif'
      },
      features: [
        'Interactive Activities',
        'Product Showcase',
        'Professional Service',
        'Networking Opportunities'
      ]
    };

    setBoothData(booth);
  };

  const autoJoinCommunity = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setJoinedCommunity(true);
    } catch (error) {
      // Error handling for auto join community (logging removed)
    }
  };

  const handleClaimVoucher = async () => {
    if (!promoCode.trim()) return;
    
    setLoading(true);
    try {
      const isValidCode = boothData.validCodes.some(
        code => code.toLowerCase() === promoCode.toLowerCase()
      );
      
      if (!isValidCode) {
        alert('Kode promo tidak valid. Silakan periksa kembali kode yang Anda masukkan.');
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      setVoucherClaimed(true);
      
      setTimeout(() => {
        router.push('/app/saku?newVoucher=true&booth=' + encodeURIComponent(boothData.name));
      }, 3000);
      
    } catch (error) {
      alert('Terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat.');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (result) => {
    if (!result) return;
    
    setLoading(true);
    try {
      const isValidQR = boothData.validCodes.some(
        code => result.toLowerCase().includes(code.toLowerCase())
      );
      
      if (!isValidQR) {
        alert('QR Code tidak valid untuk booth ini. Pastikan Anda scan QR Code yang benar.');
        setIsScanning(false);
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      setVoucherClaimed(true);
      setIsScanning(false);
      
      setTimeout(() => {
        router.push('/app/saku?newVoucher=true&booth=' + encodeURIComponent(boothData.name));
      }, 3000);
      
    } catch (error) {
      alert('Terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat.');
      setIsScanning(false);
    } finally {
      setLoading(false);
    }
  };

  if (!boothData) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-primary mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Memuat informasi booth event...</p>
          </div>
        </div>
      </div>
    );
  }

  if (voucherClaimed) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center px-4 max-w-sm mx-auto">
            <div className="bg-white bg-opacity-40 backdrop-blur-sm w-24 h-24 rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text__primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Voucher Event Berhasil Diklaim!</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Voucher <span className="font-semibold">{boothData.name}</span> telah ditambahkan ke saku Anda
            </p>
            <div className="flex items-center justify-center gap-3 mb-4 bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] px-4 py-2 shadow-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-primary"></div>
              <span className="text-sm text-gray-600">Mengalihkan ke saku voucher...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      <div className="min-h-screen bg-gradient-to-br from-cyan-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FontAwesomeIcon icon={faArrowLeft} className="text-lg text-gray-700" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">{boothData.name}</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">{boothData.category}</p>
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-xs" />
                  <span className="text-xs text-gray-600">{boothData.rating}</span>
                  <span className="text-xs text-gray-400">({boothData.totalReviews})</span>
                </div>
              </div>
            </div>
            <FontAwesomeIcon icon={faTicket} className="text__primary text-xl" />
          </div>
        </div>

        {/* Promo Header */}
        <div className="p-4">
          <div className="bg-primary text-white rounded-[20px] p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-[20px] backdrop-blur-sm">
                  <FontAwesomeIcon icon={faGift} className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Promo Event Eksklusif</h2>
                  <p className="opacity-90 text-sm">Special untuk pengunjung</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-[12px] px-3 py-1">
                <p className="text-xs font-medium opacity-90">Hemat {boothData.promo.discount}</p>
              </div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-[20px] p-4 border border-white/20">
              <h3 className="font-bold text-lg mb-2">{boothData.promo.title}</h3>
              <p className="text-sm mb-3 opacity-95 leading-relaxed">{boothData.promo.description}</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faClock} />
                  <span>Berlaku sampai {boothData.promo.validUntil}</span>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded">Min. {boothData.promo.minPurchase}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Methods */}
        <div className="px-4 pb-4">
          <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary bg-opacity-20 p-2 rounded-[20px]">
                <FontAwesomeIcon icon={faTicket} className="text__primary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Klaim Voucher Event</h3>
                <p className="text-sm text-gray-600">Pilih metode untuk mendapatkan voucher</p>
              </div>
            </div>
            
            {/* Method Tabs */}
            <div className="flex bg-gray-50 rounded-[20px] p-1 mb-6">
              <button
                onClick={() => setActiveMethod('code')}
                className={`flex-1 px-4 py-3 rounded-[15px] text-sm font-semibold transition-all ${
                  activeMethod === 'code'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Masukkan Kode
              </button>
              <button
                onClick={() => setActiveMethod('scan')}
                className={`flex-1 px-4 py-3 rounded-[15px] text-sm font-semibold transition-all ${
                  activeMethod === 'scan'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Scan QR Code
              </button>
            </div>

            {/* Method Content */}
            {activeMethod === 'code' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Masukkan Kode Promo Event
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode promo"
                    className="w-full px-4 py-4 border border__primary rounded-[20px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-center font-mono text-lg bg-gray-50 transition-all"
                  />
                </div>
                
                <div className="bg-teal-50 border border__primary rounded-[20px] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <p className="text-sm font-semibold text__primary">Kode yang tersedia:</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {boothData.validCodes.map((code, index) => (
                      <button
                        key={index}
                        onClick={() => setPromoCode(code)}
                        className="bg-primary bg-opacity-20 hover:bg-primary hover:bg-opacity-30 text__primary px-3 py-2 rounded-[12px] text-sm font-mono transition-colors border border__primary"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleClaimVoucher}
                  disabled={loading || !promoCode.trim()}
                  className="w-full bg-primary text-white py-4 rounded-[20px] font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Memproses Voucher...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faGift} />
                      Klaim Voucher Event Sekarang
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 rounded-[20px] overflow-hidden border border-gray-200">
                  <div className="p-4 bg-gray-100 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary bg-opacity-20 p-2 rounded-[12px]">
                          <FontAwesomeIcon icon={faQrcode} className="text__primary" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-800">Kamera Scanner</span>
                          <p className="text-xs text-gray-600">Siap memindai QR Code</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveMethod('code')}
                        className="text-sm text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-[12px] transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                  
                  {isScanning && (
                    <div className="relative aspect-square">
                      <QrScannerComponent onScan={handleQRScan} />
                      <div className="absolute inset-0 border-2 border-white/30">
                        <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-[20px]"></div>
                        <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-[20px]"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-[20px]"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-[20px]"></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 text-center">
                    <p className="text-sm text-gray-700 font-medium">
                      Arahkan kamera ke QR Code dari booth event
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pastikan QR Code terlihat jelas dalam frame
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="px-4 space-y-4 pb-20">
          {/* Event Details */}
          <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Informasi Event
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Tanggal Event</p>
                  <p className="text-sm text-gray-600">{boothData.eventDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Lokasi</p>
                  <p className="text-sm text-gray-600">{boothData.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Kontak</p>
                  <p className="text-sm text-gray-600">{boothData.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Jam Operasional</p>
                  <p className="text-sm text-gray-600">{boothData.hours}</p>
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-3">Fasilitas Event:</p>
              <div className="grid grid-cols-2 gap-2">
                {boothData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-[12px] p-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text__primary text-xs" />
                    <span className="text-xs text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Community */}
          <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[20px] shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary bg-opacity-20 p-3 rounded-[20px]">
                  <FontAwesomeIcon icon={faUsers} className="text__primary text-lg" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{boothData.community.name}</p>
                  <p className="text-sm text-gray-600">{boothData.community.members.toLocaleString()} member aktif</p>
                  <p className="text-xs text-gray-500 mt-1">{boothData.community.description}</p>
                </div>
              </div>
              <Link href="/app/komunitas">
                <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-[20px] text-sm font-semibold shadow-sm transition-all">
                  Lihat Komunitas
                </button>
              </Link>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-[20px] p-6">
            <h4 className="font-bold text-gray-900 mb-4">Syarat & Ketentuan Promo Event:</h4>
            <ul className="space-y-3">
              {boothData.promo.terms.map((term, index) => (
                <li key={index} className="text-sm text-gray-700 flex gap-3">
                  <span className="text__primary font-bold">•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}