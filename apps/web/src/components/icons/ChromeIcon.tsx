import React from 'react';

interface ChromeIconProps {
  className?: string;
}

export const ChromeIcon: React.FC<ChromeIconProps> = ({ className = 'w-4 h-4' }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Chrome Red Wedge */}
      <path
        d="M24 9.5H42.5C38.7 3.8 31.8 0 24 0C16.6 0 10 3.5 5.9 9L15.1 25L24 9.5Z"
        fill="#EA4335"
      />
      {/* Chrome Green Wedge */}
      <path
        d="M9.5 24C9.5 21.4 10.1 18.9 11.2 16.7L2 9C0.7 13.5 0 18.6 0 24C0 35.2 7.6 44.6 17.9 47.3L26.9 31.8C20.6 31.8 15.5 26.7 15.5 20.4C15.5 19.3 15.7 18.2 16.1 17.2L9.5 24Z"
        fill="#34A853"
      />
      {/* Chrome Yellow Wedge */}
      <path
        d="M48 24C48 21.6 47.6 19.3 46.9 17.1H28.7L37.9 33C40.6 30.5 42.5 26.9 42.5 24H48ZM24 48C31.5 48 38.2 44.4 42.3 38.8L33.1 22.8C32.1 28.5 27.2 32.8 21.2 32.8C18.6 32.8 16.2 31.9 14.3 30.4L5.2 46.1C10.7 50.1 17.3 48 24 48Z"
        fill="#FBBC05"
      />
      {/* Chrome White Ring */}
      <circle cx="24" cy="24" r="11" fill="#FFFFFF" />
      {/* Chrome Blue Center */}
      <circle cx="24" cy="24" r="8.5" fill="#1A73E8" />
    </svg>
  );
};
