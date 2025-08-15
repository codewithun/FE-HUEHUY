import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';

import {
  ButtonComponent,
  CheckboxComponent,
  DateFormatComponent,
  FloatingPageComponent,
  FormSupervisionComponent,
  InputComponent,
  InputMapComponent,
  InputNumberComponent,
  SelectComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';
// import InputHexColor from '../../../components/construct.components/input/InputHexColor';
import {
  faEdit,
  faFilePen,
  faInfinity,
  faTicket,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import moment from 'moment';
import InputImageComponent from '../../../components/base.components/input/InputImage.component';
import { TextareaComponent } from '../../../components/base.components/input/Textarea.component';
import InputOpenHours from '../../../components/construct.components/input/InputOpenHours';
import ToggleComponent from '../../../components/construct.components/input/TogleComponet';
import UpdateCubeStatusModal from '../../../components/construct.components/modal/UpdateCubeStatus.modal';
import VoucherModal from '../../../components/construct.components/modal/Voucher.modal';
import GrabListComponent from '../../../components/construct.components/partial-page/GrabList.component';
import { useUserContext } from '../../../context/user.context';
import { token_cookie_name } from '../../../helpers';

// import { useAccessContext } from '../../../context';

function Kubus() {
  const [selected, setSelected] = useState(null);
  const [formAds, setFormAds] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [voucherModal, setVoucherModal] = useState(false);
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (Profile?.role_id != 1) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/admin';
      }
    }
  }, [Profile]);

  let validate =
    selected?.ads?.at(0)?.start_validate &&
    selected?.ads?.at(0)?.finish_validate
      ? {
          start_validate: moment(selected?.ads[0].start_validate).format(
            'DD-MM-YYYY'
          ),
          finish_validate: moment(selected?.ads[0].finish_validate).format(
            'DD-MM-YYYY'
          ),
        }
      : null;

  return (
    <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
      <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Kubus</h1>
      <TableSupervisionComponent
        setToRefresh={refresh}
        title="Kubus"
        fetchControl={{
          path: 'admin/cubes',
        }}
        columnControl={{
          custom: [
            {
              selector: 'code',
              label: 'Kubus',
              sortable: true,
              width: '150px',
              item: ({ code, cube_type }) => {
                return (
                  <>
                    <b>{code}</b>
                    <p className="text-slate-500 text-sm">{cube_type?.name}</p>
                  </>
                );
              },
            },
            {
              selector: 'ads',
              label: 'Iklan',
              sortable: true,
              width: '250px',
              item: ({ ads }) => {
                return (
                  <>
                    <b>{ads?.at(0)?.title}</b>
                  </>
                );
              },
            },
            {
              selector: 'address',
              label: 'Lokasi',
              sortable: true,
              width: '250px',
              item: ({ address }) => (
                <span className="limit__line__2">{address}</span>
              ),
            },
            {
              selector: 'status',
              label: 'Status',
              sortable: true,
              width: '130px',
              item: ({ status, inactive_at }) => (
                <div className="">
                  {status === 'active' ? (
                    <span className="uppercase font-medium text-green-600 py-1 px-2.5 rounded-md text-sm bg-green-100">
                      Aktif
                    </span>
                  ) : (
                    <span className="uppercase font-medium text-red-600 py-1 px-2.5 rounded-md text-sm bg-red-100">
                      Tidak Aktif
                    </span>
                  )}
                  <p className="text-xs mt-2">
                    Aktif Sampai:{' '}
                    {inactive_at ? (
                      <DateFormatComponent date={inactive_at} />
                    ) : (
                      <FontAwesomeIcon icon={faInfinity} />
                    )}
                  </p>
                </div>
              ),
            },
            {
              selector: 'max_grab',
              label: 'Sisa Promo',
              sortable: true,
              width: '200px',
              item: ({ ads }) =>
                ads?.at(0)?.max_grab == null ? (
                  <FontAwesomeIcon icon={faInfinity} />
                ) : ads?.at(0)?.is_daily_grab ? (
                  `${
                    ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) ||
                    'Tidak ada'
                  } Promo / Hari`
                ) : (
                  `${
                    ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) ||
                    'Tidak ada'
                  } Promo`
                ),
            },
            {
              selector: 'world_id',
              label: 'Dunia',
              sortable: true,
              width: '150px',
              item: ({ world }) =>
                world ? (
                  <span className="limit__line__2">{world.name}</span>
                ) : (
                  '-'
                ),
            },
            {
              selector: 'owner',
              label: 'Pemilik',
              sortable: true,
              width: '250px',
              item: ({ user, cube_type_id, corporate }) => {
                return (
                  <>
                    {cube_type_id == 2 ? (
                      <b className="font-semibold">
                        {corporate?.name ? corporate?.name : '-'}
                      </b>
                    ) : (
                      <>
                        <b className="font-semibold">
                          {user?.name ? user?.name : '-'}
                        </b>
                        <p className="text-slate-500 text-sm">
                          {user?.email ? user?.email : null}
                        </p>
                      </>
                    )}
                  </>
                );
              },
            },
          ],
        }}
        formControl={{
          contentType: 'multipart/form-data',
          customDefaultValue: { 'ads[is_daily_grab]': 0 },
          custom: [
            {
              type: 'check',
              construction: {
                name: 'is_information',
                options: [{ label: 'Kubus Informasi', value: 1 }],
              },
            },
            {
              type: 'select',
              construction: {
                name: 'cube_type_id',
                label: 'Tipe Kubus',
                placeholder: 'Pilih Tipe Kubus..',
                serverOptionControl: {
                  path: 'admin/options/cube-type',
                },
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                if (
                  !values.find((i) => i.name == 'is_information')?.value?.at(0)
                ) {
                  return (
                    <>
                      {values.find((i) => i.name == 'cube_type_id')?.value ==
                      2 ? (
                        <SelectComponent
                          name="corporate_id"
                          label="Pemilik (Mitra)"
                          placeholder="Pilih Mitra..."
                          serverOptionControl={{
                            path: `admin/options/corporate`,
                          }}
                          {...formControl('corporate_id')}
                          searchable
                        />
                      ) : (
                        <SelectComponent
                          name="user_id"
                          label="Pemilik"
                          placeholder="Pilih user..."
                          serverOptionControl={{
                            path: `admin/options/user`,
                          }}
                          {...formControl('user_id')}
                          searchable
                        />
                      )}
                    </>
                  );
                }
              },
            },
            {
              col: 4,
              type: 'custom',
              custom: ({ values, formControl }) => {
                const cubeType = values.find(
                  (i) => i.name == 'cube_type_id'
                )?.value;
                return (
                  <>
                    {cubeType == 2 ? (
                      <InputImageComponent
                        name="image"
                        label="logo Kubus Merah"
                        {...formControl('image')}
                      />
                    ) : cubeType == 4 ? (
                      <InputImageComponent
                        name="image"
                        label="logo Kubus Hijau"
                        {...formControl('image')}
                      />
                    ) : null}
                  </>
                );
              },
            },
            // {
            //   type: 'custom',
            //   custom: ({ values, setValues, errors }) => {
            //     return (
            //       <InputHexColor
            //         name="color"
            //         label="Warna Branding"
            //         values={values}
            //         setValues={setValues}
            //         errors={errors}
            //       />
            //     );
            //   },
            // },
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                if (
                  !values.find((i) => i.name == 'is_information')?.value?.at(0)
                ) {
                  return (
                    <div className="mx-10 hover:mx-8 hover:border-4 border-sky-500 rounded-lg">
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
                                  'cube_tags[0][link]',
                                  'cube_tags[0][map_lat]',
                                  'cube_tags[0][map_lng]',
                                  'cube_tags[0][address]',
                                ].includes(i.name)
                            ),
                            { name: 'map_lat', value: e?.lat || '' },
                            { name: 'map_lng', value: e?.lng || '' },
                            { name: 'address', value: e?.address },
                            {
                              name: 'cube_tags[0][map_lat]',
                              value: e?.lat || '',
                            },
                            {
                              name: 'cube_tags[0][map_lng]',
                              value: e?.lng || '',
                            },
                            {
                              name: 'cube_tags[0][address]',
                              value: e?.address,
                            },
                          ]);
                        }}
                      />
                    </div>
                  );
                }
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                if (
                  !values.find((i) => i.name == 'is_information')?.value?.at(0)
                ) {
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
                      errors={errors.filter((i) => i.name == 'address')?.error}
                    />
                  );
                }
              },
            },
            {
              type: 'check',
              construction: {
                name: 'is_recommendation',
                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
              },
            },
            {
              type: 'custom',
              custom: () => (
                <>
                  <div className=" translate-y-10 font-semibold px-6 bg-white w-fit mx-auto">
                    Iklan
                  </div>
                  <div className="my-4 w-full h-3 border-b-4 border-dashed"></div>
                </>
              ),
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                if (
                  values.find((i) => i.name == 'is_information')?.value?.at(0)
                ) {
                  return (
                    <div className="pb-16">
                      <InputComponent
                        name="link_information"
                        label="Link Youtube"
                        placeholder="Masukkan link youtube"
                        {...formControl('link_information')}
                      />
                    </div>
                  );
                }
              },
            },
            {
              type: 'custom',
              custom: ({ formControl }) => (
                <div className="px-32">
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
              col: 4,
              type: 'custom',
              custom: ({ formControl }) => (
                <SelectComponent
                  name="ads[level_umkm]"
                  label="Level UMKM (Opsional)"
                  placeholder="..."
                  {...formControl('ads[level_umkm]')}
                  options={[
                    {
                      label: '1',
                      value: 1,
                    },
                    {
                      label: '2',
                      value: 2,
                    },
                    {
                      label: '3',
                      value: 3,
                    },
                  ]}
                />
              ),
            },
            {
              col: 4,
              type: 'custom',
              custom: ({ formControl }) => (
                <InputNumberComponent
                  name="ads[max_production_per_day]"
                  label="Produksi Per Hari (Opsional)"
                  placeholder="..."
                  {...formControl('ads[max_production_per_day]')}
                />
              ),
            },
            {
              col: 4,
              type: 'custom',
              custom: ({ formControl }) => (
                <InputNumberComponent
                  name="ads[sell_per_day]"
                  label="Produksi Per Hari (Opsional)"
                  placeholder="..."
                  {...formControl('ads[sell_per_day]')}
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
              type: 'custom',
              custom: ({ values, setValues }) => {
                if (
                  !values.find((i) => i.name == 'is_information')?.value?.at(0)
                )
                  return (
                    values.find((val) => val.name == 'ads[promo_type]')
                      ?.value == 'offline' && (
                      <>
                        <p className="text-sm text-slate-600 font-semibold">
                          Lokasi Validasi
                        </p>
                        <div className="mx-10 hover:mx-8 hover:border-4 border-sky-500 rounded-lg">
                          <InputMapComponent
                            name="map-tag"
                            onChange={(e) => {
                              setValues([
                                ...values.filter(
                                  (i) =>
                                    ![
                                      'cube_tags[0][link]',
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
                      </>
                    )
                  );
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                if (
                  !values.find((i) => i.name == 'is_information')?.value?.at(0)
                )
                  return values.find((val) => val.name == 'ads[promo_type]')
                    ?.value == 'offline' ? (
                    <InputComponent
                      name="cube_tags[0][address]"
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
                        values.find((i) => i.name == 'cube_tags[0][address]')
                          ?.value
                          ? values.find(
                              (i) => i.name == 'cube_tags[0][address]'
                            )?.value
                          : ''
                      }
                      errors={
                        errors.filter((i) => i.name == 'cube_tags[0][address]')
                          ?.error
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
                                ![
                                  'cube_tags[0][link]',
                                  'cube_tags[0][map_lat]',
                                  'cube_tags[0][map_lng]',
                                  'cube_tags[0][address]',
                                ].includes(i.name)
                            ),
                            { name: 'cube_tags[0][link]', value: e || '' },
                          ]);
                        }}
                        value={
                          values.find((i) => i.name == 'cube_tags[0][link]')
                            ?.value
                            ? values.find((i) => i.name == 'cube_tags[0][link]')
                                ?.value
                            : ''
                        }
                        errors={
                          errors.filter((i) => i.name == 'cube_tags[0][link]')
                            ?.error
                        }
                      />
                    )
                  );
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) =>
                !values
                  .find((i) => i.name == 'is_information')
                  ?.value?.at(0) && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-4">
                      <CheckboxComponent
                        label="Promo Tak Terbatas"
                        name="ads[unlimited_grab]"
                        onChange={() => {
                          setValues([
                            ...values.filter(
                              (i) => i.name != 'ads[unlimited_grab]'
                            ),
                            {
                              name: 'ads[unlimited_grab]',
                              value: !values.find(
                                (i) => i.name == 'ads[unlimited_grab]'
                              )?.value
                                ? 1
                                : 0,
                            },
                          ]);
                        }}
                        checked={
                          values?.find((i) => i.name == 'ads[unlimited_grab]')
                            ?.value || false
                        }
                      />

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
                        disabled={
                          values?.find((i) => i.name == 'ads[unlimited_grab]')
                            ?.value || false
                        }
                      />
                    </div>

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
                          ...values.filter((i) => i.name != 'ads[max_grab]'),
                          { name: 'ads[max_grab]', value: e },
                        ])
                      }
                      value={
                        values.find((i) => i.name == 'ads[max_grab]')?.value
                      }
                      error={
                        errors.find((i) => i.name == 'ads[max_grab]')?.error
                      }
                      disabled={
                        values?.find((i) => i.name == 'ads[unlimited_grab]')
                          ?.value
                      }
                    />
                  </div>
                ),
            },
            {
              col: 7,
              type: 'time',
              construction: {
                name: 'validation_time_limit',
                placeholder: 'Masukkan batas waktu validasi (Opsional)...',
                label: 'Batas Waktu Validasi',
              },
            },
            {
              col: 6,
              type: 'custom',
              custom: ({ values, setValues, errors }) =>
                !values
                  .find((i) => i.name == 'is_information')
                  ?.value?.at(0) && (
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
                      values.find((i) => i.name == 'ads[start_validate]')?.value
                        ? values.find((i) => i.name == 'ads[start_validate]')
                            ?.value
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
              custom: ({ values, setValues, errors }) =>
                !values
                  .find((i) => i.name == 'is_information')
                  ?.value?.at(0) && (
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
                          value: moment(e)?.format('DD-MM-YYYY'),
                        },
                      ]);
                    }}
                    value={
                      values.find((i) => i.name == 'ads[finish_validate]')
                        ?.value
                        ? values.find((i) => i.name == 'ads[finish_validate]')
                            ?.value
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
                if (
                  !values.find((i) => i.name == 'is_information')?.value?.at(0)
                )
                  return (
                    <div className="mt-3">
                      <ToggleComponent
                        label="Tambahkan Jam Buka"
                        name="openHours"
                        onChange={() =>
                          setValues([
                            ...values.filter((i) => i.name != 'openHours'),
                            {
                              name: 'openHours',
                              value: !values.find((i) => i.name == 'openHours')
                                ?.value,
                            },
                          ])
                        }
                        checked={
                          values?.find((i) => i.name == 'openHours')?.value
                        }
                      />
                      {values.find((i) => i.name == 'openHours')?.value && (
                        <div className="bg-stone-50 py-6">
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
          ],
        }}
        formUpdateControl={{
          customDefaultValue: (data) => {
            let worldID = data.world_id ? { world_id: data.world_id } : null;
            let userID = data.user_id ? { user_id: data.user_id } : null;
            let corpotareID = data.corporate_id
              ? { corporate_id: data.corporate_id }
              : null;

            return {
              cube_type_id: data?.cube_type_id,
              color: data?.color,
              address: data?.address,
              is_recommendation: data?.is_recommendation ? 1 : 0,
              is_information: data?.is_information ? 1 : 0,
              link_information: data?.link_information || '',
              map_lat: data?.map_lat,
              map_lng: data?.map_lng,
              status: data?.status,
              image: data?.picture_source,
              'cube_tags[0][link]': data?.tags?.at(0)?.link,
              'ads[promo_type]': data?.ads?.at(0)?.promo_type,
              ...worldID,
              ...userID,
              ...corpotareID,
            };
          },
          contentType: 'multipart/form-data',
          custom: [
            {
              type: 'select',
              construction: {
                name: 'cube_type_id',
                label: 'Tipe Kubus',
                placeholder: 'Pilih Tipe Kubus..',
                serverOptionControl: {
                  path: 'admin/options/cube-type',
                },
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                if (!values?.find((i) => i.name == 'is_information')?.value)
                  return (
                    <>
                      {values?.find((i) => i.name == 'cube_type_id')?.value ==
                      2 ? (
                        <SelectComponent
                          name="corporate_id"
                          label="Pemilik (Mitra)"
                          placeholder="Pilih Mitra..."
                          serverOptionControl={{
                            path: `admin/options/corporate`,
                          }}
                          {...formControl('corporate_id')}
                          searchable
                        />
                      ) : (
                        <SelectComponent
                          name="user_id"
                          label="Pemilik"
                          placeholder="Pilih user..."
                          serverOptionControl={{
                            path: `admin/options/user`,
                          }}
                          {...formControl('user_id')}
                          searchable
                        />
                      )}
                    </>
                  );
              },
            },
            {
              col: 4,
              type: 'custom',
              custom: ({ values, formControl }) => {
                const cubeType = values.find(
                  (i) => i.name == 'cube_type_id'
                )?.value;
                return (
                  <>
                    {cubeType == 2 ? (
                      <InputImageComponent
                        name="image"
                        label="logo Kubus Merah"
                        {...formControl('image')}
                      />
                    ) : cubeType == 4 ? (
                      <InputImageComponent
                        name="image"
                        label="logo Kubus Hijau"
                        {...formControl('image')}
                      />
                    ) : null}
                  </>
                );
              },
            },
            // {
            //   type: 'custom',
            //   custom: ({ values, setValues, errors }) => {
            //     return (
            //       <InputHexColor
            //         name="color"
            //         label="Warna Branding"
            //         values={values}
            //         setValues={setValues}
            //         errors={errors}
            //       />
            //     );
            //   },
            // },
            {
              // col: 6,
              type: 'custom',
              custom: ({ values, setValues }) => {
                if (!values?.find((i) => i.name == 'is_information')?.value)
                  return (
                    <>
                      <ToggleComponent
                        label="Ubah Lokasi Kubus"
                        onChange={() =>
                          setValues([
                            ...values.filter((i) => i.name != 'change_map'),
                            {
                              name: 'change_map',
                              value: !values.find((i) => i.name == 'change_map')
                                ?.value,
                            },
                          ])
                        }
                        checked={
                          values?.find((i) => i.name == 'change_map')?.value
                        }
                      />
                    </>
                  );
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                if (!values?.find((i) => i.name == 'is_information')?.value)
                  return (
                    values?.find((i) => i.name == 'change_map')?.value ==
                      true && (
                      <div className="mx-10 hover:mx-8 hover:border-4 border-sky-500 rounded-lg">
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
                              { name: 'cube_tags[0][map_lat]', value: e?.lat },
                              { name: 'cube_tags[0][map_lng]', value: e?.lng },
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
                if (!values?.find((i) => i.name == 'is_information')?.value)
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
                      errors={errors.filter((i) => i.name == 'address')?.error}
                    />
                  );
              },
            },
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                if (values.find((i) => i.name == 'is_information')?.value) {
                  return (
                    <div className="pb-4">
                      <InputComponent
                        name="link_information"
                        label="Link Youtube"
                        placeholder="Masukkan link youtube"
                        {...formControl('link_information')}
                      />
                    </div>
                  );
                }
              },
            },
            {
              type: 'check',
              construction: {
                name: 'is_recommendation',
                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                return (
                  values.find((val) => val.name == 'ads[promo_type]')?.value ==
                    'offline' && (
                    <>
                      <p className="text-sm text-slate-600 font-semibold">
                        Lokasi Validasi
                      </p>
                      <div className="mx-10 hover:mx-8 hover:border-4 border-sky-500 rounded-lg">
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
                    </>
                  )
                );
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                if (!values?.find((i) => i.name == 'is_information')?.value)
                  return values.find((val) => val.name == 'ads[promo_type]')
                    ?.value == 'offline' ? (
                    <InputComponent
                      name="tag-address"
                      label="Alamat Validasi"
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
                        values.find((i) => i.name == 'cube_tags[0][address]')
                          ?.value
                          ? values.find(
                              (i) => i.name == 'cube_tags[0][address]'
                            )?.value
                          : ''
                      }
                      errors={
                        errors.filter((i) => i.name == 'cube_tags[0][address]')
                          ?.error
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
                              (i) => !['cube_tags[0][link]'].includes(i.name)
                            ),
                            { name: 'cube_tags[0][link]', value: e || '' },
                          ]);
                        }}
                        value={
                          values.find((i) => i.name == 'cube_tags[0][link]')
                            ?.value
                            ? values.find((i) => i.name == 'cube_tags[0][link]')
                                ?.value
                            : ''
                        }
                        errors={
                          errors.filter((i) => i.name == 'cube_tags[0][link]')
                            ?.error
                        }
                      />
                    )
                  );
              },
            },
          ],
        }}
        customDetail={(data) => {
          return (
            <GrabListComponent
              data={data}
              filter={[
                {
                  column: 'ad_id',
                  type: 'equal',
                  value: data?.ads.at(0)?.id,
                },
              ]}
            />
          );
        }}
        actionControl={{
          except: ['edit'],
          include: (data, { setModalForm, setDataSelected }) => {
            return (
              <>
                <ButtonComponent
                  icon={faEdit}
                  label={'Ubah Kubus'}
                  variant="outline"
                  paint="warning"
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setModalForm(true);
                    setDataSelected();
                  }}
                />
                <ButtonComponent
                  icon={faFilePen}
                  label={data.ads.at(0)?.id ? 'Ubah Iklan' : 'buat Iklan'}
                  variant="outline"
                  paint={data.ads.at(0)?.id ? 'warning' : 'primary'}
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setFormAds('general');
                    setSelected(data);
                  }}
                />
                <ButtonComponent
                  // icon={faBriefcase}
                  label={
                    data?.status === 'active' ? 'Non-Aktifkan' : 'Aktifkan'
                  }
                  variant="outline"
                  paint={data?.status === 'active' ? 'danger' : 'success'}
                  size={'xs'}
                  rounded
                  onClick={() => {
                    setSelected(data);
                    setUpdateStatus(true);
                  }}
                />
                {/* {data.ads.length ? (
                  <ButtonComponent
                    icon={faNewspaper}
                    label={'Iklan Huehuy'}
                    variant="outline"
                    paint="primary"
                    size={'sm'}
                    rounded
                    onClick={() => {
                      setSelected(data);
                      setFormAds('huehuy');
                    }}
                  />
                ) : null} */}
                {data.ads.at(0)?.promo_type == 'online' ? (
                  <ButtonComponent
                    icon={faTicket}
                    label={'Voucher'}
                    variant="outline"
                    paint="secondary"
                    size={'sm'}
                    rounded
                    onClick={() => {
                      setSelected(data);
                      setVoucherModal(true);
                    }}
                  />
                ) : null}
              </>
            );
          },
        }}
      />

      <FloatingPageComponent
        show={formAds}
        title={`${
          formAds == 'huehuy'
            ? selected?.ads.some((obj) => obj.type == 'huehuy')
              ? 'Ubah iklan Huehuy'
              : 'Tambahkan iklan Huehuy'
            : selected?.ads?.at(0)?.id
            ? 'Ubah Iklan Utama'
            : 'Buat Iklan Utama'
        }`}
        onClose={() => {
          setFormAds(false);
        }}
      >
        <div className="px-6 pt-4 pb-20 h-full overflow-scroll scroll_control">
          <FormSupervisionComponent
            submitControl={{
              path:
                formAds == 'huehuy'
                  ? selected?.ads.some((obj) => obj.type != 'huehuy')
                    ? 'admin/ads'
                    : `admin/ads/${selected?.id}`
                  : selected?.ads?.at(0)?.id
                  ? `admin/ads/${selected?.ads?.at(0)?.id}`
                  : 'admin/ads',
              contentType: 'multipart/form-data',
            }}
            defaultValue={
              formAds == 'huehuy'
                ? {
                    ...selected?.ads
                      .filter((obj) => obj.type == 'huehuy')
                      .at(0),
                    cube_id: selected?.id,
                    type: 'huehuy',
                  }
                : selected?.ads?.at(0)?.id
                ? {
                    _method: 'PUT',
                    title: selected?.ads[0].title,
                    description: selected?.ads[0].description || '',
                    ad_category_id: selected?.ads[0].ad_category_id || '',
                    promo_type: selected?.ads[0].promo_type || '',
                    is_daily_grab: selected?.ads[0].is_daily_grab,
                    max_grab: selected?.ads[0].max_grab || '',
                    cube_id: selected?.id,
                    type: selected?.ads[0].type,
                    image: selected?.ads[0].picture_source,
                    ...validate,
                    is_information: selected?.is_information ? 1 : 0,
                    link_information: selected?.link_information || '',
                    level_umkm: selected?.ads[0].level_umkm || '',
                    max_production_per_day:
                      selected?.ads[0].max_production_per_day || '',
                    sell_per_day: selected?.ads[0].sell_per_day || '',
                    validation_time_limit:
                      selected?.ads[0].validation_time_limit || '',
                  }
                : {
                    cube_id: selected?.id,
                    type: 'general',
                    is_daily_grab: 0,
                  }
            }
            onSuccess={() => {
              setFormAds(false);
              setRefresh(!refresh);
            }}
            forms={[
              {
                type: 'custom',
                custom: ({ formControl }) => (
                  <div className="px-32">
                    <InputImageComponent
                      name="image"
                      label="Iklan"
                      {...formControl('image')}
                    />
                  </div>
                ),
              },
              {
                type: 'custom',
                custom: ({ formControl }) => (
                  <InputComponent
                    name="title"
                    label="Judul Iklan"
                    placeholder="Masukan Judu Iklan..."
                    {...formControl('title')}
                  />
                ),
              },
              {
                type: 'custom',
                custom: ({ formControl }) => (
                  <TextareaComponent
                    name="description"
                    label="Deskripsi Iklan"
                    placeholder="Masukan Deskirpsi Iklan..."
                    {...formControl('description')}
                    rows={5}
                  />
                ),
              },
              {
                col: 4,
                type: 'custom',
                custom: ({ formControl }) => (
                  <SelectComponent
                    name="level_umkm"
                    label="Level UMKM (Opsional)"
                    placeholder="..."
                    {...formControl('level_umkm')}
                    options={[
                      {
                        label: '1',
                        value: 1,
                      },
                      {
                        label: '2',
                        value: 2,
                      },
                      {
                        label: '3',
                        value: 3,
                      },
                    ]}
                  />
                ),
              },
              {
                col: 4,
                type: 'custom',
                custom: ({ formControl }) => (
                  <InputNumberComponent
                    name="max_production_per_day"
                    label="Produksi Per Hari (Opsional)"
                    placeholder="..."
                    {...formControl('max_production_per_day')}
                  />
                ),
              },
              {
                col: 4,
                type: 'custom',
                custom: ({ formControl }) => (
                  <InputNumberComponent
                    name="sell_per_day"
                    label="Produksi Per Hari (Opsional)"
                    placeholder="..."
                    {...formControl('sell_per_day')}
                  />
                ),
              },
              {
                col: 6,
                type: 'custom',
                custom: ({ formControl }) => (
                  <SelectComponent
                    name="ad_category_id"
                    label="Kategori Iklan"
                    placeholder="Pilih Kategori Iklan..."
                    {...formControl('ad_category_id')}
                    serverOptionControl={{
                      path: `admin/options/ad-category`,
                    }}
                  />
                ),
              },
              {
                col: 6,
                type: 'select',
                construction: {
                  name: 'promo_type',
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
                type: 'custom',
                custom: ({ values, setValues, errors }) =>
                  !values?.find((i) => i.name == 'is_information')?.value && (
                    <div className="mt-3 space-y-2">
                      <CheckboxComponent
                        label="Promo Harian"
                        name="is_daily_grab"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name != 'is_daily_grab'),
                            {
                              name: 'is_daily_grab',
                              value: !values.find(
                                (i) => i.name == 'is_daily_grab'
                              )?.value
                                ? 1
                                : 0,
                            },
                          ]);
                        }}
                        checked={
                          values?.find((i) => i.name == 'is_daily_grab')?.value
                        }
                      />
                      <InputNumberComponent
                        type="number"
                        name="max_grab"
                        label={
                          values?.find((i) => i.name == 'is_daily_grab')?.value
                            ? 'Jumlah Promo Per Hari'
                            : 'Jumlah Promo'
                        }
                        placeholder={
                          values?.find((i) => i.name == 'is_daily_grab')?.value
                            ? 'Promo yang bisa diambil dalam satu hari...'
                            : 'Masukan Jumlah Promo...'
                        }
                        validations={{ required: true }}
                        onChange={(e) =>
                          setValues([
                            ...values.filter((i) => i.name != 'max_grab'),
                            { name: 'max_grab', value: e },
                          ])
                        }
                        value={values.find((i) => i.name == 'max_grab')?.value}
                        error={errors.find((i) => i.name == 'max_grab')?.error}
                      />
                    </div>
                  ),
              },
              {
                col: 7,
                type: 'time',
                construction: {
                  name: 'validation_time_limit',
                  label: 'Batas Waktu Validasi',
                },
              },
              {
                col: 6,
                type: 'custom',
                custom: ({ values, setValues, errors }) =>
                  !values?.find((i) => i.name == 'is_information')?.value && (
                    <InputComponent
                      type="date"
                      name="start_validate"
                      label="Berlaku Mulai"
                      placeholder="Pilih Tanggal..."
                      forceFormat="DD-MM-YYYY HH:mm:ss"
                      onChange={(e) => {
                        setValues([
                          ...values.filter((i) => i.name != 'start_validate'),
                          {
                            name: 'start_validate',
                            value: moment(e)?.format('DD-MM-YYYY'),
                          },
                        ]);
                      }}
                      value={
                        values.find((i) => i.name == 'start_validate')?.value
                          ? // eslint-disable-next-line prettier/prettier
                            moment(
                              values.find((i) => i.name == 'start_validate')
                                ?.value,
                              'DD-MM-YYYY'
                            ).format('YYYY-MM-DD')
                          : ''
                      }
                      errors={
                        errors.filter((i) => i.name == 'start_validate')?.error
                      }
                    />
                  ),
              },
              {
                col: 6,
                type: 'custom',
                custom: ({ values, setValues, errors }) =>
                  !values?.find((i) => i.name == 'is_information')?.value && (
                    <InputComponent
                      type="date"
                      name="finish_validate"
                      label="Berakhir Pada"
                      placeholder="Pilih Tanggal..."
                      forceFormat="DD-MM-YYYY HH:mm:ss"
                      onChange={(e) => {
                        setValues([
                          ...values.filter((i) => i.name != 'finish_validate'),
                          {
                            name: 'finish_validate',
                            value: moment(e)?.format('DD-MM-YYYY'),
                          },
                        ]);
                      }}
                      value={
                        values.find((i) => i.name == 'finish_validate')?.value
                          ? // eslint-disable-next-line prettier/prettier
                            moment(
                              values.find((i) => i.name == 'finish_validate')
                                ?.value,
                              'DD-MM-YYYY'
                            ).format('YYYY-MM-DD')
                          : ''
                      }
                      errors={
                        errors.filter((i) => i.name == 'finish_validate')?.error
                      }
                    />
                  ),
              },
            ]}
          />
        </div>
      </FloatingPageComponent>
      <UpdateCubeStatusModal
        data={selected}
        show={updateStatus}
        setShow={setUpdateStatus}
        onSuccess={() => {
          setRefresh(!refresh);
          setUpdateStatus(false);
        }}
      />
      <VoucherModal
        data={selected}
        show={voucherModal}
        setShow={setVoucherModal}
        onSuccess={() => {
          setRefresh(!refresh);
          setVoucherModal(false);
        }}
      />
    </div>
  );
}

export default Kubus;
Kubus.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
