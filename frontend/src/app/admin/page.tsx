"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, Lock, ShieldCheck, Database } from "lucide-react";

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"setup" | "login" | "dashboard">("login");
    const [sources, setSources] = useState<any[]>([]);
    const [newSourceLabel, setNewSourceLabel] = useState("");
    const [newSourceUrl, setNewSourceUrl] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/status`);
            const data = await res.json();
            if (!data.configured) {
                setView("setup");
            }
            setLoading(false);
        } catch (error) {
            console.error("Auth status check failed", error);
            setLoading(false);
        }
    };

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/setup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            if (res.ok) {
                setMessage("Password set! Please login.");
                setView("login");
                setPassword("");
            } else {
                setMessage("Setup failed.");
            }
        } catch (err) {
            setMessage("Error connecting to server");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            if (res.ok) {
                setView("dashboard");
                fetchSources();
            } else {
                setMessage("Invalid password");
            }
        } catch (err) {
            setMessage("Login failed");
        }
    };

    const fetchSources = async () => {
        const res = await fetch(`${API_URL}/sources`);
        const data = await res.json(); // Assuming GET /sources is still public or we need header?
        // Note: If you want to protect GET /sources too, we need a token or session. 
        // For now, assuming only WRITE operations are critical to protect, or this is a simple tool.
        setSources(data);
    };

    const addSource = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`${API_URL}/sources`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: newSourceLabel, url: newSourceUrl }),
        });
        setNewSourceLabel("");
        setNewSourceUrl("");
        fetchSources();
    };

    const deleteSource = async (id: number) => {
        if (!confirm("Are you sure? This will delete all indexed directories for this source.")) return;
        await fetch(`${API_URL}/sources/${id}`, { method: "DELETE" });
        fetchSources();
    };

    const [indexState, setIndexState] = useState<any>(null);
    const [isIndexing, setIsIndexing] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isIndexing) {
            interval = setInterval(fetchIndexStatus, 1000);
        }
        return () => clearInterval(interval);
    }, [isIndexing]);

    const fetchIndexStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/index/status`);
            const data = await res.json();
            setIndexState(data);
            if (!data.is_running && isIndexing) {
                // Stopped
                setIsIndexing(false);
                setMessage("Indexing finished.");
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Trigger index
    const triggerIndex = async () => {
        setMessage("Starting background indexer...");
        setIsIndexing(true);
        await fetch(`${API_URL}/index`, { method: "POST" });
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">Loading...</div>;

    return (
        <main className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold neon-text mb-8 flex items-center gap-3">
                    <ShieldCheck className="w-10 h-10 text-cyan-400" />
                    Admin Dashboard
                </h1>

                {/* SETUP VIEW */}
                {view === "setup" && (
                    <div className="max-w-md mx-auto neon-box p-8 rounded-xl bg-slate-900/50">
                        <h2 className="text-2xl font-bold mb-4 text-cyan-300">First Run Setup</h2>
                        <p className="text-slate-400 mb-6">Please set an admin password to secure your database.</p>
                        <form onSubmit={handleSetup} className="space-y-4">
                            <input
                                type="password"
                                placeholder="New Password"
                                className="w-full p-3 rounded bg-slate-800 border border-slate-700 focus:border-cyan-400 outline-none text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded font-bold transition-colors">
                                Set Password
                            </button>
                        </form>
                        {message && <p className="mt-4 text-center text-red-400">{message}</p>}
                    </div>
                )}

                {/* LOGIN VIEW */}
                {view === "login" && (
                    <div className="max-w-md mx-auto neon-box p-8 rounded-xl bg-slate-900/50">
                        <h2 className="text-2xl font-bold mb-4 text-cyan-300">Admin Login</h2>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Enter Password"
                                className="w-full p-3 rounded bg-slate-800 border border-slate-700 focus:border-cyan-400 outline-none text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded font-bold transition-colors flex items-center justify-center gap-2">
                                <Lock className="w-4 h-4" /> Login
                            </button>
                        </form>
                        {message && <p className="mt-4 text-center text-red-400">{message}</p>}
                    </div>
                )}

                {/* DASHBOARD VIEW */}
                {view === "dashboard" && (
                    <div className="grid gap-8">

                        {/* Control Panel */}
                        <div className="neon-box p-6 rounded-xl bg-slate-900/50 flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-cyan-300">Indexer Control</h2>
                                    <p className="text-slate-400 text-sm">run this after adding new sources</p>
                                </div>
                                <button
                                    onClick={triggerIndex}
                                    disabled={isIndexing}
                                    className={`px-6 py-3 rounded font-bold flex items-center gap-2 transition-all ${isIndexing ? 'bg-slate-700 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.5)]'}`}
                                >
                                    <RefreshCw className={`w-5 h-5 ${isIndexing ? 'animate-spin' : ''}`} />
                                    {isIndexing ? 'Indexing...' : 'Trigger Indexing'}
                                </button>
                            </div>

                            {/* Live Progress View */}
                            {isIndexing && indexState && (
                                <div className="bg-black/50 p-4 rounded border border-slate-700 font-mono text-sm max-h-60 overflow-y-auto">
                                    <div className="grid grid-cols-2 gap-4 mb-2 text-cyan-400">
                                        <div>Found: {indexState.directories_found} dirs</div>
                                        <div>Source: {indexState.current_source || "Preparing..."}</div>
                                    </div>
                                    {indexState.current_path && <div className="text-slate-500 mb-2 truncate">Crawling: {indexState.current_path}</div>}

                                    <div className="border-t border-slate-800 pt-2 flex flex-col-reverse">
                                        {indexState.logs?.slice().reverse().map((log: string, i: number) => (
                                            <div key={i} className="text-slate-400">{log}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {message && !isIndexing && <div className="text-green-400 text-center font-bold bg-green-900/20 p-2 rounded">{message}</div>}

                        {/* Sources List */}
                        <div className="neon-box p-6 rounded-xl bg-slate-900/50">
                            <h2 className="text-xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
                                <Database className="w-5 h-5" /> Managed Sources
                            </h2>

                            <div className="space-y-4">
                                {sources.map((src) => (
                                    <div key={src.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded border border-slate-700">
                                        <div>
                                            <div className="font-bold text-white">{src.label}</div>
                                            <div className="text-sm text-slate-400 font-mono">{src.url}</div>
                                        </div>
                                        <button
                                            onClick={() => deleteSource(src.id)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                            title="Delete Source"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}

                                {sources.length === 0 && <p className="text-slate-500 text-center py-4">No sources added yet.</p>}
                            </div>

                            {/* Add Source Form */}
                            <form onSubmit={addSource} className="mt-8 pt-6 border-t border-slate-700 flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Label (e.g. My Server)"
                                    className="flex-1 p-3 rounded bg-slate-800 border border-slate-700 outline-none focus:border-cyan-400"
                                    value={newSourceLabel}
                                    onChange={e => setNewSourceLabel(e.target.value)}
                                    required
                                />
                                <input
                                    type="url"
                                    placeholder="URL (e.g. http://example.com/)"
                                    className="flex-[2] p-3 rounded bg-slate-800 border border-slate-700 outline-none focus:border-cyan-400"
                                    value={newSourceUrl}
                                    onChange={e => setNewSourceUrl(e.target.value)}
                                    required
                                />
                                <button className="px-6 bg-cyan-600 hover:bg-cyan-500 rounded font-bold flex items-center gap-2">
                                    <Plus className="w-5 h-5" /> Add
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
