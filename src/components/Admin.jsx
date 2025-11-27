import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';


const classes = ['3-4', '5-6', '7-8', '9-10-11'];
const ADMIN_PASSWORD = '97485031';

function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [students, setStudents] = useState({});
  const [password, setPassword] = useState('');
  const [editingName, setEditingName] = useState({});
  const [newName, setNewName] = useState({});
  const [openClasses, setOpenClasses] = useState({});

  // Цвет оценки
  const getGradeColor = (grade) => {
    if (grade >= 80) return 'good';
    if (grade >= 60) return 'mid';
    return 'bad';
  };

  useEffect(() => {
    if (authenticated) {
      const fetchAll = async () => {
        console.log('🔍 Начинаем загрузку учеников...');
        const data = {};
        for (const cls of classes) {
          console.log(`📚 Загружаем класс: ${cls}`);
          const classCol = collection(db, `results/${cls}/students`);
          const snap = await getDocs(classCol);
          console.log(`✅ Класс ${cls}: найдено ${snap.docs.length} учеников`);
          data[cls] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          console.log(`📊 Данные класса ${cls}:`, data[cls]);
        }
        console.log('🎯 Все данные:', data);
        setStudents(data);

        const initialOpen = {};
        classes.forEach((cls) => (initialOpen[cls] = true));
        setOpenClasses(initialOpen);
      };
      fetchAll().catch(err => {
        console.error('❌ Ошибка загрузки:', err);
      });
    }
  }, [authenticated]);

  const toggleClass = (cls) => {
    setOpenClasses((prev) => ({ ...prev, [cls]: !prev[cls] }));
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Неверный пароль');
    }
  };

  const handleDelete = async (cls, id) => {
    if (!window.confirm(`Удалить ученика "${id}"?`)) return;
    await deleteDoc(doc(db, `results/${cls}/students/${id}`));
    const newStudents = { ...students };
    newStudents[cls] = newStudents[cls].filter((s) => s.id !== id);
    setStudents(newStudents);
  };

  const handleToggleRetake = async (cls, id, allowed) => {
    await updateDoc(doc(db, `results/${cls}/students/${id}`), { retakeAllowed: allowed });
    const newStudents = { ...students };
    newStudents[cls] = newStudents[cls].map((s) =>
      s.id === id ? { ...s, retakeAllowed: allowed } : s
    );
    setStudents(newStudents);
  };

  const handleEditName = async (cls, oldId) => {
    const newId = newName[`${cls}-${oldId}`]?.trim();
    if (!newId || newId === oldId) {
      handleCancelEdit(cls, oldId);
      return;
    }

    const oldRef = doc(db, `results/${cls}/students/${oldId}`);
    const data = (await getDoc(oldRef)).data();
    if (!data) {
      alert('Ошибка: данные не найдены');
      return;
    }

    const newRef = doc(db, `results/${cls}/students/${newId}`);
    await setDoc(newRef, data);
    await deleteDoc(oldRef);

    const newStudents = { ...students };
    newStudents[cls] = newStudents[cls].map((s) =>
      s.id === oldId ? { ...s, id: newId } : s
    );
    setStudents(newStudents);
    setEditingName((prev) => ({ ...prev, [`${cls}-${oldId}`]: false }));
    setNewName((prev) => ({ ...prev, [`${cls}-${oldId}`]: undefined }));
  };

  const handleCancelEdit = (cls, id) => {
    setEditingName((prev) => ({ ...prev, [`${cls}-${id}`]: false }));
    setNewName((prev) => ({ ...prev, [`${cls}-${id}`]: undefined }));
  };

  const handleNameChange = (cls, id, value) => {
    setNewName((prev) => ({ ...prev, [`${cls}-${id}`]: value }));
  };

  if (!authenticated) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="centered">
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
          <label>Админ пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
          />
          <button type="submit">
            Войти
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="centered admin"
    >
      <h2 style={{ textAlign: 'center' }}>Админ панель</h2>

      {classes.map((cls) => (
        <motion.div
          key={cls}
          className="class-accordion"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: classes.indexOf(cls) * 0.1 }}
        >
          {/* Заголовок класса */}
          <div
            className="accordion-header"
            onClick={() => toggleClass(cls)}
            aria-expanded={openClasses[cls]}
          >
            <div>
              <span className="accordion-icon">
                {openClasses[cls] ? '-' : '+'}
              </span>
              <h3>Класс {cls}</h3>
              <span className="student-count">
                {students[cls]?.length || 0} ученик(ов)
              </span>
            </div>
          </div>

          {/* Список учеников */}
          <AnimatePresence>
            {openClasses[cls] && (
              <motion.div
                className="students-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {(students[cls] || []).map((student, index) => (
                  <motion.div
                    key={student.id}
                    className="student-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="student-main">
                      {editingName[`${cls}-${student.id}`] ? (
                        <div className="edit-name">
                          <input
                            type="text"
                            value={newName[`${cls}-${student.id}`] || student.id}
                            onChange={(e) => handleNameChange(cls, student.id, e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Новое имя"
                          />
                          <div className="edit-actions">
                            <button onClick={() => handleEditName(cls, student.id)} className="btn-confirm">
                              Подтвердить
                            </button>
                            <button onClick={() => handleCancelEdit(cls, student.id)} className="btn-cancel">
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="student-name">{student.id}</h4>
                          <div className="grade-container">
                            <span className="grade-label">Оценка:</span>
                            <span className={`grade-value grade-${getGradeColor(student.grade)}`}>
                              {student.grade}%
                            </span>
                            <div className="progress-bar">
                              <div
                                className={`progress-fill progress-${getGradeColor(student.grade)}`}
                                style={{ width: `${student.grade}%` }}
                              />
                            </div>
                          </div>
                          {student.retakeAllowed && (
                            <span className="retake-badge">Пересдача разрешена</span>
                          )}
                        </>
                      )}
                    </div>

                    {!editingName[`${cls}-${student.id}`] && (
                      <div className="student-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingName({ ...editingName, [`${cls}-${student.id}`]: true });
                          }}
                          className="action-btn edit"
                          title="Править имя"
                        >
                          Править
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cls, student.id);
                          }}
                          className="action-btn delete"
                          title="Удалить"
                        >
                          Удалить
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRetake(cls, student.id, !student.retakeAllowed);
                          }}
                          className={`action-btn retake ${student.retakeAllowed ? 'active' : ''}`}
                          title={student.retakeAllowed ? 'Запретить пересдачу' : 'Разрешить пересдачу'}
                        >
                          {student.retakeAllowed ? 'Запретить' : 'Разрешить'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default Admin;