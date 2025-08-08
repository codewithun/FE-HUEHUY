import { faArrowLeft, faCheckCircle, faPhone, faStore, faUser, faWhatsapp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function RegisterTenant() {
  const router = useRouter();
  const { qr, type, tenantId } = router.query;
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) return;

    setLoading(true);
    
    try {
      // Simulasi API call untuk registrasi
      await new Promise(resolve => setTimeout(resolve, 1500));

      const registrationData = {
        customerId: `CUSTOMER_${Date.now()}`,
        tenantId: tenantId || 'FOODCOURT01',
        userName: formData.name,
        userPhone: formData.whatsapp,
        success: true
      };

      // Simpan data registrasi ke localStorage untuk komunitas
      localStorage.setItem('tenant_registration', JSON.stringify({
        ...registrationData,
        registeredAt: new Date().toISOString(),
        tenantName: getTenantName(tenantId)
      }));

      setSubmitted(true);
      
      // Redirect ke halaman komunitas dengan parameter baru bergabung
      setTimeout(() => {
        router.push(`/app/komunitas/promo?newMember=true&tenantId=${tenantId || 'FOODCOURT01'}&customerId=${registrationData.customerId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const getTenantName = (id) => {
    const tenantNames = {
      'FOODCOURT01': 'Food Court Plaza',
      'CAFE_RESTO': 'Cafe & Restaurant',
      'RETAIL_STORE': 'Retail Store'
    };
    return tenantNames[id] || 'Merchant Partner';
  };

  if (submitted) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto min-h-screen bg-gradient-to-br from-cyan-50 flex items-center justify-center">
          <div className="text-center px-4 max-w-sm mx-auto">
            <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Selamat Bergabung!</h2>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Anda telah bergabung dengan komunitas merchant.<br/>
              Mengarahkan ke halaman promo komunitas...
            </p>
            <div className="flex items-center justify-center gap-2 mb-4 bg-white bg-opacity-40 backdrop-blur-sm rounded-full px-3 py-2 shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-primary"></div>
              <span className="text-xs text-gray-600">Mengalihkan ke komunitas promo...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:relative lg:max-w-md">
      <div className="container mx-auto min-h-screen bg-gradient-to-br from-cyan-50">
        {/* Header - Hijau seperti HUEHUY */}
        <div className="bg-primary px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/app/scanner/scan-qr" className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FontAwesomeIcon icon={faArrowLeft} className="text-lg text-white" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">Daftar Komunitas</h1>
              <p className="text-sm text-white/90">Bergabung dengan {getTenantName(tenantId)}</p>
            </div>
            <FontAwesomeIcon icon={faStore} className="text-xl text-white/80" />
          </div>
        </div>

        {/* Registration Form */}
        <div className="p-4">
          <div className="bg-white bg-opacity-40 backdrop-blur-sm rounded-[25px] shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="bg-primary/10 p-3 rounded-[15px] w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                <FontAwesomeIcon icon={faStore} className="text-xl text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Bergabung dengan Komunitas</h3>
              <p className="text-sm text-gray-600">Isi data untuk bergabung dan dapatkan promo eksklusif</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 pl-10 border border__primary rounded-[20px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50"
                    placeholder="Masukkan nama lengkap"
                  />
                  <FontAwesomeIcon 
                    icon={faUser} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className="w-full px-4 py-3 pl-10 pr-10 border border__primary rounded-[20px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50"
                    placeholder="08xxxxxxxxxx"
                  />
                  <FontAwesomeIcon 
                    icon={faPhone} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary text-sm" 
                  />
                  <FontAwesomeIcon 
                    icon={faWhatsapp} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Promo akan dikirim ke nomor WhatsApp ini
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-[15px] p-4 my-4">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faStore} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Keuntungan bergabung:</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Akses promo eksklusif komunitas</li>
                      <li>• Diskon spesial member</li>
                      <li>• Update promo terbaru</li>
                      <li>• Interaksi dengan sesama member</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.name || !formData.whatsapp}
                className="w-full bg-primary text-white py-3 rounded-[20px] font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-6"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Memproses Registrasi...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faStore} />
                    Bergabung & Dapatkan Promo
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}