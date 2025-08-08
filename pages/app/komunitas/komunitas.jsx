import {
  faArrowLeft,
  faBuilding,
  faCrown,
  faGlobe,
  faLock,
  faPlus,
  faSearch,
  faShield,
  faUserFriends,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';

export default function Komunitas() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Demo data dengan informasi yang lebih clean
  const [myCommunitiesData] = useState([
    {
      id: 1,
      name: 'Event Curiosity 2024',
      description: 'Komunitas peserta Event Curiosity dengan berbagai benefit eksklusif',
      members: 1234,
      category: 'Event',
      isOwner: false,
      isAdmin: true,
      privacy: 'public',
      activePromos: 8,
      isVerified: true
    },
    {
      id: 2,
      name: 'Foodie Lovers Jakarta',
      description: 'Komunitas pecinta kuliner dengan pengalaman dan rekomendasi terbaik',
      members: 856,
      category: 'Kuliner',
      isOwner: true,
      isAdmin: true,
      privacy: 'private',
      activePromos: 12,
      isVerified: false
    }
  ]);

  const [allCommunitiesData] = useState([
    ...myCommunitiesData,
    // {
    //   id: 3,
    //   name: 'Tech Startup Indonesia',
    //   description: 'Komunitas startup untuk networking dan berbagi pengalaman bisnis',
    //   members: 2456,
    //   category: 'Teknologi',
    //   isJoined: false,
    //   privacy: 'public',
    //   activePromos: 6,
    //   isVerified: true
    // },
    {
      id: 4,
      name: 'Photography Enthusiast',
      description: 'Komunitas fotografi untuk sharing tips dan teknik photography',
      members: 1890,
      category: 'Hobi',
      isJoined: false,
      privacy: 'public',
      activePromos: 4,
      isVerified: false
    },
    {
      id: 5,
      name: 'Business Network Club',
      description: 'Komunitas eksklusif untuk networking bisnis dan profesional',
      members: 234,
      category: 'Bisnis',
      isJoined: false,
      privacy: 'private',
      activePromos: 15,
      isVerified: true
    }
  ]);

  const [notJoinedCommunitiesData] = useState(
    allCommunitiesData.filter(community => !community.isJoined && !myCommunitiesData.find(my => my.id === community.id))
  );

  const filteredCommunities = () => {
    let data = [];
    
    switch(activeTab) {
      case 'komunitasku':
        data = myCommunitiesData;
        break;
      case 'belum-gabung':
        data = notJoinedCommunitiesData;
        break;
      default:
        data = allCommunitiesData;
    }

    if (searchQuery) {
      data = data.filter(community => 
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return data;
  };

  // Function untuk handle buka komunitas - redirect ke promo
  const handleOpenCommunity = (communityId) => {
    router.push(`/app/komunitas/promo?communityId=${communityId}`);
  };

  // Format number function with consistent locale
  const formatNumber = (num) => {
    if (!isClient) return num.toString();
    return num.toLocaleString('id-ID');
  };

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="container mx-auto relative z-10 pb-28">
          {/* Header Banner Clean */}
          <div className="w-full aspect-[16/7] overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/95 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
            <div className="absolute inset-0 flex items-center justify-between px-4 text-white">
              <div className="flex items-center gap-4">
                <Link href="/app">
                  <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold">Komunitas</h1>
                  <p className="text-sm opacity-90">Bergabung dengan komunitas profesional</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-primary p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FontAwesomeIcon icon={faPlus} className="text-lg" />
              </button>
            </div>
          </div>

          {/* Content dengan rounded corners */}
          <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
            {/* Search Bar */}
            <div className="relative -top-5 px-4">
              <div className="w-full bg-white border border__primary px-6 py-4 rounded-[20px] flex items-center gap-3 shadow-sm">
                <FontAwesomeIcon icon={faSearch} className="text__primary" />
                <input
                  type="text"
                  placeholder="Cari komunitas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 mb-6">
              <div className="flex space-x-1 bg-white bg-opacity-50 backdrop-blur-sm rounded-[20px] p-1 shadow-sm">
                {[
                  { key: 'semua', label: 'Semua' },
                  { key: 'komunitasku', label: 'Komunitas Saya' },
                  { key: 'belum-gabung', label: 'Jelajahi' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-4 py-3 rounded-[15px] text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Grid - Simplified */}
            <div className="px-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-[15px] p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-primary">{allCommunitiesData.length}</p>
                  <p className="text-xs text-gray-600">Total Komunitas</p>
                </div>
                <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-[15px] p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-green-600">{myCommunitiesData.length}</p>
                  <p className="text-xs text-gray-600">Bergabung</p>
                </div>
                <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-[15px] p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">{allCommunitiesData.filter(c => c.isVerified).length}</p>
                  <p className="text-xs text-gray-600">Terverifikasi</p>
                </div>
              </div>
            </div>

            {/* Community List */}
            <div className="px-4 space-y-4">
              {filteredCommunities().map((community) => (
                <CommunityCard 
                  key={community.id} 
                  community={community} 
                  activeTab={activeTab}
                  onOpenCommunity={handleOpenCommunity}
                  formatNumber={formatNumber}
                />
              ))}
            </div>

            {filteredCommunities().length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 bg-white bg-opacity-50 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faUsers} className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'Komunitas tidak ditemukan' : 'Belum ada komunitas'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery ? 'Coba kata kunci lain' : 'Mulai dengan membuat komunitas baru'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Community Modal */}
        {showCreateModal && (
          <CreateCommunityModal 
            onClose={() => setShowCreateModal(false)}
          />
        )}

        <BottomBarComponent active={'community'} />
      </div>
    </>
  );
}

// Community Card Component - Clean & Professional
function CommunityCard({ community, activeTab, onOpenCommunity, formatNumber }) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinCommunity = async () => {
    setIsJoining(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsJoining(false);
    onOpenCommunity(community.id);
  };

  const getPrivacyIcon = (privacy) => {
    switch(privacy) {
      case 'private': return faLock;
      case 'public': return faGlobe;
      default: return faUsers;
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Event': return faUsers;
      case 'Kuliner': return faBuilding;
      case 'Teknologi': return faShield;
      case 'Hobi': return faUsers;
      case 'Bisnis': return faBuilding;
      default: return faUsers;
    }
  };

  return (
    <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-[20px] p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="flex gap-4">
        {/* Community Avatar - Professional */}
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-[15px] flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={getCategoryIcon(community.category)} className="text-white text-xl" />
        </div>

        {/* Community Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Header dengan badges */}
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate text-base">{community.name}</h3>
                <FontAwesomeIcon 
                  icon={getPrivacyIcon(community.privacy)} 
                  className="text-xs text-gray-400" 
                />
                {community.isVerified && (
                  <FontAwesomeIcon icon={faShield} className="text-blue-500 text-xs" />
                )}
                {activeTab === 'komunitasku' && community.isOwner && (
                  <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-xs" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3 limit__line__2 leading-relaxed">
                {community.description}
              </p>
              
              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faUserFriends} />
                  <span>{formatNumber(community.members)} member</span>
                </div>
                <div className="px-2 py-1 bg-gray-100 rounded-full">
                  <span className="text-gray-700 font-medium">{community.category}</span>
                </div>
                {community.activePromos > 0 && (
                  <div className="px-2 py-1 bg-orange-100 rounded-full">
                    <span className="text-orange-700 font-medium">{community.activePromos} benefit</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="ml-4 flex-shrink-0">
              {activeTab === 'komunitasku' ? (
                <button 
                  onClick={() => onOpenCommunity(community.id)}
                  className="bg-primary text-white px-5 py-2 rounded-[15px] text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Lihat Detail
                </button>
              ) : (
                <button
                  onClick={handleJoinCommunity}
                  disabled={isJoining}
                  className="bg-green-500 text-white px-5 py-2 rounded-[15px] text-sm font-medium disabled:opacity-50 hover:bg-green-600 transition-colors"
                >
                  {isJoining ? 'Bergabung...' : 'Bergabung'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Community Modal - Clean & Professional
function CreateCommunityModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public'
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-[25px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Buat Komunitas</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Nama Komunitas</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border__primary rounded-[20px] focus:outline-none focus:border-primary bg-white"
                placeholder="Masukkan nama komunitas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Deskripsi</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border__primary rounded-[20px] focus:outline-none focus:border-primary bg-white resize-none"
                placeholder="Deskripsikan tujuan komunitas Anda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border border__primary rounded-[20px] focus:outline-none focus:border-primary bg-white"
              >
                <option value="">Pilih kategori</option>
                <option value="Event">Event</option>
                <option value="Kuliner">Kuliner</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Hobi">Hobi</option>
                <option value="Bisnis">Bisnis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-700">Privasi</label>
              <div className="space-y-3">
                <label className="flex items-center p-4 bg-gray-50 rounded-[15px] cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy === 'public'}
                    onChange={(e) => setFormData({...formData, privacy: e.target.value})}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Publik</div>
                    <div className="text-sm text-gray-600">Siapa saja dapat bergabung</div>
                  </div>
                </label>
                <label className="flex items-center p-4 bg-gray-50 rounded-[15px] cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === 'private'}
                    onChange={(e) => setFormData({...formData, privacy: e.target.value})}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Privat</div>
                    <div className="text-sm text-gray-600">Memerlukan persetujuan admin</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border__primary rounded-[20px] text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCreating || !formData.name || !formData.description}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-[20px] font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {isCreating ? 'Membuat...' : 'Buat Komunitas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}