import React from 'react'
import styles from './Header.module.css'
import { useEffect, useRef } from 'react'

const ActionPanel = ({navHeight}) => {
    return (
        <div className={styles.actionPanel} style={{marginTop: -navHeight + 'px'}}>
            <div className={`${styles.navItem}`}>Поиск</div>
            <div className={`${styles.navItem}`}>Корзина</div>
        </div>
    )
}

export default ActionPanel;