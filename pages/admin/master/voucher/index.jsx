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
import MultiSelectDropdown from '../../../../components/form/MultiSelectDropdown';


const toDateInput = (raw) => {
  if (!raw) return '';
  // aman untuk ISO / '2025-09-20 12:00:00'
  const s = String(raw);
  if (s.includes('T')) return s.split('T')[0];
  // fallback via Date
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.slice(0, 10); // 'YYYY-MM-DD' dari string
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setRefreshToggle((s) => !s);
        alert('Voucher berhasil dihapus');
      } else {
        console.error('Delete failed:', body);
        alert(body?.message || 'Gagal menghapus voucher');
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
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            Number(stock) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {formatStockVoucher(stock)}
        </span>
      ),
    },
    {
      selector: 'target_type',
      label: 'Target',
      item: ({ target_type, target_user_ids, community_id }) => {
        if (target_type === 'user') {
          const userIds = Array.isArray(target_user_ids)
            ? target_user_ids
            : target_user_ids
            ? String(target_user_ids).split(',').map((id) => id.trim())
            : [];
          if (userIds.length === 0) return 'Tidak ada pengguna';
          if (userIds.length === 1) return getUserLabel(userIds[0]);
          return `${userIds.length} Pengguna Dipilih`;
        }
        if (target_type === 'community') return getCommunityLabel(community_id);
        return 'Semua';
      },
    },
    {
      selector: 'valid_until',
      label: 'Berlaku Sampai',
      item: ({ valid_until }) => <span className="text-sm">{formatDateID(valid_until)}</span>,
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
          onAdd: () => setSelectedVoucher(null),
          onEdit: (voucher) => setSelectedVoucher(voucher),
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
        /* ===== DEFAULT VALUE supaya tidak 422 ===== */
        formDefaultValue={{
          validation_type: 'auto',
          target_type: 'all',
          stock: 0,
        }}
        /* ===== GUARD opsional sebelum submit (cegah 422 on FE) ===== */
        beforeSubmit={(payload) => {
          const tt = payload?.target_type || 'all';
          if (tt === 'user' && (!payload.target_user_ids || payload.target_user_ids.length === 0)) {
            alert('Pilih minimal 1 pengguna untuk target user.');
            return false;
          }
          if ((payload.validation_type || 'auto') === 'manual' && !payload.code?.trim()) {
            alert('Kode wajib diisi untuk tipe validasi manual.');
            return false;
          }
          return true;
        }}
        formControl={{
          contentType: 'multipart/form-data',
         transformData: (data) => {
  data.target_type = data.target_type || 'all';
  data.validation_type = data.validation_type || 'auto';

  if (!data.image || !(data.image instanceof File)) delete data.image;
  if (!data.valid_until) delete data.valid_until;

  if (data.target_type !== 'community' || !data.community_id) {
    delete data.community_id;
  } else {
    data.community_id = String(data.community_id);
  }

  if (data.target_type === 'user' && Array.isArray(data.target_user_ids) && data.target_user_ids.length) {
    data.target_user_ids
      .map(Number)
      .filter((id) => Number.isFinite(id) && id > 0)
      .forEach((id, i) => { data[`target_user_ids[${i}]`] = id; });
  }
  delete data.target_user_ids;
  delete data.target_user_id;

  if (data.validation_type === 'manual') {
    if (data.code) data.code = String(data.code).trim();
  } else {
    if (!data.code) delete data.code;
  }

  data.stock = Number(data.stock ?? 0);
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
              custom: ({ formControl }) => {
                const fc = formControl('image');
                const raw = fc.value;
                const preparedValue =
                  raw instanceof File ? raw : (raw ? buildImageUrl(String(raw)) : '');

                return (
                  <InputImageComponent
                    name="image"
                    label="Gambar Voucher"
                    {...fc}
                    value={preparedValue}
                  />
                );
              },
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
              custom: ({ formControl }) => {
                const fc = formControl('validation_type');
                const current = fc.value ?? 'auto';
                const onChange = (e) => {
                  fc.onChange?.(e);
                  const val = e?.target?.value ?? e?.value ?? null;
                  if (val === 'auto') {
                    formControl('code')?.onChange?.({ target: { value: '' } });
                  }
                };
                return (
                  <SelectComponent
                    name="validation_type"
                    label="Tipe Validasi *"
                    required
                    value={current}
                    onChange={onChange}
                    options={[
                      { label: 'Generate Otomatis (QR Code)', value: 'auto' },
                      { label: 'Masukan Kode Unik', value: 'manual' },
                    ]}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const vt = values.find((i) => i.name === 'validation_type')?.value ?? 'auto';
                if (vt !== 'manual') return null;
                return (
                  <InputComponent
                    name="code"
                    label="Kode Voucher *"
                    placeholder="Contoh: HH-20OFF"
                    required
                    {...formControl('code')}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent type="date" name="valid_until" label="Berlaku Sampai" {...formControl('valid_until')} />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('stock');
                const current = fc.value ?? 0;
                return (
                  <InputComponent
                    type="number"
                    name="stock"
                    label="Stok Voucher"
                    placeholder="Jumlah voucher tersedia"
                    value={current}
                    onChange={fc.onChange}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('target_type');
                const current = fc.value ?? 'all';
                return (
                  <SelectComponent
                    name="target_type"
                    label="Target Penerima"
                    value={current}
                    onChange={fc.onChange}
                    options={[
                      { label: 'Semua Pengguna', value: 'all' },
                      { label: 'Pengguna Tertentu', value: 'user' },
                      { label: 'Anggota Community', value: 'community' },
                    ]}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const targetType = values.find((i) => i.name === 'target_type')?.value ?? 'all';
                return targetType === 'user' ? (
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Pilih Pengguna</span>
                      <span className="label-text-alt text-red-500">*</span>
                    </label>
                    <MultiSelectDropdown
                      options={users.map((u) => ({
                        label: `${u.name || u.email || `#${u.id}`}`,
                        value: u.id,
                      }))}
                      value={formControl('target_user_ids').value || []}
                      onChange={formControl('target_user_ids').onChange}
                      placeholder="Pilih satu atau lebih pengguna..."
                      maxHeight={200}
                    />
                    <label className="label">
                      <span className="label-text-alt text-gray-500">
                        Anda dapat memilih beberapa pengguna sekaligus
                      </span>
                    </label>
                  </div>
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
        formUpdateControl={{
        customDefaultValue: (data) => ({
          ...data,
          valid_until: toDateInput(data?.valid_until),
          // <<< PENTING: jadikan image URL absolut biar preview langsung muncul
          image: data?.image ? buildImageUrl(data.image) : '',
          target_user_ids: data.target_user_ids
            ? Array.isArray(data.target_user_ids)
              ? data.target_user_ids
              : String(data.target_user_ids).split(',').map((id) => Number(String(id).trim()))
            : [],
          validation_type: data.validation_type || (data.code ? 'manual' : 'auto'),
          target_type: data.target_type || 'all',
          stock: data.stock ?? 0,
        }),
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
        <p className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
      </ModalConfirmComponent>
    </>
  );
}

VoucherCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default VoucherCrud;
