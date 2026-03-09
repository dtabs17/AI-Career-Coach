export default function AppIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="aicc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#13111e" />
          <stop offset="100%" stopColor="#1e1b35" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7.5" fill="url(#aicc-bg)" />
      <path
        d="M 16,1.2 C 19.8,11.5 20.5,12.2 27.5,16 C 20.5,19.8 19.8,20.5 16,30.8 C 12.2,20.5 11.5,19.8 4.5,16 C 11.5,12.2 12.2,11.5 16,1.2 Z"
        fill="#f59e0b"
      />
    </svg>
  );
}