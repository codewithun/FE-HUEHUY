import React, { useState } from 'react';
import {
  ButtonComponent,
  FloatingPageComponent,
  FormSupervisionComponent,
  IconButtonComponent,
  InputComponent,
} from '../../components/base.components';
import {
  faArrowLeftLong,
  faEdit,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { useGet } from '../../helpers';
import { useRouter } from 'next/router';
import InputImageComponent from '../../components/base.components/input/InputImage.component';

export default function InformasiAkun() {
  const router = useRouter();
  const [edit, setEdit] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data, refresh] = useGet({
    path: `account`,
  });

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
          <div className="flex justify-between items-center gap-2 p-2 sticky top-0 z-30 bg-white bg-opacity-40 backdrop-blur-sm border-b ">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={() => router.back()}
              />
            </div>
            <div className="font-semibold w-full text-lg">Informasi Akun</div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="py-4 px-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">Nama</p>
              <p>{data?.data?.profile?.name}</p>
            </div>
            <div className="py-4 px-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">Email</p>
              <p>{data?.data?.profile?.email}</p>
            </div>
            <div className="py-4 px-4 flex justify-between items-center border-b border-b-gray-300">
              <p className="font-medium">No Hp/WA</p>
              <p>{data?.data?.profile?.phone}</p>
            </div>
            <div className="mt-10 px-4 flex flex-col gap-4">
              <ButtonComponent
                label="Ubah Profile"
                icon={faEdit}
                paint="warning"
                variant="outline"
                onClick={() => setEdit('profil')}
                block
                size="lg"
              />
              <ButtonComponent
                label="Ganti Password"
                icon={faLock}
                paint="danger"
                variant="outline"
                onClick={() => setEdit('password')}
                block
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
      <FloatingPageComponent
        title={edit == 'profil' ? 'Ubah Profile' : 'Ubah Password'}
        show={edit}
        onClose={() => setEdit(false)}
      >
        <div className="p-6">
          <FormSupervisionComponent
            submitControl={{
              path:
                edit == 'profil' ? 'auth/edit-profile' : 'auth/change-password',
              contentType: 'multipart/form-data',
            }}
            defaultValue={
              edit == 'profil' && {
                name: data?.data?.profile?.name,
                phone: data?.data?.profile?.phone,
                image: data?.data?.profile?.picture_source,
              }
            }
            onSuccess={() => {
              refresh();
              setTimeout(() => {
                setEdit(false);
              }, 1500);
            }}
            forms={
              edit == 'profil'
                ? [
                  {
                    type: 'custom',
                    custom: () => {
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          class="h-44 aspect-square rounded-full border-4 border-slate-300 dark:border-gray-800 mx-auto my-4 object-cover"
                          src={
                            data?.data?.profile?.picture_source
                              ? data?.data?.profile?.picture_source
                              : '/default-avatar.png'
                          }
                          alt="Foto Profil"
                        />
                      );
                    },
                  },
                  {
                    construction: {
                      name: 'name',
                      label: 'Nama',
                      validations: { requred: true },
                    },
                  },
                  {
                    construction: {
                      name: 'phone',
                      label: 'No Hp/WA',
                      validations: { min: 10 },
                    },
                  },

                  {
                    type: 'custom',
                    custom: ({ formControl }) => (
                      <>
                        <label className="mb-2">Foto Profil Baru</label>
                        <div className="pt-4 px-12">
                          <InputImageComponent
                            name="image"
                            label=""
                            {...formControl('image')}
                          />
                        </div>
                      </>
                    ),
                  },
                ]
                : [
                  {
                    type: 'custom',
                    custom: ({ formControl }) => {
                      return (
                        <InputComponent
                          type="password"
                          name="old_password"
                          label="Kata Sandi"
                          size="lg"
                          placeholder="kata sandi saat ini..."
                          {...formControl('old_password')}
                        />
                      );
                    },
                  },
                  {
                    type: 'custom',
                    custom: ({ formControl }) => {
                      return (
                        <div className="mt-4">
                          <InputComponent
                            type="password"
                            name="password"
                            label="Kata Sandi Baru"
                            size="lg"
                            placeholder="kata sandi baru..."
                            {...formControl('password')}
                          />
                        </div>
                      );
                    },
                  },
                ]
            }
          />
        </div>
      </FloatingPageComponent>
    </>
  );
}
