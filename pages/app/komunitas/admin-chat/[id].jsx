/* eslint-disable no-console */
import { faArrowLeft, faComments, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import { resolveUserImageUrl } from '../../../../helpers/image.helpers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const apiJoin = (path = "") => {
  const base = API_BASE.replace(/\/+$/, "");
  const ensured = /\/api$/i.test(base) ? base : `${base}/api`;
  return `${ensured}/${String(path).replace(/^\/+/, "")}`;
};

export default function CommunityMitraChatList() {
  const router = useRouter();
  const { id } = router.query; // communityId
  const [loading, setLoading] = useState(true);
  const [mitraUsers, setMitraUsers] = useState([]);
  const [community, setCommunity] = useState(null);

  const token = useMemo(() => {
    const enc = Cookies.get(token_cookie_name);
    return enc ? Decrypt(enc) : '';
  }, []);

  useEffect(() => {
    if (!id || !token) return;
    const fetchCommunityAndMitraUsers = async () => {
      try {
        setLoading(true);

        // 🔹 Ambil detail komunitas
        const resCommunity = await fetch(apiJoin(`communities/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const jsonCommunity = await resCommunity.json();
        const communityData = jsonCommunity.data || jsonCommunity;
        setCommunity(communityData);

        // 🔹 Ambil anggota dari corporate (mitra)
        const corporateId = communityData?.corporate_id || communityData?.corporate?.id;
        if (!corporateId) {
          console.warn('Community has no corporate linked.');
          setMitraUsers([]);
          return;
        }

        const resCorporateUsers = await fetch(apiJoin(`admin/corporates/${corporateId}/user`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const jsonCorporateUsers = await resCorporateUsers.json();

        // Pastikan bentuk datanya array
        const users = Array.isArray(jsonCorporateUsers.data)
          ? jsonCorporateUsers.data.map((item) => ({
            id: item.user?.id || item.id,
            name: item.user?.name || item.name,
            email: item.user?.email || item.email,
            phone: item.user?.phone || item.phone,
            avatar: item.user?.picture_source || item.picture_source,
            role: item.role?.name || 'Anggota Mitra',
          }))
          : [];

        // 🔹 Hapus diri sendiri biar gak chat ke diri sendiri
        const resMe = await fetch(apiJoin('me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const me = await resMe.json();
        const currentUserId = me?.id || me?.data?.id;

        const filtered = users.filter((u) => u.id !== currentUserId);
        setMitraUsers(filtered);
      } catch (err) {
        console.error('Gagal ambil data mitra:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunityAndMitraUsers();
  }, [id, token]);

  const handleChat = (targetId, targetName) => {
    router.push(`/app/pesan/${targetId}?communityId=${id}&targetName=${encodeURIComponent(targetName)}`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat anggota mitra...</p>
      </div>
    );

  return (
    <div className="bg-gradient-to-br from-cyan-50 min-h-screen">
      {/* Header */}
      <div className="p-4 flex items-center bg-primary text-white">
        <button onClick={() => router.back()} className="mr-3">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className="font-semibold text-lg flex-1">
          Chat Mitra {community?.name}
        </h1>
      </div>

      {/* Daftar anggota mitra */}
      <div className="p-4">
        {mitraUsers.length ? (
          mitraUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleChat(user.id, user.name)}
              className="bg-white rounded-xl p-3 mb-3 shadow hover:scale-[1.02] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveUserImageUrl({ picture_source: user.avatar }) || '/avatar.jpg'}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faUserCircle}
                      className="text-blue-500 text-xl"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.role}</p>
                  <p className="text-xs text-gray-400">{user.phone || user.email}</p>
                </div>
                <FontAwesomeIcon
                  icon={faComments}
                  className="text-blue-500 text-sm"
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-600">
            Tidak ada anggota mitra yang bisa di-chat.
          </div>
        )}
      </div>
    </div>
  );
}
