import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, 
  Gamepad2, 
  Save, 
  ExternalLink, 
  Play, 
  Plus, 
  X, 
  TerminalSquare, 
  Layers, 
  Wand2, 
  Sparkles, 
  Box,
  CheckCircle2
} from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_GAMES = [
  {
    id: 1,
    title: 'Neon Drift - WebGL Sandbox',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600&h=300',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #0f172a; color: #10b981; font-family: monospace; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; }
    canvas { background: #000; border: 2px solid #10b981; border-radius: 8px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); width: 80%; max-width: 600px; aspect-ratio: 16/9; }
    h1 { text-shadow: 0 0 10px #10b981; }
  </style>
</head>
<body>
  <h1>NEON DRIFT ENGINE</h1>
  <canvas id="gameCanvas"></canvas>
  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let time = 0;
    
    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function loop() {
      time += 0.05;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const x = canvas.width / 2 + Math.cos(time) * 100;
      const y = canvas.height / 2 + Math.sin(time * 2) * 50;
      
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`,
    tags: { 
      engine: ['Custom 2D Loop', 'Canvas API'], 
      vfx: ['Trail Effect', 'Neon Glow'], 
      shaders: [], 
      assets: ['Procedural'] 
    }
  },
  {
    id: 2,
    title: 'Void Raymarcher',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600&h=300',
    code: `<!DOCTYPE html>
<html>
<body style="margin:0; overflow:hidden; background:#000; display:flex; align-items:center; justify-content:center; height:100vh; color:#fff; font-family:sans-serif;">
  <h2 style="background: linear-gradient(to right, #ec4899, #8b5cf6); -webkit-background-clip: text; color: transparent;">Void Raymarcher [Preview Placeholder]</h2>
</body>
</html>`,
    tags: { 
      engine: ['WebGL2'], 
      vfx: ['Volumetric Fog'], 
      shaders: ['Raymarching', 'SDF'], 
      assets: [] 
    }
  }
];

const TAG_CATEGORIES = {
  engine: { label: 'Engine Features', icon: <Layers className="w-4 h-4" />, color: 'bg-blue-900/50 text-blue-300 border-blue-700/50' },
  vfx: { label: 'VFX', icon: <Sparkles className="w-4 h-4" />, color: 'bg-purple-900/50 text-purple-300 border-purple-700/50' },
  shaders: { label: 'Shaders', icon: <Wand2 className="w-4 h-4" />, color: 'bg-pink-900/50 text-pink-300 border-pink-700/50' },
  assets: { label: 'Assets', icon: <Box className="w-4 h-4" />, color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50' }
};

// --- COMPONENTS ---

const Badge = ({ children, className = '' }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium border ${className}`}>
    {children}
  </span>
);

export default function App() {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'editor'
  const [games, setGames] = useState(INITIAL_GAMES);
  const [activeGameId, setActiveGameId] = useState(null);

  const openEditor = (id) => {
    setActiveGameId(id);
    setCurrentView('editor');
  };

  const goToList = () => {
    setCurrentView('list');
    setActiveGameId(null);
  };

  const updateGame = (updatedGame) => {
    setGames(games.map(g => g.id === updatedGame.id ? updatedGame : g));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <TerminalSquare className="w-7 h-7 text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              AI Forge Sandbox
            </h1>
            <p className="text-xs text-slate-500 font-mono">WebGL & JSFiddle IDE</p>
          </div>
        </div>
        <div>
          {currentView === 'editor' && (
            <button 
              onClick={goToList}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md"
            >
              <Gamepad2 className="w-4 h-4" />
              Back to Games
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'list' ? (
          <GamesList games={games} onOpenEditor={openEditor} />
        ) : (
          <EditorView 
            game={games.find(g => g.id === activeGameId)} 
            onSave={updateGame} 
          />
        )}
      </main>
    </div>
  );
}

// --- PAGE 1: GAMES LIST ---
function GamesList({ games, onOpenEditor }) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white">Sandbox Repository</h2>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {games.map(game => (
            <div key={game.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/10 flex flex-col">
              <div className="h-48 relative overflow-hidden bg-slate-800">
                <img 
                  src={game.thumbnail} 
                  alt={game.title} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-bold text-white shadow-sm">{game.title}</h3>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex-1 space-y-3">
                  {Object.entries(game.tags).map(([category, tags]) => (
                    tags.length > 0 && (
                      <div key={category}>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-semibold">
                          {TAG_CATEGORIES[category].icon} {TAG_CATEGORIES[category].label}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(tag => (
                            <Badge key={tag} className={TAG_CATEGORIES[category].color}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
                
                <div className="pt-4 border-t border-slate-800">
                  <button 
                    onClick={() => onOpenEditor(game.id)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-indigo-600 text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Code2 className="w-4 h-4" /> Edit & Play Code
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- PAGE 2: EDITOR VIEW ---
function EditorView({ game, onSave }) {
  if (!game) return null;

  const [code, setCode] = useState(game.code);
  const [tags, setTags] = useState(game.tags);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Tag Input State
  const [newTagVal, setNewTagVal] = useState('');
  const [newTagCat, setNewTagCat] = useState('engine');

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API/DB call to MySQL BLOB
    setTimeout(() => {
      onSave({ ...game, code, tags });
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }, 800);
  };

  const handlePopOut = () => {
    // Create a Blob from the code and open in new tab
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const removeTag = (category, tagToRemove) => {
    setTags(prev => ({
      ...prev,
      [category]: prev[category].filter(t => t !== tagToRemove)
    }));
  };

  const addTag = (e) => {
    e.preventDefault();
    if (!newTagVal.trim()) return;
    if (tags[newTagCat].includes(newTagVal.trim())) return; // Prevent duplicates

    setTags(prev => ({
      ...prev,
      [newTagCat]: [...prev[newTagCat], newTagVal.trim()]
    }));
    setNewTagVal('');
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#0d1117]">
      
      {/* LEFT PANEL: Preview & Tags */}
      <div className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 h-[50vh] lg:h-auto">
        
        {/* Live Preview Container */}
        <div className="flex-1 relative flex flex-col bg-black overflow-hidden group">
          <div className="absolute top-0 inset-x-0 p-2 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-mono text-slate-400 bg-black/50 px-2 py-1 rounded backdrop-blur">Live Preview</span>
            <button onClick={handlePopOut} className="text-xs flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-white px-2 py-1 rounded backdrop-blur transition-colors">
              <ExternalLink className="w-3 h-3" /> Pop Out
            </button>
          </div>
          {/* Iframe for JSFiddle like behavior */}
          <iframe 
            title="Live Preview"
            srcDoc={code}
            sandbox="allow-scripts allow-pointer-lock allow-same-origin"
            className="w-full h-full border-none bg-white" 
          />
        </div>

        {/* Tagging System Panel */}
        <div className="h-64 bg-slate-900 border-t border-slate-800 p-4 overflow-y-auto custom-scrollbar flex flex-col">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Project Tags & Metadata
          </h3>
          
          <div className="flex-1 space-y-4">
            {Object.entries(tags).map(([category, catTags]) => (
              <div key={category} className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {TAG_CATEGORIES[category].label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {catTags.length === 0 && <span className="text-xs text-slate-700 italic">None</span>}
                  {catTags.map(tag => (
                    <Badge key={tag} className={`${TAG_CATEGORIES[category].color} flex items-center gap-1 pl-2 pr-1 py-0.5`}>
                      {tag}
                      <button 
                        onClick={() => removeTag(category, tag)}
                        className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={addTag} className="mt-4 flex gap-2 pt-3 border-t border-slate-800/50">
            <select 
              value={newTagCat} 
              onChange={e => setNewTagCat(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 outline-none focus:border-indigo-500 w-28"
            >
              {Object.entries(TAG_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <input 
              type="text" 
              value={newTagVal}
              onChange={e => setNewTagVal(e.target.value)}
              placeholder="Add tag..." 
              className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-3 py-1.5 outline-none focus:border-indigo-500 placeholder-slate-600"
            />
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition-colors text-xs font-medium">
              Add
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Code Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {/* Editor Toolbar */}
        <div className="h-12 bg-[#2d2d2d] border-b border-[#1e1e1e] px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-mono text-slate-300">{game.title} (HTML/JS/GLSL)</span>
          </div>
          <div className="flex items-center gap-3">
            {showSaveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3 h-3" /> Saved to DB (BLOB)
              </span>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save to DB'}
            </button>
          </div>
        </div>

        {/* Actual Editor (using Textarea styled like a code editor) */}
        <div className="flex-1 relative">
          {/* Line numbers mock (visual only for effect) */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-[#333] text-right pr-2 py-4 text-[#858585] text-sm font-mono select-none overflow-hidden hidden sm:block">
            {Array.from({ length: 50 }).map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 sm:pl-16 outline-none resize-none custom-scrollbar leading-relaxed"
            style={{ tabSize: 2 }}
          />
        </div>
      </div>
      
      {/* Add custom scrollbar styles globally for this app component */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1); 
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2); 
        }
      `}} />
    </div>
  );
}