import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import ClassSelect from './components/ClassSelect';
import NameInput from './components/NameInput';
import Test from './components/Test';
import Profile from './components/Profile';
import Admin from './components/Admin';

// 🌟 ЧТЕНИЕ КОНФИГУРАЦИИ ИЗ VITE ENV 🌟
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
// ------------------------------------

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- Новый компонент для выбора, куда идти после входа (с кнопкой выхода) ---
const HomeSelection = ({ navigate, onLogout }) => ( 
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="centered" style={{ marginTop: '10vh' }}>
        <h2>Выберите действие</h2>
        <div style={{ margin: '20px 0' }}>
            <button onClick={() => navigate('/classes')} style={{ margin: '10px' }}>
                Начать тестирование (Ученик)
            </button>
            <button onClick={() => navigate('/admin')} style={{ margin: '10px' }}>
                Панель Администратора
            </button>
        </div>
        <button 
            onClick={onLogout} 
            style={{ 
                marginTop: '30px', 
                backgroundColor: '#dc3545', 
                color: 'white' 
            }}
        >
            Выход
        </button>
    </motion.div>
);
// -------------------------------------------------------------------------

function App() {
    const [passwordEntered, setPasswordEntered] = useState(false);
    const navigate = useNavigate();

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

    return (
        <div className="app">
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