import { useState } from 'react';
import styles from './Cart.module.css'
import image1 from '@/images/product.png';

const Cart = (showTitle=true) => {

    //калище
    const updateNumber = (indexToUpdate, newNumber) => {
  setProducts(products.map((product, index) => 
    index === indexToUpdate 
      ? { ...product, number: newNumber }
      : product
  ));
};

    const products = [
        {
            brand: "Nofaithstudios",
            image: image1,
            name: "JAPANESE DUST SELVEDGE TRUCKER JACKET",
            size: "L",
            number: 1
        },
        {
            brand: "Nofaithstudios",
            image: image1,
            name: "JAPANESE DUST SELVEDGE TRUCKER JACKET",
            size: "L",
            number: 1
        }
    ]

    return (
        <>
        {showTitle ? <h1 className={styles.title}>Корзина</h1> : ""}
        
        </>
    )
}

export default Cart