import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import ClassSelect from './components/ClassSelect';
import NameInput from './components/NameInput';
import Test from './components/Test';
import Profile from './components/Profile';
import Admin from './components/Admin';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCOvljy59DRG-5DJpF5bpLLd7j8jSgAczU",
  authDomain: "testcgs-e72e0.firebaseapp.com",
  projectId: "testcgs-e72e0",
  storageBucket: "testcgs-e72e0.firebasestorage.app",
  messagingSenderId: "515165536123",
  appId: "1:515165536123:web:178e82521bc10e283d47de"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

function App() {
  const [passwordEntered, setPasswordEntered] = useState(false);
  const navigate = useNavigate();

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    if (password === '9748') {
      setPasswordEntered(true);
      navigate('/classes');
    } else {
      alert('Неверный пароль');
    }
  };

  return (
    <div className="app">
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/*" element={
          !passwordEntered ? (
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
          ) : (
            <Routes>
              <Route path="/classes" element={<ClassSelect />} />
              <Route path="/name/:classId" element={<NameInput />} />
              <Route path="/test/:classId/:name" element={<Test />} />
              <Route path="/profile/:classId/:name" element={<Profile />} />
            </Routes>
          )
        } />
      </Routes>
    </div>
  );
}

export default App;