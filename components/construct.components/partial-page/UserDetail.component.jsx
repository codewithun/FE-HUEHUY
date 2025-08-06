/* eslint-disable @next/next/no-img-element */

import React from 'react';

const UserDetailComponent = ({ data, customRole }) => {
  return (
    <div className="px-10">
      <img
        class="h-44 aspect-square rounded-full border-4 border-slate-300 dark:border-gray-800 mx-auto my-4 object-cover"
        src={
          data?.picture_source
            ? `http://localhost:8000/storage/${data?.picture_source}`
            : '/default-avatar.png'
        }
        alt="Foto Profil"
      />
      <div className="w-full border-b grid grid-cols-12 p-4">
        <p className="col-start-2 font-semibold text-slate-500 col-span-3 ">
          Nama
        </p>
        <p className="col-span-5 text-slate-500">{data?.name}</p>
      </div>
      <div className="w-full border-b grid grid-cols-12 p-4">
        <p className="col-start-2 font-semibold text-slate-500 col-span-3 ">
          Role
        </p>
        <p className="col-span-5 text-slate-500">
          {customRole ? customRole : data?.role.name || '-'}
        </p>
      </div>
      <div className="w-full border-b grid grid-cols-12 p-4">
        <p className="col-start-2 font-semibold text-slate-500 col-span-3 ">
          Nomor Telepon
        </p>
        <p className="col-span-5 text-slate-500">{data?.phone || '-'}</p>
      </div>
      <div className="w-full  grid grid-cols-12 p-4">
        <p className="col-start-2 font-semibold text-slate-500 col-span-3 ">
          Email
        </p>
        <p className="col-span-5 text-slate-500">{data?.email}</p>
      </div>
    </div>
  );
};

export default UserDetailComponent;
