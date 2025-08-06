import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { get } from '../../helpers';
import { IconButtonComponent } from '../../components/base.components';
import { useRouter } from 'next/router';

export default function Index({ data }) {
  const router = useRouter();
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
            <div className="font-semibold w-full text-lg">Kontak Admin</div>
          </div>

          <div className="p-4">
            <p className="text-medium">
              Hubungi kontak kami dibawah ini jika ada kamu butuh bantuan / mau
              aktifasi kubus
            </p>

            <div className="flex flex-col gap-4 mt-4">
              {data?.map((item, key) => {
                return (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${item?.phone}`}
                    className="bg-white py-4 px-6 rounded-xl shadow-md"
                    key={key}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div>
                          <h4 className="font-semibold">{item?.name}</h4>
                          <p className="text-sm text-slate-400">
                            {item?.phone}
                          </p>
                        </div>
                      </div>
                      <div className="px-2">
                        <FontAwesomeIcon
                          icon={faWhatsapp}
                          className="text-3xl text-slate-400"
                        />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  const response = await get({ path: 'admin-contact' });

  return {
    props: {
      data: response?.data?.data || null,
    },
    revalidate: 30,
  };
}
