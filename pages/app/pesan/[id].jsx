/* eslint-disable no-console */
import { faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../helpers';
import { Decrypt } from '../../../helpers/encryption.helpers';
import { InputComponent, IconButtonComponent } from '../../../components/base.components';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const apiJoin = (path = "") => {
  const base = API_BASE.replace(/\/+$/, "");
  const ensured = /\/api$/i.test(base) ? base : `${base}/api`;
  return `${ensured}/${String(path).replace(/^\/+/, "")}`;
};

export default function ChatCommunityAdmin() {
  const router = useRouter();
  const isReady = router.isReady;
  const { communityId, adminName } = router.query;
  const rawId = router.query.id;

  // Jika URL `/app/pesan/community-admin-XX` -> adminId
  // Jika URL `/app/pesan/123` -> chatId
  const adminId = useMemo(() => {
    const v = String(rawId || '');
    return v.startsWith('community-admin-') ? v.replace('community-admin-', '') : null;
  }, [rawId]);

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const token = useMemo(() => {
    const enc = Cookies.get(token_cookie_name);
    return enc ? Decrypt(enc) : '';
  }, []);

  const fetchMessages = async (idToUse = chatId, isBackground = false) => {
    if (!idToUse) return;
    try {
      if (isBackground) {
        setRefreshing(true); // fetch diam-diam, tanpa "Memuat chat..."
      } else {
        setInitialLoading(true);
      }

      const res = await fetch(apiJoin(`admin/chat/${idToUse}/messages`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      // cuma update kalau beda, biar gak flicker
      setMessages((prev) => {
        const newMessages = json.data || [];
        if (JSON.stringify(prev) !== JSON.stringify(newMessages)) {
          return newMessages;
        }
        return prev;
      });
    } catch (err) {
      console.error('Gagal ambil chat:', err);
    } finally {
      if (isBackground) setRefreshing(false);
      else setInitialLoading(false);
    }
  };

  // Coba temukan/buat room agar dapat chatId ketika masuk via community-admin-XX
  const resolveChatRoom = async () => {
    if (!adminId || !communityId) return null;
    try {
      setInitialLoading(true);
      const res = await fetch(apiJoin('admin/chat/resolve'), { // TODO: sesuaikan path
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiver_id: Number(adminId),
          receiver_type: 'admin',
          community_id: communityId,
        }),
      });
      const json = await res.json();
      const id = json?.chat?.id || json?.data?.id;
      if (id) setChatId(id);
      return id || null;
    } catch (e) {
      console.error('Gagal resolve room:', e);
      return null;
    } finally {
      setInitialLoading(false);
    }
  };

  // Tentukan sumber chatId: dari URL angka, atau resolve dari adminId+communityId
  useEffect(() => {
    if (!isReady || !token) return;
    const v = String(rawId || '');
    if (/^\d+$/.test(v)) {
      setInitialLoading(true);
      setChatId(Number(v));
    } else {
      // masuk via community-admin-XX -> coba resolve chat room
      resolveChatRoom().then((id) => {
        if (!id) setInitialLoading(false); // tidak ada room -> tampil "Belum ada pesan"
      });
    }
  }, [isReady, rawId, adminId, communityId, token]);

  // Fetch pertama + polling berkala ketika sudah punya chatId
  useEffect(() => {
    if (!chatId) return;
    fetchMessages(chatId);
    const itv = setInterval(() => fetchMessages(chatId, true), 5000);
    return () => clearInterval(itv);
  }, [chatId, token]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      const res = await fetch(apiJoin('admin/chat/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiver_id: Number(adminId),
          receiver_type: 'admin',
          community_id: communityId,
          message: message.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setChatId(json.chat.id);
        setMessages((prev) => [...prev, json.message]);
        setMessage('');
        // pastikan state sinkron
        fetchMessages(json.chat.id, true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-primary text-white">
        <button onClick={() => router.back()}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className="font-semibold text-lg">Admin {adminName}</h1>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {initialLoading ? (
          <p className="text-center text-gray-500 mt-10">Memuat chat...</p>
        ) : messages.length ? (
          messages.map((m) => (
            <div key={m.id} className={`mb-3 flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${m.sender_type === 'admin'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
              >
                {m.message}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 mt-10">Belum ada pesan</p>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white flex gap-2 items-center border-t">
        <InputComponent
          placeholder="Tulis pesan..."
          onChange={(v) => setMessage(v)}
          value={message}
        />
        <IconButtonComponent
          icon={faPaperPlane}
          size="lg"
          onClick={sendMessage}
        />
      </div>
    </div>
  );
}
