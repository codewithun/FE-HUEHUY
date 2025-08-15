import { faHandHoldingHand } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
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
// import { useAccessContext } from '../../../context';
export default function ManageUser() {
  // const { accessActive, loading } = useAccessContext();
  const [selected, setSelected] = useState(null);
  const [modalGive, setModalGive] = useState(false);
  const { profile: Profile } = useUserContext();

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
              label: 'Role',
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
                label: 'No. Telepon (Opsional)',
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
                // multiple: true,
                name: 'role_id',
                label: 'Role',
                placeholder: 'Pilih role..',
                serverOptionControl: {
                  path: 'admin/options/role?isCorporate=',
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
              role_id: data?.role_id,
              image: data?.picture_source,
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
                label: 'No. Telepon (Opsional)',
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
                    // validations={{ required: true, min: 8 }}
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
                    // validations={{ required: true, min: 8 }}
                  />
                );
              },
            },
            {
              type: 'select',
              construction: {
                // multiple: true,
                name: 'role_id',
                label: 'Role',
                placeholder: 'Pilih role..',
                serverOptionControl: {
                  path: 'admin/options/role?isCorporate=',
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
