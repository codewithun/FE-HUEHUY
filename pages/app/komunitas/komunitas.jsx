/* eslint-disable no-console */

import {
  faArrowLeft,
  faCheckCircle,
  faClock,
  faGlobe,
  faLock,
  faPlus,
  faSearch,
  faTags,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from "js-cookie";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import FlexibleNotification from '../../../components/construct.components/notification/FlexibleNotification';

import { token_cookie_name } from "../../../helpers";
import { Decrypt } from "../../../helpers/encryption.helpers";

/* =========================================
   API BASE
========================================= */

const getApiBase = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  return baseUrl.replace(/\/api\/?$/, "");
};

/* =========================================
   AUTH
========================================= */

const getAuthHeaders = () => {
  const encryptedToken = Cookies.get(token_cookie_name);

  const token = encryptedToken
    ? Decrypt(encryptedToken)
    : "";

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
};

/* =========================================
   LOGO URL
========================================= */

const buildLogoUrl = (apiUrl, logo) => {
  if (!logo) return null;

  if (/^https?:\/\//i.test(logo)) {
    return logo;
  }

  const clean = String(logo)
    .replace(/^\/+/, "")
    .replace(/^storage\//, "");

  return `${apiUrl}/storage/${clean}`;
};

/* =========================================
   NORMALIZE
========================================= */

const extractList = (raw) => {
  if (Array.isArray(raw)) return raw;

  const candidates = [
    raw?.data,
    raw?.data?.data,
    raw?.communities,
    raw?.data?.communities,
    raw?.community,
    raw?.data?.community,
    raw?.user_communities,
    raw?.data?.user_communities,
    raw?.joined_communities,
    raw?.data?.joined_communities,
    raw?.memberships,
    raw?.data?.memberships,
    raw?.member_requests,
    raw?.data?.member_requests,
    raw?.requests,
    raw?.data?.requests,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }

  return [];
};

const normalizeCommunities = (raw) => {
  console.log("RAW API:", raw);

  const list = extractList(raw);

  console.log("FINAL LIST:", list);

  return list.map((item) => {
    const c =
      item?.community ||
      item?.communities ||
      item?.komunitas ||
      item;

    const privacyRaw =
      c.privacy ||
      c.world_type ||
      c.type ||
      "public";

    const privacyString =
      String(privacyRaw || "").toLowerCase();

    let privacy =
      privacyString === "pribadi"
        ? "private"
        : privacyString || "public";

    const isPrivateFlag =
      c.is_private ?? c.private;

    if (typeof isPrivateFlag !== "undefined") {
      if (Boolean(Number(isPrivateFlag)) || isPrivateFlag === true) {
        privacy = "private";
      }
    }

    const statusRaw =
      item.status ||
      item.member_status ||
      item.request_status ||
      c.status ||
      "";

    const status =
      String(statusRaw || "").toLowerCase();

    const isJoinedRaw =
      c.isJoined ??
      c.is_joined ??
      item.isJoined ??
      item.is_joined ??
      item.joined ??
      false;

    const hasRequestedRaw =
      c.hasRequested ??
      c.has_requested ??
      c.requestPending ??
      item.hasRequested ??
      item.has_requested ??
      item.requestPending ??
      false;

    const id =
      c.id ??
      item.community_id ??
      item.komunitas_id ??
      item.id;

    return {
      id: Number(id),

      name:
        c.name ||
        c.title ||
        "Tanpa Nama",

      description:
        c.description ||
        c.desc ||
        "",

      category:
        c.category ||
        c.category_name ||
        "Umum",

      logo:
        c.logo ||
        c.image ||
        c.photo ||
        null,

      bg_color_1:
        c.bg_color_1 || "#0b2e13",

      bg_color_2:
        c.bg_color_2 || "#14532d",

      privacy,

      isVerified:
        Boolean(
          c.isVerified ||
          c.is_verified
        ),

      isJoined:
        Boolean(isJoinedRaw) ||
        status === "approved" ||
        status === "accepted" ||
        status === "joined" ||
        status === "active" ||
        status === "member",

      hasRequested:
        Boolean(hasRequestedRaw) ||
        status === "pending" ||
        status === "waiting" ||
        status === "requested",

      members:
        Number(
          c.members ||
          c.member_count ||
          c.total_members ||
          0
        ),

      activePromos:
        Number(
          c.activePromos ||
          c.active_promos ||
          0
        ),

      is_active: true,
    };
  }).filter((c) => c.id && !Number.isNaN(c.id));
};

/* =========================================
   FETCH COMMUNITIES
========================================= */

const fetchCommunitiesAPI = async () => {
  const apiUrl = getApiBase();
  const headers = getAuthHeaders();

  const fetchJson = async (url) => {
    try {
      console.log("FETCH:", url);

      const res = await fetch(url, { headers });

      console.log("STATUS:", res.status, url);

      if (!res.ok) return null;

      const json = await res.json();

      console.log("JSON:", url, json);

      return json;
    } catch (err) {
      console.log("FETCH ERROR:", url, err);
      return null;
    }
  };

  const allCommunityEndpoints = [
    `${apiUrl}/api/communities`,
    `${apiUrl}/api/admin/communities`,
  ];

  const membershipEndpoints = [
    `${apiUrl}/api/communities/user-communities`,
    `${apiUrl}/api/communities/with-membership`,
    `${apiUrl}/api/admin/communities/with-membership`,
    `${apiUrl}/api/user/communities`,
    `${apiUrl}/api/my/communities`,
    `${apiUrl}/api/communities/joined`,
    `${apiUrl}/api/member-requests`,
  ];

  let allCommunities = [];

  for (const endpoint of allCommunityEndpoints) {
    const json = await fetchJson(endpoint);
    if (!json) continue;

    const normalized = normalizeCommunities(json);

    if (normalized.length > 0) {
      allCommunities = normalized;
      break;
    }
  }

  if (allCommunities.length === 0) {
    return [];
  }

  const joinedIds = new Set();
  const requestedIds = new Set();

  for (const endpoint of membershipEndpoints) {
    const json = await fetchJson(endpoint);
    if (!json) continue;

    const normalized = normalizeCommunities(json);

    if (normalized.length === 0) continue;

    normalized.forEach((community) => {
      if (!community?.id) return;

      if (community.hasRequested && !community.isJoined) {
        requestedIds.add(Number(community.id));
      } else {
        joinedIds.add(Number(community.id));
      }
    });
  }

  const finalData = allCommunities.map((community) => {
    const id = Number(community.id);

    return {
      ...community,
      isJoined:
        Boolean(community.isJoined) ||
        joinedIds.has(id),

      hasRequested:
        Boolean(community.hasRequested) ||
        requestedIds.has(id),
    };
  });

  console.log("ALL COMMUNITIES:", allCommunities);
  console.log("JOINED IDS:", Array.from(joinedIds));
  console.log("REQUESTED IDS:", Array.from(requestedIds));
  console.log("FINAL COMMUNITY DATA:", finalData);

  return finalData;
};

/* =========================================
   JOIN API
========================================= */

const joinCommunityAPI = async (
  communityId
) => {

  const apiUrl = getApiBase();

  const headers = getAuthHeaders();

  const res = await fetch(
    `${apiUrl}/api/communities/${communityId}/join`,
    {
      method: "POST",
      headers,
    }
  );

  if (!res.ok) {
    throw new Error(
      "Gagal join komunitas"
    );
  }

  return res.json();
};

/* =========================================
   REQUEST PRIVATE JOIN
========================================= */

const requestJoinCommunityAPI =
  async (communityId) => {

  const apiUrl = getApiBase();

  const headers = getAuthHeaders();

  const candidates = [

    {
      url:
        `${apiUrl}/api/communities/${communityId}/join-request`,
      method: "POST",
    },

    {
      url:
        `${apiUrl}/api/member-requests`,
      method: "POST",
      body: JSON.stringify({
        community_id: communityId
      }),
    }
  ];

  for (const c of candidates) {

    try {

      const res = await fetch(
        c.url,
        {
          method: c.method,
          headers,
          body: c.body,
        }
      );

      if (res.ok) {
        return await res.json();
      }

    } catch (err) {

      console.log(err);

    }
  }

  throw new Error(
    "Gagal request join"
  );
};

/* =========================================
   PAGE
========================================= */

export default function Komunitas() {

  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [communities, setCommunities] =
    useState([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("semua");

  const [notification, setNotification] =
    useState({
      show: false,
      type: "info",
      title: "",
      message: "",
    });

  /* =========================================
     NOTIFICATION
  ========================================= */

  const showNotification =
    (config) => {

      setNotification({
        ...config,
        show: true,
      });

    };

  const hideNotification = () => {

    setNotification((prev) => ({
      ...prev,
      show: false,
    }));

  };

  /* =========================================
     FETCH
  ========================================= */

  const fetchCommunities =
    useCallback(async () => {

      try {

        setLoading(true);

        const apiBase =
          getApiBase();

        const data =
          await fetchCommunitiesAPI();

        const mapped = data.map(
          (c) => ({
            ...c,
            logo:
              buildLogoUrl(
                apiBase,
                c.logo
              ),
          })
        );

        console.log(
          "FINAL DATA:",
          mapped
        );

        setCommunities(mapped);

      } catch (err) {

        console.log(err);

        setCommunities([]);

      } finally {

        setLoading(false);

      }

    }, []);

  useEffect(() => {

    fetchCommunities();

  }, [fetchCommunities]);

  /* =========================================
     FILTER
  ========================================= */

  const filteredCommunities =
    useMemo(() => {

      let data = [...communities];

      if (
        activeTab ===
        "komunitasku"
      ) {

        data = data.filter(
          (c) =>
            c.isJoined ||
            c.hasRequested
        );

      }

      if (
        activeTab ===
        "belum-gabung"
      ) {

        data = data.filter(
          (c) =>
            !c.isJoined &&
            !c.hasRequested
        );

      }

      if (
        searchQuery.trim()
      ) {

        const q =
          searchQuery.toLowerCase();

        data = data.filter(
          (c) =>
            c.name
              ?.toLowerCase()
              .includes(q) ||

            c.category
              ?.toLowerCase()
              .includes(q)
        );
      }

      return data;

    }, [
      communities,
      activeTab,
      searchQuery
    ]);

  /* =========================================
     STATS
  ========================================= */

  const stats = useMemo(() => {

    const joined =
      communities.filter(
        (c) =>
          c.isJoined ||
          c.hasRequested
      ).length;

    const available =
      communities.filter(
        (c) =>
          !c.isJoined &&
          !c.hasRequested
      ).length;

    return {
      joined,
      available
    };

  }, [communities]);

  /* =========================================
     OPEN COMMUNITY
  ========================================= */

  const handleOpenCommunity =
    (id) => {

      router.push(
        `/app/komunitas/dashboard/${id}`
      );

    };

  /* =========================================
     JOIN
  ========================================= */

const handleJoinAction =
  async (community) => {

    try {

      const isPrivate =
        community.privacy ===
        "private";

      if (isPrivate) {

        await requestJoinCommunityAPI(
          community.id
        );

        showNotification({
          type: "success",
          title: "Berhasil",
          message: "Permintaan bergabung dikirim",
        });

        // Update local state supaya masuk ke Komunitas Saya sebagai pending
        setCommunities((prev) =>
          prev.map((item) =>
            Number(item.id) === Number(community.id)
              ? {
                  ...item,
                  hasRequested: true,
                }
              : item
          )
        );

      } else {

        await joinCommunityAPI(
          community.id
        );

        showNotification({
          type: "success",
          title: "Berhasil",
          message: "Berhasil bergabung komunitas",
        });

        // Update local state supaya langsung pindah dari Tersedia ke Komunitas Saya
        setCommunities((prev) =>
          prev.map((item) =>
            Number(item.id) === Number(community.id)
              ? {
                  ...item,
                  isJoined: true,
                  hasRequested: false,
                  members: Number(item.members || 0) + 1,
                }
              : item
          )
        );

      }

      // Refresh ulang dari API buat sinkron data asli
      fetchCommunities();

    } catch (err) {

      console.log(err);

      showNotification({
        type: "error",
        title: "Error",
        message:
          err.message ||
          "Terjadi kesalahan",
      });

    }

  };

  return (
    <>

      <div className="lg:mx-auto lg:relative lg:max-w-md">

        <div className="container mx-auto relative z-10 pb-28">

          {/* HEADER */}

          <div className="relative">

            <div className="w-full aspect-[16/6] overflow-hidden bg-gradient-to-r from-[#0b2e13] to-[#14532d] flex items-center justify-center z-10" />

            <div className="absolute top-3 left-4 z-30">

              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/25 backdrop-blur-md border border-white/40 shadow-sm">

                <Link
                  href="/app"
                  title="Kembali"
                  className="text-white"
                >

                  <FontAwesomeIcon
                    icon={faArrowLeft}
                    className="text-base"
                  />

                </Link>

                <h1 className="text-sm font-semibold text-white drop-shadow-sm">
                  Kelola Komunitas
                </h1>

              </div>

            </div>

          </div>

          {/* BODY */}

          <div className="bg-background min-h-screen w-full rounded-t-[25px] -mt-4 relative z-20 bg-gradient-to-br from-cyan-50">

            {/* SEARCH */}

            <div className="relative -top-4 px-4">

              <div className="bg-white border border-primary rounded-[20px] flex items-center overflow-hidden">

                <div className="flex-1">

                  <div className="px-6 py-3 flex items-center gap-3">

                    <FontAwesomeIcon
                      icon={faSearch}
                      className="text-primary"
                    />

                    <input
                      type="text"
                      placeholder="Cari komunitas..."
                      value={searchQuery}
                      onChange={(e) =>
                        setSearchQuery(
                          e.target.value
                        )
                      }
                      className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400"
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* TAB */}

            <div className="bg-transparent border-b border-[#cdd0b3]">

              <div className="px-4">

                <div className="flex space-x-8">

                  {[
                    'semua',
                    'komunitasku',
                    'belum-gabung'
                  ].map((tab) => (

                    <button
                      key={tab}
                      className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                      onClick={() =>
                        setActiveTab(tab)
                      }
                    >

                      {tab === 'semua'
                        ? 'Semua Komunitas'
                        : tab === 'komunitasku'
                        ? 'Komunitas Saya'
                        : 'Tersedia'}

                    </button>

                  ))}

                </div>

              </div>

            </div>

            {/* CONTENT */}

            <div className="px-4 py-6">

              {/* STATS */}

              <div className="grid grid-cols-2 gap-4 mb-6">

                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#d8d8d8] bg-[#0b2e13]/5">

                  <div className="flex items-center">

                    <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-[#0b2e13] text-white">

                      <FontAwesomeIcon
                        icon={faUsers}
                        className="text-sm"
                      />

                    </div>

                    <div className="ml-3">

                      <p className="text-sm font-medium text-[#14532d]">
                        Bergabung
                      </p>

                      <p className="text-lg font-semibold text-slate-900">
                        {stats.joined}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#d8d8d8] bg-[#0b2e13]/5">

                  <div className="flex items-center">

                    <div className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-[#14532d] text-white">

                      <FontAwesomeIcon
                        icon={faGlobe}
                        className="text-sm"
                      />

                    </div>

                    <div className="ml-3">

                      <p className="text-sm font-medium text-[#14532d]">
                        Tersedia
                      </p>

                      <p className="text-lg font-semibold text-slate-900">
                        {stats.available}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* LIST */}

              <div className="space-y-3">

                {loading ? (

                  <div className="text-center py-10">
                    Loading komunitas...
                  </div>

                ) : filteredCommunities.length === 0 ? (

                  <div className="bg-white rounded-xl p-8 text-center border border-[#d8d8d8]">

                    <FontAwesomeIcon
                      icon={faUsers}
                      className="text-3xl text-slate-300 mb-4"
                    />

                    <p className="text-slate-500">
                      Tidak ada komunitas
                    </p>

                  </div>

                ) : (

                  filteredCommunities.map(
                    (community) => (

                    <CommunityCard
                      key={community.id}
                      community={community}
                      onOpenCommunity={
                        handleOpenCommunity
                      }
                      onJoinRequest={
                        handleJoinAction
                      }
                    />

                  )))

                }

              </div>

            </div>

          </div>

        </div>

      </div>

      <FlexibleNotification
        show={notification.show}
        onClose={hideNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      <BottomBarComponent active={'community'} />

    </>
  );
}

/* =========================================
   CARD
========================================= */

function CommunityCard({
  community,
  onOpenCommunity,
  onJoinRequest,
}) {
  const isPrivate = community.privacy === "private";
  const isJoined = Boolean(community.isJoined);
  const hasRequested = Boolean(community.hasRequested);

  // Card tetap bisa diklik untuk masuk detail komunitas
  const handleClick = () => {
    onOpenCommunity(community.id);
  };

  const handleJoin = (e) => {
    e.stopPropagation();

    if (isJoined || hasRequested) return;

    onJoinRequest(community);
  };

  const handleEnter = (e) => {
    e.stopPropagation();
    onOpenCommunity(community.id);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
    >
      <div
        className="h-3"
        style={{
          background: `linear-gradient(135deg, ${community.bg_color_1}, ${community.bg_color_2})`
        }}
      />

      <div className="p-5 flex gap-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border flex items-center justify-center">
          {community.logo ? (
            <Image
              src={community.logo}
              width={56}
              height={56}
              alt={community.name}
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold"
              style={{
                background: `linear-gradient(135deg, ${community.bg_color_1}, ${community.bg_color_2})`
              }}
            >
              {community.name?.slice(0, 2)?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">
              {community.name}
            </h3>

            {community.isVerified && (
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-blue-500 text-sm"
              />
            )}

            {isPrivate && (
              <FontAwesomeIcon
                icon={faLock}
                className="text-slate-400 text-sm"
              />
            )}
          </div>

          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
              {community.category}
            </span>
          </div>

          <p className="text-slate-600 text-sm mt-2 line-clamp-2">
            {community.description || "Tidak ada deskripsi"}
          </p>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faUsers} className="text-xs" />
                <span>{community.members} anggota</span>
              </div>

              {isJoined && (
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faTags} className="text-xs" />
                  <span className="text-primary font-medium">
                    {community.activePromos} promo
                  </span>
                </div>
              )}
            </div>

            {isJoined ? (
              <button
                onClick={handleEnter}
                className="px-4 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium"
              >
                Masuk
              </button>
            ) : hasRequested ? (
              <button
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 text-sm font-medium flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faClock} className="text-xs" />
                Menunggu
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-1"
              >
                <FontAwesomeIcon icon={isPrivate ? faUsers : faPlus} className="text-xs" />
                {isPrivate ? "Minta" : "Gabung"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}