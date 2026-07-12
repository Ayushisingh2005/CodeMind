'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Mascot from '@/components/Mascot';

interface Source {
  file_path: string;
  function_name: string;
  line_start: number;
  line_end: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

const EXAMPLE_QUESTIONS = [
  'What does this codebase do?',
  'How is error handling structured?',
  'What LLM does this project use?',
];

function ChatContent() {
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage(overrideText?: string) {
    const question = (overrideText ?? input).trim();
    if (!question) return;
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_full_name: repo, question }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer, sources: data.sources }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Hmm, something went sideways — mind trying that again?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col max-w-3xl mx-auto px-4 relative overflow-hidden">
      {/* faint drifting background chips, same language as the landing page */}
      <div className="pointer-events-none fixed inset-0 -z-10 hidden md:block" aria-hidden="true">
        {[
          { top: '10%', left: '2%', color: 'var(--mint)' },
          { top: '70%', right: '4%', color: 'var(--yellow)' },
        ].map((c, i) => (
          <div
            key={i}
            className="animate-drift absolute rounded-2xl opacity-20"
            style={{ top: c.top, left: c.left, right: c.right, width: 40, height: 28, background: c.color }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 py-5 border-b-2" style={{ borderColor: 'var(--border)' }}>
        <Mascot size={48} />
        <div>
          <h1 className="font-display font-bold text-lg leading-tight">CodeMind</h1>
          <span
            className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5"
            style={{ background: 'var(--surface-alt)', color: 'var(--primary)' }}
          >
            {repo}
          </span>
        </div>
        <a
          href="/"
          className="ml-auto text-sm font-bold px-3 py-1.5 rounded-full transition hover:bg-[var(--surface-alt)]"
          style={{ color: 'var(--primary)' }}
        >
          ← New repo
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-6">
        {messages.length === 0 && (
          <div className="text-center py-10 flex flex-col items-center gap-5">
            <Mascot size={90} />
            <div>
              <p className="font-display font-bold text-lg mb-1">Ready when you are!</p>
              <p style={{ color: 'var(--ink-muted)' }}>
                Ask anything about <strong>{repo}</strong>
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-sm font-semibold px-4 py-2 rounded-full transition hover:-translate-y-0.5"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--ink)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`animate-pop flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="shrink-0 mb-1">
                <Mascot size={30} />
              </div>
            )}
            <div
              className={`p-4 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'text-white rounded-br-md' : 'rounded-bl-md'}`}
              style={{
                background: m.role === 'user' ? 'var(--primary)' : 'var(--surface-alt)',
                border: m.role === 'assistant' ? '2px solid var(--border)' : 'none',
                boxShadow: m.role === 'user' ? '0 8px 20px -8px rgba(123,97,255,0.5)' : 'none',
              }}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                  {m.sources.map((s, j) => (
                    <span
                      key={j}
                      className="text-xs font-bold px-2.5 py-1 rounded-full transition hover:-translate-y-0.5"
                      style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--primary)' }}
                    >
                      📎 {s.file_path.split('/').pop()}:{s.line_start}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2">
            <Mascot size={30} />
            <div
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md"
              style={{ background: 'var(--surface-alt)', border: '2px solid var(--border)' }}
            >
              <span className="dot-1 w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
              <span className="dot-2 w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
              <span className="dot-3 w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 py-4 sticky bottom-0" style={{ background: 'var(--bg)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="How does authentication work in this repo?"
          className="flex-1 rounded-full px-5 py-3 outline-none border-2 font-semibold transition focus:shadow-[0_0_0_4px_rgba(123,97,255,0.15)]"
          style={{ borderColor: 'var(--border)' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading}
          className="rounded-full px-6 font-display font-bold text-white disabled:opacity-50 transition hover:-translate-y-0.5"
          style={{ background: 'var(--primary)', boxShadow: '0 8px 20px -8px rgba(123,97,255,0.5)' }}
        >
          Ask
        </button>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading…</div>}>
      <ChatContent />
    </Suspense>
  );
}
