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

/* ========================================
   API BASE
======================================== */

const getApiBase = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  return baseUrl.replace(/\/api\/?$/, "");
};

/* ========================================
   AUTH
======================================== */

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

/* ========================================
   BUILD LOGO URL
======================================== */

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

/* ========================================
   NORMALIZE COMMUNITY
======================================== */

const normalizeCommunities = (raw) => {
  console.log("RAW API:", raw);

  let list = [];

  if (Array.isArray(raw)) {
    list = raw;
  }
  else if (Array.isArray(raw?.data)) {
    list = raw.data;
  }
  else if (Array.isArray(raw?.communities)) {
    list = raw.communities;
  }
  else if (Array.isArray(raw?.data?.data)) {
    list = raw.data.data;
  }

  console.log("LIST RESULT:", list);

  return list.map((c) => ({
    id: Number(c.id),
    name: c.name || "Tanpa Nama",
    description: c.description || "",
    category: c.category || "Umum",

    logo: c.logo || null,

    bg_color_1: c.bg_color_1 || "#0b2e13",
    bg_color_2: c.bg_color_2 || "#14532d",

    privacy:
      c.privacy ||
      c.world_type ||
      c.type ||
      "public",

    isVerified:
      Boolean(c.isVerified) ||
      Boolean(c.is_verified),

    isJoined:
      Boolean(c.isJoined) ||
      Boolean(c.is_joined),

    hasRequested:
      Boolean(c.hasRequested) ||
      Boolean(c.has_requested),

    members:
      Number(c.members || 0),

    activePromos:
      Number(c.activePromos || 0),

    is_active: true,
  }));
};

/* ========================================
   FETCH COMMUNITIES
======================================== */

const fetchCommunitiesAPI = async () => {
  const apiUrl = getApiBase();

  const headers = getAuthHeaders();

  const endpoints = [
    `${apiUrl}/api/communities`,
    `${apiUrl}/api/admin/communities`,
    `${apiUrl}/api/communities/with-membership`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log("TRY FETCH:", endpoint);

      const res = await fetch(endpoint, {
        headers,
      });

      console.log("STATUS:", res.status);

      if (!res.ok) continue;

      const json = await res.json();

      console.log("JSON:", json);

      const normalized =
        normalizeCommunities(json);

      console.log("NORMALIZED:", normalized);

      if (normalized.length > 0) {
        return normalized;
      }

    } catch (err) {
      console.log("FETCH ERROR:", err);
    }
  }

  return [];
};

/* ========================================
   PAGE
======================================== */

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

  const showNotification = (config) => {
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

  /* ========================================
     FETCH DATA
  ======================================== */

  const fetchCommunities = useCallback(async () => {

    try {

      setLoading(true);

      const apiBase = getApiBase();

      const data =
        await fetchCommunitiesAPI();

      const mapped = data.map((c) => ({
        ...c,
        logo: buildLogoUrl(apiBase, c.logo),
      }));

      console.log("FINAL DATA:", mapped);

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

  /* ========================================
     FILTER
  ======================================== */

  const filteredCommunities =
    useMemo(() => {

      let data = [...communities];

      if (activeTab === "komunitasku") {
        data = data.filter(
          (c) =>
            c.isJoined ||
            c.hasRequested
        );
      }

      if (activeTab === "belum-gabung") {
        data = data.filter(
          (c) =>
            !c.isJoined &&
            !c.hasRequested
        );
      }

      if (searchQuery.trim()) {

        const q =
          searchQuery.toLowerCase();

        data = data.filter((c) =>
          c.name
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

  /* ========================================
     OPEN COMMUNITY
  ======================================== */

  const handleOpenCommunity =
    (id) => {
      router.push(
        `/app/komunitas/dashboard/${id}`
      );
    };

  /* ========================================
     RENDER
  ======================================== */

  return (
    <>
      <div className="lg:mx-auto lg:max-w-md">

        <div className="container mx-auto pb-28">

          {/* HEADER */}

          <div className="relative">

            <div className="w-full aspect-[16/6] bg-gradient-to-r from-[#0b2e13] to-[#14532d]" />

            <div className="absolute top-3 left-4">

              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/20 backdrop-blur">

                <Link href="/app">

                  <FontAwesomeIcon
                    icon={faArrowLeft}
                    className="text-white"
                  />

                </Link>

                <h1 className="text-white font-semibold">
                  Kelola Komunitas
                </h1>

              </div>

            </div>

          </div>

          {/* CONTENT */}

          <div className="bg-white min-h-screen rounded-t-[25px] -mt-4 relative z-20 px-4 py-6">

            {/* SEARCH */}

            <div className="mb-5">

              <div className="border rounded-xl flex items-center px-4 py-3">

                <FontAwesomeIcon
                  icon={faSearch}
                  className="text-primary mr-3"
                />

                <input
                  type="text"
                  placeholder="Cari komunitas..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="w-full outline-none"
                />

              </div>

            </div>

            {/* TAB */}

            <div className="flex gap-4 mb-6">

              {[
                "semua",
                "komunitasku",
                "belum-gabung"
              ].map((tab) => (

                <button
                  key={tab}
                  onClick={() =>
                    setActiveTab(tab)
                  }
                  className={`px-4 py-2 rounded-lg text-sm ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "bg-slate-100"
                  }`}
                >

                  {tab}

                </button>

              ))}

            </div>

            {/* LIST */}

            {loading ? (

              <div className="py-10 text-center">
                Loading komunitas...
              </div>

            ) : filteredCommunities.length === 0 ? (

              <div className="py-10 text-center">
                Tidak ada komunitas
              </div>

            ) : (

              <div className="space-y-4">

                {filteredCommunities.map(
                  (community) => (

                  <div
                    key={community.id}
                    onClick={() =>
                      handleOpenCommunity(
                        community.id
                      )
                    }
                    className="bg-white border rounded-xl overflow-hidden shadow-sm cursor-pointer"
                  >

                    <div
                      className="h-3"
                      style={{
                        background:
                          `linear-gradient(135deg, ${community.bg_color_1}, ${community.bg_color_2})`
                      }}
                    />

                    <div className="p-4 flex gap-4">

                      {/* LOGO */}

                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">

                        {community.logo ? (

                          <Image
                            src={community.logo}
                            width={56}
                            height={56}
                            alt=""
                            className="object-cover"
                            unoptimized
                          />

                        ) : (

                          <span className="font-bold text-primary">
                            {community.name
                              ?.slice(0, 2)
                              ?.toUpperCase()}
                          </span>

                        )}

                      </div>

                      {/* CONTENT */}

                      <div className="flex-1">

                        <div className="flex items-center gap-2">

                          <h2 className="font-semibold">
                            {community.name}
                          </h2>

                          {community.isVerified && (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-blue-500 text-sm"
                            />
                          )}

                          {community.privacy ===
                            "private" && (
                            <FontAwesomeIcon
                              icon={faLock}
                              className="text-slate-400 text-sm"
                            />
                          )}

                        </div>

                        <p className="text-sm text-slate-500 mt-1">
                          {community.description}
                        </p>

                        <div className="flex items-center justify-between mt-3">

                          <div className="flex items-center text-sm text-slate-500 gap-2">

                            <FontAwesomeIcon
                              icon={faUsers}
                            />

                            <span>
                              {community.members} anggota
                            </span>

                          </div>

                          <button
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
                          >

                            {community.isJoined
                              ? "Masuk"
                              : "Gabung"}

                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

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