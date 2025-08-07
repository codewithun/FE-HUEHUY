import {
  faArrowLeft,
  faCalendarAlt,
  faCrown,
  faEye,
  faGlobe,
  faLock,
  faPlus,
  faSearch,
  faUserFriends,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';

export default function Komunitas() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('semua'); // semua, komunitasku, belum-gabung
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Demo data
  const [myCommunitiesData] = useState([
    {
      id: 1,
      name: 'Event Curiosity 2024',
      description: 'Komunitas peserta Event Curiosity',
      members: 1234,
      category: 'Event',
      image: '/images/community1.jpg',
      isOwner: false,
      isAdmin: true,
      joinedDate: '2024-01-15',
      lastActivity: '2 jam yang lalu',
      privacy: 'public',
      hasNewMessages: true
    },
    {
      id: 2,
      name: 'Foodie Lovers Jakarta',
      description: 'Komunitas pecinta kuliner di Jakarta',
      members: 856,
      category: 'Kuliner',
      image: '/images/community2.jpg',
      isOwner: true,
      isAdmin: true,
      joinedDate: '2024-02-01',
      lastActivity: '5 menit yang lalu',
      privacy: 'private',
      hasNewMessages: false
    }
  ]);

  const [allCommunitiesData] = useState([
    ...myCommunitiesData,
    {
      id: 3,
      name: 'Tech Startup Indonesia',
      description: 'Komunitas startup dan teknologi',
      members: 2456,
      category: 'Teknologi',
      image: '/images/community3.jpg',
      isJoined: false,
      privacy: 'public'
    },
    {
      id: 4,
      name: 'Photography Enthusiast',
      description: 'Komunitas fotografi untuk semua level',
      members: 1890,
      category: 'Hobi',
      image: '/images/community4.jpg',
      isJoined: false,
      privacy: 'public'
    },
    {
      id: 5,
      name: 'Exclusive VIP Club',
      description: 'Komunitas eksklusif untuk member premium',
      members: 234,
      category: 'Premium',
      image: '/images/community5.jpg',
      isJoined: false,
      privacy: 'private'
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app">
              <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Komunitas</h1>
              <p className="text-sm opacity-90">Temukan dan bergabung dengan komunitas</p>
            </div>
          </div>
          
          {/* Button Buat Komunitas */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-primary p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <FontAwesomeIcon icon={faPlus} className="text-lg" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="relative">
          <FontAwesomeIcon 
            icon={faSearch} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            placeholder="Cari komunitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'semua', label: 'Semua' },
            { key: 'komunitasku', label: 'Komunitasku' },
            { key: 'belum-gabung', label: 'Belum Gabung' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
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

      {/* Content */}
      <div className="px-4 py-4">
        {/* Stats Header */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{allCommunitiesData.length}</p>
              <p className="text-sm text-gray-600">Total Komunitas</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{myCommunitiesData.length}</p>
              <p className="text-sm text-gray-600">Tergabung</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{notJoinedCommunitiesData.length}</p>
              <p className="text-sm text-gray-600">Tersedia</p>
            </div>
          </div>
        </div>

        {/* Community List */}
        <div className="space-y-4">
          {filteredCommunities().map((community) => (
            <CommunityCard 
              key={community.id} 
              community={community} 
              activeTab={activeTab}
            />
          ))}
        </div>

        {filteredCommunities().length === 0 && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'Komunitas tidak ditemukan' : 'Belum ada komunitas'}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? 'Coba kata kunci lain' : 'Mulai dengan membuat komunitas baru'}
            </p>
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunityModal 
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Bottom Navigation */}
      <div className="pb-20">
        <BottomBarComponent active={'community'} />
      </div>
    </div>
  );
}

// Community Card Component
function CommunityCard({ community, activeTab }) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinCommunity = async () => {
    setIsJoining(true);
    // Simulasi API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsJoining(false);
    // Handle join logic
  };

  const getPrivacyIcon = (privacy) => {
    switch(privacy) {
      case 'private': return faLock;
      case 'public': return faGlobe;
      default: return faUsers;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex gap-4">
        {/* Community Avatar */}
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faUsers} className="text-white text-xl" />
        </div>

        {/* Community Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{community.name}</h3>
                <FontAwesomeIcon 
                  icon={getPrivacyIcon(community.privacy)} 
                  className="text-xs text-gray-400" 
                />
                {activeTab === 'komunitasku' && community.isOwner && (
                  <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-xs" />
                )}
                {activeTab === 'komunitasku' && community.hasNewMessages && (
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{community.description}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faUserFriends} />
                  <span>{community.members.toLocaleString()} member</span>
                </div>
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faEye} />
                  <span>{community.category}</span>
                </div>
                {activeTab === 'komunitasku' && (
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>{community.lastActivity}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="ml-3 flex-shrink-0">
              {activeTab === 'komunitasku' ? (
                <Link href={`/app/komunitas/${community.id}`}>
                  <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Buka
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleJoinCommunity}
                  disabled={isJoining}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
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

// Create Community Modal
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
    // Simulasi API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Buat Komunitas Baru</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Komunitas *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
                placeholder="Masukkan nama komunitas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deskripsi *</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
                placeholder="Deskripsikan komunitas Anda"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-primary"
              >
                <option value="">Pilih kategori</option>
                <option value="Event">Event</option>
                <option value="Kuliner">Kuliner</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Hobi">Hobi</option>
                <option value="Bisnis">Bisnis</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Privasi</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy === 'public'}
                    onChange={(e) => setFormData({...formData, privacy: e.target.value})}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Publik</div>
                    <div className="text-sm text-gray-600">Siapa saja bisa bergabung</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === 'private'}
                    onChange={(e) => setFormData({...formData, privacy: e.target.value})}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">Privat</div>
                    <div className="text-sm text-gray-600">Perlu persetujuan admin</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCreating || !formData.name || !formData.description}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
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