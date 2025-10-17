import React, { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '../../../../components/construct.components/layout/Admin.layout';
import { 
  TableSupervisionComponent,
  DateFormatComponent,
  ButtonComponent,
  CheckboxComponent,
  InputComponent,
  TextareaComponent,
  InputNumberComponent,
  InputTimeComponent,
  InputMapComponent,
  SelectComponent,
} from '../../../../components/base.components';
import CropperDialog from '../../../../components/crop.components/CropperDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfinity, faEdit, faFilePen, faTrash } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

// Extra project components
import MultiSelectDropdown from '../../../../components/form/MultiSelectDropdown';
import ToggleComponent from '../../../../components/construct.components/input/TogleComponet';
import InputOpenHours from '../../../../components/construct.components/input/InputOpenHours';
import GrabListComponent from '../../../../components/construct.components/partial-page/GrabList.component';
import UpdateCubeStatusModal from '../../../../components/construct.components/modal/UpdateCubeStatus.modal';
import VoucherModal from '../../../../components/construct.components/modal/Voucher.modal';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../../helpers';
import { useUserContext } from '../../../../context/user.context';

// Import components dan hooks
import { useManagersData, useUsersData } from './hooks/useDataFetching';
import { useCropFunctionality } from './hooks/useCropFunctionality';
import ContentTypeSelector from './components/ContentTypeSelector';
import ManagerTenantSelector from './components/ManagerTenantSelector';
import ImageFieldComponent from './components/ImageFieldComponent';
import InformationForm from './forms/InformationForm';
import PromoVoucherForm from './forms/PromoVoucherForm';
import { getCT, isInfo, getApiBase } from './utils/helpers';
// Note: Real modals are imported above
function KubusMain() {
  // States
  const [selected, setSelected] = useState(null);
  // const [formAds, setFormAds] = useState(false); // not used in this simplified refactor yet
  const [refresh, setRefresh] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [voucherModal, setVoucherModal] = useState(false);
  const [formSessionId] = useState(0);
  const apiBase = getApiBase();

  // Context (not used in this simplified refactor)
  const { profile: Profile } = useUserContext();

  // Custom hooks
  const { merchantManagers, managersLoading, managersError } = useManagersData();
  // const { onlyUsers } = useUsersData(); // used in voucher user selection in future step
  const { onlyUsers } = useUsersData();
  const {
    cropOpen,
    setCropOpen,
    rawImageUrl,
    previewUrl,
    previewOwnerKey,
    handleFileInput,
    handleCropSave,
    handleRecrop,
    getServerImageUrl,
    resetCropState,
    withVersion
  } = useCropFunctionality();

  // Clear image handler
  const handleClearImage = useCallback((formControl, fieldKey) => {
    formControl.onChange('');
    if (previewUrl?.startsWith('blob:') && String(previewOwnerKey) === String(fieldKey)) {
      URL.revokeObjectURL(previewUrl);
      resetCropState();
    }
  }, [previewUrl, previewOwnerKey, resetCropState]);

  // Admin guard: ensure only role_id 1 can access
  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (Profile?.role_id != 1) {
        Cookies.remove(token_cookie_name);
        if (typeof window !== 'undefined') {
          window.location.href = '/admin';
        }
      }
    }
  }, [Profile]);

  // Create image field helper
  const createImageField = useCallback((fieldName, label) => {
    const ImageFieldWrapper = ({ formControl, values }) => (
      <ImageFieldComponent
        formControl={formControl}
        values={values}
        selected={selected}
        fieldName={fieldName}
        label={label}
        formSessionId={formSessionId}
        getServerImageUrl={getServerImageUrl}
        withVersion={withVersion}
        previewUrl={previewUrl}
        previewOwnerKey={previewOwnerKey}
        handleFileInput={handleFileInput}
        handleRecrop={handleRecrop}
        onClearImage={handleClearImage}
      />
    );
    ImageFieldWrapper.displayName = `ImageFieldWrapper(${fieldName})`;
    return ImageFieldWrapper;
  }, [selected, formSessionId, getServerImageUrl, withVersion, previewUrl, previewOwnerKey, handleFileInput, handleRecrop, handleClearImage]);

  // const validate = selected?.ads?.at(0)?.start_validate && selected?.ads?.at(0)?.finish_validate
  //   ? {
  //       start_validate: moment(selected?.ads[0].start_validate).format('DD-MM-YYYY'),
  //       finish_validate: moment(selected?.ads[0].finish_validate).format('DD-MM-YYYY'),
  //     }
  //   : null;

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
              item: ({ code, cube_type }) => (
                <>
                  <b>{code}</b>
                  <p className="text-slate-500 text-sm">{cube_type?.name}</p>
                </>
              ),
            },
            {
              selector: 'ads',
              label: 'Iklan',
              sortable: true,
              width: '250px',
              item: ({ ads }) => <b>{ads?.at(0)?.title}</b>,
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
                <div>
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
                  `${ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) || 'Tidak ada'} Promo / Hari`
                ) : (
                  `${ads?.at(0)?.max_grab - (ads?.at(0)?.total_grab || 0) || 'Tidak ada'} Promo`
                ),
            },
            {
              selector: 'world_id',
              label: 'Dunia',
              sortable: true,
              width: '150px',
              item: ({ world }) =>
                world ? <span className="limit__line__2">{world.name}</span> : '-',
            },
            {
              selector: 'owner',
              label: 'Manager Tenant',
              sortable: true,
              width: '250px',
              item: ({ user, cube_type_id, corporate }) => (
                <>
                  {cube_type_id == 2 ? (
                    <b className="font-semibold">{corporate?.name ? corporate?.name : '-'}</b>
                  ) : (
                    <>
                      <b className="font-semibold">{user?.name ? user?.name : '-'}</b>
                      <p className="text-slate-500 text-sm">{user?.email ? user?.email : null}</p>
                    </>
                  )}
                </>
              ),
            },
          ],
        }}
        formControl={{
          contentType: 'multipart/form-data',
          customDefaultValue: {
            'ads[is_daily_grab]': 0,
            'ads[unlimited_grab]': 0,
            'content_type': 'promo',
            'cube_type_id': 1,
            'owner_user_id': null,
            'ads[validation_type]': 'auto',
            'ads[day_type]': 'custom',
            'target_type': 'all',
            'target_user_ids': [],
            'community_id': '',
            'is_information': [],
            'is_recommendation': []
          },
          onModalOpen: (isEdit) => {
            if (!isEdit) {
              setSelected(null);
            }
          },
          custom: [
            // Content Type Selection
            {
              type: 'custom',
              custom: ({ values, setValues }) => (
                <ContentTypeSelector values={values} setValues={setValues} />
              ),
            },
            
            // Information Checkbox
            {
              type: 'check',
              construction: {
                name: 'is_information',
                options: [{ label: 'Kubus Informasi', value: 1 }],
              },
            },

            // Information Type Sync
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInformation = !!values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const ct = values.find(i => i.name === 'content_type')?.value || 'promo';

                if (isInformation && ct !== 'kubus-informasi') {
                  const contentTypeIndex = values.findIndex(i => i.name === 'content_type');
                  if (contentTypeIndex >= 0) {
                    const newValues = [...values];
                    newValues[contentTypeIndex] = { ...newValues[contentTypeIndex], value: 'kubus-informasi' };
                    setValues(newValues);
                  }
                }

                if (!isInformation && ct === 'kubus-informasi') {
                  const contentTypeIndex = values.findIndex(i => i.name === 'content_type');
                  if (contentTypeIndex >= 0) {
                    const newValues = [...values];
                    newValues[contentTypeIndex] = { ...newValues[contentTypeIndex], value: 'promo' };
                    setValues(newValues);
                  }
                }

                return null;
              },
            },

            // Recommendation Checkbox
            {
              type: 'check',
              construction: {
                name: 'is_recommendation',
                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
              },
            },

            // Cube Type Selection
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

            // Manager Tenant Section
            {
              type: 'custom',
              custom: ({ formControl, values }) => (
                <ManagerTenantSelector
                  formControl={formControl}
                  values={values}
                  merchantManagers={merchantManagers}
                  managersLoading={managersLoading}
                  managersError={managersError}
                />
              ),
            },

            // Cube Logo/Image Section for cube_type 2 or 4
            {
              col: 4,
              type: 'custom',
              custom: ({ values, formControl }) => {
                const cubeType = values.find((i) => i.name == 'cube_type_id')?.value;
                if (cubeType != 2 && cubeType != 4) return null;
                const label = cubeType == 2 ? 'Logo Kubus Merah' : 'Logo Kubus Hijau';
                const Field = createImageField('image', label);
                return <Field formControl={formControl} values={values} />;
              },
            },

            // Information Form
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const info = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                if (!info) return null;
                return <InformationForm formControl={formControl} />;
              },
            },

            // Promo/Voucher Form
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => {
                const isInformation = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <PromoVoucherForm
                    formControl={formControl}
                    values={values}
                    setValues={setValues}
                  />
                );
              },
            },

            // Maps and Address for Offline Promo/Voucher
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const ct = getCT(values);
                if (!['promo', 'voucher'].includes(ct)) return null;
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

            // IKLAN Content (basic)
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => {
                const isInformation = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                if (isInformation || contentType !== 'iklan') return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-lg text-slate-700 border-b pb-2">Iklan</div>
                    <InputComponent
                      name="ads[title]"
                      label="Judul Iklan"
                      placeholder="Masukan Judul Iklan..."
                      {...formControl('ads[title]')}
                    />
                    {TextareaComponent && (
                      <TextareaComponent
                        name="ads[description]"
                        label="Deskripsi Iklan"
                        placeholder="Masukan Deskripsi Iklan..."
                        {...formControl('ads[description]')}
                        rows={5}
                      />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <SelectComponent
                        name="ads[ad_category_id]"
                        label="Kategori Iklan"
                        placeholder="Pilih Kategori Iklan..."
                        {...formControl('ads[ad_category_id]')}
                        serverOptionControl={{ path: 'admin/options/ad-category' }}
                      />
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

            // 3 Images Section
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const ct = getCT(values);
                const show = ct === 'promo' || ct === 'voucher' || ct === 'iklan' || isInfo(values);
                if (!show) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-base text-slate-700">
                      {isInfo(values) ? 'Gambar Kubus Informasi' : 'Gambar Konten'}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {createImageField('ads[image_1]', 'Gambar 1')({ formControl, values })}
                      {createImageField('ads[image_2]', 'Gambar 2')({ formControl, values })}
                      {createImageField('ads[image_3]', 'Gambar 3')({ formControl, values })}
                    </div>
                  </div>
                );
              },
            },

            // Banner Image
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const BannerField = createImageField('ads[image]', 'Banner (Opsional)');
                return (
                  <div className="mt-6">
                    <div className="font-semibold text-base text-slate-700 mb-4">Banner Gambar (Opsional)</div>
                    <div className="px-32">
                      <BannerField formControl={formControl} values={values} />
                    </div>
                  </div>
                );
              },
            },

            // Validation Type (for promo/voucher only)
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <div className="space-y-3">
                    <SelectComponent
                      name="ads[validation_type]"
                      label="Tipe Validasi *"
                      placeholder="Pilih tipe validasi..."
                      required
                      options={[
                        { label: 'Generate Otomatis (QR Code)', value: 'auto' },
                        { label: 'Masukan Kode Unik', value: 'manual' },
                      ]}
                      value={values.find((i) => i.name == 'ads[validation_type]')?.value || 'auto'}
                      onChange={(value) => {
                        setValues([
                          ...values.filter((i) => i.name != 'ads[validation_type]'),
                          { name: 'ads[validation_type]', value: value },
                        ]);
                        if (value === 'auto') {
                          setValues(prev => [
                            ...prev.filter((i) => i.name != 'ads[code]'),
                            { name: 'ads[code]', value: '' },
                          ]);
                        }
                      }}
                      validations={{ required: true }}
                    />
                  </div>
                );
              },
            },

            // Kode Unik (only when manual)
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                const validationType = values.find((i) => i.name == 'ads[validation_type]')?.value;
                if (isInformation || !['promo', 'voucher'].includes(contentType) || validationType !== 'manual') return null;

                return (
                  <div className="space-y-3">
                    <InputComponent
                      name="ads[code]"
                      label="Kode Unik *"
                      placeholder="Masukan kode unik untuk validasi manual..."
                      required
                      value={values.find((i) => i.name == 'ads[code]')?.value || ''}
                      onChange={(e) => {
                        setValues([
                          ...values.filter((i) => i.name != 'ads[code]'),
                          { name: 'ads[code]', value: e },
                        ]);
                      }}
                      error={errors.find((i) => i.name == 'ads[code]')?.error}
                      validations={{ required: true }}
                    />
                  </div>
                );
              },
            },

            // Promo Settings (Unlimited, Daily, Quantity, Times, Days)
            {
              type: 'custom',
              custom: ({ values, setValues, errors }) => {
                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;

                return (
                  <div className="mt-6 space-y-4">
                    <div className="font-semibold text-base text-slate-700">Pengaturan {contentType === 'promo' ? 'Promo' : 'Voucher'}</div>
                    <div className="flex gap-4">
                      <CheckboxComponent
                        label="Promo Tak Terbatas"
                        name="ads[unlimited_grab]"
                        onChange={() => {
                          setValues([
                            ...values.filter((i) => i.name != 'ads[unlimited_grab]'),
                            { name: 'ads[unlimited_grab]', value: !values.find((i) => i.name == 'ads[unlimited_grab]')?.value ? 1 : 0 },
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
                            { name: 'ads[is_daily_grab]', value: !values.find((i) => i.name == 'ads[is_daily_grab]')?.value ? 1 : 0 },
                          ]);
                        }}
                        checked={values?.find((i) => i.name == 'ads[is_daily_grab]')?.value}
                        disabled={values?.find((i) => i.name == 'ads[unlimited_grab]')?.value || false}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InputNumberComponent
                        type="number"
                        name="ads[max_grab]"
                        label={values?.find((i) => i.name == 'ads[is_daily_grab]')?.value ? 'Jumlah Promo Per Hari' : 'Jumlah Promo'}
                        placeholder={values?.find((i) => i.name == 'ads[is_daily_grab]')?.value ? 'Promo yang bisa diambil dalam satu hari...' : 'Masukan Jumlah Promo...'}
                        validations={{ required: true }}
                        onChange={(e) => setValues([...values.filter((i) => i.name != 'ads[max_grab]'), { name: 'ads[max_grab]', value: e }])}
                        value={values.find((i) => i.name == 'ads[max_grab]')?.value}
                        error={errors.find((i) => i.name == 'ads[max_grab]')?.error}
                        disabled={values?.find((i) => i.name == 'ads[unlimited_grab]')?.value}
                      />
                      <InputTimeComponent
                        name="ads[validation_time_limit]"
                        label="Batas Waktu Validasi"
                        placeholder="Masukan Batas Waktu Validasi..."
                        onChange={(v) => setValues([...values.filter((i) => i.name !== 'ads[validation_time_limit]'), { name: 'ads[validation_time_limit]', value: v }])}
                        value={values.find((i) => i.name === 'ads[validation_time_limit]')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InputComponent
                        type="date"
                        name="ads[start_validate]"
                        label="Berlaku Mulai"
                        placeholder="Pilih Tanggal..."
                        forceFormat="DD-MM-YYYY HH:mm:ss"
                        onChange={(e) => setValues([...values.filter((i) => i.name != 'ads[start_validate]'), { name: 'ads[start_validate]', value: moment(e).format('DD-MM-YYYY') }])}
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
                        onChange={(e) => setValues([...values.filter((i) => i.name != 'ads[finish_validate]'), { name: 'ads[finish_validate]', value: moment(e)?.format('DD-MM-YYYY') }])}
                        value={values.find((i) => i.name == 'ads[finish_validate]')?.value || ''}
                        errors={errors.filter((i) => i.name == 'ads[finish_validate]')?.error}
                        validations={{ required: true }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InputTimeComponent
                        name="ads[jam_mulai]"
                        label="Jam Mulai"
                        placeholder="Pilih Jam..."
                        onChange={(v) => setValues([...values.filter((i) => i.name !== 'ads[jam_mulai]'), { name: 'ads[jam_mulai]', value: v }])}
                        value={values.find((i) => i.name === 'ads[jam_mulai]')?.value || ''}
                        validations={{ required: true }}
                      />
                      <InputTimeComponent
                        name="ads[jam_berakhir]"
                        label="Jam Berakhir"
                        placeholder="Pilih Jam..."
                        onChange={(v) => setValues([...values.filter((i) => i.name !== 'ads[jam_berakhir]'), { name: 'ads[jam_berakhir]', value: v }])}
                        value={values.find((i) => i.name === 'ads[jam_berakhir]')?.value || ''}
                        validations={{ required: true }}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="font-medium text-sm text-slate-700">Hanya Di Waktu Tertentu</div>
                      <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                        <div className="flex items-center gap-6">
                          {[{ key: 'weekend', label: 'Weekend' }, { key: 'weekday', label: 'Weekdays' }, { key: 'custom', label: 'Hari Lain' }].map(opt => {
                            const checked = values.find(i => i.name == 'ads[day_type]')?.value === opt.key;
                            return (
                              <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="day_type"
                                  value={opt.key}
                                  checked={checked}
                                  onChange={() => {
                                    const next = [
                                      ...values.filter(i => i.name !== 'ads[day_type]'),
                                      { name: 'ads[day_type]', value: opt.key },
                                    ];
                                    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                    const cleaned = next.filter(i => !dayNames.some(d => i.name === `ads[custom_days][${d}]`));
                                    if (opt.key !== 'custom') {
                                      const preset = {
                                        weekend: { saturday: true, sunday: true },
                                        weekday: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true },
                                      }[opt.key] || {};
                                      const injected = Object.entries(preset).map(([d, v]) => ({ name: `ads[custom_days][${d}]`, value: v }));
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
                        const dayType = values.find(i => i.name == 'ads[day_type]')?.value || 'custom';
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
                        const selected = (k) => !!values.find(i => i.name === `ads[custom_days][${k}]`)?.value;
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
                                    const exists = values.find(i => i.name === `ads[custom_days][${d.key}]`)?.value || false;
                                    setValues([
                                      ...values.filter(i => i.name !== `ads[custom_days][${d.key}]`),
                                      { name: `ads[custom_days][${d.key}]`, value: !exists },
                                    ]);
                                  }}
                                  className={[
                                    'px-3 py-1.5 rounded-md border text-sm font-medium transition',
                                    active ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400',
                                    isCustom ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed',
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

            // Voucher target recipient - target type
            {
              type: 'custom',
              custom: ({ formControl, values, setValues }) => {
                const contentType = getCT(values);
                if (contentType !== 'voucher') return null;

                const fc = formControl('target_type');
                const current = fc.value ?? 'all';

                const handleChange = (valOrEvent) => {
                  const newValue = valOrEvent?.target?.value ?? valOrEvent?.value ?? valOrEvent;
                  fc.onChange(newValue);
                  setValues(prev => prev.filter(v => !['target_user_ids', 'community_id'].includes(v.name)));
                };

                return (
                  <div className="space-y-3">
                    <div className="font-semibold text-base text-slate-700">Target Penerima Voucher</div>
                    <SelectComponent
                      name="target_type"
                      label="Siapa Yang Bisa Menggunakan Voucher?"
                      required
                      value={current}
                      onChange={handleChange}
                      options={[
                        { label: 'Semua User', value: 'all' },
                        { label: 'User Tertentu', value: 'user' },
                        { label: 'Komunitas Tertentu', value: 'community' },
                      ]}
                    />
                  </div>
                );
              },
            },

            // Community selection for voucher
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const contentType = getCT(values);
                const targetType = values.find(i => i.name === 'target_type')?.value;
                if (contentType !== 'voucher' || targetType !== 'community') return null;
                const currentValue = values?.find(i => i.name === 'community_id')?.value || '';
                return (
                  <SelectComponent
                    name="community_id"
                    label="Pilih Komunitas"
                    placeholder="Pilih komunitas yang bisa menggunakan voucher"
                    required
                    value={currentValue}
                    onChange={(selectedValue) => {
                      setValues([
                        ...values.filter(i => i.name !== 'community_id'),
                        { name: 'community_id', value: selectedValue }
                      ]);
                    }}
                    serverOptionControl={{ path: 'admin/options/community' }}
                  />
                );
              },
            },

            // User selection for voucher
            {
              type: 'custom',
              custom: ({ formControl, values }) => {
                const contentType = getCT(values);
                const targetType = values.find(i => i.name === 'target_type')?.value;
                if (contentType !== 'voucher' || targetType !== 'user') return null;
                return (
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Pilih Pengguna</span>
                      <span className="label-text-alt text-red-500">*</span>
                    </label>
                    <MultiSelectDropdown
                      options={onlyUsers.map((u) => ({ label: `${u.name || u.email || `#${u.id}`}`, value: u.id }))}
                      value={formControl('target_user_ids').value || []}
                      onChange={formControl('target_user_ids').onChange}
                      placeholder="Pilih satu atau lebih pengguna..."
                      maxHeight={200}
                    />
                    <label className="label">
                      <span className="label-text-alt text-gray-500">Anda dapat memilih beberapa pengguna sekaligus</span>
                    </label>
                  </div>
                );
              },
            },

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
                          { name: 'openHours', value: !values.find((i) => i.name == 'openHours')?.value },
                        ])
                      }
                      checked={values?.find((i) => i.name == 'openHours')?.value}
                    />
                    {values.find((i) => i.name == 'openHours')?.value && (
                      <div className="bg-stone-50 py-6">
                        <InputOpenHours values={values} setValues={setValues} errors={errors} />
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
            setSelected(data);
            const ad = data?.ads?.[0] || {};
            const contentType = data?.is_information
              ? 'kubus-informasi'
              : ad?.type === 'voucher'
                ? 'voucher'
                : ad?.type === 'iklan'
                  ? 'iklan'
                  : 'promo';

            const mapCustomDays = (customDays) => {
              if (!customDays || typeof customDays !== 'object') return {};
              const result = {};
              Object.entries(customDays).forEach(([day, value]) => {
                result[`ads[custom_days][${day}]`] = value;
              });
              return result;
            };

            return {
              cube_type_id: data?.cube_type_id,
              is_recommendation: data?.is_recommendation ? [1] : [],
              is_information: data?.is_information ? [1] : [],
              link_information: data?.link_information || '',
              _original_map_lat: data?.map_lat,
              _original_map_lng: data?.map_lng,
              _original_address: data?.address,
              status: data?.status,
              content_type: contentType,
              'ads[promo_type]': ad?.promo_type || '',
              'ads[validation_type]': ad?.validation_type || 'auto',
              'ads[code]': ad?.code || '',
              'cube_tags[0][link]': data?.tags?.at(0)?.link || '',
              'cube_tags[0][map_lat]': data?.tags?.at(0)?.map_lat || data?.map_lat || '',
              'cube_tags[0][map_lng]': data?.tags?.at(0)?.map_lng || data?.map_lng || '',
              'cube_tags[0][address]': data?.tags?.at(0)?.address || data?.address || '',
              target_type: ad?.target_type || 'all',
              target_user_ids: ad?.target_user_ids || [],
              community_id: ad?.community_id || '',
              image: data?.picture_source || '',
              'ads[image]': ad?.picture_source || '',
              'ads[image_1]': ad?.image_1 || '',
              'ads[image_2]': ad?.image_2 || '',
              'ads[image_3]': ad?.image_3 || '',
              'ads[title]': ad?.title || '',
              'ads[description]': ad?.description || '',
              'ads[ad_category_id]': ad?.ad_category_id || '',
              'ads[level_umkm]': ad?.level_umkm || '',
              'ads[max_production_per_day]': ad?.max_production_per_day || '',
              'ads[sell_per_day]': ad?.sell_per_day || '',
              'ads[is_daily_grab]': ad?.is_daily_grab ? 1 : 0,
              'ads[unlimited_grab]': ad?.unlimited_grab ? 1 : 0,
              'ads[max_grab]': ad?.max_grab || '',
              'ads[jam_mulai]': ad?.jam_mulai ? String(ad.jam_mulai).substring(0, 5) : '',
              'ads[jam_berakhir]': ad?.jam_berakhir ? String(ad.jam_berakhir).substring(0, 5) : '',
              'ads[day_type]': ad?.day_type || 'custom',
              ...mapCustomDays(ad?.custom_days),
              ...(ad?.start_validate ? { 'ads[start_validate]': moment(ad.start_validate).format('DD-MM-YYYY') } : {}),
              ...(ad?.finish_validate ? { 'ads[finish_validate]': moment(ad.finish_validate).format('DD-MM-YYYY') } : {}),
              ...(data?.world_id ? { world_id: data.world_id } : {}),
              ...(data?.user_id ? { owner_user_id: data.user_id } : {}),
              ...(data?.corporate_id ? { corporate_id: data.corporate_id } : {}),
            };
          },
          contentType: 'multipart/form-data',
          custom: [
            // Manager Tenant (editable on update)
            {
              type: 'custom',
              custom: ({ formControl, values }) => (
                <ManagerTenantSelector
                  formControl={formControl}
                  values={values}
                  merchantManagers={merchantManagers}
                  managersLoading={managersLoading}
                  managersError={managersError}
                />
              ),
            },
            // Recommendation checkbox keep
            {
              type: 'check',
              construction: {
                name: 'is_recommendation',
                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
              },
            },
            // Toggle change map
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInfo = !!values?.find(i => i.name == 'is_information')?.value;
                if (isInfo) return null;
                const changeMapActive = values?.find(i => i.name == 'change_map')?.value;
                const ensure = (name, fallbackName) => {
                  const exists = values.some(i => i.name === name);
                  if (!exists) {
                    const fallback = values.find(i => i.name === fallbackName)?.value || '';
                    if (fallback !== '') setValues([...values, { name, value: fallback }]);
                  }
                };
                ensure('map_lat', '_original_map_lat');
                ensure('map_lng', '_original_map_lng');
                ensure('address', '_original_address');
                ensure('cube_tags[0][map_lat]', '_original_map_lat');
                ensure('cube_tags[0][map_lng]', '_original_map_lng');
                ensure('cube_tags[0][address]', '_original_address');
                return (
                  <ToggleComponent
                    label="Ubah Lokasi Kubus"
                    onChange={() => setValues([...values.filter(i => i.name != 'change_map'), { name: 'change_map', value: !changeMapActive }])}
                    checked={!!changeMapActive}
                  />
                );
              },
            },
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const isInfo = !!values?.find((i) => i.name == 'is_information')?.value;
                if (isInfo) return null;
                const change = values?.find(i => i.name == 'change_map')?.value;
                const lat0 = values?.find(i => i.name == '_original_map_lat')?.value;
                const lng0 = values?.find(i => i.name == '_original_map_lng')?.value;
                const addr0 = values?.find(i => i.name == '_original_address')?.value;
                if (!change) return null;
                return (
                  <div className="mx-10 hover:mx-8 hover:border-4 border-green-500 rounded-lg">
                    <InputMapComponent
                      name="map"
                      initialLat={lat0}
                      initialLng={lng0}
                      initialAddress={addr0}
                      onChange={(e) => {
                        const rm = ['map_lat','map_lng','address','cube_tags[0][map_lat]','cube_tags[0][map_lng]','cube_tags[0][address]'];
                        setValues([
                          ...values.filter(i => !rm.includes(i.name)),
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
                );
              },
            },
            // Hidden field to flag update_location
            {
              type: 'custom',
              custom: ({ values, setValues }) => {
                const changeMapActive = values?.find((i) => i.name == 'change_map')?.value;
                const hasUpdateLocationFlag = values.some((i) => i.name === 'update_location');
                if (!hasUpdateLocationFlag) {
                  setValues([...values, { name: 'update_location', value: changeMapActive ? 1 : 0 }]);
                }
                return null;
              },
            },
          ],
        }}

        customDetail={(data) => (
          <GrabListComponent
            data={data}
            filter={[{ column: 'ad_id', type: 'equal', value: data?.ads.at(0)?.id }]}
          />
        )}

        actionControl={{
          // non-aktifkan tombol "Ubah" bawaan dengan except
          except: ['edit'],
          include: (row, ctx) => {
            
            const { setModalForm, setDataSelected } = ctx || {};
            const handleDelete = async () => {
              if (!window.confirm('Yakin ingin menghapus kubus ini? Tindakan ini tidak dapat dibatalkan.')) return;
              try {
                const token = Cookies.get(token_cookie_name);
                const res = await fetch(`${apiBase}/api/admin/cubes/${row.id}`, {
                  method: 'DELETE',
                  headers: {
                    Accept: 'application/json',
                    Authorization: token ? `Bearer ${token}` : undefined,
                  },
                });
                if (!res.ok) {
                  const t = await res.text();
                  alert(`Gagal menghapus: ${res.status} ${t?.slice?.(0,120) || ''}`);
                } else {
                  setSelected(null);
                  setRefresh((v) => !v);
                }
              } catch (e) {
                alert(`Gagal menghapus: ${e.message}`);
              }
            };

            return (
              <>
                <ButtonComponent
                  icon={faEdit}
                  label={'Ubah Kubus'}
                  variant="outline"
                  paint={'warning'}
                  size={'xs'}
                  rounded
                  onClick={() => { setModalForm?.(true); setDataSelected?.(row); }}
                />
                <ButtonComponent
                  icon={faFilePen}
                  label={'Ubah Iklan'}
                  variant="outline"
                  paint={'warning'}
                  size={'xs'}
                  rounded
                  onClick={() => { setModalForm?.(true); setDataSelected?.(row); }}
                />
                <ButtonComponent
                  label={row?.status === 'active' ? 'Non-Aktifkan' : 'Aktifkan'}
                  variant="outline"
                  paint={row?.status === 'active' ? 'danger' : 'success'}
                  size={'xs'}
                  rounded
                  onClick={() => { setSelected(row); setUpdateStatus(true); }}
                />
                {/* Tombol Hapus manual dihilangkan karena TableSupervisionComponent
                    kemungkinan sudah menyertakan aksi Hapus secara default. */}
              </>
            );
          }
        }}
        onStoreSuccess={() => {
          setRefresh(r => !r);
          resetCropState();
        }}
        
        onUpdateSuccess={() => {
          setRefresh(r => !r);
          resetCropState();
        }}
        
        onModalClose={() => {
          resetCropState();
        }}
      />

      {/* Crop Dialog */}
      <CropperDialog
        open={cropOpen}
        imageUrl={rawImageUrl}
        onClose={() => setCropOpen(false)}
        onSave={handleCropSave}
        aspect={1}
      />

      {/* Status Modal */}
      <UpdateCubeStatusModal
        data={selected}
        show={updateStatus}
        setShow={setUpdateStatus}
        onSuccess={() => {
          setRefresh(r => !r);
        }}
      />

      {/* Voucher Modal */}
      <VoucherModal
        data={selected}
        show={voucherModal}
        setShow={setVoucherModal}
        onSuccess={() => {
          setRefresh(r => !r);
        }}
      />
    </div>
  );
}

export default KubusMain;

KubusMain.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};