"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSessionAnalysis } from "@/lib/api";
import { AnalysisSession } from "@/types/interview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check,
  AlertTriangle,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  ShieldCheck,
  Briefcase,
  Cpu,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono flex items-center justify-center p-6">
      <div className="max-w-md w-full border-4 border-black bg-white p-8 shadow-[8px_8px_0px_#000000] text-center space-y-5">
        <div className="w-16 h-16 border-3 border-black bg-[#ffdb1f] text-black mx-auto flex items-center justify-center shadow-[4px_4px_0px_#000]">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h2 className="font-archivo text-xl font-black uppercase text-black tracking-tight">
            Loading Analysis Telemetry
          </h2>
          <p className="text-xs font-mono text-[#4b5563] mt-1.5 leading-relaxed">
            Retrieving role requirements, candidate skills matrix, and interview probes...
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleFitDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);

      try {
        const data = await getSessionAnalysis(sessionId);
        if (isMounted) {
          setSession(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load session analysis. Please verify the backend is running.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Loading State
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error State
  if (error || !session) {
    return (
      <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono flex items-center justify-center p-6">
        <div className="max-w-lg w-full border-4 border-black bg-white p-8 shadow-[8px_8px_0px_#000000] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-black bg-[#ff4b3e] text-white flex items-center justify-center shadow-[3px_3px_0px_#000] shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-archivo text-xl font-black uppercase text-black tracking-tight">
                Analysis Session Error
              </h2>
              <span className="text-[11px] font-mono text-[#ff4b3e] block">
                Session ID: {sessionId}
              </span>
            </div>
          </div>

          <div className="p-4 border-2 border-black bg-[#faf8f5] text-xs font-mono text-black leading-relaxed">
            {error || "Session data could not be retrieved."}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO INGESTION
            </Button>
            <Button
              variant="default"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              RETRY FETCH
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { role_analysis, candidate_profile, job_fit } = session;
  const score = job_fit?.fit_score ?? 0;

  // Determine fit color variant
  const getScoreTheme = () => {
    if (score >= 85) {
      return {
        variant: "green" as const,
        textColor: "text-[#00A36C]",
        badgeVariant: "strongMatch" as const,
        verdictLabel: "STRONG CANDIDATE // PROCEED TO SIMULATOR",
      };
    }
    if (score >= 60) {
      return {
        variant: "yellow" as const,
        textColor: "text-[#d97706]",
        badgeVariant: "partialMatch" as const,
        verdictLabel: "MODERATE FIT // PREP REQUIRED",
      };
    }
    return {
      variant: "gradient" as const,
      textColor: "text-[#dc2626]",
      badgeVariant: "weakMatch" as const,
      verdictLabel: "HIGH RISK // CRITICAL GAPS DETECTED",
    };
  };

  const scoreTheme = getScoreTheme();

  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & DIRECT SIMULATOR CTA                                     */}
        {/* ========================================================================= */}
        <header className="border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-black bg-white text-black hover:bg-[#ffdb1f] text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                New Ingestion
              </Link>
              <Badge variant="purple">ROLE &amp; FIT INTELLIGENCE</Badge>
              <Badge variant="outline">
                SESSION // {sessionId.substring(0, 8)}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-archivo tracking-tight uppercase text-black leading-tight">
              {role_analysis.role_title || "Target Role Analysis"}
            </h1>

            <div className="flex items-center gap-3 text-xs text-[#4b5563] flex-wrap">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-black" />
                <span className="text-black font-bold">Experience:</span>{" "}
                {role_analysis.experience_expectations || "Standard Industry Track"}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span className="text-black font-bold">Skills Ingested:</span>{" "}
                {candidate_profile.candidate_skills?.length || 0} candidate skills
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              variant="default"
              size="lg"
              onClick={() => router.push(`/interview/${sessionId}`)}
              className="w-full md:w-auto px-6 py-4 text-sm font-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] active:translate-x-1 active:translate-y-1"
            >
              ENTER INTERVIEW SIMULATOR
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. JOB FIT GAUGE & EXECUTIVE SUMMARY CARD                                */}
        {/* ========================================================================= */}
        <Card variant="elevated" className="bg-white overflow-hidden">
          <CardHeader className="border-b-2 border-black pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-black" />
                <CardTitle className="text-black">Role Alignment &amp; Job Fit Decomposition</CardTitle>
              </div>
              <Badge variant={scoreTheme.badgeVariant}>
                {scoreTheme.verdictLabel}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Score Display (4 cols) */}
              <div className="md:col-span-4 p-5 border-3 border-black bg-[#faf8f5] shadow-[4px_4px_0px_#000000] text-center space-y-2">
                <span className="text-[10px] font-mono uppercase font-black tracking-widest text-[#4b5563] block">
                  CANDIDATE FIT SCORE
                </span>
                <div
                  className={`text-5xl sm:text-6xl font-black font-archivo tracking-tight tabular-nums ${scoreTheme.textColor}`}
                >
                  {score}%
                </div>
                <div className="w-full pt-2">
                  <Progress value={score} variant={scoreTheme.variant} />
                </div>
                <span className="text-[10px] text-[#4b5563] font-mono block pt-1">
                  Benchmarked against {role_analysis.required_skills?.length || 0} core JD requirements
                </span>
              </div>

              {/* Executive Summary (8 cols) */}
              <div className="md:col-span-8 space-y-3">
                <span className="text-xs font-mono uppercase font-black text-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black" />
                  Executive Alignment Summary
                </span>
                <div className="p-4 border-2 border-black bg-[#faf8f5] text-xs font-mono text-[#101010] leading-relaxed shadow-[3px_3px_0px_#000]">
                  &quot;{job_fit.summary || "Candidate demonstrates alignment with target requirements. Specific technical areas and high-impact resume metrics should be targeted during the adaptive interview simulator."}&quot;
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 border-2 border-black bg-white text-center shadow-[2px_2px_0px_#000]">
                    <span className="text-[10px] text-[#4b5563] uppercase block">Strong Matches</span>
                    <span className="text-lg font-black text-[#00A36C] tabular-nums">
                      {job_fit.strong_matches?.length || 0}
                    </span>
                  </div>
                  <div className="p-2.5 border-2 border-black bg-white text-center shadow-[2px_2px_0px_#000]">
                    <span className="text-[10px] text-[#4b5563] uppercase block">Partial Matches</span>
                    <span className="text-lg font-black text-[#d97706] tabular-nums">
                      {job_fit.partial_matches?.length || 0}
                    </span>
                  </div>
                  <div className="p-2.5 border-2 border-black bg-white text-center shadow-[2px_2px_0px_#000]">
                    <span className="text-[10px] text-[#4b5563] uppercase block">Missing / Weak</span>
                    <span className="text-lg font-black text-[#dc2626] tabular-nums">
                      {job_fit.missing_or_weak?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 3. COMPARATIVE MATCH GRID                                                */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black font-archivo uppercase text-black tracking-tight">
              Comparative Competency Matrix
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Strong Matches */}
            <div className="p-5 border-3 border-black bg-white shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00A36C]" />
                    <span className="font-archivo text-xs uppercase font-black text-[#00A36C] tracking-wider">
                      Strong Matches
                    </span>
                  </div>
                  <Badge variant="strongMatch">
                    {job_fit.strong_matches?.length || 0}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job_fit.strong_matches && job_fit.strong_matches.length > 0 ? (
                    job_fit.strong_matches.map((item, idx) => (
                      <Badge key={idx} variant="strongMatch" className="text-[11px] py-1">
                        <Check className="w-3 h-3 mr-1" />
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-[#888]">No direct strong matches identified</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-[#4b5563] pt-2 border-t border-black">
                Skills &amp; experience directly fulfilling core requirements.
              </p>
            </div>

            {/* Column 2: Partial Matches */}
            <div className="p-5 border-3 border-black bg-white shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#d97706]" />
                    <span className="font-archivo text-xs uppercase font-black text-[#d97706] tracking-wider">
                      Partial Matches
                    </span>
                  </div>
                  <Badge variant="partialMatch">
                    {job_fit.partial_matches?.length || 0}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job_fit.partial_matches && job_fit.partial_matches.length > 0 ? (
                    job_fit.partial_matches.map((item, idx) => (
                      <Badge key={idx} variant="partialMatch" className="text-[11px] py-1">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-[#888]">No partial matches identified</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-[#4b5563] pt-2 border-t border-black">
                Adjacent skills needing translation or slight upskilling.
              </p>
            </div>

            {/* Column 3: Missing or Weak */}
            <div className="p-5 border-3 border-black bg-white shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-[#dc2626]" />
                    <span className="font-archivo text-xs uppercase font-black text-[#dc2626] tracking-wider">
                      Missing / Weak Areas
                    </span>
                  </div>
                  <Badge variant="weakMatch">
                    {job_fit.missing_or_weak?.length || 0}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job_fit.missing_or_weak && job_fit.missing_or_weak.length > 0 ? (
                    job_fit.missing_or_weak.map((item, idx) => (
                      <Badge key={idx} variant="weakMatch" className="text-[11px] py-1">
                        <X className="w-3 h-3 mr-1" />
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-[#888]">No critical missing requirements</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-[#4b5563] pt-2 border-t border-black">
                Critical JD requirements absent or thin on resume.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. ROLE BREAKDOWN TABS                                                    */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black font-archivo uppercase text-black tracking-tight">
              Detailed Role Specification Breakdown
            </h2>
          </div>

          <Tabs defaultValue="skills" className="w-full">
            <TabsList>
              <TabsTrigger value="skills">
                1. Required vs. Preferred Skills
              </TabsTrigger>
              <TabsTrigger value="competencies">
                2. Technical &amp; Behavioural Competencies
              </TabsTrigger>
              <TabsTrigger value="keywords">
                3. Keywords &amp; Core Concepts
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Required vs. Preferred Skills */}
            <TabsContent value="skills">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-3 border-black bg-white shadow-[4px_4px_0px_#000]">
                {/* Required Skills */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <span className="px-2 py-0.5 border border-black bg-[#ffdb1f] text-black text-[10px] font-black uppercase">
                      Mandatory
                    </span>
                    <h3 className="font-archivo text-xs uppercase font-black text-black">
                      Required Technical &amp; Domain Skills
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {role_analysis.required_skills?.map((skill, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 border-2 border-black bg-[#faf8f5] text-xs font-mono text-black flex items-start gap-2.5"
                      >
                        <span className="w-4 h-4 rounded-none bg-[#ffdb1f] text-black flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Preferred Skills */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <span className="px-2 py-0.5 border border-black bg-[#a8d8ff] text-black text-[10px] font-black uppercase">
                      Nice-to-Have
                    </span>
                    <h3 className="font-archivo text-xs uppercase font-black text-black">
                      Preferred &amp; Bonus Skills
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {role_analysis.preferred_skills && role_analysis.preferred_skills.length > 0 ? (
                      role_analysis.preferred_skills.map((skill, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 border-2 border-black bg-[#faf8f5] text-xs font-mono text-[#374151] flex items-start gap-2.5"
                        >
                          <span className="w-4 h-4 rounded-none bg-[#a8d8ff] text-black flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                            +
                          </span>
                          <span>{skill}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-[#888] italic">No optional preferred skills stated in JD</li>
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Competencies */}
            <TabsContent value="competencies">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-3 border-black bg-white shadow-[4px_4px_0px_#000]">
                {/* Technical Competencies */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <Cpu className="w-4 h-4 text-black" />
                    <h3 className="font-archivo text-xs uppercase font-black text-black">
                      Core Tools, Frameworks &amp; Paradigms
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {role_analysis.technical_competencies?.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 border-2 border-black bg-[#faf8f5] text-xs font-mono text-black shadow-[2px_2px_0px_#000]"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Behavioural Competencies */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <Award className="w-4 h-4 text-black" />
                    <h3 className="font-archivo text-xs uppercase font-black text-black">
                      Behavioural &amp; Collaboration Traits
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {role_analysis.behavioural_competencies?.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 border-2 border-black bg-[#faf8f5] text-xs font-mono text-black shadow-[2px_2px_0px_#000]"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Keywords & Concepts */}
            <TabsContent value="keywords">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-3 border-black bg-white shadow-[4px_4px_0px_#000]">
                {/* ATS Keywords */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <TagIcon className="w-4 h-4 text-black" />
                    <h3 className="font-archivo text-xs uppercase font-black text-black">
                      ATS Industry Terminology
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {role_analysis.important_keywords?.map((kw, idx) => (
                      <Badge key={idx} variant="outline" className="text-[11px] py-1 bg-white text-black border-2 border-black">
                        #{kw}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Core Concepts */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <BookOpen className="w-4 h-4 text-black" />
                    <h3 className="font-archivo text-xs uppercase font-black text-black">
                      Fundamental Domain Problem Spaces
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {role_analysis.important_concepts?.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 border-2 border-black bg-[#faf8f5] text-xs font-mono text-black shadow-[2px_2px_0px_#000]"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* ========================================================================= */}
        {/* 5. INTERVIEW INTEL SECTION                                               */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black font-archivo uppercase text-black tracking-tight">
              Interview Intelligence &amp; Adaptive Simulator Calibration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume Claims to Probe */}
            <Card variant="default" className="bg-white border-3 border-black">
              <CardHeader className="border-b-2 border-black pb-3 bg-[#fff0ed]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
                    <CardTitle className="text-sm text-black">Identified Resume Claims to Probe</CardTitle>
                  </div>
                  <Badge variant="weakMatch">FLAGGED</Badge>
                </div>
                <CardDescription className="text-[11px] text-[#4b5563]">
                  Metrics, claims, or achievements from candidate resume that the simulator will scrutinize during Level 2 &amp; Level 3.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {job_fit.resume_claims_to_probe && job_fit.resume_claims_to_probe.length > 0 ? (
                  <ul className="space-y-2.5">
                    {job_fit.resume_claims_to_probe.map((claim, idx) => (
                      <li
                        key={idx}
                        className="p-3 border-2 border-black bg-[#faf8f5] text-xs font-mono text-black leading-relaxed shadow-[2px_2px_0px_#000] flex items-start gap-2"
                      >
                        <span className="text-black font-bold shrink-0 mt-0.5">▶</span>
                        <span>{claim}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#888]">No high-risk claims flagged for verification.</p>
                )}
              </CardContent>
            </Card>

            {/* Recommended Immediate Preparation */}
            <Card variant="default" className="bg-white border-3 border-black">
              <CardHeader className="border-b-2 border-black pb-3 bg-[#fffdf0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#d97706]" />
                    <CardTitle className="text-sm text-black">Recommended Immediate Preparation</CardTitle>
                  </div>
                  <Badge variant="partialMatch">HIGH PRIORITY</Badge>
                </div>
                <CardDescription className="text-[11px] text-[#4b5563]">
                  Key topics the candidate should revise before initiating the simulation.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {job_fit.preparation_areas && job_fit.preparation_areas.length > 0 ? (
                  <ul className="space-y-2.5">
                    {job_fit.preparation_areas.map((area, idx) => (
                      <li
                        key={idx}
                        className="p-3 border-2 border-black bg-[#faf8f5] text-xs font-mono text-black leading-relaxed shadow-[2px_2px_0px_#000] flex items-start gap-2"
                      >
                        <span className="text-[#00A36C] font-bold shrink-0 mt-0.5">✓</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#888]">Candidate exhibits high coverage across all primary topics.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. BOTTOM ACTION BANNER                                                  */}
        {/* ========================================================================= */}
        <div className="p-6 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-archivo text-base uppercase font-black text-black block">
              Ready for the 3-Level Adaptive Interview?
            </span>
            <p className="text-xs font-mono text-[#4b5563]">
              Level 1 (Foundations) &rarr; Level 2 (Competency &amp; Trade-offs) &rarr; Level 3 (Deep Dive &amp; Stress Test).
            </p>
          </div>

          <Button
            variant="default"
            size="lg"
            onClick={() => router.push(`/interview/${sessionId}`)}
            className="w-full md:w-auto px-8 py-4 text-sm font-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] active:translate-x-1 active:translate-y-1 shrink-0"
          >
            START ADAPTIVE INTERVIEW
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RoleFitDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleFitDashboardContent />
    </Suspense>
  );
}

function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}
