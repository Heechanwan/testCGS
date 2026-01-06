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
  const [questionLimits, setQuestionLimits] = useState({});

  // New state for modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editedGrade, setEditedGrade] = useState('');
  const [editedAnswers, setEditedAnswers] = useState([]);

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
          // Sort by grade descending
          data[cls] = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.grade || 0) - (a.grade || 0));
          console.log(`📊 Данные класса ${cls}:`, data[cls]);
        }
        console.log('🎯 Все данные:', data);
        console.log('🎯 Все данные:', data);
        setStudents(data);

        // Fetch settings
        const settingsRef = doc(db, 'settings', 'config');
        getDoc(settingsRef).then((snap) => {
          if (snap.exists()) {
            setQuestionLimits(snap.data().maxQuestions || {});
          }
        });

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

  const handleLimitChange = (cls, val) => {
    setQuestionLimits((prev) => ({ ...prev, [cls]: val }));
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        maxQuestions: questionLimits
      }, { merge: true });
      alert('Настройки сохранены!');
    } catch (e) {
      console.error("Error saving settings: ", e);
      alert('Ошибка при сохранении настроек');
    }
  };

  // Modal functions
  const handleCheck = (cls, student) => {
    setSelectedClass(cls);
    setSelectedStudent(student);
    setEditedGrade(student.grade);
    setEditedAnswers(student.answers || []);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setSelectedClass(null);
    setEditedGrade('');
    setEditedAnswers([]);
  };

  const toggleAnswerCorrectness = (index) => {
    const newAnswers = [...editedAnswers];
    newAnswers[index].correct = !newAnswers[index].correct;
    setEditedAnswers(newAnswers);

    // Auto-recalculate grade if there are answers
    if (newAnswers.length > 0) {
      const correctCount = newAnswers.filter(a => a.correct).length;
      const newGrade = Math.round((correctCount / newAnswers.length) * 100);
      setEditedGrade(newGrade);
    }
  };

  const handleSaveResults = async () => {
    if (!selectedStudent || !selectedClass) return;

    try {
      const studentRef = doc(db, `results/${selectedClass}/students/${selectedStudent.id}`);
      await updateDoc(studentRef, {
        grade: Number(editedGrade),
        answers: editedAnswers
      });

      // Update local state
      const newStudents = { ...students };
      newStudents[selectedClass] = newStudents[selectedClass].map(s =>
        s.id === selectedStudent.id
          ? { ...s, grade: Number(editedGrade), answers: editedAnswers }
          : s
      );
      setStudents(newStudents);
      closeModal();
    } catch (error) {
      console.error("Error saving results:", error);
      alert("Ошибка при сохранении");
    }
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

      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        border: '1px solid #333',
        borderRadius: '12px',
        backgroundColor: '#1e1e1e'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Настройки теста</h3>
        <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Укажите максимальное количество вопросов для каждого класса. Если оставить пустым — будут показаны все доступные вопросы.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {classes.map(cls => (
            <div key={cls} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#aaa' }}>Класс {cls}</label>
              <input
                type="number"
                min="1"
                value={questionLimits[cls] || ''}
                onChange={(e) => handleLimitChange(cls, e.target.value)}
                placeholder="Все"
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  backgroundColor: '#2a2a2a',
                  color: '#fff',
                  width: '100px',
                  fontSize: '1rem'
                }}
              />
            </div>
          ))}
          <button
            onClick={saveSettings}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            Сохранить настройки
          </button>
        </div>
      </div>

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
                          <h4 className="student-name">
                            {student.id}
                            {student.grade >= 80 && index === 0 && ' 👑'}
                            {student.grade >= 80 && index === 1 && ' 💎'}
                            {student.grade >= 80 && index === 2 && ' 🥉'}
                          </h4>
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
                            handleCheck(cls, student);
                          }}
                          className="action-btn check"
                          title="Проверить ответы"
                          style={{ backgroundColor: '#2196F3', color: 'white' }}
                        >
                          Проверить
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

      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#1a1a1a',
                padding: '2rem',
                borderRadius: '12px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                color: '#fff',
                border: '1px solid #333'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Проверка: {selectedStudent.id}</h2>
                <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '1.2rem' }}>Оценка (%):</label>
                <input
                  type="number"
                  value={editedGrade}
                  onChange={(e) => setEditedGrade(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    width: '80px',
                    fontSize: '1.2rem'
                  }}
                />
              </div>

              <div className="answers-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {editedAnswers.length === 0 ? (
                  <p>Нет ответов для отображения</p>
                ) : (
                  editedAnswers.map((ans, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: ans.correct ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        border: `1px solid ${ans.correct ? '#4CAF50' : '#f44336'}`
                      }}
                    >
                      <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#aaa' }}>
                        Вопрос: {ans.question || 'Текст вопроса не сохранен'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <div style={{ marginBottom: '0.25rem' }}>
                            <span style={{ color: '#888' }}>Выбрано: </span>
                            <span style={{ color: ans.correct ? '#4CAF50' : '#f44336', fontWeight: 'bold' }}>
                              {ans.answer}
                            </span>
                          </div>
                          {ans.correctAnswer && !ans.correct && (
                            <div>
                              <span style={{ color: '#888' }}>Правильный: </span>
                              <span style={{ color: '#4CAF50' }}>{ans.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleAnswerCorrectness(index)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: ans.correct ? '#f44336' : '#4CAF50',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Пометить как {ans.correct ? 'неверный' : 'верный'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveResults}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2196F3',
                    color: '#white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Сохранить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Admin;