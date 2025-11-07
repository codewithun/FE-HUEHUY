import React, { useEffect } from 'react';
import Image from 'next/image';
import {
    ButtonComponent,
    TableSupervisionComponent,
} from '../../../components/base.components';
import InputHexColor from '../../../components/construct.components/input/InputHexColor';
import { CorporateLayout } from '../../../components/construct.components/layout/Corporate.layout';
import { useUserContext } from '../../../context/user.context';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../helpers';

export default function KomunitasCorporate() {
    const { profile: Profile } = useUserContext();

    // Ensure API/file URLs are correct across environments
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    const FILE_ORIGIN = API_BASE.replace(/\/api$/i, '');
    const apiJoin = (path = '') => {
        const ensured = /\/api$/i.test(API_BASE) ? API_BASE : `${API_BASE}/api`;
        return `${ensured}/${String(path).replace(/^\/+/, '')}`;
    };
    const toStoragePath = (p = '') => `storage/${String(p).replace(/^\/+/, '').replace(/^storage\/+/, '')}`;
    const fileUrl = (relativePath = '') => {
        // Allow using Next.js rewrites for '/communities/**' as well
        if (/^(communities|ads)\//i.test(relativePath)) {
            const withSlash = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
            return withSlash; // will be rewritten to FILE_ORIGIN/storage/... by next.config.js
        }
        // Default: absolute URL to storage
        return `${FILE_ORIGIN}/${toStoragePath(relativePath)}`;
    };

    useEffect(() => {
        if (Cookies.get(token_cookie_name) && Profile) {
            if (!Profile?.corporate_user?.corporate_id) {
                Cookies.remove(token_cookie_name);
                if (typeof window !== 'undefined') window.location.href = '/corporate';
            }
        }
    }, [Profile]);

    return (
        <>
            <TableSupervisionComponent
                title="Manajemen Komunitas"
                fetchControl={{
                    path: 'corporate/communities',
                    // Use full URL to guarantee /api prefix across environments
                    url: apiJoin('corporate/communities'),
                }}
                searchable
                noControlBar={false}
                columnControl={{
                    custom: [
                        {
                            selector: 'name',
                            label: 'Nama Komunitas',
                            sortable: true,
                            item: ({ name }) => <span className="font-semibold">{name}</span>,
                        },
                        {
                            selector: 'description',
                            label: 'Deskripsi',
                            item: ({ description }) => description || '-',
                        },
                        {
                            selector: 'logo',
                            label: 'Logo',
                            width: '100px',
                            item: ({ logo }) => (
                                logo ? (
                                    <Image
                                        src={logo?.startsWith?.('http') ? logo : fileUrl(logo)}
                                        alt="Logo"
                                        width={48}
                                        height={48}
                                        className="rounded"
                                    />
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )
                            ),
                        },
                        {
                            selector: 'is_active',
                            label: 'Status',
                            width: '110px',
                            item: (row) => (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {row.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            ),
                        },
                    ],
                }}
                customTopBarWithForm={({ setModalForm }) => (
                    <ButtonComponent label="Tambah Komunitas" paint="primary" onClick={() => setModalForm(true)} />
                )}
                formControl={{
                    contentType: 'multipart/form-data',
                    customDefaultValue: {
                        corporate_id: Profile?.corporate_user?.corporate_id || '',
                        is_active: 1,
                    },
                    custom: [
                        {
                            construction: {
                                name: 'name',
                                label: 'Nama',
                                placeholder: 'Masukkan Nama..',
                                validations: { required: true },
                            },
                            col: 12,
                        },
                        {
                            type: 'image',
                            construction: { name: 'logo', label: 'Logo', accept: 'image/*' },
                            col: 3,
                        },
                        {
                            type: 'textarea',
                            construction: {
                                name: 'description',
                                label: 'Deskripsi',
                                placeholder: 'Masukkan Deskripsi...',
                                rows: 6,
                            },
                            col: 9,
                        },
                        {
                            type: 'custom',
                            col: 6,
                            custom: ({ values, setValues, errors }) => (
                                <InputHexColor name="bg_color_1" label="Warna Background 1" values={values} setValues={setValues} errors={errors} />
                            ),
                        },
                        {
                            type: 'custom',
                            col: 6,
                            custom: ({ values, setValues, errors }) => (
                                <InputHexColor name="bg_color_2" label="Warna Background 2" values={values} setValues={setValues} errors={errors} />
                            ),
                        },
                        {
                            type: 'select',
                            construction: {
                                name: 'world_type',
                                label: 'Akses Komunitas',
                                placeholder: 'Pilih Akses Komunitas..',
                                options: [
                                    { label: 'Publik', value: 'public' },
                                    { label: 'Private', value: 'private' },
                                ],
                                searchable: false,
                            },
                            col: 12,
                        },
                        {
                            type: 'check',
                            construction: {
                                name: 'is_active',
                                label: 'Aktif',
                                options: [{ label: 'Aktif', value: 1 }],
                            },
                            col: 12,
                        },
                    ],
                }}
                formUpdateControl={{
                    customDefaultValue: (data) => ({ ...data }),
                }}
                actionControl={{
                    except: ['detail'],
                }}
            />
        </>
    );
}

KomunitasCorporate.getLayout = function getLayout(page) {
    return <CorporateLayout>{page}</CorporateLayout>;
};
