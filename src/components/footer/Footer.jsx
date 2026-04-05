import React from 'react'
import styles from './Footer.module.css'

const Footer = () => {
    const [titles, setTitles] = React.useState([
        {
            name: "Социальные сети",
            elements: [
                {
                    name: "Telegram",
                    link: "https://www.instagram.com/anton_shell/",
                },
                {
                    name: "Instagram",
                    link: "https://www.instagram.com/anton_shell/",
                },
                {
                    name: "VK",
                    link: "https://www.instagram.com/anton_shell/",
                },
            ]
        },
        {
            name: "Полезная информация",
            elements: [
                {
                    name: "Обо мне",
                    link: "/about",
                },
                {
                    name: "Отзывы",
                    link: "https://www.instagram.com/anton_shell/",
                },
                {
                    name: "Вопросы",
                    link: "https://www.instagram.com/anton_shell/",
                },
                {
                    name: "Публичная оферта",
                    link: "https://www.instagram.com/anton_shell/",
                },
            ]
        },
    ])
    return (
        <footer className={styles.footer}>
            {titles.length < 3 ? <div className={styles.column}></div> : null }
            {titles.map((title, index) => (
                <div key={index} className={styles.column}>
                    <span className={styles.title}>{title.name}</span>
                    {title.elements.map((element, ind) => (
                        <a key={`${index}-${ind}`} href={element.link} className={styles.element}>{element.name}</a>
                    ))}
                </div>
            ))}
            {titles.length < 3 ? <div className={styles.column}></div> : null }
        </footer>
    )
}

export default Footer;
