"use client";

import * as React from "react";

type Preview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

export function LinkPreview({ url }: { url: string }) {
  const [data, setData] = React.useState<Preview | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setData(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url]);

  if (!data) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="mt-2 flex overflow-hidden rounded-xl border transition-colors hover:bg-accent/50"
    >
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.image}
          alt=""
          className="h-24 w-24 shrink-0 object-cover sm:h-28 sm:w-28"
        />
      )}
      <div className="min-w-0 p-3">
        <p className="text-xs text-muted-foreground">{data.siteName}</p>
        <p className="truncate text-sm font-medium">{data.title}</p>
        {data.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}
