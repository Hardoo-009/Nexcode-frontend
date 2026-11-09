import { Sparkles } from 'lucide-react';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
        <Sparkles size={16} className="text-primary" />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="w-1.5 h-1.5 rounded-full bg-primary typing-dot"
            />
          ))}
        </div>

        <span className="text-xs text-base-content/50">Thinking...</span>
      </div>
    </div>
  );
}

export default TypingIndicator;
