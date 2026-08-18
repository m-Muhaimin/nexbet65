import React from 'react';
import { SVG_DEFS } from '../utils/cardVisuals';

export const CardDefs: React.FC = () => {
  return (
    <div
      id="cardSvgDefsContainer"
      className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0 select-none z-[-1]"
      dangerouslySetInnerHTML={{ __html: SVG_DEFS }}
    />
  );
};
