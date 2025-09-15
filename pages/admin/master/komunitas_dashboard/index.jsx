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

// ===== Helpers: BASES & URL JOINERS (AMAN) =====
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** origin untuk file (tanpa /api) → https://api-159-223-48-146.nip.io */
const FILE_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    // fallback kalau NEXT_PUBLIC_API_URL tidak lengkap (jarang terjadi)
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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
  });
  const [modalAdd, setModalAdd] = useState(false);
  const [selectedCommunityForAdd, setSelectedCommunityForAdd] = useState(null);
  const [addType, setAddType] = useState("voucher");
  const [existingVoucherList, setExistingVoucherList] = useState([]);
  const [existingPromoList, setExistingPromoList] = useState([]);
  const [selectedExistingId, setSelectedExistingId] = useState(null);
  const [selectedAttachCategoryId, setSelectedAttachCategoryId] = useState(null);
  const [modalCategory, setModalCategory] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    title: "",
    description: "",
  });
  const [activeCommunityId, setActiveCommunityId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [previewWidgets, setPreviewWidgets] = useState([]);

  // Fetch community list
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
  }, []);

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
    if (formData.logo && typeof formData.logo !== "string") {
      formPayload.append("logo", formData.logo);
    } else if (typeof formData.logo === "string" && formData.logo !== "") {
      formPayload.append("logo", formData.logo);
    }

    await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formPayload,
    });

    setModalForm(false);
    setFormData({ name: "", description: "", logo: "" });
    setSelectedCommunity(null);

    // trigger TableSupervisionComponent to refetch
    setRefreshToggle((s) => !s);
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

  // Fetch existing templates (voucher/promo) saat modal attach dibuka
  useEffect(() => {
    if (!modalAdd) return;
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    (async () => {
      try {
        const resV = await fetch(apiJoin("admin/vouchers"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const jsonV = await resV.json().catch(() => ({}));
        setExistingVoucherList(
          Array.isArray(jsonV.data) ? jsonV.data : Array.isArray(jsonV) ? jsonV : []
        );
      } catch {
        setExistingVoucherList([]);
      }
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

  // Open combined add modal (attach existing voucher/promo)
  const openAddModal = (community, defaultType = "voucher") => {
    setSelectedCommunityForAdd(community);
    setAddType(defaultType);
    setSelectedExistingId(null);
    setSelectedAttachCategoryId(null);
    if (community && community.id) {
      setActiveCommunityId(community.id);
      fetchCategories(community.id);
    }
    setModalAdd(true);
  };

  // Submit attach
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCommunityForAdd) return;
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";

    if (!selectedExistingId) {
      alert("Pilih item yang ingin ditambahkan");
      return;
    }
    if (!selectedAttachCategoryId) {
      alert("Pilih kategori komunitas untuk item ini");
      return;
    }

    try {
      const endpoint = apiJoin(
        `communities/${selectedCommunityForAdd.id}/categories/${selectedAttachCategoryId}/attach`
      );
      const payload = { type: addType, id: Number(selectedExistingId) };

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
        setSelectedExistingId(null);
      } else {
        alert(json.message || "Gagal menambahkan item ke komunitas");
      }
    } catch {
      alert("Terjadi kesalahan saat menambahkan item");
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
            // unoptimized
          />
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      selector: "aksi",
      label: "Kategori",
      width: "120px",
      item: (item) => (
        <div className="flex gap-2">
          <ButtonComponent
            label="Tambah Kategori"
            paint="info"
            size="sm"
            onClick={() => handleOpenCategory(item)}
          />
        </div>
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
        setFormData({
          name: "",
          description: "",
          logo: "",
        });
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
        // 🔴 Nonaktifkan modal detail default (klik row tidak ngapa2in)
        actionControl={{ except: ['detail'] }}
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
          // NOTE: TableSupervisionComponent kemungkinan akan gabungkan path ke base sendiri.
          // Jika perlu full URL, ubah komponennya agar pakai apiJoin(path).
          mapData: (result) => {
            if (Array.isArray(result.data)) {
              return {
                data: result.data,
                totalRow: result.total_row || result.data.length,
              };
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
          customDefaultValue: (data) => ({
            name: data.name || "",
            description: data.description || "",
          }),
        }}
      />

      {/* Modal Form */}
      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          setSelectedCommunity(null);
          setFormData({ name: "", description: "", logo: "" });
        }}
        title={selectedCommunity ? "Ubah Komunitas" : "Tambah Komunitas"}
        size="md"
        className="bg-gradient-to-br from-white to-gray-50"
      >
        <div className="px-8 py-6">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {selectedCommunity ? "Ubah Komunitas" : "Buat Komunitas Baru"}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedCommunity
                ? "Perbarui informasi komunitas yang sudah ada"
                : "Isi informasi untuk membuat komunitas baru"}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Komunitas<span className="text-danger ml-1">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 text-gray-800 bg-white border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary focus:ring-opacity-20 transition-all duration-200 placeholder-gray-400 shadow-sm hover:shadow-md"
                  placeholder="Masukkan nama komunitas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Nama komunitas akan ditampilkan kepada semua pengguna
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deskripsi
              </label>
              <div className="relative group">
                <div className="absolute top-4 left-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <textarea
                  className="w-full pl-12 pr-4 py-4 text-gray-800 bg-white border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all duration-200 placeholder-gray-400 shadow-sm hover:shadow-md resize-none"
                  placeholder="Masukkan deskripsi komunitas"
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Berikan deskripsi singkat tentang komunitas ini
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Logo (opsional)
              </label>
              <div className="relative">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary transition-all duration-200 group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-3 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 group-hover:text-primary transition-colors">
                        <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 2MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setFormData({ ...formData, logo: e.target.files[0] })
                      }
                    />
                  </label>
                </div>
                {formData.logo && (
                  <div className="mt-3 p-3 bg-light-success bg-opacity-20 rounded-lg border border-success border-opacity-30">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-success font-medium">
                        File berhasil dipilih: {formData.logo.name || "Logo baru"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedCommunity
                  ? "Kosongkan jika tidak ingin mengubah logo yang ada"
                  : "Upload logo untuk memberikan identitas visual pada komunitas"}
              </p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <ButtonComponent
                label="Batal"
                paint="secondary"
                variant="outline"
                size="md"
                className="flex-1 py-3 font-semibold hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setModalForm(false);
                  setSelectedCommunity(null);
                  setFormData({ name: "", description: "", logo: "" });
                }}
              />
              <ButtonComponent
                label={selectedCommunity ? "Perbarui Komunitas" : "Buat Komunitas"}
                paint="primary"
                type="submit"
                size="md"
                className="flex-1 py-3 font-semibold bg-green-800 hover:bg-green-900 transition-all duration-200 shadow-lg hover:shadow-xl"
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
        }}
        title="Kategori Komunitas"
        size="md"
      >
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
              label="Tambah Promo/Voucher ke Komunitas"
              paint="primary"
              onClick={() => {
                if (!activeCommunityId) {
                  alert("Pilih komunitas terlebih dahulu.");
                  return;
                }
                openAddModal({ id: activeCommunityId }, "voucher");
              }}
            />
          </div>
        </div>

        <form
          className="flex flex-col gap-4 mb-4"
          onSubmit={handleCategorySubmit}
          style={{
            display: showCategoryForm || selectedCategory !== null ? "flex" : "none",
          }}
        >
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Judul Kategori <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all duration-200 placeholder-gray-400"
                placeholder="Masukkan judul kategori"
                value={categoryForm.title}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, title: e.target.value })
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Judul kategori akan tampil di widget promo komunitas.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all duration-200 placeholder-gray-400 resize-none"
                placeholder="Deskripsi kategori (opsional)"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, description: e.target.value })
                }
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Deskripsi akan membantu membedakan kategori.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <ButtonComponent
                label="Batal"
                paint="secondary"
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryForm({ title: "", description: "" });
                  setShowCategoryForm(false);
                  fetchCategories(activeCommunityId);
                }}
              />
              <ButtonComponent
                label={selectedCategory ? "Perbarui" : "Simpan"}
                paint="primary"
                type="submit"
              />
            </div>
          </div>
        </form>

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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {previewWidgets.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Preview Widget Promo</h4>
            <div className="flex gap-4 overflow-x-auto">
              {previewWidgets.map((w) => (
                <div key={w.id} className="bg-primary rounded-xl p-4 text-white min-w-[220px] shadow-neuro">
                  <h5 className="font-bold">{w.title}</h5>
                  <p className="text-sm text-white text-opacity-90">{w.subtitle}</p>
                  <div className="mt-3 bg-white bg-opacity-10 rounded p-2 text-xs">
                    <p className="text-white text-opacity-80">No promos yet</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </FloatingPageComponent>

      {/* Combined Add Modal (Voucher / Promo) */}
      <FloatingPageComponent
        show={modalAdd}
        onClose={() => {
          setModalAdd(false);
          setSelectedCommunityForAdd(null);
        }}
        title={`Tambah ${addType === "voucher" ? "Voucher" : "Promo"} ke Komunitas`}
        size={addType === "voucher" ? "sm" : "md"}
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

          <div>
            <label className="font-semibold">Tipe</label>
            <select
              className="select select-bordered w-full"
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
            >
              <option value="voucher">Voucher</option>
              <option value="promo">Promo</option>
            </select>
          </div>

          <div>
            <label className="font-semibold">
              {addType === "voucher" ? "Pilih Voucher" : "Pilih Promo"}
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedExistingId || ""}
              onChange={(e) => setSelectedExistingId(e.target.value)}
            >
              <option value="">-- Pilih --</option>
              {addType === "voucher"
                ? existingVoucherList.map((voucher) => (
                    <option key={voucher.id} value={voucher.id}>
                      {voucher.code} - {voucher.amount} ({voucher.type})
                    </option>
                  ))
                : existingPromoList.map((promo) => (
                    <option key={promo.id} value={promo.id}>
                      {promo.title} - {promo.stock ?? "-"} stok
                    </option>
                  ))}
            </select>
            {(addType === "voucher"
              ? existingVoucherList.length === 0
              : existingPromoList.length === 0) && (
              <p className="text-sm text-gray-500 mt-2">
                Belum ada item tersedia. Buat voucher/promo terlebih dahulu di menu master.
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
            <ButtonComponent
              label={
                addType === "voucher" ? "Tambahkan Voucher" : "Tambahkan Promo"
              }
              paint="primary"
              type="submit"
            />
          </div>
        </form>
      </FloatingPageComponent>
    </>
  );
}

KomunitasDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
