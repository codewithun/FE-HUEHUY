import { faArrowLeft, faComments, faShieldAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
            description: 'Founder & CEO'
        },
        {
            id: 'admin2',
            name: 'Ellen Sastraesmana',
            role: 'Admin',
            description: 'Community Manager'
        },
        {
            id: 'admin3',
            name: 'dbotanica',
            role: 'Admin',
            description: 'Moderator'
        },
        {
            id: 'admin4',
            name: 'Kartika Dbotanica',
            role: 'Admin',
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
                                        Admin siap membantu Anda
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
                                                
                                                <p className="text-slate-600 text-sm">
                                                    {admin.description}
                                                </p>
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
