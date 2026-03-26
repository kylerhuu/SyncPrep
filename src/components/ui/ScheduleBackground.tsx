"use client";

/**
 * Schedule page background: subtle ambient effects with orange accent glows.
 * Clean, modern aesthetic with the dark navy + orange palette.
 */
export function ScheduleBackground() {
  return (
    <>
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 70%)',
        }}
        aria-hidden 
      />
      
      {/* Top orange glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255, 107, 26, 0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        aria-hidden 
      />
      
      {/* Left edge glow */}
      <div 
        className="absolute left-0 top-1/4 w-[300px] h-[600px] opacity-30"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 0% 50%, rgba(255, 107, 26, 0.1) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        aria-hidden 
      />
      
      {/* Right edge glow */}
      <div 
        className="absolute right-0 top-1/3 w-[300px] h-[500px] opacity-25"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 100% 50%, rgba(255, 107, 26, 0.08) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        aria-hidden 
      />
      
      {/* Center content glow */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
        aria-hidden 
      />
    </>
  );
}
