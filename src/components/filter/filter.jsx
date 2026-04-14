import plus from '@/images/plus.svg'
import minus from '@/images/minus.svg'
import { useState } from 'react';
import styles from './filter.module.css'

const Filter = ({Optfilter}) => {
    
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setfilter] = useState([])
    const toggleCheckbox = (option) => {
    if (selected.includes(option)) {
      setfilter(selected.filter(item => item !== option));
    } else {
      setfilter([...selected, option]);
    }
  };

    return (
        <>
        <div className={styles.mainContainer}>
              <div className={styles.optionContainer}>
                <div>{Optfilter.title}</div>
                <img style={{height: "17px", width: "17px", cursor: "pointer"}} onClick={() => {setIsOpen(!isOpen)}} src={isOpen ? minus : plus}/>
              </div>
              <div style={{marginTop: "40px"}}>
              {isOpen && (
                    <div className={styles.options}>
                        {Optfilter.variants.map((option, index) => (
                           <div>{option.label}</div> 
                        ))}
                    </div>
                )}
                </div>
        </div>
        </>
        )
}

export default Filter