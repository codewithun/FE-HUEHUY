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
import { token_cookie_name } from '../../../helpers';
import { resolveUserImageUrl } from '../../../helpers/image.helpers';

export default function ManageUser() {
  const [selected, setSelected] = useState(null);
  const [modalGive, setModalGive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { profile: Profile } = useUserContext();

  // Use shared resolver to support Google URLs and storage paths

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (Profile?.role_id != 1) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/admin';
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
              construction: {
                name: 'email',
                label: 'Email',
                placeholder: 'Masukkan email...',
                validations: {
                  required: true,
                  email: true,
                },
              },
            },
            {
              construction: {
                name: 'phone',
                label: 'No. Telepon',
                placeholder: 'Tambahkan No Telepon...',
                validations: {
                  required: true,
                  min: 10,
                },
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                return (
                  <InputComponent
                    {...formControl('password')}
                    type="password"
                    name="password"
                    label="password"
                    placeholder="Masukan password..."
                    validations={{ required: true, min: 8 }}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                return (
                  <InputComponent
                    {...formControl('password_confirmation')}
                    type="password"
                    name="password_confirmation"
                    label="password"
                    placeholder="Masukan ulang password..."
                    validations={{ required: true, min: 8 }}
                  />
                );
              },
            },
            {
              type: 'select',
              construction: {
                name: 'role_id',
                label: 'Role Global',
                placeholder: 'Pilih role global..',
                serverOptionControl: {
                  path: 'admin/options/role?isCorporate=0',
                },
              },
            },
            {
              type: 'image',
              col: 3,
              construction: {
                name: 'image',
                label: 'Foto Profil',
              },
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            return {
              name: data?.name,
              email: data?.email,
              phone: data?.phone,
              // role_id ikut diubah dalam form ini; default mungkin tidak terisi jika API list belum mengirim id
              role_id: data?.role_id || data?.role?.id || '',
              image: resolveUserImageUrl(data),
            };
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
              construction: {
                name: 'email',
                label: 'Email',
                placeholder: 'Masukkan email...',
                validations: {
                  required: true,
                  email: true,
                },
              },
            },
            {
              construction: {
                name: 'phone',
                label: 'No. Telepon',
                placeholder: 'Tambahkan No Telepon...',
                validations: {
                  required: true,
                  min: 10,
                },
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                return (
                  <InputComponent
                    {...formControl('password')}
                    type="password"
                    name="password"
                    label="password"
                    placeholder="Masukan password..."
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => {
                return (
                  <InputComponent
                    {...formControl('password_confirmation')}
                    type="password"
                    name="password_confirmation"
                    label="password"
                    placeholder="Masukan ulang password..."
                  />
                );
              },
            },
            {
              type: 'select',
              construction: {
                name: 'role_id',
                label: 'Role Global',
                placeholder: 'Pilih role global..',
                serverOptionControl: {
                  path: 'admin/options/role?isCorporate=0',
                },
                validations: { required: true },
              },
            },
            {
              type: 'image',
              col: 3,
              construction: {
                name: 'image',
                label: 'Foto Profil',
              },
            },
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
