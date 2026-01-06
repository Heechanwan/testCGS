import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';

function Profile() {
  const { classId, name } = useParams();
  const [data, setData] = useState({ grade: 0, retakeAllowed: false });
  const navigate = useNavigate();

  useEffect(() => {
    const studentRef = doc(db, `results/${classId}/students/${name}`);

    // Listen for real-time updates
    const unsubscribe = onSnapshot(studentRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [classId, name]);

  const handleRetake = async () => {
    if (data.retakeAllowed) {
      const studentRef = doc(db, `results/${classId}/students/${name}`);
      await updateDoc(studentRef, { answeredQuestions: [], answers: [], grade: 0 });
      navigate(`/test/${classId}/${name}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="centered"
    >
      <h2>Профиль: {name} (класс {classId})</h2>
      <p>Оценка: {data.grade}%</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={() => {
            // Ensure all test effects are cleared
            window.dispatchEvent(new CustomEvent('stop-pulse'));
            window.dispatchEvent(new CustomEvent('update-mouse-color', { detail: { color: null } }));
            window.dispatchEvent(new CustomEvent('update-performance', { detail: { ratio: null } }));
            navigate('/');
          }}
          style={{
            backgroundColor: '#666',
            color: 'white',
            // Simple style to match existing
            transition: 'all 0.3s ease'
          }}
        >
          На главную
        </button>
        <button
          onClick={handleRetake}
          disabled={!data.retakeAllowed}
          className={data.retakeAllowed ? 'btn-info' : ''}
          style={{
            transition: 'all 0.3s ease',
            transform: data.retakeAllowed ? 'scale(1.05)' : 'scale(1)',
            boxShadow: data.retakeAllowed ? 'var(--elevation-2)' : 'none'
          }}
        >
          {data.retakeAllowed ? 'Пересдать тест' : 'Пересдача недоступна'}
        </button>
      </div>
    </motion.div>
  );
}

export default Profile;