import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../App';
import { motion } from 'framer-motion';

function Profile() {
  const { classId, name } = useParams();
  const [data, setData] = useState({ grade: 0, retakeAllowed: false });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const studentRef = doc(db, `results/${classId}/students/${name}`);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        setData(studentSnap.data());
      }
    };
    fetchData();
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
      <button onClick={handleRetake} disabled={!data.retakeAllowed}>
        Пересдать {data.retakeAllowed ? '' : '(неактивно)'}
      </button>
    </motion.div>
  );
}

export default Profile;