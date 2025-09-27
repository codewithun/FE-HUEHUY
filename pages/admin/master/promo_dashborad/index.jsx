/* eslint-disable no-console */
import Cookies from "js-cookie";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  InputComponent,
  ModalConfirmComponent,
  SelectComponent,
  TableSupervisionComponent,
  TextareaComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import CropperDialog from "../../../../components/crop.components/CropperDialog";
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
  
  // Use NEXT_PUBLIC_API_URL or fallback to backend port
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const base = apiUrl.replace(/\/api\/?$/, ""); // Remove /api suffix to get base URL
  
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

  // Crop states
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentFormControl, setCurrentFormControl] = useState(null);
  const [previewOwnerKey, setPreviewOwnerKey] = useState("");
  const [currentImageFile, setCurrentImageFile] = useState(null);

  // Form session (untuk remount TERKONTROL)
  const [formSessionId, setFormSessionId] = useState(0);

  const apiBase = useMemo(() => getApiBase(), []);
  const MANAGERS_ENDPOINT = `${apiBase}/api/admin/users?roles[]=manager_tenant&roles[]=manager%20tenant&paginate=all`;
  /**
   * Normalisasi URL gambar agar:
   * - Gunakan absolute URL dari backend untuk akses gambar
   * - Fallback ke konstruksi manual jika diperlukan
   */
  const toStoragePath = (raw) => {
    if (!raw) return "";

    const s = String(raw).trim();

    // Jika sudah berupa URL absolut, gunakan langsung
    if (/^https?:\/\//i.test(s)) return s;

    // Jika berupa path absolut, konstruksi URL backend
    if (s.startsWith("/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const baseUrl = apiUrl.replace(/\/api\/?$/, "");
      return `${baseUrl}${s}`;
    }

    // Konstruksi URL untuk berbagai format path
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");

    // Kasus BE kirim "api/storage/xxx" → http://localhost:8000/storage/xxx
    if (/^api\/storage\//i.test(s)) {
      return `${baseUrl}/${s.replace(/^api\//i, "")}`;
    }

    // Kasus BE kirim "storage/xxx" → http://localhost:8000/storage/xxx
    if (/^storage\//i.test(s)) {
      return `${baseUrl}/${s}`;
    }

    // Kasus BE kirim hanya "promos/xxx" → http://localhost:8000/storage/promos/xxx
    return `${baseUrl}/storage/${s.replace(/^\/+/, "")}`;
  };

  /** Tambahkan query param versing k=... */
  const withVersion = (base, ver) =>
    !base ? "" : `${base}${base.includes("?") ? "&" : "?"}k=${encodeURIComponent(String(ver ?? Date.now()))}`;

  const authHeader = useCallback(() => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : "";
    return { Authorization: `Bearer ${token}` };
  }, []);

  // File input handlers (crop)
  const handleFileInput = (e, formControl, formKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file gambar (JPG/PNG)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 10MB");
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      setRawImageUrl(url);
      setCurrentFormControl(formControl);
      if (formKey) setPreviewOwnerKey(String(formKey));
      setCropOpen(true);
    } catch (err) {
      console.error("Error creating image URL:", err);
      alert("Gagal memproses gambar. Silakan coba lagi.");
    }
  };

  const handleCropSave = async (croppedFile) => {
    console.log("💾 Crop save:", { fileName: croppedFile?.name, size: croppedFile?.size });
    setCropOpen(false);

    // Cleanup blob URL lama
    if (previewUrl?.startsWith("blob:")) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }

    // Buat preview baru
    const newPreviewUrl = URL.createObjectURL(croppedFile);
    setPreviewUrl(newPreviewUrl);
    setCurrentImageFile(croppedFile); // persistent file

    // Set ke form control (immediate + delayed guard)
    if (currentFormControl) {
      console.log("📝 Setting file to form control:", croppedFile?.name);
      currentFormControl.onChange(croppedFile);
      setTimeout(() => {
        try {
          if (currentFormControl?.value !== croppedFile) {
            console.log("🔄 Re-setting file after delay");
            currentFormControl.onChange(croppedFile);
          }
        } catch {}
      }, 100);
    }
  };

  const handleRecrop = (formControl) => {
    const existingValue = formControl.value;
    let imageUrl = "";
    if (previewUrl) {
      imageUrl = previewUrl;
    } else if (existingValue && !(existingValue instanceof File)) {
      imageUrl = toStoragePath(String(existingValue));
    }
    if (imageUrl) {
      setRawImageUrl(imageUrl);
      setCurrentFormControl(formControl);
      setCropOpen(true);
    }
  };

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
      {/* Cropper Dialog */}
      <CropperDialog
        open={cropOpen}
        imageUrl={rawImageUrl}
        onClose={() => setCropOpen(false)}
        onSave={handleCropSave}
        aspect={16/9}
      />

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
            console.log("🆕 ADD clicked - AGGRESSIVE reset");
            
            // STEP 1: Force cleanup ALL blob URLs
            const blobUrls = [previewUrl, rawImageUrl].filter(url => 
              url && url.startsWith("blob:")
            );
            blobUrls.forEach(url => {
              try {
                URL.revokeObjectURL(url);
                console.log("✅ Revoked blob:", url.substring(0, 50));
              } catch (e) {
                console.warn("Failed to revoke:", e);
              }
            });
            
            // STEP 2: Reset ALL image states
            setPreviewUrl("");
            setPreviewOwnerKey("");
            setRawImageUrl("");
            setCurrentImageFile(null);
            setCurrentFormControl(null);
            setCropOpen(false);
            setSelectedPromo(null);
            
            // STEP 3: Force session bump
            setFormSessionId((n) => {
              console.log("🔄 Form session:", n, "->", n + 1);
              return n + 1;
            });
          },
          onEdit: (promo) => {
            console.log("✏️ EDIT clicked for promo:", promo.id);
            
            // STEP 1: Force cleanup ALL blob URLs
            const blobUrls = [previewUrl, rawImageUrl].filter(url => 
              url && url.startsWith("blob:")
            );
            blobUrls.forEach(url => {
              try {
                URL.revokeObjectURL(url);
                console.log("✅ Edit cleanup revoked:", url.substring(0, 50));
              } catch (e) {}
            });
            
            // STEP 2: Reset ALL image states FIRST
            setPreviewUrl("");
            setPreviewOwnerKey("");
            setRawImageUrl("");
            setCurrentImageFile(null);
            setCurrentFormControl(null);
            setCropOpen(false);
            
            // STEP 3: Set promo dan bump session
            setSelectedPromo(promo);
            setFormSessionId((n) => {
              console.log("✏️ Edit session:", n, "->", n + 1);
              return n + 1;
            });
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
        onStoreSuccess={() => {
          // Cleanup blob URLs
          [previewUrl, rawImageUrl].forEach((url) => {
            if (url?.startsWith("blob:")) {
              try { URL.revokeObjectURL(url); } catch {}
            }
          });

          // Reset states
          setPreviewUrl("");
          setPreviewOwnerKey("");
          setRawImageUrl("");
          setCurrentImageFile(null);
          setCurrentFormControl(null);
          setCropOpen(false);
          setSelectedPromo(null);

          // Aggressive refresh bertahap
          setTimeout(() => {
            setFormSessionId((n) => n + 1);
            setRefreshToggle((s) => !s);
          }, 100);
        }}
        onUpdateSuccess={() => {
          console.log("💾 Update success - aggressive refresh");

          // Cleanup blob URLs
          [previewUrl, rawImageUrl].forEach((url) => {
            if (url?.startsWith("blob:")) {
              try { URL.revokeObjectURL(url); } catch {}
            }
          });

          // Reset states
          setPreviewUrl("");
          setPreviewOwnerKey("");
          setRawImageUrl("");
          setCurrentImageFile(null);
          setCurrentFormControl(null);
          setCropOpen(false);
          setSelectedPromo(null);

          // Aggressive refresh bertahap
          setTimeout(() => {
            setFormSessionId((n) => n + 1);
            setRefreshToggle((s) => !s);
          }, 100);
        }}
        onSubmitSuccess={() => {
          if (previewUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(previewUrl); } catch {} }
          if (rawImageUrl?.startsWith("blob:")) { try { URL.revokeObjectURL(rawImageUrl); } catch {} }
          setPreviewUrl("");
          setPreviewOwnerKey("");
          setRawImageUrl("");
          setCurrentImageFile(null);
          setCurrentFormControl(null);
          setCropOpen(false);
          setSelectedPromo(null);
          setFormSessionId((n) => n + 1);
          setRefreshToggle((s) => !s);
        }}
        formDefaultValue={{
          title: "",
          description: "",
          detail: "",
          promo_distance: 0,
          start_date: "",
          end_date: "",
          always_available: false,
          stock: 0,
          promo_type: "offline",
          location: "",
          code: "",
          image: "",
          community_id: "",
          owner_user_id: "",
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

            // Required fields - ALWAYS send for both create and edit
            formData.append("title", (data.title || "").trim());
            formData.append("description", (data.description || "").trim());

            // Promo type - ALWAYS send
            formData.append("promo_type", data.promo_type || "offline");

            // Community ID - ALWAYS send for both create and edit
            let communityId = data.community_id;
            if (mode === "edit" && !communityId && originalData) communityId = originalData.community_id;
            formData.append("community_id", String(communityId || ""));
            if (mode === "create" && !communityId) throw new Error("Community ID is required for creating promo");

            // Owner fields - BE will extract from user if owner_user_id exists
            // But we still need to send them for validation
            if (data.owner_name?.trim()) formData.append("owner_name", data.owner_name.trim());
            if (data.owner_contact?.trim()) formData.append("owner_contact", data.owner_contact.trim());

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
            // ======== FIELD GAMBAR ========
            {
              type: "custom",
              custom: ({ formControl, values }) => {
                const fc = formControl("image");
                const formId = values?.find?.((v) => v.name === "id")?.value;
                const isEditMode = Boolean(formId && formId !== "new");
                const promoKey = `${formSessionId}-${formId || "new"}`;

                // Server image
                const valMap = (name) => values?.find?.((v) => v.name === name)?.value;
                const rawFromValues = valMap("image_url_versioned") || valMap("image_url") || "";
                const serverImageUrl = (() => {
                  if (!isEditMode || !rawFromValues || typeof rawFromValues !== "string") return "";
                  return toStoragePath(rawFromValues);
                })();

                const imageVersion =
                  valMap("image_updated_at") ||
                  valMap("updated_at") ||
                  formId ||
                  Date.now();

                const serverSrc = serverImageUrl ? withVersion(serverImageUrl, imageVersion) : "";

                // Prioritas File object dan blob preview
                const currentValue = fc.value;
                const hasFileObject = currentValue instanceof File;
                const canUseBlob = Boolean(previewUrl) && String(previewOwnerKey) === String(promoKey);

                let finalPreviewSrc = "";
                if (hasFileObject && canUseBlob) {
                  finalPreviewSrc = previewUrl;
                } else if (canUseBlob) {
                  finalPreviewSrc = previewUrl;
                } else {
                  finalPreviewSrc = serverSrc;
                }

                // File input handler (prevent override)
                const handleFileChange = (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  console.log("📁 File selected:", {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    promoKey,
                    currentFormValue: typeof fc.value,
                  });

                  // Set file segera lalu buka crop
                  fc.onChange(file);
                  setCurrentImageFile(file);
                  handleFileInput(e, fc, promoKey);
                };

                const fileInfo = hasFileObject ? `File: ${currentValue.name} (${(currentValue.size / 1024).toFixed(1)}KB)` : "";

                return (
                  <div className="form-control" key={`img-field-${promoKey}`}>
                    <label className="label">
                      <span className="label-text font-medium">Gambar Promo</span>
                      {hasFileObject && (
                        <span className="label-text-alt text-green-600 text-xs">📁 {fileInfo}</span>
                      )}
                    </label>

                    <div className="mb-4">
                      {finalPreviewSrc ? (
                        <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                          <Image
                            src={finalPreviewSrc}
                            alt="Preview"
                            width={384}
                            height={216}
                            className="max-w-full max-h-full object-contain"
                            unoptimized
                            onLoad={() => console.log("✅ Preview loaded:", finalPreviewSrc.substring(0, 80))}
                            onError={() => console.error("❌ Preview failed:", finalPreviewSrc.substring(0, 80))}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-500 text-sm">Belum ada gambar dipilih</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {process.env.NODE_ENV === "development" && (
                      <div className="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded border">
                        <div><strong>🔍 Debug Form State:</strong></div>
                        <div>Form Value Type: <span className="font-mono">{typeof currentValue}</span></div>
                        <div>Is File Object: <span className={hasFileObject ? "text-green-600" : "text-red-600"}>{hasFileObject ? "✅" : "❌"}</span></div>
                        <div>Has Preview Blob: <span className={canUseBlob ? "text-green-600" : "text-red-600"}>{canUseBlob ? "✅" : "❌"}</span></div>
                        <div>Preview Source: <span className="font-mono">{finalPreviewSrc ? "SHOWING" : "EMPTY"}</span></div>
                        <div>Owner Key: <span className="font-mono">{previewOwnerKey}</span></div>
                        <div>Current Key: <span className="font-mono">{promoKey}</span></div>
                        <div>File State: <span className="font-mono">{currentImageFile ? currentImageFile.name : "NULL"}</span></div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input file-input-bordered flex-1"
                        onChange={handleFileChange}
                        key={`file-input-${promoKey}-${imageVersion}`}
                      />
                      {finalPreviewSrc && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRecrop(fc)}
                            title="Crop ulang untuk menyesuaikan gambar"
                          >
                            Crop Ulang
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-error btn-sm"
                            onClick={() => {
                              console.log("🗑️ Clearing image preview and file");
                              if (previewUrl?.startsWith("blob:")) {
                                try { URL.revokeObjectURL(previewUrl); } catch {}
                              }
                              setPreviewUrl("");
                              setCurrentImageFile(null);
                              setPreviewOwnerKey("");
                              fc.onChange("");
                            }}
                            title="Hapus gambar"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG/JPG/WEBP, maksimal 10MB. Dialog crop akan terbuka otomatis setelah memilih file.
                    </span>
                  </div>
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
                    disabled={managersLoading}
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
            console.log("🔧 Setting form default values for edit:", {
              id: data?.id,
              title: data?.title,
              image: data?.image,
              owner_name: data?.owner_name,
              owner_contact: data?.owner_contact,
              community_id: data?.community_id,
              merchantManagersCount: merchantManagers.length,
            });

            // Resolve berdasarkan nama dan phone yang tersimpan
            let resolvedOwnerUserId = "";
            
            // Prioritize owner_user_id from data if available
            if (data?.owner_user_id) {
              resolvedOwnerUserId = String(data.owner_user_id);
            } else if (data?.owner_name || data?.owner_contact) {
              const matchedManager = merchantManagers.find(manager => {
                const managerName = getDisplayName(manager).toLowerCase();
                const managerPhone = getPhone(manager).replace(/[^\d+]/g, "");
                
                // Match berdasarkan nama
                const nameMatch = data.owner_name && 
                  managerName.includes(data.owner_name.toLowerCase());
                
                // Match berdasarkan phone (normalisasi dulu)
                const phoneMatch = data.owner_contact && managerPhone && 
                  managerPhone.includes(data.owner_contact.replace(/[^\d+]/g, ""));
                
                return nameMatch || phoneMatch;
              });
              
              if (matchedManager) {
                resolvedOwnerUserId = String(matchedManager.id);
                console.log("🔍 Resolved manager tenant:", {
                  stored_name: data.owner_name,
                  stored_contact: data.owner_contact,
                  resolved_id: resolvedOwnerUserId,
                  manager_name: getDisplayName(matchedManager),
                  manager_phone: getPhone(matchedManager)
                });
              } else {
                console.warn("⚠️ Could not resolve owner from stored name/contact:", {
                  stored_name: data.owner_name,
                  stored_contact: data.owner_contact,
                  available_managers: merchantManagers.length
                });
              }
            }

            const result = {
              id: data?.id || "",
              title: data?.title || "",
              description: data?.description || "",
              detail: data?.detail || "",
              code: data?.code || "",
              promo_type: data?.promo_type || "offline",
              promo_distance: data?.promo_distance || 0,
              location: data?.location || "",
              stock: data?.stock || 0,
              always_available: Boolean(data?.always_available),
              community_id: data?.community_id || "",
              start_date: data?.start_date ? new Date(data.start_date).toISOString().slice(0, 10) : "",
              end_date: data?.end_date ? new Date(data.end_date).toISOString().slice(0, 10) : "",
              validation_type: data?.validation_type || (data?.code ? "manual" : "auto"),

              // Image handling - use raw image path for form
              image: data?.image || "",

              // Image versioning fields for preview
              image_url_versioned: data?.image_url_versioned || null,
              image_url: data?.image_url || null,
              image_updated_at: data?.image_updated_at || null,
              updated_at: data?.updated_at || null,

              // Set owner_user_id yang sudah di-resolve
              owner_user_id: resolvedOwnerUserId || "",
            };

            console.log("📋 Final form default values:", {
              id: result.id,
              title: result.title,
              image: result.image,
              community_id: result.community_id,
              owner_user_id: result.owner_user_id,
              owner_name: data?.owner_name,
              owner_contact: data?.owner_contact,
            });

            return result;
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
