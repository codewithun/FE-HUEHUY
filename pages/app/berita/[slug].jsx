/* eslint-disable @next/next/no-img-element */
import React from 'react';
import BottomBarComponent from '../../../components/construct.components/BottomBarComponent';
import { useRouter } from 'next/router';
import { useGet } from '../../../helpers';
import { IconButtonComponent } from '../../../components/base.components';
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';

export default function Berita() {
  const router = useRouter();
  const { slug } = router.query;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: `article/` + slug,
  });

  return (
    <>
      <div className="lg:mx-auto lg:relative lg:max-w-md">
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
          <div className="flex justify-between items-center gap-2 p-2 sticky top-0 z-30 bg-white bg-opacity-40 backdrop-blur-sm border-b ">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={() => router.back()}
              />
            </div>
            <div className="font-semibold w-full text-lg">Berita Huehuy</div>
          </div>

          <div className="w-full overflow-hidden bg-slate-200">
            {data?.data?.picture_source && (
              <img
                src={data?.data?.picture_source}
                height={700}
                width={700}
                alt=""
              />
            )}
          </div>

          <div className="mt-4 px-4">
            <h1 className="text-lg font-semibold">{data?.data?.title}</h1>
            <p className="whitespace-pre-wrap mt-2">
              {data?.data?.description}
            </p>
          </div>
        </div>
        <BottomBarComponent active={'user'} />
      </div>
    </>
  );
}
