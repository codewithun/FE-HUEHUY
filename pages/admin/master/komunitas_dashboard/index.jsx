/* eslint-disable no-console */
import { faPlus, faUsers, faUserPlus, faHistory, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import Image from "next/image";
// import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ButtonComponent,
  FloatingPageComponent,
  TableSupervisionComponent,
  SelectComponent,
  InputComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import InputHexColor from "../../../../components/construct.components/input/InputHexColor";
import { token_cookie_name } from "../../../../helpers";
import { admin_token_cookie_name } from "../../../../helpers/api.helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";
import { faCubes } from "@fortawesome/free-solid-svg-icons";

/** =============================
 *  Helpers
 *  ============================= */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const FILE_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return API_BASE.replace(/\/+$/, "");
  }
})();
const apiJoin = (path = "") => {
  const base = API_BASE.replace(/\/+$/, "");
  const ensured = /\/api$/i.test(base) ? base : `${base}/api`;
  return `${ensured}/${String(path).replace(/^\/+/, "")}`;
};
const toStoragePath = (p = "") =>
  `storage/${String(p).replace(/^\/+/, "").replace(/^storage\/+/, "")}`;
const fileUrl = (relativePath = "") => `${FILE_ORIGIN}/${toStoragePath(relativePath)}`;

/** =============================
 *  Page
 *  ============================= */
export default function KomunitasDashboard() {
  /** MAIN: communities table state */
  const [refreshToggle, setRefreshToggle] = useState(false);

  /** CORPORATE (Mitra) options */
  const [corporateOptions, setCorporateOptions] = useState([]);
  const [corporateLoading, setCorporateLoading] = useState(false);

  // Aktif komunitas yang dipilih (untuk modal anggota)
  const [activeCommunity, setActiveCommunity] = useState(null);

  /** MEMBERS modal state */
  const [modalMember, setModalMember] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  // Simpan AbortController & timer agar bisa dibatalkan saat modal ditutup
  const memberReqRef = useRef({ ac: null, timer: null });

  /** MEMBER REQUESTS modal state */
  const [modalMemberRequests, setModalMemberRequests] = useState(false);
  // removed manual fetch states; table will fetch itself
  const [refreshRequestsToggle, setRefreshRequestsToggle] = useState(false);

  /** MEMBER HISTORY modal state */
  const [modalMemberHistory, setModalMemberHistory] = useState(false);
  // Riwayat member dikelola langsung oleh TableSupervisionComponent
  const [memberHistoryError, setMemberHistoryError] = useState("");

  // CUBES modal state
  const [modalCubes, setModalCubes] = useState(false);
  const [cubeList, setCubeList] = useState([]);
  const [cubeLoading, setCubeLoading] = useState(false);
  const [cubeError, setCubeError] = useState("");
  // Search & filter untuk Cube table (Widget Asal)
  const [cubeTypeFilter, setCubeTypeFilter] = useState([]); // ['home','hunting','information']
  const [cubeWidgetSearch, setCubeWidgetSearch] = useState("");

  // ADD MEMBER modal state
  const [modalAddMember, setModalAddMember] = useState(false);



  // const router = useRouter();

  // Debug logs removed - member modal now working with manual table

  /** ============ FETCH ADMIN CONTACTS removed in new design ============ */

  // Fetch Mitra (Corporates) untuk dropdown "Mitra"
  useEffect(() => {
    const fetchCorporates = async () => {
      // Ambil token admin (cookie atau localStorage) agar kompatibel Safari
      const encFromCookie = Cookies.get(admin_token_cookie_name);
      const encFromLs = typeof window !== 'undefined' ? localStorage.getItem(admin_token_cookie_name) : null;
      const encryptedToken = encFromCookie || encFromLs || Cookies.get(token_cookie_name) || null;
      const token = encryptedToken ? Decrypt(encryptedToken) : "";
      try {
        setCorporateLoading(true);
        const url = apiJoin("admin/corporates?paginate=all");
        const res = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const opts = list.map((c) => ({ value: c.id, label: c.name || `Mitra #${c.id}` }));
        setCorporateOptions(opts);
      } catch (e) {
        console.error("Failed to fetch corporates (mitra)", e);
        setCorporateOptions([]);
      } finally {
        setCorporateLoading(false);
      }
    };
    fetchCorporates();
  }, []);

  /** ============ HELPERS ============ */
  // Ganti helper headers agar GET tidak kirim Content-Type
  const authHeaders = (method = "GET") => {
    // Prioritaskan token admin; fallback ke user bila ada
    const encFromCookie = Cookies.get(admin_token_cookie_name);
    const encFromLs = typeof window !== 'undefined' ? localStorage.getItem(admin_token_cookie_name) : null;
    const encryptedToken = encFromCookie || encFromLs || Cookies.get(token_cookie_name) || null;
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    const base = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    // Hanya kirim Content-Type untuk method yang punya body JSON
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
      return { ...base, "Content-Type": "application/json" };
    }
    return base; // GET/HEAD: simple request → no preflight
  };

  const authHeadersMultipart = () => {
    const encFromCookie = Cookies.get(admin_token_cookie_name);
    const encFromLs = typeof window !== 'undefined' ? localStorage.getItem(admin_token_cookie_name) : null;
    const encryptedToken = encFromCookie || encFromLs || Cookies.get(token_cookie_name) || null;
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    return { Authorization: `Bearer ${token}` };
  };

  // Kategori modal dan prefetch promo dihapus; tidak dibutuhkan lagi.

  /** ============ KUBUS MODAL ACTIONS ============ */

  const openCubesModal = async (communityRow) => {
    setActiveCommunity(communityRow);
    setModalCubes(true);
    setCubeLoading(true);
    setCubeError("");
    setCubeList([]);

    try {
      // ambil dari endpoint baru yang terhubung ke widget
      const url = apiJoin(`admin/communities/${communityRow.id}/cubes`);
      const res = await fetch(url, { headers: authHeaders("GET") });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json().catch(() => ({}));
      const d = json?.data ?? json;
      const rows = Array.isArray(d)
        ? d
        : Array.isArray(d?.data)
          ? d.data
          : Array.isArray(json)
            ? json
            : [];
      console.log("CUBE RESPONSE:", rows);
      setCubeList(rows);

    } catch (err) {
      console.error("Gagal memuat kubus:", err);
      setCubeError("Tidak bisa memuat daftar kubus komunitas ini.");
    } finally {
      setCubeLoading(false);
    }
  };

  // Client-side filtered cube list by widget type (dropdown) + search (widget name/type/cube name)
  const filteredCubeList = useMemo(() => {
    const q = String(cubeWidgetSearch || "").toLowerCase().trim();
    const types = Array.isArray(cubeTypeFilter)
      ? cubeTypeFilter.map((t) => String(t).toLowerCase())
      : [];
    return (Array.isArray(cubeList) ? cubeList : []).filter((c) => {
      const wtype = String(c?.widget_type || "").toLowerCase();
      const wname = String(c?.widget_name || "").toLowerCase();
      const cname = String(c?.name || "").toLowerCase();
      const typeOk = !types.length || types.includes(wtype);
      const searchOk = !q || wtype.includes(q) || wname.includes(q) || cname.includes(q);
      return typeOk && searchOk;
    });
  }, [cubeList, cubeWidgetSearch, cubeTypeFilter]);




  /** ============ MEMBERS MODAL ACTIONS ============ */
  const tryFetch = async (url, signal) =>
    fetch(url, { method: "GET", headers: authHeaders("GET"), signal });

  const openMemberRequestsModal = (communityRow) => {
    setActiveCommunity(communityRow);
    setModalMemberRequests(true);
  };

  const openMemberHistoryModal = async (communityRow) => {
    // Biarkan TableSupervisionComponent yang melakukan fetch & render
    setActiveCommunity(communityRow);
    setMemberHistoryError("");
    setModalMemberHistory(true);
  };

  // Tambahkan fungsi auto-refresh riwayat member
  const refreshMemberHistory = () => {
    if (activeCommunity) {
      openMemberHistoryModal(activeCommunity);
    }
  };

  const handleMemberRequest = async (requestId, action) => {
    try {
      const res = await fetch(apiJoin(`admin/member-requests/${requestId}/${action}`), {
        method: "POST",
        headers: authHeaders("POST"),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      // Trigger table refresh
      setRefreshRequestsToggle((s) => !s);
      refreshMemberHistory(); // ⬅️ auto-refresh riwayat member setelah approve/reject
    } catch (err) {
      console.error(`Gagal ${action} permintaan:`, err);
      alert(`Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} permintaan`);
    }
  };

  const openMemberModal = async (communityRow) => {
    // cegah double request untuk komunitas yang sama saat masih loading
    if (memberLoading && activeCommunity?.id === communityRow.id) return;

    // batalkan request sebelumnya jika ada
    if (memberReqRef.current.ac) {
      try { memberReqRef.current.ac.abort(); } catch { }
      if (memberReqRef.current.timer) clearTimeout(memberReqRef.current.timer);
      memberReqRef.current = { ac: null, timer: null };
    }

    setActiveCommunity(communityRow);
    setModalMember(true);
    setMemberLoading(true);
    setMemberError("");
    setMemberList([]);

    const ac = new AbortController();
    const timer = setTimeout(() => {
      // abort hanya jika ini masih request aktif
      if (memberReqRef.current.ac === ac) ac.abort();
    }, 10000); // 10s timeout
    memberReqRef.current = { ac, timer };

    try {
      let res = await tryFetch(apiJoin(`admin/communities/${communityRow.id}/members`), ac.signal);
      if (res.status === 404) {
        res = await tryFetch(apiJoin(`communities/${communityRow.id}/members`), ac.signal);
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const json = await res.json().catch(() => ({}));
      console.log('[Members Debug] Raw response:', json);

      // Robust extract: handle arrays or nested structures (data, members, users, pagination)
      let rows = [];
      const d = json?.data ?? json;
      if (Array.isArray(d)) rows = d;
      else if (Array.isArray(d?.data)) rows = d.data;
      else if (Array.isArray(d?.members)) rows = d.members;
      else if (Array.isArray(d?.users)) rows = d.users;
      else if (Array.isArray(json?.members)) rows = json.members;
      else if (Array.isArray(json?.users)) rows = json.users;
      else if (d?.data && Array.isArray(d.data?.data)) rows = d.data.data; // laravel paginated {data:{data:[]}}
      // Optional normalization: ensure objects have id
      rows = Array.isArray(rows) ? rows : [];

      console.log('[Members Debug] Extracted rows:', rows);
      console.log('[Members Debug] Setting memberList with', rows.length, 'items');
      setMemberList(rows);
    } catch (err) {
      if (ac.signal.aborted || err?.name === "AbortError") {
        setMemberError("Permintaan timeout (10s). Coba lagi.");
      } else {
        console.error("Gagal memuat anggota:", err);
        setMemberError("Tidak bisa memuat daftar anggota");
      }
    } finally {
      // bersihkan hanya jika ini masih request aktif
      if (memberReqRef.current.ac === ac) {
        clearTimeout(timer);
        memberReqRef.current = { ac: null, timer: null };
        setMemberLoading(false);
      }
    }
  };

  /** =============================
   *  TABLE DEFS: Communities (MAIN)
   *  ============================= */
  const communityColumns = useMemo(
    () => [
      {
        selector: "name",
        label: "Nama Komunitas",
        sortable: true,
        item: ({ name }) => <span className="font-semibold">{name}</span>,
      },
      {
        selector: "description",
        label: "Deskripsi",
        item: ({ description }) => description || "-",
      },
      {
        selector: "logo",
        label: "Logo",
        width: "100px",
        item: ({ logo }) =>
          logo ? (
            <Image
              src={logo?.startsWith?.("http") ? logo : fileUrl(logo)}
              alt="Logo Komunitas"
              width={48}
              height={48}
              className="rounded"
            />
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      // Tambahan: Warna Background (1 & 2)
      {
        selector: "bg_colors",
        label: "Warna BG",
        width: "200px",
        item: (row) => {
          const c1 = row?.bg_color_1 || row?.color || "";
          const c2 = row?.bg_color_2 || "";
          const Box = ({ c }) => (
            <span className="inline-flex items-center gap-1 mr-3">
              <span
                className="inline-block w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: c || "#fff" }}
                title={c || "-"}
              />
              <span className="text-xs text-gray-700">{c || "-"}</span>
            </span>
          );
          return (
            <div className="flex items-center">
              <Box c={c1} />
              <Box c={c2} />
            </div>
          );
        },
      },
      // Tambahan: Jenis Dunia
      {
        selector: "world_type",
        label: "Jenis Dunia",
        width: "130px",
        item: (row) => {
          const raw = String(row?.world_type || row?.type || "").toLowerCase();
          const label = raw === "private" ? "Private" : raw === "pribadi" ? "Pribadi" : (row?.world_type || row?.type || "-");
          return (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
              {label}
            </span>
          );
        },
      },
      // Tambahan: Status Komunitas
      {
        selector: "is_active",
        label: "Status",
        width: "110px",
        item: (row) => {
          // NORMALISASI: jangan pakai truthy langsung, karena string "0" dianggap truthy di JS
          const normalizeActive = (v) => {
            if (v === true || v === 1) return true;
            if (v === false || v === 0 || v === null || v === undefined) return false;
            if (typeof v === "string") {
              const s = v.trim().toLowerCase();
              if (["1", "true", "on", "yes"].includes(s)) return true;
              if (["0", "false", "off", "no"].includes(s)) return false;
            }
            return false;
          };

          const active = normalizeActive(row?.is_active ?? row?.active) ||
            (String(row?.status || "").toLowerCase() === "active");
          const cls = active
            ? "bg-green-100 text-green-700 border-green-200"
            : "bg-red-100 text-red-700 border-red-200";
          return (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${cls}`}>
              {active ? "Aktif" : "Nonaktif"}
            </span>
          );
        },
      },
    ],
    []
  );

  // Topbar menggunakan API TableSupervision: customTopBarWithForm
  // supaya tombol dapat membuka form modal langsung (tanpa event custom)
  const renderCommunityTopbar = ({ setModalForm }) => (
    <ButtonComponent
      label="Tambah Komunitas"
      icon={faPlus}
      paint="primary"
      onClick={() => setModalForm(true)}
    />
  );

  /** =============================
   *  RENDER
   *  ============================= */
  return (
    <>
      {/* COMMUNITIES as main table */}
      <TableSupervisionComponent
        title="Manajemen Komunitas"
        data={[]}
        columnControl={{ custom: communityColumns }}
        customTopBarWithForm={renderCommunityTopbar}
        searchable
        noControlBar={false}
        setToRefresh={refreshToggle}
        fetchControl={{
          path: "admin/communities",
          includeHeaders: authHeadersMultipart(),
          method: "GET",
          headers: () => authHeaders("GET"),
          mapData: (result) => {
            if (Array.isArray(result?.data)) {
              return { data: result.data, totalRow: result.total_row || result.data.length };
            }
            return { data: [], totalRow: 0 };
          },
        }}
        actionControl={{
          except: ["detail"],
          include: (row) => (
            <div className="flex items-center gap-2">
              <ButtonComponent
                label="Anggota"
                icon={faUsers}
                size="xs"
                paint="secondary"
                variant="solid"
                rounded
                disabled={memberLoading}
                onClick={() => {
                  if (!memberLoading) openMemberModal(row);
                }}
              />
              <ButtonComponent
                label="Lihat Kubus"
                icon={faCubes}
                size="xs"
                paint="info"
                variant="outline"
                rounded
                onClick={() => openCubesModal(row)}
              />
            </div>
          )

        }}
        formControl={{
          contentType: "multipart/form-data",
          triggerEventKey: "tsc-open-create",
          custom: [
            // Mitra
            {
              type: "select",
              construction: {
                name: "corporate_id",
                label: "Mitra",
                placeholder: corporateLoading ? "Memuat Mitra.." : "Pilih Mitra..",
                options: corporateOptions,
                searchable: true,
              },
              col: 12,
            },
            // Nama
            {
              construction: {
                name: "name",
                label: "Nama",
                placeholder: "Masukkan Nama..",
                validations: { required: true },
              },
              col: 12,
            },
            // Logo + Deskripsi (2 kolom)
            {
              type: "image",
              construction: {
                name: "logo",
                label: "Logo",
                accept: "image/*",
              },
              col: 3,
            },
            {
              type: "textarea",
              construction: {
                name: "description",
                label: "Deskripsi",
                placeholder: "Masukkan Deskripsi...",
                rows: 6,
              },
              col: 9,
            },
            // Warna Background 1 & 2 (2 kolom)
            {
              type: "custom",
              col: 6,
              custom: ({ values, setValues, errors }) => (
                <InputHexColor
                  name="bg_color_1"
                  label="Warna Background 1"
                  values={values}
                  setValues={setValues}
                  errors={errors}
                />
              ),
            },
            {
              type: "custom",
              col: 6,
              custom: ({ values, setValues, errors }) => (
                <InputHexColor
                  name="bg_color_2"
                  label="Warna Background 2"
                  values={values}
                  setValues={setValues}
                  errors={errors}
                />
              ),
            },
            // Jenis Dunia
            {
              type: "select",
              construction: {
                name: "world_type",
                label: "Akses Komunitas",
                placeholder: "Pilih Akses Komunitas..",
                options: [
                  { label: "Publik", value: "public" },
                  { label: "Private", value: "private" },
                ],
                searchable: false,
              },
              col: 12,
            },
            // Aktif
            {
              type: "check",
              construction: {
                name: "is_active",
                label: "Aktif",
                options: [{ label: "Aktif", value: 1 }],
              },
              col: 12,
            },
          ],
          submit: async ({ payload, isUpdate, row }) => {
            try {
              // ===== SMART CONTENT-TYPE HANDLING =====
              // Check if we need to upload a file (new logo)
              let hasFileUpload = false;
              let logoFile = null;

              // Logo file detection logic
              if (payload.logo instanceof File) {
                logoFile = payload.logo;
                hasFileUpload = true;
              } else if (payload.logo?.file instanceof File) {
                logoFile = payload.logo.file;
                hasFileUpload = true;
              } else if (payload.logo?.originFileObj instanceof File) {
                logoFile = payload.logo.originFileObj;
                hasFileUpload = true;
              } else if (Array.isArray(payload.logo) && payload.logo[0] instanceof File) {
                logoFile = payload.logo[0];
                hasFileUpload = true;
              } else if (payload.logo instanceof Blob) {
                const name = payload.logo?.name || "logo.png";
                logoFile = new File([payload.logo], name, { type: payload.logo.type || "image/png" });
                hasFileUpload = true;
              } else if (typeof payload.logo === "string" && payload.logo.startsWith("data:image")) {
                const dataUrlToFile = async (dataUrl, filename = "logo.png") => {
                  try {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    const ext = (blob.type && blob.type.split("/")[1]) || "png";
                    const safeName = filename.includes(".") ? filename : `logo.${ext}`;
                    return new File([blob], safeName, { type: blob.type || "image/png" });
                  } catch (e) {
                    console.warn("Failed convert dataURL to File:", e);
                    return null;
                  }
                };
                logoFile = await dataUrlToFile(payload.logo, "logo.png");
                if (logoFile) hasFileUpload = true;
              }

              console.log('Has file upload:', hasFileUpload, 'Logo file:', logoFile);

              let requestBody, requestHeaders;

              if (hasFileUpload) {
                // USE MULTIPART for file uploads
                const form = new FormData();

                // Laravel doesn't parse multipart for PUT method, so use POST with _method override
                if (isUpdate) {
                  form.append('_method', 'PUT');
                }

                // Debug setiap field yang di-append
                const appendField = (key, value) => {
                  console.log(`Appending ${key}:`, value, typeof value);
                  form.append(key, value);
                };

                appendField("name", payload.name || "");
                appendField("description", payload.description || "");

                if (payload.corporate_id) {
                  appendField("corporate_id", String(payload.corporate_id));
                }

                if (payload.bg_color_1) appendField("bg_color_1", payload.bg_color_1);
                if (payload.bg_color_2) appendField("bg_color_2", payload.bg_color_2);

                if (payload.world_type) {
                  appendField("world_type", payload.world_type);
                  appendField("type", payload.world_type);
                }

                // Handle is_active
                if (!("is_active" in payload)) {
                  payload.is_active = [];
                }

                let isActiveBool = false;
                if (Array.isArray(payload.is_active)) {
                  isActiveBool =
                    payload.is_active.includes(1) ||
                    payload.is_active.includes("1") ||
                    payload.is_active.includes(true);
                } else if (typeof payload.is_active === "string") {
                  isActiveBool = ["1", "true", "on", "yes"].includes(payload.is_active.toLowerCase());
                } else if (typeof payload.is_active === "boolean" || typeof payload.is_active === "number") {
                  isActiveBool = Boolean(payload.is_active);
                }
                appendField("is_active", isActiveBool ? "1" : "0");

                // Append logo file
                if (logoFile instanceof File) {
                  const safeName = logoFile.name || "logo";
                  console.log("✅ Appending logo file:", safeName, logoFile.type, logoFile.size);
                  form.append("logo", logoFile, safeName);
                }

                // Debug FormData contents
                console.log('FormData entries:');
                for (let [key, value] of form.entries()) {
                  console.log(`  ${key}:`, value);
                }

                requestBody = form;
                requestHeaders = authHeadersMultipart();
              } else {
                // USE JSON for simple text updates (no file upload)
                const jsonPayload = {
                  name: payload.name || "",
                  description: payload.description || "",
                };

                if (payload.corporate_id) {
                  jsonPayload.corporate_id = payload.corporate_id;
                }
                if (payload.bg_color_1) jsonPayload.bg_color_1 = payload.bg_color_1;
                if (payload.bg_color_2) jsonPayload.bg_color_2 = payload.bg_color_2;
                if (payload.world_type) {
                  jsonPayload.world_type = payload.world_type;
                  jsonPayload.type = payload.world_type;
                }

                // Handle is_active
                let isActiveBool = false;
                if (!("is_active" in payload)) {
                  payload.is_active = [];
                }
                if (Array.isArray(payload.is_active)) {
                  isActiveBool =
                    payload.is_active.includes(1) ||
                    payload.is_active.includes("1") ||
                    payload.is_active.includes(true);
                } else if (typeof payload.is_active === "string") {
                  isActiveBool = ["1", "true", "on", "yes"].includes(payload.is_active.toLowerCase());
                } else if (typeof payload.is_active === "boolean" || typeof payload.is_active === "number") {
                  isActiveBool = Boolean(payload.is_active);
                }
                jsonPayload.is_active = isActiveBool;

                // For update, include existing logo if keeping it
                if (isUpdate && typeof payload.logo === "string" && payload.logo.trim() !== "" && !payload.logo.startsWith("data:")) {
                  jsonPayload.logo = payload.logo;
                }

                console.log('JSON payload:', jsonPayload);

                requestBody = JSON.stringify(jsonPayload);
                requestHeaders = {
                  ...authHeaders("PUT"),
                  'Content-Type': 'application/json'
                };
              }

              const url = isUpdate
                ? apiJoin(`admin/communities/${row.id}`)
                : apiJoin("admin/communities");

              // For file uploads, always use POST (with _method=PUT for updates)
              // because Laravel doesn't parse multipart data for PUT method
              const method = (hasFileUpload || !isUpdate) ? "POST" : "PUT";

              console.log('Request URL:', url);
              console.log('Request method:', method);
              console.log('Content-Type:', hasFileUpload ? 'multipart/form-data' : 'application/json');
              console.log('Has file upload:', hasFileUpload);
              console.log('Using method override:', hasFileUpload && isUpdate ? 'yes (_method=PUT)' : 'no');

              const response = await fetch(url, {
                method,
                headers: requestHeaders,
                body: requestBody,
              });

              console.log('Response status:', response.status);

              if (!response.ok) {
                // Fallback: some environments reject PUT; retry with POST + _method=PUT
                if (response.status === 405 && isUpdate) {
                  try {
                    console.warn('Received 405; retrying with POST + _method=PUT');
                    const fd = new FormData();
                    fd.append('_method', 'PUT');
                    fd.append('name', payload.name || '');
                    fd.append('description', payload.description || '');
                    if (payload.corporate_id) fd.append('corporate_id', String(payload.corporate_id));
                    if (payload.bg_color_1) fd.append('bg_color_1', payload.bg_color_1);
                    if (payload.bg_color_2) fd.append('bg_color_2', payload.bg_color_2);
                    if (payload.world_type) {
                      fd.append('world_type', payload.world_type);
                      fd.append('type', payload.world_type);
                    }
                    let isActiveBool = false;
                    if (!('is_active' in payload)) {
                      payload.is_active = [];
                    }
                    if (Array.isArray(payload.is_active)) {
                      isActiveBool = payload.is_active.includes(1) || payload.is_active.includes('1') || payload.is_active.includes(true);
                    } else if (typeof payload.is_active === 'string') {
                      isActiveBool = ['1', 'true', 'on', 'yes'].includes(payload.is_active.toLowerCase());
                    } else if (typeof payload.is_active === 'boolean' || typeof payload.is_active === 'number') {
                      isActiveBool = Boolean(payload.is_active);
                    }
                    fd.append('is_active', isActiveBool ? '1' : '0');

                    const retry = await fetch(url, {
                      method: 'POST',
                      headers: authHeadersMultipart(),
                      body: fd,
                    });

                    if (retry.ok) {
                      const okResult = await retry.json().catch(() => ({}));
                      console.log('Retry success (POST + _method=PUT):', okResult);
                      setRefreshToggle((s) => !s);
                      return true;
                    }

                    const retryText = await retry.text();
                    console.log('Retry failed:', retry.status, retryText);
                    throw new Error(`HTTP ${retry.status}: ${retryText}`);
                  } catch (e) {
                    console.error('Fallback update failed:', e);
                    throw e;
                  }
                }

                const errorText = await response.text();
                console.log('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
              }

              const result = await response.json().catch(() => ({}));
              console.log("Community submit success:", result);

              setRefreshToggle((s) => !s);
              return true;
            } catch (error) {
              console.error("Error submitting community:", error);
              throw error;
            }
          },

        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            console.log('Form update data:', data);
            return {
              name: data?.name || "",
              description: data?.description || "",
              corporate_id: data?.corporate_id || data?.corporate?.id || "",
              bg_color_1: data?.bg_color_1 || data?.color || "",
              bg_color_2: data?.bg_color_2 || "",
              world_type: data?.world_type || data?.type || "",
              // PERBAIKI: is_active harus array untuk checkbox
              is_active: (data?.is_active || data?.active) ? [1] : [],
              // PERBAIKI: logo sebagai string untuk update
              logo: data?.logo || "",
            };
          },
        }}
      />

      {/* Kategori modal telah dihapus (tidak digunakan lagi) */}

      {/* MEMBERS MODAL */}
      <FloatingPageComponent
        show={modalMember}
        onClose={() => {
          // batalkan request berjalan saat modal ditutup
          if (memberReqRef.current.ac) {
            try { memberReqRef.current.ac.abort(); } catch { }
          }
          if (memberReqRef.current.timer) clearTimeout(memberReqRef.current.timer);
          memberReqRef.current = { ac: null, timer: null };

          setModalMember(false);
          setMemberList([]);
          setMemberError("");
        }}
        title={`Anggota: ${activeCommunity?.name || "-"}`}
        size="lg"
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Manajemen Anggota: {activeCommunity?.name || "-"}
            </h2>
          </div>

          {memberLoading ? (
            <div className="py-10 text-center text-gray-500 font-medium">Memuat anggota…</div>
          ) : memberError ? (
            <div className="py-10 text-center text-red-600 font-semibold">{memberError}</div>
          ) : (
            <TableSupervisionComponent
              key={`member-table-${activeCommunity?.id}-${memberList.length}`}
              title={`Daftar Anggota (${memberList.length})`}
              fetchControl={{
                path: `admin/communities/${activeCommunity?.id}/members`,
                includeHeaders: authHeaders("GET"),
              }}
              updateEndpoint="" // Untuk delete: /admin/communities/{id}/members/{member_id}
              searchable={true}
              noControlBar={false}
              unUrlPage={true}
              customTopBar={
                <div className="flex items-center justify-between w-full">
                  <ButtonComponent
                    label="Tambah Baru"
                    icon={faPlus}
                    size="sm"
                    paint="primary"
                    onClick={() => setModalAddMember(true)}
                  />
                  <div className="flex items-center gap-3">
                    <ButtonComponent
                      label="Permintaan Bergabung"
                      icon={faUserPlus}
                      size="sm"
                      paint="warning"
                      variant="outline"
                      rounded
                      onClick={() => openMemberRequestsModal(activeCommunity)}
                    />
                    <ButtonComponent
                      label="Riwayat Member"
                      icon={faHistory}
                      size="sm"
                      paint="warning"
                      variant="outline"
                      rounded
                      onClick={() => openMemberHistoryModal(activeCommunity)}
                    />
                  </div>
                </div>
              }
              columnControl={{
                searchable: ["name", "email", "phone", "role"],
                custom: [
                  {
                    selector: "name",
                    label: "Nama",
                    sortable: true,
                    item: (member) => (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {(member.name || member.full_name || "?").charAt(0).toUpperCase()
                            }</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name || member.full_name || "-"}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    selector: "email",
                    label: "Email",
                    sortable: true,
                    item: (member) => (
                      <span className="text-sm text-gray-600">
                        {member.email || "-"}
                      </span>
                    ),
                  },
                  {
                    selector: "phone",
                    label: "Telepon",
                    item: (member) => (
                      <span className="text-sm text-gray-600">
                        {member.phone || "-"}
                      </span>
                    ),
                  },
                  {
                    selector: "role",
                    label: "Role",
                    item: (member) => (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(member.role?.name || member.role || "").toLowerCase() === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {member.role?.name || member.role || "-"}
                      </span>
                    ),
                  },
                  {
                    selector: "joined_at",
                    label: "Bergabung",
                    sortable: true,
                    item: (member) => (
                      <span className="text-sm text-gray-600">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString("id-ID", {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                          : "-"
                        }
                      </span>
                    ),
                  },
                ],
              }}
              actionControl={{
                except: ["edit", "detail"], // Hanya disable edit dan detail, izinkan delete
                include: () => (
                  <div className="flex items-center gap-2">
                  </div>
                ),
              }}
            />
          )}
        </div>
      </FloatingPageComponent>

      {/* MEMBER REQUESTS MODAL */}
      <FloatingPageComponent
        show={modalMemberRequests}
        onClose={() => {
          setModalMemberRequests(false);
        }}
        title={`Permintaan Bergabung: ${activeCommunity?.name || "-"}`}
        size="lg"
      >
        <div className="p-6">
          <TableSupervisionComponent
            key={`member-requests-${activeCommunity?.id}-${refreshRequestsToggle}`}
            title="Daftar Permintaan Bergabung"
            searchable={true}
            noControlBar={false}
            unUrlPage={true}
            setToRefresh={refreshRequestsToggle}
            // ⬇️ Tambahkan ini untuk menghilangkan tombol "Tambah Baru"
            customTopBar={<div />}
            fetchControl={{
              path: `admin/communities/${activeCommunity?.id}/member-requests`,
              method: "GET",
              headers: () => authHeaders("GET"),
              mapData: (result) => {
                const d = result?.data ?? result;
                const rows = Array.isArray(d) ? d
                  : Array.isArray(d?.data) ? d.data
                    : Array.isArray(result) ? result
                      : [];
                return { data: rows, totalRow: rows.length };
              },
            }}
            columnControl={{
              // "message" dihapus dari searchable, ganti "status"
              searchable: ["name", "email", "status"],
              custom: [
                {
                  selector: "name",
                  label: "Nama",
                  sortable: true,
                  item: (row) => {
                    const name = row.user?.name || row.name || "-";
                    return (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {String(name).charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{name}</div>
                          <div className="text-xs text-gray-500">{row.user?.email || row.email || "-"}</div>
                        </div>
                      </div>
                    );
                  },
                },

                // ==== GANTI "Pesan" -> "Status" ====
                {
                  selector: "status",
                  label: "Status",
                  item: (row) => {
                    // fallback status detection
                    const raw =
                      (row.status || row.state || "").toString().toLowerCase() ||
                      (row.approved ? "approved" : (row.rejected ? "rejected" : "pending"));

                    const isApproved = raw === "approved" || raw === "accepted" || raw === "diterima";
                    const isRejected = raw === "rejected" || raw === "ditolak";

                    const text = isApproved ? "Diterima" : isRejected ? "Ditolak" : "Menunggu";
                    const cls = isApproved
                      ? "bg-green-100 text-green-800 border-green-200"
                      : isRejected
                        ? "bg-red-100 text-red-800 border-red-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200";

                    return (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${cls}`}>
                        {text}
                      </span>
                    );
                  },
                },

                {
                  selector: "created_at",
                  label: "Diminta Pada",
                  sortable: true,
                  item: (row) => (
                    <span className="text-sm text-gray-600">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-"}
                    </span>
                  ),
                },
              ],
            }}
            actionControl={{
              // ==== HILANGKAN DELETE ====
              except: ["edit", "detail", "delete"],
              include: (row) => {
                // optional: disable tombol kalau sudah approved/rejected
                const raw =
                  (row.status || row.state || "").toString().toLowerCase() ||
                  (row.approved ? "approved" : (row.rejected ? "rejected" : "pending"));
                const isApproved = raw === "approved" || raw === "accepted" || raw === "diterima";
                const isRejected = raw === "rejected" || raw === "ditolak";
                return (
                  <div className="flex items-center gap-2">
                    <ButtonComponent
                      label="Setujui"
                      icon={faCheck}
                      size="xs"
                      paint="success"
                      variant="solid"
                      rounded
                      disabled={isApproved}
                      onClick={() => handleMemberRequest(row.id, "approve")}
                    />
                    <ButtonComponent
                      label="Tolak"
                      icon={faTimes}
                      size="xs"
                      paint="danger"
                      variant="outline"
                      rounded
                      disabled={isRejected}
                      onClick={() => handleMemberRequest(row.id, "reject")}
                    />
                  </div>
                );
              },
            }}
          />
        </div>
      </FloatingPageComponent>


      {/* MEMBER HISTORY MODAL */}
      <FloatingPageComponent
        show={modalMemberHistory}
        onClose={() => {
          setModalMemberHistory(false);
          setMemberHistoryError("");
        }}
        title={`Riwayat Member: ${activeCommunity?.name || "-"}`}
        size="lg"
      >
        <div className="p-6">
          {memberHistoryError ? (
            <div className="py-10 text-center text-red-600 font-semibold">{memberHistoryError}</div>
          ) : (
            <TableSupervisionComponent
              key={`member-history-${activeCommunity?.id}`}
              title={`Riwayat Member`}
              searchable={true}
              noControlBar={false}
              customTopBar={<></>} // tampilkan bar kontrol (filter, search)
              unUrlPage={true}
              fetchControl={{
                path: `admin/communities/${activeCommunity?.id}/member-history`,
                includeHeaders: authHeaders("GET"),
              }}
              // Tambahkan kolom searchable dan definisi custom filter
              columnControl={{
                searchable: ["user_name", "created_at"],
                custom: [
                  {
                    selector: "user_name",
                    label: "Nama",
                    sortable: true,
                    item: (history) => (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {(history.user?.name || history.user_name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {history.user?.name || history.user_name || "-"}
                          </div>
                          <div className="text-xs text-gray-500">{history.user?.email || "-"}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    selector: "status", // Ubah dari "status" ke "action" karena API mengembalikan field "action"
                    label: "Status",
                    // Tambahkan filter agar bisa memilih Masuk/Keluar/Dihapus
                    filter: {
                      type: "multiple-select",
                      options: [
                        { label: "Masuk", value: "joined" },
                        { label: "Keluar", value: "left" },
                        { label: "Dihapus", value: "removed" },
                      ],
                    },
                    item: (history) => {
                      // Gunakan field action langsung dari API
                      const action = (history?.action || "").toLowerCase();

                      let text = "-";
                      let cls = "bg-gray-100 text-gray-800";

                      if (action === "joined") {
                        text = "Masuk";
                        cls = "bg-green-100 text-green-800";
                      } else if (action === "left") {
                        text = "Keluar";
                        cls = "bg-yellow-100 text-yellow-800";
                      } else if (["removed", "deleted", "kicked"].includes(action)) {
                        text = "Dihapus";
                        cls = "bg-red-100 text-red-800";
                      }

                      return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
                          {text}
                        </span>
                      );
                    },
                  },
                  {
                    selector: "created_at",
                    label: "Waktu",
                    sortable: true,
                    item: (history) => (
                      <span className="text-sm text-gray-600">
                        {history.created_at
                          ? new Date(history.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "-"}
                      </span>
                    ),
                  },
                ],
              }}
              actionControl={{
                except: ["edit", "delete", "detail"],
              }}
            />
          )}
        </div>
      </FloatingPageComponent>

      {/* ADD MEMBER MODAL */}
      <FloatingPageComponent
        show={modalAddMember}
        onClose={() => setModalAddMember(false)}
        title="Tambah Anggota Baru"
        size="md"
      >
        <div className="p-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const userId = formData.get("user_id");
              try {
                const res = await fetch(apiJoin(`admin/communities/${activeCommunity?.id}/members`), {
                  method: "POST",
                  headers: authHeaders("POST"),
                  body: JSON.stringify({ user_identifier: userId }),
                });

                if (!res.ok) throw new Error("Gagal menambah anggota");
                setModalAddMember(false);
                openMemberModal(activeCommunity); // refresh data
              } catch (err) {
                alert(err.message);
              }
            }}
          >
            <label className="block mb-2 text-sm font-medium">Email Terdaftar</label>
            <input
              name="user_id"
              type="text"
              placeholder="Masukkan Email User"
              className="border rounded w-full p-2 mb-4"
              required
            />
            <ButtonComponent label="Simpan" paint="primary" type="submit" />
          </form>
        </div>
      </FloatingPageComponent>

      {/* CUBES MODAL */}
      <FloatingPageComponent
        show={modalCubes}
        onClose={() => {
          setModalCubes(false);
          setCubeList([]);
          setCubeError("");
        }}
        title={`Daftar Kubus: ${activeCommunity?.name || "-"}`}
        size="lg"
      >
        <div className="p-6">
          {cubeLoading ? (
            <div className="py-10 text-center text-gray-500 font-medium">Memuat kubus…</div>
          ) : cubeError ? (
            <div className="py-10 text-center text-red-600 font-semibold">{cubeError}</div>
          ) : cubeList.length === 0 ? (
            <div className="py-10 text-center text-gray-500 font-medium">Tidak ada kubus dalam komunitas ini.</div>
          ) : (
            // ⬇️ Tabel Kubus dengan filter tipe (home/hunting/information) dan pencarian widget
            <TableSupervisionComponent
              key={`cube-table-${activeCommunity?.id}-${cubeList.length}`}
              title={`Daftar Kubus (${cubeList.length})`}
              data={filteredCubeList}
              // Top bar: filter tipe widget + pencarian nama widget
              customTopBar={
                <div className="flex items-center gap-3 w-full">
                  <div className="w-64">
                    <SelectComponent
                      name="widgetTypeFilter"
                      label="Tipe Widget"
                      placeholder="Pilih tipe..."
                      multiple
                      searchable={false}
                      options={[
                        { label: "Home", value: "home" },
                        { label: "Hunting", value: "hunting" },
                        { label: "Information", value: "information" },
                      ]}
                      value={cubeTypeFilter}
                      onChange={(val) => setCubeTypeFilter(Array.isArray(val) ? val : [])}
                    />
                  </div>
                  <div className="flex-1">
                    <InputComponent
                      name="widgetSearch"
                      label="Cari Widget/Tipe/Nama Kubus"
                      placeholder="Contoh: home / hunting / information / nama widget"
                      size="md"
                      value={cubeWidgetSearch}
                      onChange={(e) => setCubeWidgetSearch(String(e || ""))}
                    />
                  </div>
                </div>
              }
              noControlBar={false}
              unUrlPage={true}
              searchable={false}
              columnControl={{
                custom: [
                  {
                    selector: "name",
                    label: "Nama Kubus",
                    item: (cube) => cube.name ?? "-",
                  },
                  {
                    selector: "widget_name",
                    label: "Widget Asal",
                    item: (cube) => (
                      <div>
                        <span className="font-medium text-gray-800">{cube.widget_name ?? "-"}</span>
                        <div className="text-xs text-gray-500 italic">({cube.widget_type ?? "unknown"})</div>
                      </div>
                    ),
                  },
                  {
                    selector: "widget_type",
                    label: "Tipe",
                    width: "120px",
                    item: (cube) => (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                        {(cube.widget_type || "-").toString().charAt(0).toUpperCase() + (cube.widget_type || "-").toString().slice(1)}
                      </span>
                    ),
                  },
                  {
                    selector: "type",
                    label: "Status",
                    item: (cube) => (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs ${cube.type === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {cube.type === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    ),
                  },
                  {
                    selector: "created_at",
                    label: "Dibuat Pada",
                    item: (cube) =>
                      cube.created_at
                        ? new Date(cube.created_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                        : "-",
                  },
                ],
              }}
              actionControl={{
                // Hilangkan tombol Ubah (edit) dan Hapus (delete)
                except: ["edit", "delete"],
              }}
            />
            // ⬆️ tempelkan di sini
          )}
        </div>
      </FloatingPageComponent>
    </>
  );
}

KomunitasDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
