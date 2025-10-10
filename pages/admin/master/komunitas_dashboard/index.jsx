/* eslint-disable no-console */
import { faPlus, faUsers, faTrash, faUserPlus, faHistory, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import Image from "next/image";
// import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ButtonComponent,
  FloatingPageComponent,
  TableSupervisionComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import InputHexColor from "../../../../components/construct.components/input/InputHexColor";
import { token_cookie_name } from "../../../../helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";

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
  const [memberRequestsList, setMemberRequestsList] = useState([]);
  const [memberRequestsLoading, setMemberRequestsLoading] = useState(false);
  const [memberRequestsError, setMemberRequestsError] = useState("");

  /** MEMBER HISTORY modal state */
  const [modalMemberHistory, setModalMemberHistory] = useState(false);
  const [memberHistoryList, setMemberHistoryList] = useState([]);
  const [memberHistoryLoading, setMemberHistoryLoading] = useState(false);
  const [memberHistoryError, setMemberHistoryError] = useState("");

  // const router = useRouter();

  // Debug logs removed - member modal now working with manual table

  /** ============ FETCH ADMIN CONTACTS removed in new design ============ */

  // Fetch Mitra (Corporates) untuk dropdown "Mitra"
  useEffect(() => {
    const fetchCorporates = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
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
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    const base = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    // Hanya kirim Content-Type untuk method yang punya body JSON
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
      return { ...base, "Content-Type": "application/json" };
    }
    return base; // GET/HEAD: simple request → no preflight
  };

  const authHeadersMultipart = () => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    return { Authorization: `Bearer ${token}` };
  };

  // Kategori modal dan prefetch promo dihapus; tidak dibutuhkan lagi.

  /** ============ MEMBERS MODAL ACTIONS ============ */
  const tryFetch = async (url, signal) =>
    fetch(url, { method: "GET", headers: authHeaders("GET"), signal });

  const openMemberRequestsModal = async (communityRow) => {
    setActiveCommunity(communityRow);
    setModalMemberRequests(true);
    setMemberRequestsLoading(true);
    setMemberRequestsError("");
    setMemberRequestsList([]);

    try {
      const res = await tryFetch(apiJoin(`admin/communities/${communityRow.id}/member-requests`));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json?.data) ? json.data : [];
      setMemberRequestsList(rows);
    } catch (err) {
      console.error("Gagal memuat permintaan bergabung:", err);
      setMemberRequestsError("Tidak bisa memuat daftar permintaan bergabung");
    } finally {
      setMemberRequestsLoading(false);
    }
  };

  const openMemberHistoryModal = async (communityRow) => {
    setActiveCommunity(communityRow);
    setModalMemberHistory(true);
    setMemberHistoryLoading(true);
    setMemberHistoryError("");
    setMemberHistoryList([]);

    try {
      const res = await tryFetch(apiJoin(`admin/communities/${communityRow.id}/member-history`));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json?.data) ? json.data : [];
      setMemberHistoryList(rows);
    } catch (err) {
      console.error("Gagal memuat riwayat member:", err);
      setMemberHistoryError("Tidak bisa memuat riwayat member");
    } finally {
      setMemberHistoryLoading(false);
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
      // Refresh the requests list
      if (activeCommunity) {
        openMemberRequestsModal(activeCommunity);
      }
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
      try { memberReqRef.current.ac.abort(); } catch {}
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
          const active = !!(row?.is_active || row?.status === "active" || row?.active);
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
              {/* Hapus tombol Kategori */}
              <ButtonComponent
                label="Anggota"
                icon={faUsers}
                size="xs"
                paint="secondary"
                variant="solid"
                rounded
                disabled={memberLoading}                 // cegah spam click
                onClick={() => {
                  if (!memberLoading) openMemberModal(row); // guard race
                }}
              />
            </div>
          ),
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
                label: "Jenis Dunia",
                placeholder: "Pilih Jenis Dunia..",
                options: [
                  { label: "Pribadi", value: "pribadi" },
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
              const form = new FormData();
              form.append("name", payload.name || "");
              form.append("description", payload.description || "");

              // Mitra (corporate)
              if (payload.corporate_id) form.append("corporate_id", String(payload.corporate_id));

              // Warna background
              if (payload.bg_color_1) form.append("bg_color_1", payload.bg_color_1);
              if (payload.bg_color_2) form.append("bg_color_2", payload.bg_color_2);

              // Jenis dunia
              if (payload.world_type) {
                form.append("world_type", payload.world_type);
                // fallback field name if backend expects 'type'
                form.append("type", payload.world_type);
              }

              // Aktif
              if (Array.isArray(payload.is_active)) {
                form.append("is_active", payload.is_active.includes(1) ? "1" : "0");
              } else if (typeof payload.is_active === "boolean") {
                form.append("is_active", payload.is_active ? "1" : "0");
              }

              // Logo
              if (payload.logo && typeof payload.logo !== "string") form.append("logo", payload.logo);
              
              const url = isUpdate
                ? apiJoin(`admin/communities/${row.id}`)
                : apiJoin("admin/communities");
              const method = isUpdate ? "PUT" : "POST";
              
              console.log('Submitting community:', { url, method, payload });
              
              const response = await fetch(url, { 
                method, 
                headers: authHeadersMultipart(), 
                body: form 
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Community submit failed:', { 
                  status: response.status, 
                  statusText: response.statusText, 
                  body: errorText 
                });
                throw new Error(`HTTP ${response.status}: ${errorText}`);
              }
              
              const result = await response.json().catch(() => ({}));
              console.log('Community submit success:', result);
              
              setRefreshToggle((s) => !s);
              return true;
            } catch (error) {
              console.error('Error submitting community:', error);
              throw error;
            }
          },
        }}
        formUpdateControl={{
          customDefaultValue: (data) => ({
            name: data?.name || "",
            description: data?.description || "",
            corporate_id: data?.corporate_id || data?.corporate?.id || "",
            bg_color_1: data?.bg_color_1 || data?.color || "",
            bg_color_2: data?.bg_color_2 || "",
            world_type: data?.world_type || data?.type || "",
            is_active: data?.is_active ? [1] : [],
          }),
        }}
      />

      {/* Kategori modal telah dihapus (tidak digunakan lagi) */}

      {/* MEMBERS MODAL */}
      <FloatingPageComponent
        show={modalMember}
        onClose={() => {
          // batalkan request berjalan saat modal ditutup
          if (memberReqRef.current.ac) {
            try { memberReqRef.current.ac.abort(); } catch {}
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
          ) : memberList.length === 0 ? (
            <div className="py-10 text-center text-gray-500 font-medium">Belum ada anggota.</div>
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
              noControlBar={true}
              unUrlPage={true}
              customTopBar={
                <div className="flex items-center justify-between w-full">
                  <ButtonComponent
                    label="Tambah Baru"
                    icon={faPlus}
                    size="sm"
                    paint="primary"
                    onClick={() => {/* Implementasi tambah anggota baru */}}
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
                      paint="info"
                      variant="outline"
                      rounded
                      onClick={() => openMemberHistoryModal(activeCommunity)}
                    />
                  </div>
                </div>
              }
              columnControl={{
                custom: [
                  {
                    selector: "name",
                    label: "Nama",
                    sortable: true,
                    item: (member) => (
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {(member.name || member.full_name || "?").charAt(0).toUpperCase()}
                          </span>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (member.role?.name || member.role || "").toLowerCase() === 'admin' 
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
          setMemberRequestsList([]);
          setMemberRequestsError("");
        }}
        title={`Permintaan Bergabung: ${activeCommunity?.name || "-"}`}
        size="lg"
      >
        <div className="p-6">
          {memberRequestsLoading ? (
            <div className="py-10 text-center text-gray-500 font-medium">Memuat permintaan bergabung…</div>
          ) : memberRequestsError ? (
            <div className="py-10 text-center text-red-600 font-semibold">{memberRequestsError}</div>
          ) : memberRequestsList.length === 0 ? (
            <div className="py-10 text-center text-gray-500 font-medium">Tidak ada permintaan bergabung.</div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Daftar Permintaan Bergabung ({memberRequestsList.length})
              </h3>
              
              <div className="space-y-3">
                {memberRequestsList.map((request, index) => (
                  <div key={request.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {(request.user?.name || request.name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.user?.name || request.name || "-"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.user?.email || request.email || "-"}
                          </div>
                          <div className="text-xs text-gray-400">
                            Diminta pada: {request.created_at 
                              ? new Date(request.created_at).toLocaleDateString("id-ID", {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : "-"
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ButtonComponent
                          label="Setujui"
                          icon={faCheck}
                          size="xs"
                          paint="success"
                          variant="solid"
                          rounded
                          onClick={() => handleMemberRequest(request.id, 'approve')}
                        />
                        <ButtonComponent
                          label="Tolak"
                          icon={faTimes}
                          size="xs"
                          paint="danger"
                          variant="outline"
                          rounded
                          onClick={() => handleMemberRequest(request.id, 'reject')}
                        />
                      </div>
                    </div>
                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Pesan:</span> {request.message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </FloatingPageComponent>

      {/* MEMBER HISTORY MODAL */}
      <FloatingPageComponent
        show={modalMemberHistory}
        onClose={() => {
          setModalMemberHistory(false);
          setMemberHistoryList([]);
          setMemberHistoryError("");
        }}
        title={`Riwayat Member: ${activeCommunity?.name || "-"}`}
        size="lg"
      >
        <div className="p-6">
          {memberHistoryLoading ? (
            <div className="py-10 text-center text-gray-500 font-medium">Memuat riwayat member…</div>
          ) : memberHistoryError ? (
            <div className="py-10 text-center text-red-600 font-semibold">{memberHistoryError}</div>
          ) : memberHistoryList.length === 0 ? (
            <div className="py-10 text-center text-gray-500 font-medium">Tidak ada riwayat member.</div>
          ) : (
            <TableSupervisionComponent
              key={`member-history-${activeCommunity?.id}-${memberHistoryList.length}`}
              title={`Riwayat Member (${memberHistoryList.length})`}
              fetchControl={{
                path: `admin/communities/${activeCommunity?.id}/member-history`,
                includeHeaders: authHeaders("GET"),
              }}
              searchable={true}
              noControlBar={true}
              unUrlPage={true}
              columnControl={{
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
                        </div>
                      </div>
                    ),
                  },
                  {
                    selector: "action",
                    label: "Aksi",
                    item: (history) => (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        history.action === 'joined' 
                          ? 'bg-green-100 text-green-800'
                          : history.action === 'left'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {history.action === 'joined' ? 'Bergabung' : 
                         history.action === 'left' ? 'Keluar' : 
                         history.action || '-'}
                      </span>
                    ),
                  },
                  {
                    selector: "created_at",
                    label: "Waktu",
                    sortable: true,
                    item: (history) => (
                      <span className="text-sm text-gray-600">
                        {history.created_at 
                          ? new Date(history.created_at).toLocaleDateString("id-ID", {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : "-"
                        }
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
    </>
  );
}

KomunitasDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
