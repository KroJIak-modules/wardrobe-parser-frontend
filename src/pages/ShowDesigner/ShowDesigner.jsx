import { useState } from 'react';
import styles from './ShowDesigner.module.css'
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils'
import image from '@/images/product.png'


const ShowDesigner = ({ numberOfItems = 48, numberOfPage = 1, showTitle = true}) => {

    const options = ["сортировка", "наличие", "раздел", "дизайнеры", "пол"]
    const location = useLocation()
    const description = "Paradoxe Paris — артизанальный французский бренд, основанный в 2017 году. Внимание к деталям, отказ от декоративности, ремесленная строгость - основные принципы создателей бренда. Эли Саад и Жереми Себаун движимы не желанием понравится потребителю, а общей одержимостью процессом создания своих вещей. Работы они начинают не с рисунка, а с lorem ipsum"
    const title = location.state?.brandName
    const [isExpanded, setIsExpanded] = useState(false);
    const products = [
    {
      brand: 'Nofaithstudios',
      name: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000',
      image: image,
    },
    {
      brand: 'Nofaithstudios',
      name: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000',
      image: image,
    },
    {
      brand: 'Nofaithstudios',
      name: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000',
      image: image,
    },
    {
      brand: 'Nofaithstudios',
      name: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000',
      image: image,
    },
    {
      brand: 'Nofaithstudios',
      name: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000',
      image: image,
    },
  ];

    return (
        <>
        {showTitle ? <h1 className={styles.title}>{title}</h1> : ""}
        <div className={styles.mainContainer}>
            <div className={`${styles.description} ${isExpanded ? styles.expanded : ''}`}>
                {description}
            <button className={styles.read} onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'свернуть' : 'читать дальше'}
            </button>
        </div>
        <div className={styles.options}>
            {options.map((option,index) =>
            <div style={{margin: "auto"}}>
                {option}
            </div>
            )}
        </div>
        <div className={cn(styles.products)}>
        {products
          .slice(numberOfItems * (numberOfPage - 1),
                 Math.min(numberOfItems * numberOfPage, products.length))
          .map((product, index) =>
            <Link to='/show' className={styles.product}>
              <div className={styles.productImage} style={{ backgroundImage: `url(${product.image})` }}></div>
              <div className={styles.productDescription}>
                <span className={styles.productName}>{product.brand}</span>
                <span className={styles.productOpinion}>{product.name}</span>
                <div className={styles.productInfo}>
                  <span className={styles.productPrice}>{product.price} ₽</span>
                  <span className={styles.productType}>-</span>
                  <span className={styles.productType}>В наличии</span>
                </div>
              </div>
            </Link>
          )}
      </div>
        </div>
        </>
    )
}

export default ShowDesigner