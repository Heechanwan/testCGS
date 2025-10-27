import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';

function NameInput() {
  const { classId } = useParams();
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const studentRef = doc(db, `results/${classId}/students/${name}`);
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      navigate(`/profile/${classId}/${name}`);
    } else {
      navigate(`/test/${classId}/${name}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="centered"
    >
      <form onSubmit={handleSubmit}>
        <label>Введите имя</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit">Начать</button>
      </form>
    </motion.div>
  );
}

export default NameInput;