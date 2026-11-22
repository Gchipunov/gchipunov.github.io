#!/usr/bin/env node

/**
 * Gemini NDK Orchestrator CLI (`ndk-orch`)
 * ---------------------------------------------------------------------------
 * A token-lean Node.js CLI orchestrator built for C++ NDK GameActivity projects.
 *
 * Features:
 *  1. Smart NDK Project Scanner: Indexes `cpp/` (.h, .hpp, .cpp, CMakeLists.txt),
 *     `assets/` (shaders like .vert/.frag/.glsl/.spv, levels, configs), and Gradle files,
 *     automatically ignoring `build/`, `.cxx/`, `.gradle/`, and binary bloat.
 *  2. Two-Tier Model Routing (Orchestrator -> Worker):
 *     - Orchestrator (Gemini 2.5 Flash / 3.8 Flash): Reads ONLY the lightweight file
 *       index + header signatures to select the minimal subset of files needed.
 *     - Worker (Gemini 2.5 Pro / 3.1 Pro): Receives ONLY the selected files + trimmed
 *       compiler errors to generate clean, diff-friendly C++/GLSL/CMake code.
 *  3. Android CLI (`android`) & Antigravity CLI (`agy`) Bridge:
 *     - Executes `android run`, `android info`, `android docs search`, or delegates
 *       heavy multi-step verification to `agy` subagents while trimming log noise.
 *  4. Cache-Friendly Prompt Layout: Places static system rules & NDK project map at
 *     the top of the prompt so Gemini's implicit/explicit context caching hits reliably.
 *
 * Requirements:
 *  - Node.js 18+ (uses built-in `fetch`, `fs`, `path`, `child_process`, `readline`)
 *  - Environment variable: `GEMINI_API_KEY`
 *
 * Usage:
 *  export GEMINI_API_KEY="your-key"
 *  node orchestrator.js --project /path/to/android-ndk-game
 */

import fs from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import readline from "node:readline";

// ============================================================================
// 1. CONFIGURATION & CLI ARGUMENT PARSING
// ============================================================================

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const CONFIG = {
  projectRoot: path.resolve(getArg("--project", process.cwd())),
  apiKey: process.env.GEMINI_API_KEY || "",
  // Fast, low-cost model for routing, file selection, and error log summarization
  orchestratorModel: getArg("--router-model", "gemini-2.5-flash"),
  // Strong reasoning/coding model for C++ NDK, physics, and GLSL shader generation
  workerModel: getArg("--worker-model", "gemini-2.5-pro"),
  // Safety caps to prevent runaway token burn
  maxContextChars: Number(getArg("--max-chars", "120000")), // ~30k tokens max per worker call
  maxErrorLines: 35,
  // Directories to strictly exclude from scanning
  ignoredDirs: new Set([
    ".git",
    ".gradle",
    ".idea",
    ".cxx",
    "build",
    "captures",
    "node_modules",
    "__pycache__",
  ]),
  // Allowed text-based extensions for NDK C++ & Shader asset workflows
  trackedExtensions: new Set([
    ".cpp",
    ".cc",
    ".c",
    ".h",
    ".hpp",
    ".glsl",
    ".vert",
    ".frag",
    ".comp",
    ".geom",
    ".tesc",
    ".tese",
    ".kts",
    ".gradle",
    ".xml",
    ".json",
    ".properties",
  ]),
  trackedExactNames: new Set(["CMakeLists.txt", "AndroidManifest.xml"]),
};

// ANSI Terminal Colors for clean CLI feedback
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

// ============================================================================
// 2. NDK PROJECT SCANNER & LIGHTWEIGHT REPOSITORY MAPPER
// ============================================================================

/**
 * Recursively scans the Android project to categorize:
 * - cppHeaders (.h, .hpp)
 * - cppSources (.cpp, .c, .cc)
 * - cmakeFiles (CMakeLists.txt)
 * - shaderAssets (assets/**\/*.vert, .frag, .glsl, etc.)
 * - otherAssets (assets/**\/*.json, etc.)
 * - gradleConfig (build.gradle.kts, AndroidManifest.xml, etc.)
 */
function scanNdkProject(rootDir) {
  const index = {
    root: rootDir,
    cppHeaders: [],
    cppSources: [],
    cmakeFiles: [],
    shaderAssets: [],
    otherAssets: [],
    gradleConfig: [],
    allFiles: new Map(), // relPath -> { relPath, absPath, category, sizeBytes, lineCount, summary }
  };

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      return;
    }

    for (const entry of entries) {
      if (CONFIG.ignoredDirs.has(entry.name)) continue;

      const absPath = path.join(currentDir, entry.name);
      const relPath = path.relative(rootDir, absPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        walk(absPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      const isExact = CONFIG.trackedExactNames.has(entry.name);
      if (!isExact && !CONFIG.trackedExtensions.has(ext)) continue;

      let stat;
      try {
        stat = fs.statSync(absPath);
      } catch {
        continue;
      }

      // Skip huge generated/minified text files (> 250 KB)
      if (stat.size > 250 * 1024) continue;

      const content = fs.readFileSync(absPath, "utf8");
      const lineCount = content.split("\n").length;
      const category = classifyFile(relPath, entry.name, ext);
      const summary = extractCompactSignatureSummary(content, category);

      const meta = {
        relPath,
        absPath,
        category,
        sizeBytes: stat.size,
        lineCount,
        summary,
      };

      index.allFiles.set(relPath, meta);
      index[category].push(meta);
    }
  }

  walk(rootDir);
  return index;
}

function classifyFile(relPath, fileName, ext) {
  const lower = relPath.toLowerCase();
  if (fileName === "CMakeLists.txt" || ext === ".cmake") return "cmakeFiles";
  if (ext === ".h" || ext === ".hpp") return "cppHeaders";
  if (ext === ".cpp" || ext === ".c" || ext === ".cc") return "cppSources";
  if (
    lower.includes("/assets/") &&
    [".vert", ".frag", ".glsl", ".comp", ".geom"].includes(ext)
  ) {
    return "shaderAssets";
  }
  if (lower.includes("/assets/")) return "otherAssets";
  return "gradleConfig";
}

/**
 * Extracts lightweight symbols (structs, classes, functions, uniforms, CMake targets)
 * so the Orchestrator LLM can pick the right files WITHOUT reading full bodies.
 */
function extractCompactSignatureSummary(content, category) {
  const lines = content.split("\n");
  const hits = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//") || line.startsWith("/*")) continue;

    if (category === "cppHeaders" || category === "cppSources") {
      if (/^(class|struct|enum|namespace)\s+\w+/.test(line)) {
        hits.push(line.replace(/\{.*$/, "").trim());
      } else if (
        /^(void|bool|int|float|double|uint32_t|size_t|auto|GLuint)\s+\w+\s*\(/.test(
          line
        )
      ) {
        hits.push(line.replace(/\{.*$/, "").trim());
      }
    } else if (category === "shaderAssets") {
      if (/^(#version|uniform|layout|in|out|void\s+main)/.test(line)) {
        hits.push(line.replace(/\{.*$/, "").trim());
      }
    } else if (category === "cmakeFiles") {
      if (
        /^(cmake_minimum_required|project|add_library|find_package|target_link_libraries|target_include_directories)/.test(
          line
        )
      ) {
        hits.push(line);
      }
    }
    if (hits.length >= 12) break;
  }

  return hits.length > 0 ? hits.join(" | ") : "(no top-level symbols extracted)";
}

/**
 * Builds a compact, token-lean text map of the entire NDK & Assets directory.
 */
function formatRepoMap(index) {
  const sections = [
    ["CMake Build Files", index.cmakeFiles],
    ["C++ Headers (cpp/**/*.h)", index.cppHeaders],
    ["C++ Sources (cpp/**/*.cpp)", index.cppSources],
    ["GLSL Shaders (assets/shaders/*)", index.shaderAssets],
    ["Other Game Assets (assets/*)", index.otherAssets],
    ["Gradle & Manifest Config", index.gradleConfig],
  ];

  const out = [`PROJECT ROOT: ${index.root}`, `TOTAL TRACKED FILES: ${index.allFiles.size}\n`];

  for (const [title, list] of sections) {
    out.push(`=== ${title} (${list.length}) ===`);
    if (list.length === 0) {
      out.push("  (none)");
      continue;
    }
    for (const f of list) {
      out.push(`  - ${f.relPath} (${f.lineCount} lines) :: ${f.summary}`);
    }
    out.push("");
  }

  return out.join("\n");
}

// ============================================================================
// 3. ANDROID CLI (`android`) & ANTIGRAVITY CLI (`agy`) INTEGRATION
// ============================================================================

function checkCliAvailable(cmd) {
  try {
    const checkCmd = process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs a shell command safely and trims noisy compiler/Gradle output to save LLM tokens.
 */
function runTrimmedCommand(command, argsList, cwd) {
  console.log(`${C.dim}$ ${command} ${argsList.join(" ")}${C.reset}`);
  const result = spawnSync(command, argsList, {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  const combined = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const lines = combined.split("\n");

  // Prioritize compiler/CMake/Ninja errors if the command failed
  if (result.status !== 0) {
    const errorLines = lines.filter((l) =>
      /(error:|undefined reference|CMake Error|FAILED:|ninja: build stopped|Exception)/i.test(
        l
      )
    );
    const trimmed =
      errorLines.length > 0
        ? errorLines.slice(0, CONFIG.maxErrorLines).join("\n")
        : lines.slice(-CONFIG.maxErrorLines).join("\n");

    return {
      ok: false,
      exitCode: result.status,
      trimmedOutput: trimmed,
      rawLineCount: lines.length,
    };
  }

  return {
    ok: true,
    exitCode: 0,
    trimmedOutput: lines.slice(-20).join("\n"),
    rawLineCount: lines.length,
  };
}

/**
 * Fetches official Android/NDK docs via `android docs search` (0 LLM tokens used).
 */
function queryAndroidDocs(query) {
  if (!checkCliAvailable("android")) {
    return "Android CLI (`android`) is not installed or not in PATH.";
  }
  const res = runTrimmedCommand("android", ["docs", "search", query], CONFIG.projectRoot);
  return res.trimmedOutput;
}

// ============================================================================
// 4. GEMINI API CLIENT (WITH TOKEN USAGE TRACKING)
// ============================================================================

const tokenStats = {
  promptTokens: 0,
  cachedTokens: 0,
  outputTokens: 0,
  calls: 0,
};

async function callGemini({
  model,
  systemInstruction,
  userPrompt,
  responseMimeType = "text/plain",
  temperature = 0.2,
}) {
  if (!CONFIG.apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Run: export GEMINI_API_KEY='your_api_key'"
    );
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(CONFIG.apiKey)}`;

  const payload = {
    // Static system instructions stay at the top for optimal prefix cache hits
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature,
      responseMimeType,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Track token consumption including prompt cache hits
  const usage = data.usageMetadata || {};
  tokenStats.promptTokens += usage.promptTokenCount || 0;
  tokenStats.cachedTokens += usage.cachedContentTokenCount || 0;
  tokenStats.outputTokens += usage.candidatesTokenCount || 0;
  tokenStats.calls += 1;

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  return { text, usage };
}

// ============================================================================
// 5. TWO-STAGE ORCHESTRATOR PIPELINE
// ============================================================================

/**
 * STAGE 1: Cheap Orchestrator Model selects ONLY the relevant files & optional Android docs.
 */
async function planTaskWithOrchestrator(userTask, repoMapText) {
  const systemInstruction = `You are a Principal Android C++ NDK & OpenGL ES Game Engine Architect acting as a token-lean Task Orchestrator.
Given a lightweight repository map of an Android NDK GameActivity project (containing CMakeLists.txt, cpp/*.h, cpp/*.cpp, and assets/shaders/*), select ONLY the minimal set of existing files needed to complete the user's request.
Respond strictly in JSON matching this schema:
{
  "reasoning": "Brief 1-2 sentence plan",
  "selectedFiles": ["relative/path/to/file1.h", "relative/path/to/shader.frag"],
  "newFilesToCreate": ["relative/path/to/new_file.cpp"],
  "androidDocsQuery": "optional short query for 'android docs search' or empty string",
  "delegateToAgy": false
}`;

  const userPrompt = `REPOSITORY MAP:\n${repoMapText}\n\nUSER TASK:\n${userTask}`;

  const { text } = await callGemini({
    model: CONFIG.orchestratorModel,
    systemInstruction,
    userPrompt,
    responseMimeType: "application/json",
    temperature: 0.1,
  });

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Orchestrator returned invalid JSON: ${text}`);
  }
}

/**
 * STAGE 2: Worker Model reads ONLY the selected files and outputs structured file updates.
 */
async function executeTaskWithWorker(userTask, plan, repoIndex, repoMapText, extraContext = "") {
  const bundledFiles = [];
  let currentChars = 0;

  // Always include CMakeLists.txt if C++ files are being added or modified
  const filesToLoad = new Set(plan.selectedFiles || []);
  for (const cmake of repoIndex.cmakeFiles) {
    filesToLoad.add(cmake.relPath);
  }

  for (const relPath of filesToLoad) {
    const meta = repoIndex.allFiles.get(relPath);
    if (!meta) continue;

    const content = fs.readFileSync(meta.absPath, "utf8");
    if (currentChars + content.length > CONFIG.maxContextChars) {
      console.log(
        `${C.yellow}[Budget Guard] Skipping ${relPath} to stay within ${CONFIG.maxContextChars} char budget.${C.reset}`
      );
      continue;
    }

    bundledFiles.push(`--- FILE: ${relPath} ---\n${content}\n--- END FILE ---`);
    currentChars += content.length;
  }

  const systemInstruction = `You are an expert C++20 Android NDK (GameActivity), CMake, and OpenGL ES 3.0 Shader Engineer.
Rules:
1. Keep C++ memory management deterministic (prefer RAII, flat arrays / SoA, zero per-frame heap allocations in the game loop).
2. Ensure GLSL shaders include explicit #version 300 es and precision qualifiers (precision mediump float;).
3. If adding new .cpp files, update CMakeLists.txt accordingly.
4. Return ONLY valid JSON with the following structure so our CLI can write the files cleanly:
{
  "summary": "What was changed and why",
  "files": [
    {
      "path": "app/src/main/cpp/player.cpp",
      "action": "write",
      "content": "full updated file content"
    }
  ],
  "recommendedCommand": "android run --debug"
}`;

  const userPrompt = [
    `PROJECT STRUCTURE OVERVIEW:\n${repoMapText}`,
    extraContext ? `ANDROID DOCS / BUILD CONTEXT:\n${extraContext}` : "",
    `SELECTED SOURCE & SHADER FILES:\n${bundledFiles.join("\n\n")}`,
    `ORCHESTRATOR PLAN:\n${plan.reasoning}`,
    `USER REQUEST:\n${userTask}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { text } = await callGemini({
    model: CONFIG.workerModel,
    systemInstruction,
    userPrompt,
    responseMimeType: "application/json",
    temperature: 0.2,
  });

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Worker returned invalid JSON: ${text}`);
  }
}

/**
 * Safely writes generated files to disk with automatic `.bak` backups.
 */
function applyFileChanges(fileEdits, rootDir) {
  if (!Array.isArray(fileEdits) || fileEdits.length === 0) {
    console.log(`${C.yellow}No file edits produced.${C.reset}`);
    return;
  }

  for (const edit of fileEdits) {
    // Prevent path traversal outside project root
    const targetPath = path.resolve(rootDir, edit.path);
    if (!targetPath.startsWith(rootDir)) {
      console.error(`${C.red}[Security] Blocked write outside project root: ${edit.path}${C.reset}`);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    if (fs.existsSync(targetPath)) {
      fs.copyFileSync(targetPath, `${targetPath}.bak`);
    }

    fs.writeFileSync(targetPath, edit.content, "utf8");
    console.log(`${C.green}[Written]${C.reset} ${edit.path} ${C.dim}(backup: .bak)${C.reset}`);
  }
}

// ============================================================================
// 6. INTERACTIVE CLI REPL & COMMAND HANDLERS
// ============================================================================

function printBanner(index, hasAndroidCli, hasAgyCli) {
  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║     Gemini NDK GameActivity & Shader Orchestrator CLI        ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}Project Root :${C.reset} ${index.root}`);
  console.log(
    `${C.dim}Models       :${C.reset} Router=${C.yellow}${CONFIG.orchestratorModel}${C.reset} | Worker=${C.magenta}${CONFIG.workerModel}${C.reset}`
  );
  console.log(
    `${C.dim}Indexed Files:${C.reset} ${index.cppHeaders.length} .h | ${index.cppSources.length} .cpp | ${index.cmakeFiles.length} CMake | ${index.shaderAssets.length} shaders`
  );
  console.log(
    `${C.dim}External CLIs:${C.reset} android=${hasAndroidCli ? C.green + "OK" : C.red + "MISSING"}${C.reset} | agy=${hasAgyCli ? C.green + "OK" : C.red + "MISSING"}${C.reset}\n`
  );
  console.log(`${C.bold}Commands:${C.reset}`);
  console.log(`  ${C.cyan}/map${C.reset}                Show the compact C++/CMake/Shaders repo map`);
  console.log(`  ${C.cyan}/rescan${C.reset}             Re-index cpp/, assets/shaders/, and CMakeLists.txt`);
  console.log(`  ${C.cyan}/build${C.reset}              Run 'android run --debug' and auto-fix errors on failure`);
  console.log(`  ${C.cyan}/docs <query>${C.reset}       Search official Android/NDK docs via 'android docs search'`);
  console.log(`  ${C.cyan}/agy <prompt>${C.reset}       Delegate a multi-step agent loop to Antigravity CLI ('agy')`);
  console.log(`  ${C.cyan}/tokens${C.reset}             Display session token & cache hit statistics`);
  console.log(`  ${C.cyan}/exit${C.reset}               Quit\n`);
  console.log(`${C.dim}Or type any feature request (e.g., "Add a bloom fragment shader in assets/shaders and load it in renderer.cpp")${C.reset}\n`);
}

async function main() {
  let repoIndex = scanNdkProject(CONFIG.projectRoot);
  let repoMapText = formatRepoMap(repoIndex);
  const hasAndroidCli = checkCliAvailable("android");
  const hasAgyCli = checkCliAvailable("agy");

  printBanner(repoIndex, hasAndroidCli, hasAgyCli);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${C.bold}${C.green}ndk-orch>${C.reset} `,
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    try {
      if (input === "/exit" || input === "/quit") {
        rl.close();
        return;
      }

      if (input === "/map") {
        console.log("\n" + repoMapText);
        rl.prompt();
        return;
      }

      if (input === "/rescan") {
        repoIndex = scanNdkProject(CONFIG.projectRoot);
        repoMapText = formatRepoMap(repoIndex);
        console.log(`${C.green}Rescanned ${repoIndex.allFiles.size} tracked NDK & asset files.${C.reset}`);
        rl.prompt();
        return;
      }

      if (input === "/tokens") {
        console.log(
          `\n${C.cyan}Session Token Usage:${C.reset} Calls=${tokenStats.calls} | Prompt=${tokenStats.promptTokens} | Cached=${tokenStats.cachedTokens} | Output=${tokenStats.outputTokens}\n`
        );
        rl.prompt();
        return;
      }

      if (input.startsWith("/docs ")) {
        const query = input.slice(6).trim();
        console.log(queryAndroidDocs(query));
        rl.prompt();
        return;
      }

      if (input.startsWith("/agy ")) {
        const agyPrompt = input.slice(5).trim();
        if (!hasAgyCli) {
          console.log(`${C.red}Antigravity CLI ('agy') is not installed in PATH.${C.reset}`);
        } else {
          console.log(`${C.magenta}Delegating to Antigravity CLI subagent...${C.reset}`);
          spawnSync("agy", [agyPrompt], {
            cwd: CONFIG.projectRoot,
            stdio: "inherit",
          });
        }
        rl.prompt();
        return;
      }

      if (input === "/build") {
        if (!hasAndroidCli) {
          console.log(`${C.red}Android CLI ('android') not found in PATH.${C.reset}`);
          rl.prompt();
          return;
        }
        console.log(`${C.cyan}Running deterministic build via Android CLI...${C.reset}`);
        const buildRes = runTrimmedCommand("android", ["run", "--debug"], CONFIG.projectRoot);
        if (buildRes.ok) {
          console.log(`${C.green}Build & deploy succeeded!${C.reset}`);
        } else {
          console.log(
            `${C.red}Build failed (${buildRes.rawLineCount} raw lines trimmed to ${CONFIG.maxErrorLines}):${C.reset}\n${buildRes.trimmedOutput}\n`
          );
          console.log(`${C.yellow}Routing trimmed compiler errors to Gemini Worker for diagnosis...${C.reset}`);
          const fixTask = `Fix these NDK C++/CMake/Shader compilation errors:\n${buildRes.trimmedOutput}`;
          const plan = await planTaskWithOrchestrator(fixTask, repoMapText);
          const result = await executeTaskWithWorker(fixTask, plan, repoIndex, repoMapText);
          console.log(`\n${C.bold}Diagnosis:${C.reset} ${result.summary}\n`);
          applyFileChanges(result.files, CONFIG.projectRoot);
        }
        rl.prompt();
        return;
      }

      // Standard Two-Stage Orchestrated Coding Task
      console.log(`${C.yellow}[1/3] Orchestrator (${CONFIG.orchestratorModel}) scoping NDK & shader files...${C.reset}`);
      const plan = await planTaskWithOrchestrator(input, repoMapText);
      console.log(`${C.dim}Plan: ${plan.reasoning}${C.reset}`);
      console.log(`${C.dim}Selected Files: ${(plan.selectedFiles || []).join(", ") || "(none)"}${C.reset}`);

      let docsContext = "";
      if (plan.androidDocsQuery && hasAndroidCli) {
        console.log(`${C.cyan}[2/3] Fetching official Android docs for "${plan.androidDocsQuery}"...${C.reset}`);
        docsContext = queryAndroidDocs(plan.androidDocsQuery);
      }

      console.log(`${C.magenta}[3/3] Worker (${CONFIG.workerModel}) generating C++/GLSL/CMake implementation...${C.reset}`);
      const workerResult = await executeTaskWithWorker(
        input,
        plan,
        repoIndex,
        repoMapText,
        docsContext
      );

      console.log(`\n${C.bold}${C.green}Result Summary:${C.reset} ${workerResult.summary}\n`);
      applyFileChanges(workerResult.files, CONFIG.projectRoot);

      // Refresh index after modifying files
      repoIndex = scanNdkProject(CONFIG.projectRoot);
      repoMapText = formatRepoMap(repoIndex);

      if (workerResult.recommendedCommand) {
        console.log(`${C.dim}Suggested next step: ${workerResult.recommendedCommand} (or run /build)${C.reset}\n`);
      }
    } catch (err) {
      console.error(`${C.red}[Error]${C.reset} ${err.message}\n`);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log(
      `\n${C.dim}Exiting ndk-orch. Total session tokens: Prompt=${tokenStats.promptTokens}, Cached=${tokenStats.cachedTokens}, Output=${tokenStats.outputTokens}${C.reset}`
    );
    process.exit(0);
  });
}

main();