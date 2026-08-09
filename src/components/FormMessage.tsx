"use client";

export default function FormMessage({
  state,
}: {
  state: { ok: boolean; message: string } | null;
}) {
  if (!state?.message) return null;
  return (
    <p
      role="status"
      className={`mt-3 rounded-lg border px-3 py-2 text-xs font-semibold ${
        state.ok
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-400/30 bg-red-500/10 text-red-300"
      }`}
    >
      {state.message}
    </p>
  );
}
