import React, { useState, useEffect } from 'react';

export default function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className = "",
  suffix = "" 
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    const startValue = displayValue;
    const endValue = value;
    const change = endValue - startValue;

    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (change * easeOut));
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    if (value !== displayValue) {
      requestAnimationFrame(animateCount);
    }
  }, [value, duration, displayValue]);

  return (
    <span className={`tabular-nums ${className}`}>
      {displayValue}{suffix}
    </span>
  );
}