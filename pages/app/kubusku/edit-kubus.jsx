import React from 'react';
import {
  CheckboxComponent,
  FormSupervisionComponent,
  IconButtonComponent,
  InputComponent,
  InputMapComponent,
  InputNumberComponent,
  SelectComponent,
} from '../../../components/base.components';
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import InputImageComponent from '../../../components/base.components/input/InputImage.component';
import { TextareaComponent } from '../../../components/base.components/input/Textarea.component';
import ToggleComponent from '../../../components/construct.components/input/TogleComponet';
import InputOpenHours from '../../../components/construct.components/input/InputOpenHours';
import { useRouter } from 'next/router';
import { useGet } from '../../../helpers';
import moment from 'moment';

export default function BuatKubus() {
  const router = useRouter();
  const { code } = router.query;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: `account`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCube, codeCube, cube] = useGet({
    path: code && `get-cube-by-code/${code}`,
  });
  let validate =
    cube?.data?.ads?.at(0)?.start_validate &&
    cube?.data?.ads?.at(0)?.finish_validate
      ? {
          // eslint-disable-next-line prettier/prettier
          'ads[start_validate]': moment(cube?.data?.ads?.at(0).start_validate).format('DD-MM-YYYY'),
          // eslint-disable-next-line prettier/prettier
          'ads[finish_validate]': moment(cube?.data?.ads?.at(0).finish_validate).format('DD-MM-YYYY'),
        }
      : null;
  return (
    <>
      {!loading && (
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
              <div className="font-semibold w-full text-lg">
                Edit Kubus #{code}
              </div>
            </div>

            <div className="px-2 mt-2 pb-4">
              <FormSupervisionComponent
                submitControl={{
                  path: `cubes/${cube?.data?.id}`,
                  contentType: 'multipart/form-data',
                }}
                defaultValue={{
                  _method: 'PUT',
                  cube_type_id: 1,
                  user_id: data?.data?.profile?.id,
                  address: cube?.data?.address,
                  map_lat: cube?.data?.map_lat,
                  map_lng: cube?.data?.map_lng,
                  'cube_tags[0][map_lat]': cube?.data?.tags?.at(0)?.map_lat,
                  'cube_tags[0][map_lng]': cube?.data?.tags?.at(0)?.map_lng,
                  'cube_tags[0][address]': cube?.data?.tags?.at(0)?.address,
                  'cube_tags[0][link]': cube?.data?.tags?.at(0)?.link,
                  'ads[image]': cube?.data?.ads?.at(0)?.picture_source,
                  'ads[title]': cube?.data?.ads?.at(0)?.title,
                  'ads[description]': cube?.data?.ads?.at(0)?.description,
                  'ads[ad_category_id]': cube?.data?.ads?.at(0)?.ad_category_id,
                  'ads[promo_type]': cube?.data?.ads?.at(0)?.promo_type,
                  'ads[is_daily_grab]':
                    cube?.data?.ads?.at(0)?.is_daily_grab || 0,
                  'ads[max_grab]': cube?.data?.ads?.at(0)?.max_grab || 0,
                  'ads[openHours]': cube?.data?.ads?.at(0)?.openHours,
                  ...validate,
                  change_map: cube?.data?.map_lat ? false : true,
                }}
                forms={[
                  {
                    type: 'custom',
                    custom: ({ values, setValues }) => {
                      return (
                        values?.find((i) => i.name == 'change_map')?.value ==
                          true && (
                          <div className="px-4 hover:mx-8 hover:border-4 rounded-lg">
                            <InputMapComponent
                              name="map"
                              onChange={(e) => {
                                setValues([
                                  ...values.filter(
                                    (i) =>
                                      ![
                                        'map_lat',
                                        'map_lng',
                                        'address',
                                        'cube_tags[0][map_lat]',
                                        'cube_tags[0][map_lng]',
                                        'cube_tags[0][address]',
                                      ].includes(i.name)
                                  ),
                                  { name: 'map_lat', value: e?.lat },
                                  { name: 'map_lng', value: e?.lng },
                                  { name: 'address', value: e?.address },
                                  {
                                    name: 'cube_tags[0][map_lat]',
                                    value: e?.lat,
                                  },
                                  {
                                    name: 'cube_tags[0][map_lng]',
                                    value: e?.lng,
                                  },
                                  {
                                    name: 'cube_tags[0][address]',
                                    value: e?.address,
                                  },
                                ]);
                              }}
                            />
                          </div>
                        )
                      );
                    },
                  },
                  {
                    col: 6,
                    type: 'custom',
                    custom: ({ values, setValues }) => {
                      return (
                        <div className="mt-3">
                          <ToggleComponent
                            name={'map'}
                            label="Ubah Lokasi Kubus"
                            onChange={() =>
                              setValues([
                                ...values.filter((i) => i.name != 'change_map'),
                                {
                                  name: 'change_map',
                                  value: !values.find(
                                    (i) => i.name == 'change_map'
                                  )?.value,
                                },
                              ])
                            }
                            checked={
                              values?.find((i) => i.name == 'change_map')?.value
                            }
                          />
                        </div>
                      );
                    },
                  },
                  {
                    type: 'custom',
                    custom: ({ values, setValues, errors }) => {
                      return (
                        <InputComponent
                          name="address"
                          label="Alamat"
                          placeholder="Masukan alamat..."
                          onChange={(e) => {
                            setValues([
                              ...values.filter((i) => i.name != 'address'),
                              { name: 'address', value: e },
                            ]);
                          }}
                          value={
                            values.find((i) => i.name == 'address')?.value
                              ? values.find((i) => i.name == 'address')?.value
                              : ''
                          }
                          errors={
                            errors.filter((i) => i.name == 'address')?.error
                          }
                        />
                      );
                    },
                  },
                  {
                    type: 'custom',
                    custom: () => (
                      <>
                        <div className=" translate-y-10 font-semibold px-6  w-fit mx-auto">
                          {' '}
                          Iklan{' '}
                        </div>
                        <div className="my-4 w-full h-3 border-b-4 border-dashed"></div>
                      </>
                    ),
                  },
                  {
                    type: 'custom',
                    custom: ({ formControl }) => (
                      <div className="px-2">
                        <InputImageComponent
                          name="ads[image]"
                          label=""
                          {...formControl('ads[image]')}
                        />
                      </div>
                    ),
                  },
                  {
                    type: 'custom',
                    custom: ({ formControl }) => (
                      <InputComponent
                        name="ads[title]"
                        label="Judul Iklan"
                        placeholder="Masukan Judu Iklan..."
                        {...formControl('ads[title]')}
                      />
                    ),
                  },
                  {
                    type: 'custom',
                    custom: ({ formControl }) => (
                      <TextareaComponent
                        name="ads[description]"
                        label="Deskripsi Iklan"
                        placeholder="Masukan Deskirpsi Iklan..."
                        {...formControl('ads[description]')}
                        rows={5}
                      />
                    ),
                  },
                  {
                    col: 6,
                    type: 'custom',
                    custom: ({ formControl }) => (
                      <SelectComponent
                        name="ads[ad_category_id]"
                        label="Kategori Iklan"
                        placeholder="Pilih Kategori Iklan..."
                        {...formControl('ads[ad_category_id]')}
                        serverOptionControl={{
                          path: 'admin/options/ad-category',
                        }}
                      />
                    ),
                  },
                  {
                    col: 6,
                    type: 'select',
                    construction: {
                      name: 'ads[promo_type]',
                      label: 'Tipe Promo',
                      placeholder: 'pilih Tipe Promo...',
                      options: [
                        { label: 'Online', value: 'online' },
                        { label: 'Offline', value: 'offline' },
                      ],
                      validations: { required: true },
                    },
                  },
                  {
                    col: 6,
                    type: 'custom',
                    custom: ({ values, setValues }) => {
                      return (
                        values.find((val) => val.name == 'ads[promo_type]')
                          ?.value == 'offline' && (
                          <div className="mt-3">
                            <ToggleComponent
                              name="tag-map"
                              label="Ubah Lokasi Validsi"
                              onChange={() =>
                                setValues([
                                  ...values.filter(
                                    (i) => i.name != 'change_tag-map'
                                  ),
                                  {
                                    name: 'change_tag-map',
                                    value: !values.find(
                                      (i) => i.name == 'change_tag-map'
                                    )?.value,
                                  },
                                ])
                              }
                              checked={
                                values?.find((i) => i.name == 'change_tag-map')
                                  ?.value
                              }
                            />
                          </div>
                        )
                      );
                    },
                  },
                  {
                    type: 'custom',
                    custom: ({ values, setValues }) => {
                      return (
                        values?.find((i) => i.name == 'change_tag-map')
                          ?.value == true && (
                          <div className="hover:mx-2 hover:border-4 border-sky-500 rounded-lg">
                            <InputMapComponent
                              name="tag-map"
                              onChange={(e) => {
                                setValues([
                                  ...values.filter(
                                    (i) =>
                                      ![
                                        'cube_tags[0][map_lat]',
                                        'cube_tags[0][map_lng]',
                                        'cube_tags[0][address]',
                                      ].includes(i.name)
                                  ),

                                  {
                                    name: 'cube_tags[0][map_lat]',
                                    value: e?.lat,
                                  },
                                  {
                                    name: 'cube_tags[0][map_lng]',
                                    value: e?.lng,
                                  },
                                  {
                                    name: 'cube_tags[0][address]',
                                    value: e?.address,
                                  },
                                ]);
                              }}
                            />
                          </div>
                        )
                      );
                    },
                  },
                  {
                    type: 'custom',
                    custom: ({ values, setValues, errors }) => {
                      return values.find((val) => val.name == 'ads[promo_type]')
                        ?.value == 'offline' ? (
                        <InputComponent
                          name="tag-address"
                          label="Alamat"
                          placeholder="Masukan alamat..."
                          onChange={(e) => {
                            setValues([
                              ...values.filter(
                                (i) => i.name != 'cube_tags[0][address]'
                              ),
                              { name: 'cube_tags[0][address]', value: e },
                            ]);
                          }}
                          value={
                            values.find(
                              (i) => i.name == 'cube_tags[0][address]'
                            )?.value
                              ? values.find(
                                  (i) => i.name == 'cube_tags[0][address]'
                                )?.value
                              : ''
                          }
                          errors={
                            errors.filter(
                              (i) => i.name == 'cube_tags[0][address]'
                            )?.error
                          }
                        />
                      ) : (
                        values.find((val) => val.name == 'ads[promo_type]')
                          ?.value == 'online' && (
                          <InputComponent
                            type="url"
                            name="link"
                            label="Tautan/Link"
                            placeholder="Masukan Tautan/Link promo online..."
                            onChange={(e) => {
                              setValues([
                                ...values.filter(
                                  (i) =>
                                    !['cube_tags[0][link]'].includes(i.name)
                                ),
                                { name: 'cube_tags[0][link]', value: e || '' },
                              ]);
                            }}
                            value={
                              values.find((i) => i.name == 'cube_tags[0][link]')
                                ?.value
                                ? values.find(
                                    (i) => i.name == 'cube_tags[0][link]'
                                  )?.value
                                : ''
                            }
                            errors={
                              errors.filter(
                                (i) => i.name == 'cube_tags[0][link]'
                              )?.error
                            }
                          />
                        )
                      );
                    },
                  },
                  {
                    type: 'custom',
                    custom: ({ values, setValues, errors }) => (
                      <div className="mt-3 space-y-2">
                        <CheckboxComponent
                          label="Promo Harian"
                          name="ads[is_daily_grab]"
                          onChange={() => {
                            setValues([
                              ...values.filter(
                                (i) => i.name != 'ads[is_daily_grab]'
                              ),
                              {
                                name: 'ads[is_daily_grab]',
                                value: !values.find(
                                  (i) => i.name == 'ads[is_daily_grab]'
                                )?.value
                                  ? 1
                                  : 0,
                              },
                            ]);
                          }}
                          checked={
                            values?.find((i) => i.name == 'ads[is_daily_grab]')
                              ?.value
                          }
                        />
                        <InputNumberComponent
                          type="number"
                          name="ads[max_grab]"
                          label={
                            values?.find((i) => i.name == 'ads[is_daily_grab]')
                              ?.value
                              ? 'Jumlah Promo Per Hari'
                              : 'Jumlah Promo'
                          }
                          placeholder={
                            values?.find((i) => i.name == 'ads[is_daily_grab]')
                              ?.value
                              ? 'Promo yang bisa diambil dalam satu hari...'
                              : 'Masukan Jumlah Promo...'
                          }
                          validations={{ required: true }}
                          onChange={(e) =>
                            setValues([
                              ...values.filter(
                                (i) => i.name != 'ads[max_grab]'
                              ),
                              { name: 'ads[max_grab]', value: e },
                            ])
                          }
                          value={
                            values.find((i) => i.name == 'ads[max_grab]')?.value
                          }
                          error={
                            errors.find((i) => i.name == 'ads[max_grab]')?.error
                          }
                        />
                      </div>
                    ),
                  },
                  {
                    col: 6,
                    type: 'custom',
                    custom: ({ values, setValues, errors }) => (
                      <InputComponent
                        type="date"
                        name="ads[start_validate]"
                        label="Berlaku Mulai"
                        placeholder="Pilih Tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter(
                              (i) => i.name != 'ads[start_validate]'
                            ),
                            {
                              name: 'ads[start_validate]',
                              value: moment(e).format('DD-MM-YYYY'),
                            },
                          ]);
                        }}
                        value={
                          values.find((i) => i.name == 'ads[start_validate]')
                            ?.value
                            ? // eslint-disable-next-line prettier/prettier
                        moment(values.find((i) => i.name == 'ads[start_validate]')?.value,'DD-MM-YYYY').format('YYYY-MM-DD')
                            : ''
                        }
                        errors={
                          errors.filter((i) => i.name == 'ads[start_validate]')
                            ?.error
                        }
                      />
                    ),
                  },
                  {
                    col: 6,
                    type: 'custom',
                    custom: ({ values, setValues, errors }) => (
                      <InputComponent
                        type="date"
                        name="ads[finish_validate]"
                        label="Berakhir Pada"
                        placeholder="Pilih Tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter(
                              (i) => i.name != 'ads[finish_validate]'
                            ),
                            {
                              name: 'ads[finish_validate]',
                              value: moment(e).format('DD-MM-YYYY'),
                            },
                          ]);
                        }}
                        value={
                          values.find((i) => i.name == 'ads[finish_validate]')
                            ?.value
                            ? // eslint-disable-next-line prettier/prettier
                        moment(values.find((i) => i.name == 'ads[finish_validate]')?.value,'DD-MM-YYYY').format('YYYY-MM-DD')
                            : ''
                        }
                        errors={
                          errors.filter((i) => i.name == 'ads[finish_validate]')
                            ?.error
                        }
                      />
                    ),
                  },
                  {
                    type: 'custom',
                    custom: ({ values, setValues, errors }) => {
                      return (
                        <div className="mt-3">
                          <ToggleComponent
                            label="Jam Buka Baru"
                            name="openHours"
                            onChange={() =>
                              setValues([
                                ...values.filter((i) => i.name != 'openHours'),
                                {
                                  name: 'openHours',
                                  value: !values.find(
                                    (i) => i.name == 'openHours'
                                  )?.value,
                                },
                              ])
                            }
                            checked={
                              values?.find((i) => i.name == 'openHours')?.value
                            }
                          />
                          {values.find((i) => i.name == 'openHours')?.value && (
                            <div className="bg-background py-6">
                              <InputOpenHours
                                values={values}
                                setValues={setValues}
                                errors={errors}
                              />
                            </div>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
