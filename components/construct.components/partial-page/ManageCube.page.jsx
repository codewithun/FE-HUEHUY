import {
  faBriefcase,
  faEdit,
  faFilePen,
  faInfinity,
  faTicket,
} from '@fortawesome/free-solid-svg-icons';
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
import InputImageComponent from '../../../components/base.components/input/InputImage.component';
// import ToggleComponent from '../../../components/construct.components/input/TogleComponet';
import { TextareaComponent } from '../../../components/base.components/input/Textarea.component';
import ToggleComponent from '../input/TogleComponet';
import { useState } from 'react';
import FormCorpAdComponent from '../form/FormCorpAd.component';
import InputOpenHours from '../input/InputOpenHours';
import UpdateCubeStatusModal from '../modal/UpdateCubeStatus.modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VoucherModal from '../modal/Voucher.modal';
import moment from 'moment';
import { useUserContext } from '../../../context/user.context';
// import CubeDatailComponent from './CubeDatail.component';

export default function ManageCubePage({
  scope,
  panel,
  title,
  corpId,
  token,
  noFilter,
}) {
  // const { accessActive, loading } = useAccessContext();
  const { profile: Profile } = useUserContext();
  const [modalCorpAds, setModalCorpAds] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [selected, setSelected] = useState(null);
  const scopeName = Object.entries(scope)?.at(0)?.at(0);
  const scopeValue = Object.entries(scope)?.at(0)?.at(1);
  const [voucherModal, setVoucherModal] = useState(false);
  const [formAds, setFormAds] = useState(false);

  const role = Profile?.corporate_user?.role?.id;
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
    <>
      {scopeValue && (
        <TableSupervisionComponent
          title={`Kubus ${title ? title : ''}`}
          // setToRefresh={refresh}
          fetchControl={{
            path: `${panel ? panel : 'admin'}/cubes`,
            bearer: token || null,
          }}
          customTopBar={role == 5 && <></>}
          includeFilters={
            !noFilter && [
              {
                column: scopeName,
                type: 'equal',
                value: scopeValue,
              },
            ]
          }
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
                      <p className="text-slate-500 text-sm">
                        {cube_type?.name}
                      </p>
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
                      <b className="limit__line__2">{ads?.at(0)?.title}</b>
                    </>
                  );
                },
              },
              {
                selector: 'address',
                label: 'Lokasi',
                sortable: true,
                width: '300px',
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
                  ads?.at(0)?.is_daily_grab
                    ? `${ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) ||
                    'Tidak ada'
                    } Promo / Hari`
                    : `${ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) ||
                    'Tidak ada'
                    } Promo`,
              },
              {
                selector: 'expired_at',
                label: 'Aktif Sampai',
                sortable: true,
                width: '200px',
                item: ({ inactive_at }) =>
                  inactive_at ? (
                    <DateFormatComponent date={inactive_at} />
                  ) : (
                    <FontAwesomeIcon icon={faInfinity} />
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
          // customDetail={(data) => {
          //   return <CubeDatailComponent data={data} />;
          // }}
          formControl={{
            contentType: 'multipart/form-data',
            customDefaultValue:
              scopeName == 'corporate_id'
                ? {
                  ...scope,
                  // Default sama seperti admin
                  'ads[is_daily_grab]': 0,
                  'ads[unlimited_grab]': 0,
                  content_type: 'promo',
                  cube_type_id: 1,
                  owner_user_id: null,
                  'ads[validation_type]': 'auto',
                  'ads[day_type]': 'custom',
                  target_type: 'all',
                  target_user_ids: [],
                  community_id: '',
                  is_information: [],
                  is_recommendation: [],
                  map_distance: 0,
                  'ads[description]': '',
                  'ads[detail]': '',
                  ...(panel === 'corporate' && scope?.corporate_id
                    ? { corporate_id: scope.corporate_id }
                    : {}),
                }
                : panel == 'corporate'
                  ? {
                    ...scope,
                    // Default sama seperti admin
                    'ads[is_daily_grab]': 0,
                    'ads[unlimited_grab]': 0,
                    content_type: 'promo',
                    cube_type_id: 1,
                    owner_user_id: null,
                    'ads[validation_type]': 'auto',
                    'ads[day_type]': 'custom',
                    target_type: 'all',
                    target_user_ids: [],
                    community_id: '',
                    is_information: [],
                    is_recommendation: [],
                    map_distance: 0,
                    'ads[description]': '',
                    'ads[detail]': '',
                    // Pastikan corporate_id terisi dari scope jika ada
                    ...(panel === 'corporate' && scope?.corporate_id
                      ? { corporate_id: scope.corporate_id }
                      : {}),
                  }
                  : {
                    ...scope,
                    // Default sama seperti admin (aman untuk admin juga)
                    'ads[is_daily_grab]': 0,
                    'ads[unlimited_grab]': 0,
                    content_type: 'promo',
                    cube_type_id: 1,
                    owner_user_id: null,
                    'ads[validation_type]': 'auto',
                    'ads[day_type]': 'custom',
                    target_type: 'all',
                    target_user_ids: [],
                    community_id: '',
                    is_information: [],
                    is_recommendation: [],
                    map_distance: 0,
                    'ads[description]': '',
                    'ads[detail]': '',
                  },
            custom: [
              {
                type: 'custom',
                custom: ({ formControl }) => {
                  return scopeName == 'world_id' ? (
                    panel == 'corporate' ? (
                      <SelectComponent
                        name="cube_type_id"
                        label="Tipe Kubus"
                        placeholder="Tipe Kubus..."
                        options={[
                          { label: 'Kubus Putih (KUPU)', value: 1 },
                          { label: 'Kubus Merah (KUME)', value: 2 },
                        ]}
                        {...formControl('cube_type_id')}
                      />
                    ) : (
                      <SelectComponent
                        name="cube_type_id"
                        label="Tipe Kubus"
                        placeholder="Tipe Kubus..."
                        // serverOptionControl={{
                        //   path: `admin/options/cube-type`,
                        // }}
                        options={[
                          { label: 'Kubus Putih (KUPU)', value: 1 },
                          { label: 'Kubus Merah (KUME)', value: 2 },
                        ]}
                        {...formControl('cube_type_id')}
                      />
                    )
                  ) : null;
                },
              },
              {
                type: 'custom',
                custom: ({ formControl, values }) => {
                  // console.log(panel);
                  return scopeName == 'world_id' ? (
                    <>
                      {panel == 'corporate' &&
                        values.find((i) => i.name == 'cube_type_id')?.value !=
                        2 ? (
                        <SelectComponent
                          name="user_id"
                          label="Pemilik"
                          placeholder="Pilih user..."
                          serverOptionControl={{
                            path: `corporate/options/user?${scopeName}=${corpId ? corpId : scopeValue
                              }`,
                          }}
                          {...formControl('user_id')}
                        />
                      ) : panel == 'admin' &&
                        values.find((i) => i.name == 'cube_type_id')?.value !=
                        2 ? (
                        <SelectComponent
                          name="user_id"
                          label="Pemilik"
                          placeholder="Pilih user..."
                          serverOptionControl={{
                            path: `${panel ? panel : 'admin'
                              }/options/user?${scopeName}=${scopeValue}`,
                          }}
                          {...formControl('user_id')}
                        />
                      ) : (
                        panel == 'admin' && (
                          <SelectComponent
                            name="corporate_id"
                            label="Pemilik (Mitra)"
                            placeholder="Pilih Mitra..."
                            serverOptionControl={{
                              path: `${panel ? panel : 'admin'
                                }/options/corporate?${scopeName}=${scopeValue}`,
                            }}
                            {...formControl('corporate_id')}
                          />
                        )
                      )}
                    </>
                  ) : null;
                },
              },

              {
                type: 'custom',
                custom: ({ formControl }) => {
                  return scopeName == 'corporate_id' ? (
                    <SelectComponent
                      name="world_id"
                      label="Dunia (opsional)"
                      placeholder="Pilih Dunia..."
                      serverOptionControl={{
                        path: `${panel ? panel : 'admin'
                          }/options/world?${scopeName}=${scopeValue}`,
                        // path: `admin/options/world`,
                      }}
                      {...formControl('world_id')}
                    />
                  ) : null;
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
                      errors={errors.filter((i) => i.name == 'address')?.error}
                    />
                  );
                },
              },
              {
                type: 'custom',
                custom: () => (
                  <>
                    <div className=" translate-y-10 font-semibold px-6 bg-white w-fit mx-auto">
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
                  // validations: { required: true },
                },
              },
              {
                type: 'custom',
                custom: ({ values, setValues }) => {
                  return (
                    values.find((val) => val.name == 'ads[promo_type]')
                      ?.value == 'offline' && (
                      <>
                        <p className="text-sm text-slate-600 font-semibold">
                          Lokasi Validasi
                        </p>
                        <div className="mx-10 hover:mx-8 hover:border-4 border-sky-500 rounded-lg">
                          <InputMapComponent
                            name="map"
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
                        ? values.find((i) => i.name == 'start_validate')?.value
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
                custom: ({ values, setValues, errors }) => (
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
                        ? values.find((i) => i.name == 'finish_validate')?.value
                        : ''
                    }
                    errors={
                      errors.filter((i) => i.name == 'finish_validate')?.error
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

              // const newAd = {
              //   'ads[title]': data?.ads[0].title,
              //   'ads[description]': data?.ads[0].description,
              //   'ads[ad_category_id]': data?.ads[0].ad_category_id,
              //   'ads[promo_type]': data?.ads[0].promo_type,
              //   'ads[is_daily_grab]': data?.ads[0].is_daily_grab,
              //   'ads[max_grab]': data?.ads[0].max_grab,
              // };

              return {
                cube_type_id: data?.cube_type_id,
                color: data?.color,
                address: data?.address,
                map_lat: data?.map_lat,
                map_lng: data?.map_lng,
                status: data?.status,
                image: data?.picture_source,
                'cube_tags[0][link]': data?.tags?.at(0)?.link,
                'ads[promo_type]': data?.ads?.at(0)?.promo_type,
                ...worldID,
                ...userID,
                ...corpotareID,
                // Tambahan agar corporate_id tetap terisi saat edit pada panel corporate
                ...(panel === 'corporate' && scope?.corporate_id
                  ? { corporate_id: scope.corporate_id }
                  : {}),
              };
            },
            contentType: 'multipart/form-data',
            custom: [
              {
                type: 'custom',
                custom: ({ formControl }) => {
                  return scopeName == 'world_id' ? (
                    panel == 'corporate' ? (
                      <SelectComponent
                        name="cube_type_id"
                        label="Tipe Kubus "
                        placeholder="Tipe Kubus..."
                        options={[
                          { label: 'Kubus Putih (KUPU)', value: 1 },
                          { label: 'Kubus Merah (KUME)', value: 2 },
                        ]}
                        {...formControl('cube_type_id')}
                      />
                    ) : (
                      <SelectComponent
                        name="cube_type_id"
                        label="Tipe Kubus"
                        placeholder="Tipe Kubus..."
                        // serverOptionControl={{
                        //   path: `admin/options/cube-type`,
                        // }}
                        options={[
                          { label: 'Kubus Putih (KUPU)', value: 1 },
                          { label: 'Kubus Merah (KUME)', value: 2 },
                        ]}
                        {...formControl('cube_type_id')}
                      />
                    )
                  ) : null;
                },
              },
              {
                type: 'custom',
                custom: ({ formControl, values, setValues }) => {
                  return scopeName == 'world_id' ? (
                    <>
                      {panel == 'corporate' &&
                        values.find((i) => i.name == 'cube_type_id')?.value ==
                        2 ? (
                        <div className="mb-3">
                          <CheckboxComponent
                            label="Milik Peroragnan"
                            onChange={() => {
                              setValues([
                                ...values.filter(
                                  (i) =>
                                    i.name != 'is_presonal' &&
                                    i.name != 'corporate_id' &&
                                    i.name != 'user_id'
                                ),
                                {
                                  name: 'is_presonal',
                                  value: !values.find(
                                    (i) => i.name == 'is_presonal'
                                  )?.value,
                                },
                              ]);
                            }}
                            checked={
                              values?.find((i) => i.name == 'is_presonal')
                                ?.value
                            }
                          />
                        </div>
                      ) : null}
                      {panel == 'corporate' ? (
                        values.find((i) => i.name == 'cube_type_id')?.value !=
                          2 ? (
                          <SelectComponent
                            name="user_id"
                            label="Pemilik"
                            placeholder="Pilih user..."
                            serverOptionControl={{
                              path: `${panel ? panel : 'admin'
                                }/options/user?${scopeName}=${scopeValue}`,
                            }}
                            {...formControl('user_id')}
                          />
                        ) : null
                      ) : panel == 'admin' &&
                        values.find((i) => i.name == 'cube_type_id')?.value !=
                        2 ? (
                        <SelectComponent
                          name="user_id"
                          label="Pemilik"
                          placeholder="Pilih user..."
                          serverOptionControl={{
                            path: `${panel ? panel : 'admin'
                              }/options/user?${scopeName}=${scopeValue}`,
                          }}
                          {...formControl('user_id')}
                        />
                      ) : (
                        <SelectComponent
                          name="corporate_id"
                          label="Pemilik (Mitra)"
                          placeholder="Pilih Mitra..."
                          serverOptionControl={{
                            path: `${panel ? panel : 'admin'
                              }/options/corporate?${scopeName}=${scopeValue}`,
                          }}
                          {...formControl('corporate_id')}
                        />
                      )}
                    </>
                  ) : null;
                },
              },

              // {
              //   type: 'custom',
              //   custom: ({ formControl }) => {
              //     return scopeName == 'corporate_id' ? (
              //       <SelectComponent
              //         name="world_id"
              //         label="Dunia (opsional)"
              //         placeholder="Pilih Dunia..."
              //         serverOptionControl={{
              //           path: `${panel ? panel : 'admin'}/options/world`,
              //         }}
              //         {...formControl('world_id')}
              //       />
              //     ) : null;
              //   },
              // },
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
                  return values?.find((i) => i.name == 'change_map')?.value ==
                    true ? (
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
                  ) : null;
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
                      errors={errors.filter((i) => i.name == 'address')?.error}
                    />
                  );
                },
              },
              {
                type: 'custom',
                custom: ({ values, setValues }) => {
                  return (
                    values.find((val) => val.name == 'ads[promo_type]')
                      ?.value == 'offline' && (
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
              {
                col: 6,
                type: 'custom',
                custom: ({ values, setValues }) => {
                  return (
                    <div className="mt-3">
                      <ToggleComponent
                        name={'map_cube'}
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
                    </div>
                  );
                },
              },
            ],
          }}
          actionControl={{
            except:
              role == 5 ? ['detail', 'edit', 'delete'] : ['detail', 'edit'],
            include: (data, { setModalForm, setDataSelected }) => {
              return (
                <>
                  {role != 5 ? (
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
                  ) : null}
                  {role != 5 ? (
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
                  ) : null}
                  {panel == 'corporate' && role != 5 ? (
                    <ButtonComponent
                      icon={faBriefcase}
                      label={'Iklan Mitra'}
                      variant="outline"
                      paint="primary"
                      size={'xs'}
                      rounded
                      onClick={() => {
                        setSelected(data);
                        setFormAds('mitra');
                      }}
                    />
                  ) : null}
                  {panel == 'admin' && (
                    <ButtonComponent
                      // icon={faBriefcase}
                      label={'Ubah Status'}
                      variant="outline"
                      paint="warning"
                      size={'xs'}
                      rounded
                      onClick={() => {
                        setSelected(data);
                        setUpdateStatus(true);
                      }}
                    />
                  )}
                  {panel == 'admin' &&
                    data.ads.at(0)?.promo_type == 'online' ? (
                    <ButtonComponent
                      icon={faTicket}
                      label={'Voucher'}
                      variant="outline"
                      paint="secondary"
                      size={'sm'}
                      rounded
                      onClick={() => {
                        setSelected(data);
                        voucherModal(true);
                      }}
                    />
                  ) : null}
                </>
              );
            },
          }}
        />
      )}
      {panel == 'corporate' && scopeName == 'world_id' && (
        <FloatingPageComponent
          show={modalCorpAds}
          onClose={() => {
            setModalCorpAds(false);
            setSelected(false);
          }}
          size="lg"
          className="bg-background"
        >
          <FormCorpAdComponent data={selected} token={token} />
        </FloatingPageComponent>
      )}
      {panel == 'admin' && (
        <UpdateCubeStatusModal
          data={selected}
          show={updateStatus}
          setShow={setUpdateStatus}
          token={token}
          onSuccess={() => {
            setRefresh(!refresh);
            setUpdateStatus(false);
          }}
        />
      )}
      {panel == 'admin' && (
        <VoucherModal
          data={selected}
          show={voucherModal}
          setShow={setVoucherModal}
          token={token || null}
          onSuccess={() => {
            setRefresh(!refresh);
            setVoucherModal(false);
          }}
        />
      )}

      <FloatingPageComponent
        show={formAds}
        title={`${formAds == 'mitra'
          ? selected?.ads.some((obj) => obj.type == 'mitra')
            ? 'Ubah iklan Mitra'
            : 'Tambahkan iklan Mitra'
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
                formAds == 'mitra'
                  ? selected?.ads.some((obj) => obj.type != 'mitra')
                    ? `admin/ads`
                    : `admin/ads/${selected?.id}`
                  : selected?.ads?.at(0)?.id
                    ? `admin/ads/${selected?.ads?.at(0)?.id}`
                    : `admin/ads`,
              contentType: 'multipart/form-data',
            }}
            defaultValue={
              formAds == 'mitra'
                ? {
                  ...selected?.ads.filter((obj) => obj.type == 'mitra').at(0),
                  cube_id: selected?.id,
                  type: 'mitra',
                }
                : selected?.ads?.at(0)?.id
                  ? {
                    _method: 'PUT',
                    title: selected?.ads[0].title,
                    description: selected?.ads[0].description,
                    ad_category_id: selected?.ads[0].ad_category_id,
                    promo_type: selected?.ads[0].promo_type,
                    is_daily_grab: selected?.ads[0].is_daily_grab,
                    max_grab: selected?.ads[0].max_grab,
                    cube_id: selected?.id,
                    type: selected?.ads[0].type,
                    image: selected?.ads[0].picture_source,
                    ...validate,
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
                custom: ({ values, setValues, errors }) => (
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
                col: 6,
                type: 'custom',
                custom: ({ values, setValues, errors }) => (
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
                custom: ({ values, setValues, errors }) => (
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
    </>
  );
}
