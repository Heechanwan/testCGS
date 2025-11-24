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
    </motion.div>
  );
}

export default Profile;