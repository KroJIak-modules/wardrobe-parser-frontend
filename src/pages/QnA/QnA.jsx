import { useState, useRef } from "react";
import styles from './QnA.module.css'
import Union from '@/images/Union.svg'

const AccordionItem = ({ title, text }) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);

  return (
    <div>
      <div className={styles.QHeader}>
        <div style={{textTransform: "uppercase"}}>{title}</div>
        <button style={{ backgroundImage: `url(${Union})` }}
          className={`${styles.button} ${open ? styles.open : ""}`} onClick={() => setOpen(!open)}>
          <img
    src={Union}
    className={`${styles.arrow} ${open ? styles.open : ""}`}
  />
        </button>
      </div>

      <div ref={contentRef} className={`${styles.content} ${open ? styles.contentOpen : ""}`}>
        {open && (<div className={styles.inner}>
          <p>{text}</p>
        </div>)}
      </div>
    </div>
  );
};

const Accordion = (showTitle = true, title ) => {

    const questions = [
    {
      title: "question",
      anwser: "anwser"
    },
    {
      title: "question",
      anwser: "anwser"
    },
    {
      title: "question",
      anwser: "anwser"
    }
  ]

 {
  return (
    <>
    {showTitle ? <h1 className={styles.title}>Вопросы</h1> : ""}
    <div className={styles.mainContainer}>
    {questions.map((question,index) => 
    <div className={styles.question}>
    <AccordionItem title={question.title} text={question.anwser}></AccordionItem>
    </div>)}
    </div>
    </>
  );
}
}

export default Accordion;