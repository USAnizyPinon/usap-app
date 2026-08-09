export default function PersonCard({
  name,
  role,
  photo,
  number,
}: {
  name: string;
  role?: string | null;
  photo?: string | null;
  number?: number | null;
}) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-noir-2">
      <div className="relative aspect-[3/4] bg-noir-3">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="grid h-full place-items-center text-cream/20">
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="currentColor" aria-hidden>
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5c0-3-4-5.5-9-5.5Z" />
            </svg>
          </div>
        )}
        {number != null && (
          <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-jaune font-display text-xs font-black text-noir">
            {number}
          </span>
        )}
      </div>
      <figcaption className="p-3">
        <p className="text-sm font-bold leading-tight">{name}</p>
        {role && (
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-jaune">{role}</p>
        )}
      </figcaption>
    </figure>
  );
}
