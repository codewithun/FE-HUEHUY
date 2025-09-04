import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  ModalConfirmComponent,
  TableSupervisionComponent,
} from '../../../../components/base.components';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import { token_cookie_name } from '../../../../helpers';
import { Decrypt } from '../../../../helpers/encryption.helpers';

export default function EventCrud() {
  const [eventList, setEventList] = useState([]);
  const [modalForm, setModalForm] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    organizer_name: '',
    organizer_logo: '',
    organizer_type: '',
    date: '',
    time: '',
    location: '',
    address: '',
    category: '',
    participants: 0,
    max_participants: 100,
    price: '',
    description: '',
    requirements: '',
    schedule: '',
    prizes: '',
    contact_phone: '',
    contact_email: '',
    tags: '',
    community_id: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [organizerLogoFile, setOrganizerLogoFile] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  // Fetch event list
  useEffect(() => {
    const fetchData = async () => {
      const encryptedToken = Cookies.get(token_cookie_name);
      const token = encryptedToken ? Decrypt(encryptedToken) : '';
      try {
        const res = await fetch(`${apiUrl}/admin/events`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await res.json();
        setEventList(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setEventList([]);
      }
    };
    fetchData();
  }, [apiUrl]);

  // Fetch community list
  useEffect(() => {
    const fetchCommunities = async () => {
      setLoadingCommunities(true);
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
      } finally {
        setLoadingCommunities(false);
      }
    };
    fetchCommunities();
  }, [apiUrl]);

  // Handler untuk upload gambar event
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setFormData({ ...formData, image: '' });
    }
  };

  // Handler untuk upload logo organizer
  const handleOrganizerLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setOrganizerLogoFile(e.target.files[0]);
      setFormData({ ...formData, organizer_logo: '' });
    }
  };

  // Add or update event
  const handleSubmit = async (e) => {
    e.preventDefault();
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : '';
    
    const url = selectedEvent
      ? `${apiUrl}/admin/events/${selectedEvent.id}`
      : `${apiUrl}/admin/events`;

    // Selalu gunakan FormData untuk konsistensi
    const formDataToSend = new FormData();
    
    // Append semua field
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Method spoofing untuk update
    if (selectedEvent) {
      formDataToSend.append('_method', 'PUT');
    }
    
    // Append files jika ada
    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }
    if (organizerLogoFile) {
      formDataToSend.append('organizer_logo', organizerLogoFile);
    }

    try {
      const response = await fetch(url, {
        method: 'POST', // Selalu POST, karena menggunakan method spoofing
        headers: {
          'Authorization': `Bearer ${token}`,
          // Jangan set Content-Type untuk FormData, biarkan browser yang set
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Format error message lebih baik
        let errorMessage = 'Gagal menyimpan event';
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          errorMessage += ':\n' + errorMessages.join('\n');
        } else if (errorData.message) {
          errorMessage += ': ' + errorData.message;
        }
        
        alert(errorMessage);
        return;
      }

      const result = await response.json();
      
      // Reset dan refresh
      setModalForm(false);
      resetForm();
      setSelectedEvent(null);

      // Refresh list
      const refreshRes = await fetch(`${apiUrl}/admin/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const refreshResult = await refreshRes.json();
      setEventList(Array.isArray(refreshResult.data) ? refreshResult.data : []);
      
      // Show success message
      alert(selectedEvent ? 'Event berhasil diperbarui!' : 'Event berhasil ditambahkan!');
      
    } catch (error) {
      alert('Terjadi kesalahan jaringan: ' + error.message);
    }
  };

  // Delete event
  const handleDelete = async () => {
    const encryptedToken = Cookies.get(token_cookie_name);
    const token = encryptedToken ? Decrypt(encryptedToken) : '';
    await fetch(`${apiUrl}/admin/events/${selectedEvent.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    setEventList(eventList.filter(e => e.id !== selectedEvent.id));
    setModalDelete(false);
    setSelectedEvent(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image: '',
      organizer_name: '',
      organizer_logo: '',
      organizer_type: '',
      date: '',
      time: '',
      location: '',
      address: '',
      category: '',
      participants: 0,
      max_participants: 100,
      price: '',
      description: '',
      requirements: '',
      schedule: '',
      prizes: '',
      contact_phone: '',
      contact_email: '',
      tags: '',
      community_id: '',
    });
    setImageFile(null);
    setOrganizerLogoFile(null);
  };

  // Open form for edit
  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title || '',
      subtitle: event.subtitle || '',
      image: event.image || '',
      organizer_name: event.organizer_name || '',
      organizer_logo: event.organizer_logo || '',
      organizer_type: event.organizer_type || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      address: event.address || '',
      category: event.category || '',
      participants: event.participants || 0,
      max_participants: event.max_participants || 100,
      price: event.price || '',
      description: event.description || '',
      requirements: event.requirements || '',
      schedule: event.schedule || '',
      prizes: event.prizes || '',
      contact_phone: event.contact_phone || '',
      contact_email: event.contact_email || '',
      tags: event.tags || '',
      community_id: event.community_id || '',
    });
    setImageFile(null);
    setOrganizerLogoFile(null);
    setModalForm(true);
  };

  const columns = [
    {
      selector: 'title',
      label: 'Judul Event',
      sortable: true,
      item: ({ title }) => <span className="font-semibold">{title}</span>,
    },
    {
      selector: 'category',
      label: 'Kategori',
      item: ({ category }) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {category || '-'}
        </span>
      ),
    },
    {
      selector: 'date',
      label: 'Tanggal',
      sortable: true,
      item: ({ date }) => date || '-',
    },
    {
      selector: 'location',
      label: 'Lokasi',
      item: ({ location }) => location || '-',
    },
    {
      selector: 'participants',
      label: 'Peserta',
      item: ({ participants, max_participants }) => 
        `${participants || 0}/${max_participants || 0}`,
    },
    {
      selector: 'price',
      label: 'Harga',
      item: ({ price }) => price || 'Gratis',
    },
    {
      selector: 'image',
      label: 'Gambar',
      width: '100px',
      item: ({ image }) =>
        image ? (
          image.startsWith('http') ? (
            <img src={image} alt="Event" width={48} height={48} className="rounded" />
          ) : (
            <img src={`${apiUrl}/storage/${image}`} alt="Event" width={48} height={48} className="rounded" />
          )
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  const topBarActions = (
    <ButtonComponent
      label="Tambah Event"
      icon={faPlus}
      paint="primary"
      onClick={() => {
        setSelectedEvent(null);
        resetForm();
        setModalForm(true);
      }}
    />
  );

  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Event"
        data={eventList}
        columnControl={{ custom: columns }}
        customTopBar={topBarActions}
        noControlBar={false}
        searchable={true}
        fetchControl={{
          path: 'admin/events',
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
          setSelectedEvent(null);
          resetForm();
        }}
        title={selectedEvent ? 'Ubah Event' : 'Tambah Event'}
        size="lg"
        className="bg-background"
      >
        <form className="flex flex-col gap-4 p-6 max-h-[80vh] overflow-y-auto" onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Judul Event *</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Masukkan judul event"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-semibold">Kategori</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Contoh: Kids & Family"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold">Subtitle</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Deskripsi singkat event"
              value={formData.subtitle}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Tanggal *</label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-semibold">Waktu</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Contoh: 10:00 - 17:00"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Lokasi *</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Nama tempat event"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-semibold">Alamat</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Alamat lengkap"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Organizer Info */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-lg mb-3">Informasi Penyelenggara</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold">Nama Penyelenggara *</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Nama organisasi/perusahaan"
                  value={formData.organizer_name}
                  onChange={e => setFormData({ ...formData, organizer_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="font-semibold">Tipe Penyelenggara</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Contoh: Shopping Mall, Event Organizer"
                  value={formData.organizer_type}
                  onChange={e => setFormData({ ...formData, organizer_type: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Participants & Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold">Peserta Saat Ini</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.participants}
                onChange={e => setFormData({ ...formData, participants: Number(e.target.value) })}
                min="0"
              />
            </div>
            <div>
              <label className="font-semibold">Maksimal Peserta</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.max_participants}
                onChange={e => setFormData({ ...formData, max_participants: Number(e.target.value) })}
                min="1"
              />
            </div>
            <div>
              <label className="font-semibold">Harga</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Contoh: Gratis, Rp 50.000"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Telepon Kontak</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="+62 22 1234567"
                value={formData.contact_phone}
                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold">Email Kontak</label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="event@example.com"
                value={formData.contact_email}
                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
          </div>

          {/* Community */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold">Community *</label>
              <button
                type="button"
                onClick={() => {
                  const fetchCommunities = async () => {
                    setLoadingCommunities(true);
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
                    } finally {
                      setLoadingCommunities(false);
                    }
                  };
                  fetchCommunities();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
                disabled={loadingCommunities}
              >
                {loadingCommunities ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="space-y-2">
              <select
                className="select select-bordered w-full"
                value={formData.community_id}
                onChange={e => setFormData({ ...formData, community_id: e.target.value })}
                disabled={loadingCommunities}
                required
              >
                <option value="">Pilih Community *</option>
                {loadingCommunities ? (
                  <option value="" disabled>Loading communities...</option>
                ) : communities.length === 0 ? (
                  <option value="" disabled>Tidak ada community tersedia - Klik Refresh</option>
                ) : (
                  communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name} - {community.location || 'Lokasi tidak diset'}
                    </option>
                  ))
                )}
              </select>
              
              {/* Display selected community info */}
              {formData.community_id && communities.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  {(() => {
                    const selectedCommunity = communities.find(c => c.id.toString() === formData.community_id.toString());
                    return selectedCommunity ? (
                      <div className="text-sm">
                        <div className="font-semibold text-blue-800">{selectedCommunity.name}</div>
                        <div className="text-blue-600">
                          📍 {selectedCommunity.location || 'Lokasi belum diset'}
                        </div>
                        {selectedCommunity.description && (
                          <div className="text-blue-600 mt-1">
                            {selectedCommunity.description.substring(0, 100)}
                            {selectedCommunity.description.length > 100 ? '...' : ''}
                          </div>
                        )}
                        <div className="text-xs text-green-600 mt-2 font-medium">
                          ✓ Event akan muncul di halaman community ini
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Community tidak ditemukan</div>
                    );
                  })()}
                </div>
              )}
              
              <div className="text-xs text-red-500">
                * Wajib pilih community. Event akan muncul di halaman community yang dipilih.
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold">Deskripsi Event</label>
            <textarea
              className="textarea textarea-bordered w-full h-24"
              placeholder="Deskripsi lengkap event..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Requirements, Schedule, Prizes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold">Syarat & Ketentuan</label>
              <textarea
                className="textarea textarea-bordered w-full h-20"
                placeholder="Pisahkan dengan enter untuk setiap poin"
                value={formData.requirements}
                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold">Jadwal Acara</label>
              <textarea
                className="textarea textarea-bordered w-full h-20"
                placeholder="Format: waktu|aktivitas (pisahkan dengan enter)"
                value={formData.schedule}
                onChange={e => setFormData({ ...formData, schedule: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold">Hadiah & Rewards</label>
              <textarea
                className="textarea textarea-bordered w-full h-20"
                placeholder="Pisahkan dengan enter untuk setiap hadiah"
                value={formData.prizes}
                onChange={e => setFormData({ ...formData, prizes: e.target.value })}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-semibold">Tags</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Pisahkan dengan koma (contoh: Kids, Drawing, Competition)"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Gambar Event</label>
              <input
                type="file"
                accept="image/*,.jpeg,.jpg,.png,.gif,.svg,.webp,.bmp,.tiff,.ico,.heic,.heif"
                className="input input-bordered w-full"
                onChange={handleImageChange}
              />
              <div className="text-xs text-gray-500 mt-1">
                Format yang didukung: JPEG, JPG, PNG, GIF, SVG, WEBP, BMP, TIFF, ICO, HEIC, HEIF (Max: 5MB)
              </div>
              {formData.image && !imageFile && (
                <div className="mt-2">
                  <img
                    src={
                      formData.image.startsWith('http')
                        ? formData.image
                        : `${apiUrl}/storage/${formData.image}`
                    }
                    alt="Event"
                    width={80}
                    height={80}
                    className="rounded object-cover"
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
                    className="rounded object-cover"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="font-semibold">Logo Penyelenggara</label>
              <input
                type="file"
                accept="image/*,.jpeg,.jpg,.png,.gif,.svg,.webp,.bmp,.tiff,.ico,.heic,.heif"
                className="input input-bordered w-full"
                onChange={handleOrganizerLogoChange}
              />
              <div className="text-xs text-gray-500 mt-1">
                Format yang didukung: JPEG, JPG, PNG, GIF, SVG, WEBP, BMP, TIFF, ICO, HEIC, HEIF (Max: 5MB)
              </div>
              {formData.organizer_logo && !organizerLogoFile && (
                <div className="mt-2">
                  <img
                    src={
                      formData.organizer_logo.startsWith('http')
                        ? formData.organizer_logo
                        : `${apiUrl}/storage/${formData.organizer_logo}`
                    }
                    alt="Organizer Logo"
                    width={80}
                    height={80}
                    className="rounded object-cover"
                  />
                </div>
              )}
              {organizerLogoFile && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(organizerLogoFile)}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="rounded object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
            <ButtonComponent
              label="Batal"
              paint="secondary"
              variant="outline"
              onClick={() => {
                setModalForm(false);
                setSelectedEvent(null);
                resetForm();
              }}
            />
            <ButtonComponent
              label={selectedEvent ? 'Perbarui' : 'Simpan'}
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
          setSelectedEvent(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Event"
        message={`Apakah Anda yakin ingin menghapus event "${selectedEvent?.title}"?`}
      />
    </>
  );
}

EventCrud.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
