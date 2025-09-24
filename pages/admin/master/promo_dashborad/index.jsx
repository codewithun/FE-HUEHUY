/* eslint-disable no-console */
import Cookies from "js-cookie";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  InputComponent,
  InputImageComponent,
  ModalConfirmComponent,
  SelectComponent,
  TableSupervisionComponent,
  TextareaComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import { token_cookie_name } from "../../../../helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";

/* -------------------- Helpers -------------------- */

const getApiBase = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return raw.replace(/\/api\/?$/, "");
};

const buildImageUrl = (raw) => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = getApiBase();
  let path = String(raw).replace(/^\/+/, "");
  path = path.replace(/^api\/storage\//, "storage/");
  if (!/^storage\//.test(path)) path = `storage/${path}`;
  return `${base}/${path}`;
};

const formatDateID = (raw) => {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
};

// Helper aman ambil nama & telp dari berbagai bentuk field
const getDisplayName = (u) =>
  u?.name || u?.full_name || u?.username || u?.display_name || `User #${u?.id}`;
const getPhone = (u) =>
  u?.phone || u?.phone_number || u?.telp || u?.telpon || u?.mobile || u?.contact || "";

// normalisasi role → 'manager_tenant'
const norm = (v) =>
  String(v ?? "").toLowerCase().replace(/[-\s]+/g, "_");
const isManagerTenant = (u) => {
  const target = "manager_tenant";
  if (norm(u?.role?.name) === target) return true;   // { role: { name: '...' } }
  if (norm(u?.role) === target) return true;         // { role: '...' }
  if (norm(u?.user_role) === target) return true;    // { user_role: '...' }
  if (Array.isArray(u?.roles)) {                     // ['...'] / [{ name:'...' }]
    return u.roles.some((r) => norm(r?.name ?? r) === target);
  }
  return false;
};

/* -------------------- Page -------------------- */

function PromoDashboard() {
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  // Communities
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [formError, setFormError] = useState(null);

  // Manager Tenant
  const [merchantManagers, setMerchantManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managersError, setManagersError] = useState(null);

  const apiBase = useMemo(() => getApiBase(), []);
  const MANAGERS_ENDPOINT = `${apiBase}/api/admin/users?roles[]=manager_tenant&roles[]=manager%20tenant&paginate=all`;

  const authHeader = useCallback(() => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : "";
    return { Authorization: `Bearer ${token}` };
  }, []);

  /* ---------- Fetch communities ---------- */
  useEffect(() => {
    const fetchCommunities = async () => {
      setCommunitiesLoading(true);
      setFormError(null);
      try {
        const res = await fetch(`${apiBase}/api/admin/communities`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...authHeader(),
          },
        });
        if (res.ok) {
          const result = await res.json();
          let communitiesData = [];
          if (result?.success && Array.isArray(result?.data)) communitiesData = result.data;
          else if (Array.isArray(result?.data)) communitiesData = result.data;
          else if (Array.isArray(result)) communitiesData = result;
          else if (Array.isArray(result?.communities)) communitiesData = result.communities;
          setCommunities(communitiesData);
        } else {
          const errorText = await res.text();
          setFormError(
            `Failed to fetch communities: ${res.status} ${errorText?.slice?.(0, 120) || ""}`
          );
          setCommunities([]);
        }
      } catch (error) {
        setFormError(`Network error: ${error.message}`);
        setCommunities([]);
      } finally {
        setCommunitiesLoading(false);
      }
    };
    fetchCommunities();
  }, [apiBase, authHeader]);

  /* ---------- Fetch manager_tenant ---------- */
  useEffect(() => {
    const fetchManagers = async () => {
      setManagersLoading(true);
      setManagersError(null);
      try {
        const res = await fetch(MANAGERS_ENDPOINT, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...authHeader(),
          },
        });
        if (res.ok) {
          const result = await res.json();
          let usersData = [];
          if (result?.success && Array.isArray(result?.data)) usersData = result.data;
          else if (Array.isArray(result?.data)) usersData = result.data;
          else if (Array.isArray(result?.users)) usersData = result.users;
          else if (Array.isArray(result)) usersData = result;

          // Jaga-jaga bila BE belum filternya pas
          usersData = usersData.filter(isManagerTenant);
          // opsional: urutkan biar rapi
          usersData.sort((a,b) => (getDisplayName(a) || "").localeCompare(getDisplayName(b) || "", "id"));

          setMerchantManagers(usersData);
        } else {
          const errorText = await res.text();
          setManagersError(
            `Gagal ambil manager tenant: ${res.status} ${errorText?.slice?.(0, 120) || ""}`
          );
          setMerchantManagers([]);
        }
      } catch (e) {
        setManagersError(`Network error: ${e.message}`);
        setMerchantManagers([]);
      } finally {
        setManagersLoading(false);
      }
    };
    fetchManagers();
  }, [MANAGERS_ENDPOINT, authHeader]);

  const handleDelete = async () => {
    if (!selectedPromo) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/promos/${selectedPromo.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
      });
      if (res.ok) {
        setRefreshToggle((s) => !s);
        alert("Promo berhasil dihapus");
      } else {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        alert(`Gagal menghapus promo: ${errorData.message || res.status}`);
      }
    } catch (error) {
      console.error("Error deleting promo:", error);
      alert("Gagal menghapus promo: Network error");
    } finally {
      setModalDelete(false);
      setSelectedPromo(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        selector: "title",
        label: "Judul Promo",
        sortable: true,
        item: ({ title }) => <span className="font-semibold">{title || "-"}</span>,
      },
      {
        selector: "code",
        label: "Kode",
        sortable: true,
        item: ({ code }) => <span className="font-mono text-sm">{code || "-"}</span>,
      },
      {
        selector: "image",
        label: "Gambar",
        width: "100px",
        item: ({ image }) => {
          const src = buildImageUrl(image);
          return src ? (
            <Image src={src} alt="Promo" width={48} height={48} className="w-12 h-12 object-cover rounded-lg" />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">No Image</span>
            </div>
          );
        },
      },
      {
        selector: "stock",
        label: "Sisa Stock",
        sortable: true,
        item: ({ stock }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              Number(stock) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {Number(stock ?? 0)} promo
          </span>
        ),
      },
      {
        selector: "promo_type",
        label: "Tipe",
        item: ({ promo_type }) => <span className="capitalize">{promo_type || "offline"}</span>,
      },
      {
        selector: "community_id",
        label: "Community",
        item: ({ community_id, community }) => {
          if (community?.name) return <span className="text-sm">{community.name}</span>;
          const foundCommunity = communities.find((c) => c.id == community_id);
          return (
            <span className="text-sm">
              {foundCommunity?.name || foundCommunity?.title || `ID: ${community_id || "-"}`}
            </span>
          );
        },
      },
      {
        selector: "end_date",
        label: "Berakhir",
        item: ({ end_date }) => <span className="text-sm">{formatDateID(end_date)}</span>,
      },
    ],
    [communities]
  );

  const validateFormData = useCallback((data, mode) => {
    const errors = [];
    if (!data.title?.trim()) errors.push("Judul promo wajib diisi");
    if (!data.description?.trim()) errors.push("Deskripsi wajib diisi");

    // WAJIB manager tenant dari dropdown
    if (!data.owner_user_id) errors.push("Manager tenant wajib dipilih");

    if (!data.promo_type) errors.push("Tipe promo wajib dipilih");
    if (!data.community_id && mode === "create") errors.push("Community wajib dipilih");

    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (endDate < startDate) errors.push("Tanggal berakhir harus setelah tanggal mulai");
    }
    return errors;
  }, []);

  const topBarActions =
    formError || managersError ? (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Error:</strong> {formError || managersError}
      </div>
    ) : null;

  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Promo"
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        searchable
        noControlBar={false}
        setToRefresh={refreshToggle}
        actionControl={{
          except: ["detail"],
          onAdd: () => {
            setSelectedPromo(null);
          },
          onEdit: (promo) => {
            setSelectedPromo(promo);
          },
          onDelete: (promo) => {
            setSelectedPromo(promo);
            setModalDelete(true);
          },
        }}
        fetchControl={{
          path: "admin/promos",
          includeHeaders: { ...authHeader() },
          onError: (error) => {
            console.error("API Error:", error);
            setFormError(error.message || "Terjadi kesalahan");
          },
        }}
        formControl={{
          contentType: "multipart/form-data",
          transformData: (data, mode, originalData) => {
            // Validasi awal (FE)
            const validationErrors = validateFormData(data, mode);
            if (validationErrors.length > 0) throw new Error(validationErrors.join(", "));

            const formData = new FormData();

            // ==== Manager Tenant → kirim owner_user_id (BE auto-merge owner_name & owner_contact) ====
            if (!data.owner_user_id) {
              throw new Error("Manager tenant wajib dipilih");
            }
            formData.append("owner_user_id", String(data.owner_user_id));

            // Required fields
            if (data.title?.trim()) formData.append("title", data.title.trim());
            if (data.description?.trim()) formData.append("description", data.description.trim());

            // Promo type
            if (data.promo_type) formData.append("promo_type", data.promo_type);

            // Community ID (create wajib)
            let communityId = data.community_id;
            if (mode === "edit" && !communityId && originalData) communityId = originalData.community_id;
            if (communityId) formData.append("community_id", String(communityId));
            else if (mode === "create") throw new Error("Community ID is required");

            // Optional text fields
            if (data.detail?.trim()) formData.append("detail", data.detail.trim());
            if (data.location?.trim()) formData.append("location", data.location.trim());
            if (data.start_date) formData.append("start_date", data.start_date);
            if (data.end_date) formData.append("end_date", data.end_date);

            // Validation type & code (default 'auto' jika kosong)
            const finalValidationType = data.validation_type ? String(data.validation_type) : "auto";
            formData.append("validation_type", finalValidationType);
            if (finalValidationType === "manual") {
              if (!data.code?.trim()) throw new Error("Kode wajib diisi saat tipe validasi Manual");
              formData.append("code", data.code.trim());
              formData.append("barcode", data.code.trim());
            }

            // Numeric + boolean
            formData.append("promo_distance", String(parseFloat(data.promo_distance) || 0));
            formData.append("stock", String(parseInt(data.stock) || 0));
            formData.append("always_available", data.always_available ? "1" : "0");

            // Image file (hanya kalau file baru)
            if (typeof File !== "undefined" && data.image instanceof File) {
              formData.append("image", data.image);
            }

            // Method override on edit
            if (mode === "edit") formData.append("_method", "PUT");

            return formData;
          },
          custom: [
            {
              type: "custom",
              custom: ({ formControl }) => (
                <InputComponent
                  name="title"
                  label="Judul Promo *"
                  placeholder="Contoh: Diskon 50% Semua Menu"
                  required
                  {...formControl("title")}
                />
              ),
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <TextareaComponent
                  name="description"
                  label="Deskripsi Singkat *"
                  placeholder="Tuliskan deskripsi singkat promo"
                  required
                  {...formControl("description")}
                  rows={2}
                />
              ),
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <TextareaComponent
                  name="detail"
                  label="Detail Promo"
                  placeholder="Tuliskan detail lengkap promo, syarat dan ketentuan"
                  {...formControl("detail")}
                  rows={3}
                />
              ),
            },
            {
              type: "custom",
              custom: ({ formControl }) => {
                const fc = formControl("image");
                const raw = fc.value;
                const preparedValue = raw instanceof File ? raw : raw ? buildImageUrl(String(raw)) : "";
                return (
                  <InputImageComponent name="image" label="Gambar Promo" aspect="16/9" {...fc} value={preparedValue} />
                );
              },
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <SelectComponent
                  name="promo_type"
                  label="Tipe Promo *"
                  required
                  {...formControl("promo_type")}
                  options={[
                    { label: "Offline", value: "offline" },
                    { label: "Online", value: "online" },
                  ]}
                />
              ),
            },

            /* ====== FIELD: Manager Tenant (Dropdown) ====== */
            {
              type: "custom",
              custom: ({ formControl }) => {
                const fc = formControl("owner_user_id");
                const options = merchantManagers.map((u) => ({
                  value: String(u.id),
                  label: `${getDisplayName(u)}${getPhone(u) ? " — " + getPhone(u) : ""}`,
                }));
                return (
                  <SelectComponent
                    name="owner_user_id"
                    label="Manager Tenant *"
                    placeholder={
                      managersLoading
                        ? "Loading manager tenant..."
                        : options.length === 0
                        ? "Tidak ada manager tenant"
                        : "Pilih manager tenant..."
                    }
                    required
                    {...fc}
                    options={options}
                    disabled={managersLoading || options.length === 0}
                  />
                );
              },
            },

            {
              type: "custom",
              custom: ({ formControl }) => (
                <SelectComponent
                  name="validation_type"
                  label="Tipe Validasi *"
                  required
                  {...formControl("validation_type")}
                  options={[
                    { label: "Generate Otomatis (QR Code)", value: "auto" },
                    { label: "Masukan Kode Unik", value: "manual" },
                  ]}
                />
              ),
            },
            {
              type: "custom",
              custom: ({ formControl, values }) => {
                const validationType = values.find((i) => i.name === "validation_type")?.value;
                if (validationType !== "manual") return null;
                return (
                  <InputComponent
                    name="code"
                    label="Kode Promo *"
                    placeholder="Contoh: PROMO50OFF"
                    required
                    {...formControl("code")}
                  />
                );
              },
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <InputComponent
                  type="number"
                  name="promo_distance"
                  label="Jarak Promo (KM)"
                  placeholder="Contoh: 5"
                  step="0.1"
                  min="0"
                  {...formControl("promo_distance")}
                />
              ),
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <InputComponent type="date" name="start_date" label="Tanggal Mulai" {...formControl("start_date")} />
              ),
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <InputComponent type="date" name="end_date" label="Tanggal Berakhir" {...formControl("end_date")} />
              ),
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <InputComponent
                  name="location"
                  label="Lokasi Promo"
                  placeholder="Contoh: Mall Central Park Lt. 2"
                  {...formControl("location")}
                />
              ),
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <InputComponent
                  type="number"
                  name="stock"
                  label="Stok Promo"
                  placeholder="Jumlah promo tersedia"
                  min="0"
                  {...formControl("stock")}
                />
              ),
            },

            // Community selector
            {
              type: "custom",
              custom: ({ formControl }) => {
                const communityOptions = communities.map((c) => ({
                  label: c.name || c.title || `Community ${c.id}`,
                  value: String(c.id),
                }));
                return (
                  <div className="form-control w-full">
                    <SelectComponent
                      name="community_id"
                      label="Community *"
                      placeholder={
                        communitiesLoading
                          ? "Loading communities..."
                          : communities.length === 0
                          ? "No communities available"
                          : "Pilih community..."
                      }
                      required
                      {...formControl("community_id")}
                      options={communityOptions}
                      disabled={communitiesLoading || communities.length === 0}
                    />
                    {communities.length === 0 && !communitiesLoading && (
                      <div className="label">
                        <span className="label-text-alt text-warning">
                          No communities found. Please create communities first.
                        </span>
                      </div>
                    )}
                    {formError && (
                      <div className="label">
                        <span className="label-text-alt text-error">{formError}</span>
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              type: "custom",
              custom: ({ formControl }) => (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox" {...formControl("always_available")} />
                    <span className="label-text">Selalu Tersedia (tidak terbatas waktu)</span>
                  </label>
                </div>
              ),
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            // Default manager berdasarkan nama/telepon; fallback ke owner_user_id jika tersedia
            let owner_user_id = "";
            if (merchantManagers?.length) {
              const match = merchantManagers.find((u) => {
                const nm = getDisplayName(u);
                const ph = getPhone(u);
                const sameName = data?.owner_name && nm?.toLowerCase?.() === String(data.owner_name).toLowerCase();
                const samePhone = data?.owner_contact && ph && String(ph) === String(data.owner_contact);
                return sameName || samePhone;
              });
              if (match) owner_user_id = String(match.id);
            }
            if (!owner_user_id && data?.owner_user_id) {
              owner_user_id = String(data.owner_user_id);
            }

            return {
              ...data,
              start_date: data.start_date ? new Date(data.start_date).toISOString().slice(0, 10) : "",
              end_date: data.end_date ? new Date(data.end_date).toISOString().slice(0, 10) : "",
              image: data?.image ? buildImageUrl(data.image) : "",
              validation_type: data.validation_type || (data.code ? "manual" : "auto"),
              owner_user_id, // nilai awal dropdown
            };
          },
        }}
      />

      <ModalConfirmComponent
        title="Hapus Promo"
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelectedPromo(null);
        }}
        onSubmit={handleDelete}
      >
        <p className="text-gray-600 mb-4">
          Apakah Anda yakin ingin menghapus promo &quot;{selectedPromo?.title}&quot;?
        </p>
        <p className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
      </ModalConfirmComponent>
    </>
  );
}

PromoDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default PromoDashboard;
