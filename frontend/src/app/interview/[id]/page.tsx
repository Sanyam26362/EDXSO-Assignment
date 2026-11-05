"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  startInterview,
  submitTurnAnswer,
  getInterviewTurns,
  fetchQuestionAudio,
  transcribeAudio,
  generateReport,
} from "@/lib/api";
import { HistoricalInterviewTurn, SpeechMetrics } from "@/types/interview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Video,
  VideoOff,
  Volume2,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Play,
  Square,
  Bot,
  User,
  ArrowRight,
  Sliders,
  Terminal,
} from "lucide-react";

function InterviewRoomSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono flex items-center justify-center p-6">
      <div className="max-w-md w-full border-4 border-black bg-white p-8 shadow-[8px_8px_0px_#000000] text-center space-y-5">
        <div className="w-16 h-16 border-3 border-black bg-[#ffdb1f] text-black mx-auto flex items-center justify-center shadow-[4px_4px_0px_#000]">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h2 className="font-archivo text-xl font-black uppercase text-black tracking-tight">
            INITIALIZING INTERVIEW SIMULATOR
          </h2>
          <p className="text-xs font-mono text-[#4b5563] mt-1.5 leading-relaxed">
            Calibrating Level 1 question generator, loading voice engine &amp; camera feed...
          </p>
        </div>
      </div>
    </div>
  );
}

function InterviewRoomContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // Session & Turn State
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [focusArea, setFocusArea] = useState<string | null>("Motivation & Foundations");
  const [history, setHistory] = useState<HistoricalInterviewTurn[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Completion State
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isCompilingReport, setIsCompilingReport] = useState<boolean>(false);

  // Audio Playback for AI Persona
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Webcam Video Feed State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Voice Recording (Candidate Answer)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Text Answer State
  const [answerText, setAnswerText] = useState<string>("");

  // Delivery Telemetry (from backend latest evaluation)
  const [lastMetrics, setLastMetrics] = useState<SpeechMetrics | null>(null);

  // Collapsible History
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const streamRef = useRef<MediaStream | null>(null);
  streamRef.current = mediaStream;

  // Initialize or re-request Camera Feed
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null);
      // Attempt requesting video and audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });

      setMediaStream(stream);
      setIsCameraOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn("Video play error on init:", err));
      }
    } catch (err: unknown) {
      console.warn("Camera/Mic access denied or unavailable, trying fallback:", err);
      // Try video-only fallback
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setMediaStream(videoStream);
        setIsCameraOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          videoRef.current.play().catch((e) => console.warn(e));
        }
      } catch (videoErr) {
        console.warn("Video fallback also failed:", videoErr);
        // Try audio-only fallback
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          setMediaStream(audioStream);
          setIsCameraOn(false);
          setCameraError("Camera unavailable or permission denied. Audio-only active.");
        } catch {
          setIsCameraOn(false);
          setCameraError("Camera & Mic blocked. Please allow permissions in browser address bar.");
        }
      }
    }
  }, []);

  // 1. Initialize Camera Feed on Mount
  useEffect(() => {
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initCamera]);

  // Callback ref: invoked immediately when <video> node is mounted to DOM
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && mediaStream && isCameraOn) {
        if (node.srcObject !== mediaStream) {
          node.srcObject = mediaStream;
        }
        node.play().catch((err) => {
          console.warn("Video play on ref attach failed:", err);
        });
      }
    },
    [mediaStream, isCameraOn]
  );

  // Synchronizer: ensures <video> element always has live stream once rendered or when state changes
  useEffect(() => {
    if (videoRef.current && mediaStream && isCameraOn) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      videoRef.current.play().catch((err) => {
        console.warn("Video play sync failed:", err);
      });
    }
  }, [mediaStream, isCameraOn, isInitializing]);

  const toggleCamera = async () => {
    if (!mediaStream || mediaStream.getVideoTracks().length === 0) {
      // Re-initialize camera if stream or video track wasn't acquired
      await initCamera();
      return;
    }

    const videoTracks = mediaStream.getVideoTracks();
    const willEnable = !isCameraOn;
    videoTracks.forEach((t) => {
      t.enabled = willEnable;
    });
    setIsCameraOn(willEnable);

    if (willEnable && videoRef.current) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      videoRef.current.play().catch(console.warn);
    }
  };

  // 2. Play Audio via TTS
  const playQuestionAudio = async (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    try {
      setIsPlayingAudio(true);
      const audioBlob = await fetchQuestionAudio(textToSpeak);
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
      };

      await audio.play();
    } catch (err) {
      console.warn("Audio playback interrupted or gesture required:", err);
      setIsPlayingAudio(false);
    }
  };

  // 3. Initialize Interview Session (or resume existing)
  useEffect(() => {
    let isMounted = true;

    async function initInterview() {
      if (!sessionId) return;
      setIsInitializing(true);
      setError(null);

      try {
        const existingTurns = await getInterviewTurns(sessionId);

        if (!isMounted) return;

        if (existingTurns.length > 0) {
          setHistory(existingTurns);

          // Find if there is an unanswered turn
          const lastTurn = existingTurns[existingTurns.length - 1];
          if (!lastTurn.candidate_response) {
            setTurnNumber(lastTurn.turn_number);
            setCurrentLevel(lastTurn.level);
            setCurrentQuestion(lastTurn.question_text);
            const focus = lastTurn.turn_evaluation?.focus_area || "Competency Deep Dive";
            setFocusArea(focus);
            playQuestionAudio(lastTurn.question_text);
          } else if (existingTurns.length >= 6) {
            setIsComplete(true);
          } else {
            setTurnNumber(existingTurns.length + 1);
            setCurrentLevel(lastTurn.level);
          }
        } else {
          // New interview: start from turn 1
          const startData = await startInterview(sessionId);
          if (!isMounted) return;

          setTurnNumber(startData.turn_number || 1);
          setCurrentLevel(startData.current_level || 1);
          setCurrentQuestion(startData.question || "Tell me about your technical background and experience.");
          setFocusArea(startData.focus_area || "Candidate Introduction");
          playQuestionAudio(startData.question || "");
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to initialize interview room.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initInterview();

    return () => {
      isMounted = false;
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [sessionId]);

  // 4. Voice Recording Logic
  const handleStartRecording = async () => {
    try {
      let streamToRecord: MediaStream;
      if (mediaStream && mediaStream.getAudioTracks().length > 0) {
        // Isolate audio tracks into an audio-only stream to avoid encoding heavy video frames
        streamToRecord = new MediaStream(mediaStream.getAudioTracks());
      } else {
        streamToRecord = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (mediaStream) {
          streamToRecord.getAudioTracks().forEach((t) => mediaStream.addTrack(t));
        } else {
          setMediaStream(streamToRecord);
        }
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = mimeType ? new MediaRecorder(streamToRecord, { mimeType }) : new MediaRecorder(streamToRecord);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });

        setIsTranscribing(true);
        try {
          const { transcript } = await transcribeAudio(audioBlob);
          if (transcript) {
            setAnswerText((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
          }
        } catch (err) {
          console.error("Transcription failed:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start voice recorder:", err);
      setError("Microphone access is required to record voice. You can also type your answer.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // 5. Submit Candidate Answer for Turn
  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      setError("Please provide an answer before submitting (record voice or type).");
      return;
    }

    if (isRecording) {
      handleStopRecording();
    }

    setIsSubmittingTurn(true);
    setError(null);

    const speakingDuration = recordingSeconds > 0 ? recordingSeconds : Math.max(5, Math.round(answerText.split(/\s+/).length / 2.5));

    try {
      const response = await submitTurnAnswer({
        session_id: sessionId,
        answer_text: answerText.trim(),
        speaking_duration_seconds: speakingDuration,
      });

      if (response.speech_metrics) {
        setLastMetrics(response.speech_metrics);
      }

      // Add to conversation history
      setHistory((prev) => [
        ...prev,
        {
          id: response.turn_id || `turn-${turnNumber}`,
          turn_number: turnNumber,
          level: currentLevel,
          question_text: currentQuestion,
          candidate_response: answerText.trim(),
          turn_evaluation: {
            focus_area: focusArea || undefined,
            speech_metrics: response.speech_metrics,
          },
          speaking_duration_seconds: speakingDuration,
        },
      ]);

      // Check for completion
      if (response.interview_complete) {
        setIsComplete(true);
        setIsCompilingReport(true);
        try {
          await generateReport(sessionId);
          setTimeout(() => {
            router.push(`/report/${sessionId}`);
          }, 2000);
        } catch {
          router.push(`/report/${sessionId}`);
        }
        return;
      }

      // Advance to next question
      setTurnNumber(response.turn_number || turnNumber + 1);
      setCurrentLevel(response.current_level || currentLevel);
      setCurrentQuestion(response.question || "Next question loading...");
      setFocusArea(response.focus_area || "Technical Competency");
      setAnswerText("");
      setRecordingSeconds(0);

      // Speak next question
      if (response.question) {
        playQuestionAudio(response.question);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit answer. Please try again.";
      setError(msg);
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const levels = [
    {
      level: 1,
      title: "LEVEL 1: SCREENING",
      subtitle: "Motivation & Project Verification",
    },
    {
      level: 2,
      title: "LEVEL 2: COMPETENCY",
      subtitle: "Technical Depth & Trade-offs",
    },
    {
      level: 3,
      title: "LEVEL 3: DEEP-DIVE",
      subtitle: "Probing Weaknesses & Scenarios",
    },
  ];

  if (isInitializing) {
    return <InterviewRoomSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] text-[#101010] font-mono p-4 sm:p-6 lg:p-8">
      {/* Celebration Modal / Compilation Overlay */}
      {isComplete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full border-4 border-black bg-white p-8 shadow-[10px_10px_0px_#000] text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 border-3 border-black bg-[#b9f4a8] text-black mx-auto flex items-center justify-center shadow-[4px_4px_0px_#000]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-0.5 border-2 border-black bg-[#ffdb1f] text-black text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_#000]">
                SESSION COMPLETE
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-archivo uppercase text-black tracking-tight">
                All Interview Levels Completed
              </h2>
              <p className="text-xs font-mono text-[#4b5563] leading-relaxed">
                Synthesizing multi-modal evaluation report, calculating competency scores, and generating preparation recommendations...
              </p>
            </div>

            <div className="p-4 border-2 border-black bg-[#faf8f5] flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 text-black animate-spin" />
              <span className="text-xs font-bold text-black uppercase">
                {isCompilingReport ? "Compiling Evaluation Report..." : "Redirecting to Report..."}
              </span>
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={() => router.push(`/report/${sessionId}`)}
              className="w-full"
            >
              VIEW EVALUATION REPORT NOW
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* 1. TOP STAGE PROGRESSION & TURN TRACKER                                  */}
        {/* ========================================================================= */}
        <header className="border-b-3 border-black pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/analysis/${sessionId}`}
                className="text-xs font-mono text-[#4b5563] hover:text-black underline mr-2"
              >
                &larr; Exit to Dashboard
              </Link>
              <Badge variant="purple">LIVE SIMULATOR</Badge>
              <span className="text-xs font-mono font-bold text-black">
                QUESTION {Math.min(turnNumber, 6)} OF 6
              </span>
            </div>

            {focusArea && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-[#4b5563]">FOCUS AREA:</span>
                <Badge variant="info">{focusArea}</Badge>
              </div>
            )}
          </div>

          {/* 3 Stepped Level Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {levels.map((lvl) => {
              const isActive = currentLevel === lvl.level;
              const isPast = currentLevel > lvl.level;

              return (
                <div
                  key={lvl.level}
                  className={`p-3 border-2 transition-all ${
                    isActive
                      ? "border-black bg-[#ffdb1f] text-black shadow-[3px_3px_0px_#000] translate-x-0.5 translate-y-0.5"
                      : isPast
                      ? "border-black bg-[#b9f4a8] text-black shadow-[2px_2px_0px_#000]"
                      : "border-black bg-white text-[#777] shadow-[2px_2px_0px_#000]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-archivo text-xs uppercase font-black tracking-wider">
                      {lvl.title}
                    </span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] block font-mono mt-0.5 truncate ${
                      isActive || isPast ? "text-black font-bold" : "text-[#777]"
                    }`}
                  >
                    {lvl.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        </header>

        {/* Error Notification */}
        {error && (
          <div className="p-3 border-2 border-black bg-[#ff4b3e] text-white shadow-[3px_3px_0px_#000] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="font-bold px-2 cursor-pointer">
              &times;
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SPLIT SCREEN: AI INTERVIEWER PERSONA VS. CANDIDATE FEED               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* --------------------------------------------------------------------- */}
          {/* LEFT: AI INTERVIEWER PERSONA                                          */}
          {/* --------------------------------------------------------------------- */}
          <Card variant="elevated" className="bg-white flex flex-col justify-between">
            <CardHeader className="border-b-2 border-black pb-3 bg-[#faf8f5]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 border-2 border-black bg-[#7c3aed] text-white flex items-center justify-center shadow-[2px_2px_0px_#000]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-black">AI Executive Interviewer</CardTitle>
                    <span className="text-[10px] text-[#4b5563] font-mono block">
                      FastAPI Voice Engine &bull; Adaptive Gemini
                    </span>
                  </div>
                </div>

                {isPlayingAudio ? (
                  <span className="px-2 py-0.5 border border-black bg-[#ffdb1f] text-black text-[10px] font-black uppercase flex items-center gap-1.5 shadow-[1px_1px_0px_#000] animate-pulse">
                    <Volume2 className="w-3 h-3" />
                    AI SPEAKING...
                  </span>
                ) : (
                  <span className="px-2 py-0.5 border border-black bg-white text-black text-[10px] font-mono uppercase">
                    AWAITING ANSWER
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
              {/* Animated AI Audio Waveform Visualizer */}
              <div className="w-full h-32 border-2 border-black bg-[#faf8f5] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[3px_3px_0px_#000]">
                <div className="flex items-center gap-1.5 h-16">
                  {[40, 70, 25, 90, 60, 30, 80, 50, 100, 45, 65, 85, 35, 75, 55].map((height, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-none transition-all duration-150 ${
                        isPlayingAudio
                          ? "bg-black animate-pulse"
                          : "bg-[#cbd5e1]"
                      }`}
                      style={{
                        height: isPlayingAudio ? `${Math.round(Math.max(15, height * Math.random()))}%` : "20%",
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>

                <span className="text-[10px] font-mono text-[#4b5563] uppercase tracking-wider mt-2">
                  {isPlayingAudio ? "Streaming synthesized audio" : "Audio synthesizer standby"}
                </span>
              </div>

              {/* Current Question Text */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase font-black text-black flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-black" />
                  PROMPT // TURN {turnNumber} (LEVEL {currentLevel})
                </span>
                <div className="p-4 border-2 border-black bg-[#faf8f5] shadow-[3px_3px_0px_#000]">
                  <p className="font-archivo text-base sm:text-lg font-bold text-black uppercase leading-snug">
                    &quot;{currentQuestion}&quot;
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t-2 border-black pt-4 justify-between bg-[#faf8f5]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => playQuestionAudio(currentQuestion)}
                disabled={isPlayingAudio}
                className="flex items-center gap-1.5 text-xs bg-white text-black hover:bg-[#ffdb1f]"
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-black" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Replay Audio
                  </>
                )}
              </Button>

              <span className="text-[10px] font-mono text-[#4b5563]">
                {turnNumber <= 2 ? "Foundational Screening" : turnNumber <= 4 ? "Competency Probing" : "Architectural Deep Dive"}
              </span>
            </CardFooter>
          </Card>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT: CANDIDATE FEED & RESPONSE CONTROLS                             */}
          {/* --------------------------------------------------------------------- */}
          <Card variant="elevated" className="bg-white flex flex-col justify-between">
            <CardHeader className="border-b-2 border-black pb-3 bg-[#faf8f5]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 border-2 border-black bg-[#ffdb1f] text-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-black">Candidate Interface</CardTitle>
                    <span className="text-[10px] text-[#4b5563] font-mono block">
                      Webcam Stream &bull; Whisper Speech-to-Text
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleCamera}
                    className="h-8 px-2.5 text-[11px] bg-white text-black hover:bg-[#f5f0e7]"
                    title="Toggle Video Camera"
                  >
                    {isCameraOn ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-[#00A36C] mr-1" />
                        CAM ON
                      </>
                    ) : (
                      <>
                        <VideoOff className="w-3.5 h-3.5 text-[#dc2626] mr-1" />
                        CAM OFF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
              {/* Webcam Video Preview Box */}
              <div className="relative w-full h-44 sm:h-48 border-2 border-black bg-black overflow-hidden shadow-[3px_3px_0px_#000] flex items-center justify-center">
                {/* Always keep video element mounted in DOM to prevent detachment */}
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${
                    isCameraOn && !cameraError ? "block" : "hidden"
                  }`}
                />

                {(!isCameraOn || cameraError) && (
                  <div className="flex flex-col items-center justify-center text-center p-4 z-10">
                    <VideoOff className="w-8 h-8 text-[#ff4b3e] mb-1" />
                    <span className="text-xs font-bold text-white uppercase">
                      {cameraError ? "Camera Unavailable" : "Camera Muted"}
                    </span>
                    <span className="text-[10px] text-[#a0a5b5] max-w-xs mt-1">
                      {cameraError || "Microphone is active for speech answer"}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={toggleCamera}
                      className="mt-2 text-xs bg-white text-black hover:bg-[#ffdb1f] border-2 border-black font-bold shadow-[2px_2px_0px_#000]"
                    >
                      {cameraError ? "RETRY CAMERA ACCESS" : "TURN CAMERA ON"}
                    </Button>
                  </div>
                )}

                {/* Live Recording HUD Badge overlay */}
                {isRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 border-2 border-black bg-[#ff4b3e] text-white text-[11px] font-mono font-black uppercase shadow-[2px_2px_0px_#000] animate-pulse z-20">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    REC &bull; {formatTimer(recordingSeconds)}
                  </div>
                )}
              </div>

              {/* Speech-to-Text Status Notification */}
              {isTranscribing && (
                <div className="p-2 border border-black bg-[#ffdb1f] text-black text-xs font-mono font-bold flex items-center gap-2 shadow-[2px_2px_0px_#000]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>TRANSCRIBING AUDIO VIA WHISPER...</span>
                </div>
              )}

              {/* Editable Answer Area */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs text-[#4b5563]">
                  <span className="font-black uppercase text-black flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-black" />
                    Candidate Response (Voice or Type):
                  </span>
                  <span className="text-[10px] tabular-nums">
                    {answerText.length} chars &bull; {answerText.trim() ? answerText.trim().split(/\s+/).length : 0} words
                  </span>
                </div>

                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Click 'START SPEAKING' below to record, or type your answer directly..."
                  rows={4}
                  className="w-full border-2 border-black bg-white p-3 text-xs font-mono text-black placeholder:text-[#888] shadow-[2px_2px_0px_#000] focus:outline-none focus:ring-2 focus:ring-[#ffdb1f] resize-none leading-relaxed"
                />
              </div>

              {/* Voice Trigger Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {!isRecording ? (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleStartRecording}
                    disabled={isSubmittingTurn || isTranscribing}
                    className="flex-1 bg-[#ffdb1f] text-black font-black"
                  >
                    <Mic className="w-4 h-4 mr-1.5" />
                    START SPEAKING (VOICE)
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleStopRecording}
                    className="flex-1 bg-[#ff4b3e] text-white font-black animate-pulse"
                  >
                    <Square className="w-4 h-4 mr-1.5" />
                    STOP RECORDING ({formatTimer(recordingSeconds)})
                  </Button>
                )}

                <Button
                  type="button"
                  variant="default"
                  onClick={handleSubmitAnswer}
                  disabled={isSubmittingTurn || !answerText.trim()}
                  className="px-6 font-black bg-[#ffdb1f] text-black hover:bg-[#ffd000]"
                >
                  {isSubmittingTurn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                      EVALUATING...
                    </>
                  ) : (
                    <>
                      SUBMIT ANSWER
                      <Send className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* 3. SPEECH DELIVERY TELEMETRY CARD                                        */}
        {/* ========================================================================= */}
        <Card variant="default" className="bg-white">
          <CardHeader className="border-b border-black py-3 px-5 bg-[#faf8f5]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-black" />
                <span className="font-archivo text-xs uppercase font-black text-black">
                  Real-time Delivery Telemetry
                </span>
              </div>
              <span className="text-[10px] text-[#4b5563] font-mono">
                Pacing &bull; Filler Words &bull; Fluency
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Metric 1: Speaking Pace */}
              <div className="p-3 border-2 border-black bg-[#faf8f5] shadow-[2px_2px_0px_#000] space-y-1">
                <span className="text-[10px] text-[#4b5563] uppercase block">Speaking Pace</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-archivo font-black text-black tabular-nums">
                    {lastMetrics?.words_per_minute || 0}{" "}
                    <span className="text-xs font-mono font-normal text-[#4b5563]">WPM</span>
                  </span>
                  <Badge
                    variant={
                      lastMetrics?.pacing_assessment === "Optimal"
                        ? "strongMatch"
                        : lastMetrics?.pacing_assessment === "Slow"
                        ? "partialMatch"
                        : "weakMatch"
                    }
                  >
                    {lastMetrics?.pacing_assessment || "Standard"}
                  </Badge>
                </div>
                <span className="text-[9px] text-[#777] block">
                  Benchmark: 120-165 WPM for optimal clarity
                </span>
              </div>

              {/* Metric 2: Filler Words */}
              <div className="p-3 border-2 border-black bg-[#faf8f5] shadow-[2px_2px_0px_#000] space-y-1">
                <span className="text-[10px] text-[#4b5563] uppercase block">Filler Word Count</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-archivo font-black text-black tabular-nums">
                    {lastMetrics?.filler_word_count || 0}
                  </span>
                  {lastMetrics && lastMetrics.filler_word_count > 0 ? (
                    <Badge variant="weakMatch">CAUTION</Badge>
                  ) : (
                    <Badge variant="strongMatch">CRISP</Badge>
                  )}
                </div>
                <div className="text-[10px] text-[#4b5563] truncate">
                  {lastMetrics?.filler_words_used && lastMetrics.filler_words_used.length > 0
                    ? `Words: ${lastMetrics.filler_words_used.join(", ")}`
                    : "Zero filler words flagged"}
                </div>
              </div>

              {/* Metric 3: Total Word Count & Duration */}
              <div className="p-3 border-2 border-black bg-[#faf8f5] shadow-[2px_2px_0px_#000] space-y-1">
                <span className="text-[10px] text-[#4b5563] uppercase block">Response Breadth</span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-archivo font-black text-black tabular-nums">
                    {lastMetrics?.word_count || 0}{" "}
                    <span className="text-xs font-mono font-normal text-[#4b5563]">Words</span>
                  </span>
                  <Badge variant="outline">
                    {recordingSeconds > 0 ? formatTimer(recordingSeconds) : "Recorded"}
                  </Badge>
                </div>
                <span className="text-[9px] text-[#777] block">
                  Turn duration tracked by backend
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 4. CONVERSATION HISTORY DRAWER / ACCORDION                                */}
        {/* ========================================================================= */}
        <div className="border-3 border-black bg-white shadow-[4px_4px_0px_#000]">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="w-full p-4 flex items-center justify-between text-left font-archivo font-black text-xs uppercase text-black hover:bg-[#faf8f5] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-black" />
              <span>Conversation Transcript History ({history.length} Turns Completed)</span>
            </div>
            {isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isHistoryOpen && (
            <div className="p-5 border-t-2 border-black bg-[#faf8f5] space-y-4">
              {history.length > 0 ? (
                history.map((turn, idx) => (
                  <div
                    key={turn.id || idx}
                    className="p-4 border-2 border-black bg-white shadow-[2px_2px_0px_#000] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple">LEVEL {turn.level}</Badge>
                        <span className="text-xs font-mono font-bold text-black">TURN {turn.turn_number}</span>
                      </div>
                      <span className="text-[10px] text-[#4b5563] font-mono tabular-nums">
                        Duration: {turn.speaking_duration_seconds}s
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black text-black block">
                        Interviewer Question:
                      </span>
                      <p className="text-xs text-black leading-relaxed font-bold">
                        {turn.question_text}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-black">
                      <span className="text-[10px] uppercase font-black text-[#00A36C] block">
                        Candidate Answer:
                      </span>
                      <p className="text-xs text-[#374151] leading-relaxed">
                        {turn.candidate_response || "[No response recorded]"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#888] italic text-center py-4">
                  No turns completed yet. Answer the current question to populate the transcript log.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewRoomPage() {
  return (
    <Suspense fallback={<InterviewRoomSkeleton />}>
      <InterviewRoomContent />
    </Suspense>
  );
}
