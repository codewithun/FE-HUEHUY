// GrabList.component.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { DateFormatComponent, TableComponent } from '../../base.components';
import { useGet } from '../../../helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';

/**
 * List serbaguna: Promo & Voucher
 * - mode="promo": sumber utama admin/promo-validations?promo_code=...
 *   (fallback lama admin/grabs tetap dipakai bila dataValid kosong)
 * - mode="voucher": sumber admin/voucher-validations?voucher_code=...
 *   (tidak pakai fallback grabs)
 */
const GrabListComponent = ({ data, filter, mode = 'promo', voucherCode: voucherCodeProp }) => {
  const isVoucher = mode === 'voucher';

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

  // Pilih dataset (prioritas: sumber utama; promo bisa fallback ke grabs)
  const rows = useMemo(() => {
    if (isVoucher) {
      return {
        data: dataVoucher?.data || [],
        total_row: dataVoucher?.total_row || 0,
        loading: loadingVoucher,
        reset: resetVoucher,
        source: 'voucher-validations',
      };
    }

    const hasPromoValid =
      dataPromo?.data && Array.isArray(dataPromo.data) && dataPromo.data.length > 0;

    if (hasPromoValid) {
      return {
        data: dataPromo.data,
        total_row: dataPromo.total_row || 0,
        loading: loadingPromo,
        reset: resetPromo,
        source: 'promo-validations',
      };
    }

    return {
      data: dataTable?.data || [],
      total_row: dataTable?.total_row || 0,
      loading: loadingTable,
      reset: resetTable,
      source: 'grabs',
    };
  }, [isVoucher, dataVoucher, loadingVoucher, resetVoucher, dataPromo, loadingPromo, resetPromo, dataTable, loadingTable, resetTable]);

  // ===================== MAPPING UI =====================

  useEffect(() => {
    const prepared = (rows.data || []).map((item) => {
      // Tanggal validasi dari berbagai bentuk respons
      const validatedAt =
        item?.validated_at ||
        item?.validation_at ||
        item?.latest_validation?.validated_at ||
        item?.last_validation?.validated_at ||
        null;

      // Nama pemilik (OWNER) dulu; fallback ke validator (TENANT)
      const displayName =
        item?.owner?.name ||
        item?.owner_name ||
        item?.user_name ||
        item?.user?.name ||
        '-';

      // Kode kolom:
      // - promo: item.code = kode promo (OK)
      // - voucher: utamakan item.item_code jika tersedia (kode unik), fallback ke item.code (master)
      const codeVal = isVoucher
        ? (item?.item_code || item?.code || '-')
        : (item?.code || '-');

      return {
        user_id: displayName,
        validation_at: validatedAt ? (
          <div className="flex flex-col">
            <DateFormatComponent date={validatedAt} />
            {item?.user?.name && (
              <span className="text-xs text-slate-500">
                divalidasi oleh <b>{item.user.name}</b>
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
        item?.latest_validation?.validated_at ||
        item?.last_validation?.validated_at;
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
            className={`w-fit h-fit p-3 float-right rounded-md shadow-md text-center mr-4 ${
              rows.loading ? 'skeloton__loading' : ''
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
