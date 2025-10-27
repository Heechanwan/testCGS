import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const classes = ['5', '6', '7-8', '9-10-11'];

function ClassSelect() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="centered"
    >
      <h2>Выберите класс</h2>
      {classes.map((cls) => (
        <button key={cls} onClick={() => navigate(`/name/${cls}`)}>
          {cls}
        </button>
      ))}
    </motion.div>
  );
}

export default ClassSelect;