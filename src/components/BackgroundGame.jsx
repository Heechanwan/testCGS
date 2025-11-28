import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BackgroundGame = ({ onClose }) => {
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [targets, setTargets] = useState([]);
    const [gameOver, setGameOver] = useState(false);

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
        const isBad = Math.random() < 0.3; // 30% chance of bad target
        const newTarget = {
            id: Date.now() + Math.random(),
            ...getRandomPosition(),
            isBad,
            createdAt: Date.now(),
        };
        setTargets(prev => [...prev, newTarget]);

        // Remove target after 3 seconds if not clicked
        setTimeout(() => {
            setTargets(prev => {
                const stillExists = prev.find(t => t.id === newTarget.id);
                if (stillExists && !stillExists.isBad) {
                    // Missed a good target, lose a life
                    setLives(l => Math.max(0, l - 1));
                }
                return prev.filter(t => t.id !== newTarget.id);
            });
        }, 3000);
    }, [getRandomPosition]);

    // Game loop - spawn targets
    useEffect(() => {
        if (gameOver) return;

        const interval = setInterval(() => {
            addTarget();
        }, 1500); // New target every 1.5 seconds

        return () => clearInterval(interval);
    }, [addTarget, gameOver]);

    // Check game over
    useEffect(() => {
        if (lives <= 0) {
            setGameOver(true);
        }
    }, [lives]);

    // Handle target click
    const handleTargetClick = (target) => {
        if (target.isBad) {
            setLives(prev => Math.max(0, prev - 1));
            // Trigger red pulse
            window.dispatchEvent(new CustomEvent('start-pulse', {
                detail: { x: target.x, y: target.y, color: '#B3261E' }
            }));
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('stop-pulse'));
            }, 500);
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
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999,
            pointerEvents: 'auto',
        }}>
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
                            background: target.isBad
                                ? 'radial-gradient(circle, #FFD700, #FFA500)'
                                : 'radial-gradient(circle, #FFD700, #FFED4E)',
                            cursor: 'pointer',
                            boxShadow: target.isBad
                                ? '0 0 20px #FF0000, 0 0 40px #FF0000'
                                : '0 0 20px #FFD700',
                            animation: target.isBad ? 'pulse-red 0.5s infinite' : 'none',
                            zIndex: 1000,
                            border: target.isBad ? '3px solid #FF0000' : '3px solid #FFD700',
                        }}
                    />
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

            {/* CSS for pulsing animation */}
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
      `}</style>
        </div>
    );
};

export default BackgroundGame;
