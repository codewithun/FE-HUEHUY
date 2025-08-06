import React, { useEffect, useRef, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  FormSupervisionComponent,
  InputComponent,
  ModalConfirmComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
import { CorporateLayout } from '../../../components/construct.components/layout/Corporate.layout';
import UserDetailComponent from '../../../components/construct.components/partial-page/UserDetail.component';
import { useUserContext } from '../../../context/user.context';
// import { useAccessContext } from '../../../context';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../helpers';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
export default function CManageUser({ token }) {
  const [modalForm, setModalForm] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const inputEmail = useRef(null);
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (!Profile?.corporate_user?.corporate_id) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/corporate';
      }
    }
  }, [Profile]);

  const role = Profile?.corporate_user?.role?.id;

  const formAddByEmail = [
    {
      type: 'custom',
      custom: ({ values, setValues, errors }) => {
        return (
          <InputComponent
            name="email"
            label="email"
            placeholder="Masukan email..."
            validations={{ required: true, email: true }}
            onChange={(e) => {
              inputEmail.current = e;
              setValues([
                ...values.filter((i) => i.name != 'email'),
                { name: 'email', value: e },
              ]);
            }}
            value={
              values.find((i) => i.name == 'email')?.value
                ? values.find((i) => i.name == 'email')?.value
                : ''
            }
            errors={errors.filter((i) => i.name == 'email')?.error}
          />
        );
      },
    },
    {
      type: 'select',
      construction: {
        // multiple: true,
        name: 'role_id',
        label: 'Role (Mitra)',
        placeholder: 'Pilih role..',
        validations: {
          required: true,
        },
        serverOptionControl: {
          path: 'corporate/options/role?isCorporate=true',
        },
      },
    },
  ];

  const formAddNewUser = [
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
          <InputComponent
            name="email"
            label="email"
            placeholder="Masukan email..."
            validations={{ required: true, email: true }}
            onChange={(e) => {
              setValues([
                ...values.filter((i) => i.name != 'email'),
                { name: 'email', value: e },
              ]);
            }}
            value={
              values.find((i) => i.name == 'email')?.value
                ? values.find((i) => i.name == 'email')?.value
                : ''
            }
            errors={errors.filter((i) => i.name == 'email')?.error}
          />
        );
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
          path: 'corporate/options/role?isCorporate=true',
          bearer: token || null,
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
  ];

  return (
    <>
      <TableSupervisionComponent
        title={`Admin`}
        fetchControl={{
          path: `corporate/users`,
          bearer: token || null,
        }}
        // updateEndpoint="/update-role"
        setToRefresh={refresh}
        customTopBar={
          <>
            <div className="flex justify-between items-center">
              <ButtonComponent
                label="Tambah Baru"
                icon={faPlus}
                size="sm"
                onClick={() => setModalForm(true)}
              />
            </div>
          </>
        }
        columnControl={{
          custom: [
            {
              selector: 'name',
              label: 'Nama',
              sortable: true,
              width: '250px',
              item: ({ name }) => {
                return (
                  <>
                    {name}
                    {/* <p className={!user ? 'text-danger font-bold' : ''}>
                      {user ? user?.name : 'User telah dihapus!'}
                    </p> */}
                  </>
                );
              },
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
              item: ({ corporate_user }) => corporate_user?.role?.name,
            },
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            return {
              role_id: data?.corporate_user?.role?.id,
            };
          },
          custom: [
            {
              type: 'select',
              construction: {
                // multiple: true,
                name: 'role_id',
                label: 'Role (Mitra)',
                placeholder: 'Pilih role..',
                validations: {
                  required: true,
                },
                serverOptionControl: {
                  path: 'corporate/options/role?isCorporate=true',
                  bearer: token || null,
                },
              },
            },
          ],
        }}
        customDetail={(data) => {
          return <UserDetailComponent data={data} />;
        }}
        actionControl={{
          except: role == 5 ? ['detail', 'edit', 'delete'] : null,
          //
        }}
      />

      <FloatingPageComponent
        show={modalForm}
        title={isNew ? 'Daftarkan User Baru' : `Tambah User`}
        onClose={() => {
          setModalForm(false);
          setIsNew(false);
          // setRefresh(!refresh);
          inputEmail.current = null;
        }}
      >
        <ModalConfirmComponent
          show={confirmNew}
          title="Email belum terdaftar, Daftarkan user baru?"
          onClose={() => {
            setConfirmNew(false);
          }}
          onSubmit={() => {
            setIsNew(true);
            setConfirmNew(false);
          }}
        />

        <div className="px-6 pt-4 pb-20 h-full overflow-scroll scroll_control">
          <FormSupervisionComponent
            forms={isNew ? formAddNewUser : formAddByEmail}
            defaultValue={isNew && { email: inputEmail.current }}
            submitControl={{
              path: isNew ? `corporate/users-new` : `corporate/users`,
              contentType: !isNew ? 'application/json' : 'multipart/form-data',
              bearer: token || null,
            }}
            onError={() => {
              !isNew && setConfirmNew(true);
            }}
            onSuccess={() => {
              setModalForm(false);
              setRefresh(!refresh);
              inputEmail.current = null;
            }}
          />
        </div>
      </FloatingPageComponent>
    </>
  );
}

CManageUser.getLayout = function getLayout(page) {
  return <CorporateLayout>{page}</CorporateLayout>;
};
