import React, { useEffect, useState } from 'react';
import { DateFormatComponent, TableComponent } from '../../base.components';
import { useGet } from '../../../helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';

const GrabListComponent = ({ data, filter }) => {
  const [paginate, setPaginate] = useState(10);
  const [page, setPage] = useState(1);
  const [totalRow, setTotalRow] = useState(0);
  const [sort, setSort] = useState({
    column: 'created_at',
    direction: 'desc',
  });
  const [search, setSearch] = useState('');
  // const [filter, setFilter] = useState([]);

  const [grabList, setGrabList] = useState([]);
  const [grabCount, setGrabCount] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingTable, code, dataTable, reset] = useGet(
    filter
      ? {
          path: `admin/grabs`,
          params: {
            page,
            paginate,
            sortBy: sort.column,
            sortDirection: sort.direction,
            search: search,
            filter: filter,
          },
        }
      : {}
  );

  useEffect(() => {
    let preapreGrabList = dataTable?.data?.map((item) => {
      return {
        code: item?.code,
        validation_at: item?.validation_at ? (
          <DateFormatComponent date={item?.validation_at} />
        ) : (
          <i className="font-normal text-red-700">Belum Validasi</i>
        ),
        user_id: item?.user?.name,
      };
    });
    let counts = dataTable?.data?.reduce(function (acc, item) {
      return acc + (item.validate_at ? 1 : 0);
    }, 0);
    setGrabCount(counts);
    setGrabList(preapreGrabList);
    setTotalRow(dataTable?.total_row);
  }, [dataTable]);

  return (
    <>
      <div className="full px-6 pt-10 grid grid-cols-12 gap-4">
        <div className="col-span-2 grid gap-2 text-md font-medium">
          <div>Kubus</div>
          <div>Iklan</div>
          <div>Lokasi</div>
          <div>Status</div>
          <div>Pemilik</div>
          <div>
            {data?.ads?.at(0)?.is_daily_grab ? 'Promo Harian' : 'Promo'}
          </div>
          <div className="translate-y-[20px]">List Grab</div>
        </div>
        <div className="col-span-7 grid gap-2 ">
          <div id="kubus">
            <b>{data?.code}</b>
            <p className="text-slate-500 text-sm inline ml-2">
              ({data?.cube_type?.name})
            </p>
          </div>
          <div id="iklan">
            <b>{data?.ads?.at(0)?.title || '-'}</b>
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
              <b className="font-semibold">
                {data?.corporate?.name ? data?.corporate?.name : '-'}
              </b>
            ) : (
              <>
                <b className="font-semibold">
                  {data?.user?.name ? data?.user?.name : '-'}
                </b>
                <p className="text-slate-500 text-sm inline ml-2">
                  ({data?.user?.email ? data?.user?.email : null})
                </p>
              </>
            )}
          </div>
          <div id="Promo">
            {data?.ads?.at(0)?.max_grab - (data?.ads?.at(0)?.total_grab || 0)}/
            {data?.ads?.at(0)?.max_grab}
          </div>
          <div className="text-transparent">-</div>
        </div>
        <div className="col-span-3">
          <div
            className={`w-fit h-fit p-3 float-right rounded-md shadow-md text-center mr-4  ${
              loadingTable ? 'skeloton__loading' : ''
            }`}
          >
            <div className="text-medium">Teralidasi</div>
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
            // onChangeFilter={(e) => setFilter(e)}
            filter={filter}
            loading={loadingTable}
            onChangeSearch={(e) => setSearch(e)}
            search={search}
            onRefresh={reset}
            columns={[
              { selector: 'user_id', label: 'Pengguna', width: '150px' },
              { selector: 'validation_at', label: 'Validasi', width: '150px' },
              { selector: 'code', label: 'Kode Grab', width: '150px' },
            ]}
            // searchable={true}
          />
        )}
      </div>
    </>
  );
};

export default GrabListComponent;
