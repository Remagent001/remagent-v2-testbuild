"use client";

import { useSession } from "next-auth/react";

export const useSessionHelper = () => {
  const { data: session, status, update } = useSession();

  async function updateSession(params) {
    const newSession = await update(params);
    return newSession;
  }

  return {
    session,
    updateSession,
  };
};
