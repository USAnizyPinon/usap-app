"use client";

import { useSession } from "next-auth/react";
import NotifPrompt from "./NotifPrompt";

/** N'affiche la proposition qu'aux personnes connectées. */
export default function NotifGate() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return <NotifPrompt />;
}
