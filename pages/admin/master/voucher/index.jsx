import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  ButtonComponent,
  TableSupervisionComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';

export default function VoucherCrud() {
  const [voucherList, setVoucherList] = useState([]);
  const [modalForm, setModalForm] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    type: '',
    valid_until: '',
    tenant_location: '',
    stock: 0,
    delivery: 'manual',
    code: '',
    community_id: '', // tambahkan community_id
  });
  const [imageFile, setImageFile] = useState(null);
  const [communities, setCommunities] = useState([]); // state untuk daftar community

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch voucher list
  useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      try {
        const res = await fetch(`${apiUrl}/admin/vouchers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await res.json();
        setVoucherList(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setVoucherList([]);
      }
    };
    fetchData();
  }, [apiUrl]);

  // Fetch community list
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const encryptedToken = Cookies.get(token_cookie_name);
        const token = encryptedToken ? Decrypt(encryptedToken) : '';
        const res = await fetch(`${apiUrl}/admin/communities`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await res.json();
        setCommunities(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setCommunities([]);
      }
    };
    fetchCommunities();
  }, [apiUrl]);

  // Handler untuk upload gambar
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      // Kosongkan input image di formData agar tidak terkirim sebagai string
      setFormData({ ...formData, image: '' });
    }
  };

  // Add or update voucher
  const handleSubmit = async (e) => {
    e.preventDefault();
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : '';
    const method = selectedVoucher ? 'PUT' : 'POST';
    const url = selectedVoucher
      ? `${apiUrl}/admin/vouchers/${selectedVoucher.id}`
      : `${apiUrl}/admin/vouchers`;

    let body;
    let headers = {
      'Authorization': `Bearer ${token}`,
    };

    if (imageFile) {
      // Jika ada file gambar, gunakan FormData
      body = new FormData();
      body.append('name', formData.name);
      body.append('description', formData.description);
      body.append('type', formData.type);
      body.append('valid_until', formData.valid_until);
      body.append('tenant_location', formData.tenant_location);
      body.append('stock', formData.stock);
      body.append('delivery', formData.delivery);
      body.append('image', imageFile);
      // Jika edit, tambahkan code & community_id jika perlu
      if (formData.code) body.append('code', formData.code);
      if (formData.community_id) body.append('community_id', formData.community_id);
      // Jangan set Content-Type, browser akan otomatis
    } else {
      // Jika tidak ada file, fallback ke JSON
      body = JSON.stringify(formData);
      headers['Content-Type'] = 'application/json';
    }

    await fetch(url, {
      method,
      headers,
      body,
    });

    setModalForm(false);
    setFormData({
      name: '',
      description: '',
      image: '',
      type: '',
      valid_until: '',
      tenant_location: '',
      stock: 0,
      delivery: 'manual',
      code: '',
      community_id: '', // reset community_id
    });
    setImageFile(null);
    setSelectedVoucher(null);

    // Refresh list
    const res = await fetch(`${apiUrl}/admin/vouchers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const result = await res.json();
    setVoucherList(Array.isArray(result.data) ? result.data : []);
  };

  // Delete voucher
  const handleDelete = async () => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : '';
    await fetch(`${apiUrl}/admin/vouchers/${selectedVoucher.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    setVoucherList(voucherList.filter(v => v.id !== selectedVoucher.id));
    setModalDelete(false);
    setSelectedVoucher(null);
  };

  // Open form for edit
  const handleEdit = (voucher) => {
    setSelectedVoucher(voucher);
    setFormData({
      name: voucher.name || '',
      description: voucher.description || '',
      image: voucher.image || '',
      type: voucher.type || '',
      valid_until: voucher.valid_until || '',
      tenant_location: voucher.tenant_location || '',
      stock: voucher.stock || 0,
      delivery: voucher.delivery || 'manual',
      code: voucher.code || '',
      community_id: voucher.community_id || '', // isi community_id
    });
    setImageFile(null);
    setModalForm(true);
  };

  const columns = [
    {
      selector: 'name',
      label: 'Nama Voucher',
      sortable: true,
      item: ({ name }) => <span className="font-semibold">{name}</span>,
    },
    {
      selector: 'description',
      label: 'Deskripsi',
      item: ({ description }) => description || '-',
    },
    {
      selector: 'image',
      label: 'Gambar',
      width: '100px',
      item: ({ image }) =>
        image ? (
          image.startsWith('http') ? (
            <img src={image} alt="Voucher" width={48} height={48} />
          ) : (
            <img src={`http://localhost:8000/storage/${image}`} alt="Voucher" width={48} height={48} />
          )
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      selector: 'stock',
      label: 'Stock',
      sortable: true,
      item: ({ stock }) => stock,
    },
    {
      selector: 'delivery',
      label: 'Pengiriman',
      item: ({ delivery }) => delivery === 'auto' ? 'Otomatis' : 'Manual',
    },
    {
      selector: 'valid_until',
      label: 'Berlaku Sampai',
      item: ({ valid_until }) => valid_until || '-',
    },
  ];

  const topBarActions = (
    <ButtonComponent
      label="Tambah Baru"
      icon={faPlus}
      paint="primary"
      onClick={() => {
        setSelectedVoucher(null);
        setFormData({
          name: '',
          description: '',
          image: '',
          type: '',
          valid_until: '',
          tenant_location: '',
          stock: 0,
          delivery: 'manual',
          code: '',
          community_id: '', // reset community_id
        });
        setModalForm(true);
      }}
    />
  );

  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Voucher"
        data={voucherList}
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        noControlBar={false}
        searchable={true}
        fetchControl={{
          path: 'admin/vouchers',
          method: 'GET',
          headers: () => {
            const encryptedToken = Cookies.get(token_cookie_name);
            const token = encryptedToken ? Decrypt(encryptedToken) : '';
            return {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            };
          },
          mapData: (result) => {
            if (Array.isArray(result.data)) {
              return { data: result.data, totalRow: result.total_row || result.data.length };
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
          setSelectedVoucher(null);
          setFormData({
            name: '',
            description: '',
            image: '',
            type: '',
            valid_until: '',
            tenant_location: '',
            stock: 0,
            delivery: 'manual',
            code: '',
            community_id: '', // reset community_id
          });
          setImageFile(null);
        }}
        title={selectedVoucher ? 'Ubah Voucher' : 'Tambah Voucher'}
        size="md"
        className="bg-background"
      >
        <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
          <div>
            <label className="font-semibold">Nama Voucher</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan nama voucher"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="font-semibold">Deskripsi</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan deskripsi"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          {/* Tambahkan input kode unik voucher */}
          <div>
            <label className="font-semibold">Kode Unik</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan kode unik voucher"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <span className="text-xs text-gray-500">Kode unik voucher, wajib diisi dan tidak boleh sama.</span>
          </div>
          <div>
            <label className="font-semibold">Tipe Voucher</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan tipe voucher"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            />
          </div>
          <div>
            <label className="font-semibold">Berlaku Sampai</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={formData.valid_until}
              onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
            />
          </div>
          <div>
            <label className="font-semibold">Lokasi Tenant</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Masukkan lokasi tenant"
              value={formData.tenant_location}
              onChange={e => setFormData({ ...formData, tenant_location: e.target.value })}
            />
          </div>
          <div>
            <label className="font-semibold">Stock</label>
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="Masukkan stock"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="font-semibold">Pengiriman</label>
            <select
              className="select select-bordered w-full"
              value={formData.delivery}
              onChange={e => setFormData({ ...formData, delivery: e.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="auto">Otomatis</option>
            </select>
          </div>
          {/* Tambahkan select untuk memilih community */}
          <div>
            <label className="font-semibold">Community</label>
            <select
              className="select select-bordered w-full"
              value={formData.community_id}
              onChange={e => setFormData({ ...formData, community_id: e.target.value })}
            >
              <option value="">Pilih Community</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">Pilih community untuk voucher ini (opsional).</span>
          </div>
          <div>
            <label className="font-semibold">Upload Gambar</label>
            <input
              type="file"
              accept="image/*"
              className="input input-bordered w-full"
              onChange={handleImageChange}
            />
            {formData.image && !imageFile && (
              <div className="mt-2">
                <img
                  src={
                    formData.image.startsWith('http')
                      ? formData.image
                      : `http://localhost:8000/storage/${formData.image}`
                  }
                  alt="Voucher"
                  width={80}
                  height={80}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}
            {imageFile && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  width={80}
                  height={80}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}
            <span className="text-xs text-gray-500">Upload gambar voucher (opsional).</span>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <ButtonComponent
              label="Batal"
              paint="secondary"
              variant="outline"
              onClick={() => {
                setModalForm(false);
                setSelectedVoucher(null);
                setFormData({
                  name: '',
                  description: '',
                  image: '',
                  type: '',
                  valid_until: '',
                  tenant_location: '',
                  stock: 0,
                  delivery: 'manual',
                  code: '',
                  community_id: '', // reset community_id
                });
                setImageFile(null);
              }}
            />
            <ButtonComponent
              label={selectedVoucher ? 'Perbarui' : 'Simpan'}
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
          setSelectedVoucher(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Voucher"
        message={`Apakah Anda yakin ingin menghapus voucher "${selectedVoucher?.code}"?`}
      />
    </>
  );
}

VoucherCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};