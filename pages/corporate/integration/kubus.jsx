import React from 'react';
import ManageCubePage from '../../../components/construct.components/partial-page/ManageCube.page';
import { useRouter } from 'next/router';

export default function IntegrationKubus() {
  const router = useRouter();
  const { token, corporate_id } = router.query;

  return (
    <>
      <div className="bg-slate-50 h-screen">
        <ManageCubePage
          panel={'corporate'}
          scope={{ corporate_id: corporate_id }}
          token={token}
        />
      </div>
    </>
  );
}
