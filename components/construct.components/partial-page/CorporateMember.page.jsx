import React, { useRef, useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  FormSupervisionComponent,
  InputComponent,
  ModalConfirmComponent,
  TableSupervisionComponent,
} from '../../base.components';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import UserDetailComponent from './UserDetail.component';

const CorporateMemberPage = ({ data }) => {
  const [modalForm, setModalForm] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const inputEmail = useRef(null);

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
        title={`User ${data?.name}`}
        fetchControl={{
          path: `admin/corporates/${data?.id}/user`,
        }}
        updateEndpoint="/update-role"
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
              item: ({ user }) => {
                return (
                  <>
                    <p className={!user ? 'text-danger font-bold' : ''}>
                      {user ? user?.name : 'User telah dihapus!'}
                    </p>
                  </>
                );
              },
            },
            {
              selector: 'email',
              label: 'Email',
              sortable: true,
              width: '320px',
              item: ({ user }) => user?.email,
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
        formUpdateControl={{
          customDefaultValue: (data) => {
            return {
              corporate_role_id: data?.role?.id, // ✅ BENAR! Hanya role corporate
            };
          },
          custom: [
            {
              type: 'select',
              construction: {
                // multiple: true,
                name: 'corporate_role_id', // ✅ BENAR! Hanya role corporate
                label: 'Role (Mitra)',
                placeholder: 'Pilih role..',
                validations: {
                  required: true,
                },
                serverOptionControl: {
                  path: 'admin/options/role?isCorporate=true',
                },
              },
            },
          ],
        }}
        customDetail={(data) => {
          return (
            <UserDetailComponent
              data={data?.user}
              customRole={data?.role?.name}
            />
          );
        }}
      // actionControl={{ except: 'edit' }}
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
            defaultValue={isNew ? { email: inputEmail.current, corporate_role_id: 4 } : { corporate_role_id: 4 }}
            submitControl={{
              path: isNew
                ? `admin/corporates/${data?.id}/user-new`
                : `admin/corporates/${data?.id}/user`,
              contentType: !isNew ? 'application/json' : 'multipart/form-data',
            }}
            onError={() => {
              !isNew && setConfirmNew(true);
            }}
            onSuccess={() => {
              setModalForm(false);
              setRefresh(!refresh);
              setIsNew(false);
              inputEmail.current = null;
            }}
          />
        </div>
      </FloatingPageComponent>
    </>
  );
};

export default CorporateMemberPage;
