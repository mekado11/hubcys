import React, { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  // FIX: Added proper dependency array to prevent infinite re-renders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.pulse = Math.random() * 0.02 + 0.01;
        this.pulseDirection = 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Pulse effect
        this.opacity += this.pulse * this.pulseDirection;
        if (this.opacity <= 0.1 || this.opacity >= 0.6) {
          this.pulseDirection *= -1;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${this.opacity})`;
        ctx.fill();
        
        // Add a subtle glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(6, 182, 212, ${this.opacity * 0.5})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Create particles
    const createParticles = () => {
      const particleCount = Math.min(50, Math.floor(canvas.width * canvas.height / 15000));
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(new Particle());
      }
    };

    createParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // FIX: Empty dependency array - run only once on mount

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}