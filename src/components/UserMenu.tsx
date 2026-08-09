"use client";

import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function UserMenu({
  name,
  image,
  role,
}: {
  name: string | null;
  image: string | null;
  role: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!name) {
    return (
      <button onClick={() => signIn("google")} className="btn-jaune !px-4 !py-2 text-xs">
        Se connecter
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/15 py-1 pl-1 pr-3 transition hover:border-jaune"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-jaune text-xs font-black text-noir">
            {name.charAt(0)}
          </span>
        )}
        <span className="hidden text-xs font-semibold sm:block">
          {name.split(" ")[0]}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-noir-2 p-2 shadow-card"
        >
          <p className="px-3 py-2 text-xs text-cream/55">
            Connecté en tant que
            <span className="mt-0.5 block font-semibold text-cream">{name}</span>
            {role && role !== "LICENCIE" && (
              <span className="mt-1 inline-block rounded bg-jaune/15 px-2 py-0.5 text-[10px] font-bold uppercase text-jaune">
                {role}
              </span>
            )}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-cream/80 hover:bg-white/5 hover:text-jaune"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
