export default function DefaultAvatar({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Profile picture"
    >
      <circle cx="50" cy="50" r="50" fill="#D6E4E4" />
      <circle cx="50" cy="38" r="18" fill="#7FA6AC" />
      <path d="M50 60c-19.9 0-36 13.4-36 30v10h72V90c0-16.6-16.1-30-36-30z" fill="#7FA6AC" />
    </svg>
  );
}
