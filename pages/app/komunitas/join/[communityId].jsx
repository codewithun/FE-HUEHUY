import {
    faArrowLeft,
    faCheckCircle,
    faMapMarkerAlt,
    faQrcode,
    faShare,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function JoinCommunity() {
    const router = useRouter();
    const { communityId } = router.query;
    const [isClient, setIsClient] = useState(false);
    const [loading, setLoading] = useState(false);
    const [communityData, setCommunityData] = useState(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (communityId) {
            // Simulate API call to get community data
            setCommunityData({
                id: communityId,
                name: 'dbotanica Bandung',
                description: 'Mall perbelanjaan standar dengan beragam toko pakaian, plus tempat makan kasual & bioskop.',
                members: 1234,
                category: 'Shopping',
                location: 'Bandung, Jawa Barat',
                privacy: 'public',
                activePromos: 8,
                totalEvents: 3,
                isVerified: true,
                avatar: '/api/placeholder/120/120',
                coverImage: '/api/placeholder/400/200'
            });
        }
    }, [communityId]);

    const handleJoinCommunity = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert('Berhasil bergabung dengan komunitas!');
            router.push(`/app/komunitas/dashboard/${communityId}`);
        } catch (error) {
            alert('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    if (!isClient || !communityData) {
        return (
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-600">Memuat informasi komunitas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lg:mx-auto lg:relative lg:max-w-md bg-white min-h-screen">
            {/* Header */}
            <div className="relative">
                <div className="h-48 bg-gradient-to-br from-primary to-primary-dark overflow-hidden">
                    <Image 
                        src={communityData.coverImage}
                        alt="Community Cover"
                        width={400}
                        height={200}
                        className="w-full h-full object-cover opacity-30"
                    />
                </div>
                
                <button 
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 w-10 h-10 bg-black bg-opacity-30 rounded-lg flex items-center justify-center backdrop-blur-sm"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-white" />
                </button>
                
                <div className="absolute top-4 right-4 flex gap-2">
                    <button className="w-10 h-10 bg-black bg-opacity-30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <FontAwesomeIcon icon={faQrcode} className="text-white" />
                    </button>
                    <button className="w-10 h-10 bg-black bg-opacity-30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <FontAwesomeIcon icon={faShare} className="text-white" />
                    </button>
                </div>
                
                {/* Community Avatar */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                    <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                        <Image 
                            src={communityData.avatar}
                            alt={communityData.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 pt-16 pb-8">
                {/* Community Info */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <h1 className="text-xl font-bold text-slate-800">
                            {communityData.name}
                        </h1>
                        {communityData.isVerified && (
                            <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 text-lg" />
                        )}
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                        {communityData.description}
                    </p>
                    
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faUsers} className="text-xs" />
                            <span>{communityData.members.toLocaleString()} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                            <span>{communityData.location}</span>
                        </div>
                    </div>
                </div>

                {/* Community Stats */}
                <div className="bg-gray-50 rounded-xl p-4 mb-8">
                    <h3 className="font-semibold text-slate-800 mb-3">Aktivitas Komunitas</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary mb-1">
                                {communityData.activePromos}
                            </div>
                            <div className="text-xs text-slate-600">
                                Promo Aktif
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary mb-1">
                                {communityData.totalEvents}
                            </div>
                            <div className="text-xs text-slate-600">
                                Event
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary mb-1">
                                {communityData.members}
                            </div>
                            <div className="text-xs text-slate-600">
                                Members
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="mb-8">
                    <h3 className="font-semibold text-slate-800 mb-3">Keuntungan Bergabung</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xs" />
                            </div>
                            <span className="text-sm text-slate-700">Akses promo eksklusif komunitas</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xs" />
                            </div>
                            <span className="text-sm text-slate-700">Notifikasi event dan aktivitas terbaru</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xs" />
                            </div>
                            <span className="text-sm text-slate-700">Dapat berinteraksi dengan komunitas</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xs" />
                            </div>
                            <span className="text-sm text-slate-700">Kesempatan menjadi member dengan kubus</span>
                        </div>
                    </div>
                </div>

                {/* Join Button */}
                <button 
                    onClick={handleJoinCommunity}
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Bergabung...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faUsers} />
                            Bergabung dengan Komunitas
                        </>
                    )}
                </button>

                {/* Privacy Notice */}
                <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed">
                    Dengan bergabung, Anda menyetujui untuk mengikuti aturan komunitas dan 
                    menerima notifikasi terkait aktivitas komunitas.
                </p>
            </div>
        </div>
    );
}
