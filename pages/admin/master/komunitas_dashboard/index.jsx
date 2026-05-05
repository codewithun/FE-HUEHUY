/* eslint-disable no-console */
import {
  faPlus,
  faUsers,
  faUserPlus,
  faHistory,
  faCheck,
  faTimes,
  faCubes,
} from "@fortawesome/free-solid-svg-icons";

import Cookies from "js-cookie";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";

import {
  ButtonComponent,
  FloatingPageComponent,
  TableSupervisionComponent,
  SelectComponent,
  InputComponent,
} from "../../../../components/base.components";

import { AdminLayout } from "../../../../components/construct.components/layout/Admin.layout";
import InputHexColor from "../../../../components/construct.components/input/InputHexColor";

import { token_cookie_name } from "../../../../helpers";
import { admin_token_cookie_name } from "../../../../helpers/api.helpers";
import { Decrypt } from "../../../../helpers/encryption.helpers";

/* =============================
   CONFIG
============================= */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = (path = "") =>
  `${API_BASE.replace(/\/+$/, "")}/api/${path.replace(/^\/+/, "")}`;

/* =============================
   COMPONENT
============================= */
export default function KomunitasDashboard() {
  const [refresh, setRefresh] = useState(false);

  const [activeCommunity, setActiveCommunity] = useState(null);

  const [modalMember, setModalMember] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);

  const abortRef = useRef(null);

  /* =============================
     AUTH HEADER
  ============================= */
  const getToken = () => {
    const enc =
      Cookies.get(admin_token_cookie_name) ||
      localStorage.getItem(admin_token_cookie_name) ||
      Cookies.get(token_cookie_name);

    return enc ? Decrypt(enc) : "";
  };

  const headersJSON = () => ({
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const headersMultipart = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  /* =============================
     FETCH MEMBERS
  ============================= */
  const openMemberModal = async (row) => {
    setActiveCommunity(row);
    setModalMember(true);
    setMemberLoading(true);
    setMemberList([]);

    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(
        api(`admin/communities/${row.id}/members`),
        {
          headers: headersJSON(),
          signal: controller.signal,
        }
      );

      const json = await res.json();

      const data =
        json?.data?.data ||
        json?.data ||
        json?.members ||
        [];

      setMemberList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Member error:", e);
    } finally {
      setMemberLoading(false);
    }
  };

  /* =============================
     CREATE / UPDATE
  ============================= */
  const submitCommunity = async ({ payload, isUpdate, row }) => {
    let body;
    let headers;

    if (payload.logo instanceof File) {
      const form = new FormData();

      if (isUpdate) form.append("_method", "PUT");

      Object.keys(payload).forEach((k) => {
        if (k === "logo") {
          form.append("logo", payload.logo);
        } else {
          form.append(k, payload[k] ?? "");
        }
      });

      body = form;
      headers = headersMultipart();
    } else {
      body = JSON.stringify(payload);
      headers = headersJSON();
    }

    const url = isUpdate
      ? api(`admin/communities/${row.id}`)
      : api("admin/communities");

    const method = payload.logo instanceof File ? "POST" : isUpdate ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!res.ok) throw new Error("Submit gagal");

    setRefresh((s) => !s);
    return true;
  };

  /* =============================
     TABLE COLUMN
  ============================= */
  const columns = useMemo(() => [
    {
      selector: "name",
      label: "Nama",
      item: (r) => <b>{r.name}</b>,
    },
    {
      selector: "description",
      label: "Deskripsi",
      item: (r) => r.description || "-",
    },
    {
      selector: "logo",
      label: "Logo",
      item: (r) =>
        r.logo ? (
          <Image src={`${API_BASE}/storage/${r.logo}`} width={40} height={40} alt="" />
        ) : "-",
    },
  ], []);

  /* =============================
     RENDER
  ============================= */
  return (
    <>
      <TableSupervisionComponent
        title="Komunitas"
        columnControl={{ custom: columns }}
        setToRefresh={refresh}
        fetchControl={{
          path: "admin/communities",
          headers: headersJSON,
        }}
        customTopBarWithForm={({ setModalForm }) => (
          <ButtonComponent
            label="Tambah"
            icon={faPlus}
            onClick={() => setModalForm(true)}
          />
        )}
        actionControl={{
          include: (row) => (
            <ButtonComponent
              label="Anggota"
              icon={faUsers}
              size="xs"
              onClick={() => openMemberModal(row)}
            />
          ),
        }}
        formControl={{
          submit: submitCommunity,
          custom: [
            {
              construction: {
                name: "name",
                label: "Nama",
                validations: { required: true },
              },
            },
            {
              type: "textarea",
              construction: {
                name: "description",
                label: "Deskripsi",
              },
            },
            {
              type: "image",
              construction: {
                name: "logo",
                label: "Logo",
              },
            },
          ],
        }}
      />

      {/* MEMBER MODAL */}
      <FloatingPageComponent
        show={modalMember}
        onClose={() => setModalMember(false)}
        title="Anggota"
      >
        <div className="p-4">
          {memberLoading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {memberList.map((m) => (
                <li key={m.id}>{m.name || m.email}</li>
              ))}
            </ul>
          )}
        </div>
      </FloatingPageComponent>
    </>
  );
}

KomunitasDashboard.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);