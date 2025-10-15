import { faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  FormSupervisionComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import { useGet } from '../../../helpers';
// import { useAccessContext } from '../../../context';

export default function ManageAdsCategories() {
  // const { accessActive, loading } = useAccessContext();
  const [modalIcon, setModalIcon] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [configLoading, codeConfig, dataConfig, resetConfig] = useGet({
    path: 'admin/app-config/2',
  });

  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Kategori Iklan</h1>
      <TableSupervisionComponent
        title="Kategori Iklan"
        fetchControl={{
          path: 'admin/ad-categories',
        }}
        columnControl={{
          custom: [
            {
              selector: 'name',
              label: 'Nama',
              sortable: true,
              width: '250px',
              item: ({ name }) => name,
            },
          ],
        }}
        customTopBarWithForm={({ setModalForm }) => (
          <div className="flex justify-between">
            <ButtonComponent
              label="Tambah Baru"
              icon={faPlus}
              size="sm"
              onClick={() => setModalForm(true)}
            />
            <ButtonComponent
              label="Ubah Icon Lainnya"
              icon={faEdit}
              variant="outline"
              size="sm"
              onClick={() => setModalIcon(true)}
            />
          </div>
        )}
        formControl={{
          contentType: 'multipart/form-data',
          custom: [
            {
              construction: {
                name: 'name',
                label: 'Nama',
                placeholder: 'Masukkan Nama...',
                validations: {
                  required: true,
                },
              },
            },
            // Tambahan: Komunitas (Opsional) — pola sama seperti di Widget
            {
              type: 'select',
              construction: {
                name: 'community_id',
                label: 'Komunitas (Opsional)',
                placeholder: 'Pilih Komunitas..',
                serverOptionControl: {
                  path: 'admin/communities',
                  mapOptions: (data) =>
                    Array.isArray(data)
                      ? data.map((item) => ({ label: item.name, value: item.id }))
                      : [],
                },
              },
            },
            {
              type: 'select',
              construction: {
                // multiple: true, // hapus agar kirim single value
                name: 'parent_id',
                label: 'Kelompok',
                placeholder: 'Pilih Kelompok Kategori..',
                serverOptionControl: {
                  path: 'admin/options/ad-category', // sesuaikan dengan route BE Anda
                },
              },
            },
            {
              col: 4,
              type: 'image',
              construction: {
                name: 'image',
                label: 'Gambar',
              },
            },
            {
              type: 'check',
              construction: {
                // label:"Kategori Utama",
                name: 'is_primary_parent',
                options: [{ label: 'Kategori Utama', value: 1 }],
              },
            },
            {
              type: 'check',
              construction: {
                // label:"Kategori Utama",
                name: 'is_home_display',
                options: [{ label: 'Tampil Di Beranda', value: 1 }],
              },
            },
          ],
        }}
        formUpdateControl={{
          contentType: 'multipart/form-data',
          customDefaultValue: (data) => {
            return {
              name: data?.name,
              parent_id: data?.parent_id || '',
              // Jangan set file image dari URL
              is_primary_parent: data?.is_primary_parent ? 1 : 0,
              is_home_display: data?.is_home_display ? 1 : 0,
              // Tambahan: default value komunitas (opsional)
              community_id: data?.community_id ?? undefined,
            };
          },
        }}
        actionControl={{ except: 'detail' }}
      />

      <FloatingPageComponent
        show={modalIcon}
        onClose={() => setModalIcon(false)}
        title="Ubah Icon Kategori Lainnya"
      >
        <div className="px-6 py-4">
          <FormSupervisionComponent
            submitControl={{
              path: 'admin/app-config/update-other-category',
              contentType: 'multipart/form-data',
            }}
            forms={[
              {
                col: 5,
                type: 'image',
                construction: {
                  name: 'value',
                },
              },
            ]}
            defaultValue={{
              value: dataConfig?.data?.value?.picture_source,
            }}
            onSuccess={() => {
              resetConfig();
              setModalIcon(false);
            }}
          />
        </div>
      </FloatingPageComponent>
    </div>
  );
}

ManageAdsCategories.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
