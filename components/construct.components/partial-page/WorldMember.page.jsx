import React, { useRef, useState } from 'react';
import {
  FloatingPageComponent,
  FormSupervisionComponent,
  InputComponent,
  ModalConfirmComponent,
  // SelectComponent,
  TableSupervisionComponent,
} from '../../base.components';
import UserDetailComponent from './UserDetail.component';

const WorldMemberPage = ({ data, panel, token }) => {
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
            name="password_confirmation"
            label="password"
            placeholder="Masukan ulang password..."
            validations={{ required: true, min: 8 }}
          />
        );
      },
    },
    // {
    //   type: 'select',
    //   construction: {
    //     // multiple: true,
    //     name: 'role_id',
    //     label: 'Role',
    //     placeholder: 'Pilih role..',
    //     serverOptionControl: {
    //       path: 'admin/options/role',
    //     },
    //   },
    // },
    // {
    //   type: 'custom',
    //   custom: ({ formControl }) => {
    //     return (
    //       <SelectComponent
    //         name="role_id"
    //         label="Role"
    //         placeholder="Pilih role..."
    //         options={
    //           panel == 'admin'
    //             ? [
    //                 { label: 'Admin', value: 1 },
    //                 { label: 'User', value: 2 },
    //               ]
    //             : [{ label: 'User', value: 2 }]
    //         }
    //         {...formControl('role_id')}
    //       />
    //     );
    //   },
    // },
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
        title={`Member Dunia ${data?.name}`}
        fetchControl={{
          path: `${panel ? panel : 'admin'}/worlds/${data?.id}/user`,
          bearer: token || null,
        }}
        setToRefresh={refresh}
        defaultValue={{ role_id: 2 }}
        // customTopBar={
        //   <>
        //     <div className="flex justify-between items-center">
        //       <ButtonComponent
        //         label="Tambah Baru"
        //         icon={faPlus}
        //         size="sm"
        //         onClick={() => setModalForm(true)}
        //       />
        //     </div>
        //   </>
        // }
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
              item: ({ user }) => user?.role?.name,
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
        formControl={{
          contentType: 'multipart/form-data',
          custom: [
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
          ],
        }}
        actionControl={{
          except: 'edit',
          // include: (data) => {
          //   return (
          //     <>
          //       <ButtonComponent
          //         icon={faHandHoldingHand}
          //         label={'Beri Kubus'}
          //         variant="outline"
          //         paint="secondary"
          //         size={'xs'}
          //         rounded
          //         onClick={() => {
          //           setModalGive(true);
          //           setSelected(data);
          //         }}
          //       />
          //     </>
          //   );
          // },
        }}
      />
      {/* <GiveCubeModal
        data={selected}
        panel={'corporate'}
        show={modalGive}
        setShow={setModalGive}
        scope={{
          corporate_id:
            scope?.corporate_id || Profile?.corporate_user?.corporate_id,
        }}
        token={token}
      /> */}
      <FloatingPageComponent
        show={modalForm}
        title={isNew ? 'Daftarkan Member Baru' : `Tambah Member`}
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
            defaultValue={isNew && { email: inputEmail.current, role_id: 2 }}
            submitControl={{
              path: isNew
                ? `${panel ? panel : 'admin'}/worlds/${data?.id}/user-new`
                : `${panel ? panel : 'admin'}/worlds/${data?.id}/user`,
              contentType: !isNew ? 'application/json' : 'multipart/form-data',
              bearer: token || null,
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

export default WorldMemberPage;
