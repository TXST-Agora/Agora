/**
 * Agora Logo SVG Component
 */

type AgoraLogoProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
};

export const AgoraLogo = ({ width = 40, height = 40, className }: AgoraLogoProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 260 260"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Agora Logo"
    >
      <g>
        {/* 0: top green */}
        <circle cx="130.0" cy="30.0" r="12" fill="#16a34a" />
        {/* 1 */}
        <circle cx="164.2" cy="36.0" r="14" fill="#199a4a" />
        {/* 2 */}
        <circle cx="194.3" cy="53.4" r="16" fill="#1c8f4c" />
        {/* 3 */}
        <circle cx="216.6" cy="80.0" r="14" fill="#1f824f" />
        {/* 4 */}
        <circle cx="228.5" cy="112.6" r="12" fill="#237555" />
        {/* 5 */}
        <circle cx="228.5" cy="147.4" r="10" fill="#235f5f" />
        {/* 6 */}
        <circle cx="216.6" cy="180.0" r="8" fill="#214c63" />
        {/* 7 */}
        <circle cx="194.3" cy="206.6" r="8" fill="#1c385f" />
        {/* 8 */}
        <circle cx="164.2" cy="224.0" r="10" fill="#142650" />
        {/* 9: bottom navy */}
        <circle cx="130.0" cy="230.0" r="12" fill="#0f172a" />
        {/* 10 */}
        <circle cx="95.8" cy="224.0" r="14" fill="#142650" />
        {/* 11 */}
        <circle cx="65.7" cy="206.6" r="16" fill="#1c385f" />
        {/* 12 */}
        <circle cx="43.4" cy="180.0" r="14" fill="#214c63" />
        {/* 13 */}
        <circle cx="31.5" cy="147.4" r="12" fill="#235f5f" />
        {/* 14 */}
        <circle cx="31.5" cy="112.6" r="10" fill="#237555" />
        {/* 15 */}
        <circle cx="43.4" cy="80.0" r="8" fill="#1f824f" />
        {/* 16 */}
        <circle cx="65.7" cy="53.4" r="8" fill="#1c8f4c" />
        {/* 17 */}
        <circle cx="95.8" cy="36.0" r="10" fill="#199a4a" />
      </g>
    </svg>
  );
};

