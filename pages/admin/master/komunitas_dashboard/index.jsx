/* eslint-disable no-console */
import { faPlus, faUsers, faTags } from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  ButtonComponent,
  FloatingPageComponent,
  TableSupervisionComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import MultiSelectDropdown from "../../../../components/form/MultiSelectDropdown";
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

  /** CATEGORIES modal state */
  const [modalCategory, setModalCategory] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState(null);

  /** MEMBERS modal state */
  const [modalMember, setModalMember] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");

  /** Promo dropdown (opsional lampirkan saat create kategori) */
  const [existingPromoList, setExistingPromoList] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);

  const router = useRouter();
  const goPromoHome = () => {
    const q = activeCommunity?.id ? `?communityId=${activeCommunity.id}` : "";
    router.push(`/admin/promos${q}`);
  };

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
    const base = { Authorization: `Bearer ${token}` };
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

  /** Prefetch daftar promo ketika modal kategori dibuka */
  useEffect(() => {
    if (!modalCategory) return;

    let ignore = false;
    (async () => {
      try {
        setPromoLoading(true);
        const url = apiJoin("admin/promos?all=true");
        const resP = await fetch(url, { headers: authHeaders("GET") });

        if (!resP.ok) {
          const body = await resP.text().catch(() => "");
          console.error("Fetch promos failed", { url, status: resP.status, statusText: resP.statusText, body });
          if (!ignore) setExistingPromoList([]);
          return;
        }

        const jsonP = await resP.json().catch(() => ({}));
        // normalisasi ke bentuk { value, label } yang dibutuhkan MultiSelectDropdown
        const promosRaw = Array.isArray(jsonP.data) ? jsonP.data : Array.isArray(jsonP) ? jsonP : [];
        const promoOptions = promosRaw.map((p) => ({
          value: String(p.id ?? p.value ?? ""),
          label:
            (p.title && String(p.title)) ||
            (p.name && String(p.name)) ||
            (p.code && String(p.code)) ||
            (p.description && String(p.description).slice(0, 60)) ||
            `Promo #${p.id ?? ''}`,
          _raw: p,
        }));
        if (!ignore) {
          setExistingPromoList(promoOptions);
          console.log("Loaded promo options:", promoOptions.length, promoOptions.slice(0,3));
        }
      } catch (e) {
        console.error("Error fetching promos", e);
        if (!ignore) setExistingPromoList([]);
      } finally {
        if (!ignore) setPromoLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [modalCategory]);

  /** ============ MEMBERS MODAL ACTIONS ============ */
  const openMemberModal = async (communityRow) => {
    setActiveCommunity(communityRow);
    setModalMember(true);
    setMemberLoading(true);
    setMemberError("");
    setMemberList([]);

    // Ganti tryFetch agar GET tidak kirim Content-Type
    const tryFetch = async (url) =>
      fetch(url, { method: "GET", headers: authHeaders("GET") });

    try {
      let res = await tryFetch(apiJoin(`admin/communities/${communityRow.id}/members`));
      if (res.status === 404) {
        res = await tryFetch(apiJoin(`communities/${communityRow.id}/members`));
      }
      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      setMemberList(rows);
    } catch (err) {
      console.error("Gagal memuat anggota:", err);
      setMemberError("Tidak bisa memuat daftar anggota");
    } finally {
      setMemberLoading(false);
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
                label="Kategori"
                icon={faTags}
                size="xs"
                paint="primary"
                variant="outline"
                rounded
                onClick={() => {
                  setActiveCommunity(row);
                  setModalCategory(true);
                }}
              />
              <ButtonComponent
                label="Anggota"
                icon={faUsers}
                size="xs"
                paint="secondary"
                variant="solid"
                rounded
                onClick={() => openMemberModal(row)}
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

      {/* CATEGORIES MODAL */}
      <FloatingPageComponent
        show={modalCategory}
        onClose={() => {
          setModalCategory(false);
          setActiveCommunity(null);
        }}
        title={`Kategori Komunitas: ${activeCommunity?.name || "-"}`}
        size="lg"
      >
        {activeCommunity && (
          <div className="p-4">
            {/* Segmented: Beranda (aktif) & Beranda Promo */}
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center bg-white p-1 rounded-full border border-purple-300">
                <button
                  type="button"
                  className="px-4 py-1.5 text-sm font-medium rounded-full
                             bg-purple-700 text-white ring-1 ring-purple-700/20
                             hover:bg-purple-800 transition"
                >
                  Beranda
                </button>
                <button
                  type="button"
                  onClick={goPromoHome}
                  className="px-4 py-1.5 text-sm font-medium rounded-full
                             text-purple-700 hover:bg-purple-50 transition"
                >
                  Beranda Promo
                </button>
              </div>
            </div>

            <TableSupervisionComponent
              title="Daftar Kategori"
              data={[]}
              columnControl={{
                custom: [
                  { selector: "title", label: "Judul", sortable: true, item: ({ title }) => title || "-" },
                  { selector: "description", label: "Deskripsi", item: ({ description }) => description || "-" },
                  {
                    selector: "promos_count",
                    label: "Jumlah Promo",
                    width: "140px",
                    item: (row) => {
                      const count = Array.isArray(row?.promos)
                        ? row.promos.length
                        : Array.isArray(row?.items)
                        ? row.items.filter((i) => (i.type || i.item_type) === "promo").length
                        : row?.promos_count || 0;
                      return <span className="font-semibold">{count}</span>;
                    },
                  },
                ],
              }}
              searchable
              noControlBar={false}
              fetchControl={{
                path: `communities/${activeCommunity.id}/categories`,
                method: "GET",
                headers: () => authHeaders("GET"),
                mapData: (result) => {
                  const cats = Array.isArray(result) ? result : result?.data || [];
                  return { data: cats, totalRow: cats.length };
                },
              }}
              actionControl={{ except: ["detail"] }}
              tableKey={`categories-${activeCommunity.id}-${existingPromoList.length}`}
              formControl={{
                /** Tambah Kategori + (opsional) lampirkan promo ke kategori yang baru dibuat */
                custom: [
                  {
                    construction: {
                      name: "title",
                      label: "Judul Kategori",
                      placeholder: "cth. Diskon Makanan",
                      validations: { required: true },
                    },
                  },
                  {
                    type: "textarea",
                    construction: {
                      name: "description",
                      label: "Deskripsi",
                      rows: 3,
                    },
                  },
                  {
  type: "component",
  construction: {
    name: "_attach_promo_ids",
    label: "Lampirkan Promo (opsional)",
    render: ({ value, onChange }) => {
      // Normalisasi value ke array of string
      const normalizedValue = Array.isArray(value) ? value.map(String) : [];
      console.log('Render attach promo field', {
        value,
        normalizedValue,
        options: existingPromoList,
      });
      return promoLoading ? (
        <div className="text-sm text-gray-500">Memuat daftar promo…</div>
      ) : (
        <MultiSelectDropdown
          key={`promo-${activeCommunity?.id}-${existingPromoList.length}`}
          options={existingPromoList}
          value={normalizedValue}
          onChange={onChange}
          placeholder={
            existingPromoList.length === 0
              ? "Belum ada promo tersedia"
              : "Pilih promo yang ingin dilampirkan..."
          }
          maxHeight={260}
        />
      );
    },
  },
}

                ],
                submit: async ({ payload, isUpdate, row }) => {
                  if (isUpdate) {
                    // Update kategori
                    const urlU = apiJoin(`communities/${activeCommunity.id}/categories/${row.id}`);
                    await fetch(urlU, {
                      method: "PUT",
                      headers: authHeaders("PUT"),
                      body: JSON.stringify({
                        title: payload.title,
                        description: payload.description || "",
                      }),
                    });
                    return true;
                  }

                  // Create kategori
                  const urlC = apiJoin(`communities/${activeCommunity.id}/categories`);
                  const res = await fetch(urlC, {
                    method: "POST",
                    headers: authHeaders("POST"),
                    body: JSON.stringify({
                      title: payload.title,
                      description: payload.description || "",
                    }),
                  });
                  const json = await res.json().catch(() => ({}));

                  // Ambil ID kategori baru dari berbagai kemungkinan bentuk response
                  const createdId =
                    json?.id ||
                    json?.data?.id ||
                    json?.category?.id ||
                    json?.result?.id;

                  // Jika user pilih promo, lampirkan semua promo yang dipilih
                  if (createdId && Array.isArray(payload._attach_promo_ids) && payload._attach_promo_ids.length > 0) {
                    for (const promoId of payload._attach_promo_ids) {
                      const urlA = apiJoin(
                        `communities/${activeCommunity.id}/categories/${createdId}/attach`
                      );
                      await fetch(urlA, {
                        method: "POST",
                        headers: authHeaders("POST"),
                        body: JSON.stringify({ type: "promo", id: Number(promoId) }), // cast ke number saat kirim
                      });
                    }
                  }
                  return true;
                },
              }}
              formUpdateControl={{
                customDefaultValue: (data) => ({
                  title: data?.title || "",
                  description: data?.description || "",
                  _attach_promo_ids: [],
                }),
              }}
            />
          </div>
        )}
      </FloatingPageComponent>

      {/* MEMBERS MODAL */}
      <FloatingPageComponent
        show={modalMember}
        onClose={() => {
          setModalMember(false);
          setMemberList([]);
          setMemberError("");
        }}
        title={`Anggota: ${activeCommunity?.name || "-"}`}
        size="lg"
      >
        <div className="p-6">
          {memberLoading ? (
            <div className="py-10 text-center text-gray-500 font-medium">Memuat anggota…</div>
          ) : memberError ? (
            <div className="py-10 text-center text-red-600 font-semibold">{memberError}</div>
          ) : memberList.length === 0 ? (
            <div className="py-10 text-center text-gray-500 font-medium">Belum ada anggota.</div>
          ) : (
            <TableSupervisionComponent
              title="Daftar Anggota"
              data={memberList}
              columnControl={{
                custom: [
                  { selector: "name", label: "Nama", item: (m) => m.name || m.full_name || "-" },
                  { selector: "email", label: "Email", item: ({ email }) => email || "-" },
                  { selector: "phone", label: "Telepon", item: ({ phone }) => phone || "-" },
                  { selector: "role", label: "Role", item: (m) => m.role?.name || m.role || "-" },
                  {
                    selector: "joined_at",
                    label: "Bergabung",
                    item: (m) =>
                      m.joined_at ? new Date(m.joined_at).toLocaleDateString("id-ID") : "-",
                  },
                ],
              }}
              searchable
              noControlBar
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
