import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { cn } from "@/lib/utils";

const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "span"],
  attributes: {
    ...defaultSchema.attributes,
    span: [["className", "spoiler"]],
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

/** @username -> link profil; ||teks|| -> spoiler. */
function preprocess(md: string): string {
  return md
    .replace(
      /(^|[^\w`/])@([a-z0-9][a-z0-9-]{1,23})/gi,
      (_m, pre, name) => `${pre}[@${name}](/u/${name.toLowerCase()})`,
    )
    .replace(/\|\|([^\n|]+)\|\|/g, (_m, t) => `<span class="spoiler">${t}</span>`);
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
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
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
        {preprocess(children)}
      </ReactMarkdown>
    </div>
  );
}
