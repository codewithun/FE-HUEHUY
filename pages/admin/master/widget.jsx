import {
    faArrowDown,
    faArrowUp,
    faEdit,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import {
    ButtonComponent,
    IconButtonComponent,
    ModalConfirmComponent,
    SelectComponent,
    TableSupervisionComponent,
} from '../../../components/base.components';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import { post } from '../../../helpers';

export default function Widget() {
  const [updateStatus, setUpdateStatus] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loadingUpdateStatus, setLoadingUpdateStatus] = useState(false);
  const [type, setType] = useState('home');
  const [worldId, setWorldId] = useState(null);

  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Widget</h1>
      <TableSupervisionComponent
        title="Widget"
        fetchControl={{
          path: 'admin/dynamic-content',
          includeParams: {
            world_id: (type == 'hunting' && worldId) || '',
          },
        }}
        setToRefresh={refresh}
        customTopBarWithForm={({ setModalForm }) => (
          <>
            <div className="flex justify-between">
              <div className="flex gap-2">
                <ButtonComponent
                  label="Beranda Utama"
                  size="sm"
                  variant={type == 'home' ? 'solid' : 'outline'}
                  onClick={() => setType('home')}
                />
                <ButtonComponent
                  label="Beranda Promo"
                  size="sm"
                  variant={type == 'hunting' ? 'solid' : 'outline'}
                  onClick={() => setType('hunting')}
                />
                <ButtonComponent
                  label="Beranda Komunitas"
                  size="sm"
                  variant={type == 'information' ? 'solid' : 'outline'}
                  onClick={() => setType('information')}
                />
              </div>
              <div>
                <ButtonComponent
                  label="Tambah Baru"
                  size="sm"
                  onClick={() => setModalForm(true)}
                />
              </div>
            </div>
          </>
        )}
        headBar={
          <div>
            {type == 'hunting' ? (
              <SelectComponent
                placeholder="Filter Dunia"
                serverOptionControl={{
                  path: 'admin/options/world',
                }}
                value={worldId}
                onChange={(e) => setWorldId(e)}
              />
            ) : (
              ''
            )}
          </div>
        }
        includeFilters={[
          {
            column: 'type',
            type: 'equal',
            value: type,
          },
        ]}
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
              selector: 'type',
              label: 'Halaman',
              sortable: true,
              width: '150px',
              item: ({ type }) => (type == 'home' ? 'Beranda' : 'Berburu'),
            },
            {
              selector: 'status',
              label: 'Halaman',
              sortable: true,
              width: '150px',
              item: ({ is_active }) =>
                is_active ? (
                  <span className="uppercase font-medium text-green-600 py-1 px-2.5 rounded-md text-sm bg-green-100">
                    Aktif
                  </span>
                ) : (
                  <span className="uppercase font-medium text-red-600 py-1 px-2.5 rounded-md text-sm bg-red-100">
                    Tidak Aktif
                  </span>
                ),
            },
          ],
        }}
        formControl={{
          customDefaultValue: {
            type: type,
          },
          custom: [
            {
              construction: {
                name: 'name',
                label: 'Nama',
                placeholder: 'Masukkan nama...',
              },
            },
            {
              construction: {
                name: 'description',
                label: 'Deskripsi',
                placeholder: 'Masukkan deskripsi singkat...',
              },
            },
            {
              type: 'select',
              construction: {
                name: 'world_id',
                label: 'Dunia (Opsional)',
                placeholder: 'Pilih dunia...',
                serverOptionControl: {
                  path: 'admin/options/world',
                },
              },
            },
            {
              type: 'select',
              construction: {
                name: 'content_type',
                label: 'Jenis Konten',
                placeholder: 'Pilih jenis tampilan konten...',
                options: [
                  {
                    label: 'Kotak Kategori',
                    value: 'category',
                  },
                  {
                    label: 'Terdekat',
                    value: 'nearby',
                  },
                  {
                    label: 'Kategori Iklan',
                    value: 'ad_category',
                  },
                  {
                    label: 'Rekomendasi',
                    value: 'recommendation',
                  },
                  {
                    label: 'Daftar Menyamping',
                    value: 'vertical',
                  },
                  {
                    label: 'Daftar Kebawah',
                    value: 'horizontal',
                  },
                ],
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const content_type = values.find(
                  (val) => val.name == 'content_type'
                )?.value;

                if (content_type == 'vertical' || content_type == 'horizontal')
                  return (
                    <SelectComponent
                      name="source_type"
                      {...formControl('source_type')}
                      label="Sumber Konten"
                      placeholder="Pilih sumber konten..."
                      options={[
                        {
                          label: 'Kubus Acak',
                          value: 'shuffle_cube',
                        },
                        {
                          label: 'Kubus Pilihan',
                          value: 'cube',
                        },
                        {
                          label: 'Iklan Huehuy',
                          value: 'ad',
                        },
                      ]}
                    />
                  );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const source_type = values.find(
                  (val) => val.name == 'source_type'
                )?.value;

                if (source_type == 'cube')
                  return (
                    <SelectComponent
                      name="dynamic_content_cubes"
                      {...formControl('dynamic_content_cubes')}
                      label="Kubus"
                      placeholder="Pilih kubus..."
                      serverOptionControl={{
                        path: 'admin/options/cube',
                      }}
                      searchable
                      multiple
                    />
                  );
              },
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            return {
              ...data,
              world_id: data.world_id || '',
              source_type: data.source_type || '',
              dynamic_content_cubes: data?.dynamic_content_cubes?.map(
                (item) => item.cube_id
              ),
            };
          },
        }}
        actionControl={{
          except: ['detail'],
          custom: (
            data,
            { setModalForm, setModalDelete, setDataSelected },
            hasPermission,
            length
          ) => {
            return (
              <>
                <IconButtonComponent
                  icon={faArrowUp}
                  size="sm"
                  variant="outline"
                  disabled={data.level <= 1}
                  onClick={async () => {
                    const execute = await post({
                      path: 'admin/dynamic-content/' + data?.id,
                      body: {
                        _method: 'PUT',
                        level: data.level - 1,
                      },
                    });

                    if (execute.status == 200) {
                      setRefresh(!refresh);
                    }
                  }}
                />
                <IconButtonComponent
                  icon={faArrowDown}
                  size="sm"
                  variant="outline"
                  disabled={data.level >= length}
                  onClick={async () => {
                    const execute = await post({
                      path: 'admin/dynamic-content/' + data?.id,
                      body: {
                        _method: 'PUT',
                        level: data.level + 1,
                      },
                    });

                    if (execute.status == 200) {
                      setRefresh(!refresh);
                    }
                  }}
                />
                <IconButtonComponent
                  icon={faEdit}
                  size="sm"
                  variant="outline"
                  paint="warning"
                  onClick={async () => {
                    setDataSelected();
                    setModalForm(true);
                  }}
                />
                <ButtonComponent
                  label={data?.is_active ? 'Non-Aktifkan' : 'Aktifkan'}
                  variant="outline"
                  paint={data?.is_active ? 'danger' : 'success'}
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setSelected(data);
                    setUpdateStatus(!data?.is_active ? 'active' : 'non-active');
                  }}
                />
                <IconButtonComponent
                  icon={faTrash}
                  size="sm"
                  variant="outline"
                  paint="danger"
                  onClick={async () => {
                    setDataSelected();
                    setModalDelete(true);
                  }}
                />
              </>
            );
          },
        }}
      />

      <ModalConfirmComponent
        title={
          'Yakin Ingin ' + updateStatus == 'active'
            ? 'Mengaktifkan Widget'
            : 'Nonaktifkan Widget'
        }
        show={updateStatus}
        onClose={() => {
          setUpdateStatus(false);
          setSelected(null);
        }}
        onSubmit={async () => {
          setLoadingUpdateStatus(true);

          if (selected !== null) {
            let response = await post({
              path: 'admin/dynamic-content/' + selected?.id,
              body: {
                _method: 'PUT',
                is_active: updateStatus == 'active' ? 1 : 0,
              },
            });

            if (response?.status == 200 || response?.status == 201) {
              setLoadingUpdateStatus(false);
              setRefresh(!refresh);
              setSelected(null);
              setUpdateStatus(false);
            } else {
              setLoadingUpdateStatus(false);
            }
          }
        }}
        submitButton={{
          label: 'Ya',
          loading: loadingUpdateStatus,
        }}
      />
    </div>
  );
}

Widget.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
