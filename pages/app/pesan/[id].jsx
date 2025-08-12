/* eslint-disable @next/next/no-img-element */
import {
  faArrowLeftLong,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  DateFormatComponent,
  IconButtonComponent,
  InputComponent,
} from '../../../components/base.components';
import { post, useGet } from '../../../helpers';

export default function Pesan() {
  const router = useRouter();
  const { id, communityId, adminName, type } = router.query;
  const [message, setMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Check if this is a community admin chat
  const isCommunityAdminChat = type === 'admin' && id?.toString().startsWith('community-admin-');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, code, dataChat, reset] = useGet({
    path: id && !isCommunityAdminChat && `chat-rooms/${id}`,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingUser, codeUser, dataUser] = useGet({
    path: `account`,
  });

  // Demo data for community admin chat
  const [adminChatData] = useState({
    data: {
      id: id,
      admin_name: adminName,
      community_id: communityId,
      chats: [
        {
          id: 1,
          message: 'Halo! Selamat datang di komunitas kami. Ada yang bisa saya bantu?',
          is_my_reply: false,
          created_at: new Date().toISOString(),
          user_sender: { name: adminName }
        }
      ]
    }
  });

  // Use admin chat data if it's a community admin chat
  const currentChatData = isCommunityAdminChat ? adminChatData : dataChat;

  // Handle back navigation
  const handleBackNavigation = () => {
    if (isCommunityAdminChat && communityId) {
      // If it's a community admin chat, go back to admin chat list
      router.push(`/app/komunitas/admin-chat/${communityId}`);
    } else {
      // For regular chats, use default back behavior
      router.back();
    }
  };

  useEffect(() => {
    setTimeout(() => {
      document.getElementById('chat-box').scrollTo({
        top: currentChatData?.data?.chats.length * 100,
        behavior: 'smooth',
      });
    }, 100);
  }, [currentChatData]);

  return (
    <>
      <div className="lg:mx-auto relative lg:max-w-md">
        <div className="bg-primary h-10"></div>
        <div className="bg-background h-screen overflow-y-auto scroll_control w-full rounded-t-[25px] -mt-6 relative z-20 bg-gradient-to-br from-cyan-50">
          <div className="flex justify-between items-center gap-2 p-2 sticky top-0 z-30 bg-white bg-opacity-40 backdrop-blur-sm border-b ">
            <div className="px-2">
              <IconButtonComponent
                icon={faArrowLeftLong}
                variant="simple"
                size="lg"
                onClick={handleBackNavigation}
              />
            </div>

            <div className="font-semibold w-full text-lg">
              {isCommunityAdminChat 
                ? `Admin ${adminName}`
                : currentChatData?.data?.world
                ? currentChatData?.data?.world?.name
                : currentChatData?.data?.user_merchant_id == dataUser?.data?.id
                ? currentChatData?.data?.user_hunter?.name
                : currentChatData?.data?.user_merchant?.name}
            </div>
          </div>

          <div
            className="overflow-y-auto overflow-x-hidden scroll h-[90vh] pb-10"
            id="chat-box"
          >
            {currentChatData?.data?.chats.map((item, key) => {
              if (item.is_my_reply) {
                return (
                  <div
                    className="p-5 flex flex-col justify-end h-max"
                    key={key}
                  >
                    <div className="bg-green-200 w-max max-w-[240px] p-3 rounded-xl rounded-tr-none self-end">
                      {item?.message}
                      {item?.cube && (
                        <>
                          Kubus:
                          <Link href={`/app/${item?.cube?.code}`} key={key}>
                            <div className="grid grid-cols-4 gap-3 py-2 px-3 shadow-sm rounded-[10px] relative bg-white bg-opacity-40 backdrop-blur-sm mt-1">
                              <div className="col-span-3">
                                <p className="font-semibold">
                                  {item?.cube?.code}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 self-end mt-2">
                      <DateFormatComponent
                        date={item?.created_at}
                        format="DD/MM/YYYY HH:mm"
                      />
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    className="p-5 flex flex-col justify-end h-max"
                    key={key}
                  >
                    <div className="bg-gray-200 w-max max-w-[240px] p-3 rounded-xl rounded-tl-none">
                      {currentChatData?.data?.world && (
                        <p className="font-semibold mb-1">
                          {item?.user_sender?.name}
                        </p>
                      )}
                      {item?.message}
                      {item?.cube && (
                        <>
                          Kubus:
                          <Link href={`/app/${item?.cube?.code}`} key={key}>
                            <div className="grid grid-cols-4 gap-3 py-2 px-3 shadow-sm rounded-[10px] relative bg-white bg-opacity-40 backdrop-blur-sm mt-1">
                              <div className="col-span-3">
                                <p className="font-semibold">
                                  {item?.cube?.code}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      <DateFormatComponent
                        date={item?.created_at}
                        format="DD/MM/YYYY HH:mm"
                      />
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>

      <div
        className={`fixed bottom-0 left-0 w-screen pt-3 pb-2 px-6 bg-slate-100 rounded-t-[25px] z-20`}
      >
        <div className="lg:max-w-md mx-auto flex gap-4 items-center">
          <div className="w-full">
            <InputComponent
              placeholder="Tulis pesan disini..."
              onChange={(e) => setMessage(e)}
              value={message}
            />
          </div>
          <div>
            <IconButtonComponent
              icon={faPaperPlane}
              size="lg"
              className=" rounded-lg"
              loading={chatLoading}
              onClick={async () => {
                if (isCommunityAdminChat) {
                  // For community admin chat, show a demo response
                  setChatLoading(true);
                  // Simulate sending message and getting response
                  setTimeout(() => {
                    alert('Pesan terkirim! (Demo: Admin akan merespons dalam aplikasi nyata)');
                    setMessage('');
                    setChatLoading(false);
                  }, 1000);
                  return;
                }

                setChatLoading(true);
                const execute = await post({
                  path: `chats`,
                  body: {
                    chat_room_id: currentChatData?.data?.id,
                    message: message,
                  },
                });

                if (execute.status == 201) {
                  setChatLoading(false);
                  setMessage('');
                  reset();
                } else {
                  setChatLoading(false);
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
