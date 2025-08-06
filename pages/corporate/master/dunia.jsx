import {
  ButtonComponent,
  FloatingPageComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import InputHexColor from '../../../components/construct.components/input/InputHexColor';
import { faCubes, faEdit, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import WorldMemberPage from '../../../components/construct.components/partial-page/WorldMember.page';
import { CorporateLayout } from '../../../components/construct.components/layout/Corporate.layout';
import ManageCubePage from '../../../components/construct.components/partial-page/ManageCube.page';
import { useUserContext } from '../../../context/user.context';
// import { useAccessContext } from '../../../context';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../helpers';

export default function CManageWorld({ token, scope }) {
  // const { accessActive, loading } = useAccessContext();
  const { profile: Profile } = useUserContext();
  const [selected, setSelected] = useState(null);
  const [modalMember, setModalMember] = useState(false);
  const [modalCube, setModalCube] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (!Profile?.corporate_user?.corporate_id) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/corporate';
      }
    }
  }, [Profile]);
  const role = Profile?.corporate_user?.role?.id;
  // console.log(role);
  return (
    <>
      <TableSupervisionComponent
        title="Manajemen Dunia"
        fetchControl={{
          path: 'corporate/worlds',
          bearer: token || null,
        }}
        customTopBar={role == 5 ? <></> : null}
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
              selector: 'type',
              label: 'Jenis dunia',
              sortable: true,
              width: '200px',
              item: ({ corporate_id }) =>
                corporate_id ==
                (scope?.corporate_id ||
                  Profile?.corporate_user?.corporate_id) ? (
                  <span className="uppercase border border-green-600 font-medium text-green-600 py-1 px-2.5 rounded-md text-sm bg-green-100">
                    Pribadi
                  </span>
                ) : (
                  <span className="uppercase border border-sky-600 font-medium text-sky-600 py-1 px-2.5 rounded-md text-sm bg-sky-100">
                    Afiliasi
                  </span>
                ),
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
              width: '150px',
              item: ({ color }) => {
                return (
                  <div
                    className="h-10 rounded-lg aspect-square"
                    style={{ backgroundColor: color }}
                  ></div>
                );
              },
            },
          ],
        }}
        formControl={{
          customDefaultValue: {
            corporate_id:
              scope?.corporate_id || Profile?.corporate_user?.corporate_id,
          },
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
          except: ['detail', 'delete', 'edit'],
          include: (data, { setDataSelected, setModalForm }) => {
            return (
              <>
                {data?.corporate_id ==
                (scope?.corporate_id ||
                  Profile?.corporate_user?.corporate_id) ? (
                  <>
                    {role != 5 ? (
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
                    ) : null}
                    {role != 5 ? (
                      <ButtonComponent
                        icon={faEdit}
                        label={'Ubah'}
                        variant="outline"
                        paint="warning"
                        size={'sm'}
                        rounded
                        onClick={() => {
                          setDataSelected();
                          setModalForm(true);
                        }}
                      />
                    ) : null}
                  </>
                ) : null}
                {role != 5 ? (
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
                ) : null}
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
          <WorldMemberPage
            panel={'corporate'}
            data={selected}
            scope={scope}
            token={token}
          />
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
          <ManageCubePage
            scope={{ world_id: selected?.id }}
            panel={'corporate'}
            corpId={
              scope?.corporate_id || Profile?.corporate_user?.corporate_id
            }
            title={'Dunia ' + selected?.name}
            token={token}
          />
        </div>
      </FloatingPageComponent>
    </>
  );
}

CManageWorld.getLayout = function getLayout(page) {
  return <CorporateLayout>{page}</CorporateLayout>;
};
