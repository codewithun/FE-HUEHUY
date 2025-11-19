/* Corporate admin-like Kubus management page: mirrors admin UI but filtered to corporate scope */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfinity, faFilePen } from '@fortawesome/free-solid-svg-icons';

import {
    DateFormatComponent,
    TableSupervisionComponent,
    InputComponent,
    InputMapComponent,
    SelectComponent,
    ButtonComponent,
    CheckboxComponent,
    InputNumberComponent,
    InputTimeComponent,
} from '../../base.components';

import GrabListComponent from './GrabList.component';
import { useUserContext } from '../../../context/user.context';

// Admin feature parity imports
import { useManagersData, useUsersData } from '../../../features/kubus/hooks/useDataFetching';
import { useCropFunctionality } from '../../../features/kubus/hooks/useCropFunctionality';
import ManagerTenantSelector from '../../../features/kubus/components/ManagerTenantSelector';
import ImageFieldComponent from '../../../features/kubus/components/ImageFieldComponent';
import InformationForm from '../../../features/kubus/forms/InformationForm';
import VoucherForm from '../../../features/kubus/forms/VoucherForm';
import IklanForm from '../../../features/kubus/forms/IklanForm';
import PromoForm from '../../../features/kubus/forms/PromoForm';
import CropperDialog from '../../crop.components/CropperDialog';

// helpers used in admin transform
import { standIn } from '../../../helpers/standIn.helpers';
import { prepareKubusVoucherData, validateVoucherData } from '../../../helpers/voucher.helpers';
// using local getCT/isInfo helpers declared below
import MultiSelectDropdown from '../../form/MultiSelectDropdown';
import ToggleComponent from '../input/TogleComponet';
import InputOpenHours from '../input/InputOpenHours';
import UpdateCubeStatusModal from '../modal/UpdateCubeStatus.modal';
import VoucherModal from '../modal/Voucher.modal';

function CorporateKubusPage({ scope }) {
    // State mirroring admin
    const [selected, setSelected] = useState(null);
    const [pendingEditRow, setPendingEditRow] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(false);
    const [voucherModal, setVoucherModal] = useState(false);
    const [formSessionId] = useState(0);
    const [isAdsEditMode, setIsAdsEditMode] = useState(false);
    const [, setIsFormEdit] = useState(false);
    const formValuesRef = useRef([]);
    // const [tableCtx, setTableCtx] = useState(null); // removed, unused

    useUserContext(); // reserved for future guards
    const { merchantManagers, managersLoading, managersError } = useManagersData();
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
        withVersion,
    } = useCropFunctionality();

    // Stable preview refs
    const previewUrlRef = useRef(previewUrl);
    const previewOwnerKeyRef = useRef(previewOwnerKey);
    useEffect(() => {
        previewUrlRef.current = previewUrl;
        previewOwnerKeyRef.current = previewOwnerKey;
    }, [previewUrl, previewOwnerKey]);

    useEffect(() => {
        if (!pendingEditRow && !selected) {
            // reset guards when switching from edit to create
            setIsAdsEditMode(false);
            setIsFormEdit(false);
            formValuesRef.current = [];
        }
    }, [pendingEditRow, selected]);

    // Image helpers
    const handleClearImage = useCallback(
        (formControl, fieldKey) => {
            formControl.onChange('');
            if (previewUrl?.startsWith('blob:') && String(previewOwnerKey) === String(fieldKey)) {
                try {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                } catch (e) { }
                resetCropState();
            }
        },
        [previewUrl, previewOwnerKey, resetCropState]
    );

    // Image field factory
    const createImageField = useCallback(
        (fieldName, label) => {
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
                    previewUrl={previewUrlRef.current}
                    previewOwnerKey={previewOwnerKeyRef.current}
                    handleFileInput={handleFileInput}
                    handleRecrop={handleRecrop}
                    onClearImage={handleClearImage}
                />
            );
            ImageFieldWrapper.displayName = `ImageFieldWrapper(${fieldName})`;
            return ImageFieldWrapper;
        },
        [selected, formSessionId, getServerImageUrl, withVersion, handleFileInput, handleRecrop, handleClearImage]
    );

    // Admin mapping for update defaults
    const mapUpdateDefault = (data) => {
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
            Object.entries(customDays).forEach(([, v], idx) => {
                result[`ads[custom_days][${idx}][day]`] = v?.day || '';
                result[`ads[custom_days][${idx}][start]`] = v?.start || '';
                result[`ads[custom_days][${idx}][finish]`] = v?.finish || '';
            });
            return result;
        };

        const formatDateForInput = (dateStr) => {
            if (!dateStr) return '';
            const d = moment(dateStr);
            return d.isValid() ? d.format('YYYY-MM-DD') : '';
        };

        const mappedData = {
            cube_type_id: data?.cube_type_id,
            is_recommendation: data?.is_recommendation ? [1] : [],
            is_information: data?.is_information ? [1] : [],
            link_information: data?.link_information || '',
            _original_map_lat: data?.map_lat,
            _original_map_lng: data?.map_lng,
            _original_address: data?.address,
            address: data?.address || '',
            map_lat: data?.map_lat || '',
            map_lng: data?.map_lng || '',
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
            image: data?.image || data?.picture_source || '',
            'ads[image]': ad?.image || ad?.picture_source || '',
            'ads[image_1]': ad?.image_1 || '',
            'ads[image_2]': ad?.image_2 || '',
            'ads[image_3]': ad?.image_3 || '',
            'ads[title]': ad?.title || '',
            'ads[description]': ad?.description || '',
            'ads[detail]': ad?.detail || ad?.description || '',
            'ads[ad_category_id]': ad?.ad_category_id || '',
            'ads[level_umkm]': ad?.level_umkm || '',
            'ads[max_production_per_day]': ad?.max_production_per_day || '',
            'ads[sell_per_day]': ad?.sell_per_day || '',
        };

        const stockSource = ad?.stock_source || (ad?.max_grab != null ? 'ad' : 'promo');
        const maxGrabForForm = stockSource === 'promo' ? ad?.remaining_stock ?? '' : ad?.max_grab ?? '';

        return {
            ...mappedData,
            'ads[is_daily_grab]': ad?.is_daily_grab ? 1 : 0,
            'ads[unlimited_grab]': ad?.unlimited_grab ? 1 : 0,
            'ads[max_grab]': maxGrabForForm,
            'ads[jam_mulai]': ad?.jam_mulai ? String(ad.jam_mulai).substring(0, 5) : '',
            'ads[jam_berakhir]': ad?.jam_berakhir ? String(ad.jam_berakhir).substring(0, 5) : '',
            'ads[day_type]': ad?.day_type || 'custom',
            'ads[start_validate]': formatDateForInput(ad?.start_validate),
            'ads[finish_validate]': formatDateForInput(ad?.finish_validate),
            'ads[validation_time_limit]': ad?.validation_time_limit || '',
            ...mapCustomDays(ad?.custom_days),
            ...(data?.world_id ? { world_id: data.world_id } : {}),
            ...(data?.user_id ? { owner_user_id: data.user_id } : {}),
            ...(data?.corporate_id ? { corporate_id: data.corporate_id } : {}),
            map_distance: 0,
        };
    };

    // Helpers
    const getCT = (values) => values.find((i) => i.name === 'content_type')?.value || 'promo';
    const isInfo = (values) => !!values.find((i) => i.name === 'is_information')?.value?.at?.(0);

    return (
        <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
            <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Kubus</h1>

            <TableSupervisionComponent
                setToRefresh={refresh}
                title="Kubus"
                fetchControl={{ path: 'admin/cubes' }}
                includeFilters={scope?.corporate_id ? [{ column: 'corporate_id', type: 'equal', value: scope.corporate_id }] : []}
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
                            item: ({ ads }) => <b className="limit__line__2">{ads?.at(0)?.title}</b>,
                        },
                        {
                            selector: 'address',
                            label: 'Lokasi',
                            sortable: true,
                            width: '250px',
                            item: ({ address }) => <span className="limit__line__2">{address}</span>,
                        },
                        {
                            selector: 'status',
                            label: 'Status',
                            sortable: true,
                            width: '130px',
                            item: ({ status, inactive_at, ads }) => {
                                const ad = ads?.[0] || {};
                                const endDate = inactive_at || ad?.finish_validate || ad?.expires_at || null;
                                const isExpired = endDate ? moment().isAfter(moment(endDate)) : false;
                                return (
                                    <div>
                                        {status === 'active' && !isExpired ? (
                                            <span className="uppercase font-medium text-green-600 py-1 px-2.5 rounded-md text-sm bg-green-100">Aktif</span>
                                        ) : (
                                            <span className="uppercase font-medium text-red-600 py-1 px-2.5 rounded-md text-sm bg-red-100">{isExpired ? 'Kedaluwarsa' : 'Tidak Aktif'}</span>
                                        )}
                                        <p className="text-xs mt-2">
                                            Aktif Sampai: {endDate ? <DateFormatComponent date={endDate} /> : <FontAwesomeIcon icon={faInfinity} />}
                                        </p>
                                    </div>
                                );
                            },
                        },
                        {
                            selector: 'remaining_stock',
                            label: 'Sisa Promo/Voucher',
                            sortable: true,
                            width: '200px',
                            item: ({ ads }) => {
                                const ad = ads?.[0] || {};
                                const harian = !!ad?.is_daily_grab;
                                const unlimited = !!ad?.unlimited_grab;
                                const adType = ad?.type || 'promo';
                                if (unlimited) return <FontAwesomeIcon icon={faInfinity} />;
                                if (adType === 'iklan') return '-';
                                const label = adType === 'voucher' ? 'Voucher' : 'Promo';
                                const displayStock = ad?.total_remaining ?? ad?.remaining_stock ?? ad?.max_grab ?? 0;
                                return harian ? `${displayStock} ${label} / Hari` : `${displayStock} ${label}`;
                            },
                        },
                        {
                            selector: 'world_id',
                            label: 'Dunia',
                            sortable: true,
                            width: '150px',
                            item: ({ world }) => (world ? <span className="limit__line__2">{world.name}</span> : '-'),
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
                formControl={useMemo(() => ({
                    contentType: 'multipart/form-data',
                    customDefaultValue: {
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
                        ...(scope?.corporate_id ? { corporate_id: scope.corporate_id } : {}),
                    },
                    transformData: (formData) => {
                        if (formData.content_type === 'voucher') {
                            try {
                                const transformedData = prepareKubusVoucherData(formData);
                                const validation = validateVoucherData(transformedData);
                                if (!validation.isValid) {
                                    const firstError = Object.values(validation.errors)[0];
                                    const errorMessage = firstError || 'Validasi voucher gagal. Periksa kembali data yang diisi.';
                                    alert(errorMessage);
                                    throw new Error(errorMessage);
                                }
                                return transformedData;
                            } catch (error) {
                                if (!String(error?.message || '').includes('Validasi voucher gagal')) {
                                    alert(error.message || 'Gagal memproses data');
                                }
                                throw error;
                            }
                        }
                        return formData;
                    },
                    onModalOpen: () => {
                        standIn.clear('option_admin/options/ad-category');

                        if (pendingEditRow || (selected?.ads?.[0]?.id && isAdsEditMode)) {
                            setIsFormEdit(true);
                            setIsAdsEditMode(true);
                            const editData = pendingEditRow || selected;
                            setSelected(editData);
                        } else {
                            setIsAdsEditMode(false);
                            setIsFormEdit(false);
                            setSelected(null);
                            setPendingEditRow(null);
                            formValuesRef.current = [];
                            resetCropState();
                            setTimeout(() => {
                                setIsAdsEditMode(false);
                                setSelected(null);
                            }, 0);
                        }
                    },
                    custom: [
                        {
                            type: 'custom',
                            custom: ({ values, setValues }) => {
                                const hasSelectedWithAds = selected?.ads?.[0]?.id;
                                const isEditingAdBased = hasSelectedWithAds && isAdsEditMode;
                                const isCreateMode = !values.find((v) => v.name === 'id')?.value;
                                const shouldShow = isCreateMode || !isEditingAdBased;
                                if (!shouldShow) return null;

                                const isInformation = values.find((i) => i.name == 'is_information')?.value?.at?.(0);
                                const currentTab = values.find((i) => i.name == 'content_type')?.value || 'promo';

                                const handleContentTypeChange = (newType) => {
                                    let next = [
                                        ...values.filter((i) => i.name !== 'content_type'),
                                        { name: 'content_type', value: newType },
                                    ];
                                    if (newType !== 'kubus-informasi') {
                                        next = [
                                            ...next.filter((i) => i.name !== 'is_information'),
                                            { name: 'is_information', value: [] },
                                        ];
                                    }
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
                                        <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                                            <div className="flex items-center gap-6">
                                                {options.map((opt) => {
                                                    const checked = currentTab === opt.key;
                                                    return (
                                                        <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="content_type"
                                                                value={opt.key}
                                                                checked={checked}
                                                                disabled={!!isInformation}
                                                                onChange={() => handleContentTypeChange(opt.key)}
                                                                className="h-4 w-4 accent-green-600 disabled:opacity-50"
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
                                    </div>
                                );
                            },
                        },
                        // Checkbox Kubus Informasi (hanya saat create)
                        ...(isAdsEditMode && selected?.ads?.[0]?.id
                            ? []
                            : [
                                {
                                    type: 'check',
                                    construction: {
                                        name: 'is_information',
                                        options: [{ label: 'Kubus Informasi', value: 1 }],
                                    },
                                },
                            ]),

                        // sinkron content_type dengan is_information
                        {
                            type: 'custom',
                            custom: ({ values, setValues }) => {
                                const isActuallyEditingAd = isAdsEditMode && selected?.ads?.[0]?.id;
                                if (isActuallyEditingAd) return null;
                                const info = !!values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                                const ct = values.find((i) => i.name === 'content_type')?.value || 'promo';
                                if (info && ct !== 'kubus-informasi') {
                                    setValues([
                                        ...values.filter((i) => i.name !== 'content_type'),
                                        { name: 'content_type', value: 'kubus-informasi' },
                                    ]);
                                }
                                if (!info && ct === 'kubus-informasi') {
                                    setValues([
                                        ...values.filter((i) => i.name !== 'content_type'),
                                        { name: 'content_type', value: 'promo' },
                                    ]);
                                }
                                return null;
                            },
                        },

                        // Rekomendasi checkbox
                        {
                            type: 'check',
                            construction: {
                                name: 'is_recommendation',
                                options: [{ label: 'Rekomendasi Di Beranda', value: 1 }],
                            },
                        },

                        // Cube type select
                        {
                            type: 'select',
                            construction: {
                                name: 'cube_type_id',
                                label: 'Tipe Kubus',
                                placeholder: 'Pilih Tipe Kubus..',
                                serverOptionControl: { path: 'admin/options/cube-type' },
                            },
                        },

                        // Manager Tenant Selector
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

                        // Cube Logo/Image for cube_type 2 or 4
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

                        // Information form
                        {
                            type: 'custom',
                            custom: ({ formControl, values }) => {
                                const info = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                                if (!info) return null;
                                return <InformationForm formControl={formControl} />;
                            },
                        },

                        // Promo/Voucher Form
                        {
                            type: 'custom',
                            custom: ({ formControl, values, setValues }) => {
                                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;
                                if (contentType === 'promo') {
                                    return <PromoForm formControl={formControl} values={values} setValues={setValues} />;
                                }
                                return <VoucherForm formControl={formControl} createImageField={createImageField} values={values} />;
                            },
                        },

                        // Maps and Address for Offline Promo/Voucher
                        {
                            type: 'custom',
                            custom: ({ values, setValues, errors }) => {
                                const ct = getCT(values);
                                const promoType = values.find((val) => val.name == 'ads[promo_type]')?.value;
                                const showMap = ct === 'voucher' || (ct === 'promo' && promoType === 'offline');
                                if (!showMap) return null;
                                return (
                                    <div className="mt-4 space-y-4">
                                        <p className="text-sm text-slate-600 font-semibold">Lokasi Validasi</p>
                                        <div className="mx-10 hover:mx-8 hover:border-4 border-green-500 rounded-lg">
                                            <InputMapComponent
                                                name="map-tag"
                                                onChange={(e) => {
                                                    setValues([
                                                        ...values.filter((i) =>
                                                            ![
                                                                'cube_tags[0][map_lat]',
                                                                'cube_tags[0][map_lng]',
                                                                'cube_tags[0][address]',
                                                            ].includes(i.name)
                                                        ),
                                                        { name: 'cube_tags[0][map_lat]', value: e?.lat },
                                                        { name: 'cube_tags[0][map_lng]', value: e?.lng },
                                                        { name: 'cube_tags[0][address]', value: e?.address },
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
                                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                                if (isInformation || contentType !== 'iklan') return null;
                                return <IklanForm formControl={formControl} values={values} setValues={setValues} />;
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
                                                        ...values.filter((i) =>
                                                            ![
                                                                'cube_tags[0][map_lat]',
                                                                'cube_tags[0][map_lng]',
                                                                'cube_tags[0][address]',
                                                            ].includes(i.name)
                                                        ),
                                                        { name: 'cube_tags[0][map_lat]', value: e?.lat },
                                                        { name: 'cube_tags[0][map_lng]', value: e?.lng },
                                                        { name: 'cube_tags[0][address]', value: e?.address },
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

                        // Validation Type
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
                                                    ...values.filter((i) => i.name !== 'ads[validation_type]' && i.name !== 'ads[code]'),
                                                    { name: 'ads[validation_type]', value },
                                                    ...(value === 'manual' ? [{ name: 'ads[code]', value: '' }] : []),
                                                ]);
                                            }}
                                            validations={{ required: true }}
                                        />
                                    </div>
                                );
                            },
                        },

                        // Manual Code input
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
                                            onChange={(e) => {
                                                setValues([
                                                    ...values.filter((i) => i.name !== 'ads[code]'),
                                                    { name: 'ads[code]', value: e },
                                                ]);
                                            }}
                                            value={values.find((i) => i.name == 'ads[code]')?.value || ''}
                                            error={errors.find((i) => i.name == 'ads[code]')?.error}
                                            validations={{ required: true }}
                                        />
                                    </div>
                                );
                            },
                        },
                        // Promo / Voucher Settings (Harian, Unlimited, Kuota, Tanggal & Jam, Hari)
                        {
                            type: 'custom',
                            custom: ({ values, setValues, errors }) => {
                                const contentType = values.find((i) => i.name == 'content_type')?.value || 'promo';
                                const isInformation = values.find((i) => i.name === 'is_information')?.value?.at?.(0);
                                if (isInformation || !['promo', 'voucher'].includes(contentType)) return null;
                                const unlimited = values.find(i => i.name === 'ads[unlimited_grab]')?.value;
                                const daily = values.find(i => i.name === 'ads[is_daily_grab]')?.value;
                                return (
                                    <div className="mt-6 space-y-4">
                                        <div className="font-semibold text-base text-slate-700">Pengaturan {contentType === 'promo' ? 'Promo' : 'Voucher'}</div>
                                        <div className="flex gap-4">
                                            <CheckboxComponent
                                                label="Promo Tak Terbatas"
                                                name="ads[unlimited_grab]"
                                                onChange={() => setValues([
                                                    ...values.filter(i => i.name !== 'ads[unlimited_grab]'),
                                                    { name: 'ads[unlimited_grab]', value: unlimited ? 0 : 1 }
                                                ])}
                                                checked={!!unlimited}
                                            />
                                            <CheckboxComponent
                                                label="Promo Harian"
                                                name="ads[is_daily_grab]"
                                                onChange={() => setValues([
                                                    ...values.filter(i => i.name !== 'ads[is_daily_grab]'),
                                                    { name: 'ads[is_daily_grab]', value: daily ? 0 : 1 }
                                                ])}
                                                checked={!!daily}
                                                disabled={!!unlimited}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <InputNumberComponent
                                                    type="number"
                                                    name="ads[max_grab]"
                                                    label={daily ? 'Jumlah Promo Per Hari' : 'Jumlah Promo'}
                                                    placeholder={daily ? 'Promo yang bisa diambil per hari...' : 'Masukan Jumlah Promo...'}
                                                    validations={{ required: !unlimited, min: 1 }}
                                                    onChange={(e) => setValues([
                                                        ...values.filter(i => i.name !== 'ads[max_grab]'),
                                                        { name: 'ads[max_grab]', value: e }
                                                    ])}
                                                    value={values.find(i => i.name === 'ads[max_grab]')?.value}
                                                    error={errors.find(i => i.name === 'ads[max_grab]')?.error}
                                                    disabled={!!unlimited}
                                                />
                                            </div>
                                            <InputTimeComponent
                                                name="ads[validation_time_limit]"
                                                label="Batas Waktu Validasi"
                                                placeholder="Masukan Batas Waktu Validasi..."
                                                onChange={(v) => setValues([
                                                    ...values.filter(i => i.name !== 'ads[validation_time_limit]'),
                                                    { name: 'ads[validation_time_limit]', value: v }
                                                ])}
                                                value={values.find(i => i.name === 'ads[validation_time_limit]')?.value || ''}
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
                                                onChange={(e) => setValues([
                                                    ...values.filter(i => i.name !== 'ads[start_validate]'),
                                                    { name: 'ads[start_validate]', value: moment(e).format('DD-MM-YYYY') }
                                                ])}
                                                value={values.find(i => i.name === 'ads[start_validate]')?.value || ''}
                                                errors={errors.filter(i => i.name === 'ads[start_validate]')?.error}
                                                validations={{ required: true }}
                                            />
                                            <InputComponent
                                                type="date"
                                                name="ads[finish_validate]"
                                                label="Berakhir Pada"
                                                placeholder="Pilih Tanggal..."
                                                forceFormat="DD-MM-YYYY HH:mm:ss"
                                                onChange={(e) => setValues([
                                                    ...values.filter(i => i.name !== 'ads[finish_validate]'),
                                                    { name: 'ads[finish_validate]', value: moment(e).format('DD-MM-YYYY') }
                                                ])}
                                                value={values.find(i => i.name === 'ads[finish_validate]')?.value || ''}
                                                errors={errors.filter(i => i.name === 'ads[finish_validate]')?.error}
                                                validations={{ required: true }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <InputTimeComponent
                                                name="ads[jam_mulai]"
                                                label="Jam Mulai"
                                                placeholder="Pilih Jam..."
                                                onChange={(v) => setValues([
                                                    ...values.filter(i => i.name !== 'ads[jam_mulai]'),
                                                    { name: 'ads[jam_mulai]', value: v }
                                                ])}
                                                value={values.find(i => i.name === 'ads[jam_mulai]')?.value || ''}
                                                validations={{ required: true }}
                                            />
                                            <InputTimeComponent
                                                name="ads[jam_berakhir]"
                                                label="Jam Berakhir"
                                                placeholder="Pilih Jam..."
                                                onChange={(v) => setValues([
                                                    ...values.filter(i => i.name !== 'ads[jam_berakhir]'),
                                                    { name: 'ads[jam_berakhir]', value: v }
                                                ])}
                                                value={values.find(i => i.name === 'ads[jam_berakhir]')?.value || ''}
                                                validations={{ required: true }}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="font-medium text-sm text-slate-700">Hanya Di Waktu Tertentu</div>
                                            <div className="border border-slate-200 bg-white rounded-xl p-3 w-full">
                                                <div className="flex items-center gap-6">
                                                    {[{ key: 'weekend', label: 'Weekend' }, { key: 'weekday', label: 'Weekdays' }, { key: 'custom', label: 'Hari Lain' }].map(opt => {
                                                        const checked = values.find(i => i.name === 'ads[day_type]')?.value === opt.key;
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
                                                                                weekday: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true }
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
                                                                <span className={checked ? 'font-semibold text-slate-800' : 'text-slate-600'}>{opt.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="font-medium text-sm text-slate-700">Hanya Di Hari</div>
                                            {(() => {
                                                const dayType = values.find(i => i.name === 'ads[day_type]')?.value || 'custom';
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
                                                const selectedDay = k => !!values.find(i => i.name === `ads[custom_days][${k}]`)?.value;
                                                return (
                                                    <div className="flex flex-wrap gap-2">
                                                        {days.map(d => {
                                                            const active = selectedDay(d.key);
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={d.key}
                                                                    onClick={() => {
                                                                        if (!isCustom) return;
                                                                        const exists = values.find(i => i.name === `ads[custom_days][${d.key}]`)?.value || false;
                                                                        setValues([
                                                                            ...values.filter(i => i.name !== `ads[custom_days][${d.key}]`),
                                                                            { name: `ads[custom_days][${d.key}]`, value: !exists }
                                                                        ]);
                                                                    }}
                                                                    className={[
                                                                        'px-3 py-1.5 rounded-md border text-sm font-medium transition',
                                                                        active ? 'bg-green-600 text-white border-green-600 shadow' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400',
                                                                        isCustom ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'
                                                                    ].join(' ')}
                                                                >{d.label}</button>
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
                        // Voucher target type
                        {
                            type: 'custom',
                            custom: ({ formControl, values, setValues }) => {
                                const contentType = getCT(values);
                                if (contentType !== 'voucher') return null;
                                const fc = formControl('target_type');
                                const current = fc.value ?? 'all';
                                const handleChange = v => {
                                    const newValue = v?.target?.value ?? v?.value ?? v;
                                    fc.onChange(newValue);
                                    setValues(prev => prev.filter(i => !['target_user_ids', 'community_id'].includes(i.name)));
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
                            }
                        },
                        // Community selection
                        {
                            type: 'custom',
                            custom: ({ values, setValues }) => {
                                const contentType = getCT(values);
                                const targetType = values.find(i => i.name === 'target_type')?.value;
                                if (contentType !== 'voucher' || targetType !== 'community') return null;
                                const currentValue = values.find(i => i.name === 'community_id')?.value || '';
                                return (
                                    <SelectComponent
                                        name="community_id"
                                        label="Pilih Komunitas"
                                        placeholder="Pilih komunitas yang bisa menggunakan voucher"
                                        required
                                        value={currentValue}
                                        onChange={(val) => setValues([
                                            ...values.filter(i => i.name !== 'community_id'),
                                            { name: 'community_id', value: val }
                                        ])}
                                        serverOptionControl={{ path: 'admin/options/community' }}
                                    />
                                );
                            }
                        },
                        // User selection
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
                                            options={onlyUsers.map(u => ({ label: `${u.name || u.email || `#${u.id}`}`, value: u.id }))}
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
                            }
                        },
                        // Opening hours toggle
                        {
                            type: 'custom',
                            custom: ({ values, setValues, errors }) => {
                                const contentType = values.find(i => i.name === 'content_type')?.value || 'promo';
                                const information = values.find(i => i.name === 'is_information')?.value?.at?.(0);
                                if (information || contentType === 'iklan' || contentType === 'kubus-informasi') return null;
                                const openHours = values.find(i => i.name === 'openHours')?.value;
                                return (
                                    <div className="mt-3">
                                        <ToggleComponent
                                            label="Tambahkan Jam Buka"
                                            name="openHours"
                                            onChange={() => setValues([
                                                ...values.filter(i => i.name !== 'openHours'),
                                                { name: 'openHours', value: !openHours }
                                            ])}
                                            checked={!!openHours}
                                        />
                                        {openHours && (
                                            <div className="bg-stone-50 py-6">
                                                <InputOpenHours values={values} setValues={setValues} errors={errors} />
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        },
                    ],
                }), [selected, merchantManagers, managersLoading, managersError, isAdsEditMode, pendingEditRow, createImageField, resetCropState, scope?.corporate_id, onlyUsers])}

                formUpdateControl={isAdsEditMode ? {
                    customDefaultValue: (data) => ({
                        ...mapUpdateDefault(data),
                        _method: 'PUT',
                        id: data?.ads?.[0]?.id,
                        __endpoint_override: `admin/ads/${data?.ads?.[0]?.id}`,
                        cube_id: data?.id,
                        ...(scope?.corporate_id ? { corporate_id: scope.corporate_id } : {}),
                    }),
                    contentType: 'multipart/form-data',
                    updateEndpointOverride: (d) => `admin/ads/${d?.ads?.[0]?.id}`,
                    transformData: (formData) => {
                        if (formData.content_type === 'voucher') {
                            const transformed = prepareKubusVoucherData(formData);
                            return transformed;
                        }
                        return formData;
                    },
                } : {
                    customDefaultValue: (data) => ({
                        ...mapUpdateDefault(data),
                        ...(scope?.corporate_id ? { corporate_id: scope.corporate_id } : {}),
                    }),
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
                        // Recommendation checkbox
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
                                const isInfoVal = values?.find(i => i.name == 'is_information')?.value;
                                const info = Array.isArray(isInfoVal) && isInfoVal.length > 0;
                                if (info) return null;
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
                        // Map editor when change_map is on
                        {
                            type: 'custom',
                            custom: ({ values, setValues }) => {
                                const isInfoVal = values?.find((i) => i.name == 'is_information')?.value;
                                const info = Array.isArray(isInfoVal) && isInfoVal.length > 0;
                                if (info) return null;
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
                                                const rm = ['map_lat', 'map_lng', 'address', 'cube_tags[0][map_lat]', 'cube_tags[0][map_lng]', 'cube_tags[0][address]'];
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
                        // Hidden flag update_location
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
                        filter={[{ column: 'ad_id', type: 'equal', value: data?.ads?.at(0)?.id }]}
                        mode={data?.ads?.at(0)?.type === 'voucher' ? 'voucher' : 'promo'}
                        voucherCode={data?.ads?.at(0)?.code}
                    />
                )}

                actionControl={{
                    except: ['edit'],
                    include: (row, ctx) => (
                        <>
                            <ButtonComponent
                                icon={faFilePen}
                                label={'Ubah Iklan'}
                                variant="outline"
                                paint={'warning'}
                                size={'xs'}
                                rounded
                                onClick={() => {
                                    resetCropState();
                                    formValuesRef.current = [];
                                    setPendingEditRow(row);
                                    setIsAdsEditMode(true);
                                    setSelected(row);
                                    setIsFormEdit(true);
                                    // setTableCtx(ctx); // removed
                                    ctx.setDataSelected?.(row);
                                    ctx.setModalForm?.(true);
                                }}
                            />
                            <ButtonComponent
                                label={row?.status === 'active' ? 'Non-Aktifkan' : 'Aktifkan'}
                                variant="outline"
                                paint={row?.status === 'active' ? 'danger' : 'success'}
                                size={'xs'}
                                rounded
                                onClick={() => { setSelected(row); setUpdateStatus(true); }}
                            />
                        </>
                    )
                }}
                onStoreSuccess={() => {
                    setSelected(null);
                    setRefresh(r => !r);
                    resetCropState();
                    setIsAdsEditMode(false);
                    formValuesRef.current = [];
                    standIn.clear('option_admin/options/ad-category');
                }}
                onUpdateSuccess={() => {
                    setSelected(null);
                    setIsAdsEditMode(false);
                    standIn.clear('option_admin/options/ad-category');
                    setIsFormEdit(false);
                    setPendingEditRow(null);
                    formValuesRef.current = [];
                    resetCropState();
                    setRefresh(r => !r);
                }}
                onModalClose={() => {
                    setSelected(null);
                    resetCropState();
                    setIsAdsEditMode(false);
                    formValuesRef.current = [];
                    setIsFormEdit(false);
                    setPendingEditRow(null);
                    // setTableCtx(null); // removed
                    standIn.clear('option_admin/options/ad-category');
                }}
            />

            <CropperDialog
                open={cropOpen}
                imageUrl={rawImageUrl}
                onClose={() => {
                    setCropOpen(false);
                    setTimeout(() => resetCropState(), 50);
                }}
                onSave={(file) => {
                    handleCropSave(file);
                }}
                aspect={1}
            />
            <UpdateCubeStatusModal
                data={selected}
                show={updateStatus}
                setShow={setUpdateStatus}
                onSuccess={() => {
                    setUpdateStatus(false);
                    setRefresh(r => !r);
                }}
            />
            <VoucherModal
                data={selected}
                show={voucherModal}
                setShow={setVoucherModal}
                onSuccess={() => { setRefresh(r => !r); }}
            />
        </div>
    );
}

export default CorporateKubusPage;
