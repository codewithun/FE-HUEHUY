import {
  faArrowLeft,
  faSearch
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

  // Demo data dengan lebih banyak komunitas
  const [myCommunitiesData] = useState([
    {
      id: 1,
      name: 'dbotanica Bandung',
      description: 'Mall perbelanjaan standar dengan beragam toko dan tempat kuliner menarik',
      members: 1234,
      category: 'Shopping',
      isOwner: false,
      isAdmin: true,
      privacy: 'public',
      activePromos: 8,
      isVerified: true,
      avatar: '/api/placeholder/50/50'
    },
    {
      id: 2,
      name: 'Sunscape Event Organizer',
      description: 'Sunscape Event Organizer adalah penyelenggara acara profesional',
      members: 856,
      category: 'Event',
      isOwner: true,
      isAdmin: true,
      privacy: 'private',
      activePromos: 12,
      isVerified: false,
      avatar: '/api/placeholder/50/50'
    },
    {
      id: 3,
      name: 'Kuliner Bandung Selatan',
      description: 'Komunitas pecinta kuliner area Bandung Selatan dan sekitarnya',
      members: 2341,
      category: 'Kuliner',
      isOwner: false,
      isAdmin: false,
      privacy: 'public',
      activePromos: 15,
      isVerified: true,
      avatar: '/api/placeholder/50/50'
    },
    {
      id: 4,
      name: 'Otomotif Enthusiast',
      description: 'Komunitas penggemar otomotif, modifikasi, dan spare part',
      members: 892,
      category: 'Otomotif',
      isOwner: false,
      isAdmin: true,
      privacy: 'public',
      activePromos: 6,
      isVerified: false,
      avatar: '/api/placeholder/50/50'
    },
    {
      id: 5,
      name: 'Fashion & Style Bandung',
      description: 'Komunitas fashion, style, dan shopping outfit terkini',
      members: 1567,
      category: 'Fashion',
      isOwner: false,
      isAdmin: false,
      privacy: 'public',
      activePromos: 22,
      isVerified: true,
      avatar: '/api/placeholder/50/50'
    }
  ]);

  const [allCommunitiesData] = useState([
    ...myCommunitiesData,
    {
      id: 6,
      name: 'Photography Enthusiast',
      description: 'Komunitas fotografi untuk sharing tips dan teknik photography',
      members: 1890,
      category: 'Hobi',
      isJoined: false,
      privacy: 'public',
      activePromos: 4,
      isVerified: false,
      avatar: '/api/placeholder/50/50'
    },
    {
      id: 7,
      name: 'Business Network Club',
      description: 'Komunitas eksklusif untuk networking bisnis dan profesional',
      members: 234,
      category: 'Bisnis',
      isJoined: false,
      privacy: 'private',
      activePromos: 15,
      isVerified: true,
      avatar: '/api/placeholder/50/50'
    },
    {
      id: 8,
      name: 'Fitness & Health Community',
      description: 'Komunitas kesehatan, fitness, dan gaya hidup sehat',
      members: 987,
      category: 'Kesehatan',
      isJoined: false,
      privacy: 'public',
      activePromos: 7,
      isVerified: false,
      avatar: '/api/placeholder/50/50'
    },
    {
      id: 9,
      name: 'Tech Startup Bandung',
      description: 'Komunitas startup teknologi dan digital di Bandung',
      members: 445,
      category: 'Teknologi',
      isJoined: false,
      privacy: 'private',
      activePromos: 3,
      isVerified: true,
      avatar: '/api/placeholder/50/50'
    },
    {
      id: 10,
      name: 'Traveling Backpacker',
      description: 'Komunitas traveler dan backpacker untuk sharing destinasi',
      members: 1678,
      category: 'Travel',
      isJoined: false,
      privacy: 'public',
      activePromos: 9,
      isVerified: false,
      avatar: '/api/placeholder/50/50'
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

  // Function untuk handle buka komunitas - redirect langsung ke dashboard
  const handleOpenCommunity = (communityId) => {
    router.push(`/app/komunitas/dashboard/${communityId}`);
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
          {/* Header Banner dengan ilustrasi 3D style - IMPROVED */}
          <div className="w-full bg-primary relative overflow-hidden">
            {/* Background decoration - lebih subtle */}
            <div className="absolute inset-0">
              <div className="absolute top-4 right-4 w-16 h-16 bg-cyan-400 rounded-full opacity-15"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 bg-teal-300 rounded-full opacity-10"></div>
              <div className="absolute top-12 left-1/4 w-8 h-8 bg-cyan-300 rounded-full opacity-15"></div>
            </div>
            
            <div className="relative px-4 py-6 text-white">
              {/* Header dengan back button dan create button */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Link href="/app">
                    <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
                  </Link>
                  <h1 className="text-xl font-bold">Komunitas</h1>
                </div>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white text-primary px-4 py-2 rounded-full font-medium text-sm hover:bg-gray-100 transition-all duration-300 shadow-sm"
                >
                  Buat Komunitas
                </button>
              </div>

              {/* Ilustrasi area dengan 3D characters - IMPROVED */}
              <div className="flex items-center justify-center py-6 relative">
                {/* Central illustration placeholder - 3 characters with speech bubbles */}
                <div className="flex items-center gap-3">
                  {/* Character 1 */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-8 h-8 bg-orange-200 rounded-full"></div>
                    </div>
                    <div className="absolute -top-6 -left-1 bg-white text-primary px-2 py-1 rounded-lg text-xs shadow-sm">
                      💬
                    </div>
                  </div>
                  
                  {/* Character 2 (center with ADS badge) */}
                  <div className="relative">
                    <div className="w-18 h-18 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-12 h-12 bg-blue-200 rounded-full"></div>
                    </div>
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                      ADS
                    </div>
                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-primary px-2 py-1 rounded-lg text-xs shadow-sm">
                      👑
                    </div>
                  </div>
                  
                  {/* Character 3 */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                    </div>
                    <div className="absolute -top-6 -right-1 bg-white text-primary px-2 py-1 rounded-lg text-xs shadow-sm">
                      📋
                    </div>
                  </div>
                </div>
                
                {/* Floating elements - lebih kecil dan subtle */}
                <div className="absolute top-2 left-6 bg-blue-400 text-white p-1.5 rounded-lg text-xs shadow-sm">
                  👍
                </div>
                <div className="absolute bottom-2 right-6 bg-green-400 text-white p-1.5 rounded-lg text-xs shadow-sm">
                  📢
                </div>
              </div>

              {/* Tagline - Clean dan Simple */}
              <div className="text-center mt-6 mb-4">
                <p className="text-lg font-semibold text-white drop-shadow-md">
                  Lebih mudah berbagi promo sesama anggota komunitas
                </p>
              </div>
            </div>
          </div>

          {/* Content area - matching background gradient */}
          <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
            <div className="relative -top-5 px-4">
              {/* Search Bar - matching style from index */}
              <div className="mb-6">
                <div className="w-full bg-white border border__primary px-6 py-4 rounded-[20px] flex justify-between items-center shadow-sm">
                  <input
                    type="text"
                    placeholder="Cari komunitas?..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none bg-transparent"
                  />
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="text__primary" 
                  />
                </div>
              </div>
            </div>

            {/* Content with proper padding */}
            <div className="px-4 pb-6">
              {/* Komunitasku section */}
              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-slate-900 text-lg font-semibold">Komunitasku</h2>
                  <p className="text-slate-600 text-sm">
                    {myCommunitiesData.length} komunitas yang kamu ikuti
                  </p>
                </div>

                {/* My Communities List */}
                <div className="space-y-3">
                  {myCommunitiesData.map((community) => (
                    <CommunityCard 
                      key={community.id} 
                      community={community} 
                      type="joined"
                      onOpenCommunity={handleOpenCommunity}
                      formatNumber={formatNumber}
                    />
                  ))}
                </div>
              </div>

              {/* Komunitas Lainnya section */}
              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-slate-900 text-lg font-semibold">Komunitas Lainnya</h2>
                  <p className="text-slate-600 text-sm">
                    Temukan komunitas baru yang menarik
                  </p>
                </div>

                {/* Other Communities List */}
                <div className="space-y-3">
                  {notJoinedCommunitiesData.map((community) => (
                    <CommunityCard 
                      key={community.id} 
                      community={community} 
                      type="notJoined"
                      onOpenCommunity={handleOpenCommunity}
                      formatNumber={formatNumber}
                    />
                  ))}
                </div>
              </div>
            </div>
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

// Community Card Component - IMPROVED dengan type untuk membedakan joined/notJoined
function CommunityCard({ community, type, onOpenCommunity, formatNumber }) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinCommunity = async (e) => {
    e.stopPropagation(); // Prevent opening community when clicking join button
    setIsJoining(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsJoining(false);
    // In real app, this would update the community join status
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Shopping': 'bg-purple-100 text-purple-800',
      'Event': 'bg-blue-100 text-blue-800',
      'Kuliner': 'bg-orange-100 text-orange-800',
      'Otomotif': 'bg-gray-100 text-gray-800',
      'Fashion': 'bg-pink-100 text-pink-800',
      'Hobi': 'bg-green-100 text-green-800',
      'Bisnis': 'bg-indigo-100 text-indigo-800',
      'Kesehatan': 'bg-red-100 text-red-800',
      'Teknologi': 'bg-cyan-100 text-cyan-800',
      'Travel': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className="bg-white bg-opacity-60 backdrop-blur-sm rounded-[15px] p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={() => onOpenCommunity(community.id)}
    >
      <div className="flex gap-3">
        {/* Community Avatar */}
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {community.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Community Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-slate-900 text-sm truncate pr-2">
              {community.name}
            </h3>
            <div className="flex items-center gap-2">
              {community.isVerified && (
                <span className="text-blue-500 text-xs">✓</span>
              )}
              {community.privacy === 'private' && (
                <span className="text-gray-400 text-xs">🔒</span>
              )}
            </div>
          </div>
          
          <p className="text-slate-600 text-xs leading-relaxed mb-2">
            {community.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(community.category)}`}>
              {community.category}
            </span>
            
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{formatNumber(community.members)} anggota</span>
              {type === 'joined' ? (
                <span className="text-primary font-medium">{community.activePromos} promo</span>
              ) : (
                <button
                  onClick={handleJoinCommunity}
                  disabled={isJoining}
                  className="bg-primary text-white px-3 py-1 rounded-full font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isJoining ? 'Bergabung...' : 'Gabung'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Community Modal - tetap sama
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
                <option value="Shopping">Shopping</option>
                <option value="Event">Event</option>
                <option value="Kuliner">Kuliner</option>
                <option value="Otomotif">Otomotif</option>
                <option value="Fashion">Fashion</option>
                <option value="Hobi">Hobi</option>
                <option value="Bisnis">Bisnis</option>
                <option value="Kesehatan">Kesehatan</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Travel">Travel</option>
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