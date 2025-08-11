import {
    faChevronRight,
    faComments,
    faQrcode,
    faShare,
    faSignOutAlt,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CommunityBottomBar from '../dashboard/CommunityBottomBar';

export default function CommunityProfile() {
    const router = useRouter();
    const { id } = router.query;
    const [isClient, setIsClient] = useState(false);

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
            link: '#',
            hasChevron: true
        },
        {
            id: 'chat-admin',
            title: 'Chat Admin Komunitas',
            icon: faComments,
            link: '#',
            hasChevron: true
        },
        {
            id: 'share-community',
            title: 'Bagikan Komunitas',
            icon: faShare,
            link: '#',
            hasChevron: true
        },
        {
            id: 'qr-community',
            title: 'QR Komunitas',
            icon: faQrcode,
            link: '#',
            hasChevron: true
        }
    ];

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
                                        <img 
                                            src={userData.avatar} 
                                            alt={userData.name}
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
                                    <Link key={item.id} href={item.link}>
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
                                    </Link>
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
            </div>
        </>
    );
}
