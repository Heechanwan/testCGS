import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc, getDoc } from 'firebase/firestore'; // Added getDoc import
import { db } from '../App';
import { motion } from 'framer-motion';

const classes = ['5', '6', '7-8', '9-10-11'];
const ADMIN_PASSWORD = '97485031';

function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [students, setStudents] = useState({});
  const [password, setPassword] = useState('');
  const [editingName, setEditingName] = useState({});
  const [newName, setNewName] = useState({});

  useEffect(() => {
    if (authenticated) {
      const fetchAll = async () => {
        const data = {};
        for (const cls of classes) {
          const classCol = collection(db, `results/${cls}/students`);
          const snap = await getDocs(classCol);
          data[cls] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        setStudents(data);
      };
      fetchAll();
    }
  }, [authenticated]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Неверный пароль');
    }
  };

  const handleDelete = async (cls, id) => {
    await deleteDoc(doc(db, `results/${cls}/students/${id}`));
    const newStudents = { ...students };
    newStudents[cls] = newStudents[cls].filter((s) => s.id !== id);
    setStudents(newStudents);
  };

  const handleToggleRetake = async (cls, id, allowed) => {
    await updateDoc(doc(db, `results/${cls}/students/${id}`), { retakeAllowed: allowed });
    const newStudents = { ...students };
    newStudents[cls] = newStudents[cls].map((s) => (s.id === id ? { ...s, retakeAllowed: allowed } : s));
    setStudents(newStudents);
  };

  const handleEditName = async (cls, oldId) => {
    if (newName[`${cls}-${oldId}`] && newName[`${cls}-${oldId}`] !== oldId) {
      const oldRef = doc(db, `results/${cls}/students/${oldId}`);
      const data = (await getDoc(oldRef)).data();
      const newRef = doc(db, `results/${cls}/students/${newName[`${cls}-${oldId}`]}`);
      await setDoc(newRef, data);
      await deleteDoc(oldRef);
      const newStudents = { ...students };
      newStudents[cls] = newStudents[cls].map((s) =>
        s.id === oldId ? { ...s, id: newName[`${cls}-${oldId}`] } : s
      );
      setStudents(newStudents);
    }
    setEditingName({ ...editingName, [`${cls}-${oldId}`]: false });
    setNewName({ ...newName, [`${cls}-${oldId}`]: undefined });
  };

  const handleCancelEdit = (cls, id) => {
    setEditingName({ ...editingName, [`${cls}-${id}`]: false });
    setNewName({ ...newName, [`${cls}-${id}`]: undefined });
  };

  const handleNameChange = (cls, id, value) => {
    setNewName({ ...newName, [`${cls}-${id}`]: value });
  };

  if (!authenticated) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="centered">
        <form onSubmit={handleAuth}>
          <label>Админ пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Войти</button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="centered admin">
      <h2>Админ панель</h2>
      {classes.map((cls) => (
        <div key={cls}>
          <h3>Класс {cls}</h3>
          <ul>
            {(students[cls] || []).map((student) => (
              <li key={student.id}>
                {editingName[`${cls}-${student.id}`] ? (
                  <div className="edit-name-container">
                    <input
                      type="text"
                      value={newName[`${cls}-${student.id}`] || student.id}
                      onChange={(e) => handleNameChange(cls, student.id, e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => handleEditName(cls, student.id)}>Подтвердить</button>
                    <button onClick={() => handleCancelEdit(cls, student.id)}>Отмена</button>
                  </div>
                ) : (
                  <span>{student.id} - Оценка: {student.grade}%</span>
                )}
                {!editingName[`${cls}-${student.id}`] && (
                  <>
                    <button onClick={() => setEditingName({ ...editingName, [`${cls}-${student.id}`]: true })}>
                      Править имя
                    </button>
                    <button onClick={() => handleDelete(cls, student.id)}>Очистить</button>
                    <button onClick={() => handleToggleRetake(cls, student.id, !student.retakeAllowed)}>
                      {student.retakeAllowed ? 'Запретить пересдачу' : 'Разрешить пересдачу'}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </motion.div>
  );
}

export default Admin;