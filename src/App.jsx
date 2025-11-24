import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import ClassSelect from './components/ClassSelect';
import NameInput from './components/NameInput';
import Test from './components/Test';
import Profile from './components/Profile';
import Admin from './components/Admin';
import InteractiveBackground from './components/InteractiveBackground';


const HomeSelection = ({ navigate, onLogout }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="centered">
        <h2>Выберите действие</h2>
        <div>
            <button onClick={() => navigate('/classes')}>
                Начать тестирование (Ученик)
            </button>
            <button onClick={() => navigate('/admin')} className="btn-info">
                Панель Админа
            </button>
        </div>
        <button
            onClick={onLogout}
            className="btn-danger"
            style={{ marginTop: '30px' }}
        >
            Выход
        </button>
    </motion.div>
);
// -------------------------------------------------------------------------

function App() {
    const [passwordEntered, setPasswordEntered] = useState(() => {
        return localStorage.getItem('auth') === 'true';
    });
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('auth', passwordEntered);
    }, [passwordEntered]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        const password = e.target.password.value;
        if (password === '9748') {
            setPasswordEntered(true);
            navigate('/home');
        } else {
            alert('Неверный пароль');
        }
    };

    const handleLogout = () => {
        setPasswordEntered(false);
        navigate('/');
    };

    // Компонент для отображения формы входа
    const PasswordForm = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="centered"
        >
            <form onSubmit={handlePasswordSubmit}>
                <label>Введите пароль</label>
                <input type="password" name="password" />
                <button type="submit">Войти</button>
            </form>
        </motion.div>
    );

    // Вспомогательный компонент для защиты роутов
    const ProtectedRoute = ({ element }) => {
        return passwordEntered ? element : <Navigate to="/" replace />;
    };

    // Logic for back button visibility
    // Hide on: Login (/), Home (/home), Test (/test/...)
    const showBackButton = location.pathname !== '/' &&
        location.pathname !== '/home' &&
        !location.pathname.startsWith('/test/');

    return (
        <div className="app">
            <InteractiveBackground />
            {/* Navigation Controls */}
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
                {showBackButton && (
                    <button onClick={() => navigate(-1)} style={{ margin: 0 }}>
                        Назад
                    </button>
                )}
                <button onClick={toggleTheme} style={{ margin: 0 }}>
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>

            <Routes>
                {/* 1. Главная страница (форма входа) */}
                <Route path="/" element={passwordEntered ? <Navigate to="/home" replace /> : <PasswordForm />} />

                {/* 2. Роуты, доступные ТОЛЬКО после успешного входа (Protected Routes) */}

                {/* Домашняя страница (выбор Ученик/Админ) с кнопкой выхода */}
                <Route
                    path="/home"
                    element={<ProtectedRoute
                        element={<HomeSelection navigate={navigate} onLogout={handleLogout} />}
                    />}
                />

                {/* Роут администратора */}
                <Route path="/admin" element={<ProtectedRoute element={<Admin />} />} />

                {/* Роуты для учеников */}
                <Route path="/classes" element={<ProtectedRoute element={<ClassSelect />} />} />
                <Route path="/name/:classId" element={<ProtectedRoute element={<NameInput />} />} />
                <Route path="/test/:classId/:name" element={<ProtectedRoute element={<Test />} />} />
                <Route path="/profile/:classId/:name" element={<ProtectedRoute element={<Profile />} />} />

                {/* 3. Роут-заглушка для любых других ненайденных адресов (404) */}
                <Route path="*" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="centered">
                    <h2>404</h2>
                    <p>Страница не найдена. <button onClick={() => navigate('/')}>На главную</button></p>
                </motion.div>} />

            </Routes>
        </div>
    );
}

export default App;