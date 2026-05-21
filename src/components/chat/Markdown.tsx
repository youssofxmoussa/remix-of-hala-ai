import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "text";
  const code = String(children ?? "").replace(/\n$/, "");
  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-2xl border border-border bg-[oklch(0.98_0_0)]">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono lowercase tracking-wide">{lang}</span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 hover:bg-accent transition"
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="!m-0 !rounded-none !border-0 !bg-transparent">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
            const isBlock = /language-/.test(className || "");
            if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
