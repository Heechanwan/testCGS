import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BackgroundGame = ({ onClose }) => {
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [targets, setTargets] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [dangerWaveActive, setDangerWaveActive] = useState(false);
    const gameLoopRef = useRef(null);

    // Calculate difficulty based on score
    const getDifficulty = useCallback(() => {
        const baseSpawnRate = 1500;
        const baseDuration = 3000;
        const difficultyMultiplier = Math.min(score / 100, 2); // Max 2x difficulty at 200 points

        return {
            spawnRate: Math.max(500, baseSpawnRate - difficultyMultiplier * 400), // Faster spawning
            duration: Math.max(1000, baseDuration - difficultyMultiplier * 800), // Shorter duration
            moveChance: Math.min(0.5, difficultyMultiplier * 0.25), // Up to 50% chance to move
            badTargetChance: 0.3 + difficultyMultiplier * 0.1, // More bad targets
        };
    }, [score]);

    // Generate random position
    const getRandomPosition = useCallback(() => {
        const padding = 100;
        return {
            x: padding + Math.random() * (window.innerWidth - padding * 2),
            y: padding + Math.random() * (window.innerHeight - padding * 2),
        };
    }, []);

    // Add new target
    const addTarget = useCallback(() => {
        const difficulty = getDifficulty();
        const rand = Math.random();

        let targetType = 'good'; // good, bad, life

        // Life target - very rare, only if lives < 3
        if (lives < 3 && rand < 0.05) {
            targetType = 'life';
        } else if (rand < difficulty.badTargetChance) {
            targetType = 'bad';
        }

        const shouldMove = Math.random() < difficulty.moveChance;

        const newTarget = {
            id: Date.now() + Math.random(),
            ...getRandomPosition(),
            type: targetType,
            createdAt: Date.now(),
            shouldMove,
            moveAngle: Math.random() * Math.PI * 2,
            moveSpeed: 0.5 + Math.random() * 1,
        };

        setTargets(prev => [...prev, newTarget]);

        // Remove target after duration if not clicked
        setTimeout(() => {
            setTargets(prev => {
                const stillExists = prev.find(t => t.id === newTarget.id);
                if (stillExists && stillExists.type === 'good') {
                    // Missed a good target, lose a life
                    setLives(l => Math.max(0, l - 1));
                }
                return prev.filter(t => t.id !== newTarget.id);
            });
        }, difficulty.duration);
    }, [getRandomPosition, getDifficulty, lives]);

    // Move targets that should move
    useEffect(() => {
        const moveInterval = setInterval(() => {
            setTargets(prev => prev.map(target => {
                if (!target.shouldMove) return target;

                const newX = target.x + Math.cos(target.moveAngle) * target.moveSpeed * 2;
                const newY = target.y + Math.sin(target.moveAngle) * target.moveSpeed * 2;

                // Bounce off edges
                let newAngle = target.moveAngle;
                const padding = 100;
                if (newX < padding || newX > window.innerWidth - padding) {
                    newAngle = Math.PI - newAngle;
                }
                if (newY < padding || newY > window.innerHeight - padding) {
                    newAngle = -newAngle;
                }

                return {
                    ...target,
                    x: Math.max(padding, Math.min(window.innerWidth - padding, newX)),
                    y: Math.max(padding, Math.min(window.innerHeight - padding, newY)),
                    moveAngle: newAngle,
                };
            }));
        }, 50);

        return () => clearInterval(moveInterval);
    }, []);

    // Danger wave - random red wave that blocks clicking
    const triggerDangerWave = useCallback(() => {
        if (dangerWaveActive) return;

        setDangerWaveActive(true);
        const pos = getRandomPosition();

        // Trigger red pulse wave
        window.dispatchEvent(new CustomEvent('start-pulse', {
            detail: { x: pos.x, y: pos.y, color: '#FF0000' }
        }));

        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('stop-pulse'));
            setDangerWaveActive(false);
        }, 2000);
    }, [dangerWaveActive, getRandomPosition]);

    // Game loop - spawn targets and danger waves
    useEffect(() => {
        if (gameOver) return;

        const difficulty = getDifficulty();

        // Spawn targets
        gameLoopRef.current = setInterval(() => {
            addTarget();
        }, difficulty.spawnRate);

        // Random danger waves
        const dangerWaveInterval = setInterval(() => {
            if (Math.random() < 0.15) { // 15% chance every 5 seconds
                triggerDangerWave();
            }
        }, 5000);

        return () => {
            clearInterval(gameLoopRef.current);
            clearInterval(dangerWaveInterval);
        };
    }, [addTarget, gameOver, getDifficulty, triggerDangerWave]);

    // Check game over
    useEffect(() => {
        if (lives <= 0) {
            setGameOver(true);
        }
    }, [lives]);

    // Handle target click
    const handleTargetClick = (target) => {
        // Can't click during danger wave
        if (dangerWaveActive) {
            return;
        }

        if (target.type === 'bad') {
            setLives(prev => Math.max(0, prev - 1));
            // Trigger red pulse
            window.dispatchEvent(new CustomEvent('start-pulse', {
                detail: { x: target.x, y: target.y, color: '#B3261E' }
            }));
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('stop-pulse'));
            }, 500);
        } else if (target.type === 'life') {
            setLives(prev => Math.min(3, prev + 1));
            // Trigger pink ripple
            window.dispatchEvent(new CustomEvent('trigger-ripple', {
                detail: { x: target.x, y: target.y, color: '#FF69B4' }
            }));
        } else {
            setScore(prev => prev + 10);
            // Trigger green ripple
            window.dispatchEvent(new CustomEvent('trigger-ripple', {
                detail: { x: target.x, y: target.y, color: '#4CAF50' }
            }));
        }
        // Remove clicked target
        setTargets(prev => prev.filter(t => t.id !== target.id));
    };

    const handleRestart = () => {
        setScore(0);
        setLives(3);
        setTargets([]);
        setGameOver(false);
        setDangerWaveActive(false);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999,
            pointerEvents: dangerWaveActive ? 'none' : 'auto',
        }}>
            {/* Danger wave overlay */}
            {dangerWaveActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle, rgba(255,0,0,0.5), transparent)',
                        pointerEvents: 'none',
                        zIndex: 998,
                    }}
                />
            )}

            {/* HUD */}
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '40px',
                alignItems: 'center',
                background: 'var(--md-sys-color-surface-container)',
                padding: '15px 30px',
                borderRadius: '50px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                zIndex: 1001,
                pointerEvents: 'auto',
            }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--md-sys-color-primary)' }}>
                    🎯 Счёт: {score}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: lives > 1 ? 'var(--md-sys-color-primary)' : '#B3261E' }}>
                    ❤️ Жизни: {lives}
                </div>
            </div>

            {/* Close button */}
            <button
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--md-sys-color-error)',
                    color: 'var(--md-sys-color-on-error)',
                    fontSize: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    zIndex: 1001,
                    transition: 'transform 0.2s',
                    pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
                ✕
            </button>

            {/* Targets */}
            <AnimatePresence>
                {targets.map(target => (
                    <motion.div
                        key={target.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => handleTargetClick(target)}
                        style={{
                            position: 'fixed',
                            left: target.x - 30,
                            top: target.y - 30,
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: target.type === 'life'
                                ? 'radial-gradient(circle, #FF69B4, #FF1493)'
                                : target.type === 'bad'
                                    ? 'radial-gradient(circle, #FFD700, #FFA500)'
                                    : 'radial-gradient(circle, #FFD700, #FFED4E)',
                            cursor: dangerWaveActive ? 'not-allowed' : 'pointer',
                            boxShadow: target.type === 'life'
                                ? '0 0 20px #FF69B4, 0 0 40px #FF69B4'
                                : target.type === 'bad'
                                    ? '0 0 20px #FF0000, 0 0 40px #FF0000'
                                    : '0 0 20px #FFD700',
                            animation: target.type === 'bad'
                                ? 'pulse-red 0.5s infinite'
                                : target.type === 'life'
                                    ? 'pulse-pink 1s infinite'
                                    : 'none',
                            zIndex: 1000,
                            border: target.type === 'life'
                                ? '3px solid #FF69B4'
                                : target.type === 'bad'
                                    ? '3px solid #FF0000'
                                    : '3px solid #FFD700',
                            pointerEvents: dangerWaveActive ? 'none' : 'auto',
                        }}
                    >
                        {target.type === 'life' && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '30px',
                            }}>
                                ❤️
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Game Over Modal */}
            <AnimatePresence>
                {gameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1002,
                            pointerEvents: 'auto',
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="centered"
                            style={{
                                background: 'var(--md-sys-color-surface)',
                                padding: '40px',
                                borderRadius: '20px',
                                textAlign: 'center',
                                maxWidth: '400px',
                            }}
                        >
                            <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>Игра окончена!</h2>
                            <p style={{ fontSize: '24px', marginBottom: '30px' }}>
                                Ваш счёт: <strong style={{ color: 'var(--md-sys-color-primary)' }}>{score}</strong>
                            </p>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <button onClick={handleRestart} className="btn-primary">
                                    Играть снова
                                </button>
                                <button onClick={onClose} className="btn-danger">
                                    Выход
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CSS for pulsing animations */}
            <style>{`
        @keyframes pulse-red {
          0%, 100% {
            box-shadow: 0 0 20px #FF0000, 0 0 40px #FF0000;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px #FF0000, 0 0 60px #FF0000;
            transform: scale(1.1);
          }
        }
        @keyframes pulse-pink {
          0%, 100% {
            box-shadow: 0 0 20px #FF69B4, 0 0 40px #FF69B4;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px #FF69B4, 0 0 60px #FF69B4;
            transform: scale(1.05);
          }
        }
      `}</style>
        </div>
    );
};

export default BackgroundGame;
