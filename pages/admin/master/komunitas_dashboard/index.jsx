import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { token_cookie_name } from "../../../../helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";
import { faPlus, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  ButtonComponent,
  TableSupervisionComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";

export default function KomunitasDashboard() {
  const [communityList, setCommunityList] = useState([]);
  const [modalForm, setModalForm] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
  });
  // combined add modal state (voucher or promo)
  const [modalAdd, setModalAdd] = useState(false);
  const [selectedCommunityForAdd, setSelectedCommunityForAdd] = useState(null);
  const [addType, setAddType] = useState("voucher"); // 'voucher' or 'promo'
  const [voucherForm, setVoucherForm] = useState({
    code: "",
    type: "percentage", // 'percentage' or 'fixed'
    amount: 0,
    expiry_date: "",
    stock: 0,
  });
  const [promoForm, setPromoForm] = useState({
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
    owner_name: "",
    owner_contact: "",
  });
  const [promoImage, setPromoImage] = useState(null);
  // NEW: reuse existing template states
  const [useExisting, setUseExisting] = useState(false);
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
  // preview widgets created for the active community (local preview until refreshed)
  const [previewWidgets, setPreviewWidgets] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch community list
  useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : "";
      try {
        const res = await fetch(`${apiUrl}/communities`, { // changed: add /api
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        setCommunityList(Array.isArray(result) ? result : result.data || []);
      } catch (err) {
        setCommunityList([]);
      }
    };
    fetchData();
  }, [apiUrl]);

  // Add or update community
  const handleSubmit = async (e) => {
    e.preventDefault();
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    const method = selectedCommunity ? "PUT" : "POST";
    const url = selectedCommunity
      ? `${apiUrl}/communities/${selectedCommunity.id}` // changed: add /api
      : `${apiUrl}/communities`; // changed: add /api

    // Handle file upload or string
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formPayload,
    });

    setModalForm(false);
    setFormData({
      name: "",
      description: "",
      logo: "",
    });
    setSelectedCommunity(null);

    // Refresh list
    const res = await fetch(`${apiUrl}/communities`, { // changed: add /api
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    setCommunityList(Array.isArray(result) ? result : result.data || []);
  };

  // Delete community
  const handleDelete = async () => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    await fetch(`${apiUrl}/communities/${selectedCommunity.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    setCommunityList(communityList.filter((c) => c.id !== selectedCommunity.id));
    setModalDelete(false);
    setSelectedCommunity(null);
  };

  // Open form for edit
  const handleEdit = (community) => {
    setSelectedCommunity(community);
    setFormData({
      name: community.name || "",
      description: community.description || "",
      logo: "",
    });
    setModalForm(true);
  };

  // Fetch categories for a community
  const fetchCategories = async (communityId) => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    const res = await fetch(
      `${apiUrl}/communities/${communityId}/categories`, // changed: add /api
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
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
      ? `${apiUrl}/communities/${activeCommunityId}/categories/${selectedCategory.id}`
      : `${apiUrl}/communities/${activeCommunityId}/categories`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryForm),
      });
      const json = await res.json().catch(() => ({}));
      // refresh categories list
      setCategoryForm({ title: "", description: "" });
      setSelectedCategory(null);
      fetchCategories(activeCommunityId);

      // Try to create a promo-widget that corresponds to this category (backend may ignore)
      // endpoint: POST /admin/communities/:id/promo-categories  { title, subtitle }
      try {
        const widgetRes = await fetch(`${apiUrl}/communities/${activeCommunityId}/promo-categories`, { // changed: add /api and remove /admin
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: categoryForm.title,
            subtitle: categoryForm.description || ""
          }),
        });
        const widgetJson = await widgetRes.json().catch(() => ({}));
        if (widgetRes.ok || widgetJson && widgetJson.success) {
          // if backend returns created widget data push to previewWidgets; otherwise create lightweight preview
          const created = widgetJson.data || widgetJson || {
            id: widgetJson.id || Date.now(),
            title: categoryForm.title,
            subtitle: categoryForm.description || "",
            promos: []
          };
          setPreviewWidgets((p) => [created, ...p]);
        } else {
          // still add local preview so admin sees the widget
          setPreviewWidgets((p) => [{ id: `local-${Date.now()}`, title: categoryForm.title, subtitle: categoryForm.description || "", promos: [] }, ...p]);
        }
      } catch (err) {
        setPreviewWidgets((p) => [{ id: `local-${Date.now()}`, title: categoryForm.title, subtitle: categoryForm.description || "", promos: [] }, ...p]);
      }

    } catch (err) {
      // keep existing error behavior
    }
  };

  // Delete category
  const handleCategoryDelete = async (category) => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    await fetch(
      `${apiUrl}/communities/${activeCommunityId}/categories/${category.id}`, // changed: add /api
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    fetchCategories(activeCommunityId);
  };

  // Fetch existing templates when modal opens or type changes
  useEffect(() => {
    if (!modalAdd) return;
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    // fetch vouchers
    (async () => {
      try {
        const resV = await fetch(`${apiUrl}/admin/vouchers`, { // changed: add /api/admin
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const jsonV = await resV.json().catch(() => ({}));
        setExistingVoucherList(
          Array.isArray(jsonV.data) ? jsonV.data : Array.isArray(jsonV) ? jsonV : []
        );
      } catch (e) {
        setExistingVoucherList([]);
      }
      // fetch promos
      try {
        const resP = await fetch(`${apiUrl}/admin/promos`, { // changed: add /api/admin
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const jsonP = await resP.json().catch(() => ({}));
        setExistingPromoList(
          Array.isArray(jsonP.data) ? jsonP.data : Array.isArray(jsonP) ? jsonP : []
        );
      } catch (e) {
        setExistingPromoList([]);
      }
    })();
  }, [modalAdd, apiUrl]);

  // Open combined add modal for a community
  const openAddModal = (community, defaultType = "voucher", forceUseExisting = true) => {
    // modal now only for attaching existing voucher/promo
    setSelectedCommunityForAdd(community);
    setAddType(defaultType);
    setSelectedExistingId(null);
    setSelectedAttachCategoryId(null);
    // ensure activeCommunityId is set and categories are loaded for the community
    if (community && community.id) {
      setActiveCommunityId(community.id);
      fetchCategories(community.id);
    }
    setUseExisting(forceUseExisting); // keep true so only attach-existing flow shown
    setModalAdd(true);
  };

  // Submit add (voucher or promo) - simplified: only attach existing items
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
      // Controller expects: POST /communities/{communityId}/categories/{categoryId}/attach
      // body: { type: 'promo'|'voucher', id: int }
      const endpoint = `${apiUrl}/communities/${selectedCommunityForAdd.id}/categories/${selectedAttachCategoryId}/attach`;
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
    } catch (err) {
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
          <img
            src={
              logo.startsWith("http")
                ? logo
                : `${apiUrl}/storage/${logo}`
            }
            alt="Logo Komunitas"
            width={48}
            height={48}
            className="rounded"
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
        fetchControl={{
          path: "communities",
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
            if (Array.isArray(result)) {
              return {
                data: result,
                totalRow: result.length,
              };
            }
            if (Array.isArray(result.data)) {
              return {
                data: result.data,
                totalRow: result.total_row || result.data.length,
              };
            }
            return { data: [], totalRow: 0 };
          },
        }}
      />

      {/* Modal Form */}
      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          setSelectedCommunity(null);
          setFormData({
            name: "",
            description: "",
            logo: "",
          });
        }}
        title={selectedCommunity ? "Ubah Komunitas" : "Tambah Komunitas"}
        size="md"
        className="bg-background"
      >
        <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
          <div>
            <label className="font-semibold">Nama Komunitas</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan nama komunitas"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="font-semibold">Deskripsi</label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Masukkan deskripsi"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="font-semibold">Logo (opsional)</label>
            <input
              type="file"
              accept="image/*"
              className="file-input file-input-bordered w-full"
              onChange={(e) =>
                setFormData({ ...formData, logo: e.target.files[0] })
              }
            />
            <span className="text-xs text-gray-500">
              Kosongkan jika tidak ingin mengubah logo.
            </span>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <ButtonComponent
              label="Batal"
              paint="secondary"
              variant="outline"
              onClick={() => {
                setModalForm(false);
                setSelectedCommunity(null);
                setFormData({
                  name: "",
                  description: "",
                  logo: "",
                });
              }}
            />
            <ButtonComponent
              label={selectedCommunity ? "Perbarui" : "Simpan"}
              paint="primary"
              type="submit"
            />
          </div>
        </form>
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
          setPreviewWidgets([]); // clear previews when closing
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
                setShowCategoryForm(true); // Tampilkan form
              }}
            />
          </div>

         {/* New: tombol untuk menambahkan promo/voucher (attach existing) */}
        <div>
          <ButtonComponent
            label="Tambah Promo/Voucher ke Komunitas"
            paint="primary"
            onClick={() => {
              // open add modal in attach-existing mode; activeCommunityId tersedia
              if (!activeCommunityId) {
                alert("Pilih komunitas terlebih dahulu.");
                return;
              }
              openAddModal({ id: activeCommunityId }, "voucher", true);
            }}
          />
        </div>
        </div>
        <form
          className="flex flex-col gap-2 mb-4"
          onSubmit={handleCategorySubmit}
          style={{
            display: showCategoryForm || selectedCategory !== null ? "flex" : "none",
          }}
        >
          <input
            type="text"
            className="input input-bordered"
            placeholder="Judul Kategori"
            value={categoryForm.title}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, title: e.target.value })
            }
            required
          />
          <textarea
            className="textarea textarea-bordered"
            placeholder="Deskripsi"
            value={categoryForm.description}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, description: e.target.value })
            }
          />
          <div className="flex gap-2 justify-end">
            <ButtonComponent
              label="Batal"
              paint="secondary"
              variant="outline"
              onClick={() => {
                setSelectedCategory(null);
                setCategoryForm({ title: "", description: "" });
                setShowCategoryForm(false); // Sembunyikan form
                fetchCategories(activeCommunityId);
              }}
            />
            <ButtonComponent
              label={selectedCategory ? "Perbarui" : "Simpan"}
              paint="primary"
              type="submit"
            />
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

        {/* Widget Preview: shows newly created promo widgets immediately */}
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
          setPromoImage(null);
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

          {/* Only attach-existing allowed: show list of existing items to choose */}
          <div>
            <label className="font-semibold">{addType === "voucher" ? "Pilih Voucher" : "Pilih Promo"}</label>
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
            {(addType === "voucher" ? existingVoucherList.length === 0 : existingPromoList.length === 0) && (
              <p className="text-sm text-gray-500 mt-2">Belum ada item tersedia. Buat voucher/promo terlebih dahulu di menu master.</p>
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
            <ButtonComponent label={addType === "voucher" ? "Tambahkan Voucher" : "Tambahkan Promo"} paint="primary" type="submit" />
          </div>
        </form>
      </FloatingPageComponent>
    </>
  );
}

KomunitasDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};