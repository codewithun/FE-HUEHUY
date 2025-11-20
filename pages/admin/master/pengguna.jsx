import { faHandHoldingHand } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import {
  ButtonComponent,
  InputComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import GiveCubeModal from '../../../components/construct.components/modal/GiveCube.modal';
import UserDetailComponent from '../../../components/construct.components/partial-page/UserDetail.component';
import { useUserContext } from '../../../context/user.context';
import { admin_token_cookie_name } from '../../../helpers/api.helpers';

export default function ManageUser() {
  const [selected, setSelected] = useState(null);
  const [modalGive, setModalGive] = useState(false);
  const [refreshKey] = useState(0);
  // Toggle untuk menampilkan field ubah password hanya saat diperlukan (hanya pada form update)
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const { profile: Profile } = useUserContext();

  const resolveUserImageUrl = (src) => {
    if (!src) return null;
    if (/^https?:\/\//.test(src)) return src; // sudah absolute
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    // Laravel biasanya expose storage via /storage
    return `${base.replace(/\/$/, '')}/storage/${src.replace(/^\//, '')}`;
  };

  // Use shared resolver to support Google URLs and storage paths

  // Komponen terpisah agar bisa pakai React Hooks
  const IntegratedImageField = ({ values, formControl }) => {
    const existing = values.find(v => v.name === '_existing_picture_source')?.value;
    const ctrl = formControl('image');
    const [localPreview, setLocalPreview] = useState(null);

    const handleFile = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        ctrl.onChange(file);
        const url = URL.createObjectURL(file);
        setLocalPreview(prev => {
          if (prev && prev.startsWith('blob:')) {
            try { URL.revokeObjectURL(prev); } catch {}
          }
          return url;
        });
      }
    };

    useEffect(() => {
      return () => {
        if (localPreview && localPreview.startsWith('blob:')) {
          try { URL.revokeObjectURL(localPreview); } catch {}
        }
      };
    }, [localPreview]);

    const showPreview = localPreview || (existing ? resolveUserImageUrl(existing) : null);

    return (
      <div>
        <label className="select-none text-sm font-medium text-slate-700 mb-1 block">Foto Profil</label>
        <div className="relative w-full" style={{ maxWidth: 160 }}>
          <div
            className="border border-emerald-100 rounded-lg bg-background shadow-inner flex flex-col items-center justify-center overflow-hidden"
            style={{ width: 160, height: 160, position: 'relative' }}
          >
            {showPreview ? (
              <img
                src={showPreview}
                alt="Preview Foto"
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
                onError={(ev) => { ev.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400 gap-2">
                <span className="text-xs">Belum ada foto</span>
              </div>
            )}
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFile}
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ width: '100%', height: '100%' }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs py-1 text-center">
              {localPreview ? 'Ganti Foto' : existing ? 'Ganti Foto' : 'Pilih Foto'}
            </div>
          </div>
          {/* Removed persisted photo note per user request */}
          {localPreview && (
            <small className="block mt-1 text-[10px] text-green-600">Preview foto baru belum disimpan</small>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const adminToken = Cookies.get(admin_token_cookie_name) || (typeof window !== 'undefined' ? localStorage.getItem(admin_token_cookie_name) : null);
    if (adminToken && Profile) {
      if (Profile?.role_id != 1) {
        Cookies.remove(admin_token_cookie_name);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(admin_token_cookie_name);
          window.location.href = '/admin';
        }
      }
    }
  }, [Profile]);

  return (
    <>
      <TableSupervisionComponent
        title="Pengguna"
        fetchControl={{
          path: 'admin/users',
        }}
        setToRefresh={refreshKey}
        columnControl={{
          custom: [
            {
              selector: 'name',
              label: 'Nama',
              sortable: true,
              width: '250px',
              item: ({ name }) => name,
            },
            {
              selector: 'email',
              label: 'Email',
              sortable: true,
              width: '320px',
              item: ({ email }) => email,
            },
            {
              selector: 'role',
              label: 'Role (Global)',
              sortable: true,
              width: '200px',
              item: ({ role }) => role?.name,
            },
          ],
        }}
        formControl={{
          contentType: 'multipart/form-data',
          custom: [
            // Letakkan foto profil di paling atas agar konsisten dengan form update
            {
              type: 'custom',
              col: 3,
              custom: ({ values, formControl }) => (
                <IntegratedImageField values={values} formControl={formControl} />
              ),
            },
            {
              construction: {
                name: 'name',
                label: 'Nama',
                placeholder: 'Masukkan Nama...',
                validations: { required: true },
              },
            },
            {
              construction: {
                name: 'email',
                label: 'Email',
                placeholder: 'Masukkan email...',
                validations: { required: true, email: true },
              },
            },
            {
              construction: {
                name: 'phone',
                label: 'No. Telepon',
                placeholder: 'Tambahkan No Telepon...',
                validations: { required: true, min: 10 },
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  {...formControl('password')}
                  type="password"
                  name="password"
                  label="password"
                  placeholder="Masukan password..."
                  validations={{ required: true, min: 8 }}
                />
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <InputComponent
                  {...formControl('password_confirmation')}
                  type="password"
                  name="password_confirmation"
                  label="password"
                  placeholder="Masukan ulang password..."
                  validations={{ required: true, min: 8 }}
                />
              ),
            },
            {
              type: 'select',
              construction: {
                name: 'role_id',
                label: 'Role Global',
                placeholder: 'Pilih role global..',
                serverOptionControl: { path: 'admin/options/role?isCorporate=0' },
              },
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => ({
            name: data?.name,
            email: data?.email,
            phone: data?.phone,
            // Hindari string kosong untuk role_id agar tidak gagal validasi numeric; gunakan id yang ada
            role_id: data?.role_id ?? data?.role?.id ?? undefined,
            // Simpan sumber gambar existing hanya untuk preview (tidak dikirim sebagai file)
            _existing_picture_source: data?.picture_source || undefined,
            // image tidak diset agar tidak terkirim sebagai string; user perlu memilih file baru jika ingin ganti
            // image: resolveUserImageUrl(data),
          }),
          contentType: 'multipart/form-data',
          custom: [
            // Spoof HTTP method for Laravel so update uses PUT (helper sudah auto, tapi tetap aman)
            {
              type: 'custom',
              custom: () => <input type="hidden" name="_method" value="PUT" />,
            },
            // Field gambar terpadu: preview existing + pilih file baru dalam satu blok
            {
              type: 'custom',
              col: 3,
              custom: ({ values, formControl }) => (
                <IntegratedImageField values={values} formControl={formControl} />
              ),
            },
            {
              construction: {
                name: 'name',
                label: 'Nama',
                placeholder: 'Masukkan Nama...',
                validations: { required: true },
              },
            },
            {
              construction: {
                name: 'email',
                label: 'Email',
                placeholder: 'Masukkan email...',
                validations: { required: true, email: true },
              },
            },
            {
              construction: {
                name: 'phone',
                label: 'No. Telepon',
                placeholder: 'Tambahkan No Telepon...',
                validations: { required: true, min: 10 },
              },
            },
            {
              type: 'custom',
              custom: () => (
                <div className="flex items-center gap-3 mb-2">
                  <ButtonComponent
                    label={showPasswordEdit ? 'Batalkan Ubah Password' : 'Ubah Password'}
                    variant="outline"
                    paint={showPasswordEdit ? 'danger' : 'warning'}
                    size="xs"
                    rounded
                    onClick={() => setShowPasswordEdit((prev) => !prev)}
                  />
                </div>
              ),
            },
            ...(showPasswordEdit
              ? [
                  {
                    type: 'custom',
                    custom: ({ formControl }) => (
                      <InputComponent
                        {...formControl('password')}
                        type="password"
                        name="password"
                        label="Password Baru"
                        placeholder="Masukan password baru..."
                        validations={{ min: 8 }}
                      />
                    ),
                  },
                  {
                    type: 'custom',
                    custom: ({ formControl }) => (
                      <InputComponent
                        {...formControl('password_confirmation')}
                        type="password"
                        name="password_confirmation"
                        label="Konfirmasi Password"
                        placeholder="Ulangi password baru..."
                        validations={{ min: 8 }}
                      />
                    ),
                  },
                ]
              : []),
            {
              type: 'select',
              construction: {
                name: 'role_id',
                label: 'Role Global',
                placeholder: 'Pilih role global..',
                serverOptionControl: { path: 'admin/options/role?isCorporate=0' },
                validations: { required: true },
              },
            },
            // Hapus field image bawaan karena kita sudah pakai custom terpadu di atas
          ],
        }}
        customDetail={(data) => {
          return <UserDetailComponent data={data} />;
        }}
        actionControl={{
          include: (data) => {
            return (
              <>
                <ButtonComponent
                  icon={faHandHoldingHand}
                  label={'Beri Kubus'}
                  variant="outline"
                  paint="secondary"
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setModalGive(true);
                    setSelected(data);
                  }}
                />
              </>
            );
          },
        }}
      />
      <GiveCubeModal
        data={selected}
        panel={'admin'}
        show={modalGive}
        setShow={setModalGive}
      />
    </>
  );
}

ManageUser.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
