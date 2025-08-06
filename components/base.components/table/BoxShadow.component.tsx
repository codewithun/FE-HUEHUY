import React, { useEffect, useRef, useState } from 'react';

export type boxShadowProps = {
  children: any;
  className?: string;
  onScroll?: (e: any) => void;
};

export function BoxShadowComponent({
  children,
  className,
  onScroll,
}: boxShadowProps) {
  const [shadow, setShadow] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current as HTMLDivElement;

      if (el.scrollWidth != el.offsetWidth) {
        setShadow('right');
      }
    }
  }, [scrollRef]);

  return (
    <div
      ref={scrollRef}
      className={`
        w-full overflow-x-auto scroll_control pb-2
        shadow__${shadow} 
        ${className && className}
      `}
      onScroll={(e) => {
        const elTarget = e.target as HTMLDivElement;
        if (elTarget.scrollLeft <= 0) {
          setShadow('right');
        } else if (
          elTarget.scrollLeft + elTarget.offsetWidth >=
          elTarget.scrollWidth - 1
        ) {
          setShadow('left');
        } else {
          setShadow('left__right');
        }

        onScroll?.(e);
      }}
    >
      {children}
    </div>
  );
}
