'use client';

import React from 'react';

export const SafeImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(function SafeImage(props, ref) {
  const { onError, ...rest } = props;

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    if (onError) {
      onError(e);
    } else {
      (e.target as HTMLImageElement).style.display = 'none';
    }
  };

  return <img ref={ref} {...rest} onError={handleError} />;
});
