"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface Stats {
  sources: number;
  directories: number;
  last_updated: string | null;
}

const safeDecode = (str: string) => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ sources: 0, directories: 0, last_updated: null });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950 text-white relative overflow-hidden">

      {/* Search Container */}
      <div className="z-10 w-full max-w-2xl flex flex-col items-center gap-8">
        <h1 className="text-5xl font-bold tracking-tighter neon-text mb-4 text-center">
          FTP Finder
        </h1>

        {/* Stats Display */}
        <div className="flex gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>
            <span>Sources: <span className="text-cyan-300 font-mono">{stats.sources}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]"></span>
            <span>Directories: <span className="text-purple-300 font-mono">{stats.directories}</span></span>
          </div>
          {stats.last_updated && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"></span>
              <span>Update: <span className="text-green-300 font-mono">{timeAgo(stats.last_updated)}</span></span>
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="w-full relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-6 h-6 text-cyan-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full py-4 pl-14 pr-6 text-xl rounded-full neon-input neon-box"
          />
          <div className="absolute inset-y-0 right-4 flex items-center">
            {loading && <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>}
          </div>
        </form>

        <div className="w-full space-y-4">
          {results.map((item: any) => (
            <div key={item.id} className="p-4 rounded-xl neon-box hover:bg-slate-900/80 transition-colors">
              <a href={item.original_link} target="_blank" rel="noopener noreferrer" className="block group">
                <h3 className="text-lg font-semibold text-cyan-300 group-hover:text-cyan-200 truncate">
                  📁 {safeDecode(item.name)}
                </h3>
                <div className="mt-2 text-xs text-slate-500">{safeDecode(item.original_link)}</div>
              </a>
            </div>
          ))}
          {results.length === 0 && !loading && query && (
            <p className="text-slate-500 text-center mt-4">No results found.</p>
          )}
        </div>
      </div>


    </main>
  );
}
