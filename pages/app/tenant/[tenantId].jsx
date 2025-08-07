import {
    faArrowLeft,
    faCheck,
    faClock,
    faGift,
    faMapMarkerAlt,
    faPhone,
    faQrcode,
    faStore,
    faTicket,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import QrScannerComponent from '../../../components/construct.components/QrScannerComponent';

export default function TenantPromo() {
  const router = useRouter();
  const { tenantId, registered, customerId, demo } = router.query;
  
  const [tenantData, setTenantData] = useState(null);
  const [activeMethod, setActiveMethod] = useState('code'); // code, scan
  const [promoCode, setPromoCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [voucherClaimed, setVoucherClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinedCommunity, setJoinedCommunity] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadTenantData(tenantId);
    }
    
    // Auto join komunitas setelah registrasi
    if (registered === 'true') {
      autoJoinCommunity();
    }
  }, [tenantId, registered]);

  const loadTenantData = (id) => {
    // Demo data untuk tenant
    const demoTenants = {
      'RESTO01': {
        name: 'Warung Padang Sederhana',
        category: 'Restoran & Kuliner',
        description: 'Warung padang dengan cita rasa autentik dan harga terjangkau',
        address: 'Jl. Merdeka No. 123, Jakarta Pusat',
        phone: '021-1234567',
        hours: '08:00 - 22:00',
        promo: {
          title: 'Diskon 20% + Gratis Es Teh Manis!',
          description: 'Berlaku untuk semua menu, minimum pembelian Rp 50.000',
          validUntil: '31 Desember 2024',
          terms: [
            'Berlaku untuk dine-in dan takeaway',
            'Tidak dapat digabung dengan promo lain',
            'Satu voucher per customer per hari',
            'Wajib tunjukkan voucher sebelum memesan'
          ]
        },
        validCodes: ['PADANG20', 'RESTO01', 'HEMAT20'],
        community: {
          name: 'Foodie Lovers - Warung Padang',
          members: 234
        }
      },
      'TENANT01': {
        name: 'Toko Elektronik Modern',
        category: 'Elektronik & Gadget',
        description: 'Toko elektronik lengkap dengan produk original dan bergaransi',
        address: 'Mall Central Park Lt. 2 No. 45',
        phone: '021-9876543',
        hours: '10:00 - 21:00',
        promo: {
          title: 'Cashback 15% untuk Pembelian Minimal Rp 500.000',
          description: 'Berlaku untuk semua produk elektronik dan gadget',
          validUntil: '28 Februari 2025',
          terms: [
            'Cashback maksimal Rp 200.000',
            'Berlaku untuk produk non-sale',
            'Cashback dikembalikan dalam 3-5 hari kerja',
            'Wajib member untuk mendapatkan cashback'
          ]
        },
        validCodes: ['ELEKTRONIK15', 'GADGET15', 'CASHBACK15'],
        community: {
          name: 'Tech Enthusiast Community',
          members: 156
        }
      }
    };

    const tenant = demoTenants[id] || {
      name: `Demo Tenant ${id}`,
      category: 'Demo Category',
      description: 'Demo tenant untuk testing',
      address: 'Demo Address',
      phone: '021-DEMO',
      hours: '24/7',
      promo: {
        title: 'Demo Promo Special',
        description: 'Demo promo untuk testing aplikasi',
        validUntil: '31 Desember 2024',
        terms: ['Demo terms and conditions']
      },
      validCodes: ['DEMO', 'TEST', 'PROMO'],
      community: {
        name: `Komunitas ${id}`,
        members: 100
      }
    };

    setTenantData(tenant);
  };

  const autoJoinCommunity = async () => {
    setLoading(true);
    try {
      // Simulasi auto join komunitas
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJoinedCommunity(true);
    } catch (error) {
      console.error('Auto join community error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimVoucher = async () => {
    if (!promoCode.trim()) return;
    
    setLoading(true);
    try {
      // Validasi kode promo
      const isValidCode = tenantData.validCodes.some(
        code => code.toLowerCase() === promoCode.toLowerCase()
      );
      
      if (!isValidCode) {
        alert('Kode promo tidak valid! Coba kode yang lain.');
        setLoading(false);
        return;
      }

      // Simulasi claim voucher
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVoucherClaimed(true);
      
      // Auto redirect ke saku setelah 3 detik
      setTimeout(() => {
        router.push('/app/saku?newVoucher=true&tenant=' + encodeURIComponent(tenantData.name));
      }, 3000);
      
    } catch (error) {
      console.error('Claim voucher error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (result) => {
    if (!result) return;
    
    setLoading(true);
    try {
      // Validasi QR dari tenant
      const isValidQR = tenantData.validCodes.some(
        code => result.toLowerCase().includes(code.toLowerCase())
      );
      
      if (!isValidQR) {
        alert('QR Code tidak valid untuk tenant ini!');
        setIsScanning(false);
        setLoading(false);
        return;
      }

      // Simulasi claim voucher via QR
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVoucherClaimed(true);
      setIsScanning(false);
      
      // Auto redirect ke saku setelah 3 detik
      setTimeout(() => {
        router.push('/app/saku?newVoucher=true&tenant=' + encodeURIComponent(tenantData.name));
      }, 3000);
      
    } catch (error) {
      console.error('QR scan error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
      setIsScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!tenantData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (voucherClaimed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faGift} className="text-4xl text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-green-600">Selamat!</h2>
          <h3 className="text-xl font-semibold mb-2">Voucher Berhasil Diklaim</h3>
          <p className="text-gray-600 mb-6">
            Voucher {tenantData.name} telah ditambahkan ke saku Anda
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">
            Mengalihkan ke saku voucher...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/app">
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{tenantData.name}</h1>
            <p className="text-sm opacity-90">{tenantData.category}</p>
          </div>
          <FontAwesomeIcon icon={faStore} className="text-2xl" />
        </div>
      </div>

      {/* Success Banner */}
      {registered === 'true' && (
        <div className="px-4 py-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faCheck} className="text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Registrasi Berhasil!</p>
              <p className="text-sm text-green-700">
                {joinedCommunity 
                  ? `Anda telah bergabung dengan ${tenantData.community.name}` 
                  : 'Sedang menambahkan ke komunitas...'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Promo Info */}
      <div className="px-4 py-6">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faTicket} className="text-2xl" />
            <div>
              <h2 className="text-xl font-bold">Promo Eksklusif</h2>
              <p className="opacity-90 text-sm">Khusus untuk member komunitas</p>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{tenantData.promo.title}</h3>
            <p className="text-sm mb-3">{tenantData.promo.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} />
                <span>Berlaku sampai {tenantData.promo.validUntil}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Methods */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Cara Klaim Voucher</h3>
          
          {/* Method Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveMethod('code')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeMethod === 'code'
                  ? 'bg-primary text-white'
                  : 'text-gray-600'
              }`}
            >
              Masukkan Kode
            </button>
            <button
              onClick={() => setActiveMethod('scan')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeMethod === 'scan'
                  ? 'bg-primary text-white'
                  : 'text-gray-600'
              }`}
            >
              Scan QR Code
            </button>
          </div>

          {/* Method Content */}
          {activeMethod === 'code' ? (
            <div>
              <label className="block text-sm font-medium mb-3">
                Masukkan Kode Promo dari Tenant
              </label>
              <div className="space-y-4">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: PADANG20"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-primary text-center font-mono text-lg"
                />
                
                {/* Hint Codes untuk Demo */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800 mb-2">💡 Demo - Kode yang valid:</p>
                  <div className="flex flex-wrap gap-2">
                    {tenantData.validCodes.map((code, index) => (
                      <button
                        key={index}
                        onClick={() => setPromoCode(code)}
                        className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-mono hover:bg-yellow-300"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleClaimVoucher}
                  disabled={loading || !promoCode.trim()}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Memproses...
                    </div>
                  ) : (
                    'Klaim Voucher'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {!isScanning ? (
                <div className="text-center">
                  <FontAwesomeIcon icon={faQrcode} className="text-6xl text-gray-300 mb-4" />
                  <h4 className="font-semibold mb-2">Scan QR Code dari Tenant</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Minta QR code khusus dari kasir atau staff tenant
                  </p>
                  <button
                    onClick={() => setIsScanning(true)}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Mulai Scan QR
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <button
                      onClick={() => setIsScanning(false)}
                      className="text-primary font-medium"
                    >
                      ← Kembali
                    </button>
                  </div>
                  <QrScannerComponent onScan={handleQRScan} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tenant Info */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <h3 className="font-bold text-lg mb-4">Info Tenant</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
              <p className="text-sm">{tenantData.address}</p>
            </div>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
              <p className="text-sm">{tenantData.phone}</p>
            </div>
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faClock} className="text-gray-400" />
              <p className="text-sm">Buka: {tenantData.hours}</p>
            </div>
          </div>
        </div>

        {/* Community Info */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Komunitas</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faUsers} className="text-primary text-xl" />
              <div>
                <p className="font-semibold">{tenantData.community.name}</p>
                <p className="text-sm text-gray-600">{tenantData.community.members} member</p>
              </div>
            </div>
            <Link href="/app/komunitas">
              <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm">
                Lihat Komunitas
              </button>
            </Link>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold mb-3">Syarat & Ketentuan:</h4>
          <ul className="space-y-1">
            {tenantData.promo.terms.map((term, index) => (
              <li key={index} className="text-sm text-gray-600 flex gap-2">
                <span>•</span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}