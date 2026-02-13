import React from 'react'
import styles from './Header.module.css'
import { useEffect, useRef } from 'react'

const ActionPanel = () => {
    const ref = useRef(null);
    
        useEffect(() => {
            if (ref.current) {
                ref.current.style.marginTop = `-${ref.current.offsetHeight}px`;
            }
        }, []);
        
    return (
        <div  ref={ref} className={styles.actionPanel}>
            <div className={`${styles.navItem}`}>Поиск</div>
            <div className={`${styles.navItem}`}>Корзина</div>
        </div>
    )
}

export default ActionPanel;