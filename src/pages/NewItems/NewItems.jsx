import React from 'react'
import styles from './NewItems.module.css'
import { cn } from '@/lib/utils'
import image from '@/images/product.png'

const NewItems = () => {
  const products = [
    {
      name: 'Пальто',
      opinion: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000 ₽',
      image: image,
    },
    {
      name: 'Пальто',
      opinion: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000 ₽',
      image: image,
    },
    {
      name: 'Пальто',
      opinion: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000 ₽',
      image: image,
    },
    {
      name: 'Пальто',
      opinion: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000 ₽',
      image: image,
    },
    {
      name: 'Пальто',
      opinion: 'JAPANESE DUST SELVEDGE TRUCKER JACKET',
      price: '20 000 ₽',
      image: image,
    },
  ];
  return (
    <>
      <h1 className={styles.title}>Новинки</h1>
      <div className={cn(styles.products)}>
        {products.map((product, index) =>
          <div className={styles.product}>
            <div className={styles.productImage} style={{ backgroundImage: `url(${image})` }}></div>
            <div className={styles.productDescription}>
              <span className={styles.productName}>Пальто</span>
              <span className={styles.productOpinion}>JAPANESE DUST SELVEDGE TRUCKER JACKET</span>
              <div className={styles.productInfo}>
                <span className={styles.productPrice}>20 000 ₽</span>
                <span className={styles.productType}>-</span>
                <span className={styles.productType}>В наличии</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default NewItems;