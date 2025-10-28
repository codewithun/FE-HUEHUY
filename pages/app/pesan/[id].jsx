/* eslint-disable no-console */
import { faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
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

export default function ChatUniversal() {
  const router = useRouter();
  const isReady = router.isReady;
  const { communityId, targetName } = router.query;
  const rawId = router.query.id; // ini bisa userId / chatId

  const [chatId, setChatId] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);

  const token = useMemo(() => {
    const enc = Cookies.get(token_cookie_name);
    return enc ? Decrypt(enc) : '';
  }, []);
  
  // ======= START CHANGED: ambil current user & isMine =======
  const [currentUser, setCurrentUser] = useState(null);

  // ambil data user login
  useEffect(() => {
    if (!token) return;
    fetch(apiJoin('me'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setCurrentUser(data))
      .catch((e) => console.error('Gagal ambil user info:', e));
  }, [token]);

  const isMine = (m) => {
    if (!currentUser) return false;
    return Number(m.sender_id) === Number(currentUser.id);
  };
  // ======= END CHANGED =======

  /** ===============================
   *  Fetch pesan dalam room chat
   *  =============================== */
  const fetchMessages = async (idToUse = chatId, silent = false) => {
    if (!idToUse) return false;
    try {
      if (!silent) setLoading(true);
      const res = await fetch(apiJoin(`chat/${idToUse}/messages`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // gagal ambil (mis. 404) -> indicate failure
        return false;
      }
      const json = await res.json();
      setMessages(json.data || []);
      return true;
    } catch (err) {
      console.error('Gagal ambil chat:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** ===============================
   *  Resolve / buat chat room baru
   *  =============================== */
  const resolveChat = async (targetId) => {
    if (!targetId) return null;
    try {
      const res = await fetch(apiJoin('chat/resolve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: Number(targetId),
          community_id: communityId || null,
        }),
      });
      const json = await res.json();
      const id = json?.chat?.id || json?.data?.id;
      if (id) {
        setChatId(id);
        setReceiverId(Number(targetId));
      }
      return id || null;
    } catch (e) {
      console.error('Gagal resolve chat:', e);
      return null;
    }
  };

  /** ===============================
   *  Tentukan apakah URL itu chatId atau receiverId
   *  =============================== */
  useEffect(() => {
    if (!isReady || !token) return;
    const v = String(rawId || '');
    if (!v) {
      setLoading(false);
      return;
    }

    if (/^\d+$/.test(v)) {
      const numeric = Number(v);
      // coba anggap sebagai chatId dulu
      fetchMessages(numeric).then((ok) => {
        if (ok) {
          setChatId(numeric);
        } else {
          // bukan chatId, treat sebagai receiverId dan resolve
          setReceiverId(numeric);
          resolveChat(numeric).then((id) => {
            if (id) fetchMessages(id);
            else setLoading(false);
          });
        }
      });
    } else {
      // bukan angka -> kemungkinan slug / special id -> stop loading
      setLoading(false);
    }
  }, [isReady, rawId, token]);

  /** ===============================
   *  Polling pesan setiap 5 detik
   *  =============================== */
  useEffect(() => {
    if (!chatId) return;
    fetchMessages(chatId);
    const itv = setInterval(() => fetchMessages(chatId, true), 5000);
    return () => clearInterval(itv);
  }, [chatId, token]);

  // auto scroll ke bawah saat messages berubah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  /** ===============================
   *  Kirim pesan
   *  =============================== */
  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      const payload = {
        message: message.trim(),
        community_id: communityId || null,
      };
      // prefer receiver_id jika tersedia, else sertakan chat_id jika ada
      if (receiverId) payload.receiver_id = Number(receiverId);
      else if (chatId) payload.chat_id = Number(chatId);

      const res = await fetch(apiJoin('chat/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        // langsung push pesan tanpa reload
        setMessages((prev) => [
          ...prev,
          {
            ...json.message,
            created_at: json.message?.created_at ?? new Date().toISOString(),
          },
        ]);
        setMessage('');
        // set chatId jika backend mengembalikannya
        if (json.chat?.id) setChatId(json.chat.id);
        // sinkronkan fetch singkat
        if (json.chat?.id) fetchMessages(json.chat.id, true);
      } else {
        console.error('Gagal kirim pesan, respon:', json);
      }
    } catch (err) {
      console.error('Gagal kirim pesan:', err);
    }
  };

  const formatTime = (t) => {
    const d = t ? new Date(t) : new Date();
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  /** ===============================
   *  Tampilan UI
   *  =============================== */
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-primary text-white">
        <button onClick={() => router.back()}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className="font-semibold text-lg">
          {targetName ? `Chat dengan ${targetName}` : 'Pesan'}
        </h1>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-gray-500 mt-10">Memuat chat...</p>
        ) : messages.length ? (
          messages.map((m) => {
            const mine = isMine(m);
            const time = formatTime(m.created_at || m.createdAt || m.timestamp || m.sent_at);
            return (
              <div
                key={m.id ?? m._id ?? `${m.message}-${time}`}
                className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    mine
                      ? 'bg-green-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.message}</div>
                  <div
                    className={`mt-1 text-[10px] opacity-80 ${mine ? 'text-right' : 'text-left'}`}
                  >
                    {time}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 mt-10">Belum ada pesan</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        className="p-3 bg-white flex gap-2 items-center border-t"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <div className="flex-1">
          <InputComponent
            placeholder="Tulis pesan..."
            onChange={(v) => setMessage(v)}
            value={message}
          />
        </div>
        <IconButtonComponent
          icon={faPaperPlane}
          size="lg"
          onClick={sendMessage}
          className="bg-green-700 text-white"
        />
      </form>
    </div>
  );
}
