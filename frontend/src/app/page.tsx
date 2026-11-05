"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  Bot,
  User,
  Mic,
  Video,
  Activity,
  CheckCircle2,
  XCircle,
  Layers,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  BarChart3,
  Zap,
  Play,
  Volume2,
} from "lucide-react";

export default function LandingPage() {
  const { isSignedIn, user } = useUser();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  const navLinks = [
    { label: "01 PIPELINE", href: "#pipeline" },
    { label: "02 3-LEVEL ENGINE", href: "#engine" },
    { label: "03 FIT MATRIX", href: "#fit-matrix" },
    { label: "04 TELEMETRY", href: "#telemetry" },
    { label: "05 FAQ", href: "#faq" },
  ];

  const faqs = [
    {
      q: "How does the 3-Level Adaptive Engine differ from standard AI interviewers?",
      a: "Generic mock interview bots read static scripted questions from a fixed bank. Our engine ingests your specific resume alongside the target Job Description, cross-references claims, and dynamically calibrates the conversation across 3 levels: Screening (project verification), Competency (technical tradeoffs), and Deep-Dive (stress-testing vague claims or failure modes).",
    },
    {
      q: "What file formats does the document ingestion pipeline accept?",
      a: "Our FastAPI ingestion engine parses PDF, DOCX (Microsoft Word), and raw plain text files in-memory using pypdf and python-docx, extracting technical competencies, ATS keywords, and quantified metrics without uploading to external storage buckets.",
    },
    {
      q: "How does the Speech Delivery Telemetry calculate my score?",
      a: "As you speak or record audio responses, our real-time metrics service computes exact Words Per Minute (WPM) velocity and assesses conversational pacing against top engineering benchmarks (110–165 WPM optimal). It simultaneously catalogs verbal filler words ('um', 'uh', 'like', 'basically') to help you refine vocal confidence.",
    },
    {
      q: "Do I need to install any software or configure external API keys?",
      a: "No installation is required. Everything runs directly in modern desktop browsers (Chrome, Edge, Firefox, Safari) using HTML5 Web Audio and WebRTC camera preview. Authentication is handled seamlessly via Clerk, and all session analytics persist securely in our Neon PostgreSQL database.",
    },
    {
      q: "Can I export my evaluation report after concluding an interview?",
      a: "Yes. Once all 3 levels (6 turns) are completed, the system synthesizes an executive audit report featuring an overall 0-100 score, a 7-competency radar breakdown, question-level critiques with ideal senior model answers, and a prioritized revision roadmap. You can print or export the entire report as a clean PDF at any time.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono selection:bg-[#ffdb1f] selection:text-black">
      {/* ========================================================================= */}
      {/* 1. BRUTALIST STICKY TOP NAVIGATION                                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-[#f5f0e7] border-b-3 border-black">
        <div className="max-w-7xl mx-auto flex items-stretch justify-between min-h-[64px] px-4 sm:px-6">
          {/* Brand block */}
          <Link
            href="/"
            className="flex items-center gap-3 py-3 select-none shrink-0 group"
          >
            <div className="w-9 h-9 bg-[#ffdb1f] text-black border-2 border-black flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_#000] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-archivo font-black text-lg sm:text-xl tracking-tight uppercase leading-none text-black">
                INTERVIEW ACCELERATOR
              </span>
              <span className="text-[10px] font-mono text-[#555] font-bold tracking-widest uppercase">
                AI ADAPTIVE &bull; v1.0
              </span>
            </div>
          </Link>

          {/* Center jump links (desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-[#333]">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="hover:text-black hover:bg-[#ffdb1f] px-2.5 py-1 border border-transparent hover:border-black transition-all"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Auth / Action buttons */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/setup"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 border-2 border-black bg-[#ffdb1f] text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-[#ffe647] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  LAUNCH CONSOLE &rarr;
                </Link>
                <div className="flex items-center gap-2 p-1 border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
                  <UserButton />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="px-3 sm:px-4 py-2 border-2 border-black bg-white text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-[#ffdb1f] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    SIGN IN
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="px-3 sm:px-4 py-2 border-2 border-black bg-[#ffdb1f] text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-[#ffe647] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1"
                  >
                    START FREE ↗
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full">
        {/* ========================================================================= */}
        {/* 2. HERO SECTION                                                          */}
        {/* ========================================================================= */}
        <section className="border-b-3 border-black py-12 sm:py-20 px-4 sm:px-6 lg:px-10 bg-[#f5f0e7] relative overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-white shadow-[3px_3px_0px_#000]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] animate-pulse" />
              <span className="text-xs font-mono font-black uppercase tracking-wider text-black">
                AUTONOMOUS ADAPTIVE INTERVIEW PIPELINE // LIVE ENGINE
              </span>
            </div>

            {/* Main Headline & Subtitle */}
            <div className="space-y-5 max-w-5xl">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-archivo uppercase text-black tracking-tight leading-[1.08]">
                CRACK TECHNICAL INTERVIEWS WITH REAL-TIME ADAPTIVE AI SIMULATION
              </h1>
              <p className="text-sm sm:text-base text-[#374151] max-w-3xl leading-relaxed font-medium">
                Don&apos;t practice on static question lists. Our multi-modal engine ingests your specific Job Description and Candidate Resume, extracts core competencies, probes unverified claims, and conducts an adaptive 3-level voice &amp; video interview with real-time delivery telemetry.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/setup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-3 border-black bg-[#ffdb1f] text-black font-black text-sm uppercase shadow-[5px_5px_0px_#000] hover:bg-[#ffe647] hover:shadow-[3px_3px_0px_#000] active:translate-x-1 active:translate-y-1 transition-all"
              >
                INITIALIZE INTERVIEW SIMULATOR
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              {!isSignedIn ? (
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 border-3 border-black bg-white text-black font-black text-sm uppercase shadow-[5px_5px_0px_#000] hover:bg-[#a8d8ff] active:translate-x-1 active:translate-y-1 transition-all cursor-pointer"
                  >
                    SIGN UP WITH CLERK
                    <Sparkles className="w-4 h-4 ml-1" />
                  </button>
                </SignUpButton>
              ) : (
                <Link
                  href="/setup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 border-3 border-black bg-[#b9f4a8] text-black font-black text-sm uppercase shadow-[5px_5px_0px_#000] hover:bg-[#a8e895] active:translate-x-1 active:translate-y-1 transition-all"
                >
                  RESUME / NEW SESSION
                </Link>
              )}
            </div>

            {/* Key Value Badges */}
            <div className="flex items-center gap-4 text-xs font-mono text-[#555] flex-wrap pt-2">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#15803d]" /> Zero Scripted Questions
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#15803d]" /> 3-Level Progressive Escalation
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#15803d]" /> Real-Time WPM &amp; Filler Analysis
              </span>
            </div>

            {/* ===================================================================== */}
            {/* HERO INTERACTIVE CONSOLE PREVIEW MOCKUP                               */}
            {/* ===================================================================== */}
            <div className="pt-6">
              <div className="border-4 border-black bg-white shadow-[8px_8px_0px_#000] p-4 sm:p-6 space-y-6">
                {/* Mock Header Bar */}
                <div className="flex items-center justify-between border-b-2 border-black pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black bg-[#ff4b3e]" />
                    <span className="w-3.5 h-3.5 border-2 border-black bg-[#ffdb1f]" />
                    <span className="w-3.5 h-3.5 border-2 border-black bg-[#b9f4a8]" />
                    <span className="ml-2 font-mono text-xs font-black uppercase text-black">
                      SIMULATOR_STAGE // TURN 3 OF 6 (LEVEL 2: COMPETENCY)
                    </span>
                  </div>
                  <Badge variant="purple">LIVE VOICE &amp; VISION STREAM</Badge>
                </div>

                {/* Split Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: AI Persona (7 cols) */}
                  <div className="lg:col-span-7 border-3 border-black bg-[#faf8f5] p-5 space-y-4 shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 border-2 border-black bg-[#7c3aed] text-white flex items-center justify-center font-black shadow-[2px_2px_0px_#000]">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-archivo text-xs uppercase font-black text-black block">
                            AI Executive Interviewer
                          </span>
                          <span className="text-[10px] text-[#555] font-mono">
                            FastAPI Voice Engine &bull; Adaptive Gemini
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 border border-black bg-[#ffdb1f] text-black text-[10px] font-black uppercase flex items-center gap-1.5 animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        AI SPEAKING...
                      </span>
                    </div>

                    {/* Waveform graphic */}
                    <div className="h-16 border-2 border-black bg-white p-3 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000]">
                      {[30, 75, 45, 90, 60, 20, 85, 40, 100, 50, 70, 80, 35, 65, 55].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-black transition-all"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>

                    {/* Question text */}
                    <div className="p-3.5 border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
                      <span className="text-[10px] uppercase font-black text-[#b45309] block mb-1">
                        PROMPT // TURN 3 (TECHNICAL COMPETENCY)
                      </span>
                      <p className="font-archivo text-xs sm:text-sm font-bold uppercase text-black leading-snug">
                        &quot;ON YOUR RESUME YOU CLAIM A 4X THROUGHPUT GAIN USING FASTAPI &amp; REDIS. WHAT CONCURRENCY BOTTLENECKS DID YOU PROFILE, AND HOW DID YOU PREVENT CACHE STAMPEDES UNDER HIGH LOAD?&quot;
                      </p>
                    </div>
                  </div>

                  {/* Right: Candidate View & Telemetry (5 cols) */}
                  <div className="lg:col-span-5 border-3 border-black bg-[#faf8f5] p-5 space-y-4 shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 border-2 border-black bg-[#ffdb1f] text-black flex items-center justify-center font-black shadow-[2px_2px_0px_#000]">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-archivo text-xs uppercase font-black text-black">
                          Candidate Feed &amp; Telemetry
                        </span>
                      </div>
                      <span className="px-2 py-0.5 border border-black bg-[#feebe9] text-[#dc2626] text-[10px] font-black uppercase flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping" />
                        REC ACTIVE
                      </span>
                    </div>

                    {/* Telemetry Metric Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
                        <span className="text-[10px] text-[#555] font-bold uppercase block">
                          Speaking Pace
                        </span>
                        <div className="text-xl font-black font-archivo text-black mt-0.5">
                          142 <span className="text-xs font-normal text-[#666]">WPM</span>
                        </div>
                        <span className="text-[10px] text-[#15803d] font-bold block mt-1">
                          ✓ Optimal Velocity
                        </span>
                      </div>

                      <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
                        <span className="text-[10px] text-[#555] font-bold uppercase block">
                          Filler Words
                        </span>
                        <div className="text-xl font-black font-archivo text-black mt-0.5">
                          0 <span className="text-xs font-normal text-[#666]">USED</span>
                        </div>
                        <span className="text-[10px] text-[#15803d] font-bold block mt-1">
                          ✓ Concise Delivery
                        </span>
                      </div>
                    </div>

                    {/* Candidate Fit Bar */}
                    <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="uppercase text-black">Target Role Fit</span>
                        <span className="font-archivo text-sm text-[#15803d]">84% MATCH</span>
                      </div>
                      <div className="w-full h-3 border border-black bg-[#e8e3d8] p-0.5">
                        <div className="h-full bg-[#15803d] border-r-2 border-black w-[84%]" />
                      </div>
                      <span className="text-[10px] text-[#555] block">
                        ATS Keywords matched: Python, FastAPI, PostgreSQL, Docker
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. HIGH-CONTRAST MARQUEE TICKER                                          */}
        {/* ========================================================================= */}
        <div className="bg-[#ffdb1f] text-black border-b-3 border-black py-3 overflow-hidden select-none">
          <div className="flex items-center gap-8 whitespace-nowrap text-xs font-archivo font-black uppercase tracking-wider animate-none sm:animate-marquee">
            <span>★ MULTI-MODAL DOCUMENT INGESTION</span>
            <span>&bull;</span>
            <span>3-LEVEL ADAPTIVE ESCALATION</span>
            <span>&bull;</span>
            <span>REAL-TIME WPM SPEECH TELEMETRY</span>
            <span>&bull;</span>
            <span>RESUME CLAIM STRESS-TESTING</span>
            <span>&bull;</span>
            <span>EDGE-TTS VOICE SYNTHESIS</span>
            <span>&bull;</span>
            <span>NEON POSTGRESQL &amp; CLERK AUTH</span>
            <span>&bull;</span>
            <span>7-COMPETENCY POST-INTERVIEW RADAR</span>
            <span>&bull;</span>
            <span>PRIORITIZED ACTIONABLE CHECKLIST</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. THE PROBLEM VS. OUR SOLUTION                                          */}
        {/* ========================================================================= */}
        <section id="pipeline" className="border-b-3 border-black py-16 px-4 sm:px-6 lg:px-10 bg-white">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 border-2 border-black bg-[#a8d8ff] text-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000]">
                EVALUATION PARADIGM
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-archivo uppercase text-black tracking-tight">
                Why Generic Mock Interview Tools Fail Candidates
              </h2>
              <p className="text-xs sm:text-sm text-[#4b5563] max-w-3xl leading-relaxed font-mono">
                Static leetcode prompts and scripted ChatGPT interview bots do not prepare you for real senior hiring panels. Here is how our architecture fixes the preparation loop:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* The Old Way */}
              <div className="p-6 border-3 border-black bg-[#feebe9] shadow-[6px_6px_0px_#000] space-y-5">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-[#dc2626]" />
                    <span className="font-archivo text-base uppercase font-black text-black">
                      Generic Mock Tools &amp; Scripts
                    </span>
                  </div>
                  <Badge variant="weakMatch">INEFFECTIVE</Badge>
                </div>

                <ul className="space-y-3 text-xs font-mono text-[#333]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#dc2626] font-black shrink-0">&times;</span>
                    <span><strong>Static Question Lists:</strong> Asks generic textbook questions without reading your actual work history.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#dc2626] font-black shrink-0">&times;</span>
                    <span><strong>Zero Resume Probing:</strong> Ignores ambitious metrics or vague claims that real senior interviewers challenge.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#dc2626] font-black shrink-0">&times;</span>
                    <span><strong>No Delivery Telemetry:</strong> Cannot detect whether you speak at 80 WPM (hesitant) or 220 WPM (rushing), or track filler words.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#dc2626] font-black shrink-0">&times;</span>
                    <span><strong>Vague Scoring:</strong> Outputs unhelpful generic praise like &quot;good job&quot; instead of actionable model senior answers.</span>
                  </li>
                </ul>
              </div>

              {/* The Accelerator Way */}
              <div className="p-6 border-3 border-black bg-[#eef8eb] shadow-[6px_6px_0px_#000] space-y-5">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#15803d]" />
                    <span className="font-archivo text-base uppercase font-black text-black">
                      The Interview Accelerator Pipeline
                    </span>
                  </div>
                  <Badge variant="strongMatch">ADAPTIVE</Badge>
                </div>

                <ul className="space-y-3 text-xs font-mono text-[#101010]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#15803d] font-black shrink-0">✓</span>
                    <span><strong>Multi-Modal Ingestion:</strong> Parses PDF, DOCX, and text in-memory to synthesize role expectations vs. candidate capability.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#15803d] font-black shrink-0">✓</span>
                    <span><strong>Targeted Claim Verification:</strong> Flags bold resume assertions and explicitly crafts Level 3 stress-tests around them.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#15803d] font-black shrink-0">✓</span>
                    <span><strong>Real-Time Delivery Metrics:</strong> Analyzes speech pacing (WPM) and catalogs verbal filler words on every conversational turn.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#15803d] font-black shrink-0">✓</span>
                    <span><strong>Post-Interview Actionable Audit:</strong> 7-competency radar score, specific critique, and prioritized revision topics.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. 3-LEVEL ADAPTIVE ENGINE BREAKDOWN                                     */}
        {/* ========================================================================= */}
        <section id="engine" className="border-b-3 border-black py-16 px-4 sm:px-6 lg:px-10 bg-[#f5f0e7]">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 border-2 border-black bg-[#ffdb1f] text-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000]">
                CONVERSATION CALIBRATION
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-archivo uppercase text-black tracking-tight">
                The 3-Level Adaptive Escalation Protocol
              </h2>
              <p className="text-xs sm:text-sm text-[#4b5563] max-w-3xl leading-relaxed font-mono">
                Just like a rigorous technical bar raiser loop, the simulator advances through three progressive stages to evaluate breadth, technical depth, and resilience under pressure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Level 1 Card */}
              <div className="border-3 border-black bg-white p-6 shadow-[5px_5px_0px_#000] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 border-2 border-black bg-[#ffdb1f] text-black font-black text-xs shadow-[2px_2px_0px_#000]">
                      LEVEL 1
                    </span>
                    <span className="text-[10px] font-mono text-[#555]">TURNS 1 &ndash; 2</span>
                  </div>
                  <h3 className="font-archivo text-lg font-black uppercase text-black">
                    Foundational Screening
                  </h3>
                  <p className="text-xs text-[#4b5563] leading-relaxed">
                    Evaluates career motivation, high-level project walkthroughs, core role alignment, and verifies that the candidate actually performed the work listed on their resume.
                  </p>
                </div>

                <div className="p-3 border-2 border-black bg-[#faf8f5] text-[11px] font-mono text-[#222]">
                  <strong>Focus:</strong> Project verification, personal contributions, core stack fundamentals.
                </div>
              </div>

              {/* Level 2 Card */}
              <div className="border-3 border-black bg-white p-6 shadow-[5px_5px_0px_#000] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 border-2 border-black bg-[#a8d8ff] text-black font-black text-xs shadow-[2px_2px_0px_#000]">
                      LEVEL 2
                    </span>
                    <span className="text-[10px] font-mono text-[#555]">TURNS 3 &ndash; 4</span>
                  </div>
                  <h3 className="font-archivo text-lg font-black uppercase text-black">
                    Competency Depth
                  </h3>
                  <p className="text-xs text-[#4b5563] leading-relaxed">
                    Drills into architectural tradeoffs, engineering choices, database schemas, scaling bottlenecks, and technical rationale behind key decisions.
                  </p>
                </div>

                <div className="p-3 border-2 border-black bg-[#faf8f5] text-[11px] font-mono text-[#222]">
                  <strong>Focus:</strong> Trade-off analysis, concurrency, system design, error boundaries.
                </div>
              </div>

              {/* Level 3 Card */}
              <div className="border-3 border-black bg-white p-6 shadow-[5px_5px_0px_#000] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 border-2 border-black bg-[#ff4b3e] text-white font-black text-xs shadow-[2px_2px_0px_#000]">
                      LEVEL 3
                    </span>
                    <span className="text-[10px] font-mono text-[#555]">TURNS 5 &ndash; 6</span>
                  </div>
                  <h3 className="font-archivo text-lg font-black uppercase text-black">
                    Deep-Dive Stress Test
                  </h3>
                  <p className="text-xs text-[#4b5563] leading-relaxed">
                    Probes weak, ambiguous, or unquantified resume metrics. Introduces real-world failure scenarios, edge cases, and sudden requirement shifts to test composure.
                  </p>
                </div>

                <div className="p-3 border-2 border-black bg-[#faf8f5] text-[11px] font-mono text-[#222]">
                  <strong>Focus:</strong> High-impact claim auditing, resilience under scrutiny, edge cases.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. HOW IT WORKS 4-STEP PIPELINE                                          */}
        {/* ========================================================================= */}
        <section id="fit-matrix" className="border-b-3 border-black py-16 px-4 sm:px-6 lg:px-10 bg-white">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 border-2 border-black bg-[#b9f4a8] text-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000]">
                WORKFLOW PIPELINE
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-archivo uppercase text-black tracking-tight">
                How It Works: 4 Autonomous Stages
              </h2>
              <p className="text-xs sm:text-sm text-[#4b5563] max-w-3xl leading-relaxed font-mono">
                From initial document ingestion to executive gap remediation, the entire flow is automated and backed by Neon PostgreSQL:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="p-5 border-3 border-black bg-[#faf8f5] shadow-[4px_4px_0px_#000] space-y-3">
                <span className="w-8 h-8 border-2 border-black bg-[#ffdb1f] text-black font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_#000]">
                  01
                </span>
                <h4 className="font-archivo text-sm font-black uppercase text-black">
                  Ingestion &amp; Parsing
                </h4>
                <p className="text-xs text-[#555] leading-relaxed font-mono">
                  Drop your PDF, DOCX, or text files. The engine resolves competencies and extracts technical keywords.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 border-3 border-black bg-[#faf8f5] shadow-[4px_4px_0px_#000] space-y-3">
                <span className="w-8 h-8 border-2 border-black bg-[#a8d8ff] text-black font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_#000]">
                  02
                </span>
                <h4 className="font-archivo text-sm font-black uppercase text-black">
                  Fit Decomposition
                </h4>
                <p className="text-xs text-[#555] leading-relaxed font-mono">
                  Calculates a numerical 0-100 fit score, identifies strong vs. missing skills, and flags resume claims to probe.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 border-3 border-black bg-[#faf8f5] shadow-[4px_4px_0px_#000] space-y-3">
                <span className="w-8 h-8 border-2 border-black bg-[#ff72b6] text-black font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_#000]">
                  03
                </span>
                <h4 className="font-archivo text-sm font-black uppercase text-black">
                  Adaptive AI Interview
                </h4>
                <p className="text-xs text-[#555] leading-relaxed font-mono">
                  Step into the live room with Edge-TTS voice audio, candidate webcam preview, and real-time speech telemetry.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 border-3 border-black bg-[#faf8f5] shadow-[4px_4px_0px_#000] space-y-3">
                <span className="w-8 h-8 border-2 border-black bg-[#b9f4a8] text-black font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_#000]">
                  04
                </span>
                <h4 className="font-archivo text-sm font-black uppercase text-black">
                  Diagnostic Report
                </h4>
                <p className="text-xs text-[#555] leading-relaxed font-mono">
                  Synthesizes 7 competency metrics, question-by-question model answers, and a prioritized study roadmap.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. REAL-TIME TELEMETRY & SYSTEM CAPABILITIES                             */}
        {/* ========================================================================= */}
        <section id="telemetry" className="border-b-3 border-black py-16 px-4 sm:px-6 lg:px-10 bg-[#f5f0e7]">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 border-2 border-black bg-[#ffdb1f] text-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000]">
                TELEMETRY &amp; INFRASTRUCTURE
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-archivo uppercase text-black tracking-tight">
                Enterprise Multi-Modal Architecture
              </h2>
              <p className="text-xs sm:text-sm text-[#4b5563] max-w-3xl leading-relaxed font-mono">
                Engineered with production-grade reliability, asynchronous database pooling, and intelligent LLM failovers:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 border-3 border-black bg-white shadow-[4px_4px_0px_#000] space-y-2.5">
                <Volume2 className="w-6 h-6 text-black" />
                <h4 className="font-archivo text-sm font-black uppercase text-black">
                  Neural TTS Engine
                </h4>
                <p className="text-xs text-[#555] font-mono leading-relaxed">
                  Natural English conversational speech audio streaming using Microsoft Edge-TTS with instant replay controls.
                </p>
              </div>

              <div className="p-5 border-3 border-black bg-white shadow-[4px_4px_0px_#000] space-y-2.5">
                <Video className="w-6 h-6 text-black" />
                <h4 className="font-archivo text-sm font-black uppercase text-black">
                  WebRTC Video Preview
                </h4>
                <p className="text-xs text-[#555] font-mono leading-relaxed">
                  Real-time mirrored webcam feed with continuous DOM element retention and hardware fallback states.
                </p>
              </div>

              <div className="p-5 border-3 border-black bg-white shadow-[4px_4px_0px_#000] space-y-2.5">
                <Activity className="w-6 h-6 text-black" />
                <h4 className="font-archivo text-sm font-black uppercase text-black">
                  Pacing &amp; Fillers
                </h4>
                <p className="text-xs text-[#555] font-mono leading-relaxed">
                  Calculates Words Per Minute (WPM) speed alongside automated detection of verbal crutches (um, uh, basically).
                </p>
              </div>

              <div className="p-5 border-3 border-black bg-white shadow-[4px_4px_0px_#000] space-y-2.5">
                <ShieldCheck className="w-6 h-6 text-black" />
                <h4 className="font-archivo text-sm font-black uppercase text-black">
                  Clerk &amp; Neon DB
                </h4>
                <p className="text-xs text-[#555] font-mono leading-relaxed">
                  Clerk identity sync, server-side user table upserts, and PostgreSQL session history persistence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. FAQ ACCORDION                                                         */}
        {/* ========================================================================= */}
        <section id="faq" className="border-b-3 border-black py-16 px-4 sm:px-6 lg:px-10 bg-white">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="space-y-3 text-center sm:text-left">
              <span className="px-2.5 py-0.5 border-2 border-black bg-[#a8d8ff] text-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000]">
                KNOWLEDGE BASE
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-archivo uppercase text-black tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed font-mono">
                Everything you need to know about the evaluation pipeline, privacy, and adaptive AI logic.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border-3 border-black bg-[#faf8f5] shadow-[4px_4px_0px_#000] transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#fff9d9] transition-colors cursor-pointer gap-4"
                    >
                      <span className="font-archivo text-sm sm:text-base font-black uppercase text-black">
                        {faq.q}
                      </span>
                      <span className="shrink-0 p-1 border border-black bg-white text-black shadow-[1px_1px_0px_#000]">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="p-4 sm:p-5 border-t-2 border-black bg-white text-xs sm:text-sm font-mono text-[#333] leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. FINAL CALL TO ACTION                                                  */}
        {/* ========================================================================= */}
        <section className="py-20 px-4 sm:px-6 lg:px-10 bg-[#f5f0e7]">
          <div className="max-w-5xl mx-auto border-4 border-black bg-[#ffdb1f] p-8 sm:p-14 shadow-[10px_10px_0px_#000] text-center space-y-6">
            <span className="px-3 py-1 border-2 border-black bg-white text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] inline-block">
              GET READY FOR YOUR NEXT LOOP
            </span>
            <h2 className="text-2xl sm:text-5xl font-black font-archivo uppercase text-black tracking-tight leading-tight">
              ACCELERATE YOUR INTERVIEW PREPARATION TODAY
            </h2>
            <p className="text-xs sm:text-base font-mono text-[#101010] max-w-2xl mx-auto leading-relaxed font-semibold">
              Load your target job description and resume, step into the adaptive voice simulator, and discover your exact readiness score before meeting the hiring team.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/setup"
                className="w-full sm:w-auto px-8 py-4 border-3 border-black bg-black text-[#ffdb1f] font-black text-sm uppercase shadow-[4px_4px_0px_#fff] hover:bg-[#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                LAUNCH SIMULATOR NOW
                <ArrowRight className="w-4 h-4" />
              </Link>
              {!isSignedIn ? (
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-4 border-3 border-black bg-white text-black font-black text-sm uppercase shadow-[4px_4px_0px_#000] hover:bg-[#a8d8ff] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    CREATE FREE CLERK ACCOUNT
                  </button>
                </SignUpButton>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 10. BRUTALIST FOOTER                                                      */}
      {/* ========================================================================= */}
      <footer className="border-t-3 border-black bg-white py-10 px-4 sm:px-6 lg:px-10 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#ffdb1f] text-black border-2 border-black flex items-center justify-center font-black text-sm shadow-[1px_1px_0px_#000]">
              ⚡
            </div>
            <span className="font-archivo font-black uppercase text-sm text-black">
              INTERVIEW ACCELERATOR
            </span>
            <span className="text-[#888]">&bull;</span>
            <span className="text-[#555]">FastAPI + Next.js + Neon PostgreSQL</span>
          </div>

          <div className="flex items-center gap-6 text-[#555] font-bold">
            <Link href="/setup" className="hover:text-black hover:underline uppercase">
              Simulator Setup
            </Link>
            <a href="#pipeline" className="hover:text-black hover:underline uppercase">
              Pipeline
            </a>
            <a href="#faq" className="hover:text-black hover:underline uppercase">
              FAQ
            </a>
          </div>

          <span className="text-[#888] text-[11px]">
            &copy; 2026 Interview Accelerator. Open Source Neo-Brutalist Architecture.
          </span>
        </div>
      </footer>
    </div>
  );
}
