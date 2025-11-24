import React from 'react';
import { motion } from 'framer-motion';

const themes = [
    { id: 'default', name: 'Lavender', color: '#6750A4' },
    { id: 'ocean', name: 'Ocean', color: '#006D85' },
    { id: 'rose', name: 'Rose', color: '#9C4146' },
    { id: 'emerald', name: 'Emerald', color: '#006C4C' },
    { id: 'amber', name: 'Amber', color: '#825500' },
];

const ThemeSelector = ({ currentTheme, onSelect }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                justifyContent: 'center'
            }}
        >
            {themes.map((theme) => (
                <button
                    key={theme.id}
                    onClick={() => onSelect(theme.id)}
                    className="clickable"
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: theme.color,
                        border: currentTheme === theme.id ? '3px solid var(--md-sys-color-on-surface)' : 'none',
                        padding: 0,
                        cursor: 'none',
                        boxShadow: 'var(--elevation-1)',
                        transform: currentTheme === theme.id ? 'scale(1.1)' : 'scale(1)',
                    }}
                    title={theme.name}
                />
            ))}
        </motion.div>
    );
};

export default ThemeSelector;
