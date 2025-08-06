import React, { useEffect, useState } from 'react';
import {
  DateFormatComponent,
  FloatingPageComponent,
  TableComponent,
} from '../../base.components';
import { useGet } from '../../../helpers';

const VoucherModal = ({ data, show, setShow, token }) => {
  const [paginate, setPaginate] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [sort, setSort] = useState({
    column: 'created_at',
    direction: 'desc',
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState([]);

  const [voucherData, setVoucherData] = useState(null);

  useEffect(() => {
    if (data?.id && show) {
      setFilter([
        {
          column: 'ad_id',
          type: 'equal',
          value: data?.ads.at(0)?.id,
        },
      ]);
    }
  }, [data, show]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingTable, code, dataTable, reset] = useGet(
    data?.id && show
      ? {
          path: `admin/vouchers`,
          params: {
            page,
            paginate,
            sortBy: sort.column,
            sortDirection: sort.direction,
            search: search,
            filter: filter,
          },
          bearer: token || null,
        }
      : {}
  );

  useEffect(() => {
    let preapreVocher = dataTable?.data?.map((item) => {
      return {
        code: item?.code,
        used_at: item?.used_at ? (
          <DateFormatComponent date={item?.used_at} />
        ) : (
          <i className="font-normal text-red-700">Belum Dipakai</i>
        ),
        user_id: item?.user?.name,
      };
    });

    setVoucherData(preapreVocher);
    setTotalRow(dataTable?.total_row);
  }, [dataTable]);
  // console.log(data?.ads?.at(0)?.title);
  return (
    <div>
      <FloatingPageComponent
        show={show}
        title={data?.ads?.at(0)?.title}
        onClose={() => {
          setShow(false);
        }}
        // size="lg"
      >
        <div className="px-6 pt-4">
          <p
            className={`${
              loadingTable ? 'skeleton__loading' : ''
            } text-lg font-semibold text-secondary`}
          >
            {/* eslint-disable-next-line prettier/prettier */}
            {dataTable?.data?.at(0) &&
              `Voucher ${dataTable?.data?.at(0)?.voucher?.name} (${
                dataTable?.data?.at(0)?.code
              })`}
          </p>
        </div>
        <div className="px-6 pt-4 pb-20">
          {data?.id && (
            <TableComponent
              topBar={<></>}
              data={voucherData}
              onChangeSortBy={(column, direction) =>
                setSort({ column, direction })
              }
              pagination={{
                page,
                paginate,
                totalRow,
                onChange: (newTotalRow, newPaginate, newPage) => {
                  setPaginate(newPaginate);
                  setPage(newPage);
                },
              }}
              onChangeFilter={(e) => setFilter(e)}
              filter={filter}
              loading={loadingTable}
              onChangeSearch={(e) => setSearch(e)}
              search={search}
              onRefresh={reset}
              columns={[
                { selector: 'code', label: 'Kode Voucher', width: '150px' },
                { selector: 'used_at', label: 'Dipakai', width: '150px' },
                // { selector: 'user_id', label: 'Pengguna', width: '150px' },
              ]}
              // searchable={true}
            />
          )}
        </div>
      </FloatingPageComponent>
    </div>
  );
};

export default VoucherModal;
