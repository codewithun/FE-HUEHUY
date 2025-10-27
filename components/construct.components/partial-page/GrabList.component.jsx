// GrabList.component.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { DateFormatComponent, TableComponent } from '../../base.components';
import { useGet } from '../../../helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';

const GrabListComponent = ({ data, filter, mode = 'promo', voucherCode: voucherCodeProp }) => {
  const isVoucher = mode === 'voucher';

  const normCode = (v) => (typeof v === 'string' ? v.trim().toUpperCase() : '');

  const [paginate, setPaginate] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [sort, setSort] = useState({ column: 'created_at', direction: 'desc' });
  const [search, setSearch] = useState('');

  const [grabList, setGrabList] = useState([]);
  const [grabCount, setGrabCount] = useState(0);

  // Kode promo dari ads aktif (untuk mode promo)
  const promoCode = useMemo(
    () => data?.ads?.at?.(0)?.code || data?.ads?.at?.(0)?.slug || null,
    [data?.ads]
  );

  // ===================== FETCH DATA =====================
  // Fallback lama (hanya untuk mode promo)
  const [loadingTable, codeTable, dataTable, resetTable] = useGet(
    !isVoucher && filter
      ? {
        path: 'admin/grabs',
        params: {
          page,
          paginate,
          sortBy: sort.column,
          sortDirection: sort.direction,
          search,
          filter,
        },
      }
      : {}
  );

  // Sumber utama (mode promo)
  const [loadingPromo, codePromo, dataPromo, resetPromo] = useGet(
    !isVoucher && promoCode
      ? {
        path: 'admin/promo-validations',
        params: {
          page,
          paginate,
          sortBy: 'validated_at',
          sortDirection: 'desc',
          search,
          promo_code: promoCode,
        },
      }
      : {}
  );

  // Sumber utama (mode voucher)
  const [loadingVoucher, codeVoucher, dataVoucher, resetVoucher] = useGet(
    isVoucher && (voucherCodeProp || data?.voucher?.code)
      ? {
        path: 'admin/voucher-validations',
        params: {
          page,
          paginate,
          sortBy: sort.column ?? 'validated_at',
          sortDirection: sort.direction ?? 'desc',
          search,
          voucher_code: voucherCodeProp || data?.voucher?.code,
        },
      }
      : {}
  );

  // === Tambahan: ambil list item yang sudah DIREBUT (claimed) ===
  const adId = data?.ads?.at?.(0)?.id;
  const voucherCode = voucherCodeProp || data?.voucher?.code;

  // Claimed list (PROMO) per iklan/ad
  const [loadingClaimedPromo, codeClaimedPromo, dataClaimedPromo, resetClaimedPromo] = useGet(
    !isVoucher && adId
      ? {
        path: 'admin/promo-items',
        params: {
          promo_id: adId,
          paginate: 999,
          sortBy: 'created_at',
          sortDirection: 'desc',
        },
      }
      : {}
  );

  // Claimed list (VOUCHER) per voucher_code
  const [loadingClaimedVoucher, codeClaimedVoucher, dataClaimedVoucher, resetClaimedVoucher] = useGet(
    isVoucher && voucherCode
      ? {
        path: 'vouchers/voucher-items',
        params: {
          voucher_code: voucherCode,
          paginate: 999,
          sortBy: 'created_at',
          sortDirection: 'desc',
        },
      }
      : {}
  );

  // Pilih dataset (prioritas: sumber utama; promo bisa fallback ke grabs)
  // ===================== PILIH & GABUNG DATA =====================
  // Prinsip: ambil SEMUA yang sudah direbut (claimed) → tampil di list,
  // lalu “tempelkan” info validasi jika ada.

  const rows = useMemo(() => {
    // Normalisasi kode untuk konsistensi
    const normCode = (v) => (typeof v === 'string' ? v.trim().toUpperCase() : '');

    // Ambil sumber validations (yang sudah divalidasi)
    const validations = isVoucher ? (dataVoucher?.data || []) : (dataPromo?.data || []);

    // Ambil sumber claimed (yang sudah direbut)
    const claimed = isVoucher
      ? (dataClaimedVoucher?.data || dataClaimedVoucher || [])
      : (dataClaimedPromo?.data || dataClaimedPromo || []);

    // Kelompokkan data berdasarkan kode
    const groupedByCode = new Map();

    // Proses claimed items
    (claimed || []).forEach(c => {
      const key = normCode(isVoucher ? (c?.item_code || c?.code) : c?.code);
      if (!key) return;

      if (!groupedByCode.has(key)) {
        groupedByCode.set(key, {
          code: key,
          users: new Set(),
          validated_at: null,
          validator_user: null,
          claims: [],
          validations: [],
        });
      }

      const group = groupedByCode.get(key);
      const ownerName =
        c?.owner?.name ||
        c?.owner_name ||
        c?.user?.name ||
        '-';
      group.users.add(ownerName);
      group.claims.push(c);
    });

    // Proses validations
    (validations || []).forEach(v => {
      const key = normCode(isVoucher ? (v?.item_code || v?.code) : v?.code);
      if (!key) return;

      if (!groupedByCode.has(key)) {
        groupedByCode.set(key, {
          code: key,
          users: new Set(),
          validated_at: null,
          validator_user: null,
          claims: [],
          validations: [],
        });
      }

      const group = groupedByCode.get(key);
      const ownerName =
        v?.owner?.name ||
        v?.owner_name ||
        v?.user_name ||
        v?.user?.name ||
        '-';
      group.users.add(ownerName);
      group.validations.push(v);

      // Update validated_at dan validator_user dengan data terbaru
      const validatedAt =
        v?.validated_at ||
        v?.validation_at ||
        v?.latest_validation?.validated_at ||
        v?.last_validation?.validated_at ||
        null;
      if (validatedAt && (!group.validated_at || new Date(validatedAt) > new Date(group.validated_at))) {
        group.validated_at = validatedAt;
        group.validator_user = v?.user || v?.validator || null;
      }
    });

    // Konversi ke array untuk TableComponent
    const unified = Array.from(groupedByCode.values()).map(group => ({
      __raw_claims: group.claims,
      __raw_validations: group.validations,
      code: group.code || '-',
      validated_at: group.validated_at,
      validator_user: group.validator_user,
      owner_name: Array.from(group.users).join(', ') || '-', // Gabungkan nama pengguna
    }));

    const loading =
      (isVoucher
        ? loadingVoucher || loadingClaimedVoucher
        : loadingPromo || loadingClaimedPromo) || false;

    const reset = () => {
      if (isVoucher) {
        resetVoucher?.();
        resetClaimedVoucher?.();
      } else {
        resetPromo?.();
        resetClaimedPromo?.();
      }
    };

    return {
      data: unified,
      total_row: unified.length,
      loading,
      reset,
      source: isVoucher ? 'voucher-merged' : 'promo-merged',
    };
  }, [
    isVoucher,
    dataPromo, loadingPromo, resetPromo,
    dataVoucher, loadingVoucher, resetVoucher,
    dataClaimedPromo, loadingClaimedPromo, resetClaimedPromo,
    dataClaimedVoucher, loadingClaimedVoucher, resetClaimedVoucher,
  ]);

  // ===================== MAPPING UI =====================

  useEffect(() => {
    const prepared = (rows.data || []).map((item) => {
      // Ambil tanggal validasi dari unified row (hasil merge),
      // fallback ke bentuk raw (kalau ada)
      const validatedAt =
        item?.validated_at ||
        item?.validation_at ||
        item?.__raw_valid?.validated_at ||
        item?.__raw_valid?.validation_at ||
        item?.__raw_valid?.latest_validation?.validated_at ||
        item?.__raw_valid?.last_validation?.validated_at ||
        null;

      // Nama penampilkan: owner_name dari unified → fallback ke pola lama
      const displayName =
        item?.owner_name ||
        item?.owner?.name ||
        item?.owner_name ||
        item?.user_name ||
        item?.user?.name ||
        '-';

      // Kode unik:
      // - voucher: utamakan item_code (kode item), fallback master code
      // - promo: code saja
      const codeVal = isVoucher
        ? (item?.code || item?.item_code || item?.__raw_claim?.item_code || item?.__raw_claim?.code || '-')
        : (item?.code || item?.__raw_claim?.code || '-');

      return {
        user_id: displayName,
        validation_at: validatedAt ? (
          <div className="flex flex-col">
            <DateFormatComponent date={validatedAt} />
            {(item?.validator_user?.name || item?.user?.name) && (
              <span className="text-xs text-slate-500">
                divalidasi oleh <b>{item?.validator_user?.name || item?.user?.name}</b>
              </span>
            )}
          </div>
        ) : (
          <i className="font-normal text-red-700">Belum Validasi</i>
        ),
        code: codeVal,
      };
    });

    const validatedCount = (rows.data || []).reduce((acc, item) => {
      const has =
        item?.validated_at ||
        item?.validation_at ||
        item?.__raw_valid?.validated_at ||
        item?.__raw_valid?.validation_at ||
        item?.__raw_valid?.latest_validation?.validated_at ||
        item?.__raw_valid?.last_validation?.validated_at;
      return acc + (has ? 1 : 0);
    }, 0);

    setGrabList(prepared);
    setGrabCount(validatedCount);
    setTotalRow(rows.total_row || 0);
  }, [rows.data, rows.total_row, isVoucher]);

  // Label dinamis header/kolom
  const headerLabel = isVoucher
    ? 'Voucher'
    : (data?.ads?.at?.(0)?.is_daily_grab ? 'Promo Harian' : 'Promo');

  const listLabel = isVoucher ? 'List Voucher' : 'List Grab';
  const codeLabel = isVoucher ? 'Kode Voucher' : 'Kode Grab';

  return (
    <>
      <div className="full px-6 pt-10 grid grid-cols-12 gap-4">
        <div className="col-span-2 grid gap-2 text-md font-medium">
          <div>Kubus</div>
          <div>Iklan</div>
          <div>Lokasi</div>
          <div>Status</div>
          <div>Pemilik</div>
          <div>{headerLabel}</div>
          <div className="translate-y-[20px]">{listLabel}</div>
        </div>

        <div className="col-span-7 grid gap-2 ">
          <div id="kubus">
            <b>{data?.code}</b>
            <p className="text-slate-500 text-sm inline ml-2">
              ({data?.cube_type?.name})
            </p>
          </div>

          <div id="iklan">
            <b>{data?.ads?.at?.(0)?.title || '-'}</b>
          </div>

          <div className="cursor-pointer" id="lokasi" title={data?.address}>
            <span className="limit__line__1">{data?.address || '-'}</span>
          </div>

          <div id="status">
            {data?.status === 'active' ? (
              <span className="uppercase font-medium text-green-600 py-1 px-2.5 rounded-md text-sm bg-green-100">
                Aktif
              </span>
            ) : (
              <span className="uppercase font-medium text-red-600 py-1 px-2.5 rounded-md text-sm bg-red-100">
                Tidak Aktif
              </span>
            )}
            <p className="mt-2 inline ml-2">
              Sampai:{' '}
              {data?.inactive_at ? (
                <DateFormatComponent date={data?.inactive_at} />
              ) : (
                <FontAwesomeIcon icon={faInfinity} />
              )}
            </p>
          </div>

          <div id="pemilik">
            {data?.cube_type_id == 2 ? (
              <b className="font-semibold">{data?.corporate?.name || '-'}</b>
            ) : (
              <>
                <b className="font-semibold">{data?.user?.name || '-'}</b>
                <p className="text-slate-500 text-sm inline ml-2">
                  ({data?.user?.email || null})
                </p>
              </>
            )}
          </div>

          {/* Hanya relevan untuk promo; aman dibiarkan untuk voucher (tidak dipakai) */}
          <div id="Promo">
            {(data?.ads?.at?.(0)?.max_grab || 0) -
              (data?.ads?.at?.(0)?.total_grab || 0)}
            /{data?.ads?.at?.(0)?.max_grab || 0}
          </div>

          <div className="text-transparent">-</div>
        </div>

        <div className="col-span-3">
          <div
            className={`w-fit h-fit p-3 float-right rounded-md shadow-md text-center mr-4 ${rows.loading ? 'skeloton__loading' : ''
              }`}
          >
            <div className="text-medium">Tervalidasi</div>
            <div className="text-lg font-semibold truncate">
              {grabCount}/{grabList?.length}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4 pb-20">
        {data?.id && (
          <TableComponent
            topBar={<></>}
            data={grabList}
            onChangeSortBy={(column, direction) => setSort({ column, direction })}
            pagination={{
              page,
              paginate,
              totalRow,
              onChange: (newTotalRow, newPaginate, newPage) => {
                setPaginate(newPaginate);
                setPage(newPage);
              },
            }}
            filter={filter}
            loading={rows.loading}
            onChangeSearch={(e) => setSearch(e)}
            search={search}
            onRefresh={rows.reset}
            columns={[
              { selector: 'user_id', label: 'Pengguna', width: '200px' },
              { selector: 'validation_at', label: 'Validasi', width: '220px' },
              { selector: 'code', label: codeLabel, width: '160px' },
            ]}
          />
        )}
      </div>
    </>
  );
};

export default GrabListComponent;
