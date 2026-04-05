import React from 'react'
import styles from './Header.module.css'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const ActionPanel = ({navHeight}) => {
    return (
        <div className={styles.actionPanel} style={{marginTop: -navHeight + 'px'}}>
            <div className={`${styles.navItem}`}>Поиск</div>
            <Link to='/cart'>
            <div className={`${styles.navItem}`}>Корзина</div>
            </Link>
        </div>
    )
}

export default ActionPanel;