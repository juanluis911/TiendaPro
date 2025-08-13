// src/components/common/TooltipWrapper.tsx
import React from 'react';
import { Tooltip, TooltipProps } from '@mui/material';

interface TooltipWrapperProps extends Omit<TooltipProps, 'children'> {
  children: React.ReactElement;
  disabled?: boolean;
}

/**
 * Wrapper para Tooltip que maneja correctamente elementos disabled
 * Envuelve automáticamente el children en un span cuando está disabled
 */
const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ 
  children, 
  disabled = false, 
  ...tooltipProps 
}) => {
  // Si el elemento está disabled, envolver en span
  if (disabled || children.props.disabled) {
    return (
      <Tooltip {...tooltipProps}>
        <span style={{ display: 'inline-block' }}>
          {children}
        </span>
      </Tooltip>
    );
  }

  // Si no está disabled, usar normalmente
  return (
    <Tooltip {...tooltipProps}>
      {children}
    </Tooltip>
  );
};

export default TooltipWrapper;