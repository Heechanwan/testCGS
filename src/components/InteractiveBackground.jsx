import React, { useEffect, useRef } from 'react';

const InteractiveBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let points = [];
        const spacing = 25; // Spacing between dots
        const radius = 1; // Dot radius
        const interactionRadius = 150; // Radius of mouse influence
        const strength = 0.5; // How strongly they pull towards mouse

        let mouse = { x: -1000, y: -1000 };

        // Helper to get current theme colors
        const getThemeColors = () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            // Use hardcoded colors matching index.css to avoid getComputedStyle perf hit
            const dotColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
            return { dotColor };
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initPoints();
        };

        const initPoints = () => {
            points = [];
            for (let x = 0; x < canvas.width + spacing; x += spacing) {
                for (let y = 0; y < canvas.height + spacing; y += spacing) {
                    points.push({
                        x: x,
                        y: y,
                        originX: x,
                        originY: y,
                        vx: 0,
                        vy: 0
                    });
                }
            }
        };

        const draw = () => {
            const { dotColor } = getThemeColors();

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = dotColor;

            points.forEach(point => {
                // Distance to mouse
                const dx = mouse.x - point.originX;
                const dy = mouse.y - point.originY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let targetX = point.originX;
                let targetY = point.originY;

                if (dist < interactionRadius) {
                    // Magnet effect: pull towards mouse
                    const force = (interactionRadius - dist) / interactionRadius;

                    targetX = point.originX + dx * force * strength;
                    targetY = point.originY + dy * force * strength;
                }

                // Smooth movement (ease out)
                point.x += (targetX - point.x) * 0.1;
                point.y += (targetY - point.y) * 0.1;

                ctx.beginPath();
                ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none' // Let clicks pass through
            }}
        />
    );
};

export default InteractiveBackground;
