import React from 'react';

// Authentic macOS Squircle SVG helper
export function MacAppIcon({ id, size = 52, className = '' }) {
  const now = new Date();
  const dayStr = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dateNum = now.getDate();

  switch (id) {
    case 'finder':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="finderBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38A5F8" />
              <stop offset="100%" stopColor="#1268C8" />
            </linearGradient>
            <linearGradient id="finderLeft" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#67C2FB" />
              <stop offset="100%" stopColor="#2588E5" />
            </linearGradient>
            <linearGradient id="finderRight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1B71CE" />
              <stop offset="100%" stopColor="#0B4B9C" />
            </linearGradient>
          </defs>
          {/* Base Squircle */}
          <rect width="100" height="100" rx="22" fill="url(#finderBg)" />
          {/* Left / Right face split */}
          <path d="M 0 22 C 0 9.8 9.8 0 22 0 L 50 0 L 50 100 L 22 100 C 9.8 100 0 90.2 0 78 Z" fill="url(#finderLeft)" />
          <path d="M 50 0 L 78 0 C 90.2 0 100 9.8 100 22 L 100 78 C 100 90.2 90.2 100 78 100 L 50 100 Z" fill="url(#finderRight)" />
          {/* Eyes */}
          <ellipse cx="32" cy="38" rx="4.5" ry="7" fill="#1C3854" />
          <ellipse cx="68" cy="38" rx="4.5" ry="7" fill="#1C3854" />
          {/* Center Dividing Nose & Smile */}
          <path
            d="M 50 20 C 47 38 46 44 43 47 C 39 50 32 50 32 50"
            stroke="#1C3854"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 28 64 C 36 78 64 78 72 64"
            stroke="#1C3854"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case 'mail':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="mailBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2A98FB" />
              <stop offset="100%" stopColor="#0B56D0" />
            </linearGradient>
            <linearGradient id="flapGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#mailBg)" />
          {/* Envelope Body */}
          <rect x="18" y="28" width="64" height="46" rx="6" fill="#F8FAFC" />
          {/* Flap lines */}
          <path d="M 19 30 L 50 54 L 81 30" fill="url(#flapGrad)" stroke="#CBD5E1" strokeWidth="2" strokeLinejoin="round" />
          {/* Subtle postmark stamp */}
          <circle cx="68" cy="40" r="6" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2,2" />
          <path d="M 20 72 L 44 48" stroke="#E2E8F0" strokeWidth="2" />
          <path d="M 80 72 L 56 48" stroke="#E2E8F0" strokeWidth="2" />
        </svg>
      );

    case 'calendar':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="calBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
          {/* White Card */}
          <rect width="100" height="100" rx="22" fill="url(#calBg)" />
          {/* Red Header Bar */}
          <path d="M 0 22 C 0 9.8 9.8 0 22 0 L 78 0 C 90.2 0 100 9.8 100 22 L 100 28 L 0 28 Z" fill="#EF4444" />
          {/* Weekday abbreviation */}
          <text
            x="50"
            y="21"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="bold"
            fontFamily="-apple-system, SF Pro Text, sans-serif"
            textAnchor="middle"
            letterSpacing="1"
          >
            {dayStr}
          </text>
          {/* Day Date number */}
          <text
            x="50"
            y="76"
            fill="#1E293B"
            fontSize="46"
            fontWeight="300"
            fontFamily="-apple-system, SF Pro Display, Helvetica Neue, sans-serif"
            textAnchor="middle"
          >
            {dateNum}
          </text>
        </svg>
      );

    case 'documents':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="docBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#docBg)" />
          {/* Notepad sheet */}
          <rect x="22" y="18" width="56" height="66" rx="4" fill="#FEF3C7" />
          {/* Top header strip */}
          <rect x="22" y="18" width="56" height="12" rx="2" fill="#FBBF24" />
          {/* Ruled lines */}
          <line x1="30" y1="40" x2="70" y2="40" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="30" y1="50" x2="70" y2="50" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="30" y1="60" x2="70" y2="60" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="30" y1="70" x2="55" y2="70" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    case 'chat':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="msgBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#msgBg)" />
          {/* Speech Bubble */}
          <path
            d="M 24 46 C 24 33 36 24 51 24 C 66 24 78 33 78 46 C 78 59 66 68 51 68 C 46 68 41 67 37 65 L 25 71 L 28 60 C 25 56 24 51 24 46 Z"
            fill="#FFFFFF"
          />
          {/* Three green dots */}
          <circle cx="42" cy="46" r="3.5" fill="#16A34A" />
          <circle cx="51" cy="46" r="3.5" fill="#16A34A" />
          <circle cx="60" cy="46" r="3.5" fill="#16A34A" />
        </svg>
      );

    case 'tasks':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="tasksBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#tasksBg)" />
          {/* Blue bullet */}
          <circle cx="32" cy="35" r="5" fill="#3B82F6" />
          <rect x="44" y="32" width="34" height="6" rx="3" fill="#64748B" />
          {/* Red bullet */}
          <circle cx="32" cy="50" r="5" fill="#EF4444" />
          <rect x="44" y="47" width="28" height="6" rx="3" fill="#64748B" />
          {/* Amber bullet */}
          <circle cx="32" cy="65" r="5" fill="#F59E0B" />
          <rect x="44" y="62" width="32" height="6" rx="3" fill="#64748B" />
        </svg>
      );

    case 'shared-drive':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="driveBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#driveBg)" />
          {/* Metallic Disk Plate */}
          <rect x="20" y="28" width="60" height="44" rx="6" fill="url(#plate)" stroke="#475569" strokeWidth="2" />
          {/* Horizontal slot */}
          <rect x="28" y="46" width="44" height="4" rx="2" fill="#1E293B" />
          {/* Status LEDs */}
          <circle cx="66" cy="36" r="2.5" fill="#10B981" />
          <circle cx="60" cy="36" r="2.5" fill="#38BDF8" />
        </svg>
      );

    case 'activity-monitor':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="actBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#actBg)" />
          {/* Grid lines */}
          <line x1="20" y1="35" x2="80" y2="35" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="20" y1="65" x2="80" y2="65" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="35" y1="20" x2="35" y2="80" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="50" y1="20" x2="50" y2="80" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="65" y1="20" x2="65" y2="80" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
          {/* Green ECG Heartbeat line */}
          <path
            d="M 18 50 L 34 50 L 40 30 L 46 72 L 52 38 L 58 56 L 64 50 L 82 50"
            fill="none"
            stroke="#22C55E"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="setBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="gearMetal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#setBg)" />
          {/* Cogwheel */}
          <g transform="translate(50,50)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
              <rect
                key={deg}
                x="-4"
                y="-27"
                width="8"
                height="12"
                rx="2"
                fill="url(#gearMetal)"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="20" fill="url(#gearMetal)" />
            <circle cx="0" cy="0" r="9" fill="#334155" />
          </g>
        </svg>
      );

    case 'trash':
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" className={`drop-shadow-md ${className}`}>
          <defs>
            <linearGradient id="trashBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="22" fill="url(#trashBg)" />
          {/* Wire Wastebasket Body */}
          <path
            d="M 28 36 L 34 76 C 34.5 79 37 81 40 81 L 60 81 C 63 81 65.5 79 66 76 L 72 36 Z"
            fill="#475569"
            stroke="#94A3B8"
            strokeWidth="2"
          />
          {/* Basket Rim */}
          <ellipse cx="50" cy="35" rx="23" ry="5" fill="#334155" stroke="#94A3B8" strokeWidth="2" />
          {/* Vertical mesh bars */}
          <line x1="42" y1="38" x2="44" y2="77" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="50" y1="39" x2="50" y2="78" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="58" y1="38" x2="56" y2="77" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Crumpled paper peeking */}
          <circle cx="48" cy="31" r="5" fill="#F8FAFC" />
          <circle cx="54" cy="30" r="4" fill="#F1F5F9" />
        </svg>
      );

    default:
      return (
        <div
          style={{ width: size, height: size }}
          className={`rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md ${className}`}
        >
          {id?.slice(0, 2).toUpperCase()}
        </div>
      );
  }
}

