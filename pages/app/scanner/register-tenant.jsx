import { faArrowLeft, faStore } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function RegisterTenant() {
  const router = useRouter();
  const { qr, type, tenantId } = router.query;
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
  });
  const [loading, setLoading] = useState(false);
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    // Set demo data untuk tenant
    if (tenantId) {
      setDemoTenantInfo(tenantId);
    }
  }, [tenantId]);

  const setDemoTenantInfo = (id) => {
    // Demo data untuk testing
    const demoTenants = {
      'RESTO01': {
        name: 'Warung Padang Sederhana',
        category: 'Restoran & Kuliner',
        promo_description: 'Diskon 20% untuk semua menu + gratis es teh manis!'
      },
      'TENANT01': {
        name: 'Toko Elektronik Modern',
        category: 'Elektronik & Gadget',
        promo_description: 'Cashback 15% untuk pembelian minimal Rp 500.000'
      },
      'CAFE01': {
        name: 'Kopi Nusantara Cafe',
        category: 'Cafe & Minuman',
        promo_description: 'Beli 2 gratis 1 untuk semua varian kopi'
      }
    };

    const tenant = demoTenants[id] || {
      name: `Demo Tenant ${id}`,
      category: 'Kategori Demo',
      promo_description: 'Promo khusus untuk member komunitas!'
    };

    setTenantInfo(tenant);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) return;

    setLoading(true);
    
    try {
      // Simulasi API call untuk demo
      await new Promise(resolve => setTimeout(resolve, 1500)); // Delay 1.5 detik

      // Demo: anggap registrasi berhasil
      const demoResult = {
        customerId: `CUST_${Date.now()}`,
        success: true
      };

      // Langsung redirect ke halaman promo tenant
      router.push(`/app/tenant/${tenantId}?registered=true&customerId=${demoResult.customerId}&demo=true`);
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/app/scanner/scan-qr">
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Daftar Promo Tenant</h1>
            <p className="text-sm opacity-90">{tenantInfo?.name || `Tenant ${tenantId}`}</p>
          </div>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="px-4 py-3 bg-green-50 border-b border-green-200">
        <p className="text-sm text-green-700">
          🎬 <strong>Mode Demo:</strong> Data tenant simulasi untuk testing
        </p>
      </div>

      {/* Tenant Info */}
      <div className="px-4 py-6">
        {tenantInfo && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <FontAwesomeIcon icon={faStore} className="text-3xl" />
              <div>
                <h2 className="text-xl font-bold">{tenantInfo.name}</h2>
                <p className="opacity-90">{tenantInfo.category}</p>
              </div>
            </div>
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-sm">
                🎉 {tenantInfo.promo_description}
              </p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nomor WhatsApp *</label>
            <input
              type="tel"
              required
              value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.name || !formData.whatsapp}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Memproses...
              </div>
            ) : (
              'Daftar & Akses Promo'
            )}
          </button>
        </form>

        {/* Benefits */}
        <div className="mt-6 bg-white rounded-xl p-4">
          <h3 className="font-semibold mb-3">Keuntungan Bergabung:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Akses langsung ke promo tenant</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Otomatis join komunitas</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Voucher dengan kode unik atau QR</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm">Notifikasi promo eksklusif via WhatsApp</p>
            </div>
          </div>
        </div>

        {/* QR Info */}
        <div className="mt-4 bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Info QR Code:</h3>
          <p className="text-sm text-gray-600 break-all">
            <strong>QR:</strong> {qr}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Tenant ID:</strong> {tenantId}
          </p>
        </div>
      </div>
    </div>
  );
}