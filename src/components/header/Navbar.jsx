import React, { useRef, useEffect, useState } from 'react';
import styles from './Header.module.css';
import { Link } from 'react-router-dom';

const Navbar = ({setNavHeight}) => {
  const navRef = useRef(null);

  useEffect(() => {
    if (navRef.current) {
      navRef.current.style.marginTop = `-${navRef.current.offsetHeight * 1.3}px`;
      setNavHeight(navRef.current.offsetHeight)
    }
  }, []);

  const menuItems = [
    {
      id: 'news',
      label: 'Новинки',
      link: '/',
      content: (
        <div>
          <h4>Новые поступления
          </h4>
          <ul>
            <li>Коллекция Осень 2024</li>
            <li>Лимитированные серии</li>
            <li>Хиты сезона</li>
          </ul>
        </div>
      )
    },
    {
      id: 'designers',
      label: 'Дизайнеры',
      link: '/designers',
      content: (
        <div>
          <h4>Известные бренды
          </h4>
          <ul>
            <li>Gucci</li>
            <li>Prada</li>
            <li>Versace</li>
          </ul>
        </div>
      )
    },
    {
      id: 'men',
      label: 'Мужское',
      link: '/men',
      content: (
        <div>
          <h4>Для мужчин
          </h4>
          <ul>
            <li>Костюмы</li>
            <li>Обувь</li>
            <li>Аксессуары</li>
          </ul>
        </div>
      )
    },
    {
      id: 'women',
      label: 'Женское',
      link: '/women',
      content: (
        <div>
          <h4>Для женщин</h4>
          <ul>
            <li>Платья</li>
            <li>Сумки</li>
            <li>Ювелирка</li>
          </ul>
        </div>
      )
    },
    {
      id: 'discounts',
      label: 'Скидки',
      link: 'discounts',
      content: (
        <div>
          <h4>🔥 Распродажа</h4>
          <ul>
            <li>До -70%</li>
            <li>Ликвидация складов</li>
            <li>Акции дня</li>
          </ul>
        </div>
      )
    },
  ];

  const [activeItem, setActiveItem] = useState(null);

  const handleMouseEnter = (id) => {
    setActiveItem(id)
  };
  const handleMouseLeave = () => {
    setActiveItem(null)
  };

  useEffect(() => {
    setNavHeight(navRef.current.offsetHeight)
  }, [activeItem])

  return (
    <nav
      ref={navRef}
      className={styles.navbar}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.navItems}>
        {menuItems.map((item) => (
          <Link to={item.link}>
          <div
            key={item.id}
            className={styles.navItem}
            onMouseEnter={() => handleMouseEnter(item.id)}
          >
            {item.label}
          </div>
          </Link>
        ))}
      </div>

      <div className={styles.dropMenu}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.dropMenuItem} ${activeItem === item.id ? styles.active : ''}`}
            onMouseEnter={() => handleMouseEnter(item.id)}
          >
            {item.content}
          </div>
          
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
