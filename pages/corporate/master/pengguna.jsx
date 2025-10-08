/* eslint-disable no-console */
import { faBuilding, faTrash } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import {
  ButtonComponent,
  InputComponent,
  TableSupervisionComponent
} from '../../../components/base.components';
import { CorporateLayout } from '../../../components/construct.components/layout/Corporate.layout';
import UserDetailComponent from '../../../components/construct.components/partial-page/UserDetail.component';
import { useUserContext } from '../../../context/user.context';
import { token_cookie_name } from '../../../helpers';

export default function CorporateManageUser() {
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      const isCorporateRole = [3, 4, 5].includes(Profile?.role_id);
      if (!isCorporateRole) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/corporate';
      }
    }
  }, [Profile]);

  // Handle corporate assignment
  const handleAssignCorporate = (data) => {
    console.log('Assign corporate to user:', data);
    // Implementation would go here
  };

  // Handle corporate removal
  const handleRemoveCorporate = (data) => {
    console.log('Remove corporate from user:', data);
    // Implementation would go here
  };

  return (
    <>
      <TableSupervisionComponent
        title="Tim Mitra"
        fetchControl={{
          path: 'corporate/users',
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
              label: 'Role Global', // ✅ Hanya menampilkan role sistem
              width: '180px',
              item: ({ role }) => role?.name,
            },
            {
              selector: 'corporate_user', 
              label: 'Corporate Assignment', // ✅ Info corporate terpisah
              width: '250px',
              item: ({ corporate_user }) => 
                corporate_user 
                  ? `${corporate_user.corporate_name} (${corporate_user.corporate_role_name})` 
                  : '- Tidak di Corporate -',
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
                  required: false,
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
                    label="password confirmation"
                    placeholder="Masukan ulang password..."
                    validations={{ required: true, min: 8 }}
                  />
                );
              },
            },
            // ✅ HANYA corporate_role_id untuk Corporate form
            {
              type: 'select', 
              construction: {
                name: 'corporate_role_id', // ✅ BENAR! Hanya role corporate
                label: 'Role di Corporate',
                placeholder: 'Pilih role corporate..',
                serverOptionControl: {
                  path: 'corporate/options/role?isCorporate=1', // ✅ BENAR endpoint corporate
                },
                validations: { required: true }
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
              // ❌ JANGAN include role_id dan corporate_role_id di update form
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
                  required: false,
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
                {/* Existing Beri Kubus button */}
                {/* <ButtonComponent
                  icon={faHandHoldingHand}
                  label={'Beri Kubus'}
                  variant="outline"
                  paint="secondary"
                  size={'xs'}
                  rounded
                  onClick={() => handleGiveCube(data)}
                /> */}
                
                {/* New Corporate Management */}
                {!data.corporate_user ? (
                  <ButtonComponent
                    icon={faBuilding}
                    label={'Assign Corporate'}
                    variant="outline"
                    paint="primary"
                    size={'xs'}
                    rounded
                    onClick={() => handleAssignCorporate(data)}
                  />
                ) : (
                  <ButtonComponent
                    icon={faTrash}
                    label={'Remove Corporate'}
                    variant="outline"
                    paint="danger"
                    size={'xs'}
                    rounded
                    onClick={() => handleRemoveCorporate(data)}
                  />
                )}
              </>
            );
          },
        }}
      />
    </>
  );
}

CorporateManageUser.getLayout = function getLayout(page) {
  return <CorporateLayout>{page}</CorporateLayout>;
};
