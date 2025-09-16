/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-console */
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
  TableSupervisionComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import VoucherForm from '../../../../components/voucher/VoucherForm';
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
  const [modalForm, setModalForm] = useState(false);
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

  const submitVoucher = async (body) => {
    try {
      const isUpdate = Boolean(selectedVoucher);
      const url = isUpdate
        ? `${apiBase}/api/admin/vouchers/${selectedVoucher.id}`
        : `${apiBase}/api/admin/vouchers`;

      const res = await fetch(url, { 
        method: 'POST', 
        headers: { ...authHeader() }, 
        body 
      });

      if (!res.ok) {
        let msg = 'Server error';
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
        }
        alert('Gagal menyimpan voucher: ' + msg);
        return;
      }

      resetForm();
      setRefreshToggle((s) => !s);
      setModalForm(false);
    } catch (error) {
      console.error('Error submitting voucher:', error);
      alert('Gagal menyimpan voucher: Network error');
    }
  };

  const resetForm = () => {
    setSelectedVoucher(null);
  };

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
          <img 
            src={src} 
            alt="Voucher" 
            className="w-12 h-12 object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
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

  const topBarActions = (
    <ButtonComponent
      label="Tambah Voucher"
      icon={faPlus}
      paint="primary"
      onClick={() => {
        resetForm();
        setModalForm(true);
      }}
    />
  );

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
          except: ['detail', 'add'],
          onEdit: (voucher) => {
            setSelectedVoucher(voucher);
            setModalForm(true);
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
      />

      <FloatingPageComponent
        show={modalForm}
        onClose={() => {
          setModalForm(false);
          resetForm();
        }}
        title=""
        subtitle=""
        size="lg"
        className="bg-background"
      >
        <VoucherForm
          mode={selectedVoucher ? 'edit' : 'create'}
          initialData={
            selectedVoucher
              ? { 
                  ...selectedVoucher, 
                  valid_until: selectedVoucher.valid_until || '' 
                }
              : undefined
          }
          users={users}
          communities={communities}
          buildImageUrl={buildImageUrl}
          onCancel={() => {
            setModalForm(false);
            resetForm();
          }}
          onSubmit={submitVoucher}
        />
      </FloatingPageComponent>

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