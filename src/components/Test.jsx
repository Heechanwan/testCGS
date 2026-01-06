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
  const [shake, setShake] = useState(false);
  const [screenGlitch, setScreenGlitch] = useState(false);
  const [errorEffects, setErrorEffects] = useState([]);
  const [accumulatedErrors, setAccumulatedErrors] = useState(0);
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

        // Fetch settings for max questions
        let maxQuestions = Infinity;
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'config'));
          if (settingsSnap.exists() && settingsSnap.data().maxQuestions) {
            const limit = settingsSnap.data().maxQuestions[classId];
            if (limit) maxQuestions = Number(limit);
          }
        } catch (e) {
          console.error("Error fetching settings, using defaults", e);
        }

        const studentRef = doc(db, `results/${classId}/students/${name}`);
        const studentSnap = await getDoc(studentRef);

        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          // If the test was completed and retake is not explicitly allowed, redirect
          if (studentData.retakeAllowed === false) {
            navigate('/');
            return;
          }
        }

        const answered = studentSnap.exists() ? studentSnap.data().answeredQuestions || [] : [];

        let availableQuestions = (data[classId] || [])
          .map((q, i) => ({ ...q, originalIndex: i }))
          .filter((q) => !answered.includes(q.originalIndex));

        // Перемешиваем вопросы
        availableQuestions = shuffleArray(availableQuestions);

        // Ограничиваем количество вопросов согласно настройкам
        if (availableQuestions.length > maxQuestions) {
          availableQuestions = availableQuestions.slice(0, maxQuestions);
        }

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

  // Reset mouse color and stop pulse on unmount
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('update-mouse-color', { detail: { color: null } }));
      window.dispatchEvent(new CustomEvent('stop-pulse'));
      window.dispatchEvent(new CustomEvent('update-performance', { detail: { ratio: null } }));
    };
  }, []);

  const handleAnswer = (answer, event) => {
    setSelectedAnswer(answer);
    const correctAnswer = questions[currentQuestionIndex].correct;
    const isAnswerCorrect = answer === correctAnswer;
    setIsCorrect(isAnswerCorrect);

    // Play sound
    const audio = new Audio(isAnswerCorrect ? '/testCGS/correct.mp3' : '/testCGS/incorrect.mp3');
    audio.play().catch(e => console.error("Audio play failed", e));

    if (!isAnswerCorrect) {
      const newErrorCount = accumulatedErrors + 1;
      setAccumulatedErrors(newErrorCount);

      setShake(true);
      setScreenGlitch(true);

      // Generate random error texts based on accumulated errors
      const effects = [];
      // Start with 5, add 5 for each error
      const numEffects = 5 + (newErrorCount * 5);
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00'];

      for (let i = 0; i < numEffects; i++) {
        effects.push({
          id: i,
          top: Math.random() * 100,
          left: Math.random() * 100,
          size: 1 + Math.random() * 3, // Smaller size (1rem to 4rem)
          rotation: (Math.random() - 0.5) * 90,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      setErrorEffects(effects);

      setTimeout(() => {
        setShake(false);
        setScreenGlitch(false);
        setErrorEffects([]);
      }, 800); // Slightly longer
    }

    const color = isAnswerCorrect ? '#4CAF50' : '#B3261E';

    // Trigger ripple effect and pulse
    if (event) {
      // Get the label element (parent of the radio input)
      const label = event.target.closest('label');
      if (label) {
        const rect = label.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // Initial ripple
        window.dispatchEvent(new CustomEvent('trigger-ripple', {
          detail: { x, y, color }
        }));

        // Start pulsing from this location
        window.dispatchEvent(new CustomEvent('start-pulse', {
          detail: { x, y, color }
        }));
      }
    }

    // Update mouse trail color
    window.dispatchEvent(new CustomEvent('update-mouse-color', {
      detail: { color }
    }));

    // Update background color based on performance
    // Calculate current ratio: (previous correct + current correct) / (total answered + 1)
    const currentCorrectCount = answers.filter(a => a.correct).length + (isAnswerCorrect ? 1 : 0);
    const totalAnswered = answers.length + 1;
    const ratio = currentCorrectCount / totalAnswered;

    window.dispatchEvent(new CustomEvent('update-performance', {
      detail: { ratio }
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

    // Stop pulse and reset mouse color
    window.dispatchEvent(new CustomEvent('stop-pulse'));
    window.dispatchEvent(new CustomEvent('update-mouse-color', { detail: { color: null } }));

    // Reset effects immediately
    setShake(false);
    setScreenGlitch(false);
    setErrorEffects([]);

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
      {/* Glitch Overlay */}
      {screenGlitch && (
        <div
          className="screen-glitch-active"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9000
          }}
        />
      )}

      {/* Error Texts */}
      {errorEffects.map((effect) => (
        <div
          key={effect.id}
          className="error-text-glitch"
          style={{
            top: `${effect.top}%`,
            left: `${effect.left}%`,
            fontSize: `${effect.size}rem`,
            transform: `rotate(${effect.rotation}deg)`,
            color: effect.color,
            textShadow: `2px 2px 0px ${effect.color === '#ff0000' ? '#00ffff' : '#ff0000'}`
          }}
        >
          ERROR
        </div>
      ))}

      <motion.div
        key={currentQuestionIndex}
        className={`centered test border-beam ${selectedAnswer !== null ? 'active' : ''} ${selectedAnswer !== null ? (isCorrect ? 'beam-green' : 'beam-red') : ''
          }`}
        initial={{ opacity: 0, y: 20 }}
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '0',
          color: '#ff4444',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          fontFamily: 'monospace'
        }}>
          Страйков: {accumulatedErrors}
        </div>

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