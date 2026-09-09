import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { cn } from "@/lib/utils";

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "src",
      "alt",
      "title",
      "width",
      "height",
      "loading",
    ],
    a: [...(defaultSchema.attributes?.a ?? []), "href", "title", "rel"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
  },
};

/** Ubah @username jadi link ke profil sebelum render. */
function linkifyMentions(md: string): string {
  return md.replace(
    /(^|[^\w`/])@([a-z0-9][a-z0-9-]{1,23})/gi,
    (_m, pre, name) => `${pre}[@${name}](/u/${name.toLowerCase()})`,
  );
}

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none break-words prose-pre:bg-muted prose-pre:text-foreground prose-a:text-primary",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          a: ({ href, children, ...props }) => {
            const internal = href?.startsWith("/");
            return (
              <a
                href={href}
                rel={internal ? undefined : "nofollow noopener noreferrer"}
                target={internal ? undefined : "_blank"}
                {...props}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} loading="lazy" />
            ) : null,
        }}
      >
        {linkifyMentions(children)}
      </ReactMarkdown>
    </div>
  );
}
