import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../App';
import { motion, AnimatePresence } from 'framer-motion';

function Test() {
  const { classId, name } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      // 🌟 ИСПРАВЛЕННЫЙ ПУТЬ: используем BASE_URL для корректной загрузки
      // На GitHub Pages это будет выглядеть как fetch('/testCGS/questions.json')
      const response = await fetch(`${import.meta.env.BASE_URL}questions.json`);
      
      // Проверяем, что ответ успешный, прежде чем парсить JSON
      if (!response.ok) {
        console.error("Failed to fetch questions. JSON file not found or network error.");
        // Можно добавить более дружелюбное сообщение для пользователя, если файл не найден
        setQuestions([]); 
        return;
      }
      
      const data = await response.json();
      
      const studentRef = doc(db, `results/${classId}/students/${name}`);
      const studentSnap = await getDoc(studentRef);
      let answered = studentSnap.exists() ? studentSnap.data().answeredQuestions || [] : [];

      let availableQuestions = data[classId] || [];
      availableQuestions = availableQuestions
        .map((q, i) => ({ ...q, originalIndex: i }))
        .filter((q) => !answered.includes(q.originalIndex));

      // Shuffle questions
      for (let i = availableQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
      }

      setQuestions(availableQuestions);
      setAnsweredQuestions(answered);
    };
    fetchQuestions();
  }, [classId, name]);

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    const isAnswerCorrect = answer === questions[currentQuestionIndex].correct;
    setIsCorrect(isAnswerCorrect);
  };

  const handleNext = async () => {
    const newAnswers = [...answers, { answer: selectedAnswer, correct: isCorrect }];
    const newAnsweredQuestions = [...answeredQuestions, questions[currentQuestionIndex].originalIndex];
    setAnswers(newAnswers);
    setAnsweredQuestions(newAnsweredQuestions);
    setSelectedAnswer(null);
    setIsCorrect(null);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate grade
      let grade = 0;
      newAnswers.forEach((a) => {
        if (a.correct) grade++;
      });
      grade = questions.length > 0 ? (grade / questions.length) * 100 : 0;

      // Save to Firebase
      const studentRef = doc(db, `results/${classId}/students/${name}`);
      await setDoc(studentRef, {
        grade,
        answers: newAnswers,
        answeredQuestions: newAnsweredQuestions,
        retakeAllowed: false,
      }, { merge: true });

      navigate(`/profile/${classId}/${name}`);
    }
  };

  // Добавим проверку на загрузку
  if (!questions.length) return <div>Загрузка вопросов... Вопросы отсутствуют или все вопросы пройдены.</div>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestionIndex}
        className={`centered test ${selectedAnswer !== null ? (isCorrect ? 'shadow-green' : 'shadow-red') : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ opacity: { duration: 0.5 }, y: { duration: 0.5 }, height: { duration: 0.5, ease: 'easeInOut' } }}
      >
        <h2>Тест для класса {classId}</h2>
        <div>
          <p>{questions[currentQuestionIndex].question}</p>
          {questions[currentQuestionIndex].answers.map((answer, index) => (
            <label
              key={index}
              className={`answer-option ${selectedAnswer === answer ? (isCorrect ? 'border-green' : 'border-red') : ''}`}
              style={{
                display: 'block',
                padding: '0.5rem',
                borderRadius: '4px',
              }}
            >
              <input
                type="radio"
                name="answer"
                checked={selectedAnswer === answer}
                onChange={() => handleAnswer(answer)}
                disabled={selectedAnswer !== null}
              />
              {answer}
            </label>
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          style={{ opacity: selectedAnswer === null ? 0.5 : 1 }}
        >
          Далее
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default Test;