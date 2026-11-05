# Interview Accelerator — Theme & Design System Reference

Extracted directly from the **Inkloom AI** visual DNA, this document outlines the exact color tokens, typography scales, surface elevations, dark theme mappings, and atomic UI component conventions to use across the **AI Interview Accelerator** frontend.

---

## 1. Design Philosophy: Dark Neo-Brutalism + High-Tech Console

The design language pairs high-contrast neo-brutalist construction (bold black borders, hard unblurred drop shadows, monospace data grids, uppercase punchy labels) with a sleek cybernetic dark palette (`#121316` surface, `#383a45` structural borders, and vivid neon-tinted status accents).

### Core Visual Principles
- **Hard Offsets**: Shadows use zero blur and crisp pixel offsets (`2px 2px 0 #000`, `4px 4px 0 #000`, `6px 6px 0 #000`).
- **Tactile Transitions**: Buttons press into the canvas on interaction (`hover:translate-x-0.5 hover:translate-y-0.5`, `active:translate-x-1 active:translate-y-1 active:shadow-none`).
- **Heavy Borders**: Structural frames use `border-2`, `border-3`, or `border-4` solid outlines.
- **Monospace Dominance**: All telemetry, scores, badges, metrics, and secondary labels use `Roboto Mono`.
- **Brutalist Headings**: Hero titles, modal titles, and section headers use `Archivo Black`.

---

## 2. Color Palette & Theme Tokens

### 2.1 Backgrounds & Surface Elevations

| Token Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| `Canvas Base / Dim` | `#0d0e11` | Lowest layer backdrop, camera feed gutters, sunken terminal inputs |
| `Surface (Main)` | `#121316` | Main application background (`bg-[#121316]`), page root |
| `Card Base (Low)` | `#18191f` | Hero banners, primary evaluation containers, modal surfaces |
| `Card Container (Mid)` | `#1c1d22` | Standard card panels (`bg-[#1c1d22]`), sidebar surface |
| `Surface High` | `#292a2d` | Hover states on cards, elevated popovers, active control docks |
| `Surface Highest` | `#343538` | Scrollbar thumbs, segmented control track backgrounds |
| `Surface Bright` | `#38393c` | Active borders on high-contrast focus |

### 2.2 Text Hierarchy & Contrasts

| Token Name | Hex Code | Tailwind Equivalent | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| `Primary Text` | `#f5f0e7` / `#ffffff` | `text-[#f5f0e7]` / `text-white` | Main titles, question prompts, candidate name, active text |
| `Body Text` | `#e3e2e6` | `text-[#e3e2e6]` | Evaluation feedback, transcript logs, rubric explanations |
| `Muted Text` | `#a0a5b5` / `#958da1` | `text-[#a0a5b5]` | Timestamps, subtitles, helper hints, technical metadata |
| `Dim / Secondary` | `#6b7280` / `#4b5563` | `text-[#6b7280]` | Disabled states, closed section indicators |

### 2.3 Accent & Semantic Palette

| Semantic Role | Hex Code | Neo-Brutalist Token | Application in Interview Accelerator |
| :--- | :--- | :--- | :--- |
| **Active Highlight / Focus** | `#ffdb1f` | `var(--yellow)` | Active level indicator, focus rings, primary CTA button, timer pulse |
| **Primary Platform / Violet** | `#7c3aed` | `var(--primary)` | AI Agent persona tag, system intelligence badges, glowing radar rings |
| **Strong Match / Success** | `#b9f4a8` | `var(--green)` | High Job Fit (>85%), passed benchmark, verified skill badge |
| **Partial Match / Warning** | `#ffdb1f` | `var(--yellow)` | Medium Job Fit (60-84%), soft skill suggestion, cautionary review |
| **Missing / Weak / Error** | `#ff4b3e` | `var(--red)` | Low Job Fit (<60%), missing technical requirement, audio clipping |
| **Secondary / Informational** | `#a8d8ff` | `var(--blue)` | Live audio waveform accent, JD keyword chips, role level pill |
| **Special Accent / Admin** | `#ff72b6` | `var(--pink)` | Candidate seniority tag (L3/L4/L5), benchmark rubric level |
| **Subdued Mint** | `#00A36C` | `var(--secondary)` | Final interview evaluation approved verdict |

### 2.4 Structural Borders & Shadows

- **Dark Border**: `#383a45` (`border-[#383a45]`) on cards, dividers, and window frames.
- **Deep Black Border**: `#101010` / `#000000` (`border-black`) on high-emphasis buttons and status badges.
- **Shadow Scale**:
  - `shadow-[2px_2px_0px_#000000]`: Badges, small chips, mini-buttons
  - `shadow-[3px_3px_0px_#000000]`: Default buttons, input fields, tab triggers
  - `shadow-[4px_4px_0px_#000000]`: Standard card containers, widget panels
  - `shadow-[6px_6px_0px_#000000]`: Hero card panels, evaluation KPI widgets
  - `shadow-[8px_8px_0px_#000000]`: Floating modals, interview simulator video HUD
  - `shadow-[10px_10px_0px_#000000]`: Fullscreen dialogs

---

## 3. Typography Rules

1. **Headings**:
   - Font: `'Archivo Black', Arial, sans-serif` (`font-archivo`)
   - Text Transform: `uppercase`
   - Tracking: `tracking-tight` (`-0.02em` to `-0.04em`)
   - Leading: Tight line height (`leading-none` or `leading-tight`)
   - Example: `<h1 className="font-archivo font-black uppercase text-2xl tracking-tight text-white">Interview Simulator</h1>`

2. **Technical Data & Controls**:
   - Font: `'Roboto Mono', monospace` (`font-mono`)
   - Letter Spacing: `tracking-wider` for badges, tags, and tabs
   - Numerals: Always use `.tabular-nums` for timers, audio dB meters, score percentages, and question counts.

---

## 4. Component Token Mapping for Interview Accelerator

### 4.1 Fit Badges (Role & Job Fit Dashboard)

```tsx
// 1. Strong Match (Job Fit >= 85%)
<Badge variant="strongMatch">
  <Check className="w-3 h-3 mr-1" />
  STRONG FIT // 94% MATCH
</Badge>

// 2. Partial Match (Job Fit 60% - 84%)
<Badge variant="partialMatch">
  <AlertCircle className="w-3 h-3 mr-1" />
  PARTIAL FIT // 72% MATCH
</Badge>

// 3. Weak / Missing Skill (Job Fit < 60%)
<Badge variant="weakMatch">
  <X className="w-3 h-3 mr-1" />
  MISSING SKILL // SYSTEM DESIGN
</Badge>

// 4. Role Seniority & Track Badge
<Badge variant="info">
  STAFF ENGINEER (L6)
</Badge>

// 5. Adaptive Level Pill
<Badge variant="purple">
  LEVEL 2 // DEEP DIVE
</Badge>
```

### 4.2 Card Container Patterns

#### Standard Section Card (Resume & JD Ingestion, Stats)
```tsx
<div className="p-5 sm:p-6 border-3 border-black dark:border-[#383a45] bg-white dark:bg-[#1c1d22] shadow-[4px_4px_0px_#000000] font-mono">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-archivo font-black uppercase tracking-tight text-lg text-white">
      Candidate Technical Profile
    </h3>
    <Badge variant="strongMatch">PARSED</Badge>
  </div>
  <p className="text-xs font-mono text-[#a0a5b5] leading-relaxed">
    Resume ingested successfully. Extracted 14 core competencies and 8 verified projects.
  </p>
</div>
```

#### Hero Evaluation Card / Simulator Screen
```tsx
<div className="p-6 border-4 border-black dark:border-[#383a45] bg-[#18191f] shadow-[6px_6px_0px_#000000]">
  <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#292a2d] pb-4 mb-5">
    <div>
      <span className="px-2 py-0.5 border-2 border-black bg-[#ffdb1f] text-black text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_#000]">
        SIMULATION STAGE 3 OF 3
      </span>
      <h2 className="mt-2 text-2xl font-archivo font-black uppercase text-white">
        Architecture Scalability Stress Test
      </h2>
    </div>
    <div className="text-right">
      <span className="text-[10px] font-mono uppercase text-[#a0a5b5] block">Time Elapsed</span>
      <span className="text-xl font-mono font-black tabular-nums text-[#ffdb1f]">18:42</span>
    </div>
  </div>
  {/* Content body */}
</div>
```

### 4.3 Button Hierarchy Guidelines

| Tier | Button Variant | Recommended Style / Classes | Purpose in Application |
| :--- | :--- | :--- | :--- |
| **Primary CTA** | `variant="default"` | `bg-[#ffdb1f] text-black border-2 border-black shadow-[3px_3px_0px_#000]` | "Start Interview", "Generate Evaluation Report", "Confirm Ingestion" |
| **Mic Toggle (Active)** | Custom Active | `bg-[#ff4b3e] text-white border-2 border-black shadow-[3px_3px_0px_#000] animate-pulse` | Microphone recording state (Mute / Unmute) |
| **Mic Toggle (Muted)** | `variant="outline"` | `bg-[#1c1d22] text-[#a0a5b5] border-2 border-[#383a45] shadow-[2px_2px_0px_#000]` | Microphone muted state |
| **Secondary Nav** | `variant="outline"` | `bg-white dark:bg-[#1c1d22] text-white border-2 dark:border-[#383a45]` | "Previous Question", "Back to Dashboard", "Download Transcript" |
| **AI Action / Level Jump**| `variant="purple"` | `bg-[#7c3aed] text-white border-2 border-black shadow-[3px_3px_0px_#000]` | "Simulate Follow-up", "AI Deep Dive Prompt" |
| **Destructive / Reset** | `variant="destructive"` | `bg-[#ff4b3e] text-white border-2 border-black shadow-[3px_3px_0px_#000]` | "Abort Session", "Clear Uploaded Resume" |

### 4.4 Progress Indicators (Adaptive Level & Score)

```tsx
// 3-Level Adaptive Simulator Progress
<div className="space-y-1.5">
  <div className="flex justify-between text-xs font-mono font-black">
    <span className="text-white">INTERVIEW DIFFICULTY // LEVEL 2</span>
    <span className="text-[#ffdb1f]">66% COMPLETED</span>
  </div>
  <Progress value={66} variant="yellow" />
</div>

// Evaluation Score Gauge
<Progress value={88} variant="green" />
```

---

## 5. Summary Checklist for New Pages

When developing the **Resume/JD Ingestion**, **Job Fit Dashboard**, **Adaptive Interview Simulator**, and **Evaluation Report**:
1. Keep the root element wrapped with `font-mono bg-[#121316] text-[#e3e2e6]`.
2. Wrap titles in `<h1/h2/h3 className="font-archivo font-black uppercase text-white">`.
3. Use the unified UI primitives from `@/components/ui/*` (`Button`, `Card`, `Badge`, `Progress`, `Input`, `Dialog`, `Tabs`, `Separator`).
4. Ensure all borders default to `border-2` or `border-3` with `dark:border-[#383a45]`.
5. Use hard black shadow offsets (`shadow-[3px_3px_0px_#000000]`) rather than blurred shadows.

