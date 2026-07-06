'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function handleIndex() {
    if (!repo.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_full_name: repo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Indexing failed');
      setStatus(`✅ Indexed ${data.chunks_indexed} code chunks`);
      setTimeout(() => {
        router.push(`/chat?repo=${encodeURIComponent(repo.trim())}`);
      }, 800);
    } catch (err: any) {
      setStatus(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-12 text-center">
      <h1 className="text-4xl font-bold mb-3">🧠 CodeMind</h1>
      <p className="text-gray-400 mb-10">
        Chat with any GitHub codebase using AI-powered semantic search.
      </p>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <label className="block text-sm text-gray-400 mb-2 text-left">
          GitHub repository (format: username/repo)
        </label>
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="facebook/react"
          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleIndex}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg py-3 font-medium transition"
        >
          {loading ? 'Indexing repository...' : 'Index Repository'}
        </button>
        {status && <p className="mt-4 text-sm text-gray-300">{status}</p>}
      </div>

      <p className="text-xs text-gray-600 mt-6">
        Indexing clones the repo, parses Python files by function/class, and
        embeds them for semantic search. Larger repos take longer.
      </p>
    </main>
  );
}
