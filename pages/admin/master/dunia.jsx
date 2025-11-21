import {
  faCubes,
  faNetworkWired,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  SelectComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import InputHexColor from '../../../components/construct.components/input/InputHexColor';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';
import ManageCubePage from '../../../components/construct.components/partial-page/ManageCube.page';
import WorldMemberPage from '../../../components/construct.components/partial-page/WorldMember.page';
import { useUserContext } from '../../../context/user.context';
import { admin_token_cookie_name } from '../../../helpers/api.helpers';
// import { useGet } from '../../../helpers';
// import { useAccessContext } from '../../../context';

export default function ManageWorld() {
  // const { accessActive, loading } = useAccessContext();
  const [selected, setSelected] = useState(null);
  const [modalMember, setModalMember] = useState(false);
  const [modalCube, setModalCube] = useState(false);
  const [modalAfiliation, setModalAfiliation] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    if (Cookies.get(admin_token_cookie_name) && Profile) {
      if (Profile?.role_id != 1) {
        Cookies.remove(admin_token_cookie_name);
        window.location.href = '/admin';
      }
    }
  }, [Profile]);
  // const [worldList, setWorldList] = useState([]);
  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [loadingWorld, codeWorld, dataWorld] = useGet({
  //   path: 'admin/worlds',
  // });

  // useMemo(() => {
  //   if (!loadingWorld) {
  //     let worldList = dataWorld?.data.map((i) => {
  //       return { world_id: i?.id, corporate_id: i?.corporate_id };
  //     });
  //     setWorldList(worldList);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [dataWorld]);

  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Dunia</h1>
      <TableSupervisionComponent
        title="Manajemen Dunia"
        fetchControl={{
          path: 'admin/worlds',
        }}
        columnControl={{
          custom: [
            {
              selector: 'name',
              label: 'Nama',
              sortable: true,
              width: '250px',
              item: ({ name, corporate }) => {
                return (
                  <>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm">{corporate?.name || '-'}</p>
                  </>
                );
              },
            },
            {
              selector: 'description',
              label: 'Deskripsi',
              sortable: true,
              width: '320px',
              item: ({ description }) => description,
            },
            {
              selector: 'color',
              label: 'Warna Branding',
              sortable: true,
              width: '200px',
              item: ({ color }) => {
                return (
                  <div
                    className="h-10 rounded-lg aspect-square"
                    style={{ backgroundColor: color }}
                  ></div>
                );
              },
            },
            {
              selector: 'type',
              label: 'Jenis Dunia',
              sortable: true,
              width: '200px',
              item: ({ type }) =>
                type == 'lock' ? 'Dunia Private' : 'Dunia Public',
            },
          ],
        }}
        formControl={{
          contentType: 'multipart/form-data',
          custom: [
            {
              type: 'select',
              construction: {
                // multiple: true,
                name: 'corporate_id',
                label: 'Mitra',
                placeholder: 'Pilih Mitra..',
                serverOptionControl: {
                  path: 'admin/options/corporate',
                },
              },
            },
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
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                return (
                  <InputHexColor
                    name="color"
                    label="Warna Branding"
                    values={values}
                    setValues={setValues}
                    errors={errors}
                  />
                );
              },
            },
            {
              type: 'textarea',
              construction: {
                name: 'description',
                label: 'Deskripsi',
                placeholder: 'Masukkan Deskripsi...',
                rows: 5,
                validations: {
                  required: true,
                },
              },
            },
            {
              type: 'select',
              construction: {
                name: 'type',
                label: 'Jenis Dunia',
                placeholder: 'Pilih Jenis Dunia..',
                options: [
                  { label: 'Public', value: 'general' },
                  { label: 'Private', value: 'lock' },
                ],
              },
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            return {
              ...data,
            };
          },
        }}
        actionControl={{
          except: 'detail',
          include: (data) => {
            return (
              <>
                <ButtonComponent
                  icon={faUsers}
                  label={'Member'}
                  variant="outline"
                  paint="primary"
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setSelected(data);
                    setModalMember(true);
                  }}
                />
                <ButtonComponent
                  icon={faCubes}
                  label={'Kubus'}
                  variant="outline"
                  paint="secondary"
                  size={'sm'}
                  rounded
                  onClick={() => {
                    setSelected(data);
                    setModalCube(true);
                  }}
                />
                <ButtonComponent
                  icon={faNetworkWired}
                  label={'Afiliasi'}
                  variant="outline"
                  paint="success"
                  size={'sm'}
                  rounded
                  onClick={() => {
                    setSelected(data);
                    setModalAfiliation(true);
                  }}
                />
              </>
            );
          },
        }}
      />

      <FloatingPageComponent
        show={modalMember}
        onClose={() => {
          setModalMember(false);
          setSelected(false);
          setRefresh(!refresh);
        }}
        size="xl"
        className="bg-background"
      >
        <div className="px-8">
          <WorldMemberPage panel={'admin'} data={selected} />
        </div>
      </FloatingPageComponent>

      <FloatingPageComponent
        show={modalCube}
        onClose={() => {
          setModalCube(false);
          setSelected(false);
          setRefresh(!refresh);
        }}
        size="xl"
        className="bg-background"
      >
        <div className="px-8">
          {modalCube && (
            <ManageCubePage
              scope={{ world_id: selected?.id }}
              panel={'admin'}
              title={`Dunia ` + selected?.name}
            />
          )}
        </div>
      </FloatingPageComponent>

      <FloatingPageComponent
        show={modalAfiliation}
        onClose={() => {
          setModalAfiliation(false);
          setSelected(false);
          setRefresh(!refresh);
        }}
        size="xl"
        className="bg-background"
      >
        <div className="px-8">
          {selected?.id && (
            <TableSupervisionComponent
              title={`Afiliasi ` + selected?.name}
              fetchControl={{
                path: 'admin/world-affiliates',
              }}
              includeFilters={[
                {
                  column: 'world_id',
                  type: 'equal',
                  value: selected.id,
                },
              ]}
              columnControl={{
                custom: [
                  {
                    selector: 'world',
                    label: 'Dunia',
                    sortable: true,
                    width: '250px',
                    item: ({ world }) => (
                      <>
                        <b className="text-xl">{world?.name || ''}</b>
                      </>
                    ),
                  },
                  {
                    selector: 'corporate',
                    label: 'Mitra',
                    sortable: true,
                    width: '250px',
                    item: ({ corporate }) => corporate?.name || '',
                  },
                ],
              }}
              formControl={{
                contentType: 'multipart/form-data',
                custom: [
                  {
                    type: 'custom',
                    custom: ({ values, setValues, errors }) => (
                      <SelectComponent
                        name="corporate_id"
                        label="Afiliasi"
                        placeholder="Pilih Mitra..."
                        serverOptionControl={{
                          path: 'admin/options/corporate',
                        }}
                        onChange={(e) =>
                          setValues([
                            ...values.filter(
                              (i) =>
                                i.name != 'world_id' && i.name != 'corporate_id'
                            ),
                            {
                              name: 'corporate_id',
                              value: e,
                            },
                            {
                              name: 'world_id',
                              value: selected?.id,
                            },
                          ])
                        }
                        error={
                          errors.find((err) => err.name == 'corporate_id')
                            ?.error
                        }
                        value={
                          values.find((val) => val.name == 'corporate_id')
                            ?.value
                        }
                      />
                    ),
                  },
                ],
              }}
              // formUpdateControl={{
              //   customDefaultValue: (data) => {
              //     return {
              //       name: data?.name,
              //       parent_id: data?.parent_id,
              //     };
              //   },
              // }}
              actionControl={{ except: 'detail' }}
            />
          )}
        </div>
      </FloatingPageComponent>
    </div>
  );
}

ManageWorld.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
