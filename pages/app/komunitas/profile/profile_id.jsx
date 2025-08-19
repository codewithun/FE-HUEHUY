import {
    faCheck,
    faChevronRight,
    faComments,
    faCopy,
    faQrcode,
    faShare,
    faSignOutAlt,
    faSpinner,
    faTimes,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CommunityBottomBar from '../dashboard/CommunityBottomBar';

export default function CommunityProfile() {
    const router = useRouter();
    const { id } = router.query;
    const [isClient, setIsClient] = useState(false);
    
    // Modal states
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [membershipLoading, setMembershipLoading] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Demo data - in real app this would come from API based on community ID
    const [communityData] = useState({
        id: 1,
        name: 'dbotanica Bandung',
        description: 'Mall perbelanjaan standar dengan beragam toko pakaian, plus tempat makan kasual & bioskop.',
        members: 1234,
        category: 'Shopping',
        isOwner: false,
        isAdmin: true,
        isJoined: true,
        privacy: 'public',
        activePromos: 8,
        totalEvents: 3,
        unreadMessages: 5,
        isVerified: true,
        avatar: '/api/placeholder/80/80'
    });

    const [userData] = useState({
        name: 'Ardan Ferdiansah',
        email: 'ardanferdiansah03@gmail.com',
        avatar: '/api/placeholder/80/80',
        promoCount: 0
    });

    const menuItems = [
        {
            id: 'member-request',
            title: 'Minta Menjadi Member (Bisa Memiliki Kubus)',
            icon: faUsers,
            action: () => setShowMembershipModal(true),
            hasChevron: true
        },
        {
            id: 'chat-admin',
            title: 'Chat Admin Komunitas',
            icon: faComments,
            action: () => router.push(`/app/komunitas/admin-chat/${communityData.id}`),
            hasChevron: true
        },
        {
            id: 'share-community',
            title: 'Bagikan Komunitas',
            icon: faShare,
            action: () => handleShare(),
            hasChevron: true
        },
        {
            id: 'qr-community',
            title: 'QR Komunitas',
            icon: faQrcode,
            action: () => router.push('/app/komunitas/scanner'),
            hasChevron: true
        }
    ];

    // Handler functions
    const handleMembershipRequest = async () => {
        setMembershipLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert('Permintaan membership berhasil dikirim! Admin akan meninjau permintaan Anda.');
            setShowMembershipModal(false);
        } catch (error) {
            alert('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setMembershipLoading(false);
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/app/komunitas/join/${id || communityData.id}`;
        const shareText = `Bergabung dengan komunitas ${communityData.name} di HueHuy!`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Komunitas ${communityData.name}`,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    // Fallback to copy link if sharing fails
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        alert('Link berhasil disalin!');
                    });
                }
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link berhasil disalin!');
            });
        }
    };

    const handleLeaveCommunity = () => {
        // In real app, this would show confirmation modal and handle leaving community
        alert('Fitur keluar komunitas akan ditampilkan di sini');
    };

    if (!isClient) {
        return null;
    }

    return (
        <>
            <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen px-2 py-2">
                <div className="container mx-auto relative z-10 pb-28 min-h-screen">
                    {/* Header dengan gradient */}
                    <div className="w-full bg-primary relative overflow-hidden rounded-b-[40px] shadow-neuro">
                        <div className="absolute inset-0">
                            <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full opacity-10"></div>
                            <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-full opacity-10"></div>
                            <div className="absolute top-12 left-1/4 w-8 h-8 bg-white rounded-full opacity-10"></div>
                        </div>
                        
                        <div className="relative px-6 py-6 text-white">
                            {/* User Profile Card */}
                            <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-neuro">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-neuro-in">
                                        <Image 
                                            src={userData.avatar} 
                                            alt={userData.name}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="font-bold text-white text-lg mb-1 drop-shadow-neuro">
                                            {userData.name}
                                        </h2>
                                        <p className="text-white text-opacity-80 text-sm mb-2 drop-shadow-neuro">
                                            {userData.email}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-opacity-90 text-sm font-medium drop-shadow-neuro">
                                                Iklan/Promo: {userData.promoCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Community Title */}
                            <div className="mb-4">
                                <h3 className="text-white text-lg font-semibold drop-shadow-neuro">
                                    Komunitas {communityData.name}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20">
                        <div className="px-4 pt-6">
                            {/* Menu Items */}
                            <div className="space-y-3">
                                {menuItems.map((item) => (
                                    <div key={item.id} onClick={item.action} className="cursor-pointer">
                                        <div className="bg-white rounded-xl p-4 shadow-neuro hover:scale-[1.01] transition-all duration-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shadow-neuro-in">
                                                        <FontAwesomeIcon 
                                                            icon={item.icon} 
                                                            className="text-slate-400 text-lg"
                                                        />
                                                    </div>
                                                    <span className="font-medium text-slate-700">
                                                        {item.title}
                                                    </span>
                                                </div>
                                                {item.hasChevron && (
                                                    <FontAwesomeIcon 
                                                        icon={faChevronRight} 
                                                        className="text-slate-400 text-sm"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Leave Community Button */}
                            <div className="mt-8">
                                <button 
                                    onClick={handleLeaveCommunity}
                                    className="w-full bg-red-50 text-red-700 rounded-xl p-4 shadow-neuro-in hover:scale-[1.01] transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shadow-neuro-in">
                                                <FontAwesomeIcon 
                                                    icon={faSignOutAlt} 
                                                    className="text-red-500 text-lg"
                                                />
                                            </div>
                                            <span className="font-medium text-red-700">
                                                Keluar Komunitas
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <CommunityBottomBar active={'profile'} communityId={communityData.id} />
                
                {/* Membership Request Modal */}
                {showMembershipModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-neuro">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-2xl" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">
                                    Permintaan Membership
                                </h3>
                                <p className="text-slate-600 text-sm">
                                    Apakah Anda yakin ingin mengajukan permintaan untuk menjadi member komunitas {communityData.name}? 
                                    Sebagai member, Anda akan dapat memiliki kubus dan mendapat akses khusus.
                                </p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowMembershipModal(false)}
                                    className="flex-1 bg-gray-100 text-slate-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                    disabled={membershipLoading}
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleMembershipRequest}
                                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    disabled={membershipLoading}
                                >
                                    {membershipLoading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCheck} />
                                            Kirim Permintaan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* QR Code Modal */}
                {showQRModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-neuro">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800">
                                    QR Komunitas
                                </h3>
                                <button 
                                    onClick={() => setShowQRModal(false)}
                                    className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
                                </button>
                            </div>
                            
                            <div className="text-center">
                                <div className="bg-gray-100 rounded-xl p-6 mb-4">
                                    <div className="w-48 h-48 mx-auto bg-white rounded-lg p-4 shadow-neuro-in">
                                        {/* QR Code placeholder - in real app this would be generated */}
                                        <div className="w-full h-full bg-qr-pattern bg-center bg-no-repeat bg-contain"></div>
                                        <style jsx>{`
                                            .bg-qr-pattern {
                                                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23000'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23fff'/%3E%3Crect x='30' y='10' width='10' height='10' fill='%23fff'/%3E%3Crect x='50' y='10' width='10' height='10' fill='%23fff'/%3E%3Crect x='70' y='10' width='10' height='10' fill='%23fff'/%3E%3Crect x='10' y='30' width='10' height='10' fill='%23fff'/%3E%3Crect x='30' y='30' width='10' height='10' fill='%23fff'/%3E%3Crect x='50' y='30' width='10' height='10' fill='%23fff'/%3E%3Crect x='70' y='30' width='10' height='10' fill='%23fff'/%3E%3C/svg%3E");
                                            }
                                        `}</style>
                                    </div>
                                </div>
                                
                                <h4 className="font-bold text-slate-800 mb-2">
                                    {communityData.name}
                                </h4>
                                <p className="text-slate-600 text-sm mb-4">
                                    Scan QR code ini untuk bergabung dengan komunitas
                                </p>
                                
                                <button 
                                    onClick={() => {
                                        const shareUrl = `${window.location.origin}/app/komunitas/join/${id || communityData.id}`;
                                        navigator.clipboard.writeText(shareUrl).then(() => {
                                            alert('Link berhasil disalin!');
                                        });
                                    }}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faCopy} />
                                    Salin Link Komunitas
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
