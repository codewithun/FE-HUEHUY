import {
  faArrowLeft,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import Cookies from "js-cookie";
import { token_cookie_name } from "../../../helpers";
import { Decrypt } from "../../../helpers/encryption.helpers";

export default function Komunitas() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Ganti data dummy dengan fetch API
  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : "";
        // Perbaiki endpoint agar tidak double /api
        const res = await fetch(`${apiUrl}/admin/communities`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setCommunities(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setCommunities([]);
      }
      setLoading(false);
    };
    fetchCommunities();
  }, []);

  // Filter communities sesuai tab dan pencarian
  const filteredCommunities = () => {
    let data = communities;
    if (activeTab === 'komunitasku') {
      data = data.filter(c => c.isJoined); // sesuaikan dengan field backend
    } else if (activeTab === 'belum-gabung') {
      data = data.filter(c => !c.isJoined);
    }
    if (searchQuery) {
      data = data.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.category || '').toLowerCase().includes(searchQuery.toLowerCase())
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
    if (!isClient) return num ? num.toString() : "0";
    if (typeof num !== "number") return "0";
    return num.toLocaleString('id-ID');
  };

  const notJoinedCommunities = communities.filter(c => !c.isJoined);

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
              {/* Tab navigation */}
              <div className="flex mb-4 border-b border-slate-200">
                <button 
                  className={`px-4 py-2 ${activeTab === 'semua' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('semua')}
                >
                  Semua
                </button>
                <button 
                  className={`px-4 py-2 ${activeTab === 'komunitasku' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('komunitasku')}
                >
                  Komunitasku
                </button>
                <button 
                  className={`px-4 py-2 ${activeTab === 'belum-gabung' ? 'text-primary font-semibold border-b-2 border-primary' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('belum-gabung')}
                >
                  Belum Gabung
                </button>
              </div>

              {/* Communities List */}
              {/* Show recommended communities section only when viewing all or joined communities */}
              

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
                  {loading ? (
                    <div>Loading komunitas...</div>
                  ) : (
                    filteredCommunities().map((community) => (
                      <CommunityCard 
                        key={community.id} 
                        community={community} 
                        type={community.isJoined ? 'joined' : 'notJoined'}
                        onOpenCommunity={handleOpenCommunity}
                        formatNumber={formatNumber}
                      />
                    ))
                  )}
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