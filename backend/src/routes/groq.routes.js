// backend/routes/openai.routes.js
// Exposes:
// POST /ai/generate-challenge  -> returns a challenge JSON (python/java)
// POST /ai/run-tests           -> runs code (python/java) and returns results
//
// Uses environment variable: GROQ_API_KEY_LEARNING (you requested this name).
// If the key is NOT set, the route will return a local challenge (dev fallback).

const express = require("express");
const router = express.Router();
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const OpenAI = require("openai");

// Local challenges fallback
const { pickRandomChallenge } = require("../data/challenges");

// ── OpenAI client (use GROQ_API_KEY_LEARNING)
const openaiKey = process.env.GROQ_API_KEY_LEARNING;
if (!openaiKey) {
  console.warn(
    "⚠️ GROQ_API_KEY_LEARNING not set. /ai/generate-challenge will use local fallback challenges."
  );
}

let openai = null;
try {
  if (openaiKey) {
    openai = new OpenAI({ 
      apiKey: openaiKey,
      baseURL: "https://api.groq.com/openai/v1" // Use Groq base URL
    });
  }
} catch (err) {
  console.error("Failed to initialize OpenAI client:", err);
  openai = null;
}

const MODEL = process.env.OPENAI_MODEL || "openai/gpt-oss-120b";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function normalizeLanguage(lang = "python") {
  const m = String(lang).toLowerCase();
  if (["py", "python"].includes(m)) return "python";
  if (m === "java") return "java";
  if (["js", "javascript"].includes(m)) return "javascript";
  if (["cpp", "c++"].includes(m)) return "cpp";
  if (m === "c") return "c";
  return "python";
}

function extractFirstJsonBalanced(text = "") {
  const s = (text || "").replace(/```json\s*|\s*```/g, "").trim();
  let i = s.indexOf("{");
  if (i < 0) return null;
  let depth = 0,
    inStr = false,
    esc = false;
  for (let j = i; j < s.length; j++) {
    const ch = s[j];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const cand = s.slice(i, j + 1);
          try {
            return JSON.parse(cand);
          } catch {}
        }
      }
    }
  }
  return null;
}

function makeIdFromTitle(title) {
  const slug =
    String(title || "challenge")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "challenge";
  const uid = Math.random().toString(36).slice(2, 8);
  return `ai-${slug}-${uid}`;
}

function jsToJavaLiteral(v) {
  if (typeof v === "number") return Number.isInteger(v) ? `${v}` : `${v}`;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string")
    return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  if (Array.isArray(v)) {
    if (v.length && Array.isArray(v[0]) && v[0].every((n) => Number.isInteger(n))) {
      const inner = v.map(jsToJavaLiteral).join(", ");
      return `new int[][]{${inner}}`;
    }
    if (v.every((n) => Number.isInteger(n))) {
      return `new int[]{${v.join(", ")}}`;
    }
    if (v.every((x) => typeof x === "string")) {
      const inner = v.map(jsToJavaLiteral).join(", ");
      return `new String[]{${inner}}`;
    }
  }
  return `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// ─────────────────────────────────────────────────────────────
// Runners (Python / Java) — unchanged behavior
// ─────────────────────────────────────────────────────────────

async function runPython(functionName, userCode, testCases) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "learnpy-"));
  const userPath = path.join(dir, "user_code.py");
  const runnerPath = path.join(dir, "runner.py");

  try {
    await fs.promises.writeFile(userPath, userCode, "utf8");
    const runnerSrc = `
import json
import sys

FUNCTION_NAME = ${JSON.stringify(functionName)}
TEST_CASES = ${JSON.stringify(testCases)}

ns = {}
try:
    code = open(${JSON.stringify(userPath)}, "r", encoding="utf-8").read()
    exec(compile(code, "user_code.py", "exec"), ns)
    fn = ns.get(FUNCTION_NAME)
    if not callable(fn):
        raise Exception(f"Function {FUNCTION_NAME} not found")

    results = []
    allPassed = True
    for i, tc in enumerate(TEST_CASES):
        args = tc.get("args", [])
        desc = tc.get("description", "")
        try:
            out = fn(*args)
            exp = tc.get("expected")
            ok = (out == exp)
            if not ok:
                allPassed = False
            results.append({"case": i+1, "args": args, "expected": exp, "output": out, "passed": ok, "error": None, "description": desc})
        except Exception as e:
            allPassed = False
            results.append({"case": i+1, "args": args, "expected": tc.get("expected"), "output": None, "passed": False, "error": str(e), "description": desc})

    print(json.dumps({"results": results, "allPassed": allPassed}, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"results": [], "allPassed": False, "fatal": str(e)}), file=sys.stderr)
    sys.exit(1)
`;
    await fs.promises.writeFile(runnerPath, runnerSrc, "utf8");

    // Try different Python commands
    const pythonCommands = ['python3', 'python', 'py'];
    let pythonCmd = null;
    
    // Find working Python command
    for (const cmd of pythonCommands) {
      try {
        const testProcess = spawn(cmd, ['--version']);
        await new Promise((resolve, reject) => {
          testProcess.on('close', (code) => {
            if (code === 0) {
              pythonCmd = cmd;
              resolve();
            } else {
              reject();
            }
          });
          testProcess.on('error', reject);
        });
        if (pythonCmd) break;
      } catch {
        continue;
      }
    }

    if (!pythonCmd) {
      throw new Error("Python is not installed or not found in PATH. Please install Python 3.");
    }

    const py = spawn(pythonCmd, [runnerPath], { cwd: dir });
    let out = "", err = "";
    
    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));
    
    const codeExit = await new Promise((r) => py.on("close", r));
    
    if (codeExit !== 0 || !out.trim()) {
      throw new Error(err || "Python execution failed");
    }
    
    let parsed;
    try {
      parsed = JSON.parse(out.trim());
    } catch (parseErr) {
      throw new Error(`Python returned invalid JSON: ${out.substring(0, 200)}`);
    }
    
    if (parsed.fatal) {
      return { results: [], allPassed: false, error: parsed.fatal };
    }
    
    return { results: parsed.results || [], allPassed: !!parsed.allPassed };
  } catch (error) {
    throw error;
  } finally {
    // Cleanup
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
  }
}

async function runJava(functionName, userCode, testCases) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "learnjava-"));
  const solPath = path.join(dir, "Solution.java");
  const runPath = path.join(dir, "Runner.java");

  await fs.promises.writeFile(solPath, userCode, "utf8");

  const callLines = testCases
    .map((tc, idx) => {
      const argList = (tc.args || []).map(jsToJavaLiteral).join(", ");
      const expected = jsToJavaLiteral(tc.expected);
      return `
    try {
      var out = Solution.${tc.functionName || functionName}(${argList});
      boolean ok = java.util.Objects.equals(out, ${expected});
      if (!first) results.append(",");
      first=false;
      results.append("{\\"case\\":${idx + 1},\\"args\\":\\"\\",\\"expected\\":\\"\\",\\"output\\":" + toJson(out) + ",\\"passed\\":" + ok + ",\\"error\\":null,\\"description\\":${JSON.stringify(tc.description || "")}}");
      if (!ok) allPassed=false;
    } catch (Exception e) {
      if (!first) results.append(",");
      first=false;
      allPassed=false;
      results.append("{\\"case\\":${idx + 1},\\"args\\":\\"\\",\\"expected\\":\\"\\",\\"output\\":null,\\"passed\\":false,\\"error\\":\\"" + escapeJson(e.toString()) + "\\",\\"description\\":${JSON.stringify(tc.description || "")}}");
    }`;
    })
    .join("\n");

  const runnerSrc = `
import java.util.*;

public class Runner {
  static String escapeJson(String s){ return s.replace("\\\\","\\\\\\\\").replace("\"","\\\\\\\""); }
  static String arrIntToJson(int[] a){
    StringBuilder sb=new StringBuilder(); sb.append("[");
    for(int i=0;i<a.length;i++){ if(i>0) sb.append(","); sb.append(a[i]); }
    sb.append("]"); return sb.toString();
  }
  static String arrArrIntToJson(int[][] a){
    StringBuilder sb=new StringBuilder(); sb.append("[");
    for(int i=0;i<a.length;i++){ if(i>0) sb.append(","); sb.append(arrIntToJson(a[i])); }
    sb.append("]"); return sb.toString();
  }
  static String strArrToJson(String[] a){
    StringBuilder sb=new StringBuilder(); sb.append("[");
    for(int i=0;i<a.length;i++){ if(i>0) sb.append(","); sb.append("\\""+escapeJson(a[i])+"\\""); }
    sb.append("]"); return sb.toString();
  }
  static String toJson(Object o){
    if(o==null) return "null";
    if(o instanceof Integer || o instanceof Long || o instanceof Double || o instanceof Boolean) return String.valueOf(o);
    if(o instanceof String) return "\\"" + escapeJson((String)o) + "\\"";
    if(o instanceof int[]) return arrIntToJson((int[])o);
    if(o instanceof int[][]) return arrArrIntToJson((int[][])o);
    if(o instanceof String[]) return strArrToJson((String[])o);
    return "\\"" + escapeJson(String.valueOf(o)) + "\\"";
  }
  public static void main(String[] args){
    StringBuilder results=new StringBuilder(); results.append("[");
    boolean allPassed=true, first=true;
${callLines}
    results.append("]");
    System.out.println("{\\"results\\":"+results.toString()+",\\"allPassed\\":"+allPassed+"}");
  }
}
`;
  await fs.promises.writeFile(runPath, runnerSrc, "utf8");

  // compile & run
  await new Promise((res, rej) => {
    const p = spawn("javac", ["Solution.java", "Runner.java"], { cwd: dir });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(err || "javac failed"))));
  });

  const out = await new Promise((res, rej) => {
    const p = spawn("java", ["Runner"], { cwd: dir });
    let o = "",
      e = "";
    p.stdout.on("data", (d) => (o += d.toString()));
    p.stderr.on("data", (d) => (e += d.toString()));
    p.on("close", (c) => (c === 0 ? res(o) : rej(new Error(e || "java failed"))));
  });

  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
  return JSON.parse(out.trim());
}

async function runJavaScript(functionName, userCode, testCases) {
  const { VM } = require("vm2");
  const vm = new VM({ timeout: 3000, sandbox: {} });

  const results = [];
  let allPassed = true;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const argsStr = (tc.args || []).map((a) => JSON.stringify(a)).join(", ");
      const fullCode = `
        ${userCode};
        (function() {
          return ${functionName}(${argsStr});
        })();
      `;
      const output = vm.run(fullCode);
      const passed = JSON.stringify(output) === JSON.stringify(tc.expected);
      if (!passed) allPassed = false;
      results.push({
        case: i + 1,
        args: tc.args,
        expected: tc.expected,
        output,
        passed,
        error: null,
        description: tc.description || "",
      });
    } catch (err) {
      allPassed = false;
      results.push({
        case: i + 1,
        args: tc.args,
        expected: tc.expected,
        output: null,
        passed: false,
        error: err.message,
        description: tc.description || "",
      });
    }
  }

  return { results, allPassed };
}

async function runC(functionName, userCode, testCases, isCpp = false) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), isCpp ? "learncpp-" : "learnc-"));
  const ext = isCpp ? ".cpp" : ".c";
  const codePath = path.join(dir, `solution${ext}`);
  const outPath = path.join(dir, process.platform === "win32" ? "solution.exe" : "solution");

  const testCode = testCases.map((tc, idx) => {
    const argsStr = (tc.args || []).map((a) => {
      if (typeof a === "string") return `"${a.replace(/"/g, '\\"')}"`;
      if (Array.isArray(a)) return `{${a.join(", ")}}`;
      return String(a);
    }).join(", ");
    return `
    {
      int passed = 0;
      // Test case ${idx + 1}
      printf("{\\"case\\": %d, ", ${idx + 1});
      // Run test (simplified - assumes numeric return)
      auto result = ${functionName}(${argsStr});
      auto expected = ${JSON.stringify(tc.expected)};
      passed = (result == expected) ? 1 : 0;
      if (!passed) allPassed = 0;
      printf("\\"passed\\": %s, \\"description\\": \\"%s\\"},", passed ? "true" : "false", "${(tc.description || "").replace(/"/g, '\\"')}");
    }`;
  }).join("\n");

  const fullCode = isCpp ? `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

${userCode}

int main() {
  int allPassed = 1;
  printf("{\\"results\\": [");
  ${testCode}
  printf("], \\"allPassed\\": %s}", allPassed ? "true" : "false");
  return 0;
}
` : `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${userCode}

int main() {
  int allPassed = 1;
  printf("{\\"results\\": [");
  ${testCode}
  printf("], \\"allPassed\\": %s}", allPassed ? "true" : "false");
  return 0;
}
`;

  try {
    await fs.promises.writeFile(codePath, fullCode, "utf8");

    const compiler = isCpp ? "g++" : "gcc";
    
    await new Promise((res, rej) => {
      const p = spawn(compiler, [codePath, "-o", outPath], { cwd: dir });
      let err = "";
      p.stderr.on("data", (d) => (err += d.toString()));
      p.on("close", (c) => (c === 0 ? res() : rej(new Error(err || `${compiler} compilation failed`))));
    });

    const out = await new Promise((res, rej) => {
      const p = spawn(outPath, [], { cwd: dir });
      let o = "", e = "";
      p.stdout.on("data", (d) => (o += d.toString()));
      p.stderr.on("data", (d) => (e += d.toString()));
      p.on("close", (c) => (c === 0 ? res(o) : rej(new Error(e || "execution failed"))));
    });

    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}

    return JSON.parse(out.trim().replace(/,\s*\]/, "]"));
  } catch (error) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// POST /ai/generate-challenge
// ─────────────────────────────────────────────────────────────
router.post("/generate-challenge", async (req, res) => {
  try {
    const { topic, difficulty, excludeIds = [], language = "python" } = req.body || {};
    const lang = normalizeLanguage(language);

    console.log(`[generate-challenge] Topic: ${topic}, Difficulty: ${difficulty}, Language: ${lang}`);

    // DEV fallback: if no API key, return a local challenge so frontend doesn't 500
    if (!openai) {
      console.log("[generate-challenge] Using local fallback (no API key configured)");
      const local = pickRandomChallenge({ 
        topic: topic || undefined, 
        difficulty: difficulty || undefined,
        excludeIds: excludeIds || [],
        language: lang
      });
      
      if (!local) {
        // If no local challenge matches, try without difficulty filter
        console.log("[generate-challenge] No exact match, trying without difficulty filter");
        const anyLocal = pickRandomChallenge({ 
          topic: topic || undefined,
          excludeIds: excludeIds || [],
          language: lang
        });
        
        if (!anyLocal) {
          return res.status(404).json({
            success: false,
            message: "No local challenges available. Please configure GROQ_API_KEY_LEARNING to generate AI challenges.",
          });
        }
        
        // Use the challenge but mark it with requested difficulty
        const challenge = {
          id: anyLocal.id || makeIdFromTitle(anyLocal.title || "local-challenge"),
          title: anyLocal.title,
          prompt: anyLocal.prompt || anyLocal.title,
          functionName: anyLocal.functionName || "solution",
          signature: anyLocal.signature || "",
          starterCode: anyLocal.starterCode || "",
          solution: anyLocal.solution || "",
          testCases: (anyLocal.cases || []).map((c) => ({ 
            args: c.args || [], 
            expected: c.expected, 
            description: c.description || "" 
          })),
          topic: anyLocal.topic || (topic || "General"),
          difficulty: difficulty || anyLocal.difficulty || "easy", // Use requested difficulty
          language: lang,
        };
        console.log("[generate-challenge] Returning challenge with adjusted difficulty:", challenge.title);
        return res.json({ success: true, challenge });
      }
      
      // Map the local challenge to the expected shape
      const challenge = {
        id: local.id || makeIdFromTitle(local.title || "local-challenge"),
        title: local.title,
        prompt: local.prompt || local.title,
        functionName: local.functionName || "solution",
        signature: local.signature || "",
        starterCode: local.starterCode || "",
        solution: local.solution || "",
        testCases: (local.cases || []).map((c) => ({ 
          args: c.args || [], 
          expected: c.expected, 
          description: c.description || "" 
        })),
        topic: local.topic || (topic || "General"),
        difficulty: local.difficulty || (difficulty || "easy"),
        language: lang,
      };
      return res.json({ success: true, challenge });
    }

    // Build system/user prompt for OpenAI/Groq
    const hints = {
      python: "Use Python 3. Provide a function definition only (no input()).",
      java: "Use Java 17. Provide public class Solution with a static method; no Scanner/System.in.",
      javascript: "Use modern JavaScript (ES6+). Provide a function declaration only (no console.log or require).",
      cpp: "Use C++17. Provide a function definition only (no main() or cin/cout). Include necessary headers in solution.",
      c: "Use C99. Provide a function definition only (no main() or scanf/printf). Include necessary headers in solution.",
    };

    const blacklist = Array.isArray(excludeIds) && excludeIds.length
      ? `Avoid repeating any challenge with these ids: ${excludeIds.join(", ")}.`
      : "Do not repeat recent challenges from this session.";

    const prompt = `Generate ONE ${lang.toUpperCase()} coding challenge as STRICT JSON:
{
  "title": "Challenge title",
  "prompt": "Clear description with a tiny example",
  "language": "${lang}",
  "functionName": "functionNameOnly",
  "signature": "language-appropriate function signature only",
  "starterCode": "starter code only",
  "solution": "full correct reference solution in ${lang}",
  "testCases": [
    {"args": [inputs...], "expected": output, "description": "short case desc"}
  ]
}
Rules:
- Topic: ${topic || "General Programming"}
- Difficulty: ${difficulty || "easy"}
- Provide 4–6 testCases incl. an edge case.
- ${hints[lang]}
- The solution must pass all testCases.
- ${blacklist}
- IMPORTANT: Return ONLY minified JSON (no prose, no markdown, no fences).`;

    console.log("[generate-challenge] Calling AI API...");

    // Call OpenAI/Groq Chat API with error handling
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: "Return a valid, minified JSON object and nothing else." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
    } catch (apiError) {
      console.error("[generate-challenge] API call failed:", apiError.message);
      // Fallback to local challenge on API error
      console.log("[generate-challenge] Attempting local fallback after API failure");
      
      let local = pickRandomChallenge({ 
        topic: topic || undefined, 
        difficulty: difficulty || undefined,
        excludeIds: excludeIds || [],
        language: lang
      });
      
      // If no exact match, try without difficulty
      if (!local) {
        console.log("[generate-challenge] No exact difficulty match, trying without difficulty filter");
        local = pickRandomChallenge({ 
          topic: topic || undefined,
          excludeIds: excludeIds || [],
          language: lang
        });
      }
      
      if (!local) {
        return res.status(500).json({
          success: false,
          message: "AI API failed and no local challenges available.",
          error: apiError.message
        });
      }
      
      const challenge = {
        id: local.id || makeIdFromTitle(local.title || "local-challenge"),
        title: local.title,
        prompt: local.prompt || local.title,
        functionName: local.functionName || "solution",
        signature: local.signature || "",
        starterCode: local.starterCode || "",
        solution: local.solution || "",
        testCases: (local.cases || []).map((c) => ({ 
          args: c.args || [], 
          expected: c.expected, 
          description: c.description || "" 
        })),
        topic: local.topic || (topic || "General"),
        difficulty: difficulty || local.difficulty || "easy", // Prefer requested difficulty
        language: lang,
      };
      console.log("[generate-challenge] Returning fallback challenge:", challenge.title);
      return res.json({ success: true, challenge });
    }

    const content = completion?.choices?.[0]?.message?.content || "";
    console.log("[generate-challenge] AI response received, parsing...");
    
    const challenge =
      extractFirstJsonBalanced(content) ||
      (() => {
        try {
          return JSON.parse(content.replace(/```json\s*|\s*```/g, "").trim());
        } catch {
          return null;
        }
      })();

    if (
      !challenge ||
      !challenge.title ||
      !challenge.functionName ||
      !challenge.signature ||
      !challenge.starterCode ||
      !challenge.solution ||
      !Array.isArray(challenge.testCases)
    ) {
      console.error("[generate-challenge] Invalid JSON from model:", content);
      
        // Fallback to local challenge
        const local = pickRandomChallenge({ 
          topic: topic || undefined, 
          difficulty: difficulty || undefined,
          excludeIds: excludeIds || [],
          language: lang
        });
      
      if (!local) {
        return res.status(500).json({ 
          success: false, 
          message: "Model returned invalid JSON and no local challenges available." 
        });
      }
      
      const fallbackChallenge = {
        id: local.id || makeIdFromTitle(local.title || "local-challenge"),
        title: local.title,
        prompt: local.prompt || local.title,
        functionName: local.functionName || "solution",
        signature: local.signature || "",
        starterCode: local.starterCode || "",
        solution: local.solution || "",
        testCases: (local.cases || []).map((c) => ({ 
          args: c.args || [], 
          expected: c.expected, 
          description: c.description || "" 
        })),
        topic: local.topic || (topic || "General"),
        difficulty: local.difficulty || (difficulty || "easy"),
        language: lang,
      };
      return res.json({ success: true, challenge: fallbackChallenge });
    }

    challenge.id = makeIdFromTitle(challenge.title);
    challenge.topic = topic || "General";
    challenge.difficulty = difficulty || "easy";
    challenge.language = lang;

    // Normalize testCases to the expected shape
    challenge.testCases = challenge.testCases.map((tc) => ({
      args: Array.isArray(tc.args) ? tc.args : [tc.args],
      expected: tc.expected,
      description: tc.description || "",
    }));

    console.log("[generate-challenge] Success:", challenge.title);
    res.json({ success: true, challenge });
  } catch (err) {
    console.error("❌ /ai/generate-challenge:", err);
    
    // Last resort: try to return a local challenge
    try {
      const { topic, difficulty, excludeIds = [], language = "python" } = req.body || {};
      const lang = normalizeLanguage(language);
      const local = pickRandomChallenge({ 
        topic: topic || undefined, 
        difficulty: difficulty || undefined,
        excludeIds: excludeIds || [],
        language: lang
      });
      
      if (local) {
        const challenge = {
          id: local.id || makeIdFromTitle(local.title || "local-challenge"),
          title: local.title,
          prompt: local.prompt || local.title,
          functionName: local.functionName || "solution",
          signature: local.signature || "",
          starterCode: local.starterCode || "",
          solution: local.solution || "",
          testCases: (local.cases || []).map((c) => ({ 
            args: c.args || [], 
            expected: c.expected, 
            description: c.description || "" 
          })),
          topic: local.topic || (topic || "General"),
          difficulty: local.difficulty || (difficulty || "easy"),
          language: lang,
        };
        return res.json({ success: true, challenge });
      }
    } catch {}
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate challenge", 
      error: err.message 
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /ai/run-tests
// ─────────────────────────────────────────────────────────────
router.post("/run-tests", async (req, res) => {
  try {
    const { language, functionName, code, testCases } = req.body || {};
    const lang = normalizeLanguage(language);

    console.log(`[run-tests] Language: ${lang}, Function: ${functionName}, Test cases: ${testCases?.length}`);

    if (!code || !functionName || !Array.isArray(testCases)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: { language, functionName, code, testCases[] }",
      });
    }

    if (lang === "python") {
      try {
        const result = await runPython(functionName, code, testCases);
        console.log(`[run-tests] Success - Passed: ${result.allPassed}`);
        return res.json({ success: true, ...result });
      } catch (pythonError) {
        console.error("[run-tests] Python execution error:", pythonError.message);
        return res.status(500).json({ 
          success: false, 
          message: `Python execution failed: ${pythonError.message}`,
          error: pythonError.message,
          results: [],
          allPassed: false
        });
      }
    }

    if (lang === "java") {
      try {
        const result = await runJava(functionName, code, testCases);
        console.log(`[run-tests] Success - Passed: ${result.allPassed}`);
        return res.json({ success: true, ...result });
      } catch (javaError) {
        console.error("[run-tests] Java execution error:", javaError.message);
        return res.status(500).json({ 
          success: false, 
          message: `Java execution failed: ${javaError.message}`,
          error: javaError.message,
          results: [],
          allPassed: false
        });
      }
    }

    if (lang === "javascript") {
      try {
        const result = await runJavaScript(functionName, code, testCases);
        console.log(`[run-tests] Success - Passed: ${result.allPassed}`);
        return res.json({ success: true, ...result });
      } catch (jsError) {
        console.error("[run-tests] JavaScript execution error:", jsError.message);
        return res.status(500).json({ 
          success: false, 
          message: `JavaScript execution failed: ${jsError.message}`,
          error: jsError.message,
          results: [],
          allPassed: false
        });
      }
    }

    if (lang === "cpp") {
      try {
        const result = await runC(functionName, code, testCases, true);
        console.log(`[run-tests] Success - Passed: ${result.allPassed}`);
        return res.json({ success: true, ...result });
      } catch (cppError) {
        console.error("[run-tests] C++ execution error:", cppError.message);
        return res.status(500).json({ 
          success: false, 
          message: `C++ execution failed: ${cppError.message}`,
          error: cppError.message,
          results: [],
          allPassed: false
        });
      }
    }

    if (lang === "c") {
      try {
        const result = await runC(functionName, code, testCases, false);
        console.log(`[run-tests] Success - Passed: ${result.allPassed}`);
        return res.json({ success: true, ...result });
      } catch (cError) {
        console.error("[run-tests] C execution error:", cError.message);
        return res.status(500).json({ 
          success: false, 
          message: `C execution failed: ${cError.message}`,
          error: cError.message,
          results: [],
          allPassed: false
        });
      }
    }

    return res.status(400).json({ 
      success: false, 
      message: `Unsupported language: ${lang}. Supported languages: python, java, javascript, c, cpp.` 
    });
  } catch (err) {
    console.error("❌ /ai/run-tests unexpected error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error while running tests", 
      error: err.message,
      results: [],
      allPassed: false
    });
  }
});

module.exports = router;