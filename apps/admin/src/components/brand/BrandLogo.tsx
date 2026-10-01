import React from 'react';

interface BrandSymbolProps {
  size?: number | string;
  className?: string;
  variant?: 'light' | 'dark';
}

export const BrandSymbol: React.FC<BrandSymbolProps> = ({
  size = 32,
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
        alt="Kraxyy Apply"
        className="w-full h-full object-contain"
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

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showTagline = false,
  variant = 'light',
  size = 'md'
}) => {
  const isDark = variant === 'dark';

  const heights = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12'
  };

  const textSizes = {
    sm: { title: 'text-sm', sub: 'text-[8px]', tag: 'text-[8px]' },
    md: { title: 'text-lg', sub: 'text-[9px]', tag: 'text-[10px]' },
    lg: { title: 'text-2xl', sub: 'text-xs', tag: 'text-xs' }
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={isDark ? '/app-icon-dark.png' : '/kraxyy-symbol.png'}
        alt="Kraxyy Apply"
        className={`${heights[size]} w-auto object-contain flex-shrink-0`}
      />
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline leading-none">
          <span
            className={`font-bold tracking-tight ${textSizes[size].title} ${
              isDark ? 'text-cream' : 'text-[#2A3119]'
            }`}
          >
            Kraxyy
          </span>
        </div>
        <div
          className={`font-bold tracking-[0.22em] uppercase ${textSizes[size].sub} ${
            isDark ? 'text-mustard-light' : 'text-[#B18B40]'
          } mt-0.5 leading-none`}
        >
          APPLY
        </div>
        {showTagline && (
          <span className={`text-[10px] ${isDark ? 'text-cream/70' : 'text-[#626B52]'} mt-0.5`}>
            Apply Smarter. Go Further.
          </span>
        )}
      </div>
    </div>
  );
};
