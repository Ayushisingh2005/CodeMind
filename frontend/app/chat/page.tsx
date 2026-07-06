'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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

function ChatContent() {
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const question = input.trim();
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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 flex flex-col h-screen">
      <div className="border-b border-gray-800 pb-4 mb-4">
        <h1 className="text-xl font-bold">🧠 CodeMind — {repo}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg ${
              m.role === 'user' ? 'bg-blue-950 ml-12' : 'bg-gray-900 mr-12'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Sources:</p>
                {m.sources.map((s, j) => (
                  <p key={j} className="text-xs text-gray-400">
                    📄 {s.file_path}:{s.line_start}-{s.line_end} — {s.function_name}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-gray-500 text-sm">Thinking...</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="How does authentication work in this repo?"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg px-6 font-medium"
        >
          Ask
        </button>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
