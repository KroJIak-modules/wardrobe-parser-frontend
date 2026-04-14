import React, { useEffect, useRef, useState } from 'react'
import styles from '@/pages/ShowItem/ShowItem.module.css'
import image1 from '@/images/product.png';
import image2 from '@/images/main.png';
import image3 from '@/images/carousel/1.png'
import NewItems from '../NewItems/NewItems';
import Sources from '@/components/sources/sources'
import { useLocation, useNavigate } from 'react-router-dom';

const OPINION_COLLAPSED_HEIGHT = 120;

const ShowItem = () => {
    const [activeImage, setActiveImage] = useState(0);
    const opinionRef = useRef(null);

    const navigte = useNavigate();

    const sources = [
        {
            source: "fartech",
            price: "19 900",
            href:"https.example.com"
        },
        {
            source: "fartech",
            price: "19 900",
            href:"https.example.com"
        },
        {
            source: "fartech",
            price: "19 900",
            href:"https.example.com"
        },
    ]

    const [item, setItem] = useState({
        images: [image1, image2, image3, image1, image2, image3],
        brand: "Nofaithstudios",
        name: "JAPANESE DUST SELVEDGE TRUCKER JACKET",
        price: '19 900',
        activeSizes: ['M', 'L'],
        opinion: "Красивая джинсовка от NFS выполнена из плотного японского selvedge-denim. По всему изделию имеется характерный дистресс и красивое напыление, имитирующее грязь. Вытачки на задней части и защипы на передней образовывают мешковатую посадку. Помогу с размером каждому индивидуально. Красивая джинсовка от NFS выполнена из плотного японского selvedge-denim. По всему изделию имеется характерный дистресс и красивое напыление, имитирующее грязь. Вытачки на задней части и защипы на передней образовывают мешковатую посадку. Помогу с размером каждому индивидуально. Красивая джинсовка от NFS выполнена из плотного японского selvedge-denim. По всему изделию имеется характерный дистресс и красивое напыление, имитирующее грязь. Вытачки на задней части и защипы на передней образовывают мешковатую посадку. Помогу с размером каждому индивидуально.",
        src: "https://1202.tatardev.tech"    
    })

    const [selectedSize, setSelectedSize] = useState(null);
    const [opened, setWindow] = useState(false)
    const [isOpinionExpanded, setIsOpinionExpanded] = useState(false);
    const [isOpinionOverflowing, setIsOpinionOverflowing] = useState(false);
    const [showModalSources, setShowModalSources] = useState(false);

    useEffect(() => setSelectedSize(item?.activeSizes[0]), [item]);

    useEffect(() => {
        const measureOpinionHeight = () => {
            const opinionElement = opinionRef.current;

            if (!opinionElement) {
                return;
            }

            const previousMaxHeight = opinionElement.style.maxHeight;
            const previousOverflow = opinionElement.style.overflow;

            opinionElement.style.maxHeight = 'none';
            opinionElement.style.overflow = 'visible';

            const fullHeight = opinionElement.scrollHeight;

            opinionElement.style.maxHeight = previousMaxHeight;
            opinionElement.style.overflow = previousOverflow;

            setIsOpinionOverflowing(fullHeight > OPINION_COLLAPSED_HEIGHT);
        };

        measureOpinionHeight();
        window.addEventListener('resize', measureOpinionHeight);

        return () => {
            window.removeEventListener('resize', measureOpinionHeight);
        };
    }, [item.opinion]);

    useEffect(() => {
        setIsOpinionExpanded(false);
    }, [item.opinion]);

    return (
        <>
        {/* менюшка выбора источника */}
        <div>   
            {showModalSources && <div className={styles.blur} onClick={() => setShowModalSources(false)}></div>}
            <div className={styles.modalSources} style={{display: showModalSources ? 'flex' : 'none'}}>
                {<div  className={styles.modalSources} style={{display: showModalSources ? 'flex' : 'none'}}>
                <div className={styles.modalSourcesHeader}>
                    <div className={styles.modalTitle} onClick={() => setWindow(true)}>Источники</div>
                    <button className={styles.closeModalButton}
                        onClick={() => setShowModalSources(false)}>+</button>
                    </div>
                    <div className={styles.modalSourcesBlock}>
                        <div className={styles.modalSourcesContainer}>
                            <div className={styles.itemSizesBlock}>
                            <select className={styles.itemSizes}>
                                <option value="" selected disabled hidden>Размер</option>
                                {item.activeSizes.map((size, inds) =>
                                    <option
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
                                    </option>
                                )}
                            </select>
                        </div>
                        <div className={styles.designerSourceContainer}>
                            {sources.map((source, index) => 
                            <div className={styles.designer}>
                                <div className={styles.desNamePrice}>
                                    <div style={{fontWeight: "500"}}>{source.source}</div>
                                    <div style={{fontWeight: "500"}}>{source.price} ₽</div>
                                </div>
                                <div className={styles.desNamePrice}>
                                    <button className={styles.button}>Открыть источник</button>
                                    <button className={styles.button}>Выбрать</button>
                                </div>
                            </div>)}
                        </div>
                        </div>
                    </div>
               </div>}
            </div>
        </div>


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
                    <div className={styles.itemSizesBlock}>
                        <select className={styles.itemSizes}>
                            <option value="" selected disabled hidden>Размер</option>
                            {item.activeSizes.map((size, inds) =>
                                <option
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
                                </option>
                            )}
                        </select>
                    </div>
                    <button className={styles.addToCart}>Добавить в корзину</button>
                    <div className={styles.itemOpinionContainer}
                         style={isOpinionExpanded ? { height: "auto" } : {overflowY: "hidden"}}>
                        <span
                            ref={opinionRef}
                            className={`${styles.itemOpinion} ${!isOpinionExpanded ? styles.itemOpinionCollapsed : ''}`}
                        >
                            {item.opinion}
                        </span>
                        {isOpinionOverflowing && (
                            <button
                                type='button'
                                className={isOpinionExpanded ? styles.toggleOpinionButton : styles.toggleOpinionButtonShow}
                                onClick={() => setIsOpinionExpanded(prev => !prev)}
                            >
                                {isOpinionExpanded ? 'Скрыть' : '...Читать дальше'}
                            </button>
                        )}
                    </div>
                    <button className={styles.showSource} onClick={() => setShowModalSources(true)}>Выбрать источник товара</button>
                </div>
                
                
            </div>

            <div className='container'>
                <div className={styles.recommendations}>Рекомендую</div>
                <NewItems numberOfItems={8} numberOfPage={1} showTitle={false} />
            </div>
        </>
    )
}

export default ShowItem;