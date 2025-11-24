import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CopyrightInfo = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10, x: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10, x: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: '0',
                            backgroundColor: 'var(--md-sys-color-surface-container-high, var(--md-sys-color-surface))',
                            color: 'var(--md-sys-color-on-surface)',
                            padding: '24px',
                            borderRadius: '28px',
                            boxShadow: 'var(--elevation-3)',
                            width: '280px',
                            textAlign: 'left'
                        }}
                    >
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Информация</h4>
                        <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5', color: 'var(--md-sys-color-on-surface)' }}>
                            Этот сайт принадлежит<br />
                            <strong style={{ fontSize: '1.2rem', fontWeight: 500 }}>Куладашеву Анвару</strong>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px', // M3 Large FAB shape
                    border: 'none',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--elevation-3)',
                    fontSize: '1.5rem',
                    fontWeight: 'normal',
                    padding: 0,
                    margin: 0
                }}
            >
                {isOpen ? '✕' : '?'}
            </motion.button>
        </div>
    );
};

export default CopyrightInfo;
