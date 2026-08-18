import React from 'react';

interface BlurFXProps {
  isActive: boolean;
}

export const BlurFX: React.FC<BlurFXProps> = ({ isActive }) => {
  if (!isActive) return null;
  return null;
};
