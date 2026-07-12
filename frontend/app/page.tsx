'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Mascot from '@/components/Mascot';

const FEATURES = [
  {
    emoji: '💬',
    title: 'Ask your code anything',
    body: 'Type a question in plain English. Get an answer sourced straight from the actual functions, not a guess.',
  },
  {
    emoji: '🧩',
    title: 'Reads code the way you do',
    body: 'Every file gets parsed by function and class, not chopped into random chunks — so nothing gets lost mid-thought.',
  },
  {
    emoji: '📎',
    title: 'Shows its work',
    body: 'Every answer links back to the exact file and line it came from. No blind trust required.',
  },
  {
    emoji: '🐛',
    title: 'Catches bugs before you do',
    body: 'New issues get sniffed out and sorted into bug, feature request, or question — automatically.',
  },
];

const STEPS = [
  { n: '1', title: 'Drop a repo', body: 'Paste any public GitHub repo. CodeMind clones it and reads every function.' },
  { n: '2', title: 'Ask a question', body: '"How does auth work here?" — type it like you\'d ask a teammate.' },
  { n: '3', title: 'Get a sourced answer', body: 'CodeMind digs through the code and hands you an answer with receipts.' },
];

const FAQS = [
  { q: 'What repos can I use?', a: 'Any public GitHub repo. Bigger repos just take a little longer to read through.' },
  { q: 'Does it actually understand my code, or just guess?', a: 'It reads real functions and classes, then only answers using what it finds in them — no guessing, no hallucinated APIs.' },
  { q: 'What happens to issues I open?', a: 'A small classifier reads each new issue and labels it bug, feature request, or question automatically.' },
  { q: 'Is this free to run?', a: 'Yes — it runs entirely on free-tier APIs, end to end.' },
  { q: 'What languages does it support?', a: 'Python today. More languages are on the way.' },
  { q: 'Can I run my own copy?', a: 'Yep — it\'s open source. Clone it and point it at your own database and API keys.' },
];

export default function Home() {
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  async function handleIndex() {
    if (!repo.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
     const res = await fetch(`https://codemind-backend-tkok.onrender.com/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_full_name: repo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Indexing failed');
      setStatus(`Found ${data.chunks_indexed} chunks — taking you there now`);
      setTimeout(() => router.push(`/chat?repo=${encodeURIComponent(repo.trim())}`), 700);
    } catch (err: any) {
      setStatus(`Couldn't read that repo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Nav */}
  <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display font-bold text-xl" style={{ color: 'var(--primary)' }}>
          CodeMind
        </span>
        <a
          href="https://github.com"
          className="text-sm font-bold px-4 py-2 rounded-full border-2 transition hover:bg-[var(--surface-alt)]"
          style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
        >
          ⭐ Star on GitHub
        </a>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-8 pb-24">
        {/* Drifting background chips */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block" aria-hidden="true">
          {[
            { top: '8%', left: '4%', delay: '0s', color: 'var(--mint)' },
            { top: '18%', right: '6%', delay: '1.2s', color: 'var(--yellow)' },
            { top: '68%', left: '10%', delay: '2.4s', color: 'var(--primary)' },
            { top: '75%', right: '12%', delay: '0.6s', color: 'var(--pink)' },
          ].map((c, i) => (
            <div
              key={i}
              className="animate-drift absolute rounded-2xl opacity-70"
              style={{ ...c, width: 44, height: 30, background: c.color, animationDelay: c.delay }}
            />
          ))}
        </div>

        <div className="flex flex-col items-center text-center gap-6">
          <Mascot size={130} />
          <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-tight max-w-3xl">
            Chat with any codebase.
            <br />
            <span style={{ color: 'var(--primary)' }}>Get answers, not guesses.</span>
          </h1>
          <p className="text-lg max-w-xl" style={{ color: 'var(--ink-muted)' }}>
            Drop in a GitHub repo. Ask it questions like a teammate would. CodeMind reads
            the actual functions and points to exactly where every answer came from.
          </p>

          <div
            className="w-full max-w-lg rounded-3xl p-6 mt-4"
            style={{ background: 'var(--surface)', boxShadow: '0 20px 40px -20px rgba(123,97,255,0.35)', border: '2px solid var(--border)' }}
          >
            <label className="block text-sm font-bold mb-2 text-left" style={{ color: 'var(--ink-muted)' }}>
              GitHub repository
            </label>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleIndex()}
              placeholder="facebook/react"
              className="w-full rounded-xl px-4 py-3 mb-3 font-semibold outline-none border-2"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            />
            <button
              onClick={handleIndex}
              disabled={loading}
              className="w-full rounded-xl py-3 font-display font-bold text-white transition disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Reading the repo…' : 'Index repository →'}
            </button>
            {status && (
              <p className="animate-pop mt-3 text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>
                {status}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display font-extrabold text-3xl text-center mb-12">
          Built to actually read your code
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl p-6 transition hover:-translate-y-1"
              style={{ background: 'var(--surface-alt)', border: '2px solid var(--border)' }}
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p style={{ color: 'var(--ink-muted)' }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="font-display font-extrabold text-3xl text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div
            className="hidden md:block absolute top-6 left-0 right-0 h-[2px] -z-10"
            style={{ background: 'repeating-linear-gradient(90deg, var(--border) 0 8px, transparent 8px 16px)' }}
          />
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-white mx-auto mb-4"
                style={{ background: 'var(--primary)' }}
              >
                {s.n}
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{s.title}</h3>
              <p style={{ color: 'var(--ink-muted)' }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="font-display font-extrabold text-3xl text-center mb-10">
          Questions, answered
        </h2>
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <div
              key={item.q}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-bold"
                aria-expanded={openFaq === i}
              >
                {item.q}
                <span
                  className="transition-transform"
                  style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)', color: 'var(--primary)' }}
                >
                  +
                </span>
              </button>
              {openFaq === i && (
                <p className="animate-pop px-5 pb-4" style={{ color: 'var(--ink-muted)' }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-sm" style={{ color: 'var(--ink-muted)' }}>
        Built with 🧠 + 🐛 · Python, Next.js, pgvector, Cohere, Groq
      </footer>
    </main>
  );
}
