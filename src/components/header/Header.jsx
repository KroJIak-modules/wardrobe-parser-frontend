import React from 'react'
import styles from './Header.module.css'
import logo from '../../images/logo.svg'
import { cn } from '@/lib/utils'

const Header = ({ style }) => {
    return (
        <header className={styles.header} style={style}>
            <div className={cn(styles.logoContainer, 'mix-blend-difference')}>
                <img className={cn(styles.logo, 'mix-blend-difference')} src={logo} />
            </div>
        </header>
    )
}

export default Header;