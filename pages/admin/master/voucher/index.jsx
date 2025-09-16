/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
import Cookies from 'js-cookie';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  InputComponent,
  InputImageComponent,
  ModalConfirmComponent,
  SelectComponent,
  TableSupervisionComponent,
  TextareaComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

/* -------------------- Helpers -------------------- */

const getApiBase = () => {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return raw.replace(/\/api\/?$/, '');
};

const buildImageUrl = (raw) => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = getApiBase();
  let path = String(raw).replace(/^\/+/, '');
  path = path.replace(/^api\/storage\//, 'storage/');
  if (!/^storage\//.test(path)) path = `storage/${path}`;
  return `${base}/${path}`;
};

const formatDateID = (raw) => {
  if (!raw) return '-';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

const formatStockVoucher = (n) => `${Number(n ?? 0)} voucher`;

/* -------------------- Page -------------------- */

function VoucherCrud() {
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);

  const apiBase = useMemo(() => getApiBase(), []);
  
  const authHeader = useCallback(() => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return { Authorization: `Bearer ${token}` };
  }, []);

  const getUserLabel = useCallback((id) => {
    if (!id) return '';
    const u = users.find((x) => String(x.id) === String(id));
    return u?.name || u?.email || `User #${id}`;
  }, [users]);

  const getCommunityLabel = useCallback((id) => {
    if (!id) return '';
    const c = communities.find((x) => String(x.id) === String(id));
    return c?.name || `Community #${id}`;
  }, [communities]);

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/communities`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (res.ok) {
          const result = await res.json();
          setCommunities(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
        setCommunities([]);
      }
    };

    fetchCommunities();
  }, [apiBase, authHeader]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/users`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
        });
        if (res.ok) {
          const result = await res.json();
          setUsers(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, [apiBase, authHeader]);


  const handleDelete = async () => {
    if (!selectedVoucher) return;
    
    try {
      const res = await fetch(`${apiBase}/api/admin/vouchers/${selectedVoucher.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });

      if (res.ok) {
        setRefreshToggle((s) => !s);
        alert('Voucher berhasil dihapus');
      } else {
        alert('Gagal menghapus voucher');
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert('Gagal menghapus voucher: Network error');
    } finally {
      setModalDelete(false);
      setSelectedVoucher(null);
    }
  };

  const columns = useMemo(() => [
    {
      selector: 'name',
      label: 'Nama Voucher',
      sortable: true,
      item: ({ name }) => <span className="font-semibold">{name || '-'}</span>,
    },
    {
      selector: 'code',
      label: 'Kode',
      sortable: true,
      item: ({ code }) => <span className="font-mono text-sm">{code || '-'}</span>,
    },
    {
      selector: 'image',
      label: 'Gambar',
      width: '100px',
      item: ({ image }) => {
        const src = buildImageUrl(image);
        return src ? (
          <Image 
            src={src} 
            alt="Voucher" 
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-lg"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-500">No Image</span>
          </div>
        );
      },
    },
    {
      selector: 'stock',
      label: 'Sisa Voucher',
      sortable: true,
      item: ({ stock }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          Number(stock) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {formatStockVoucher(stock)}
        </span>
      ),
    },
    {
      selector: 'target_type',
      label: 'Target',
      item: ({ target_type, target_user_id, community_id }) => {
        if (target_type === 'user') return getUserLabel(target_user_id);
        if (target_type === 'community') return getCommunityLabel(community_id);
        return 'Semua';
      },
    },
    {
      selector: 'valid_until',
      label: 'Berlaku Sampai',
      item: ({ valid_until }) => (
        <span className="text-sm">{formatDateID(valid_until)}</span>
      ),
    },
  ], [getUserLabel, getCommunityLabel]);

  const topBarActions = null;

  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Voucher"
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        searchable
        noControlBar={false}
        setToRefresh={refreshToggle}
        actionControl={{
          except: ['detail'],
          onAdd: () => {
            setSelectedVoucher(null);
          },
          onEdit: (voucher) => {
            setSelectedVoucher(voucher);
          },
          onDelete: (voucher) => {
            setSelectedVoucher(voucher);
            setModalDelete(true);
          },
        }}
        fetchControl={{
          path: 'admin/vouchers',
          includeHeaders: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
        }}
        formControl={{
          contentType: 'multipart/form-data',
          transformData: (data) => {
            // normalisasi target_type
            const tt = data.target_type || 'all';
          
            // bersihkan community_id
            const cid = data.community_id;
            const emptyish = cid === '' || cid === undefined || cid === null || cid === 'null' || cid === 'undefined';
          
            if (tt !== 'community' || emptyish) {
              // jangan kirim sama sekali
              delete data.community_id;
            } else {
              // pastikan bentuk string angka
              data.community_id = String(cid);
            }
          
            // bersihkan target_user_id kalau bukan user
            if (tt !== 'user') {
              delete data.target_user_id;
            }
          
            return data;
          },
          custom: [
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="name"
                  label="Nama Voucher"
                  placeholder="Contoh: Diskon 20% Semua Menu"
                  {...formControl('name')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="code"
                  label="Kode Unik"
                  placeholder="Contoh: HH-20OFF"
                  {...formControl('code')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <TextareaComponent
                  name="description"
                  label="Deskripsi"
                  placeholder="Tuliskan ketentuan singkat voucher"
                  {...formControl('description')}
                  rows={3}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputImageComponent
                  name="image"
                  label="Gambar Voucher"
                  {...formControl('image')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="type"
                  label="Tipe Voucher"
                  placeholder="Contoh: percentage / nominal / buy1get1"
                  {...formControl('type')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  type="date"
                  name="valid_until"
                  label="Berlaku Sampai"
                  {...formControl('valid_until')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="tenant_location"
                  label="Lokasi Tenant"
                  placeholder="Contoh: Foodcourt Lantai 2"
                  {...formControl('tenant_location')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  type="number"
                  name="stock"
                  label="Stok Voucher"
                  placeholder="Jumlah voucher tersedia"
                  {...formControl('stock')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <SelectComponent
                  name="target_type"
                  label="Target Penerima"
                  {...formControl('target_type')}
                  options={[
                    { label: 'Semua Pengguna', value: 'all' },
                    { label: 'Pengguna Tertentu', value: 'user' },
                    { label: 'Anggota Community', value: 'community' },
                  ]}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const targetType = values.find((i) => i.name === 'target_type')?.value;
                return targetType === 'user' ? (
                  <SelectComponent
                    name="target_user_id"
                    label="Pilih Pengguna"
                    placeholder="Pilih pengguna..."
                    {...formControl('target_user_id')}
                    options={users.map((u) => ({
                      label: u.name || u.email || `#${u.id}`,
                      value: u.id,
                    }))}
                  />
                ) : null;
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <SelectComponent
                  name="community_id"
                  label="Community (opsional)"
                  placeholder="Pilih community..."
                  {...formControl('community_id')}
                  clearable={true}
                  options={communities.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              ),
            },
          ],
        }}
      />

      <ModalConfirmComponent
        title="Hapus Voucher"
        show={modalDelete}
        onClose={() => {
          setModalDelete(false);
          setSelectedVoucher(null);
        }}
        onSubmit={handleDelete}
      >
        <p className="text-gray-600 mb-4">
          Apakah Anda yakin ingin menghapus voucher "{selectedVoucher?.name}"?
        </p>
        <p className="text-sm text-red-600">
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </ModalConfirmComponent>
    </>
  );
}

VoucherCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default VoucherCrud;