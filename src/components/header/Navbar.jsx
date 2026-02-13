import React from 'react'
import styles from './Header.module.css'
import { useEffect, useRef } from 'react'

const Navbar = () => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.style.marginTop = `-${ref.current.offsetHeight * 1.3}px`;
        }
    }, []);

    return (
        <nav ref={ref} className={styles.navbar}>
            <div className={styles.navItem}>Новинки</div>
            <div className={styles.navItem}>Дизайнеры</div>
            <div className={styles.navItem}>Мужское</div>
            <div className={styles.navItem}>Женское</div>
            <div className={styles.navItem}>Скидки</div>
        </nav>
    )
}

export default Navbar
