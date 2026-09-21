import React from 'react';

interface PlatformLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  subtitle?: boolean;
  textColor?: string;
}

export const PlatformLogo: React.FC<PlatformLogoProps> = ({
  size = 40,
  className = '',
  showText = false,
  subtitle = false,
  textColor = 'text-slate-900'
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Fidelity Vector Reproduction of Second Chance Emblem (Transparent Background) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(21, 101, 192, 0.15))' }}
      >
        <defs>
          {/* Blue Gradient for Left Figure & Arc */}
          <linearGradient id="scBlueGrad" x1="50" y1="50" x2="250" y2="450" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#1E67C6" />
            <stop offset="100%" stopColor="#0D47A1" />
          </linearGradient>

          {/* Green Gradient for Right Figure & Leaves */}
          <linearGradient id="scGreenGrad" x1="450" y1="50" x2="250" y2="450" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="40%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          {/* Center Leaf Gradient */}
          <linearGradient id="scLeafGrad" x1="250" y1="100" x2="250" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>

          {/* Arc Gradient */}
          <linearGradient id="scArcGrad" x1="60" y1="180" x2="440" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer Circular Framing Arc (Top curve) */}
        <path
          d="M 65 245 C 55 140 145 55 250 50 C 355 55 445 140 455 285"
          fill="none"
          stroke="url(#scArcGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* LEFT FIGURE (Blue - Human & Arm) */}
        {/* Head */}
        <circle cx="140" cy="180" r="34" fill="url(#scBlueGrad)" />

        {/* Torso & Sweeping Arm */}
        <path
          d="M 125 215 
             C 90 260 80 340 145 400 
             C 185 435 235 450 255 455
             C 240 440 215 425 200 405
             C 175 370 170 330 190 290
             C 205 260 225 235 245 220
             C 215 220 185 240 160 260
             C 135 280 125 250 135 225
             Z"
          fill="url(#scBlueGrad)"
        />

        {/* Handshake Clasp - Blue Hand & Fingers reaching right */}
        <path
          d="M 175 405
             C 200 425 240 445 265 445
             C 285 445 310 425 320 405
             C 295 415 265 415 240 405
             C 215 395 195 385 175 405 Z"
          fill="url(#scBlueGrad)"
        />

        {/* Interlocked finger circles/nubs for handshake */}
        <circle cx="210" cy="442" r="14" fill="#0284C7" stroke="#FFFFFF" strokeWidth="4" />
        <circle cx="238" cy="455" r="14" fill="#0284C7" stroke="#FFFFFF" strokeWidth="4" />
        <circle cx="270" cy="452" r="14" fill="#15803D" stroke="#FFFFFF" strokeWidth="4" />

        {/* RIGHT FIGURE (Green - Human & Arm) */}
        {/* Head */}
        <circle cx="360" cy="180" r="34" fill="url(#scGreenGrad)" />

        {/* Torso & Sweeping Arm */}
        <path
          d="M 375 215
             C 410 260 420 340 355 400
             C 315 435 265 450 245 455
             C 260 440 285 425 300 405
             C 325 370 330 330 310 290
             C 295 260 275 235 255 220
             C 285 220 315 240 340 260
             C 365 280 375 250 365 225
             Z"
          fill="url(#scGreenGrad)"
        />

        {/* Green Arm Clasp overlay */}
        <path
          d="M 325 405
             C 300 425 260 445 235 445
             C 220 445 200 435 185 420
             C 210 425 240 415 265 400
             C 290 385 310 395 325 405 Z"
          fill="url(#scGreenGrad)"
          stroke="#FFFFFF"
          strokeWidth="6"
        />

        {/* CENTER SPROUTING LEAVES (Hope, Recovery & Growth) */}
        {/* Center Main Leaf */}
        <path
          d="M 250 100
             C 220 160 215 230 250 300
             C 285 230 280 160 250 100 Z"
          fill="url(#scLeafGrad)"
        />
        {/* Center Leaf Rib/Vein */}
        <path
          d="M 250 120 L 250 295"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* Left Sprouting Leaf */}
        <path
          d="M 245 260
             C 210 220 170 215 145 225
             C 175 265 210 280 245 260 Z"
          fill="url(#scGreenGrad)"
        />

        {/* Right Sprouting Leaf */}
        <path
          d="M 255 260
             C 290 220 330 215 355 225
             C 325 265 290 280 255 260 Z"
          fill="url(#scGreenGrad)"
        />
      </svg>

      {/* Optional Typography */}
      {showText && (
        <div className="flex flex-col text-right leading-tight">
          <div className={`font-black text-lg sm:text-xl tracking-tight ${textColor} flex items-center gap-1.5`}>
            <span>الفرصة الثانية</span>
            <span className="text-[11px] font-extrabold text-[#1565C0] bg-blue-50 px-2 py-0.5 rounded-full font-sans border border-blue-100">
              SCP
            </span>
          </div>
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              Second Chance • رعاية، تعافي وحماية
            </p>
          )}
        </div>
      )}
    </div>
  );
};
