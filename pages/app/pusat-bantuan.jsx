import {
  faArrowLeftLong,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { IconButtonComponent } from '../../components/base.components';
import { useGet } from '../../helpers';
import { useRouter } from 'next/router';

export default function PusatBantuan() {
  const router = useRouter();
  const [collapses, setCollapses] = useState([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, code, data] = useGet({
    path: `faq`,
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
            <div className="font-semibold w-full text-lg">Pusat Bantuan</div>
          </div>

          <div className="container mx-auto relative z-10">
            <h2 className="text-xl font-medium text-primary mb-4 mt-8 px-4">
              Yang Sering Ditanyakan
            </h2>

            <div className="flex flex-col relative z-10 mt-2">
              {data?.data?.map((item, key) => {
                let open = !!collapses.find((c) => c == item.id);
                return (
                  <div
                    className="bg-gray-100 bg-opacity-30 backdrop-blur-[2px] p-4 border-b-2 border-b-gray-300"
                    key={key}
                  >
                    <div
                      className="flex justify-between items-center"
                      onClick={() => {
                        setCollapses(
                          open
                            ? collapses.filter((c) => c != item.id)
                            : [
                                ...collapses.filter((c) => c != item.id),
                                item.id,
                              ]
                        );
                      }}
                    >
                      <p className="font-medium">{item.title}</p>
                      <p className="p-2">
                        <FontAwesomeIcon
                          icon={open ? faChevronUp : faChevronDown}
                        />
                      </p>
                    </div>
                    {open && <p className="mt-4">{item.description}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
