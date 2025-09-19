/* eslint-disable no-console */
import Cookies from "js-cookie";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  InputComponent,
  InputImageComponent,
  ModalConfirmComponent,
  SelectComponent,
  TableSupervisionComponent,
  TextareaComponent,
} from "../../../../components/base.components";
import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import { token_cookie_name } from "../../../../helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";

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

/* -------------------- Page -------------------- */

function PromoDashboard() {
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [formError, setFormError] = useState(null);

  const apiBase = useMemo(() => getApiBase(), []);
  
  const authHeader = useCallback(() => {
    const enc = Cookies.get(token_cookie_name);
    const token = enc ? Decrypt(enc) : '';
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Fetch communities for dropdown
  useEffect(() => {
    const fetchCommunities = async () => {
      setCommunitiesLoading(true);
      setFormError(null);
      
      try {
        console.log('Fetching communities from:', `${apiBase}/api/admin/communities`);
        
        const res = await fetch(`${apiBase}/api/admin/communities`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json',
            ...authHeader() 
          },
        });
        
        console.log('Communities fetch response status:', res.status);
        
        if (res.ok) {
          const result = await res.json();
          console.log('Communities fetch result:', result);
          
          // Handle different possible response structures
          let communitiesData = [];
          
          if (result.success && Array.isArray(result.data)) {
            communitiesData = result.data;
          } else if (Array.isArray(result.data)) {
            communitiesData = result.data;
          } else if (Array.isArray(result)) {
            communitiesData = result;
          } else if (result.communities && Array.isArray(result.communities)) {
            communitiesData = result.communities;
          }
          
          setCommunities(communitiesData);
          console.log('Communities loaded:', communitiesData);
          
          if (communitiesData.length === 0) {
            console.warn('No communities found in response');
          }
        } else {
          const errorText = await res.text();
          console.error('Failed to fetch communities:', res.status, errorText);
          setFormError(`Failed to fetch communities: ${res.status}`);
          setCommunities([]);
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
        setFormError(`Network error: ${error.message}`);
        setCommunities([]);
      } finally {
        setCommunitiesLoading(false);
      }
    };

    fetchCommunities();
  }, [apiBase, authHeader]);

  const handleDelete = async () => {
    if (!selectedPromo) return;
    
    try {
      const res = await fetch(`${apiBase}/api/admin/promos/${selectedPromo.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...authHeader() 
        },
      });

      if (res.ok) {
        setRefreshToggle((s) => !s);
        alert('Promo berhasil dihapus');
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        alert(`Gagal menghapus promo: ${errorData.message || res.status}`);
      }
    } catch (error) {
      console.error('Error deleting promo:', error);
      alert('Gagal menghapus promo: Network error');
    } finally {
      setModalDelete(false);
      setSelectedPromo(null);
    }
  };

  const columns = useMemo(() => [
    {
      selector: 'title',
      label: 'Judul Promo',
      sortable: true,
      item: ({ title }) => <span className="font-semibold">{title || '-'}</span>,
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
            alt="Promo" 
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
      label: 'Sisa Stock',
      sortable: true,
      item: ({ stock }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          Number(stock) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {Number(stock ?? 0)} promo
        </span>
      ),
    },
    {
      selector: 'promo_type',
      label: 'Tipe',
      item: ({ promo_type }) => (
        <span className="capitalize">{promo_type || 'offline'}</span>
      ),
    },
    {
      selector: 'community_id',
      label: 'Community',
      item: ({ community_id, community }) => {
        // Display community name if available in the promo data
        if (community?.name) {
          return <span className="text-sm">{community.name}</span>;
        }
        // Fallback to find community by ID
        const foundCommunity = communities.find(c => c.id == community_id);
        return (
          <span className="text-sm">
            {foundCommunity?.name || foundCommunity?.title || `ID: ${community_id || '-'}`}
          </span>
        );
      },
    },
    {
      selector: 'end_date',
      label: 'Berakhir',
      item: ({ end_date }) => (
        <span className="text-sm">{formatDateID(end_date)}</span>
      ),
    },
  ], [communities]);

  const validateFormData = useCallback((data, mode) => {
    const errors = [];
    
    // Required field validation
    if (!data.title?.trim()) errors.push('Judul promo wajib diisi');
    if (!data.description?.trim()) errors.push('Deskripsi wajib diisi');
    if (!data.owner_name?.trim()) errors.push('Nama pemilik wajib diisi');
    if (!data.owner_contact?.trim()) errors.push('Kontak pemilik wajib diisi');
    if (!data.promo_type) errors.push('Tipe promo wajib dipilih');
    if (!data.community_id && mode === 'create') errors.push('Community wajib dipilih');
    
    // Date validation
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (endDate < startDate) {
        errors.push('Tanggal berakhir harus setelah tanggal mulai');
      }
    }
    
    return errors;
  }, []);

  const topBarActions = formError ? (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {formError}
    </div>
  ) : null;

  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Promo"
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        searchable
        noControlBar={false}
        setToRefresh={refreshToggle}
        actionControl={{
          except: ['detail'],
          onAdd: () => {
            setSelectedPromo(null);
          },
          onEdit: (promo) => {
            setSelectedPromo(promo);
          },
          onDelete: (promo) => {
            setSelectedPromo(promo);
            setModalDelete(true);
          },
        }}
        fetchControl={{
          path: 'admin/promos',
          includeHeaders: {
            ...authHeader(),
          },
          onError: (error) => {
            console.error('API Error:', error);
            setFormError(error.message || 'Terjadi kesalahan');
          },
        }}
        formControl={{
          contentType: 'multipart/form-data',
          transformData: (data, mode, originalData) => {
            console.log('Transform data called:', { data, mode, originalData });
            console.log('Available communities:', communities);
            
            // Validate first
            const validationErrors = validateFormData(data, mode);
            if (validationErrors.length > 0) {
              console.error('Validation errors:', validationErrors);
              throw new Error(validationErrors.join(', '));
            }
            
            const formData = new FormData();
            
            // Get community_id with proper fallback
            let communityId = data.community_id;
            if (mode === 'edit' && !communityId && originalData) {
              communityId = originalData.community_id;
            }
            
            // Ensure communityId is properly converted
            if (communityId) {
              communityId = String(communityId);
            }
            
            console.log('Community ID used:', communityId, 'Mode:', mode);
            console.log('Original community_id:', data.community_id);
            
            // Required fields - only append if there's a value
            if (data.title?.trim()) formData.append('title', data.title.trim());
            if (data.description?.trim()) formData.append('description', data.description.trim());
            if (data.owner_name?.trim()) formData.append('owner_name', data.owner_name.trim());
            if (data.owner_contact?.trim()) formData.append('owner_contact', data.owner_contact.trim());
            if (data.promo_type) formData.append('promo_type', data.promo_type);
            
            // Community ID - required for all modes
            if (communityId) {
              formData.append('community_id', communityId);
            } else if (mode === 'create') {
              console.error('community_id is required for create mode');
              throw new Error('Community ID is required');
            }
            
            // Optional text fields
            if (data.detail?.trim()) formData.append('detail', data.detail.trim());
            if (data.location?.trim()) formData.append('location', data.location.trim());
            if (data.start_date) formData.append('start_date', data.start_date);
            if (data.end_date) formData.append('end_date', data.end_date);
            
            // Validation type and code handling
            if (data.validation_type) formData.append('validation_type', data.validation_type);
            
            // Jika validation_type adalah manual, kirim code sebagai barcode
            // Jika auto, biarkan backend generate otomatis
            if (data.validation_type === 'manual' && data.code?.trim()) {
              formData.append('code', data.code.trim());
              formData.append('barcode', data.code.trim()); // untuk compatibility
            } else if (data.validation_type === 'auto') {
              // Auto generate - tidak perlu kirim code
              // Backend akan generate otomatis
            }
            
            // Numeric fields - convert to proper values
            const promoDistance = parseFloat(data.promo_distance) || 0;
            const stock = parseInt(data.stock) || 0;
            
            formData.append('promo_distance', String(promoDistance));
            formData.append('stock', String(stock));
            
            // Boolean field - ensure proper conversion
            const alwaysAvailable = Boolean(data.always_available);
            formData.append('always_available', alwaysAvailable ? '1' : '0');
            
            // Image file - only append if it's a File object
            if (data.image instanceof File) {
              formData.append('image', data.image);
            }
            
            // Method override for edit mode
            if (mode === 'edit') {
              formData.append('_method', 'PUT');
            }
            
            // Debug logging
            console.log('Final FormData entries:');
            for (let [key, value] of formData.entries()) {
              console.log(`${key}:`, value);
            }
            
            return formData;
          },
          custom: [
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="title"
                  label="Judul Promo *"
                  placeholder="Contoh: Diskon 50% Semua Menu"
                  required
                  {...formControl('title')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <TextareaComponent
                  name="description"
                  label="Deskripsi Singkat *"
                  placeholder="Tuliskan deskripsi singkat promo"
                  required
                  {...formControl('description')}
                  rows={2}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <TextareaComponent
                  name="detail"
                  label="Detail Promo"
                  placeholder="Tuliskan detail lengkap promo, syarat dan ketentuan"
                  {...formControl('detail')}
                  rows={3}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputImageComponent
                  name="image"
                  label="Gambar Promo"
                  aspect="16/9"
                  {...formControl('image')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <SelectComponent
                  name="promo_type"
                  label="Tipe Promo *"
                  required
                  {...formControl('promo_type')}
                  options={[
                    { label: 'Offline', value: 'offline' },
                    { label: 'Online', value: 'online' },
                  ]}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                const fc = formControl('validation_type');
                const onChange = (e) => {
                  // pass ke handler formControl bawaan
                  fc.onChange?.(e);
                  const val = e?.target?.value ?? e?.value ?? null;
                  // kalau balik ke auto, kosongkan code
                  if (val === 'auto') {
                    formControl('code')?.onChange?.({ target: { value: '' } });
                  }
                };
                return (
                  <SelectComponent
                    name="validation_type"
                    label="Tipe Validasi *"
                    required
                    value={fc.value}
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
                const validationType = values.find((i) => i.name === 'validation_type')?.value;
                if (validationType !== 'manual') return null;

                return (
                  <InputComponent
                    name="code"
                    label="Kode Promo *"
                    placeholder="Contoh: PROMO50OFF"
                    required
                    {...formControl('code')}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  type="number"
                  name="promo_distance"
                  label="Jarak Promo (KM)"
                  placeholder="Contoh: 5"
                  step="0.1"
                  min="0"
                  {...formControl('promo_distance')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  type="date"
                  name="start_date"
                  label="Tanggal Mulai"
                  {...formControl('start_date')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  type="date"
                  name="end_date"
                  label="Tanggal Berakhir"
                  {...formControl('end_date')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="location"
                  label="Lokasi Promo"
                  placeholder="Contoh: Mall Central Park Lt. 2"
                  {...formControl('location')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  type="number"
                  name="stock"
                  label="Stok Promo"
                  placeholder="Jumlah promo tersedia"
                  min="0"
                  {...formControl('stock')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="owner_name"
                  label="Nama Pemilik *"
                  placeholder="Contoh: PT. Restaurant ABC"
                  required
                  {...formControl('owner_name')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  name="owner_contact"
                  label="Kontak Pemilik *"
                  placeholder="Contoh: 08123456789 atau email@domain.com"
                  required
                  {...formControl('owner_contact')}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                console.log('Community options in render:', communities);
                console.log('FormControl value:', formControl('community_id').value);
                
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
                      {...formControl('community_id')}
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
                        <span className="label-text-alt text-error">
                          {formError}
                        </span>
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      {...formControl('always_available')}
                    />
                    <span className="label-text">Selalu Tersedia (tidak terbatas waktu)</span>
                  </label>
                </div>
              ),
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => ({
            ...data,
            // Untuk edit mode, pastikan validation_type dan code tersedia
            validation_type: data.validation_type || (data.code ? 'manual' : 'auto'),
          }),
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
        <p className="text-sm text-red-600">
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </ModalConfirmComponent>
    </>
  );
}

PromoDashboard.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default PromoDashboard;
