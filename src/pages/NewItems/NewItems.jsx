import React from 'react'
import styles from './NewItems.module.css'
import { cn } from '@/lib/utils'
import image from '@/images/product.png'

const NewItems = () => {
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
      <h1 className={styles.title}>Новинки</h1>
      <div className={cn(styles.products)}>
        {products.map((product, index) =>
          <div className={styles.product}>
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
          </div>
        )}
      </div>
    </>
  )
}

export default NewItems;