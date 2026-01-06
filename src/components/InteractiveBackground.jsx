import React, { useEffect, useRef } from 'react';

const InteractiveBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let points = [];
        let waves = []; // Array to store active waves {x, y, startTime, color?, isPulse?}
        const spacing = 25;
        const radius = 2;
        const interactionRadius = 150;
        const mouseStrength = 1;

        // Wave parameters
        const waveSpeed = 0.5; // Pixels per ms
        const waveFrequency = 0.05;
        const waveAmplitude = 15;
        const waveWidth = 200; // Width of the ripple packet

        // Pulse wave parameters (more intense)
        const pulseWaveSpeed = 0.7; // Faster
        const pulseWaveFrequency = 0.08; // More frequent oscillations
        const pulseWaveAmplitude = 25; // Stronger displacement
        const pulseWaveWidth = 250; // Wider effect

        // Pulsing state
        let pulseInterval = null;
        let pulseSource = null; // {x, y, color}

        let mouse = { x: -1000, y: -1000 };
        let performanceRatio = null; // 0 (bad/red) to 1 (good/green), null = default


        const getThemeColors = () => {
            const styles = getComputedStyle(document.documentElement);
            const dotColor = styles.getPropertyValue('--md-sys-color-outline-variant').trim() || 'rgba(0,0,0,0.2)';
            const activeGray = styles.getPropertyValue('--md-sys-color-on-surface').trim() || '#000';
            return { dotColor, activeGray };
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initPoints();
        };

        // Added null to represent the "default/gray" color in the active palette
        const googleColors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', null];

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
                        vy: 0,
                        color: googleColors[Math.floor(Math.random() * googleColors.length)]
                    });
                }
            }
        };

        const draw = () => {
            const { dotColor, activeGray } = getThemeColors();
            const now = Date.now();
            // Calculate max distance to corner to know when to remove wave
            const maxDist = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) + 200;

            // Determine base dot color based on performance
            let currentDotColor = dotColor;
            if (performanceRatio !== null) {
                // Interpolate between Red (bad) and Green (good)
                // Red: 255, 0, 0
                // Green: 76, 175, 80 (Material Green 500)

                const r = Math.round(255 - (performanceRatio * (255 - 76)));
                const g = Math.round(0 + (performanceRatio * 175));
                const b = Math.round(0 + (performanceRatio * 80));

                // Opacity 0.2 like default
                currentDotColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Filter out old waves
            waves = waves.filter(wave => {
                const traveled = (now - wave.startTime) * waveSpeed;
                return traveled < maxDist;
            });

            points.forEach(point => {
                // 1. Mouse Interaction
                const dx = mouse.x - point.originX;
                const dy = mouse.y - point.originY;
                const distMouse = Math.sqrt(dx * dx + dy * dy);

                let targetX = point.originX;
                let targetY = point.originY;
                let active = false;
                let forcedColor = null;

                // Mouse magnet effect
                if (distMouse < interactionRadius) {
                    const force = (interactionRadius - distMouse) / interactionRadius;
                    targetX += dx * force * mouseStrength;
                    targetY += dy * force * mouseStrength;
                    active = true;
                }

                // 2. Wave Interaction
                waves.forEach(wave => {
                    const dxW = point.originX - wave.x;
                    const dyW = point.originY - wave.y;
                    const distW = Math.sqrt(dxW * dxW + dyW * dyW);

                    // Use different parameters for pulse waves
                    const speed = wave.isPulse ? pulseWaveSpeed : waveSpeed;
                    const frequency = wave.isPulse ? pulseWaveFrequency : waveFrequency;
                    const amplitude = wave.isPulse ? pulseWaveAmplitude : waveAmplitude;
                    const width = wave.isPulse ? pulseWaveWidth : waveWidth;

                    const traveled = (now - wave.startTime) * speed;
                    const distFromWaveFront = distW - traveled;

                    // Only affect points within the "wave packet" range
                    if (Math.abs(distFromWaveFront) < width) {
                        // Sine wave function for ripple effect
                        // We use a Gaussian window to taper the wave packet edges smoothly
                        const x = distFromWaveFront;
                        // Gaussian envelope: exp(-x^2 / (2*sigma^2))
                        // sigma = width / 3 ensures it decays to near 0 at edges
                        const envelope = Math.exp(-(x * x) / (2 * (width / 3) ** 2));
                        const displacement = Math.sin(x * frequency) * amplitude * envelope;

                        const angle = Math.atan2(dyW, dxW);

                        // Move point radially
                        targetX += Math.cos(angle) * displacement;
                        targetY += Math.sin(angle) * displacement;

                        // Activate color if displacement is significant
                        if (Math.abs(displacement) > 2) {
                            active = true;
                            if (wave.color) {
                                forcedColor = wave.color;
                            }
                        }
                    }
                });

                // Smooth movement
                point.x += (targetX - point.x) * 0.1;
                point.y += (targetY - point.y) * 0.1;

                ctx.beginPath();
                ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);

                // Color logic
                if (active) {
                    ctx.fillStyle = forcedColor || mouseColor || point.color || activeGray;
                } else {
                    ctx.fillStyle = currentDotColor;
                }

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

        const handleTriggerRipple = (e) => {
            const { x, y, color } = e.detail;
            waves.push({
                x,
                y,
                startTime: Date.now(),
                color // Store the specific color for this wave
            });
        };

        let mouseColor = null;
        const handleUpdateMouseColor = (e) => {
            mouseColor = e.detail.color;
        };

        const handleStartPulse = (e) => {
            const { x, y, color } = e.detail;

            // Stop any existing pulse
            if (pulseInterval) {
                clearInterval(pulseInterval);
            }

            // Store pulse source
            pulseSource = { x, y, color };

            // Create initial pulse
            waves.push({
                x,
                y,
                startTime: Date.now(),
                color,
                isPulse: true
            });

            // Create pulse every 2 seconds
            pulseInterval = setInterval(() => {
                if (pulseSource) {
                    waves.push({
                        x: pulseSource.x,
                        y: pulseSource.y,
                        startTime: Date.now(),
                        color: pulseSource.color,
                        isPulse: true
                    });
                }
            }, 2000);
        };

        const handleStopPulse = () => {
            if (pulseInterval) {
                clearInterval(pulseInterval);
                pulseInterval = null;
            }
            pulseSource = null;
        };

        const handleUpdatePerformance = (e) => {
            performanceRatio = e.detail.ratio;
        };

        const handleClick = (e) => {
            // Ignore clicks on interactive elements or containers
            if (e.target.closest('button, input, label, a, .centered, .card')) {
                return;
            }

            waves.push({
                x: e.clientX,
                y: e.clientY,
                startTime: Date.now()
                // No color specified -> use point's own random color
            });
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);
        window.addEventListener('click', handleClick);
        window.addEventListener('trigger-ripple', handleTriggerRipple);
        window.addEventListener('update-mouse-color', handleUpdateMouseColor);
        window.addEventListener('start-pulse', handleStartPulse);
        window.addEventListener('start-pulse', handleStartPulse);
        window.addEventListener('stop-pulse', handleStopPulse);
        window.addEventListener('update-performance', handleUpdatePerformance);

        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('trigger-ripple', handleTriggerRipple);
            window.removeEventListener('update-mouse-color', handleUpdateMouseColor);
            window.removeEventListener('start-pulse', handleStartPulse);
            window.removeEventListener('start-pulse', handleStartPulse);
            window.removeEventListener('stop-pulse', handleStopPulse);
            window.removeEventListener('update-performance', handleUpdatePerformance);
            if (pulseInterval) {
                clearInterval(pulseInterval);
            }
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
