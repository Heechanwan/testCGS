import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CopyrightInfo = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 2000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10, x: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10, x: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{
                            position: 'absolute',
                            bottom: '60px',
                            right: '0',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text-color)',
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '5px 5px 0px var(--border-color)',
                            border: '3px solid var(--border-color)',
                            width: '280px',
                            textAlign: 'left'
                        }}
                    >
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--primary)' }}>Информация</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                            Этот сайт принадлежит<br />
                            <strong style={{ fontSize: '1.1rem' }}>Куладашеву Анвару</strong>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '3px solid var(--border-color)',
                    backgroundColor: 'var(--info)',
                    color: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '4px 4px 0px var(--border-color)',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    padding: 0,
                    margin: 0
                }}
            >
                {isOpen ? '×' : '?'}
            </motion.button>
        </div>
    );
};

export default CopyrightInfo;
