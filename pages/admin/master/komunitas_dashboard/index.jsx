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
  const [modalCategory, setModalCategory] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    title: "",
    description: "",
  });
  const [activeCommunityId, setActiveCommunityId] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch community list
  useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : "";
      try {
        const res = await fetch(`${apiUrl}/communities`, {
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
      ? `${apiUrl}/communities/${selectedCommunity.id}`
      : `${apiUrl}/communities`;

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
    const res = await fetch(`${apiUrl}/communities`, {
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
      `${apiUrl}/communities/${communityId}/categories`,
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
  };

  // Delete category
  const handleCategoryDelete = async (category) => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    await fetch(
      `${apiUrl}/communities/${activeCommunityId}/categories/${category.id}`,
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
        <ButtonComponent
          label="Tambah Kategori"
          paint="info"
          size="sm"
          onClick={() => handleOpenCategory(item)}
        />
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
        }}
        title="Kategori Komunitas"
        size="md"
      >
        <div className="mb-4">
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
      </FloatingPageComponent>
    </>
  );
}

KomunitasDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};