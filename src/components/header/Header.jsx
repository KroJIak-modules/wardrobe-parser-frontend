import { React,  useEffect,  useState } from 'react'
import styles from './Header.module.css'
import logo from '../../images/logo.svg'
import burger from '../../images/burger.svg'
import cart from '../../images/cart.svg'
import arrow from '../../images/arrow.svg'
import { cn } from '@/lib/utils'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

const Header = ({ style, numberOfitems }) => {

    const Handlekeydown = (e) => {
        if (e.key === 'Enter' && searchItem.trim() !== "") {
            navigate(`/search=${searchItem}`, {state: searchItem})
        }
    };

    const navigate = useNavigate();
    const [showModalSources, setShowModalSources] = useState(false);
    const [searchItem, setSearchItem] = useState("");
    const [openedCategory, setOpenedCategory] = useState("");
    const location = useLocation();
    useEffect(() => {
        setShowModalSources(false);
    }, [location.pathname]);
    const [links, setLinks] = useState([
        {
            name: "Мужское",
            link: "/men"
        },
        {
            name: "Женское",
            link: "/women"
        },
        {
            name: "Скидки",
            link: "/discounts"
        },
    ]);

    const categories = [
            {
                title: "Новинки1",
                link: "/",
                elements: [
                    {
                        title: "Коллекции",
                        elements: ["Новые поступление", "Новые поступления", "В наличии", "Под заказ", "Все товары"],
                    }
                ]
            },
            {
                title: "Дизайнеры",
                link: "/designers",
                elements: [
                    {
                        title: "Коллекции",
                        elements: ["Новые поступление", "Новые поступления", "В наличии", "Под заказ", "Все товары"],
                    }
                ]
            },
            {
                title: "Одежда и обувь",
                link: "/",
                elements: [
                    {
                        title: "Коллекции",
                        elements: ["Новые поступление", "Новые поступления", "В наличии", "Под заказ", "Все товары"],
                    }
                ]
            },
            {
                title: "Аксессуары",
                link: "/",
                elements: [
                    {
                        title: "Коллекции",
                        elements: ["Новые поступление", "Новые поступления", "В наличии", "Под заказ", "Все товары"],
                    }
                ]
            },
        ]

    const [titles, setTitles] = useState([
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
                        link: "/questions",
                    },
                    {
                        name: "Публичная оферта",
                        link: "https://www.instagram.com/anton_shell/",
                    },
                ]
            },
        ])

    return (
        <>
            <div>
                {/* добавить плавающее меню (если надо???) */}
                <div className={styles.burger}  style={{ left: showModalSources ? '0' : '-77%' }}>
                    <div className={styles.buttons}>
                        {links.map((link,index) => (
                            <NavLink to={link.link} className={({ isActive }) => isActive ? styles.buttonsButton : styles.buttonsButtonInactive}>
                                {link.name}
                            </NavLink>
                        ))}
                    </div>
                    <input type="text" value={searchItem} onChange={(e) => setSearchItem(e.target.value)} className={styles.searchBar} onKeyDown={Handlekeydown} placeholder="Поиск"></input>
                    <div className={styles.categories}>
                    {categories
                        .filter(cat => !openedCategory || cat.title === openedCategory)
                        .map((category, index) => (
                            <div key={index}>
                                <div 
                                    className={openedCategory === category.title ? styles.burgerCat2 : styles.burgerCat} 
                                    
                                >
                                    {openedCategory === category.title && (
                                    <img style={{height: 11, transform: 'rotate(180deg)', marginRight: 8}} src={arrow}
                                    onClick={() => setOpenedCategory(openedCategory === category.title ? "" : category.title)} />
                                    )}
                                    <Link to={category.link}>{category.title}</Link>
                                    {!openedCategory && <img style={{height: 11}} src={arrow}
                                    onClick={() => setOpenedCategory(openedCategory === category.title ? "" : category.title)} />}
                                </div>

                                {openedCategory === category.title && (
                                    <div>
                                        {category.elements.map((subCategory,index) => (
                                            // если надо потом онклики добавить
                                            <div key={index} className={styles.items}>
                                                <div className={styles.h1}>{subCategory.title}</div>
                                                {subCategory.elements.map((element, index) => (
                                                    <div key={index} className={styles.text}>{element}</div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    }
                    </div>
                    <div className={styles.links}>
                            {titles.length < 3 ? <div className={styles.column}></div> : null }
                            {titles.map((title, index) => (
                                <div key={index} className={styles.column}>
                                    <span className={styles.h1}>{title.name}</span>
                                    {title.elements.map((element, ind) => (
                                        <a key={`${index}-${ind}`} href={element.link} className={styles.text}>{element.name}</a>
                                    ))}
                                </div>
                            ))}
                            {titles.length < 3 ? <div className={styles.column}></div> : null }
                        </div>
                </div>
                {showModalSources && 
                    <div className={styles.burgerClose} onClick={() => setShowModalSources(false)}>
                        
                    </div>
                }
                
            </div>
            <header className={styles.header} style={style}>
                <div className={cn(styles.logoContainer, 'mix-blend-difference')}>
                    <img className={cn(styles.logo, 'mix-blend-difference')} src={logo} />
                </div>
                <div className={styles.mobile}>
                    <button className={styles.button} onClick={() => {setShowModalSources(true); console.log("burger")}}>
                        <img className={cn(styles.logo, 'mix-blend-difference')} src={burger} />
                    </button>
                    <img className={cn(styles.logo, 'mix-blend-difference')} src={logo} />
                    <Link to='/cart'>
                    <button className={styles.button}>
                        <img className={styles.logo} src={cart} />
                        <span className={styles.count}>{numberOfitems}</span>
                    </button>
                    </Link>
                </div>
            </header>
        </>
    )
}

export default Header;