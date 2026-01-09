/**
 * Apple Touch Icon
 * 
 * Defines the iOS home screen icon.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { ImageResponse } from 'next/og';

/**
 * Icon configuration for Apple devices
 */
export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

/**
 * Generate Apple icon
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="header" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <rect x="0" y="0" width="256" height="256" rx="48" fill="#e0e7ff"/>
        <rect x="28" y="68" width="200" height="148" rx="12" fill="white"/>
        <rect x="28" y="68" width="200" height="36" rx="12" fill="url(#header)"/>
        <rect x="28" y="92" width="200" height="20" fill="url(#header)"/>
        
        <g>
          <rect x="28" y="104" width="28" height="112" fill="#f3f4f6" opacity="0.7"/>
          <rect x="200" y="104" width="28" height="112" fill="#f3f4f6" opacity="0.7"/>
          
          <rect x="36" y="120" width="20" height="20" rx="4" fill="#e5e5e5"/>
          <rect x="64" y="120" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="92" y="120" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="120" y="120" width="20" height="20" rx="4" fill="#fbbf24"/>
          <rect x="148" y="120" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="176" y="120" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="204" y="120" width="20" height="20" rx="4" fill="#e5e5e5"/>
          
          <rect x="36" y="148" width="20" height="20" rx="4" fill="#e5e5e5"/>
          <rect x="64" y="148" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="92" y="148" width="20" height="20" rx="4" fill="#a78bfa"/>
          <rect x="120" y="148" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="148" y="148" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="176" y="148" width="20" height="20" rx="4" fill="#10b981"/>
          <rect x="204" y="148" width="20" height="20" rx="4" fill="#e5e5e5"/>
          
          <rect x="36" y="176" width="20" height="20" rx="4" fill="#e5e5e5"/>
          <rect x="64" y="176" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="92" y="176" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="120" y="176" width="20" height="20" rx="4" fill="#ec4899"/>
          <rect x="148" y="176" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="176" y="176" width="20" height="20" rx="4" fill="#bfdbfe"/>
          <rect x="204" y="176" width="20" height="20" rx="4" fill="#e5e5e5"/>
        </g>
        
        <g>
          <rect x="20" y="24" width="108" height="36" rx="18" fill="#3b82f6"/>
          <path d="M 28 60 L 40 60 L 34 72 Z" fill="#3b82f6"/>
          <circle cx="48" cy="42" r="5" fill="white"/>
          <circle cx="66" cy="42" r="5" fill="white"/>
          <circle cx="84" cy="42" r="5" fill="white"/>
        </g>
        
        <g opacity="0.95">
          <rect x="148" y="224" width="88" height="28" rx="14" fill="#10b981"/>
          <path d="M 168 238 L 176 246 L 192 230" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      </svg>
    ),
    {
      ...size,
    }
  );
}
