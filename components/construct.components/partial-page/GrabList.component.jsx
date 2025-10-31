// GrabList.component.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { DateFormatComponent, TableComponent } from '../../base.components';
import { useGet } from '../../../helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';

const GrabListComponent = ({ data, filter, mode = 'promo', voucherCode: voucherCodeProp }) => {
  const isVoucher = mode === 'voucher';

  const [paginate, setPaginate] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [sort, setSort] = useState({ column: 'created_at', direction: 'desc' });
  const [search, setSearch] = useState('');

  const [grabList, setGrabList] = useState([]);
  const [grabCount, setGrabCount] = useState(0);

  const currentAd = data?.ads?.at?.(0);
  const adId = currentAd?.id;
  const adType = currentAd?.type;
  const adValidationType = currentAd?.validation_type || 'auto';

  const [loadingPromoMeta, codePromoMeta, dataPromoMeta] = useGet(
    !isVoucher && adType === 'general' && currentAd?.code
      ? {
        path: 'admin/promos',
        params: {
          code: currentAd.code,
          paginate: 1,
        },
      }
      : {}
  );

  const [loadingVoucherMeta, codeVoucherMeta, dataVoucherMeta] = useGet(
    isVoucher && adType === 'voucher' && adId
      ? {
        path: 'admin/vouchers',
        params: {
          'filter[ad_id]': adId,
          paginate: 1,
        },
      }
      : {}
  );

  const promoData = useMemo(() => {
    const arr = Array.isArray(dataPromoMeta?.data) ? dataPromoMeta.data :
      Array.isArray(dataPromoMeta?.data?.data) ? dataPromoMeta.data.data : [];
    const item = arr[0];
    return {
      id: item?.id || null,
      code: item?.code || null,
      validation_type: item?.validation_type || null,
    };
  }, [dataPromoMeta]);

  const voucherData = useMemo(() => {
    const arr = Array.isArray(dataVoucherMeta?.data) ? dataVoucherMeta.data :
      Array.isArray(dataVoucherMeta?.data?.data) ? dataVoucherMeta.data.data : [];
    const item = arr[0];
    return {
      id: item?.id || null,
      code: item?.code || null,
      validation_type: item?.validation_type || null,
    };
  }, [dataVoucherMeta]);

  const finalId = isVoucher ? voucherData.id : promoData.id;
  const finalCode = isVoucher ? voucherData.code : promoData.code;
  const finalValidationType = isVoucher ? voucherData.validation_type : promoData.validation_type;

  const shouldShowData = useMemo(() => {
    if (!finalId) return false;

    return adValidationType === finalValidationType;
  }, [adValidationType, finalValidationType, finalId]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[GrabList DEBUG]', {
      mode: isVoucher ? 'voucher' : 'promo',
      adId,
      adType,
      adValidationType,
      finalId,
      finalCode,
      finalValidationType,
      shouldShowData,
      match: adValidationType === finalValidationType ? '✅ MATCH' : '❌ MISMATCH',
    });
  }, [isVoucher, adId, adType, adValidationType, finalId, finalCode, finalValidationType, shouldShowData]);

  const [loadingPromoValidations, codePromoValidations, dataPromoValidations, resetPromoValidations] = useGet(
    !isVoucher && finalId && shouldShowData
      ? {
        path: 'admin/promo-validations',
        params: {
          promo_id: finalId,
          page,
          paginate: 999,
          sortBy: 'validated_at',
          sortDirection: 'desc',
          search,
        },
      }
      : {}
  );

  const [loadingVoucherValidations, codeVoucherValidations, dataVoucherValidations, resetVoucherValidations] = useGet(
    isVoucher && finalId && shouldShowData
      ? {
        path: 'admin/voucher-validations',
        params: {
          voucher_id: finalId,
          page,
          paginate: 999,
          sortBy: 'validated_at',
          sortDirection: 'desc',
          search,
        },
      }
      : {}
  );

  const [loadingPromoItems, codePromoItems, dataPromoItems, resetPromoItems] = useGet(
    !isVoucher && finalId && shouldShowData
      ? {
        path: 'admin/promo-items',
        params: {
          promo_id: finalId,
          paginate: 999,
          sortBy: 'created_at',
          sortDirection: 'desc',
        },
      }
      : {}
  );

  const [loadingVoucherItems, codeVoucherItems, dataVoucherItems, resetVoucherItems] = useGet(
    isVoucher && finalId && shouldShowData
      ? {
        path: 'admin/voucher-items',
        params: {
          voucher_id: finalId,
          paginate: 999,
          sortBy: 'created_at',
          sortDirection: 'desc',
        },
      }
      : {}
  );

  const [userIdsParam, setUserIdsParam] = useState('');
  const [loadingUsers, codeUsers, dataUsers, resetUsers] = useGet(
    userIdsParam
      ? {
        path: 'admin/users',
        params: { ids: userIdsParam },
      }
      : {}
  );

  const normalizedFilter = useMemo(() => {
    const base = filter || {};
    if (isVoucher) {
      return {
        ...base,
        voucher_id: finalId,
        voucher_code: finalCode || '',
      };
    } else {
      return {
        ...base,
        promo_id: finalId,
        promo_code: finalCode || '',
      };
    }
  }, [filter, isVoucher, finalId, finalCode]);

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const userMap = useMemo(() => {
    const arr = toArray(dataUsers);
    const map = new Map();
    arr.forEach(u => {
      const id = u?.id ?? u?.user_id;
      const name =
        u?.name ||
        u?.full_name ||
        u?.username ||
        u?.email ||
        (id ? `User#${id}` : '-');
      if (id) map.set(Number(id), name);
    });
    return map;
  }, [dataUsers]);

  const rows = useMemo(() => {
    if (!shouldShowData) {
      return {
        data: [],
        total_row: 0,
        loading: false,
        reset: () => { },
        source: 'filtered-out-by-validation-type',
        user_ids: [],
      };
    }

    const parseItemId = (notes) => {
      if (typeof notes !== 'string') return null;
      const patterns = [
        /(?:^|[|,\s])item_id\s*[:=]\s*(\d+)/i,
        /(?:^|[|,\s])voucher_item_id\s*[:=]\s*(\d+)/i,
        /(?:^|[|,\s])promo_item_id\s*[:=]\s*(\d+)/i,
      ];
      for (const re of patterns) {
        const m = notes.match(re);
        if (m) return Number(m[1]);
      }
      return null;
    };

    // === VALIDATIONS ===
    const validationsRaw = isVoucher
      ? toArray(dataVoucherValidations)
      : toArray(dataPromoValidations);

    // Index validation berdasarkan item_id
    const valByItemId = new Map();
    const valByOwnerId = new Map();

    (validationsRaw || []).forEach(v => {
      const itemId = parseItemId(v?.notes || v?.note || '');
      const ownerId = v?.owner?.id ?? v?.owner_id ?? null;
      const validatedAt = v?.validated_at || v?.validation_at || null;

      if (itemId) {
        const existing = valByItemId.get(itemId);
        if (!existing || new Date(validatedAt || 0) > new Date(existing.validated_at || 0)) {
          valByItemId.set(itemId, {
            ...v,
            validated_at: validatedAt,
            validator_user: v?.user || v?.validator || null,
          });
        }
      }

      if (ownerId) {
        const existing = valByOwnerId.get(Number(ownerId));
        if (!existing || new Date(validatedAt || 0) > new Date(existing.validated_at || 0)) {
          valByOwnerId.set(Number(ownerId), {
            ...v,
            validated_at: validatedAt,
            validator_user: v?.user || v?.validator || null,
          });
        }
      }
    });

    // === CLAIMED ITEMS ===
    const claimedRaw = isVoucher
      ? toArray(dataVoucherItems)
      : toArray(dataPromoItems);

    const claimed = (claimedRaw || []).filter(c => {
      if (isVoucher) {
        return Number(c?.voucher_id) === Number(finalId);
      } else {
        return Number(c?.promo_id) === Number(finalId);
      }
    });

    const userIds = Array.from(
      new Set((claimed || []).map(c => c?.user_id).filter(Boolean))
    );

    if (isVoucher && claimed.length === 0 && validationsRaw.length > 0) {
      const perValidationRows = validationsRaw.map(v => {
        const validatedAt = v?.validated_at || v?.validation_at || null;
        const displayName =
          v?.owner?.name ||
          v?.user?.name ||
          v?.validator?.name ||
          '-';

        return {
          __raw_validation: v,
          ad_id: adId,
          voucher_id: finalId,
          voucher_code: finalCode || '',
          claimer_id: v?.owner?.id ?? v?.user?.id ?? null,
          user_id: displayName,
          validation_at: validatedAt ? (
            <div className="flex flex-col">
              <DateFormatComponent date={validatedAt} />
              {v?.validator?.name && (
                <span className="text-xs text-slate-500">
                  divalidasi oleh <b>{v?.validator?.name}</b>
                </span>
              )}
            </div>
          ) : (
            <i className="font-normal text-red-700">Belum Validasi</i>
          ),
          code: finalCode || '-',
        };
      });

      const validatedCount = perValidationRows.reduce((acc, r) =>
        acc + (r?.validation_at && typeof r.validation_at !== 'string' ? 1 : 0), 0);

      return {
        data: perValidationRows,
        total_row: perValidationRows.length,
        loading: loadingVoucherValidations || false,
        reset: () => { resetVoucherValidations?.(); },
        source: 'voucher-validations-direct',
        user_ids: perValidationRows.map(r => r.claimer_id).filter(Boolean),
      };
    }

    const perClaimRows = claimed.map(c => {
      const itemId = c?.id || c?.item_id || null;

      let matchedValidation = itemId ? valByItemId.get(Number(itemId)) : null;

      if (!matchedValidation) {
        const ownerId = c?.user_id ?? c?.user?.id ?? null;
        if (ownerId) {
          matchedValidation = valByOwnerId.get(Number(ownerId)) || null;
        }
      }

      const displayName =
        c?.user?.name || c?.user_name || c?.owner?.name || c?.owner_name || '-';

      return {
        __item_id: itemId,
        __raw_claim: c,
        __raw_validation: matchedValidation,
        code: (c?.code || '-'),
        validated_at: matchedValidation?.validated_at || null,
        validator_user: matchedValidation?.validator_user || null,
        owner_name: displayName,
        claimer_id: c?.user_id ?? c?.user?.id ?? null,
        claimer_name: c?.user_name ?? c?.user?.name ?? null,
      };
    });

    const loading = isVoucher
      ? (loadingVoucherValidations || loadingVoucherItems)
      : (loadingPromoValidations || loadingPromoItems);

    const reset = () => {
      if (isVoucher) {
        resetVoucherValidations?.();
        resetVoucherItems?.();
      } else {
        resetPromoValidations?.();
        resetPromoItems?.();
      }
    };

    // eslint-disable-next-line no-console
    console.log('[GrabList ROWS]', {
      mode: isVoucher ? 'voucher' : 'promo',
      finalId,
      validationsCount: validationsRaw?.length || 0,
      claimedCount: claimed?.length || 0,
      finalRowsCount: perClaimRows?.length || 0,
      shouldShowData,
    });

    return {
      data: perClaimRows,
      total_row: perClaimRows.length,
      loading: loading || false,
      reset,
      source: isVoucher ? 'voucher-rows-by-id' : 'promo-rows-by-id',
      user_ids: userIds,
    };
  }, [
    shouldShowData,
    isVoucher,
    dataVoucherValidations, loadingVoucherValidations, resetVoucherValidations,
    dataPromoValidations, loadingPromoValidations, resetPromoValidations,
    dataVoucherItems, loadingVoucherItems, resetVoucherItems,
    dataPromoItems, loadingPromoItems, resetPromoItems,
    finalId, finalCode, adId,
  ]);

  // === Trigger fetch users (batch) ===
  useEffect(() => {
    if (Array.isArray(rows?.user_ids) && rows.user_ids.length > 0) {
      setUserIdsParam(rows.user_ids.join(','));
    } else {
      setUserIdsParam('');
    }
  }, [rows?.user_ids]);

  // ===================== MAPPING UI =====================
  useEffect(() => {
    const prepared = (rows.data || []).map((item) => {
      const nameFromMap = item?.claimer_id ? userMap.get(Number(item.claimer_id)) : null;

      const displayName =
        nameFromMap ||
        item?.claimer_name ||
        item?.__raw_claim?.user_name ||
        item?.__raw_claim?.user?.name ||
        (item?.claimer_id ? `User#${item.claimer_id}` : null) ||
        item?.__raw_validation?.user?.name ||
        item?.__raw_validation?.user_name ||
        item?.owner_name ||
        item?.__raw_claim?.owner?.name ||
        '-';

      const validatorName =
        item?.validator_user?.name ||
        item?.__raw_validation?.user?.name ||
        item?.__raw_validation?.validator?.name ||
        null;

      return {
        ad_id: adId,
        promo_id: !isVoucher ? finalId : null,
        voucher_id: isVoucher ? finalId : null,
        promo_code: !isVoucher ? finalCode : '',
        voucher_code: isVoucher ? finalCode : '',
        claimer_id: item?.claimer_id ?? null,

        user_id: displayName,
        validation_at: item?.validated_at ? (
          <div className="flex flex-col">
            <DateFormatComponent date={item.validated_at} />
            {validatorName && (
              <span className="text-xs text-slate-500">
                divalidasi oleh <b>{validatorName}</b>
              </span>
            )}
          </div>
        ) : (
          <i className="font-normal text-red-700">Belum Validasi</i>
        ),
        code: (item?.code || '-'),
      };
    });

    const validatedCount = (rows.data || []).reduce(
      (acc, item) => acc + (item?.validated_at ? 1 : 0),
      0
    );

    setGrabList(prepared);
    setGrabCount(validatedCount);
    setTotalRow(rows.total_row || 0);
  }, [rows.data, rows.total_row, userMap, adId, finalId, finalCode, isVoucher]);

  // Label dinamis header/kolom
  const headerLabel = isVoucher
    ? 'Voucher'
    : (currentAd?.is_daily_grab ? 'Promo Harian' : 'Promo');

  const listLabel = isVoucher ? 'List Voucher' : 'List Grab';
  const codeLabel = isVoucher ? 'Kode Voucher' : 'Kode Grab';

  const showValidationWarning = useMemo(() => {
    if (!currentAd || !finalId) return false;
    return adValidationType !== finalValidationType;
  }, [currentAd, finalId, adValidationType, finalValidationType]);

  // helper for remaining/total display (promo vs voucher)
  const claimed = Number(grabList?.length ?? 0);
  const baseMax = Number(currentAd?.max_grab ?? 0);

  let remainingDisplay, totalDisplay;
  if (isVoucher) {
    // Voucher: BE kirim SISA → tampilkan sisa apa adanya
    // total = sisa + klaim (total derived)
    remainingDisplay = Math.max(baseMax, 0);
    totalDisplay = (baseMax > 0 || claimed > 0) ? (baseMax + claimed) : null;
  } else {
    // Promo: BE kirim TOTAL → proyeksikan sisa = total - klaim
    const projectedRemaining = Math.max(baseMax - claimed, 0);
    remainingDisplay = projectedRemaining;
    // If baseMax > 0 assume BE provided TOTAL; otherwise fallback to projected sum
    totalDisplay = (baseMax > 0) ? baseMax : (projectedRemaining + claimed);
  }

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
            <b>{currentAd?.title || '-'}</b>
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

          <div id="Promo">
            {totalDisplay === null ? (
              <><FontAwesomeIcon icon={faInfinity} />/∞</>
            ) : (
              `${remainingDisplay}/${totalDisplay}`
            )}
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
            filter={normalizedFilter}
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
