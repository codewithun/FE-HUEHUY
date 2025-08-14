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

export default function PromoDashboard() {
  const [promoList, setPromoList] = useState([]);
  const [modalForm, setModalForm] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [formData, setFormData] = useState({
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch promo list
  useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : "";
      try {
        const res = await fetch(`${apiUrl}/admin/promos`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        setPromoList(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setPromoList([]);
      }
    };
    fetchData();
  }, [apiUrl]);

  // Add or update promo
  const handleSubmit = async (e) => {
    e.preventDefault();
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    const method = selectedPromo ? "PUT" : "POST";
    const url = selectedPromo
      ? `${apiUrl}/admin/promos/${selectedPromo.id}`
      : `${apiUrl}/admin/promos`;
    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });
    setModalForm(false);
    setFormData({
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
    setSelectedPromo(null);
    // Refresh list
    const res = await fetch(`${apiUrl}/admin/promos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    setPromoList(Array.isArray(result.data) ? result.data : []);
  };

  // Delete promo
  const handleDelete = async () => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : "";
    await fetch(`${apiUrl}/admin/promos/${selectedPromo.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    setPromoList(promoList.filter((p) => p.id !== selectedPromo.id));
    setModalDelete(false);
    setSelectedPromo(null);
  };

  // Open form for edit
  const handleEdit = (promo) => {
    setSelectedPromo(promo);
    setFormData({
      title: promo.title || "",
      description: promo.description || "",
      detail: promo.detail || "",
      promo_distance: promo.promo_distance || 0,
      start_date: promo.start_date || "",
      end_date: promo.end_date || "",
      always_available: promo.always_available || false,
      stock: promo.stock || 0,
      promo_type: promo.promo_type || "offline",
      location: promo.location || "",
      owner_name: promo.owner_name || "",
      owner_contact: promo.owner_contact || "",
    });
    setModalForm(true);
  };

  const columns = [
    {
      selector: "title",
      label: "Judul Promo",
      sortable: true,
      item: ({ title }) => <span className="font-semibold">{title}</span>,
    },
    {
      selector: "description",
      label: "Deskripsi",
      item: ({ description }) => description || "-",
    },
    {
      selector: "promo_distance",
      label: "Jarak Promo (KM)",
      item: ({ promo_distance }) => promo_distance,
    },
    {
      selector: "start_date",
      label: "Mulai",
      item: ({ start_date }) => start_date,
    },
    {
      selector: "end_date",
      label: "Berakhir",
      item: ({ end_date }) => end_date,
    },
    {
      selector: "always_available",
      label: "Selalu Tersedia",
      item: ({ always_available }) => (always_available ? "Ya" : "Tidak"),
    },
    {
      selector: "stock",
      label: "Stock",
      item: ({ stock }) => stock,
    },
    {
      selector: "promo_type",
      label: "Tipe Promo",
      item: ({ promo_type }) =>
        promo_type === "online" ? "Online" : "Offline",
    },
    {
      selector: "location",
      label: "Lokasi Promo",
      item: ({ location }) => location,
    },
    {
      selector: "owner_name",
      label: "Pemilik Iklan",
      item: ({ owner_name }) => owner_name,
    },
    {
      selector: "owner_contact",
      label: "Kontak Pemilik",
      item: ({ owner_contact }) => owner_contact,
    },
    {
      selector: "aksi",
      label: "Aksi",
      width: "120px",
      item: (item) => (
        <div className="flex gap-2">
          <ButtonComponent
            icon={faEdit}
            label="Ubah"
            paint="warning"
            size="sm"
            onClick={() => handleEdit(item)}
          />
          <ButtonComponent
            icon={faTrash}
            label="Hapus"
            paint="danger"
            size="sm"
            onClick={() => {
              setSelectedPromo(item);
              setModalDelete(true);
            }}
          />
        </div>
      ),
    },
  ];

  const topBarActions = (
    <ButtonComponent
      label="Tambah Promo"
      icon={faPlus}
      paint="primary"
      onClick={() => {
        setSelectedPromo(null);
        setFormData({
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
        setModalForm(true);
      }}
    />
  );

  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Promo"
        data={promoList}
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        noControlBar={false}
        searchable={true}
        fetchControl={{
          path: "admin/promos",
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
          setSelectedPromo(null);
          setFormData({
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
        }}
        title={selectedPromo ? "Ubah Promo" : "Tambah Promo"}
        size="md"
        className="bg-background"
      >
        <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
          <div>
            <label className="font-semibold">Judul Promo</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="font-semibold">Deskripsi Singkat</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="font-semibold">Isi Deskripsi</label>
            <textarea
              className="textarea textarea-bordered w-full"
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            />
          </div>
          <div>
            <label className="font-semibold">Jarak Promo (KM)</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={formData.promo_distance}
              onChange={(e) =>
                setFormData({ ...formData, promo_distance: Number(e.target.value) })
              }
              required
            />
          </div>
          <div className="flex gap-2">
            <div>
              <label className="font-semibold">Tanggal Mulai</label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-semibold">Tanggal Berakhir</label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="font-semibold">Selalu Tersedia</label>
            <input
              type="checkbox"
              checked={formData.always_available}
              onChange={(e) => setFormData({ ...formData, always_available: e.target.checked })}
            />
          </div>
          <div>
            <label className="font-semibold">Stock Promo</label>
            <input
              type="number"
              className="input input-bordered w-full"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="font-semibold">Tipe Promo</label>
            <select
              className="select select-bordered w-full"
              value={formData.promo_type}
              onChange={(e) => setFormData({ ...formData, promo_type: e.target.value })}
            >
              <option value="offline">Offline</option>
              <option value="online">Online</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">Lokasi Promo</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="font-semibold">Nama Pemilik Iklan</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="font-semibold">Kontak Pemilik Iklan</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={formData.owner_contact}
              onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <ButtonComponent
              label="Batal"
              paint="secondary"
              variant="outline"
              onClick={() => {
                setModalForm(false);
                setSelectedPromo(null);
                setFormData({
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
              }}
            />
            <ButtonComponent
              label={selectedPromo ? "Perbarui" : "Simpan"}
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
          setSelectedPromo(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Promo"
        message={`Apakah Anda yakin ingin menghapus promo "${selectedPromo?.title}"?`}
      />
    </>
  );
}

PromoDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};