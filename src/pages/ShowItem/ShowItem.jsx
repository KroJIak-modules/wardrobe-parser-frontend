import React, { useEffect, useState } from 'react'
import styles from '@/pages/ShowItem/ShowItem.module.css'
import image1 from '@/images/product.png';
import image2 from '@/images/main.png';
import image3 from '@/images/carousel/1.png'

const ShowItem = () => {
    const [activeImage, setActiveImage] = useState(0);

    const [item, setItem] = useState({
        images: [image1, image2, image3, image1, image2, image3],
        brand: "Nofaithstudios",
        name: "JAPANESE DUST SELVEDGE TRUCKER JACKET",
        price: '19 900',
        activeSizes: ['M', 'L'],
        opinion: "Красивая джинсовка от NFS выполнена из плотного японского selvedge-denim. По всему изделию имеется характерный дистресс и красивое напыление, имитирующее грязь. Вытачки на задней части и защипы на передней образовывают мешковатую посадку. Помогу с размером каждому индивидуально."
    })

    const [selectedSize, setSelectedSize] = useState(null);

    useEffect(() => setSelectedSize(item?.activeSizes[0]), [item]);

    return (
        <div className={styles.mainShow}>
            <div className={styles.images}>
                {item.images.slice(0, Math.min(item.images.length, 4)).map((img, ind) =>
                    <button
                        onClick={() => setActiveImage(ind)}
                        className={`${styles.image} ${ind === activeImage ? styles.selectedImage : ''}`}
                        style={{ backgroundImage: `url(${img})` }}
                        key={`${ind}-select-button`}
                    >
                    </button>
                )}
            </div>
            <div className={styles.mainImage}>
                <div
                    className={styles.activeImage}
                    style={{ backgroundImage: `url(${item?.images[activeImage]})` }}
                >
                </div>
            </div>
            <div className={styles.opinion}>
                <span className={styles.itemBrand}>{item.brand}</span>
                <span className={styles.itemName}>{item.name}</span>
                <div className={styles.itemPrice}>
                    <span className={styles.itemPriceNumber}>{item.price} ₽</span>
                    <span className={styles.itemType}>-</span>
                    <span className={styles.itemType}>В наличии</span>
                </div>
                <div className={styles.itemSizes}>
                    {['XS', 'S', 'M', 'L', 'XL'].map((size, inds) =>
                        <button
                            key={`${inds}-size-button`}
                            className={`
                                ${styles.itemSize} 
                                ${item.activeSizes.includes(size) ? styles.itemActiveSize : ''} 
                                ${selectedSize === size ? styles.itemSelectedSize : ''}
                            `}
                            onClick={() => setSelectedSize(size)}
                            disabled={!item.activeSizes.includes(size)}
                        >
                            {size}
                        </button>
                    )}
                </div>
                <button className={styles.addToCart}>Добавить в корзину</button>
                <span className={styles.itemOpinion}>{item.opinion}</span>
            </div>
        </div>
    )
}

export default ShowItem;