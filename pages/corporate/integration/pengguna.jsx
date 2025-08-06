import React from 'react';
import CManageUser from '../master/pengguna';
import { useRouter } from 'next/router';

export default function IntegrationDunia() {
  const router = useRouter();
  const { token, corporate_id } = router.query;

  return (
    <>
      <div className="bg-slate-50 h-screen">
        {token && (
          <CManageUser scope={{ corporate_id: corporate_id }} token={token} />
        )}
      </div>
    </>
  );
}
