import { useState } from 'react';
import styles from './QnA.module.css'

const questions = [
  { id: 1, title: 'вопрос1', content: 'Anton Shell — молодой байер из Москвы, превращающий продажи в искусство. Начиная свой путь с китайских платформ в 15 лет, он быстро понял разницу между массовым рынком и настоящим стилем. Теперь доставляет вещи из Европы, США и Великобритании, собирая гардеробы, которые говорят громче слов. Визуал — его оружие. Продуманная стилизация, сильные промо-съемки, точный вкус. За два года работы Антон успел посотрудничать с многими брендами: Jaded London, Racer Worldwide, Alice Hollywood, Nofaithstudios, Project gr, Yori Sport и другие.Антон не просто продает одежду — он продает образ жизни.' },
  { id: 2, title: 'вопрос2', content: 'Доставка бесплатна при заказе от 5000р.' }
];

const QnA = () => {
  // Храним ID открытого вопроса (null, если всё закрыто)
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className={styles.container}>
      {questions.map((item) => (
        <div key={item.id} className={styles.item}>
          <div className={styles.header} onClick={() => toggle(item.id)}>
            <span>{item.title}</span>
            <span className={`${styles.icon} ${openId === item.id ? styles.rotate : ''}`}>
              ▼
            </span>
          </div>
          
          <div className={`${styles.content} ${openId === item.id ? styles.show : ''}`}>
            <div className={styles.inner}>{item.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default QnA