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

    const [total, updateTotal] = useState("120 000")

    const totalDesc = "После нажатия кнопки «Отправить запрос» откроется чат в Telegram. Сообщение с выбранными товарами сформируется автоматически. Отправьте его в чат для оформления заказа. Если сообщение не появилось автоматически, нажмите кнопку:"

     const [products, setProducts] = useState([
        {
            brand: "Nofaithstudios",
            image: image1,
            name: "JAPANESE DUST SELVEDGE TRUCKER JACKET",
            size: "L",
            number: 1,
            price: 19900
        },
        {
            brand: "Nofaithstudios",
            image: image1,
            name: "JAPANESE DUST SELVEDGE TRUCKER JACKET",
            size: "L",
            number: 1,
            price: 19900
        }
    ]);

    return (
        <>
        {showTitle ? <h1 className={styles.title}>Корзина</h1> : ""}
        <div style={{display: "flex", flexDirection: "row", gap: "80px", paddingLeft: "150px", paddingRight: "150px", paddingTop: "52px"}}>

            <div style={{display: "flex", flexDirection: "column", rowGap: "38px"}}>
            {products.map((product,index) =>
            <div>
            <div className={styles.productCardHeader}>
                <h1 className={styles.h1}>ПОД ЗАКАЗ</h1>
            </div>
            <div key={index} className={styles.productCard}>
                <div className={styles.productCardImage} style={{backgroundImage: `url(${product.image})`}} />
                <div className={styles.productCardInfo}>
                    <div className={styles.infoGroup}>
                    <div className={styles.productCardInfo1}>
                        <h1 className={styles.h1}>{product.brand}</h1>
                        <div className={styles.desc}>{product.name}</div>
                    </div>
                    <div className={styles.productCardInfo2}>
                        <div className={styles.desc}>Размер {product.size}</div>
                        <div style={{display: "flex", flexDirection: "row", width: "100%" ,justifyContent: "space-between", alignItems: "center"}}>
                        <div className={styles.desc} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>Количество
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <button onClick={() => updateNumber(index, product.number - 1)} style={{ width: "10px", height: "30px", flexShrink: 0 }}>-</button>
                            <span style={{ display: "inline-block", width: "30px", textAlign: "center"}}>{product.number}</span>
                            <button onClick={() => updateNumber(index, product.number + 1)} style={{ width: "10px", height: "30px", flexShrink: 0 }}>+</button>
                        </div>
                        </div>
                        <div className={styles.h1} style={{ textAlign: "right", marginLeft: "auto" }}>{product.price}</div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
            </div>)}
            </div>

            <div className={styles.total}>
                <h1 className={styles.h1}>ИТОГО: {total}₽</h1>
                <div className={styles.totalDesc}>{totalDesc}</div>
                <button className={styles.copy}>Скопировать запрос вручную</button>
                <button className={styles.send}>отправить запрос</button>
            </div>
        </div>
        </>
    )
}

export default Cart