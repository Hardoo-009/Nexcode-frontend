import { useState } from 'react';
import { Copy, Check, Code2, ArrowDownToLine } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CodeBlock({ code, language = 'text', onApply }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Could not copy code:', error);
    }
  };

  const normalizedLanguage =
    {
      js: 'javascript',
      jsx: 'jsx',
      py: 'python',
      c: 'c',
      'c++': 'cpp',
      'c#': 'csharp',
      ts: 'typescript',
    }[language.toLowerCase()] || language.toLowerCase();

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-base-300 bg-[#171923]">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#202431] border-b border-white/5">
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <Code2 size={14} className="text-primary" />
          <span className="uppercase tracking-wider font-semibold">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onApply && (
            <button
              type="button"
              onClick={() => onApply(code)}
              className="btn btn-ghost btn-xs text-gray-300 hover:text-white"
              title="Apply code to editor"
            >
              <ArrowDownToLine size={14} />
              <span className="hidden sm:inline">Apply</span>
            </button>
          )}

          <button
            type="button"
            onClick={copyCode}
            className="btn btn-ghost btn-xs text-gray-300 hover:text-white"
            title="Copy code"
          >
            {copied ? (
              <Check size={14} className="text-success" />
            ) : (
              <Copy size={14} />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={normalizedLanguage}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '18px',
          background: '#171923',
          fontSize: '13px',
          lineHeight: '1.7',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
          },
        }}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
export default CodeBlock;
