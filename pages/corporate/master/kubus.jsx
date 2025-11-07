import { useEffect } from 'react';
import { CorporateLayout } from '../../../components/construct.components/layout/Corporate.layout';
import CorporateKubusPage from '../../../components/construct.components/partial-page/CorporateKubus.page';
import { useUserContext } from '../../../context/user.context';
// import { useAccessContext } from '../../../context';
import Cookies from 'js-cookie';
import { token_cookie_name } from '../../../helpers';

export default function KubusCorporate() {
  // const { accessActive, loading } = useAccessContext();
  const { profile: Profile } = useUserContext();

  useEffect(() => {
    if (Cookies.get(token_cookie_name) && Profile) {
      if (!Profile?.corporate_user?.corporate_id) {
        Cookies.remove(token_cookie_name);
        window.location.href = '/corporate';
      }
    }
  }, [Profile]);

  return (
    <>
      <CorporateKubusPage
        scope={{ corporate_id: Profile?.corporate_user?.corporate_id }}
      />
    </>
  );
}

KubusCorporate.getLayout = function getLayout(page) {
  return <CorporateLayout>{page}</CorporateLayout>;
};
