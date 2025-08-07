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
      await new Promise(resolve => setTimeout(resolve, 1500));

      const registrationData = {
        promoId: `PROMO_${Date.now()}`,
        tenantId: tenantId || 'FOODCOURT01',
        userName: formData.name,
        userPhone: formData.whatsapp,
        success: true
      };

      setSubmitted(true);
      
      setTimeout(() => {
        router.push(`/app/scanner/tenant-promo?promoId=${registrationData.promoId}&tenant=${tenantId}&name=${encodeURIComponent(formData.name)}&phone=${encodeURIComponent(formData.whatsapp)}`);
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4 max-w-sm mx-auto">
          <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Registrasi Berhasil!</h2>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            Selamat! Anda telah bergabung dengan komunitas merchant.<br/>
            Promo akan segera dikirim ke WhatsApp Anda.
          </p>
          <div className="flex items-center justify-center gap-2 mb-4 bg-white rounded-full px-3 py-2 shadow-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-green-500"></div>
            <span className="text-xs text-gray-600">Mengalihkan ke halaman promo...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/app/scanner/scan-qr" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg text-gray-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Daftar Tenant</h1>
            <p className="text-sm text-gray-600">Tenant Promo - {tenantId}</p>
          </div>
          <FontAwesomeIcon icon={faStore} className="text-xl text-gray-400" />
        </div>
      </div>

      {/* Registration Form */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center mb-6">
            <div className="bg-green-50 p-3 rounded-xl w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <FontAwesomeIcon icon={faStore} className="text-xl text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Informasi Pendaftar</h3>
            <p className="text-sm text-gray-600">Isi data berikut untuk mendapatkan promo</p>
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
                  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-gray-50"
                  placeholder="Masukkan nama lengkap"
                />
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" 
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
                  className="w-full px-4 py-3 pl-10 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-gray-50"
                  placeholder="08xxxxxxxxxx"
                />
                <FontAwesomeIcon 
                  icon={faPhone} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" 
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

            <button
              type="submit"
              disabled={loading || !formData.name || !formData.whatsapp}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Memproses Registrasi...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faStore} />
                  Daftar & Dapatkan Promo
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}