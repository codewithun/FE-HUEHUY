import React, { useMemo, useState } from 'react';
import {
  FormSupervisionComponent,
  SelectComponent,
} from '../../base.components';
import { useGet } from '../../../helpers';

const FormCorpAdComponent = ({ data, token }) => {
  const [corpAds, setCorpAds] = useState([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCorpAds, codeCorpAds, dataCorpAds] = useGet({
    path: 'corporate/cubes',
  });

  useMemo(() => {
    if (!loadingCorpAds) {
      let corpAds = dataCorpAds?.data.map((i) => {
        return { label: i?.ads?.at(0)?.title, value: i?.ads?.at(0)?.id };
      });
      setCorpAds(corpAds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataCorpAds]);

  let worldID = data.world_id ? { world_id: data.world_id } : null;
  let corpotareID = data.corporate_id
    ? { corporate_id: data.corporate_id }
    : null;

  const newAd = {
    'ads[title]': data?.ads[0].title,
    'ads[description]': data?.ads[0].description,
    'ads[ad_category_id]': data?.ads[0].ad_category_id,
    'ads[promo_type]': data?.ads[0].promo_type,
    'ads[max_grab]': data?.ads[0].max_grab,
  };

  return (
    <div className="px-8">
      <FormSupervisionComponent
        forms={[
          {
            type: 'custom',
            custom: ({ formControl }) => (
              <SelectComponent
                name="cube_id"
                label="Iklan Mitra"
                placeholder="Pilih Iklan Mitra..."
                {...formControl('parent_id')}
                // serverOptionControl={{
                //   path: 'admin/options/ad-category',
                // }}
                options={corpAds}
              />
            ),
          },
        ]}
        submitControl={{
          path: `corporate/cubes/${data?.id}`,
          contentType: 'multipart/form-data',
          bearer: token || null,
        }}
        defaultValue={{
          cube_type_id: data?.cube_type_id,
          user_id: data?.user_id,
          color: data?.color,
          address: data?.address,
          map_lat: data?.map_lat,
          map_lng: data?.map_lng,
          status: data?.status,
          ...worldID,
          ...corpotareID,
          ...newAd,
        }}
      />
    </div>
  );
};

export default FormCorpAdComponent;
