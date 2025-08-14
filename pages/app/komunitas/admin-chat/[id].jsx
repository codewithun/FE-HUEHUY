import { faArrowLeft, faComments, faShieldAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CommunityAdminChat() {
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
    });

    // Demo admin data - in real app this would come from API
    const [adminList] = useState([
        {
            id: 'admin1',
            name: 'Evita dbotanica',
            role: 'Super Admin',
            avatar: '/api/placeholder/60/60',
            isOnline: true,
            lastSeen: null,
            description: 'Founder & CEO'
        },
        {
            id: 'admin2',
            name: 'Ellen Sastraesmana',
            role: 'Admin',
            avatar: '/api/placeholder/60/60',
            isOnline: false,
            lastSeen: '2 jam lalu',
            description: 'Community Manager'
        },
        {
            id: 'admin3',
            name: 'dbotanica',
            role: 'Admin',
            avatar: '/api/placeholder/60/60',
            isOnline: true,
            lastSeen: null,
            description: 'Moderator'
        },
        {
            id: 'admin4',
            name: 'Kartika Dbotanica',
            role: 'Admin',
            avatar: '/api/placeholder/60/60',
            isOnline: false,
            lastSeen: '1 hari lalu',
            description: 'Event Coordinator'
        }
    ]);

    const handleChatWithAdmin = (adminId, adminName) => {
        // Navigate to chat page with admin - using a special format for community admin chats
        router.push(`/app/pesan/community-admin-${adminId}?communityId=${id}&adminName=${encodeURIComponent(adminName)}&type=admin`);
    };

    const handleBack = () => {
        // Navigate back to community profile page
        router.push(`/app/komunitas/profile/profile_id?id=${id}`);
    };

    if (!isClient) {
        return null;
    }

    return (
        <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen">
            <div className="container mx-auto relative z-10 min-h-screen">
                {/* Header */}
                <div className="w-full bg-primary relative overflow-hidden shadow-neuro">
                    <div className="absolute inset-0">
                        <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full opacity-10"></div>
                        <div className="absolute bottom-8 left-8 w-12 h-12 bg-white rounded-full opacity-10"></div>
                        <div className="absolute top-12 left-1/4 w-8 h-8 bg-white rounded-full opacity-10"></div>
                    </div>
                    
                    <div className="relative px-6 py-6 text-white">
                        {/* Header with back button */}
                        <div className="flex items-center gap-4 mb-4">
                            <button 
                                onClick={handleBack}
                                className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-opacity-30 transition-all duration-300"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-white text-lg" />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-white text-xl font-bold drop-shadow-neuro">
                                    Chat Admin Komunitas
                                </h1>
                                <p className="text-white text-opacity-80 text-sm drop-shadow-neuro">
                                    {communityData.name}
                                </p>
                            </div>
                        </div>

                        {/* Info card */}
                        <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 shadow-neuro">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <FontAwesomeIcon icon={faComments} className="text-white text-sm" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium text-sm drop-shadow-neuro">
                                        Pilih Admin untuk Memulai Chat
                                    </h3>
                                    <p className="text-white text-opacity-70 text-xs drop-shadow-neuro">
                                        {adminList.filter(admin => admin.isOnline).length} admin online
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content area */}
                <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20">
                    <div className="px-4 pt-6 pb-8">
                        {/* Admin List */}
                        <div className="space-y-3">
                            {adminList.map((admin) => (
                                <div 
                                    key={admin.id} 
                                    onClick={() => handleChatWithAdmin(admin.id, admin.name)}
                                    className="cursor-pointer"
                                >
                                    <div className="bg-white rounded-xl p-4 shadow-neuro hover:scale-[1.01] transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar with online indicator */}
                                            <div className="relative">
                                                <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden shadow-neuro-in">
                                                    <Image 
                                                        src={admin.avatar} 
                                                        alt={admin.name}
                                                        width={56}
                                                        height={56}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                {/* Online indicator */}
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                                    admin.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></div>
                                            </div>

                                            {/* Admin info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-slate-800 text-base">
                                                        {admin.name}
                                                    </h4>
                                                    <div className="flex items-center gap-1">
                                                        <FontAwesomeIcon 
                                                            icon={faShieldAlt} 
                                                            className="text-blue-600 text-xs" 
                                                        />
                                                        <span className="text-blue-600 text-xs font-medium">
                                                            {admin.role}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-slate-600 text-sm mb-1">
                                                    {admin.description}
                                                </p>
                                                
                                                <div className="flex items-center gap-2">
                                                    {admin.isOnline ? (
                                                        <span className="text-green-600 text-xs font-medium">
                                                            Online
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs">
                                                            Terakhir dilihat {admin.lastSeen}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Chat indicator */}
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                <FontAwesomeIcon 
                                                    icon={faComments} 
                                                    className="text-blue-600 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Info section */}
                        <div className="mt-6 bg-blue-50 rounded-xl p-4 shadow-neuro-in">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                    <FontAwesomeIcon icon={faUserCircle} className="text-blue-600 text-sm" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-800 text-sm mb-1">
                                        Tentang Chat Admin
                                    </h4>
                                    <p className="text-slate-600 text-xs leading-relaxed">
                                        Admin komunitas siap membantu Anda dengan pertanyaan, saran, atau masalah terkait komunitas. 
                                        Pilih admin yang tersedia untuk memulai percakapan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
