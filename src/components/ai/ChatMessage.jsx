import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

function ChatMessage({ message, onApplyCode }) {
  const content =
    message.parts?.map((part) => part.text || '').join('\n') || '';

  if (message.role === 'error') {
    return (
      <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">
        {content}
      </div>
    );
  }

  if (message.role === 'user') {
    return (
      <div className="whitespace-pre-wrap wrap-break-word text-sm leading-7">
        {content}
      </div>
    );
  }

  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className="text-sm leading-7 wrap-break-word
      [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-4
      [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:my-3
      [&_h3]:font-semibold [&_h3]:my-3
      [&_p]:my-2
      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3
      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3
      [&_li]:my-1
      [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-base-content/70
      [&_a]:text-primary [&_a]:underline
      [&_table]:w-full [&_table]:text-sm
      [&_th]:bg-base-300 [&_th]:p-2
      [&_td]:border-t [&_td]:border-base-300 [&_td]:p-2
    "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            const child = React.Children.toArray(children).find(
              React.isValidElement,
            );

            if (!child) return <pre>{children}</pre>;

            const code = String(child.props.children ?? '').replace(/\n$/, '');

            const className = child.props.className || '';
            const language =
              className.match(/language-([\w+#.-]+)/)?.[1] || 'text';

            return (
              <CodeBlock
                code={code}
                language={language}
                onApply={onApplyCode}
              />
            );
          },

          code({ className, children, ...props }) {
            const isInline = !className;

            if (isInline) {
              return (
                <code
                  className="rounded-md bg-base-300 px-1.5 py-0.5 text-primary font-mono text-[0.9em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default ChatMessage;
