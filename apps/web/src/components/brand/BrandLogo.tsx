import React from 'react';

interface BrandSymbolProps {
  size?: number | string;
  className?: string;
  variant?: 'light' | 'dark';
}

/**
 * Official Kraxyy K Symbol with Diamond Sparkle Star
 */
export const BrandSymbol: React.FC<BrandSymbolProps> = ({
  size = 36,
  className = '',
  variant = 'light'
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <img
        src={variant === 'dark' ? '/app-icon-dark.png' : '/kraxyy-symbol.png'}
        alt="Kraxyy Apply Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to SVG if image loading fails
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Official Kraxyy Apply Full Brand Lockup
 * Symbol + "Kraxyy" + "APPLY" + "Apply Smarter. Go Further."
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showTagline = false,
  variant = 'light',
  size = 'md'
}) => {
  const isDark = variant === 'dark';

  const heights = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  };

  const textSizes = {
    sm: { title: 'text-base', sub: 'text-[9px]', tag: 'text-[9px]' },
    md: { title: 'text-xl', sub: 'text-[10px]', tag: 'text-[11px]' },
    lg: { title: 'text-3xl', sub: 'text-xs', tag: 'text-sm' }
  };

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Brand Icon Mark */}
      <img
        src={isDark ? '/app-icon-dark.png' : '/kraxyy-symbol.png'}
        alt="Kraxyy Apply Mark"
        className={`${heights[size]} w-auto object-contain flex-shrink-0 drop-shadow-xs`}
      />

      {/* Typography Lockup */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline leading-none">
          <span
            className={`font-display font-extrabold tracking-tight ${textSizes[size].title} ${
              isDark ? 'text-cream' : 'text-[#2A3119]'
            }`}
          >
            Kraxyy
          </span>
        </div>

        <div
          className={`font-display font-bold tracking-[0.26em] uppercase ${textSizes[size].sub} ${
            isDark ? 'text-mustard-light' : 'text-[#B18B40]'
          } mt-0.5 leading-none`}
        >
          APPLY
        </div>

        {showTagline && (
          <span
            className={`font-sans font-medium tracking-normal ${textSizes[size].tag} ${
              isDark ? 'text-cream/70' : 'text-[#626B52]'
            } mt-1`}
          >
            Apply Smarter. Go Further.
          </span>
        )}
      </div>
    </div>
  );
};
