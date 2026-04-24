import DemoPromptChips from './DemoPromptChips';

/**
 * Large investigation-style chat: transcript, suggested prompts, input + send.
 */
export default function DemoChatPanel({
  title,
  subtitle,
  messages,
  suggestedPrompts,
  inputValue,
  onInputChange,
  onSend,
  onSelectPrompt,
  placeholder,
  sendLabel,
  userLabel,
  assistantLabel,
}) {
  return (
    <section className="demo-chat-section card flex flex-col min-h-[420px] lg:min-h-[460px] glass border-white/10 overflow-hidden">
      <header className="shrink-0 px-5 py-4 border-b border-white/10 bg-black/20">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-sm text-vg-text-muted mt-1">{subtitle}</p>
      </header>

      <div className="demo-chat-messages flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'demo-chat-bubble-user text-white'
                  : 'demo-chat-bubble-assistant text-slate-200'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1.5">
                {msg.role === 'user' ? userLabel : assistantLabel}
              </p>
              <div className="whitespace-pre-wrap demo-chat-markdown">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>

      <footer className="shrink-0 border-t border-white/10 p-4 bg-black/25 space-y-3">
        <DemoPromptChips prompts={suggestedPrompts} onSelectPrompt={onSelectPrompt} disabled={false} />
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder}
            className="demo-chat-input flex-1 rounded-xl border border-white/15 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vg-accent/40"
          />
          <button type="submit" className="btn-primary px-8 py-3 rounded-xl font-semibold shrink-0">
            {sendLabel}
          </button>
        </form>
      </footer>
    </section>
  );
}
