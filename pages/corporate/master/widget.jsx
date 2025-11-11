/* Corporate Widget Management Page (limited types: hunting & information) */
import { useState } from 'react';
import {
    ButtonComponent,
    IconButtonComponent,
    ModalConfirmComponent,
    SelectComponent,
    TableSupervisionComponent,
    RadioComponent,
} from '../../../components/base.components';
import { CorporateLayout } from '../../../components/construct.components/layout/Corporate.layout';
import { post } from '../../../helpers';
import { faArrowDown, faArrowUp, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function CorporateWidget() {
    // Only two types allowed here
    const [type, setType] = useState('hunting'); // 'hunting' | 'information'
    const [communityId, setCommunityId] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(false); // false | 'active' | 'non-active'
    const [selected, setSelected] = useState(null);
    const [loadingUpdateStatus, setLoadingUpdateStatus] = useState(false);

    const tableKey = `${type}-${communityId ?? 'all'}`;

    return (
        <div className="p-2 md:p-6 rounded-2xl bg-slate-50 min-h-screen">
            <h1 className="text-xl font-bold mb-6 text-slate-700 tracking-wide">Manajemen Widget</h1>

            <TableSupervisionComponent
                key={tableKey}
                title="Widget"
                fetchControl={{
                    path: 'admin/dynamic-content', // assuming corporate uses same endpoint
                    includeParams: {
                        community_id: communityId ? communityId : undefined,
                    },
                }}
                setToRefresh={refresh}
                customTopBarWithForm={({ setModalForm }) => (
                    <>
                        <div className="flex justify-between">
                            <div className="flex gap-2">
                                <ButtonComponent
                                    label="Beranda Promo"
                                    size="sm"
                                    variant={type === 'hunting' ? 'solid' : 'outline'}
                                    onClick={() => {
                                        setType('hunting');
                                        setRefresh(r => !r);
                                    }}
                                />
                                <ButtonComponent
                                    label="Beranda Komunitas"
                                    size="sm"
                                    variant={type === 'information' ? 'solid' : 'outline'}
                                    onClick={() => {
                                        setType('information');
                                        setRefresh(r => !r);
                                    }}
                                />
                            </div>
                            <div>
                                <ButtonComponent
                                    label="Tambah Baru"
                                    size="sm"
                                    onClick={() => setModalForm(true)}
                                />
                            </div>
                        </div>
                    </>
                )}
                headBar={
                    <div>
                        <SelectComponent
                            placeholder="Filter Komunitas"
                            serverOptionControl={{
                                path: 'admin/communities',
                                mapOptions: (data) =>
                                    Array.isArray(data)
                                        ? data.map((item) => ({ label: item.name, value: item.id }))
                                        : [],
                            }}
                            value={communityId}
                            onChange={(e) => setCommunityId(e)}
                        />
                    </div>
                }
                includeFilters={[
                    {
                        column: 'type',
                        type: 'equal',
                        value: type,
                    },
                ]}
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
                            selector: 'type',
                            label: 'Halaman',
                            sortable: true,
                            width: '150px',
                            item: ({ type }) => (type === 'hunting' ? 'Berburu' : 'Komunitas'),
                        },
                        {
                            selector: 'community',
                            label: 'Komunitas',
                            sortable: true,
                            width: '200px',
                            item: ({ community }) => community?.name || '-',
                        },
                        {
                            selector: 'status',
                            label: 'Status',
                            sortable: true,
                            width: '150px',
                            item: ({ is_active }) =>
                                is_active ? (
                                    <span className="uppercase font-medium text-green-600 py-1 px-2.5 rounded-md text-sm bg-green-100">
                                        Aktif
                                    </span>
                                ) : (
                                    <span className="uppercase font-medium text-red-600 py-1 px-2.5 rounded-md text-sm bg-red-100">
                                        Tidak Aktif
                                    </span>
                                ),
                        },
                    ],
                }}
                formControl={{
                    customDefaultValue: {
                        type,
                        community_id: communityId ?? undefined,
                    },
                    custom: [
                        {
                            construction: {
                                name: 'name',
                                label: 'Nama',
                                placeholder: 'Masukkan nama...',
                            },
                        },
                        {
                            construction: {
                                name: 'description',
                                label: 'Deskripsi',
                                placeholder: 'Masukkan deskripsi singkat...',
                            },
                        },
                        {
                            type: 'custom',
                            custom: ({ formControl }) => (
                                <SelectComponent
                                    name="community_id"
                                    {...formControl('community_id')}
                                    label="Komunitas (Wajib)"
                                    placeholder="Pilih komunitas..."
                                    required={true}
                                    serverOptionControl={{
                                        path: 'admin/communities',
                                        mapOptions: (data) =>
                                            Array.isArray(data)
                                                ? data.map((item) => ({ label: item.name, value: item.id }))
                                                : [],
                                    }}
                                />
                            ),
                        },
                        {
                            type: 'select',
                            construction: {
                                name: 'content_type',
                                label: 'Jenis Konten',
                                placeholder: 'Pilih jenis tampilan konten...',
                                options: [
                                    { label: 'Kotak Kategori', value: 'category_box' },
                                    { label: 'Promo / Iklan', value: 'promo' },
                                ],
                            },
                        },
                        {
                            type: 'custom',
                            custom: ({ formControl, values }) => {
                                const content_type = values.find((val) => val.name === 'content_type')?.value;
                                const source_type = values.find((val) => val.name === 'source_type')?.value;

                                if (content_type === 'category_box') {
                                    return (
                                        <div className="mt-2">
                                            <input
                                                type="hidden"
                                                name="source_type"
                                                value="category_box"
                                                {...formControl('source_type')}
                                            />
                                            <p className="text-sm text-slate-500 italic">
                                                Kotak kategori akan menampilkan semua kategori utama.
                                            </p>
                                        </div>
                                    );
                                }

                                if (content_type === 'promo') {
                                    return (
                                        <>
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1">
                                                    <SelectComponent
                                                        name="source_type"
                                                        {...formControl('source_type')}
                                                        label="Sumber Konten"
                                                        placeholder="Pilih sumber konten..."
                                                        options={[
                                                            { label: 'Promo/Iklan Acak', value: 'shuffle_cube' },
                                                            { label: 'Promo/Iklan Pilihan', value: 'cube' },
                                                            { label: 'Iklan Huehuy', value: 'ad' },
                                                            { label: 'Kategori Iklan', value: 'ad_category' },
                                                        ]}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                                            Ukuran
                                                        </label>
                                                        <div className="flex flex-wrap gap-3 mt-1">
                                                            {['S', 'M', 'L', 'XL', 'XL-Ads'].map((opt) => (
                                                                <RadioComponent
                                                                    key={opt}
                                                                    name="size"
                                                                    label={opt}
                                                                    value={opt}
                                                                    checked={
                                                                        String(
                                                                            values.find((val) => val.name === 'size')?.value ||
                                                                            formControl('size')?.value ||
                                                                            ''
                                                                        ) === opt
                                                                    }
                                                                    onChange={() => {
                                                                        if (formControl('size') && typeof formControl('size').onChange === 'function') {
                                                                            formControl('size').onChange(opt);
                                                                        }
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {source_type === 'ad_category' && (
                                                <div className="mt-4">
                                                    <SelectComponent
                                                        name="ad_category_id"
                                                        {...formControl('ad_category_id')}
                                                        label="Kategori Iklan"
                                                        placeholder="Pilih kategori iklan..."
                                                        serverOptionControl={{
                                                            path: 'admin/options/ad-category',
                                                            mapOptions: (data) =>
                                                                Array.isArray(data)
                                                                    ? data.map((item) => ({
                                                                        label: item?.label || item?.name || `Kategori #${item?.id}`,
                                                                        value: item?.value || item?.id,
                                                                    }))
                                                                    : [],
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    );
                                }

                                return null;
                            },
                        },
                        {
                            type: 'custom',
                            custom: ({ formControl, values }) => {
                                const source_type = values.find(val => val.name === 'source_type')?.value;
                                if (source_type === 'cube') {
                                    return (
                                        <SelectComponent
                                            name="dynamic_content_cubes"
                                            {...formControl('dynamic_content_cubes')}
                                            label="Kubus"
                                            placeholder="Pilih kubus..."
                                            serverOptionControl={{
                                                path: 'admin/options/cube?paginate=all',
                                                mapOptions: (resp) => {
                                                    const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
                                                    return list.map(item => ({
                                                        label: item?.label || item?.name || `Cube #${item?.id}`,
                                                        value: item?.value || item?.id,
                                                    }));
                                                },
                                            }}
                                            searchable
                                            multiple
                                            onChange={(value) => {
                                                if (formControl('dynamic_content_cubes')?.onChange) {
                                                    formControl('dynamic_content_cubes').onChange(value);
                                                }
                                            }}
                                        />
                                    );
                                }
                                return null;
                            },
                        },
                    ],
                }}
                formUpdateControl={{
                    customDefaultValue: (data) => ({
                        ...data,
                        community_id: data?.community_id ?? undefined,
                        source_type: data?.source_type ?? undefined,
                        dynamic_content_cubes: Array.isArray(data?.dynamic_content_cubes)
                            ? data.dynamic_content_cubes.map((item) => item.cube_id)
                            : undefined,
                    }),
                }}
                actionControl={{
                    except: ['detail'],
                    custom: (
                        data,
                        { setModalForm, setModalDelete, setDataSelected },
                        hasPermission,
                        length
                    ) => (
                        <>
                            <IconButtonComponent
                                icon={faArrowUp}
                                size="sm"
                                variant="outline"
                                disabled={data.level <= 1}
                                onClick={async () => {
                                    const execute = await post({
                                        path: 'admin/dynamic-content/' + data?.id,
                                        body: { _method: 'PUT', level: data.level - 1 },
                                    });
                                    if (execute.status === 200) setRefresh((r) => !r);
                                }}
                            />
                            <IconButtonComponent
                                icon={faArrowDown}
                                size="sm"
                                variant="outline"
                                disabled={data.level >= length}
                                onClick={async () => {
                                    const execute = await post({
                                        path: 'admin/dynamic-content/' + data?.id,
                                        body: { _method: 'PUT', level: data.level + 1 },
                                    });
                                    if (execute.status === 200) setRefresh((r) => !r);
                                }}
                            />
                            <IconButtonComponent
                                icon={faEdit}
                                size="sm"
                                variant="outline"
                                paint="warning"
                                onClick={() => {
                                    setDataSelected(data);
                                    setModalForm(true);
                                }}
                            />
                            <ButtonComponent
                                label={data?.is_active ? 'Non-Aktifkan' : 'Aktifkan'}
                                variant="outline"
                                paint={data?.is_active ? 'danger' : 'success'}
                                size={'xs'}
                                rounded
                                onClick={() => {
                                    setSelected(data);
                                    setUpdateStatus(!data?.is_active ? 'active' : 'non-active');
                                }}
                            />
                            <IconButtonComponent
                                icon={faTrash}
                                size="sm"
                                variant="outline"
                                paint="danger"
                                onClick={() => {
                                    setDataSelected(data);
                                    setModalDelete(true);
                                }}
                            />
                        </>
                    ),
                }}
            />

            <ModalConfirmComponent
                title={updateStatus === 'active' ? 'Yakin Ingin Mengaktifkan Widget' : 'Yakin Ingin Nonaktifkan Widget'}
                show={!!updateStatus}
                onClose={() => {
                    setUpdateStatus(false);
                    setSelected(null);
                }}
                onSubmit={async () => {
                    setLoadingUpdateStatus(true);
                    if (selected !== null) {
                        const response = await post({
                            path: 'admin/dynamic-content/' + selected?.id,
                            body: { _method: 'PUT', is_active: updateStatus === 'active' ? 1 : 0 },
                        });
                        if (response?.status === 200 || response?.status === 201) {
                            setLoadingUpdateStatus(false);
                            setRefresh((r) => !r);
                            setSelected(null);
                            setUpdateStatus(false);
                        } else {
                            setLoadingUpdateStatus(false);
                        }
                    }
                }}
                submitButton={{
                    label: 'Ya',
                    loading: loadingUpdateStatus,
                }}
            />
        </div>
    );
}

CorporateWidget.getLayout = function getLayout(page) {
    return <CorporateLayout>{page}</CorporateLayout>;
};
