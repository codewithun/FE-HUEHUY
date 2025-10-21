/* eslint-disable no-console */
import { faArrowLeft, faComments, faShieldAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const apiJoin = (path = "") => {
  const base = API_BASE.replace(/\/+$/, "");
  const ensured = /\/api$/i.test(base) ? base : `${base}/api`;
  return `${ensured}/${String(path).replace(/^\/+/, "")}`;
};

export default function CommunityAdminChat() {
  const router = useRouter();
  const { id } = router.query; // communityId
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [community, setCommunity] = useState(null);

  const token = useMemo(() => {
    const enc = Cookies.get(token_cookie_name);
    return enc ? Decrypt(enc) : '';
  }, []);

  useEffect(() => {
    if (!id || !token) return;
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const resCommunity = await fetch(apiJoin(`communities/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const jsonCommunity = await resCommunity.json();
        const communityData = jsonCommunity.data || jsonCommunity;
        setCommunity(communityData);

        const corporateId = communityData.corporate_id || communityData.corporate?.id;
        let adminsPayload = [];

        if (corporateId) {
          const resCorp = await fetch(apiJoin(`admin/corporates/${corporateId}/user`), {
            headers: { Authorization: `Bearer ${token}` },
          });
          const jsonCorp = await resCorp.json();
          adminsPayload = Array.isArray(jsonCorp.data)
            ? jsonCorp.data.map((item) => ({
                id: item.user.id,
                name: item.user.name,
                email: item.user.email,
                phone: item.user.phone,
                avatar: item.user.picture_source,
                role: item.role?.name || 'Admin Mitra',
              }))
            : [];
        }

        // fallback global admin
        if (!adminsPayload.length) {
          const resAdmins = await fetch(apiJoin('admin/users?only_admin_contacts=true&paginate=all'), {
            headers: { Authorization: `Bearer ${token}` },
          });
          const jsonAdmins = await resAdmins.json();
          adminsPayload = jsonAdmins.data || [];
        }

        setAdmins(adminsPayload);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, [id, token]);

  const handleChat = (adminId, adminName) => {
    router.push(`/app/pesan/community-admin-${adminId}?communityId=${id}&adminName=${encodeURIComponent(adminName)}&type=admin`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat admin komunitas...</p>
      </div>
    );

  return (
    <div className="bg-gradient-to-br from-cyan-50 min-h-screen">
      <div className="p-4 flex items-center bg-primary text-white">
        <button onClick={() => router.back()} className="mr-3">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className="font-semibold text-lg flex-1">Chat Admin {community?.name}</h1>
      </div>

      <div className="p-4">
        {admins.length ? (
          admins.map((a) => (
            <div
              key={a.id}
              onClick={() => handleChat(a.id, a.name)}
              className="bg-white rounded-xl p-3 mb-3 shadow hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center">
                  {a.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={faUserCircle} className="text-blue-500 text-xl" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs text-gray-600">{a.role}</p>
                  <p className="text-xs text-gray-400">{a.phone || a.email}</p>
                </div>
                <FontAwesomeIcon icon={faComments} className="text-blue-500 text-sm" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-600">Belum ada admin terdaftar</div>
        )}
      </div>
    </div>
  );
}
