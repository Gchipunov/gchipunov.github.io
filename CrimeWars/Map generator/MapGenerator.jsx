import React, { useState, useEffect } from 'react';

// --- API Configuration ---
const apiKey = ""; // Canvas will provide this key at runtime
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

/**
 * Helper function to apply exponential backoff for API calls.
 * @param {function} fn - The function to execute.
 * @param {number} maxRetries - Maximum number of retries.
 * @returns {Promise<any>} The result of the function.
 */
const withExponentialBackoff = async (fn, maxRetries = 5) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// --- Map Generator Component ---

const initialMapState = {
  gridSize: 10,
  elements: []
};

// Defines the JSON structure the AI must return
const mapSchema = {
  type: "OBJECT",
  properties: {
    gridSize: {
      type: "INTEGER",
      description: "The width and height of the square map grid (between 10 and 20)."
    },
    elements: {
      type: "ARRAY",
      description: "An array of map elements (walls, obstacles, spawns).",
      items: {
        type: "OBJECT",
        properties: {
          type: {
            type: "STRING",
            enum: ["SPAWN", "COVER", "WALL", "CHOKE_POINT"],
            description: "Type of element."
          },
          x: {
            type: "INTEGER",
            description: "X coordinate (column, 0 to gridSize-1)."
          },
          y: {
            type: "INTEGER",
            description: "Y coordinate (row, 0 to gridSize-1)."
          },
          label: {
            type: "STRING",
            description: "A short, descriptive label for the element (e.g., 'Sniper Tower', 'Red Team Spawn')."
          }
        },
        required: ["type", "x", "y", "label"]
      }
    }
  },
  required: ["gridSize", "elements"],
  propertyOrdering: ["gridSize", "elements"]
};


const App = () => {
  const [prompt, setPrompt] = useState("Small, chaotic arena. Two main spawn points (A and B) and central high ground cover. Grid size 15.");
  const [mapData, setMapData] = useState(initialMapState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateMap = async () => {
    if (isLoading || !prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setMapData(initialMapState);

    const userQuery = `Generate a 2D deathmatch map layout based on these constraints: "${prompt}". Ensure the gridSize is between 10 and 20. Place at least 1 SPAWN A and 1 SPAWN B element, and multiple COVER/WALL elements.`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: mapSchema,
      },
      systemInstruction: {
        parts: [{
          text: "You are an AI-powered 3D Deathmatch Map Blueprint Generator. Your task is to design a balanced and fun map layout on a grid. You must output the entire response as a single, valid JSON object that strictly adheres to the provided schema. Do not include any explanation or markdown outside the JSON block."
        }]
      }
    };

    const fetchMapData = async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();
      const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!jsonText) {
        throw new Error("Invalid response format from AI.");
      }

      // The LLM returns a stringified JSON object, we must parse it.
      const parsedData = JSON.parse(jsonText);
      return parsedData;
    };

    try {
      const result = await withExponentialBackoff(fetchMapData);
      // Validate basic structure and constraints
      if (result.gridSize >= 10 && result.gridSize <= 20 && Array.isArray(result.elements)) {
        setMapData(result);
      } else {
        setError("AI returned data outside of required constraints (grid size 10-20 or invalid elements array).");
      }
    } catch (err) {
      console.error("Map generation error:", err);
      setError("Failed to generate map blueprint. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans">
      <style>{`
        .grid-cell {
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.7rem;
          font-weight: 600;
          position: relative;
          transition: background-color 0.3s ease;
        }
        .icon {
          font-size: 1.5rem;
          line-height: 1;
        }
        .label {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 0.5rem;
            line-height: 0.6rem;
            text-align: center;
            opacity: 0.8;
            padding: 1px 0;
            pointer-events: none;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        @media (max-width: 640px) {
            .label {
                font-size: 0.4rem;
                line-height: 0.5rem;
            }
            .icon {
                font-size: 1rem;
            }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-2 text-cyan-400">
          AI Deathmatch Map Blueprint Generator
        </h1>
        <p className="text-gray-400 mb-6">
          Input your design constraints below, and the AI will generate a 2D blueprint, which is the essential first step for building a 3D level in Hammer or Unreal Editor.
        </p>

        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl mb-6 border border-gray-700">
          <textarea
            className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:ring-cyan-500 focus:border-cyan-500 h-28 resize-none"
            placeholder="e.g., 'Large outdoor map, long sightlines, three distinct vertical levels, focus on controlling the center tower.'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />

          <button
            onClick={generateMap}
            className={`w-full py-3 rounded-xl font-bold transition duration-300 transform shadow-lg
              ${isLoading
                ? 'bg-cyan-700 cursor-not-allowed animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 hover:scale-[1.01] active:scale-[0.99]'}
            `}
            disabled={isLoading}
          >
            {isLoading ? 'Generating Blueprint...' : 'Generate New Map Blueprint'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-800 text-red-200 rounded-lg border border-red-600">
              Error: {error}
            </div>
          )}
        </div>

        {mapData.elements.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300">
              Map Blueprint ({mapData.gridSize}x{mapData.gridSize} Grid)
            </h2>
            <MapGrid mapData={mapData} />
            <Legend />
            <p className="text-sm text-gray-400 mt-4 italic">
              *The AI provided the coordinates and element types, simulating the first conceptual design phase for a 3D map. This is your top-down view (XY Plane).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const elementStyles = {
  SPAWN: { color: 'text-yellow-300', icon: '&#10023;', bg: 'bg-green-900/50', description: 'Player Spawn Point' },
  COVER: { color: 'text-amber-500', icon: '&#9632;', bg: 'bg-amber-900/50', description: 'Low Cover/Obstacle' },
  WALL: { color: 'text-gray-400', icon: '&#9646;', bg: 'bg-gray-600/50', description: 'High Wall/Blocking Brush' },
  CHOKE_POINT: { color: 'text-red-500', icon: '&#10006;', bg: 'bg-red-900/50', description: 'Tight Engagement Area' },
};

const MapGrid = ({ mapData }) => {
  const { gridSize, elements } = mapData;

  // Create a grid representation where each cell holds the element data
  const grid = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => null)
  );

  elements.forEach(element => {
    // Basic boundary check (y is row, x is column)
    if (element.y >= 0 && element.y < gridSize && element.x >= 0 && element.x < gridSize) {
      grid[element.y][element.x] = element;
    }
  });

  const getCellElement = (row, col) => {
    const element = grid[row][col];
    if (!element) {
      return null;
    }

    const style = elementStyles[element.type] || elementStyles.WALL;

    return (
      <div
        key={`${row}-${col}`}
        className={`grid-cell ${style.bg} ${style.color} hover:shadow-lg transition-shadow duration-150`}
        title={`${element.label} (${element.type}) at [${element.x}, ${element.y}]`}
      >
        <div className="icon" dangerouslySetInnerHTML={{ __html: style.icon }} />
        <div className="label bg-gray-900/70">{element.label}</div>
      </div>
    );
  };

  return (
    <div
      className="w-full bg-gray-700 p-1 rounded-lg shadow-inner overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        maxWidth: '100%',
        margin: '0 auto',
      }}
    >
      {Array.from({ length: gridSize * gridSize }).map((_, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        return getCellElement(row, col) || (
          <div key={index} className="grid-cell bg-gray-800/20 text-gray-500"></div>
        );
      })}
    </div>
  );
};

const Legend = () => (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-2 text-cyan-400">Blueprint Legend</h3>
    <div className="flex flex-wrap gap-4">
      {Object.entries(elementStyles).map(([key, { color, icon, description }]) => (
        <div key={key} className="flex items-center space-x-2 p-2 bg-gray-700 rounded-lg">
          <span className={`icon ${color}`} dangerouslySetInnerHTML={{ __html: icon }} />
          <span className="text-sm font-medium text-gray-300">{description} ({key})</span>
        </div>
      ))}
    </div>
  </div>
);

export default App;
