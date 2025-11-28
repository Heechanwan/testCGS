import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

// Функция перемешивания массива (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function Test() {
  const { classId, name } = useParams();
  const [questions, setQuestions] = useState([]); // Вопросы (с перемешанными ответами)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // Массив ответов пользователя
  const [answeredQuestions, setAnsweredQuestions] = useState([]); // Индексы отвеченных вопросов
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/testCGS/questions.json`);
        if (!response.ok) {
          console.error("Failed to fetch questions.json");
          setQuestions([]);
          return;
        }

        const data = await response.json();
        const studentRef = doc(db, `results/${classId}/students/${name}`);
        const studentSnap = await getDoc(studentRef);
        const answered = studentSnap.exists() ? studentSnap.data().answeredQuestions || [] : [];

        let availableQuestions = (data[classId] || [])
          .map((q, i) => ({ ...q, originalIndex: i }))
          .filter((q) => !answered.includes(q.originalIndex));

        // Перемешиваем вопросы
        availableQuestions = shuffleArray(availableQuestions);

        // Перемешиваем ответы в каждом вопросе
        const questionsWithShuffledAnswers = availableQuestions.map(q => ({
          ...q,
          answers: shuffleArray(q.answers),
        }));

        setQuestions(questionsWithShuffledAnswers);
        setAnsweredQuestions(answered);
      } catch (err) {
        console.error("Error loading questions:", err);
        setQuestions([]);
      }
    };

    fetchQuestions();
  }, [classId, name]);

  // Reset mouse color on unmount
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('update-mouse-color', { detail: { color: null } }));
    };
  }, []);

  const handleAnswer = (answer, event) => {
    setSelectedAnswer(answer);
    const correctAnswer = questions[currentQuestionIndex].correct;
    const isAnswerCorrect = answer === correctAnswer;
    setIsCorrect(isAnswerCorrect);

    const color = isAnswerCorrect ? '#4CAF50' : '#B3261E';

    // Trigger ripple effect
    if (event) {
      // Get the label element (parent of the radio input)
      const label = event.target.closest('label');
      if (label) {
        const rect = label.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        window.dispatchEvent(new CustomEvent('trigger-ripple', {
          detail: { x, y, color }
        }));
      }
    }

    // Update mouse trail color
    window.dispatchEvent(new CustomEvent('update-mouse-color', {
      detail: { color }
    }));
  };

  const handleNext = async () => {
    const newAnswers = [...answers, {
      answer: selectedAnswer,
      correct: isCorrect,
      question: questions[currentQuestionIndex].question,
      correctAnswer: questions[currentQuestionIndex].correct
    }];
    const newAnsweredQuestions = [...answeredQuestions, questions[currentQuestionIndex].originalIndex];
    setAnswers(newAnswers);
    setAnsweredQuestions(newAnsweredQuestions);
    setSelectedAnswer(null);
    setIsCorrect(null);

    // Reset mouse color
    window.dispatchEvent(new CustomEvent('update-mouse-color', { detail: { color: null } }));

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Подсчёт оценки
      const correctCount = newAnswers.filter(a => a.correct).length;
      const grade = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

      // Сохранение в Firebase
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

  // Загрузка
  if (!questions.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="centered">
        <p>Загрузка вопросов... Если вопросов нет — все уже пройдены.</p>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestionIndex}
        className={`centered test border-beam ${selectedAnswer !== null ? 'active' : ''} ${selectedAnswer !== null ? (isCorrect ? 'beam-green' : 'beam-red') : ''
          }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <h2>Вопрос {currentQuestionIndex + 1} из {questions.length}</h2>
        <p>
          {currentQuestion.question}
        </p>

        <div>
          {currentQuestion.answers.map((answer, index) => (
            <label
              key={index}
              className={`answer-option ${selectedAnswer === answer
                ? isCorrect
                  ? 'border-green'
                  : 'border-red'
                : ''
                }`}
            >
              <input
                type="radio"
                name={`answer-${currentQuestionIndex}`}
                checked={selectedAnswer === answer}
                onChange={(e) => handleAnswer(answer, e)}
                disabled={selectedAnswer !== null}
              />
              <span>{answer}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          style={{ marginTop: '1.5rem' }}
        >
          {currentQuestionIndex + 1 < questions.length ? 'Далее' : 'Завершить тест'}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default Test;