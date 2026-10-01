import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ConnectModal } from './ConnectModal';

interface ConnectWidgetProps {
  source?: string;
  defaultCategory?: string;
}

export const ConnectWidget: React.FC<ConnectWidgetProps> = ({
  source = 'website',
  defaultCategory = 'Website'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Bottom-Right Connect Pill Button */}
      <aside
        aria-label="Contact Support"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40"
      >
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Connect with Kraxyy"
          className="group flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-olive text-cream hover:bg-olive-hover active:scale-95 shadow-elevated transition-all duration-200 cursor-pointer border border-olive/30 hover:border-olive font-sans select-none"
        >
          {/* Status-style dot (Green) */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>

          {/* Label */}
          <span className="text-xs sm:text-sm font-semibold tracking-tight text-white/95 group-hover:text-white transition-colors">
            Connect
          </span>

          {/* Arrow */}
          <ArrowRight className="w-3.5 h-3.5 text-mustard transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </aside>

      {/* Connect Modal */}
      <ConnectModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultCategory={defaultCategory}
        source={source}
      />
    </>
  );
};
