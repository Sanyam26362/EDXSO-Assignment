"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadAndAnalyze } from "@/lib/api";
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME } from "@/lib/sampleData";
import {
  Upload,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Layers,
  Cpu,
  RefreshCw,
  Terminal,
  ArrowLeft,
  User,
} from "lucide-react";

type InputMode = "text" | "file";

export default function DocumentIngestionPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  // Job Description state
  const [jdMode, setJdMode] = useState<InputMode>("text");
  const [jdText, setJdText] = useState<string>("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isJdDragging, setIsJdDragging] = useState<boolean>(false);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  // Resume state
  const [resumeMode, setResumeMode] = useState<InputMode>("text");
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isResumeDragging, setIsResumeDragging] = useState<boolean>(false);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoadSample = () => {
    setJdMode("text");
    setResumeMode("text");
    setJdFile(null);
    setResumeFile(null);
    setJdText(SAMPLE_JOB_DESCRIPTION);
    setResumeText(SAMPLE_RESUME);
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    setJdText("");
    setResumeText("");
    setJdFile(null);
    setResumeFile(null);
    setErrorMessage(null);
    if (jdFileInputRef.current) jdFileInputRef.current.value = "";
    if (resumeFileInputRef.current) resumeFileInputRef.current.value = "";
  };

  const handleFileDrop = (
    e: React.DragEvent<HTMLDivElement>,
    target: "jd" | "resume"
  ) => {
    e.preventDefault();
    if (target === "jd") setIsJdDragging(false);
    else setIsResumeDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (target === "jd") {
        setJdFile(droppedFile);
        setJdText("");
      } else {
        setResumeFile(droppedFile);
        setResumeText("");
      }
      setErrorMessage(null);
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "jd" | "resume"
  ) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (target === "jd") {
        setJdFile(selected);
        setJdText("");
      } else {
        setResumeFile(selected);
        setResumeText("");
      }
      setErrorMessage(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const hasJd = (jdMode === "text" && jdText.trim().length > 0) || (jdMode === "file" && jdFile !== null);
    const hasResume = (resumeMode === "text" && resumeText.trim().length > 0) || (resumeMode === "file" && resumeFile !== null);

    if (!hasJd || !hasResume) {
      setErrorMessage(
        "Both Job Description and Candidate Resume are required. Please paste text or upload files for both sides."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (jdMode === "file" && jdFile) {
        formData.append("jd_file", jdFile);
      } else if (jdText.trim()) {
        formData.append("jd_text", jdText.trim());
      }

      if (resumeMode === "file" && resumeFile) {
        formData.append("resume_file", resumeFile);
      } else if (resumeText.trim()) {
        formData.append("resume_text", resumeText.trim());
      }

      const session = await uploadAndAnalyze(formData);

      if (!session.session_id) {
        throw new Error("No session ID returned from analysis engine.");
      }

      // If user is authenticated, link session to user in backend
      if (isSignedIn && user?.id) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
          await fetch(`${apiUrl}/auth/link-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: session.session_id,
              clerk_id: user.id,
            }),
          });
        } catch (linkErr) {
          console.warn("Failed to link session with user:", linkErr);
        }
      }

      router.push(`/analysis/${session.session_id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze documents. Please check backend connection.";
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER                                                             */}
        {/* ========================================================================= */}
        <header className="border-b-3 border-black pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white text-black hover:bg-[#ffdb1f] text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#000] transition-colors w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Overview
            </Link>

            {/* Clerk User Status pill */}
            <div className="flex items-center gap-3">
              {isSignedIn ? (
                <div className="flex items-center gap-2 px-3 py-1 border-2 border-black bg-[#b9f4a8] text-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000]">
                  <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                  <span>{user?.firstName ? `Hi, ${user.firstName}` : user?.primaryEmailAddress?.emailAddress}</span>
                  <div className="ml-1">
                    <UserButton />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black bg-white text-black hover:bg-[#ffdb1f] shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="px-3 py-1 text-xs font-mono font-bold uppercase border-2 border-black bg-[#ffdb1f] text-black hover:bg-[#ffe647] shadow-[2px_2px_0px_#000] cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 border-2 border-black bg-[#ffdb1f] text-[#101010] text-[10px] font-mono font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
                  INTERVIEW ACCELERATOR // SYSTEM READY
                </span>
                <span className="text-xs font-mono font-bold text-[#4b5563]">
                  PIPELINE: INGESTION &rarr; ROLE FIT &rarr; ADAPTIVE SIMULATOR
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black font-archivo tracking-tight uppercase text-black">
                Document Ingestion &amp; Job Fit Analyzer
              </h1>
              <p className="mt-1.5 text-xs font-mono text-[#374151] max-w-3xl leading-relaxed">
                Upload or paste the target Job Description and Candidate Resume. The multi-modal engine extracts technical competencies, analyzes role alignment, probes resume metrics, and calibrates a 3-level adaptive interview simulator.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleLoadSample}
                className="flex items-center gap-2 border-2 border-black bg-white text-black hover:bg-[#ffdb1f]"
              >
                <Sparkles className="w-4 h-4 text-black" />
                LOAD SAMPLE AI ENGINEER INTERN
              </Button>

              {(jdText || resumeText || jdFile || resumeFile) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-[#4b5563] hover:text-[#ff4b3e]"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="p-4 border-3 border-black bg-[#ff4b3e] text-white shadow-[4px_4px_0px_#000000] flex items-start justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-xs uppercase font-black tracking-wider block">
                  INGESTION ERROR
                </span>
                <p className="font-mono text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-white hover:text-black font-black text-sm px-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. TWO-COLUMN INPUT GRID                                                 */}
        {/* ========================================================================= */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* --------------------------------------------------------------------- */}
            {/* COLUMN A: TARGET JOB DESCRIPTION                                      */}
            {/* --------------------------------------------------------------------- */}
            <Card variant="elevated" className="flex flex-col bg-white">
              <CardHeader className="border-b-2 border-black pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 border-2 border-black bg-[#a8d8ff] text-black font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_#000]">
                      A
                    </span>
                    <Badge variant="info">INPUT 1 // TARGET SPEC</Badge>
                  </div>

                  {/* Mode Selector Buttons */}
                  <div className="flex items-center gap-1 bg-[#f5f0e7] p-1 border-2 border-black">
                    <button
                      type="button"
                      onClick={() => setJdMode("text")}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        jdMode === "text"
                          ? "bg-[#ffdb1f] text-black shadow-[2px_2px_0px_#000]"
                          : "text-[#4b5563] hover:text-black"
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setJdMode("file")}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        jdMode === "file"
                          ? "bg-[#ffdb1f] text-black shadow-[2px_2px_0px_#000]"
                          : "text-[#4b5563] hover:text-black"
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                <CardTitle className="text-black">Job Description (JD)</CardTitle>
                <CardDescription className="text-[#4b5563]">
                  Enter role requirements, responsibilities, technical expectations, and domain skills.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                {jdMode === "text" ? (
                  <div className="space-y-2 flex-1 flex flex-col">
                    <textarea
                      value={jdText}
                      onChange={(e) => {
                        setJdText(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Paste Job Description here (Requirements, Responsibilities, Qualifications, Stack)..."
                      className="w-full h-80 border-2 border-black bg-white p-3.5 text-xs font-mono text-black placeholder:text-[#888] shadow-[3px_3px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#ffdb1f] resize-none leading-relaxed transition-all"
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#4b5563] pt-1">
                      <span>Format: Plain Text / Markdown</span>
                      <span className="tabular-nums">
                        {jdText.length} characters &bull; {jdText.trim() ? jdText.trim().split(/\s+/).length : 0} words
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1 flex flex-col">
                    <input
                      type="file"
                      ref={jdFileInputRef}
                      onChange={(e) => handleFileInputChange(e, "jd")}
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                    />

                    {jdFile ? (
                      <div className="p-5 border-2 border-black bg-[#faf8f5] shadow-[3px_3px_0px_#000] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border-2 border-black bg-[#b9f4a8] text-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-black block truncate max-w-xs sm:max-w-sm">
                              {jdFile.name}
                            </span>
                            <span className="text-[10px] text-[#4b5563] font-mono">
                              {formatFileSize(jdFile.size)} &bull; Ready for upload
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setJdFile(null);
                            if (jdFileInputRef.current) jdFileInputRef.current.value = "";
                          }}
                          className="text-[#ff4b3e] hover:bg-[#ff4b3e]/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsJdDragging(true);
                        }}
                        onDragLeave={() => setIsJdDragging(false)}
                        onDrop={(e) => handleFileDrop(e, "jd")}
                        onClick={() => jdFileInputRef.current?.click()}
                        className={`border-3 border-dashed h-80 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                          isJdDragging
                            ? "border-black bg-[#ffdb1f]/20 shadow-[4px_4px_0px_#000]"
                            : "border-black bg-[#faf8f5] hover:bg-white shadow-[3px_3px_0px_#000]"
                        }`}
                      >
                        <div className="w-12 h-12 border-2 border-black bg-[#a8d8ff] text-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_#000]">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-archivo text-sm uppercase text-black font-black block">
                          Drop Job Description Here
                        </span>
                        <p className="text-xs text-[#4b5563] mt-1 max-w-xs">
                          or click to browse from local computer
                        </p>
                        <span className="mt-3 px-2 py-0.5 border border-black bg-white text-[10px] text-black font-mono uppercase">
                          Supports PDF, DOCX, TXT (up to 15MB)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* --------------------------------------------------------------------- */}
            {/* COLUMN B: CANDIDATE RESUME                                            */}
            {/* --------------------------------------------------------------------- */}
            <Card variant="elevated" className="flex flex-col bg-white">
              <CardHeader className="border-b-2 border-black pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 border-2 border-black bg-[#ffdb1f] text-black font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_#000]">
                      B
                    </span>
                    <Badge variant="default">INPUT 2 // CANDIDATE PROFILE</Badge>
                  </div>

                  {/* Mode Selector Buttons */}
                  <div className="flex items-center gap-1 bg-[#f5f0e7] p-1 border-2 border-black">
                    <button
                      type="button"
                      onClick={() => setResumeMode("text")}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        resumeMode === "text"
                          ? "bg-[#ffdb1f] text-black shadow-[2px_2px_0px_#000]"
                          : "text-[#4b5563] hover:text-black"
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeMode("file")}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        resumeMode === "file"
                          ? "bg-[#ffdb1f] text-black shadow-[2px_2px_0px_#000]"
                          : "text-[#4b5563] hover:text-black"
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                <CardTitle className="text-black">Candidate Resume</CardTitle>
                <CardDescription className="text-[#4b5563]">
                  Enter past experience, technical projects, education, and portfolio metrics.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                {resumeMode === "text" ? (
                  <div className="space-y-2 flex-1 flex flex-col">
                    <textarea
                      value={resumeText}
                      onChange={(e) => {
                        setResumeText(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Paste Candidate Resume here (Experience, Projects, Education, Skillset, Metrics)..."
                      className="w-full h-80 border-2 border-black bg-white p-3.5 text-xs font-mono text-black placeholder:text-[#888] shadow-[3px_3px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#ffdb1f] resize-none leading-relaxed transition-all"
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#4b5563] pt-1">
                      <span>Format: Plain Text / Markdown</span>
                      <span className="tabular-nums">
                        {resumeText.length} characters &bull; {resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0} words
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 flex-1 flex flex-col">
                    <input
                      type="file"
                      ref={resumeFileInputRef}
                      onChange={(e) => handleFileInputChange(e, "resume")}
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                    />

                    {resumeFile ? (
                      <div className="p-5 border-2 border-black bg-[#faf8f5] shadow-[3px_3px_0px_#000] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border-2 border-black bg-[#b9f4a8] text-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-black block truncate max-w-xs sm:max-w-sm">
                              {resumeFile.name}
                            </span>
                            <span className="text-[10px] text-[#4b5563] font-mono">
                              {formatFileSize(resumeFile.size)} &bull; Ready for upload
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setResumeFile(null);
                            if (resumeFileInputRef.current) resumeFileInputRef.current.value = "";
                          }}
                          className="text-[#ff4b3e] hover:bg-[#ff4b3e]/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsResumeDragging(true);
                        }}
                        onDragLeave={() => setIsResumeDragging(false)}
                        onDrop={(e) => handleFileDrop(e, "resume")}
                        onClick={() => resumeFileInputRef.current?.click()}
                        className={`border-3 border-dashed h-80 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
                          isResumeDragging
                            ? "border-black bg-[#ffdb1f]/20 shadow-[4px_4px_0px_#000]"
                            : "border-black bg-[#faf8f5] hover:bg-white shadow-[3px_3px_0px_#000]"
                        }`}
                      >
                        <div className="w-12 h-12 border-2 border-black bg-[#ffdb1f] text-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_#000]">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-archivo text-sm uppercase text-black font-black block">
                          Drop Candidate Resume Here
                        </span>
                        <p className="text-xs text-[#4b5563] mt-1 max-w-xs">
                          or click to browse from local computer
                        </p>
                        <span className="mt-3 px-2 py-0.5 border border-black bg-white text-[10px] text-black font-mono uppercase">
                          Supports PDF, DOCX, TXT (up to 15MB)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* 3. SUBMISSION ACTION DOCK                                                */}
          {/* ========================================================================= */}
          <div className="p-6 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Terminal className="w-4 h-4 text-black" />
                <span className="font-archivo font-black uppercase text-sm text-black">
                  Analysis Pipeline Ready
                </span>
              </div>
              <p className="text-xs font-mono text-[#4b5563]">
                FastAPI RAG will calculate fit scores, match matrices, probe items, and configure the interview session.
              </p>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-4 text-sm font-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] active:translate-x-1 active:translate-y-1 shrink-0"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ANALYZING ROLE &amp; FIT...
                </>
              ) : (
                <>
                  INITIALIZE ROLE &amp; FIT ANALYSIS
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Feature Badges Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-2 border-black text-xs font-mono">
          <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex items-center gap-3">
            <Layers className="w-5 h-5 text-black shrink-0" />
            <div>
              <span className="font-bold text-black block">Multi-Modal Parsing</span>
              <span className="text-[#4b5563] text-[10px]">PDF, DOCX, and raw text supported</span>
            </div>
          </div>
          <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex items-center gap-3">
            <Cpu className="w-5 h-5 text-black shrink-0" />
            <div>
              <span className="font-bold text-black block">LLM Alignment Matrix</span>
              <span className="text-[#4b5563] text-[10px]">Pydantic-validated fit decomposition</span>
            </div>
          </div>
          <div className="p-3 border-2 border-black bg-white shadow-[2px_2px_0px_#000] flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-black shrink-0" />
            <div>
              <span className="font-bold text-black block">Adaptive Calibration</span>
              <span className="text-[#4b5563] text-[10px]">Tailors questions to resume gaps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

