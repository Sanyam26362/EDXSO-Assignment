import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkUserSync } from "@/components/auth/ClerkUserSync";

export const metadata: Metadata = {
  title: "Interview Accelerator — AI Adaptive Simulator & Evaluation",
  description:
    "AI-powered Interview Accelerator with 3-Level Adaptive Simulator, Resume/JD Ingestion, and Multi-Modal Evaluation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html
        lang="en"
        className="h-full antialiased scroll-smooth"
        suppressHydrationWarning
      >
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Roboto+Mono:wght@400;600;700&display=swap"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
            }}
          />
        </head>
        <body
          className="min-h-full antialiased font-mono bg-[#f5f0e7] text-[#101010]"
          suppressHydrationWarning
        >
          <ClerkUserSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
