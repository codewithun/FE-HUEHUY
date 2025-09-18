/* eslint-disable no-console */
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  ButtonComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
  TableSupervisionComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import { token_cookie_name } from "../../../../helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";
import MultiSelectDropdown from "../../../../components/form/MultiSelectDropdown";

// ===== Helpers: BASES & URL JOINERS (AMAN) =====
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** origin untuk file (tanpa /api) → https://api-159-223-48-146.nip.io */
const FILE_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return API_BASE.replace(/\/+$/, "");
  }
})();

/** pastikan base API selalu mengandung /api tepat satu kali */
const apiJoin = (path = "") => {
  const base = API_BASE.replace(/\/+$/, "");
  const ensured = /\/api$/i.test(base) ? base : `${base}/api`;
  return `${ensured}/${String(path).replace(/^\/+/, "")}`;
};

/** normalisasi path ke /storage/... */
const toStoragePath = (p = "") =>
  `storage/${String(p).replace(/^\/+/, "").replace(/^storage\/+/, "")}`;

/** URL gambar/file publik */
const fileUrl = (relativePath = "") =>
  `${FILE_ORIGIN}/${toStoragePath(relativePath)}`;

// =================================================

export default function KomunitasDashboard() {
  const [communityList, setCommunityList] = useState([]);
  const [modalForm, setModalForm] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [adminContacts, setAdminContacts] = useState([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    admin_contact_ids: [],
  });

  // === Attach Promo Only ===
  const [modalAdd, setModalAdd] = useState(false);
  const [selectedCommunityForAdd, setSelectedCommunityForAdd] = useState(null);
  const [existingPromoList, setExistingPromoList] = useState([]);
  const [selectedPromoId, setSelectedPromoId] = useState(null);
  const [selectedAttachCategoryId, setSelectedAttachCategoryId] = useState(null);

  // === Kategori ===
  const [modalCategory, setModalCategory] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ title: "", description: "" });
  const [activeCommunityId, setActiveCommunityId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [previewWidgets, setPreviewWidgets] = useState([]);

  // =========================
  // Fetch community list (refetch on refreshToggle)
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : "";
      try {
        const res = await fetch(apiJoin("admin/communities"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        setCommunityList(Array.isArray(result.data) ? result.data : []);
      } catch {
        setCommunityList([]);
      }
    };
    fetchData();
  }, [refreshToggle]); // <-- UPDATED: depend on refreshToggle

  // =========================
  // Fetch admin contacts (pakai endpoint baru, tanpa filter di FE)
  // =========================
  useEffect(() => {
    const fetchAdminContacts = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : "";
      try {
        // ambil semua admin contacts: admin + manager tenant
        const url = apiJoin("admin/users?only_admin_contacts=true&paginate=all");
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();

        const users = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result)
          ? result
          : [];

        // langsung mapping ke opsi dropdown
        const formattedContacts = users.map((user) => ({
          value: user.id,
          label: `${user.name} - ${user.role?.name || "No Role"} (${user.phone || user.email || "No Contact"})`,
        }));

        setAdminContacts(formattedContacts);
      } catch (error) {
        console.error("Failed to fetch admin contacts:", error);
        setAdminContacts([]);
      }
    };
    fetchAdminContacts();
  }, []); // cukup sekali saat mount

  // Add or update community
  const handleSubmit = async (e) => {
    e.preventDefault();
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    const method = selectedCommunity ? "PUT" : "POST";
    const url = selectedCommunity
      ? apiJoin(`admin/communities/${selectedCommunity.id}`)
      : apiJoin("admin/communities");

    const formPayload = new FormData();
    formPayload.append("name", formData.name);
    formPayload.append("description", formData.description);

    // Tambahkan admin contact IDs (array)
    if (formData.admin_contact_ids && formData.admin_contact_ids.length > 0) {
      formData.admin_contact_ids.forEach((id, index) => {
        formPayload.append(`admin_contact_ids[${index}]`, id);
      });
    }

    if (formData.logo && typeof formData.logo !== "string") {
      formPayload.append("logo", formData.logo);
    } else if (typeof formData.logo === "string" && formData.logo !== "") {
      formPayload.append("logo", formData.logo);
    }

    try {
      await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formPayload,
      });

      setModalForm(false);
      setFormData({ name: "", description: "", logo: "", admin_contact_ids: [] });
      setSelectedCommunity(null);
      setSelectedAdminIds([]);
      setRefreshToggle((s) => !s);
    } catch (error) {
      console.error("Failed to submit form:", error);
      alert("Gagal menyimpan komunitas");
    }
  };

  // Delete community
  const handleDelete = async () => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    await fetch(apiJoin(`admin/communities/${selectedCommunity.id}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    setCommunityList((prev) => prev.filter((c) => c.id !== selectedCommunity.id));
    setRefreshToggle((s) => !s);
    setModalDelete(false);
    setSelectedCommunity(null);
  };

  // Fetch categories for a community
  const fetchCategories = async (communityId) => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    const res = await fetch(apiJoin(`communities/${communityId}/categories`), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    setCategoryList(Array.isArray(result) ? result : result.data || []);
  };

  // Open category modal
  const handleOpenCategory = (community) => {
    setActiveCommunityId(community.id);
    fetchCategories(community.id);
    setModalCategory(true);
  };

  // Add or update category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    const method = selectedCategory ? "PUT" : "POST";
    const url = selectedCategory
      ? apiJoin(`communities/${activeCommunityId}/categories/${selectedCategory.id}`)
      : apiJoin(`communities/${activeCommunityId}/categories`);

    try {
      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryForm),
      });
      setCategoryForm({ title: "", description: "" });
      setSelectedCategory(null);
      fetchCategories(activeCommunityId);

      // coba buat promo-widget terkait kategori (opsional)
      try {
        const widgetRes = await fetch(
          apiJoin(`communities/${activeCommunityId}/promo-categories`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: categoryForm.title,
              subtitle: categoryForm.description || "",
            }),
          }
        );
        const widgetJson = await widgetRes.json().catch(() => ({}));
        if (widgetRes.ok || (widgetJson && widgetJson.success)) {
          const created =
            widgetJson.data ||
            widgetJson || {
              id: widgetJson.id || Date.now(),
              title: categoryForm.title,
              subtitle: categoryForm.description || "",
              promos: [],
            };
          setPreviewWidgets((p) => [created, ...p]);
        } else {
          setPreviewWidgets((p) => [
            {
              id: `local-${Date.now()}`,
              title: categoryForm.title,
              subtitle: categoryForm.description || "",
              promos: [],
            },
            ...p,
          ]);
        }
      } catch {
        setPreviewWidgets((p) => [
          {
            id: `local-${Date.now()}`,
            title: categoryForm.title,
            subtitle: categoryForm.description || "",
            promos: [],
          },
          ...p,
        ]);
      }
    } catch {
      // noop
    }
  };

  // Delete category
  const handleCategoryDelete = async (category) => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    await fetch(apiJoin(`communities/${activeCommunityId}/categories/${category.id}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    fetchCategories(activeCommunityId);
  };

  // Fetch existing PROMOS saat modal attach dibuka (voucher dihapus)
  useEffect(() => {
    if (!modalAdd) return;
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    (async () => {
      try {
        const resP = await fetch(apiJoin("admin/promos"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const jsonP = await resP.json().catch(() => ({}));
        setExistingPromoList(
          Array.isArray(jsonP.data) ? jsonP.data : Array.isArray(jsonP) ? jsonP : []
        );
      } catch {
        setExistingPromoList([]);
      }
    })();
  }, [modalAdd]);

  // Open add modal (PROMO only)
  const openAddModal = (community) => {
    setSelectedCommunityForAdd(community);
    setSelectedPromoId(null);
    setSelectedAttachCategoryId(null);
    if (community && community.id) {
      setActiveCommunityId(community.id);
      fetchCategories(community.id);
    }
    setModalAdd(true);
  };

  // Submit attach PROMO
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCommunityForAdd) return;
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";

    if (!selectedPromoId) {
      alert("Pilih promo yang ingin ditambahkan");
      return;
    }
    if (!selectedAttachCategoryId) {
      alert("Pilih kategori komunitas untuk promo ini");
      return;
    }

    try {
      const endpoint = apiJoin(
        `communities/${selectedCommunityForAdd.id}/categories/${selectedAttachCategoryId}/attach`
      );
      const payload = { type: "promo", id: Number(selectedPromoId) };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok || (json && json.success)) {
        setModalAdd(false);
        setSelectedCommunityForAdd(null);
        setSelectedPromoId(null);
      } else {
        alert(json.message || "Gagal menambahkan promo ke komunitas");
      }
    } catch {
      alert("Terjadi kesalahan saat menambahkan promo");
    }
  };

  const columns = [
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
  ];

  const topBarActions = (
    <ButtonComponent
      label="Tambah Komunitas"
      icon={faPlus}
      paint="primary"
      onClick={() => {
        setSelectedCommunity(null);
        setFormData({ name: "", description: "", logo: "", admin_contact_ids: [] });
        setSelectedAdminIds([]);
        setModalForm(true);
      }}
    />
  );

  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Komunitas"
        data={communityList}
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        noControlBar={false}
        searchable={true}
        setToRefresh={refreshToggle}
        actionControl={{
          except: ["detail"],
          include: (row, actions, hasPermissions) => (
            <ButtonComponent
              label="Tambah Kategori"
              paint="primary"
              size="xs"
              variant="outline"
              rounded
              onClick={() => handleOpenCategory(row)}
            />
          ),
        }}
        fetchControl={{
          path: "admin/communities",
          method: "GET",
          headers: () => {
            const encryptedToken = Cookies.get(token_cookie_name);
            const token = encryptedToken ? Decrypt(encryptedToken) : "";
            return {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            };
          },
          mapData: (result) => {
            if (Array.isArray(result.data)) {
              return { data: result.data, totalRow: result.total_row || result.data.length };
            }
            return { data: [], totalRow: 0 };
          },
        }}
        formControl={{
          contentType: "multipart/form-data",
          custom: [
            {
              construction: {
                name: "name",
                label: "Name",
                placeholder: "Masukkan nama komunitas...",
                validations: { required: true },
              },
            },
            {
              type: "textarea",
              construction: {
                name: "description",
                label: "Description",
                placeholder: "Masukkan deskripsi...",
                rows: 4,
                validations: { required: true },
              },
            },
            {
              type: "file",
              construction: {
                name: "logo",
                label: "Logo (opsional)",
                accept: "image/*",
              },
            },
          ],
        }}
        formUpdateControl={{
          // kalau kamu pakai built-in form TableSupervision,
          // pastikan payload BE sudah mengembalikan admin_contact_ids
          customDefaultValue: (data) => ({
            name: data.name || "",
            description: data.description || "",
            admin_contact_ids: data.admin_contact_ids || [],
          }),
        }}
      />

      {/* Modal Form (custom) */}
      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          setSelectedCommunity(null);
          setFormData({ name: "", description: "", logo: "", admin_contact_ids: [] });
          setSelectedAdminIds([]);
        }}
        title={selectedCommunity ? "Ubah Komunitas" : "Tambah Komunitas"}
        size="md"
        className="bg-gradient-to-br from-white to-gray-50"
      >
        <div className="px-8 py-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Nama */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Komunitas<span className="text-danger ml-1">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20"
                placeholder="Masukkan nama komunitas"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Masukkan deskripsi komunitas"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Kontak Admin */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kontak Admin<span className="text-danger ml-1">*</span>
              </label>
              <MultiSelectDropdown
                options={adminContacts}
                value={formData.admin_contact_ids}
                onChange={(selectedIds) => {
                  setFormData({ ...formData, admin_contact_ids: selectedIds });
                  setSelectedAdminIds(selectedIds);
                }}
                placeholder="Pilih pengguna admin/manager tenant untuk komunitas ini..."
                maxHeight={200}
              />
              {adminContacts.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Belum ada pengguna dengan role Admin atau Manager Tenant tersedia.
                </p>
              )}
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Logo (opsional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(e) => setFormData({ ...formData, logo: e.target.files[0] })}
              />
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <ButtonComponent
                label="Batal"
                paint="secondary"
                variant="outline"
                onClick={() => {
                  setModalForm(false);
                  setSelectedCommunity(null);
                  setFormData({ name: "", description: "", logo: "", admin_contact_ids: [] });
                  setSelectedAdminIds([]);
                }}
              />
              <ButtonComponent
                label={selectedCommunity ? "Perbarui Komunitas" : "Buat Komunitas"}
                paint="primary"
                type="submit"
              />
            </div>
          </form>
        </div>
      </FloatingPageComponent>

      {/* Modal Delete Confirmation */}
      <ModalConfirmComponent
        open={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelectedCommunity(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Komunitas"
        message={`Apakah Anda yakin ingin menghapus komunitas "${selectedCommunity?.name}"?`}
      />

      {/* Modal Kategori Komunitas */}
      <FloatingPageComponent
        show={modalCategory}
        onClose={() => {
          setModalCategory(false);
          setCategoryList([]);
          setActiveCommunityId(null);
          setSelectedCategory(null);
          setCategoryForm({ title: "", description: "" });
          setPreviewWidgets([]);
          setShowCategoryForm(false); // Reset form visibility
        }}
        title="Kategori Komunitas"
        size="md"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <ButtonComponent
                label="Tambah Kategori"
                paint="primary"
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryForm({ title: "", description: "" });
                  setShowCategoryForm(true);
                }}
              />
            </div>

            <div>
              <ButtonComponent
                label="Tambah Promo ke Komunitas"
                paint="primary"
                onClick={() => {
                  if (!activeCommunityId) {
                    alert("Pilih komunitas terlebih dahulu.");
                    return;
                  }
                  openAddModal({ id: activeCommunityId });
                }}
              />
            </div>
          </div>

          {/* Form Kategori */}
          {showCategoryForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-4">
                {selectedCategory ? "Edit Kategori" : "Tambah Kategori"}
              </h4>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Kategori<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Masukkan judul kategori"
                    value={categoryForm.title}
                    onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Masukkan deskripsi kategori"
                      rows={3}
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    />
                </div>

                <div className="flex gap-2">
                  <ButtonComponent
                    label="Batal"
                    paint="secondary"
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setSelectedCategory(null);
                      setCategoryForm({ title: "", description: "" });
                    }}
                  />
                  <ButtonComponent
                    label={selectedCategory ? "Update Kategori" : "Simpan Kategori"}
                    paint="primary"
                    type="submit"
                  />
                </div>
              </form>
            </div>
          )}

          {/* Daftar Kategori */}
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categoryList.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.title}</td>
                    <td>{cat.description || "-"}</td>
                    <td>
                      <div className="flex gap-2">
                        <ButtonComponent
                          label="Edit"
                          size="sm"
                          paint="warning"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setCategoryForm({
                              title: cat.title,
                              description: cat.description || "",
                            });
                            setShowCategoryForm(true);
                          }}
                        />
                        <ButtonComponent
                          label="Hapus"
                          size="sm"
                          paint="danger"
                          onClick={() => handleCategoryDelete(cat)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Preview Widget */}
          {previewWidgets.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Preview Widget Promo</h4>
              <div className="flex gap-4 overflow-x-auto">
                {previewWidgets.map((w) => (
                  <div key={w.id} className="bg-primary rounded-xl p-4 text-white min-w-[220px]">
                    <h5 className="font-bold">{w.title}</h5>
                    <p className="text-sm text-white/90">{w.subtitle}</p>
                    <div className="mt-3 bg-white/10 rounded p-2 text-xs">
                      <p className="text-white/80">No promos yet</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </FloatingPageComponent>

      {/* Modal Tambah PROMO (voucher dihapus) */}
      <FloatingPageComponent
        show={modalAdd}
        onClose={() => {
          setModalAdd(false);
          setSelectedCommunityForAdd(null);
        }}
        title="Tambah Promo ke Komunitas"
        size="md"
        className="bg-background"
      >
        <form className="flex flex-col gap-4 p-6" onSubmit={handleAddSubmit}>
          <div>
            <label className="font-semibold">Kategori Komunitas</label>
            <select
              className="select select-bordered w-full"
              value={selectedAttachCategoryId || ""}
              onChange={(e) => setSelectedAttachCategoryId(e.target.value)}
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categoryList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Hanya PROMO */}
          <div>
            <label className="font-semibold">Pilih Promo</label>
            <select
              className="select select-bordered w-full"
              value={selectedPromoId || ""}
              onChange={(e) => setSelectedPromoId(e.target.value)}
              required
            >
              <option value="">-- Pilih Promo --</option>
              {existingPromoList.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {promo.title} - {promo.stock ?? "-"} stok
                </option>
              ))}
            </select>
            {existingPromoList.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Belum ada promo tersedia. Buat promo terlebih dahulu di menu master.
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <ButtonComponent
              label="Batal"
              paint="secondary"
              variant="outline"
              onClick={() => {
                setModalAdd(false);
                setSelectedCommunityForAdd(null);
              }}
            />
            <ButtonComponent label="Tambahkan Promo" paint="primary" type="submit" />
          </div>
        </form>
      </FloatingPageComponent>
    </>
  );
}

KomunitasDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
