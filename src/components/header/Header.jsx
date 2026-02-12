import React from 'react'
import styles from './Header.module.css'
import logo from '../../images/logo.png'

const Header = ({ style }) => {
    return (
        <header className={styles.header} style={style}>
            <div className={styles.logoContainer}>
                <div className={styles.logo} style={{backgroundImage: `url(${logo})`}}>
                </div>
            </div>
            <div className={styles.navbarContainer}>
                <nav className={styles.navbar}>
                    <div className={`${styles.navItem}`}>Новинки</div>
                    <div className={`${styles.navItem}`}>Дизайнеры</div>
                    <div className={`${styles.navItem}`}>Мужское</div>
                    <div className={`${styles.navItem}`}>Женское</div>
                    <div className={`${styles.navItem}`}>Скидки</div>
                </nav>
            </div>
            <div className={styles.actionPanelContainer}>
                <div className={styles.actionPanel}>
                    <div className={`${styles.navItem}`}>Поиск</div>
                    <div className={`${styles.navItem}`}>Корзина</div>
                </div>
            </div>
        </header>
    )
}

export default Header;