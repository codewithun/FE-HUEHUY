import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { faUserPlus, faHistory, faPlus } from "@fortawesome/free-solid-svg-icons";
import {
    ButtonComponent,
    TableSupervisionComponent,
    InputComponent,
    SelectComponent,
} from '../../../components/base.components';
import { FloatingPageComponent } from '../../../components/base.components/modal/FloatingPage.component';
import InputHexColor from '../../../components/construct.components/input/InputHexColor';
import { CorporateLayout } from '../../../components/construct.components/layout/Corporate.layout';
import { useUserContext } from '../../../context/user.context';
import Cookies from 'js-cookie';
import { Decrypt } from '../../../helpers/encryption.helpers';
import { corporate_token_cookie_name, admin_token_cookie_name } from '../../../helpers/api.helpers';

export default function KomunitasCorporate() {
    const { profile: Profile } = useUserContext();

    // Local states for modals
    const [activeCommunity, setActiveCommunity] = useState(null);
    const [modalMember, setModalMember] = useState(false);
    const [modalCubes, setModalCubes] = useState(false);
    const [modalMemberRequests, setModalMemberRequests] = useState(false);
    const [modalMemberHistory, setModalMemberHistory] = useState(false);
    const [modalAddMember, setModalAddMember] = useState(false);
    const [refreshRequestsToggle, setRefreshRequestsToggle] = useState(false);
    const [refreshMembersToggle, setRefreshMembersToggle] = useState(false);
    const [memberHistoryError, setMemberHistoryError] = useState('');
    const [cubeList, setCubeList] = useState([]);
    const [cubeLoading, setCubeLoading] = useState(false);
    const [cubeError, setCubeError] = useState('');
    // Search & filter untuk Cube table (Widget Asal)
    const [cubeTypeFilter, setCubeTypeFilter] = useState([]); // ['home','hunting','information']
    const [cubeWidgetSearch, setCubeWidgetSearch] = useState('');

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

    // Auth headers helper (decrypt token from cookie/localStorage)
    const authHeaders = (method = 'GET') => {
        try {
            const isBrowser = typeof window !== 'undefined';
            // Prioritaskan token corporate; fallback ke admin bila ada
            const names = [corporate_token_cookie_name, admin_token_cookie_name];
            let enc;
            for (const name of names) {
                enc = Cookies.get(name);
                if (!enc && isBrowser) {
                    const ls = localStorage.getItem(name);
                    enc = ls === null ? undefined : ls;
                }
                if (enc) break;
            }
            const token = enc ? Decrypt(enc) : '';
            const base = { Accept: 'application/json' };
            if (token) base['Authorization'] = `Bearer ${token}`;
            if (["POST", "PUT", "PATCH", "DELETE"].includes(String(method).toUpperCase())) {
                base['Content-Type'] = 'application/json';
            }
            return base;
        } catch {
            return { Accept: 'application/json' };
        }
    };

    useEffect(() => {
        if (Cookies.get(corporate_token_cookie_name) && Profile) {
            if (!Profile?.corporate_user?.corporate_id) {
                Cookies.remove(corporate_token_cookie_name);
                if (typeof window !== 'undefined') window.location.href = '/corporate';
            }
        }
    }, [Profile]);

    // Helper functions untuk modal requests dan history
    const openMemberRequestsModal = (communityRow) => {
        setActiveCommunity(communityRow);
        setModalMemberRequests(true);
    };

    const openMemberHistoryModal = async (communityRow) => {
        setActiveCommunity(communityRow);
        setMemberHistoryError('');
        setModalMemberHistory(true);
    };

    const handleMemberRequest = async (requestId, action) => {
        try {
            const res = await fetch(apiJoin(`corporate/member-requests/${requestId}/${action}`), {
                method: 'POST',
                headers: authHeaders('POST'),
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            setRefreshRequestsToggle((s) => !s);
        } catch (err) {
            // Log error for debugging
            alert(`Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'} permintaan`);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!activeCommunity?.id || !userId) return;
        const ok = confirm('Yakin ingin menghapus anggota ini dari komunitas?');
        if (!ok) return;
        try {
            const res = await fetch(
                apiJoin(`corporate/communities/${activeCommunity.id}/members/${userId}`),
                { method: 'DELETE', headers: authHeaders('DELETE') }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setRefreshMembersToggle((s) => !s);
        } catch (e) {
            alert('Gagal menghapus anggota');
        }
    };

    // Client-side filtered cube list by widget type (dropdown) + search (widget name/type/cube name)
    const filteredCubeList = useMemo(() => {
        const q = String(cubeWidgetSearch || '').toLowerCase().trim();
        const types = Array.isArray(cubeTypeFilter)
            ? cubeTypeFilter.map((t) => String(t).toLowerCase())
            : [];
        return (Array.isArray(cubeList) ? cubeList : []).filter((c) => {
            // Filter by widget type (dropdown)
            if (types.length > 0 && !types.includes(String(c.widget_type || '').toLowerCase())) {
                return false;
            }
            // Filter by search query (widget name, widget type, cube name)
            if (q) {
                const name = String(c.name || '').toLowerCase();
                const widgetName = String(c.widget_name || '').toLowerCase();
                const widgetType = String(c.widget_type || '').toLowerCase();
                return name.includes(q) || widgetName.includes(q) || widgetType.includes(q);
            }
            return true;
        });
    }, [cubeList, cubeWidgetSearch, cubeTypeFilter]);

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
                    include: (row) => (
                        <div className="flex items-center gap-2">
                            <ButtonComponent
                                label="Anggota"
                                size="xs"
                                paint="secondary"
                                variant="solid"
                                rounded
                                onClick={() => {
                                    setActiveCommunity(row);
                                    setModalMember(true);
                                }}
                            />
                            <ButtonComponent
                                label="Lihat Kubus"
                                size="xs"
                                paint="info"
                                variant="outline"
                                rounded
                                onClick={async () => {
                                    setActiveCommunity(row);
                                    setModalCubes(true);
                                    setCubeLoading(true);
                                    setCubeError('');
                                    setCubeList([]);
                                    try {
                                        const res = await fetch(apiJoin(`corporate/communities/${row?.id}/cubes`), {
                                            headers: authHeaders('GET')
                                        });
                                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                        const json = await res.json();
                                        const items = json?.data || json || [];
                                        setCubeList(Array.isArray(items) ? items : []);
                                    } catch (e) {
                                        setCubeError('Gagal memuat daftar kubus');
                                    } finally {
                                        setCubeLoading(false);
                                    }
                                }}
                            />
                        </div>
                    ),
                }}
            />

            {/* Modal Anggota */}
            <FloatingPageComponent
                show={modalMember}
                onClose={() => setModalMember(false)}
                title={`Anggota: ${activeCommunity?.name || '-'}`}
                size="lg"
            >
                <div className="p-6">
                    {activeCommunity ? (
                        <TableSupervisionComponent
                            key={`member-table-${activeCommunity?.id}`}
                            title={`Daftar Anggota`}
                            fetchControl={{
                                url: apiJoin(`corporate/communities/${activeCommunity?.id}/members`),
                                headers: () => authHeaders('GET')
                            }}
                            setToRefresh={refreshMembersToggle}
                            searchable
                            noControlBar={false}
                            unUrlPage
                            customTopBar={
                                <div className="flex items-center justify-between w-full">
                                    <ButtonComponent
                                        label="Tambah Baru"
                                        icon={faPlus}
                                        size="sm"
                                        paint="primary"
                                        onClick={() => setModalAddMember(true)}
                                    />
                                    <div className="flex items-center gap-3">
                                        <ButtonComponent
                                            label="Permintaan Bergabung"
                                            icon={faUserPlus}
                                            size="sm"
                                            paint="warning"
                                            variant="outline"
                                            rounded
                                            onClick={() => openMemberRequestsModal(activeCommunity)}
                                        />
                                        <ButtonComponent
                                            label="Riwayat Member"
                                            icon={faHistory}
                                            size="sm"
                                            paint="warning"
                                            variant="outline"
                                            rounded
                                            onClick={() => openMemberHistoryModal(activeCommunity)}
                                        />
                                    </div>
                                </div>
                            }
                            columnControl={{
                                custom: [
                                    {
                                        selector: 'name',
                                        label: 'Nama',
                                        item: (member) => (
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-medium text-white">
                                                        {(member.name || member.full_name || '?').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {member.name || member.full_name || '-'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{member.email || '-'}</div>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    { selector: 'email', label: 'Email', item: (m) => m.email || '-' },
                                    { selector: 'phone', label: 'Telepon', item: (m) => m.phone || '-' },
                                    { selector: 'role', label: 'Role', item: (m) => m.role?.name || m.role || '-' },
                                ],
                            }}
                            actionControl={{
                                except: ['edit', 'detail'],
                            }}
                        />
                    ) : null}
                </div>
            </FloatingPageComponent>

            {/* Modal Kubus */}
            <FloatingPageComponent
                show={modalCubes}
                onClose={() => {
                    setModalCubes(false);
                    setCubeTypeFilter([]);
                    setCubeWidgetSearch('');
                }}
                title={`Daftar Kubus: ${activeCommunity?.name || '-'}`}
                size="lg"
            >
                <div className="p-6">
                    {cubeLoading ? (
                        <div className="py-10 text-center text-gray-500 font-medium">Memuat kubus…</div>
                    ) : cubeError ? (
                        <div className="py-10 text-center text-red-600 font-semibold">{cubeError}</div>
                    ) : cubeList.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 font-medium">Tidak ada kubus dalam komunitas ini.</div>
                    ) : (
                        <TableSupervisionComponent
                            key={`cube-table-${activeCommunity?.id}-${cubeList.length}`}
                            title={`Daftar Kubus (${cubeList.length})`}
                            data={filteredCubeList}
                            customTopBar={
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-64">
                                        <SelectComponent
                                            name="widgetTypeFilter"
                                            label="Tipe Widget"
                                            placeholder="Pilih tipe..."
                                            multiple
                                            searchable={false}
                                            options={[
                                                { label: 'Home', value: 'home' },
                                                { label: 'Hunting', value: 'hunting' },
                                                { label: 'Information', value: 'information' },
                                            ]}
                                            value={cubeTypeFilter}
                                            onChange={(val) => setCubeTypeFilter(Array.isArray(val) ? val : [])}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <InputComponent
                                            name="widgetSearch"
                                            label="Cari Widget/Tipe/Nama Kubus"
                                            placeholder="Contoh: home / hunting / information / nama widget"
                                            size="md"
                                            value={cubeWidgetSearch}
                                            onChange={(e) => setCubeWidgetSearch(String(e || ''))}
                                        />
                                    </div>
                                </div>
                            }
                            noControlBar={false}
                            unUrlPage
                            searchable={false}
                            columnControl={{
                                custom: [
                                    {
                                        selector: 'name',
                                        label: 'Nama Kubus',
                                        item: (cube) => cube.name ?? '-',
                                    },
                                    {
                                        selector: 'widget_name',
                                        label: 'Widget Asal',
                                        item: (cube) => (
                                            <div>
                                                <span className="font-medium text-gray-800">{cube.widget_name ?? '-'}</span>
                                                <div className="text-xs text-gray-500 italic">({cube.widget_type ?? 'unknown'})</div>
                                            </div>
                                        ),
                                    },
                                    {
                                        selector: 'widget_type',
                                        label: 'Tipe',
                                        width: '120px',
                                        item: (cube) => (
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                                                {(cube.widget_type || '-').toString().charAt(0).toUpperCase() + (cube.widget_type || '-').toString().slice(1)}
                                            </span>
                                        ),
                                    },
                                    {
                                        selector: 'type',
                                        label: 'Status',
                                        item: (cube) => (
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs ${cube.type === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {cube.type === 'active' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        ),
                                    },
                                    {
                                        selector: 'created_at',
                                        label: 'Dibuat Pada',
                                        item: (cube) =>
                                            cube.created_at
                                                ? new Date(cube.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })
                                                : '-',
                                    },
                                ],
                            }}
                            actionControl={{
                                except: ['edit', 'delete'],
                            }}
                        />
                    )}
                </div>
            </FloatingPageComponent>

            {/* Modal Permintaan Bergabung */}
            <FloatingPageComponent
                show={modalMemberRequests}
                onClose={() => setModalMemberRequests(false)}
                title={`Permintaan Bergabung: ${activeCommunity?.name || '-'}`}
                size="lg"
            >
                <div className="p-6">
                    <TableSupervisionComponent
                        key={`member-requests-${activeCommunity?.id}-${refreshRequestsToggle}`}
                        title="Daftar Permintaan Bergabung"
                        searchable
                        noControlBar={false}
                        unUrlPage
                        setToRefresh={refreshRequestsToggle}
                        fetchControl={{
                            url: apiJoin(`corporate/communities/${activeCommunity?.id}/member-requests`),
                            headers: () => authHeaders('GET')
                        }}
                        customTopBar={<div />}
                        columnControl={{
                            custom: [
                                {
                                    selector: 'name',
                                    label: 'Nama',
                                    sortable: true,
                                    item: (row) => (
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-white">
                                                    {(row.user?.name || row.user?.full_name || '?').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {row.user?.name || row.user?.full_name || '-'}
                                                </div>
                                                <div className="text-xs text-gray-500">{row.user?.email || '-'}</div>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    selector: 'status',
                                    label: 'Status',
                                    item: (row) => (
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${row.status === 'approved'
                                            ? 'bg-green-100 text-green-800'
                                            : row.status === 'rejected'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {row.status === 'approved' ? 'Disetujui' :
                                                row.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                        </span>
                                    ),
                                },
                                {
                                    selector: 'created_at',
                                    label: 'Diminta Pada',
                                    sortable: true,
                                    item: (row) => (
                                        <span className="text-sm text-gray-600">
                                            {row.created_at
                                                ? new Date(row.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                                : '-'}
                                        </span>
                                    ),
                                },
                            ],
                        }}
                        actionControl={{
                            except: ['edit', 'detail', 'delete'],
                            include: (row) => (
                                row.status === 'pending' ? (
                                    <div className="flex items-center gap-2">
                                        <ButtonComponent
                                            label="Setuju"
                                            size="xs"
                                            paint="success"
                                            variant="solid"
                                            rounded
                                            onClick={() => handleMemberRequest(row.id, 'approve')}
                                        />
                                        <ButtonComponent
                                            label="Tolak"
                                            size="xs"
                                            paint="danger"
                                            variant="outline"
                                            rounded
                                            onClick={() => handleMemberRequest(row.id, 'reject')}
                                        />
                                    </div>
                                ) : null
                            ),
                        }}
                    />
                </div>
            </FloatingPageComponent>

            {/* Modal Riwayat Member */}
            <FloatingPageComponent
                show={modalMemberHistory}
                onClose={() => setModalMemberHistory(false)}
                title={`Riwayat Member: ${activeCommunity?.name || '-'}`}
                size="lg"
            >
                <div className="p-6">
                    {memberHistoryError ? (
                        <div className="py-10 text-center text-red-600 font-semibold">{memberHistoryError}</div>
                    ) : (
                        <TableSupervisionComponent
                            key={`member-history-${activeCommunity?.id}`}
                            title="Riwayat Member"
                            searchable
                            noControlBar={false}
                            unUrlPage
                            fetchControl={{
                                url: apiJoin(`corporate/communities/${activeCommunity?.id}/member-history`),
                                headers: () => authHeaders('GET')
                            }}
                            customTopBar={<div />}
                            columnControl={{
                                custom: [
                                    {
                                        selector: 'user_name',
                                        label: 'Nama',
                                        sortable: true,
                                        item: (history) => (
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full flex items-center justify-center">
                                                    <span className="text-xs font-medium text-white">
                                                        {(history.user?.name || history.user_name || '?').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {history.user?.name || history.user_name || '-'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{history.user?.email || '-'}</div>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        selector: 'status',
                                        label: 'Status',
                                        item: (history) => (
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${history.status === 'joined'
                                                ? 'bg-green-100 text-green-800'
                                                : history.status === 'left'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {history.status === 'joined' ? 'Masuk' :
                                                    history.status === 'left' ? 'Keluar' : 'Dihapus'}
                                            </span>
                                        ),
                                    },
                                    {
                                        selector: 'created_at',
                                        label: 'Waktu',
                                        sortable: true,
                                        item: (history) => (
                                            <span className="text-sm text-gray-600">
                                                {history.created_at
                                                    ? new Date(history.created_at).toLocaleDateString('id-ID', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                    : '-'}
                                            </span>
                                        ),
                                    },
                                ],
                            }}
                            actionControl={{
                                except: ['edit', 'delete', 'detail'],
                            }}
                        />
                    )}
                </div>
            </FloatingPageComponent>

            {/* Modal Tambah Anggota Baru */}
            <FloatingPageComponent
                show={modalAddMember}
                onClose={() => setModalAddMember(false)}
                title="Tambah Anggota Baru"
                size="md"
            >
                <div className="p-6">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const email = formData.get('user_id');

                            try {
                                const res = await fetch(apiJoin(`corporate/communities/${activeCommunity?.id}/members`), {
                                    method: 'POST',
                                    headers: authHeaders('POST'),
                                    body: JSON.stringify({ user_id: email }),
                                });

                                if (!res.ok) {
                                    throw new Error('Gagal menambah anggota');
                                }

                                setModalAddMember(false);
                                // Refresh member table if needed
                            } catch (err) {
                                alert('Gagal menambah anggota baru');
                            }
                        }}
                    >
                        <label className="block mb-2 text-sm font-medium">Email Terdaftar</label>
                        <input
                            name="user_id"
                            type="text"
                            placeholder="Masukkan Email User"
                            className="border rounded w-full p-2 mb-4"
                            required
                        />
                        <ButtonComponent label="Simpan" paint="primary" type="submit" />
                    </form>
                </div>
            </FloatingPageComponent>
        </>
    );
}

KomunitasCorporate.getLayout = function getLayout(page) {
    return <CorporateLayout>{page}</CorporateLayout>;
};
