import React from 'react';

export const BrandSymbol: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = ''
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <img
        src="icons/icon48.png"
        alt="Kraxyy Apply"
        className="w-full h-full object-contain rounded-md"
      />
    </div>
  );
};

export const BrandLogo: React.FC<{ size?: 'sm' | 'md'; className?: string }> = ({
  size = 'sm',
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img
        src="icons/icon48.png"
        alt="Kraxyy Apply"
        className="w-7 h-7 object-contain rounded-lg flex-shrink-0"
      />
      <div className="flex flex-col justify-center leading-none">
        <span className="font-extrabold text-[13px] text-olive tracking-tight uppercase font-display">
          KRAXYY
        </span>
        <span className="font-bold text-[8px] tracking-[0.25em] text-[#B18B40] uppercase mt-0.5">
          APPLY
        </span>
      </div>
    </div>
  );
};
