import React from 'react'
import styles from './Header.module.css'
import { useEffect, useRef, useState } from 'react'

const Navbar = () => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.style.marginTop = `-${ref.current.offsetHeight * 1.3}px`;
        }
    }, []);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isNewsOpen, setIsNewsOpen] = useState(false);
    const [isDesignersOpen, setIsDesignersOpen] = useState(false);
    const [isMenOpen, setIsMenOpen] = useState(false);
    const [isWomenOpen, setIsWomenOpen] = useState(false);
    const [isDiscountsOpen, setIsDiscountsOpen] = useState(false);

    useEffect(() => {
        if (isNewsOpen || isDesignersOpen || isMenOpen || isWomenOpen || isDiscountsOpen) {
            setIsMenuOpen(true);
        } else {
            setIsMenuOpen(false);
        }
    }, [isNewsOpen, isDesignersOpen, isMenOpen, isWomenOpen, isDiscountsOpen]);

    return (
        <nav ref={ref} className={styles.navbar}>
            <div className={styles.navItems} onMouseMove={() => setIsMenuOpen(true)} >
                <div className={styles.navItem} onMouseOver={() => setIsNewsOpen(true)} onMouseLeave={() => setIsNewsOpen(false)}>Новинки</div>
                <div className={styles.navItem} onMouseOver={() => setIsDesignersOpen(true)} onMouseLeave={() => setIsDesignersOpen(false)}>Дизайнеры</div>
                <div className={styles.navItem} onMouseOver={() => setIsMenOpen(true)} onMouseLeave={() => setIsMenOpen(false)}>Мужское</div>
                <div className={styles.navItem} onMouseOver={() => setIsWomenOpen(true)} onMouseLeave={() => setIsWomenOpen(false)}>Женское</div>
                <div className={styles.navItem} onMouseOver={() => setIsDiscountsOpen(true)} onMouseLeave={() => setIsDiscountsOpen(false)}>Скидки</div>
            </div>
            <div className={styles.dropMenu} style={{display: isMenuOpen ? 'flex' : 'none'}}>
                <div className={styles.dropMenuItem} style={{display: isNewsOpen ? 'block' : 'none', opacity: isNewsOpen ? 1 : 0}}>Новинки</div>
                <div className={styles.dropMenuItem} style={{display: isDesignersOpen ? 'block' : 'none', opacity: isDesignersOpen ? 1 : 0}}>Дизайнеры</div>
                <div className={styles.dropMenuItem} style={{display: isMenOpen ? 'block' : 'none', opacity: isMenOpen ? 1 : 0}}>Мужское</div>
                <div className={styles.dropMenuItem} style={{display: isWomenOpen ? 'block' : 'none', opacity: isWomenOpen ? 1 : 0}}>Женское</div>
                <div className={styles.dropMenuItem} style={{display: isDiscountsOpen ? 'block' : 'none', opacity: isDiscountsOpen ? 1 : 0}}>Скидки</div>
            </div>
        </nav>
    )
}

export default Navbar
