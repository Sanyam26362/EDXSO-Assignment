"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getReport, generateReport, getSessionAnalysis } from "@/lib/api";
import { EvaluationReport, AnalysisSession } from "@/types/interview";
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
import {
  Printer,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  BarChart3,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  RefreshCw,
  AlertCircle,
  Check,
  Zap,
} from "lucide-react";

function ReportSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono flex items-center justify-center p-6">
      <div className="max-w-md w-full border-4 border-black bg-white p-8 shadow-[8px_8px_0px_#000000] text-center space-y-5">
        <div className="w-16 h-16 border-3 border-black bg-[#ffdb1f] text-black mx-auto flex items-center justify-center shadow-[4px_4px_0px_#000]">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h2 className="font-archivo text-xl font-black uppercase text-black tracking-tight">
            COMPILING EVALUATION REPORT
          </h2>
          <p className="text-xs font-mono text-[#555] mt-1.5 leading-relaxed">
            Synthesizing transcript feedback, competency radar, and actionable preparation roadmap...
          </p>
        </div>
      </div>
    </div>
  );
}

function PerformanceReportContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [sessionInfo, setSessionInfo] = useState<AnalysisSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded question feedback items tracker
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  const toggleQuestionExpand = (index: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    let isMounted = true;

    async function loadReportData() {
      if (!sessionId) return;
      setIsLoading(true);
      setError(null);

      try {
        // Parallel fetch of report and session context
        const sessionPromise = getSessionAnalysis(sessionId).catch(() => null);

        let reportData: EvaluationReport | null = null;
        try {
          reportData = await getReport(sessionId);
        } catch {
          // If not generated yet, trigger generation
          reportData = await generateReport(sessionId);
        }

        const sessionData = await sessionPromise;

        if (isMounted) {
          setReport(reportData);
          if (sessionData) setSessionInfo(sessionData);

          // By default expand the first two questions
          if (reportData?.question_feedback) {
            const initialExpanded: Record<number, boolean> = {};
            reportData.question_feedback.forEach((_, idx) => {
              initialExpanded[idx] = idx < 2;
            });
            setExpandedQuestions(initialExpanded);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to generate evaluation report. Please verify backend connection.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReportData();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (error || !report) {
    return (
      <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono flex items-center justify-center p-6">
        <div className="max-w-lg w-full border-4 border-black bg-white p-8 shadow-[8px_8px_0px_#000000] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-black bg-[#ff4b3e] text-white flex items-center justify-center shadow-[3px_3px_0px_#000] shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-archivo text-xl font-black uppercase text-black tracking-tight">
                Report Generation Error
              </h2>
              <span className="text-[11px] font-mono text-[#ff4b3e] font-bold block">
                Session ID: {sessionId}
              </span>
            </div>
          </div>

          <div className="p-4 border-2 border-black bg-[#feebe9] text-xs font-mono text-[#991b1b] leading-relaxed">
            {error || "Evaluation report could not be compiled."}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/interview/${sessionId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO INTERVIEW
            </Button>
            <Button
              variant="default"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              RETRY REPORT
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Helper for readiness styling
  const getReadinessConfig = (readiness: string) => {
    const lower = (readiness || "").toLowerCase();
    if (lower.includes("strong")) {
      return {
        label: "🟢 Strong Candidate",
        variant: "strongMatch" as const,
        textColor: "text-[#15803d]",
        desc: "Demonstrates high readiness and clear competency across technical and behavioural benchmarks.",
        border: "border-black",
      };
    }
    if (lower.includes("interview ready") || lower.includes("ready")) {
      return {
        label: "🟡 Interview Ready",
        variant: "partialMatch" as const,
        textColor: "text-[#b45309]",
        desc: "Reasonably prepared. Able to tackle foundational questions, with minor gaps in deep trade-offs.",
        border: "border-black",
      };
    }
    if (lower.includes("needs prep") || lower.includes("preparation")) {
      return {
        label: "🟠 Needs Preparation",
        variant: "partialMatch" as const,
        textColor: "text-[#ea580c]",
        desc: "Important conceptual or practical gaps identified. Targeted revision recommended before final loop.",
        border: "border-black",
      };
    }
    return {
      label: "🔴 Not Ready",
      variant: "weakMatch" as const,
      textColor: "text-[#dc2626]",
      desc: "Significant preparation required across core fundamentals and architecture paradigms.",
      border: "border-black",
    };
  };

  const readiness = getReadinessConfig(report.readiness_level);
  const roleTitle = sessionInfo?.role_analysis?.role_title || sessionInfo?.role_title || "Candidate Evaluation Report";
  const overallScore = report.overall_score || 0;

  // Normalized competency keys mapping
  const competencyLabels: Record<string, string> = {
    role_fit: "Role Fit",
    technical_knowledge: "Technical Knowledge",
    problem_solving: "Problem Solving",
    communication: "Communication",
    confidence: "Confidence",
    depth_of_understanding: "Depth of Understanding",
    behavioural_fit: "Behavioural Fit",
  };

  const formattedDate = report.created_at
    ? new Date(report.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono p-4 sm:p-6 lg:p-10 print:bg-white print:text-black print:p-0">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ========================================================================= */}
        {/* 1. EXECUTIVE SUMMARY HEADER                                              */}
        {/* ========================================================================= */}
        <header className="border-b-3 border-black pb-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/analysis/${sessionId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-white text-black hover:bg-[#ffdb1f] text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#000] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Fit Dashboard
              </Link>
              <Badge variant="purple">POST-INTERVIEW REPORT</Badge>
              <span className="text-xs text-[#555] font-bold">
                SESSION // {sessionId.substring(0, 8)}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-white border-2 border-black shadow-[3px_3px_0px_#000] hover:bg-[#a8d8ff]"
              >
                <Printer className="w-4 h-4 text-black" />
                PRINT / EXPORT REPORT
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                START NEW SESSION
              </Button>
            </div>
          </div>

          {/* Executive Header Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Left Title Area (8 cols) */}
            <div className="md:col-span-8 p-6 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 border-2 border-black bg-[#ffdb1f] text-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000]">
                    COMPREHENSIVE AUDIT
                  </span>
                  <span className="text-xs font-mono text-[#555] font-semibold">
                    Evaluated on {formattedDate}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black font-archivo tracking-tight uppercase text-black leading-tight">
                  {roleTitle}
                </h1>
                <p className="mt-2 text-xs text-[#555] max-w-2xl leading-relaxed">
                  Rigorous multi-modal evaluation synthesized from candidate audio transcripts, delivery telemetry, architectural depth, and role alignment.
                </p>
              </div>

              <div className="pt-3 border-t-2 border-black/15 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-black">Status Verdict:</span>
                  <Badge variant={readiness.variant}>{readiness.label}</Badge>
                </div>
                <span className="text-[11px] text-[#555] font-bold">
                  {report.question_feedback?.length || 0} Questions Evaluated
                </span>
              </div>
            </div>

            {/* Right Score Card (4 cols) */}
            <div className="md:col-span-4 p-6 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[11px] font-mono uppercase font-black tracking-widest text-[#555]">
                OVERALL EVALUATION SCORE
              </span>
              <div
                className={`text-6xl sm:text-7xl font-black font-archivo tracking-tight tabular-nums ${readiness.textColor}`}
              >
                {overallScore}
                <span className="text-2xl text-black font-normal"> / 100</span>
              </div>
              <div className="w-full max-w-xs pt-1">
                <Progress
                  value={overallScore}
                  variant={overallScore >= 80 ? "green" : overallScore >= 60 ? "yellow" : "red"}
                />
              </div>
              <p className="text-[11px] text-[#555] font-medium pt-1 max-w-xs">
                {readiness.desc}
              </p>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. COMPETENCY SCORES GRID                                                */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black font-archivo uppercase text-black tracking-tight">
              Competency Performance Breakdown
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(report.competency_scores || {}).map(([key, scoreVal]) => {
              const label = competencyLabels[key] || key.replace(/_/g, " ").toUpperCase();
              const scoreNum = Number(scoreVal) || 0;
              const isHigh = scoreNum >= 80;
              const isMid = scoreNum >= 60 && scoreNum < 80;

              return (
                <div
                  key={key}
                  className="p-4 border-3 border-black bg-white shadow-[3px_3px_0px_#000] space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-black uppercase truncate">{label}</span>
                      <span
                        className={`font-black font-archivo text-base tabular-nums ${
                          isHigh ? "text-[#15803d]" : isMid ? "text-[#b45309]" : "text-[#dc2626]"
                        }`}
                      >
                        {scoreNum}%
                      </span>
                    </div>
                    <Progress
                      value={scoreNum}
                      variant={isHigh ? "green" : isMid ? "yellow" : "red"}
                    />
                  </div>
                  <span className="text-[10px] text-[#555] font-mono block pt-1 font-medium">
                    {isHigh ? "Strong competency" : isMid ? "Moderate performance" : "Requires preparation"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. KEY OBSERVATIONS (STRENGTHS VS. CRITICAL WEAKNESSES)                   */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black font-archivo uppercase text-black tracking-tight">
              Key Diagnostic Observations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Demonstrated Strengths */}
            <Card variant="default" className="border-3 border-black bg-white shadow-[4px_4px_0px_#000]">
              <CardHeader className="border-b-2 border-black pb-3 bg-[#eef8eb]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#15803d]" />
                    <CardTitle className="text-sm text-black">Demonstrated Strengths</CardTitle>
                  </div>
                  <Badge variant="strongMatch">
                    {report.strengths?.length || 0} IDENTIFIED
                  </Badge>
                </div>
                <CardDescription className="text-[11px] text-[#444]">
                  Positive signals, deep technical command, and clear architectural rationale observed.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-2.5">
                {report.strengths && report.strengths.length > 0 ? (
                  <ul className="space-y-2.5">
                    {report.strengths.map((str, idx) => (
                      <li
                        key={idx}
                        className="p-3 border-2 border-black bg-[#f0fbf0] text-xs font-mono text-[#101010] leading-relaxed shadow-[2px_2px_0px_#000] flex items-start gap-2.5 font-medium"
                      >
                        <Check className="w-4 h-4 text-[#15803d] shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#666]">No key strengths highlighted.</p>
                )}
              </CardContent>
            </Card>

            {/* Critical Weaknesses */}
            <Card variant="default" className="border-3 border-black bg-white shadow-[4px_4px_0px_#000]">
              <CardHeader className="border-b-2 border-black pb-3 bg-[#feebe9]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-[#dc2626]" />
                    <CardTitle className="text-sm text-black">Critical Weaknesses &amp; Gaps</CardTitle>
                  </div>
                  <Badge variant="weakMatch">
                    {report.weaknesses?.length || 0} FLAGGED
                  </Badge>
                </div>
                <CardDescription className="text-[11px] text-[#444]">
                  Vague explanations, missing error scenarios, or incomplete trade-off analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-2.5">
                {report.weaknesses && report.weaknesses.length > 0 ? (
                  <ul className="space-y-2.5">
                    {report.weaknesses.map((weak, idx) => (
                      <li
                        key={idx}
                        className="p-3 border-2 border-black bg-[#fff1f0] text-xs font-mono text-[#101010] leading-relaxed shadow-[2px_2px_0px_#000] flex items-start gap-2.5 font-medium"
                      >
                        <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#666]">No critical weaknesses detected.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. QUESTION-LEVEL DEEP DIVE (ACCORDION CARDS)                             */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-black" />
              <h2 className="text-lg font-black font-archivo uppercase text-black tracking-tight">
                Question-Level Deep Dive &amp; Feedback
              </h2>
            </div>
            <span className="text-xs text-[#555] font-mono font-bold">
              Click cards to expand assessment details
            </span>
          </div>

          <div className="space-y-4">
            {report.question_feedback && report.question_feedback.length > 0 ? (
              report.question_feedback.map((item, idx) => {
                const isExpanded = !!expandedQuestions[idx];

                return (
                  <div
                    key={idx}
                    className="border-3 border-black bg-white shadow-[4px_4px_0px_#000000] transition-all"
                  >
                    {/* Header Banner */}
                    <button
                      type="button"
                      onClick={() => toggleQuestionExpand(idx)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#fff9d9] transition-colors cursor-pointer gap-4"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="w-7 h-7 border-2 border-black bg-[#ffdb1f] text-black font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_#000]">
                          {idx + 1}
                        </span>
                        <span className="font-archivo text-sm font-black uppercase text-black">
                          QUESTION {idx + 1}
                        </span>
                        <span className="text-xs font-mono text-[#444] truncate max-w-md sm:max-w-xl font-semibold">
                          &quot;{item.question}&quot;
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-black" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-black" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Body */}
                    {isExpanded && (
                      <div className="p-5 sm:p-6 border-t-2 border-black bg-[#faf8f5] space-y-5 text-xs font-mono">
                        {/* 1. Full Prompt & Candidate Response */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3.5 border-2 border-black bg-white space-y-1.5 shadow-[2px_2px_0px_#000]">
                            <span className="text-[10px] uppercase font-black text-[#b45309] block">
                              AI Question Prompt:
                            </span>
                            <p className="text-xs text-black font-bold leading-relaxed">
                              {item.question}
                            </p>
                          </div>

                          <div className="p-3.5 border-2 border-black bg-white space-y-1.5 shadow-[2px_2px_0px_#000]">
                            <span className="text-[10px] uppercase font-black text-[#1d4ed8] block">
                              Candidate Transcribed Response:
                            </span>
                            <p className="text-xs text-[#222] leading-relaxed font-medium">
                              {item.candidate_answer || "[No response provided]"}
                            </p>
                          </div>
                        </div>

                        {/* 2. Direct Evaluator Assessment */}
                        <div className="p-4 border-2 border-black bg-[#fffde8] shadow-[3px_3px_0px_#000] space-y-1">
                          <span className="text-[10px] font-black uppercase text-black flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-black" />
                            Evaluator Assessment &amp; Critique
                          </span>
                          <p className="text-xs text-black leading-relaxed font-medium">
                            {item.assessment}
                          </p>
                        </div>

                        {/* 3. Strengths vs Weaknesses Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3.5 border-2 border-black bg-[#f0fbf0] space-y-1">
                            <span className="text-[10px] font-black uppercase text-[#15803d] flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              What Was Good
                            </span>
                            <p className="text-xs text-black leading-relaxed">
                              {item.what_was_good || "Clear attempt to address the core problem."}
                            </p>
                          </div>

                          <div className="p-3.5 border-2 border-black bg-[#fff1f0] space-y-1">
                            <span className="text-[10px] font-black uppercase text-[#dc2626] flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              What Could Be Better
                            </span>
                            <p className="text-xs text-black leading-relaxed">
                              {item.what_could_be_better || "Deeper exploration of edge cases and trade-offs."}
                            </p>
                          </div>
                        </div>

                        {/* 4. Ideal Direction (Model Answer) */}
                        <div className="p-4 border-2 border-black bg-[#f3f0fc] shadow-[3px_3px_0px_#000] space-y-1">
                          <span className="text-[10px] font-black uppercase text-[#5b21b6] flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-[#5b21b6]" />
                            Ideal Direction // Model Senior Candidate Response
                          </span>
                          <p className="text-xs text-black leading-relaxed font-bold">
                            {item.ideal_direction}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#555] italic text-center py-6">
                No question feedback available for this session.
              </p>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. ACTIONABLE PREPARATION ROADMAP                                         */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black font-archivo uppercase text-black tracking-tight">
              Actionable Preparation Roadmap (Prioritized Checklist)
            </h2>
          </div>

          <div className="space-y-4">
            {report.preparation_gaps && report.preparation_gaps.length > 0 ? (
              report.preparation_gaps.map((gap, idx) => {
                const isUrgent = gap.priority === 1;
                const isMedium = gap.priority === 2;

                return (
                  <div
                    key={idx}
                    className={`p-5 sm:p-6 border-3 border-black bg-white shadow-[4px_4px_0px_#000] space-y-3 ${
                      isUrgent
                        ? "border-l-8 border-l-[#ff4b3e]"
                        : isMedium
                        ? "border-l-8 border-l-[#ffdb1f]"
                        : "border-l-8 border-l-[#a8d8ff]"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={isUrgent ? "weakMatch" : isMedium ? "partialMatch" : "info"}
                        >
                          {isUrgent
                            ? "PRIORITY 1 // URGENT"
                            : isMedium
                            ? "PRIORITY 2 // RECOMMENDED"
                            : "PRIORITY 3 // REFINEMENT"}
                        </Badge>
                        <h3 className="font-archivo text-sm font-black uppercase text-black">
                          {gap.topic}
                        </h3>
                      </div>
                      <span className="text-[10px] text-[#555] font-mono font-bold">
                        {gap.action_items?.length || 0} Action Items
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t-2 border-black/10">
                      {gap.action_items?.map((action, actionIdx) => (
                        <div
                          key={actionIdx}
                          className="p-3 border-2 border-black bg-[#faf8f5] text-xs font-mono text-[#101010] flex items-start gap-2.5 shadow-[2px_2px_0px_#000] font-medium"
                        >
                          <span
                            className={`w-4 h-4 rounded-none text-black flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 border border-black ${
                              isUrgent ? "bg-[#ff4b3e] text-white" : isMedium ? "bg-[#ffdb1f]" : "bg-[#a8d8ff]"
                            }`}
                          >
                            ✓
                          </span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#555] italic text-center py-6">
                No preparation gaps identified. Candidate demonstrated mastery across all interview prompts.
              </p>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. BOTTOM RETAKE & EXIT CONTROLS                                         */}
        {/* ========================================================================= */}
        <div className="p-6 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-archivo text-base uppercase font-black text-black block">
              Interview Evaluation Concluded
            </span>
            <p className="text-xs font-mono text-[#555]">
              You can export this report as a PDF, return to the fit dashboard, or restart with new candidate collateral.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border-2 border-black shadow-[3px_3px_0px_#000]"
            >
              <Printer className="w-4 h-4 text-black" />
              PRINT / EXPORT
            </Button>
            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              NEW INTERVIEW SESSION
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerformanceReportPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <PerformanceReportContent />
    </Suspense>
  );
}
