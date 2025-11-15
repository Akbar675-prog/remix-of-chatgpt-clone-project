import React from 'react';

const FooterDisclaimer = () => {
  return (
    <div
      className="relative mt-auto flex min-h-8 w-full items-center justify-center p-2 text-center text-xs text-text-secondary md:px-[60px]"
      style={{ viewTransitionName: 'var(--vt-disclaimer)' }}
    >
      <span className="pointer-events-auto text-sm leading-none">
        By messaging Swampy, an AI chatbot, youre accepting to out Term, thank for using our service
      </span>
    </div>
  );
};

export default FooterDisclaimer;