/* eslint-disable no-console */
import { faArrowLeft, faComments, faShieldAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

// Helper untuk API
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiJoin = (path = "") => {
  const base = API_BASE.replace(/\/+$/, "");
  const ensured = /\/api$/i.test(base) ? base : `${base}/api`;
  return `${ensured}/${String(path).replace(/^\/+/, "")}`;
};

// util kecil: pastikan array id unik & angka
const normalizeIds = (arr) =>
  Array.from(
    new Set(
      (Array.isArray(arr) ? arr : [])
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0)
    )
  );

export default function CommunityAdminChat() {
  const router = useRouter();
  const { id } = router.query;
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // State komunitas
  const [communityData, setCommunityData] = useState({
    id: null,
    name: '',
    description: '',
    members: 0,
    admin_contact_ids: [],
  });

  // State admin list final
  const [adminList, setAdminList] = useState([]);

  useEffect(() => setIsClient(true), []);

  // Ambil token sekali
  const token = useMemo(() => {
    const encryptedToken = Cookies.get(token_cookie_name);
    return encryptedToken ? Decrypt(encryptedToken) : "";
  }, []);

  // Helper description
  const getAdminDescription = (roleName) => {
    switch ((roleName || '').toLowerCase()) {
      case 'admin':
        return 'Administrator Komunitas';
      case 'manager tenant':
      case 'manager_tenant':
        return 'Manager Tenant';
      default:
        return 'Admin Komunitas';
    }
  };

  useEffect(() => {
    if (!id || !isClient) return;

    const fetchCommunityAndAdmins = async () => {
      setLoading(true);
      try {
        // 1) DETAIL KOMUNITAS
        const communityRes = await fetch(apiJoin(`communities/${id}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!communityRes.ok) throw new Error('Failed to fetch community');

        const communityJson = await communityRes.json();
        const community = communityJson.data || communityJson;

        // dukung beberapa kemungkinan field
        const adminIds = normalizeIds(
          community.admin_contact_ids ??
          (Array.isArray(community.admin_contacts) ? community.admin_contacts.map((x) => x?.id) : []) ??
          []
        );

        setCommunityData({
          id: community.id,
          name: community.name || 'Komunitas',
          description: community.description || '',
          members: Number(community.members ?? community.members_count ?? 0) || 0,
          admin_contact_ids: adminIds,
        });

        // 2) COBA AMBIL DARI ENDPOINT SPESIFIK KOMUNITAS (kalau ada)
        let adminsPayload = null;
        try {
          const adminRes = await fetch(apiJoin(`communities/${id}/admins`), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          if (adminRes.ok) {
            const adminJson = await adminRes.json();
            adminsPayload = Array.isArray(adminJson?.data)
              ? adminJson.data
              : Array.isArray(adminJson)
              ? adminJson
              : [];
          }
        } catch (_) {
          // kalau 404/405 ya lanjut fallback
        }

        if (!adminsPayload) {
          // 3) FALLBACK: ambil semua admin contacts (admin + manager tenant)
          const allAdminRes = await fetch(
            apiJoin('admin/users?only_admin_contacts=true&paginate=all'),
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const allAdminJson = await allAdminRes.json();
          const allContacts = Array.isArray(allAdminJson?.data)
            ? allAdminJson.data
            : Array.isArray(allAdminJson)
            ? allAdminJson
            : [];

          // Jika komunitas punya admin_contact_ids → filter berdasarkan IDs
          if (adminIds.length > 0) {
            adminsPayload = allContacts.filter((u) => adminIds.includes(Number(u.id)));
          } else {
            // Kalau nggak ada admin_contact_ids, tampilkan semua contacts (biar gak kosong)
            adminsPayload = allContacts;
          }
        }

        // 4) FORMAT untuk UI
        const formattedAdmins = (adminsPayload || []).map((admin) => ({
          id: admin.id,
          name: admin.name,
          role: admin.role?.name || 'Admin',
          description: getAdminDescription(admin.role?.name),
          phone: admin.phone,
          email: admin.email,
          avatar: admin.avatar || admin.picture_source || null,
        }));

        setAdminList(formattedAdmins);
      } catch (e) {
        console.error('Failed to fetch community/admins:', e);
        setCommunityData({
          id: Number(id) || null,
          name: 'Komunitas',
          description: 'Deskripsi komunitas tidak tersedia',
          members: 0,
          admin_contact_ids: [],
        });
        setAdminList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityAndAdmins();
  }, [id, isClient, token]);

  const handleChatWithAdmin = (adminId, adminName) => {
    router.push(
      `/app/pesan/community-admin-${adminId}?communityId=${id}&adminName=${encodeURIComponent(
        adminName
      )}&type=admin`
    );
  };

  const handleBack = () => {
    router.push(`/app/komunitas/profile/profile_id?id=${id}`);
  };

  if (!isClient || loading) {
    return (
      <div className="lg:mx-auto lg:relative lg:max-w-md bg-gradient-to-br from-cyan-50 min-h-screen">
        <div className="container mx-auto relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data admin...</p>
          </div>
        </div>
      </div>
    );
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
                    {adminList.length} Admin siap membantu Anda
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
            {adminList.length > 0 ? (
              <div className="space-y-3">
                {adminList.map((admin) => (
                  <div
                    key={admin.id}
                    onClick={() => handleChatWithAdmin(admin.id, admin.name)}
                    className="cursor-pointer"
                  >
                    <div className="bg-white rounded-xl p-4 shadow-neuro hover:scale-[1.01] transition-all duration-300">
                      <div className="flex items-center gap-4">
                        {/* Avatar (opsional) */}
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
                          {admin.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={admin.avatar} alt={admin.name} className="w-full h-full object-cover" />
                          ) : (
                            <FontAwesomeIcon icon={faUserCircle} className="text-blue-400 text-xl" />
                          )}
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

                          {(admin.phone || admin.email) && (
                            <p className="text-slate-500 text-xs">
                              {admin.phone || admin.email}
                            </p>
                          )}
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
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faUserCircle} className="text-gray-400 text-2xl" />
                </div>
                <h4 className="font-medium text-slate-800 mb-2">Tidak Ada Admin Tersedia</h4>
                <p className="text-slate-600 text-sm">
                  Belum ada admin yang ditugaskan untuk komunitas ini.
                </p>
              </div>
            )}

            {/* Info section */}
            <div className="mt-6 bg-blue-50 rounded-xl p-4 shadow-neuro-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <FontAwesomeIcon icon={faUserCircle} className="text-blue-600 text-sm" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 text-sm mb-1">Tentang Chat Admin</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Admin komunitas siap membantu Anda dengan pertanyaan, saran, atau masalah terkait komunitas {communityData.name}.
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
