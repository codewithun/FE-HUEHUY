import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../../components/construct.components/layout/Admin.layout';

import {
  ButtonComponent,
  CheckboxComponent,
  DateFormatComponent,
  FloatingPageComponent,
  FormSupervisionComponent,
  InputComponent,
  InputTimeComponent,
  InputMapComponent,
  InputNumberComponent,
  SelectComponent,
  TableSupervisionComponent,
} from '../../../components/base.components';

import {
  faEdit,
  faFilePen,
  faInfinity,
  faTicket,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie';
import moment from 'moment';

// Ubah import menjadi named import
import { InputImageComponent } from '../../../components/base.components/input/InputImage.component';
import { TextareaComponent } from '../../../components/base.components/input/Textarea.component';
import InputOpenHours from '../../../components/construct.components/input/InputOpenHours';
import ToggleComponent from '../../../components/construct.components/input/TogleComponet';
import UpdateCubeStatusModal from '../../../components/construct.components/modal/UpdateCubeStatus.modal';
import VoucherModal from '../../../components/construct.components/modal/Voucher.modal';
import GrabListComponent from '../../../components/construct.components/partial-page/GrabList.component';
import { useUserContext } from '../../../context/user.context';
import { token_cookie_name } from '../../../helpers';

// Tambahkan debug untuk komponen yang bermasalah
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[DEBUG typeof]', {
    // dari barrel base.components
    FormSupervisionComponent: typeof FormSupervisionComponent,
    TableSupervisionComponent: typeof TableSupervisionComponent,
    FloatingPageComponent: typeof FloatingPageComponent,
    ButtonComponent: typeof ButtonComponent,
    CheckboxComponent: typeof CheckboxComponent,
    DateFormatComponent: typeof DateFormatComponent,
    InputComponent: typeof InputComponent,
    InputMapComponent: typeof InputMapComponent,
    InputNumberComponent: typeof InputNumberComponent,
    SelectComponent: typeof SelectComponent,

    // dari path spesifik
    InputImageComponent: typeof InputImageComponent,
    TextareaComponent: typeof TextareaComponent,
    ToggleComponent: typeof ToggleComponent,
    InputOpenHours: typeof InputOpenHours,
  });
}

function Kubus() {
  // === guards (biar konsisten) ===
  const getCT = (values) =>
    values.find(i => i.name === 'content_type')?.value || 'promo';
  const isInfo = (values) =>
    !!values.find(i => i.name === 'is_information')?.value?.at?.(0);
  const isCT = (values, key) => getCT(values) === key;
  const isPromoOrVoucher = (values) => ['promo', 'voucher'].includes(getCT(values));

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
                  `${ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) ||
                  'Tidak ada'
                  } Promo / Hari`
                ) : (
                  `${ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) ||
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
          customDefaultValue: { 'ads[is_daily_grab]': 0, 'content_type': 'promo', 'cube_type_id': 1 },
          custom: [
            // Content Type Selection (Radio Buttons)
            // === JENIS KONTEN (radio bulat hijau, sama gaya dgn "Hanya Di Waktu Tertentu") ===
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInformation = values.find((i) => i.name == 'is_information')?.value?.at?.(0);
                const currentTab = values.find((i) => i.name == 'content_type')?.value || 'promo';

                const handleContentTypeChange = (newType) => {
                  // set content_type
                  let next = [
                    ...values.filter((i) => i.name !== 'content_type'),
                    { name: 'content_type', value: newType },
                  ];

                  // auto-reset is_information jika bukan mode informasi
                  if (newType !== 'kubus-informasi') {
                    next = [
                      ...next.filter((i) => i.name !== 'is_information'),
                      { name: 'is_information', value: [] },
                    ];
                  }

                  // auto-set cube putih utk promo/voucher
                  if (['promo', 'voucher'].includes(newType)) {
                    next = [
                      ...next.filter((i) => i.name !== 'cube_type_id'),
                      { name: 'cube_type_id', value: 1 },
                    ];
                  }

                  setValues(next);
                };

                const options = [
                  { key: 'promo', label: 'Promo' },
                  { key: 'voucher', label: 'Voucher' },
                  { key: 'iklan', label: 'Iklan' },
                ];

                return (
                  <div className="space-y-3">
                    <div className="font-semibold text-base text-slate-700">Jenis Konten</div>

                    {/* Kontainer radio seperti "Hanya Di Waktu Tertentu" */}
                    <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                      <div className="flex items-center gap-6">
                        {options.map(opt => {
                          const checked = currentTab === opt.key;
                          return (
                            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="content_type"
                                value={opt.key}
                                checked={checked}
                                disabled={!!isInformation} // kalau kubus informasi aktif, kunci pilihan
                                onChange={() => handleContentTypeChange(opt.key)}
                                className="h-4 w-4 accent-green-600 disabled:opacity-50"
                                style={{ accentColor: '#16a34a' }} // fallback
                              />
                              <span className={checked ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              },
            },
            // Checkbox untuk Kubus Informasi
            // 1) tampilkan checkbox dg style yang sama seperti "Rekomendasi Di Beranda"
            {
              type: 'check',
              construction: {
                name: 'is_information',
                options: [{ label: 'Kubus Informasi', value: 1 }],
              },
            },

            // 2) watcher kecil untuk sinkronkan content_type
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInfo = !!values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const ct = values.find(i => i.name === 'content_type')?.value || 'promo';

                // set ke 'kubus-informasi' saat dicentang
                if (isInfo && ct !== 'kubus-informasi') {
                  setValues([
                    ...values.filter(i => i.name !== 'content_type'),
                    { name: 'content_type', value: 'kubus-informasi' },
                  ]);
                }

                // kembalikan ke 'promo' saat tidak dicentang
                if (!isInfo && ct === 'kubus-informasi') {
                  setValues([
                    ...values.filter(i => i.name !== 'content_type'),
                    { name: 'content_type', value: 'promo' },
                  ]);
                }

                return null; // tidak render UI apa-apa
              },
            },

            // Rekomendasi Section (moved here)
            {
              type: 'check',
              construction: {
                name: 'is_recommendation',
                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
              },
            },

            // Basic Cube Settings (always visible)
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

            // Pemilik Section
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const cubeType = values.find(i => i.name == 'cube_type_id')?.value;
                const isInfo = !!values.find(i => i.name === 'is_information')?.value?.at?.(0);

                if (isInfo) return null; // sembunyikan saat Kubus Informasi

                return (
                  <>
                    {cubeType == 2 ? (
                      <SelectComponent
                        name="corporate_id"
                        label="Pemilik (Mitra)"
                        placeholder="Pilih Mitra..."
                        serverOptionControl={{ path: `admin/options/corporate` }}
                        {...formControl('corporate_id')}
                        searchable
                      />
                    ) : (
                      <SelectComponent
                        name="user_id"
                        label="Pemilik"
                        placeholder="Pilih user..."
                        serverOptionControl={{ path: `admin/options/user` }}
                        {...formControl('user_id')}
                        searchable
                      />
                    )}
                  </>
                );
              },
            },

            // Cube Logo/Image Section
            {
              col: 4,
              type: 'custom',
              custom: ({ values, formControl }) => {
                const cubeType = values.find(
                  (i) => i.name == 'cube_type_id'
                )?.value;

                if (!InputImageComponent) {
                  // eslint-disable-next-line no-console
                  console.error('InputImageComponent is undefined');
                  return <div>Error: InputImageComponent not found</div>;
                }

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

            // === CONTENT SECTIONS BY TAB ===

            // Kubus Informasi Content
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const info = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                if (!info) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-lg text-slate-700 border-b pb-2">
                      Kubus Informasi
                    </div>

                    {/* Link Youtube (opsional) */}
                    <InputComponent
                      name="link_information"
                      label="Link Youtube"
                      placeholder="Masukkan link youtube"
                      {...formControl('link_information')}
                    />

                    {/* Judul Iklan (WAJIB) */}
                    <InputComponent
                      name="ads[title]"
                      label="Judul Iklan"
                      placeholder="Masukan Judul Iklan..."
                      {...formControl('ads[title]')}
                      validations={{ required: true }}
                    />

                    {/* Deskripsi Iklan (WAJIB) */}
                    {TextareaComponent && (
                      <TextareaComponent
                        name="ads[description]"
                        label="Deskripsi Iklan"
                        placeholder="Masukan Deskripsi Iklan..."
                        {...formControl('ads[description]')}
                        rows={5}
                        validations={{ required: true }}
                      />
                    )}
                  </div>
                );
              },
            },

            // Promo/Voucher Content
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => { // Tambahkan setValues di parameter
                const isInformation = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-lg text-slate-700 border-b pb-2">
                      {contentType === 'promo' ? 'Promo' : 'Voucher'}
                    </div>

                    {/* Judul (WAJIB) */}
                    <InputComponent
                      name="ads[title]"
                      label={`Judul ${contentType === 'promo' ? 'Promo' : 'Voucher'}`}
                      placeholder={`Masukan Judul ${contentType === 'promo' ? 'Promo' : 'Voucher'}...`}
                      {...formControl('ads[title]')}
                      validations={{ required: true }}
                    />

                    {/* Deskripsi (WAJIB) */}
                    {TextareaComponent && (
                      <TextareaComponent
                        name="ads[description]"
                        label={`Deskripsi ${contentType === 'promo' ? 'Promo' : 'Voucher'}`}
                        placeholder={`Masukan Deskripsi ${contentType === 'promo' ? 'Promo' : 'Voucher'}...`}
                        {...formControl('ads[description]')}
                        rows={5}
                        validations={{ required: true }}
                      />
                    )}

                    {/* Level UMKM and Production fields in row */}
                    <div className="grid grid-cols-3 gap-4">
                      <SelectComponent
                        name="ads[level_umkm]"
                        label="Level UMKM (Opsional)"
                        placeholder="..."
                        {...formControl('ads[level_umkm]')}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                        ]}
                      />
                      <InputNumberComponent
                        name="ads[max_production_per_day]"
                        label="Produksi Per Hari (Opsional)"
                        placeholder="..."
                        {...formControl('ads[max_production_per_day]')}
                      />
                      <InputNumberComponent
                        name="ads[sell_per_day]"
                        label="Penjualan Per Hari (Opsional)"
                        placeholder="..."
                        {...formControl('ads[sell_per_day]')}
                      />
                    </div>

                    {/* Category and Promo Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <SelectComponent
                        name="ads[ad_category_id]"
                        label="Kategori Iklan"
                        placeholder="Pilih Kategori Iklan..."
                        {...formControl('ads[ad_category_id]')}
                        serverOptionControl={{ path: 'admin/options/ad-category' }}
                      />
                      {/* Tipe Promo (WAJIB) */}
                      <SelectComponent
                        name="ads[promo_type]"
                        label="Tipe Promo"
                        placeholder="Pilih Tipe Promo..."
                        {...formControl('ads[promo_type]')}
                        options={[
                          { label: 'Online', value: 'online' },
                          { label: 'Offline', value: 'offline' },
                        ]}
                      />
                    </div>

                    {/* Link untuk tipe online */}
                    {values.find(i => i.name === 'ads[promo_type]')?.value === 'online' && (
                      <InputComponent
                        type="url"
                        name="cube_tags[0][link]"
                        label="Tautan/Link"
                        placeholder="Masukkan tautan/link promo online..."
                        onChange={(e) => {
                          setValues([
                            ...values.filter(i => i.name !== 'cube_tags[0][link]'),
                            { name: 'cube_tags[0][link]', value: e || '' },
                          ]);
                        }}
                        value={values.find(i => i.name === 'cube_tags[0][link]')?.value || ''}
                        validations={{ required: true }}
                      />
                    )}
                  </div>
                );
              },
            },

            // Maps and Address for Offline Promo/Voucher (moved here)
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                if (!isPromoOrVoucher(values)) return null; // hanya promo|voucher
                if (values.find((val) => val.name == 'ads[promo_type]')?.value !== 'offline') return null;

                return (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-slate-600 font-semibold">Lokasi Validasi</p>
                    <div className="mx-10 hover:mx-8 hover:border-4 border-green-500 rounded-lg">
                      <InputMapComponent
                        name="map-tag"
                        onChange={(e) => {
                          setValues([
                            ...values.filter(
                              (i) => ![
                                'cube_tags[0][map_lat]',
                                'cube_tags[0][map_lng]',
                                'cube_tags[0][address]',
                                'map_lat',
                                'map_lng',
                                'address',
                              ].includes(i.name)
                            ),
                            { name: 'cube_tags[0][map_lat]', value: e?.lat },
                            { name: 'cube_tags[0][map_lng]', value: e?.lng },
                            { name: 'cube_tags[0][address]', value: e?.address },
                            { name: 'map_lat', value: e?.lat },
                            { name: 'map_lng', value: e?.lng },
                            { name: 'address', value: e?.address },
                          ]);
                        }}
                      />
                    </div>
                    <InputComponent
                      name="cube_tags[0][address]"
                      label="Alamat Validasi"
                      placeholder="Masukan alamat..."
                      onChange={(e) => {
                        setValues([
                          ...values.filter((i) => i.name != 'cube_tags[0][address]'),
                          { name: 'cube_tags[0][address]', value: e },
                          { name: 'address', value: e },
                        ]);
                      }}
                      value={values.find((i) => i.name == 'cube_tags[0][address]')?.value || ''}
                      errors={errors.filter((i) => i.name == 'cube_tags[0][address]')?.error}
                    />
                  </div>
                );
              },
            },

            // Iklan Content
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => { // Tambahkan setValues di parameter
                const isInformation = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                if (isInformation || contentType !== 'iklan') return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-lg text-slate-700 border-b pb-2">
                      Iklan
                    </div>

                    {/* Judul */}
                    <InputComponent
                      name="ads[title]"
                      label="Judul Iklan"
                      placeholder="Masukan Judul Iklan..."
                      {...formControl('ads[title]')}
                    />

                    {/* Deskripsi */}
                    {TextareaComponent && (
                      <TextareaComponent
                        name="ads[description]"
                        label="Deskripsi Iklan"
                        placeholder="Masukan Deskripsi Iklan..."
                        {...formControl('ads[description]')}
                        rows={5}
                      />
                    )}

                    {/* Level UMKM and Production fields in row */}
                    <div className="grid grid-cols-3 gap-4">
                      <SelectComponent
                        name="ads[level_umkm]"
                        label="Level UMKM (Opsional)"
                        placeholder="..."
                        {...formControl('ads[level_umkm]')}
                        options={[
                          { label: '1', value: 1 },
                          { label: '2', value: 2 },
                          { label: '3', value: 3 },
                        ]}
                      />
                      <InputNumberComponent
                        name="ads[max_production_per_day]"
                        label="Produksi Per Hari (Opsional)"
                        placeholder="..."
                        {...formControl('ads[max_production_per_day]')}
                      />
                      <InputNumberComponent
                        name="ads[sell_per_day]"
                        label="Penjualan Per Hari (Opsional)"
                        placeholder="..."
                        {...formControl('ads[sell_per_day]')}
                      />
                    </div>

                    {/* Category and Promo Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <SelectComponent
                        name="ads[ad_category_id]"
                        label="Kategori Iklan"
                        placeholder="Pilih Kategori Iklan..."
                        {...formControl('ads[ad_category_id]')}
                        serverOptionControl={{
                          path: 'admin/options/ad-category',
                        }}
                      />
                      <SelectComponent
                        name="ads[promo_type]"
                        label="Tipe Promo"
                        placeholder="pilih Tipe Promo..."
                        {...formControl('ads[promo_type]')}
                        options={[
                          { label: 'Online', value: 'online' },
                          { label: 'Offline', value: 'offline' },
                        ]}
                      />
                    </div>

                    {/* Link untuk tipe online */}
                    {values.find(i => i.name === 'ads[promo_type]')?.value === 'online' && (
                      <InputComponent
                        type="url"
                        name="cube_tags[0][link]"
                        label="Tautan/Link"
                        placeholder="Masukkan tautan/link promo online..."
                        onChange={(e) => {
                          setValues([
                            ...values.filter(i => i.name !== 'cube_tags[0][link]'),
                            { name: 'cube_tags[0][link]', value: e || '' },
                          ]);
                        }}
                        value={values.find(i => i.name === 'cube_tags[0][link]')?.value || ''}
                        validations={{ required: true }}
                      />
                    )}
                  </div>
                );
              },
            },

            // Offline Iklan Location Validation
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                if (contentType !== 'iklan') return null;
                if (values.find((i) => i.name == 'ads[promo_type]')?.value !== 'offline') return null;

                return (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm text-slate-600 font-semibold">Lokasi Validasi</p>
                    <div className="mx-10 hover:mx-8 hover:border-4 border-green-500 rounded-lg transition">
                      <InputMapComponent
                        name="iklan-map"
                        onChange={(e) => {
                          setValues([
                            ...values.filter(
                              (i) =>
                                ![
                                  'cube_tags[0][map_lat]',
                                  'cube_tags[0][map_lng]',
                                  'cube_tags[0][address]',
                                  'map_lat',
                                  'map_lng',
                                  'address',
                                ].includes(i.name)
                            ),
                            { name: 'cube_tags[0][map_lat]', value: e?.lat },
                            { name: 'cube_tags[0][map_lng]', value: e?.lng },
                            { name: 'cube_tags[0][address]', value: e?.address },
                            { name: 'map_lat', value: e?.lat },
                            { name: 'map_lng', value: e?.lng },
                            { name: 'address', value: e?.address },
                          ]);
                        }}
                      />
                    </div>

                    <InputComponent
                      name="cube_tags[0][address]"
                      label="Alamat Validasi"
                      placeholder="Masukkan alamat..."
                      onChange={(e) => {
                        setValues([
                          ...values.filter((i) => i.name != 'cube_tags[0][address]'),
                          { name: 'cube_tags[0][address]', value: e },
                          { name: 'address', value: e },
                        ]);
                      }}
                      value={values.find((i) => i.name == 'cube_tags[0][address]')?.value || ''}
                    />
                  </div>
                );
              },
            },

            // === IMAGES SECTION ===

            // 3 Gambar untuk semua konten (Promo, Voucher, Iklan, Kubus Informasi)
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const ct = getCT(values); // 'promo' | 'voucher' | 'iklan' | 'kubus-informasi'
                const show =
                  ct === 'promo' || ct === 'voucher' || ct === 'iklan' || isInfo(values);
                if (!show) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-base text-slate-700">
                      {isInfo(values) ? 'Gambar Kubus Informasi' : 'Gambar Konten'}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {InputImageComponent && (
                        <>
                          <InputImageComponent name="ads[image_1]" label="Gambar 1" {...formControl('ads[image_1]')} />
                          <InputImageComponent name="ads[image_2]" label="Gambar 2" {...formControl('ads[image_2]')} />
                          <InputImageComponent name="ads[image_3]" label="Gambar 3" {...formControl('ads[image_3]')} />
                        </>
                      )}
                    </div>
                  </div>
                );
              },
            },

            // Banner Image
            {
              type: 'custom',
              custom: ({ formControl }) => {

                if (!InputImageComponent) {
                  // eslint-disable-next-line no-console
                  console.error('InputImageComponent is undefined');
                  return <div>Error: InputImageComponent not found</div>;
                }

                return (
                  <div className="mt-6">
                    <div className="font-semibold text-base text-slate-700 mb-4">
                      Banner Gambar (Opsional)
                    </div>
                    <div className="px-32">
                      <InputImageComponent
                        name="ads[image]"
                        label="Banner"
                        {...formControl('ads[image]')}
                      />
                    </div>
                  </div>
                );
              },
            },

            // === PROMO/VOUCHER SPECIFIC SECTIONS ===

            // Promo Settings (Unlimited, Daily, Quantity)
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-base text-slate-700">
                      Pengaturan {contentType === 'promo' ? 'Promo' : 'Voucher'}
                    </div>

                    {/* Promo Unlimited and Daily Settings */}
                    <div className="flex gap-4">
                      <CheckboxComponent
                        label="Promo Tak Terbatas"
                        name="ads[unlimited_grab]"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[unlimited_grab]'),
                            {
                              name: 'ads[unlimited_grab]',
                              value: !values.find((i) => i.name == 'ads[unlimited_grab]')?.value ? 1 : 0,
                            },
                          ]);
                        }}
                        checked={values?.find((i) => i.name == 'ads[unlimited_grab]')?.value || false}
                      />

                      <CheckboxComponent
                        label="Promo Harian"
                        name="ads[is_daily_grab]"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[is_daily_grab]'),
                            {
                              name: 'ads[is_daily_grab]',
                              value: !values.find((i) => i.name == 'ads[is_daily_grab]')?.value ? 1 : 0,
                            },
                          ]);
                        }}
                        checked={values?.find((i) => i.name == 'ads[is_daily_grab]')?.value}
                        disabled={values?.find((i) => i.name == 'ads[unlimited_grab]')?.value || false}
                      />
                    </div>

                    {/* Layout baru sesuai permintaan */}
                    {/* Row 1: Jumlah Promo + Batas Waktu Validasi */}
                    <div className="grid grid-cols-2 gap-4">
                      <InputNumberComponent
                        type="number"
                        name="ads[max_grab]"
                        label={
                          values?.find((i) => i.name == 'ads[is_daily_grab]')?.value
                            ? 'Jumlah Promo Per Hari'
                            : 'Jumlah Promo'
                        }
                        placeholder={
                          values?.find((i) => i.name == 'ads[is_daily_grab]')?.value
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
                        value={values.find((i) => i.name == 'ads[max_grab]')?.value}
                        error={errors.find((i) => i.name == 'ads[max_grab]')?.error}
                        disabled={values?.find((i) => i.name == 'ads[unlimited_grab]')?.value}
                      />
                      <InputTimeComponent
                        name="validation_time_limit"
                        label="Batas Waktu Validasi"
                        placeholder="Masukan Batas Waktu Validasi..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'validation_time_limit'),
                            { name: 'validation_time_limit', value: v }, // format HH:mm
                          ]);
                        }}
                        value={values.find((i) => i.name === 'validation_time_limit')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>

                    {/* Row 2: Berlaku Mulai + Berakhir Pada */}
                    <div className="grid grid-cols-2 gap-4">
                      <InputComponent
                        type="date"
                        name="ads[start_validate]"
                        label="Berlaku Mulai"
                        placeholder="Pilih Tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[start_validate]'),
                            { name: 'ads[start_validate]', value: moment(e).format('DD-MM-YYYY') },
                          ]);
                        }}
                        value={values.find((i) => i.name == 'ads[start_validate]')?.value || ''}
                        errors={errors.filter((i) => i.name == 'ads[start_validate]')?.error}
                        validations={{ required: true }}
                      />
                      <InputComponent
                        type="date"
                        name="ads[finish_validate]"
                        label="Berakhir Pada"
                        placeholder="Pilih Tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[finish_validate]'),
                            { name: 'ads[finish_validate]', value: moment(e)?.format('DD-MM-YYYY') },
                          ]);
                        }}
                        value={values.find((i) => i.name == 'ads[finish_validate]')?.value || ''}
                        errors={errors.filter((i) => i.name == 'ads[finish_validate]')?.error}
                        validations={{ required: true }}
                      />
                    </div>

                    {/* Row 3: Jam Mulai + Jam Berakhir */}
                    <div className="grid grid-cols-2 gap-4">
                      <InputTimeComponent
                        name="jam_mulai"
                        label="Jam Mulai"
                        placeholder="Pilih Jam..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'jam_mulai'),
                            { name: 'jam_mulai', value: v }, // HH:mm
                          ]);
                        }}
                        value={values.find((i) => i.name === 'jam_mulai')?.value || ''}
                        validations={{ required: true }}
                      />
                      <InputTimeComponent
                        name="jam_berakhir"
                        label="Jam Berakhir"
                        placeholder="Pilih Jam..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'jam_berakhir'),
                            { name: 'jam_berakhir', value: v }, // HH:mm
                          ]);
                        }}
                        value={values.find((i) => i.name === 'jam_berakhir')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>

                    {/* Row 4: Hanya Di Waktu Tertentu (versi hijau, mirip screenshot) */}
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-slate-700">
                        Hanya Di Waktu Tertentu
                      </div>

                      {/* Segmented radio -> ganti ke radio bulat (accent hijau) */}
                      <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                        <div className="flex items-center gap-6">
                          {[
                            { key: 'weekend', label: 'Weekend' },
                            { key: 'weekday', label: 'Weekdays' },
                            { key: 'custom', label: 'Hari Lain' },
                          ].map(opt => {
                            const checked = values.find(i => i.name == 'day_type')?.value === opt.key;

                            return (
                              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="day_type"
                                  value={opt.key}
                                  checked={checked}
                                  onChange={() => {
                                    // set day_type
                                    const next = [
                                      ...values.filter(i => i.name !== 'day_type'),
                                      { name: 'day_type', value: opt.key },
                                    ];

                                    // bersihkan pilihan hari kustom
                                    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                    const cleaned = next.filter(i => !dayNames.some(d => i.name === `custom_days[${d}]`));

                                    // prefill utk weekend/weekday (agar pill hari di bawah tampil aktif)
                                    if (opt.key !== 'custom') {
                                      const preset = {
                                        weekend: { saturday: true, sunday: true },
                                        weekday: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
                                      }[opt.key] || {};
                                      const injected = Object.entries(preset).map(([d, v]) => ({
                                        name: `custom_days[${d}]`,
                                        value: v
                                      }));
                                      setValues([...cleaned, ...injected]);
                                    } else {
                                      setValues(cleaned);
                                    }
                                  }}
                                  className="h-4 w-4 accent-green-600"
                                  style={{ accentColor: '#16a34a' }} // fallback kalau Tailwind accent-color belum aktif
                                />
                                <span className={checked ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                                  {opt.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      {/* Baris kedua: “Hanya Di Hari” dengan pill hari */}
                      <div className="font-medium text-sm text-slate-700">
                        Hanya Di Hari
                      </div>
                      {(() => {
                        const dayType = values.find(i => i.name == 'day_type')?.value || 'custom';
                        const isCustom = dayType === 'custom';

                        const days = [
                          { label: 'Senin', key: 'monday' },
                          { label: 'Selasa', key: 'tuesday' },
                          { label: 'Rabu', key: 'wednesday' },
                          { label: 'Kamis', key: 'thursday' },
                          { label: 'Jumat', key: 'friday' },
                          { label: 'Sabtu', key: 'saturday' },
                          { label: 'Minggu', key: 'sunday' },
                        ];

                        // status terpilih
                        const selected = (k) =>
                          !!values.find(i => i.name === `custom_days[${k}]`)?.value;

                        return (
                          <div className="flex flex-wrap gap-2">
                            {days.map(d => {
                              const active = selected(d.key);
                              return (
                                <button
                                  type="button"
                                  key={d.key}
                                  onClick={() => {
                                    if (!isCustom) return; // weekend/weekday = readonly
                                    const exists = values.find(i => i.name === `custom_days[${d.key}]`)?.value || false;
                                    setValues([
                                      ...values.filter(i => i.name !== `custom_days[${d.key}]`),
                                      { name: `custom_days[${d.key}]`, value: !exists },
                                    ]);
                                  }}
                                  className={[
                                    "px-3 py-1.5 rounded-md border text-sm font-medium transition",
                                    active
                                      ? "bg-green-600 text-white border-green-600 shadow"
                                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-400",
                                    isCustom ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
                                  ].join(' ')}
                                >
                                  {d.label}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              },
            },

            // === OPENING HOURS SECTION ===

            // Opening Hours Toggle and Input
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                if (contentType === 'kubus-informasi' || isInformation || contentType === 'iklan') return null;

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
                            value: !values.find((i) => i.name == 'openHours')?.value,
                          },
                        ])
                      }
                      checked={values?.find((i) => i.name == 'openHours')?.value}
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
            let corporateID = data.corporate_id ? { corporate_id: data.corporate_id } : null;

            // tentukan content_type dari data
            const ad = data?.ads?.[0];
            const contentType =
              data?.is_information
                ? 'kubus-informasi'
                : ad?.type === 'voucher'
                  ? 'voucher'
                  : ad?.type === 'iklan'
                    ? 'iklan'
                    : 'promo'; // termasuk 'general' tetap dianggap promo

            return {
              cube_type_id: data?.cube_type_id,
              is_recommendation: data?.is_recommendation ? 1 : 0,
              is_information: data?.is_information ? 1 : 0,
              link_information: data?.link_information || '',
              map_lat: data?.map_lat,
              map_lng: data?.map_lng,
              status: data?.status,

              // penting: prefill untuk kondisi link
              content_type: contentType,
              'ads[promo_type]': ad?.promo_type || '',

              // prefill link dari tag pertama
              'cube_tags[0][link]': data?.tags?.at(0)?.link || '',

              ...worldID,
              ...userID,
              ...corporateID,
            };
          },
          contentType: 'multipart/form-data',
          custom: [
            // --- PEMILIK (bisa diubah) ---
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const cubeType = values?.find(i => i.name == 'cube_type_id')?.value;
                const isInfo = !!values.find(i => i.name === 'is_information')?.value;

                if (isInfo) return null; // sembunyikan saat Kubus Informasi

                return (
                  <>
                    {cubeType == 2 ? (
                      <SelectComponent
                        name="corporate_id"
                        label="Pemilik (Mitra)"
                        placeholder="Pilih Mitra..."
                        serverOptionControl={{ path: `admin/options/corporate` }}
                        {...formControl('corporate_id')}
                        searchable
                      />
                    ) : (
                      <SelectComponent
                        name="user_id"
                        label="Pemilik"
                        placeholder="Pilih user..."
                        serverOptionControl={{ path: `admin/options/user` }}
                        {...formControl('user_id')}
                        searchable
                      />
                    )}
                  </>
                );
              },
            },

            // --- REKOMENDASI BERANDA ---
            {
              type: 'check',
              construction: {
                name: 'is_recommendation',
                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
              },
            },

            // --- UBAH LOKASI (toggle + map) ---
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInfo = !!values?.find((i) => i.name == 'is_information')?.value;
                if (isInfo) return null;

                return (
                  <ToggleComponent
                    label="Ubah Lokasi Kubus"
                    onChange={() =>
                      setValues([
                        ...values.filter((i) => i.name != 'change_map'),
                        {
                          name: 'change_map',
                          value: !values.find((i) => i.name == 'change_map')?.value,
                        },
                      ])
                    }
                    checked={values?.find((i) => i.name == 'change_map')?.value}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInfo = !!values?.find((i) => i.name == 'is_information')?.value;
                if (isInfo) return null;

                return (
                  values?.find((i) => i.name == 'change_map')?.value === true && (
                    <div className="mx-10 hover:mx-8 hover:border-4 border-green-500 rounded-lg">
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
                            { name: 'cube_tags[0][address]', value: e?.address },
                          ]);
                        }}
                      />
                    </div>
                  )
                );
              },
            },

            // --- TAUTAN / LINK ---
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const ct = values?.find(i => i.name === 'content_type')?.value || 'promo';
                const promoType = values?.find(i => i.name === 'ads[promo_type]')?.value || '';

                // Hilangkan untuk IKLAN
                if (ct === 'iklan') return null;

                // Untuk Promo/Voucher: tampilkan hanya jika ONLINE
                if (!['promo', 'voucher'].includes(ct)) return null;
                if (promoType !== 'online') return null;

                return (
                  <InputComponent
                    type="url"
                    name="cube_tags[0][link]"
                    label="Tautan/Link"
                    placeholder="Masukkan tautan/link..."
                    onChange={(e) => {
                      setValues([
                        ...values.filter((i) => i.name !== 'cube_tags[0][link]'),
                        { name: 'cube_tags[0][link]', value: e || '' },
                      ]);
                    }}
                    value={values.find((i) => i.name === 'cube_tags[0][link]')?.value || ''}
                  />
                );
              },
            }
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
                  // infer jenis dari data yang ada
                  onClick={() => {
                    const inferred =
                      data?.ads?.at(0)?.type            // 'iklan' | 'voucher' | 'general'
                      ?? (data?.is_information ? 'kubus-informasi' : 'promo'); // fallback

                    setFormAds(inferred);
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
                {data.ads.at(0)?.type === 'voucher' ? (
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
        title={`${formAds == 'huehuy'
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
              selected?.ads?.at(0)?.id
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

                  // 👉 konsisten pakai ads[...]
                  'ads[image]':
                    selected?.ads[0]?.image ||
                    selected?.ads[0]?.picture_source ||
                    '',

                  'ads[image_1]':
                    selected?.ads[0]?.image_1 ||
                    selected?.ads[0]?.image_1_source ||
                    '',
                  'ads[image_2]':
                    selected?.ads[0]?.image_2 ||
                    selected?.ads[0]?.image_2_source ||
                    '',
                  'ads[image_3]':
                    selected?.ads[0]?.image_3 ||
                    selected?.ads[0]?.image_3_source ||
                    '',

                  ...validate,
                  is_information: selected?.is_information ? 1 : 0,
                  link_information: selected?.link_information || '',
                  level_umkm: selected?.ads[0].level_umkm || '',
                  max_production_per_day: selected?.ads[0].max_production_per_day || '',
                  sell_per_day: selected?.ads[0].sell_per_day || '',
                  validation_time_limit: selected?.ads[0].validation_time_limit || '',
                  content_type:
                    selected?.ads[0]?.type === 'voucher'
                      ? 'voucher'
                      : selected?.ads[0]?.type === 'iklan'
                        ? 'iklan'
                        : 'promo',

                }
                : {
                  cube_id: selected?.id,
                  // pakai nilai tab yang barusan di-set dari tombol (formAds)
                  type: formAds || 'promo',
                  is_daily_grab: 0,
                  content_type:
                    formAds === 'iklan' ? 'iklan' :
                      formAds === 'voucher' ? 'voucher' :
                        'promo',
                }
            }
            onSuccess={() => {
              setFormAds(false);
              setRefresh(!refresh);
            }}
            forms={[
              // Pastikan content_type ada di values (ambil dari 'type' kalau belum)
              {
                type: 'custom',
                custom: ({ values, setValues }) => {
                  const hasCT = values.some(i => i.name === 'content_type');
                  const t = values.find(i => i.name === 'type')?.value; // 'iklan' | 'promo' | 'voucher'
                  if (!hasCT && t) {
                    setValues([...values, { name: 'content_type', value: t }]);
                  }
                  return null;
                },
              },

              // --- JUDUL ---
              {
                col: 12,
                type: 'custom',
                custom: ({ formControl }) => (
                  <InputComponent
                    name="title"
                    label="Judul"
                    placeholder="Masukan judul..."
                    {...formControl('title')}
                    validations={{ required: true }}
                  />
                ),
              },
              // --- DESKRIPSI ---
              {
                col: 12,
                type: 'custom',
                custom: ({ formControl }) => (
                  <TextareaComponent
                    name="description"
                    label="Deskripsi"
                    placeholder="Masukan deskripsi..."
                    {...formControl('description')}
                    rows={5}
                    validations={{ required: true }}
                  />
                ),
              },
              // Kategori
              {
                col: 12,
                type: 'custom',
                custom: ({ formControl }) => (
                  <SelectComponent
                    name="ad_category_id"
                    label="Kategori"
                    placeholder="Pilih kategori..."
                    {...formControl('ad_category_id')}
                    serverOptionControl={{ path: `admin/options/ad-category` }}
                  />
                ),
              },
              // 3 gambar konten
              // 3 gambar konten (tampil untuk semua jenis termasuk iklan)
              {
                type: 'custom',
                custom: ({ formControl }) => (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-base text-slate-700">Gambar</div>
                    <div className="grid grid-cols-3 gap-4 px-6">
                      <InputImageComponent name="ads[image_1]" label="Gambar 1" {...formControl('ads[image_1]')} />
                      <InputImageComponent name="ads[image_2]" label="Gambar 2" {...formControl('ads[image_2]')} />
                      <InputImageComponent name="ads[image_3]" label="Gambar 3" {...formControl('ads[image_3]')} />
                    </div>
                  </div>
                ),
              },

              // Banner
              {
                type: 'custom',
                custom: ({ formControl }) => (
                  <div className="mt-6">
                    <div className="font-semibold text-base text-slate-700 mb-4">Banner Gambar (Opsional)</div>
                    <div className="px-32">
                      <InputImageComponent
                        name="ads[image]"
                        label="Banner"
                        {...formControl('ads[image]')}
                      />
                    </div>
                  </div>
                ),
              },

              // Promo tak terbatas & Promo harian
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="flex gap-4 mt-2">
                      <CheckboxComponent
                        label="Promo Tak Terbatas"
                        name="unlimited_grab"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name !== 'unlimited_grab'),
                            {
                              name: 'unlimited_grab',
                              value: !values.find((i) => i.name === 'unlimited_grab')?.value
                                ? 1
                                : 0,
                            },
                          ]);
                        }}
                        checked={values?.find((i) => i.name === 'unlimited_grab')?.value || false}
                      />

                      <CheckboxComponent
                        label="Promo Harian"
                        name="is_daily_grab"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name !== 'is_daily_grab'),
                            {
                              name: 'is_daily_grab',
                              value: !values.find((i) => i.name === 'is_daily_grab')?.value
                                ? 1
                                : 0,
                            },
                          ]);
                        }}
                        checked={values?.find((i) => i.name === 'is_daily_grab')?.value}
                        disabled={values?.find((i) => i.name === 'unlimited_grab')?.value || false}
                      />
                    </div>
                  );
                },
              },

              // Jumlah promo & Batas waktu validasi (HH:mm)
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <InputNumberComponent
                        type="number"
                        name="max_grab"
                        label={
                          values?.find((i) => i.name === 'is_daily_grab')?.value
                            ? 'Jumlah Promo Per Hari'
                            : 'Jumlah Promo'
                        }
                        placeholder={
                          values?.find((i) => i.name === 'is_daily_grab')?.value
                            ? 'Promo yang bisa diambil dalam satu hari...'
                            : 'Masukan jumlah promo...'
                        }
                        validations={{ required: true }}
                        onChange={(e) =>
                          setValues([
                            ...values.filter((i) => i.name !== 'max_grab'),
                            { name: 'max_grab', value: e },
                          ])
                        }
                        value={values.find((i) => i.name === 'max_grab')?.value}
                        error={errors.find((i) => i.name === 'max_grab')?.error}
                        disabled={values?.find((i) => i.name === 'unlimited_grab')?.value}
                      />
                      <InputTimeComponent
                        name="validation_time_limit"
                        label="Batas Waktu Validasi"
                        placeholder="Masukan batas waktu (HH:mm)..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'validation_time_limit'),
                            { name: 'validation_time_limit', value: v },
                          ]);
                        }}
                        value={values.find((i) => i.name === 'validation_time_limit')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>
                  );
                },
              },

              // Berlaku Mulai & Berakhir Pada (tanggal)
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <InputComponent
                        type="date"
                        name="start_validate"
                        label="Berlaku Mulai"
                        placeholder="Pilih tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'start_validate'),
                            { name: 'start_validate', value: moment(e)?.format('DD-MM-YYYY') },
                          ]);
                        }}
                        value={
                          values.find((i) => i.name === 'start_validate')?.value
                            ? moment(values.find((i) => i.name === 'start_validate')?.value, 'DD-MM-YYYY').format('YYYY-MM-DD')
                            : ''
                        }
                        errors={errors.filter((i) => i.name === 'start_validate')?.error}
                        validations={{ required: true }}
                      />
                      <InputComponent
                        type="date"
                        name="finish_validate"
                        label="Berakhir Pada"
                        placeholder="Pilih tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'finish_validate'),
                            { name: 'finish_validate', value: moment(e)?.format('DD-MM-YYYY') },
                          ]);
                        }}
                        value={
                          values.find((i) => i.name === 'finish_validate')?.value
                            ? moment(values.find((i) => i.name === 'finish_validate')?.value, 'DD-MM-YYYY').format('YYYY-MM-DD')
                            : ''
                        }
                        errors={errors.filter((i) => i.name === 'finish_validate')?.error}
                        validations={{ required: true }}
                      />
                    </div>
                  );
                },
              },

              // Jam Mulai & Jam Berakhir (HH:mm)
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <InputTimeComponent
                        name="jam_mulai"
                        label="Jam Mulai"
                        placeholder="Pilih jam..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'jam_mulai'),
                            { name: 'jam_mulai', value: v },
                          ]);
                        }}
                        value={values.find((i) => i.name === 'jam_mulai')?.value || ''}
                        validations={{ required: true }}
                      />
                      <InputTimeComponent
                        name="jam_berakhir"
                        label="Jam Berakhir"
                        placeholder="Pilih jam..."
                        onChange={(v) => {
                          setValues([
                            ...values.filter((i) => i.name !== 'jam_berakhir'),
                            { name: 'jam_berakhir', value: v },
                          ]);
                        }}
                        value={values.find((i) => i.name === 'jam_berakhir')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>
                  );
                },
              },

              // Hanya di Waktu Tertentu + Hanya di Hari
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-slate-700">Hanya Di Waktu Tertentu</div>
                      <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                        <div className="flex items-center gap-6">
                          {[
                            { key: 'weekend', label: 'Weekend' },
                            { key: 'weekday', label: 'Weekdays' },
                            { key: 'custom', label: 'Hari Lain' },
                          ].map(opt => {
                            const checked = values.find(i => i.name === 'day_type')?.value === opt.key;
                            return (
                              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="day_type"
                                  value={opt.key}
                                  checked={checked}
                                  onChange={() => {
                                    const next = [
                                      ...values.filter(i => i.name !== 'day_type'),
                                      { name: 'day_type', value: opt.key },
                                    ];
                                    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                    const cleaned = next.filter(i => !dayNames.some(d => i.name === `custom_days[${d}]`));
                                    if (opt.key !== 'custom') {
                                      const preset = {
                                        weekend: { saturday: true, sunday: true },
                                        weekday: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
                                      }[opt.key] || {};
                                      const injected = Object.entries(preset).map(([d, v]) => ({
                                        name: `custom_days[${d}]`,
                                        value: v
                                      }));
                                      setValues([...cleaned, ...injected]);
                                    } else {
                                      setValues(cleaned);
                                    }
                                  }}
                                  className="h-4 w-4 accent-green-600"
                                  style={{ accentColor: '#16a34a' }}
                                />
                                <span className={checked ? 'font-semibold text-slate-800' : 'text-slate-600'}>
                                  {opt.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="font-medium text-sm text-slate-700">Hanya Di Hari</div>
                      {(() => {
                        const dayType = values.find(i => i.name === 'day_type')?.value || 'custom';
                        const isCustom = dayType === 'custom';
                        const days = [
                          { label: 'Senin', key: 'monday' },
                          { label: 'Selasa', key: 'tuesday' },
                          { label: 'Rabu', key: 'wednesday' },
                          { label: 'Kamis', key: 'thursday' },
                          { label: 'Jumat', key: 'friday' },
                          { label: 'Sabtu', key: 'saturday' },
                          { label: 'Minggu', key: 'sunday' },
                        ];
                        const selected = (k) => !!values.find(i => i.name === `custom_days[${k}]`)?.value;

                        return (
                          <div className="flex flex-wrap gap-2">
                            {days.map(d => {
                              const active = selected(d.key);
                              return (
                                <button
                                  type="button"
                                  key={d.key}
                                  onClick={() => {
                                    if (!isCustom) return;
                                    const exists = values.find(i => i.name === `custom_days[${d.key}]`)?.value || false;
                                    setValues([
                                      ...values.filter(i => i.name !== `custom_days[${d.key}]`),
                                      { name: `custom_days[${d.key}]`, value: !exists },
                                    ]);
                                  }}
                                  className={[
                                    "px-3 py-1.5 rounded-md border text-sm font-medium transition",
                                    active
                                      ? "bg-green-600 text-white border-green-600 shadow"
                                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-400",
                                    isCustom ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
                                  ].join(' ')}
                                >
                                  {d.label}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                },
              },

              // Tambahkan Jam Buka (toggle + input)
              {
                col: 12,
                type: 'custom',
                custom: ({ values, setValues, errors }) => {
                  const ct = values.find(i => i.name === 'content_type')?.value || 'promo';
                  if (ct === 'iklan') return null;

                  return (
                    <div className="mt-3">
                      <ToggleComponent
                        label="Tambahkan Jam Buka"
                        name="openHours"
                        onChange={() =>
                          setValues([
                            ...values.filter((i) => i.name !== 'openHours'),
                            {
                              name: 'openHours',
                              value: !values.find((i) => i.name === 'openHours')?.value,
                            },
                          ])
                        }
                        checked={values?.find((i) => i.name === 'openHours')?.value}
                      />
                      {values.find((i) => i.name === 'openHours')?.value && (
                        <div className="bg-stone-50 py-6">
                          <InputOpenHours values={values} setValues={setValues} errors={errors} />
                        </div>
                      )}
                    </div>
                  );
                },
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
