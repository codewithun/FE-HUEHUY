/* eslint-disable @next/next/no-img-element */
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { useGet } from '../../../helpers';

export default function Ad() {
  const router = useRouter();
  const { id } = router.query;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: id && `huehuy-ads/${id}`,
  });

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full bg-background z-30 bg-opacity-95">
        <div className="p-3 flex justify-between">
          <p
            className="font-medium text-primary underline flex gap-2 items-center"
            onClick={() => router.back()}
          >
            <FontAwesomeIcon icon={faChevronLeft} />

            <p>Kembali</p>
          </p>
          <p>Iklan Huehuy</p>
        </div>
        <div className="w-full min-h-[400px] overflow-hidden ">
          {data?.data?.picture_source && (
            <img
              src={data?.data?.picture_source}
              height={700}
              width={700}
              alt=""
            />
          )}

          <div className="mt-5">
            <h4 className="font-semibold text-xl px-4">{data?.data?.title}</h4>
            <p
              className={`text-justify mt-4 overflow-hidden whitespace-pre-wrap text-ellipsis px-4`}
            >
              {data?.data?.description}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
