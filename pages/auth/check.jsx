/* eslint-disable react-hooks/exhaustive-deps */
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { token_cookie_name, useGet } from '../../helpers';
import Cookies from 'js-cookie';
import { Encrypt } from '../../helpers/encryption.helpers';

export default function AuthCheck() {
  const router = useRouter();
  const { token } = router.query;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, codeData, data] = useGet({
    path: token && `account`,
    bearer: token,
  });

  useEffect(() => {
    if (codeData == 200 && data?.data) {
      Cookies.withAttributes({
        sameSite: 'none',
        secure: true,
      }).set(
        token_cookie_name,
        Encrypt(token),
        { expires: 365 },
        { secure: true }
      );

      window.location.href = '/app';
    }
  }, [data, codeData]);

  return (
    <>
      <div className="text-center py-8">
        Authentikasi User, Tunggu Sebentar...
      </div>
    </>
  );
}
