import { useRef, useState } from 'react';
import styles from './ShowDesigner.module.css'
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils'
import image from '@/images/product.png'
import arrowopen from '@/images/arrowopen.svg'
import cross from '@/images/close.svg'
import FilterOpt from '@/components/filter/filter'

const ShowDesigner = ({ numberOfItems = 48, numberOfPage = 1, showTitle = true}) => {

    const options = ["сортировка", "наличие", "раздел", "дизайнеры", "пол"]
    const [isOpinionExpanded, setIsOpinionExpanded] = useState(false);
    const [isOpinionOverflowing, setIsOpinionOverflowing] = useState(false);
    const [showModalSources, setShowModalSources] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [filter, setfilter] = useState([])
    const toggleCheckbox = (option) => {
    if (selected.includes(option)) {
      setfilter(selected.filter(item => item !== option));
    } else {
      setfilter([...selected, option]);
    }
  };

    const handleMouseEnter = (id) => {
    setActiveItem(id)
    };
    const handleMouseLeave = () => {
      setActiveItem(null)
    };
    const location = useLocation()
    const opinionRef = useRef(null);
    const description = "Paradoxe Paris — артизанальный французский бренд, основанный в 2017 году. Внимание к деталям, отказ от декоративности, ремесленная строгость - основные принципы создателей бренда. Эли Саад и Жереми Себаун движимы не желанием понравится потребителю, а общей одержимостью процессом создания своих вещей. Работы они начинают не с рисунка, а с lorem ipsum"
    const title = location.state?.brandName
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

  const filters = [
    {
      title : "фильтр1",
      variants : [
        { id: 1, label: "Option 1" },
        { id: 2, label: "Option 2" },
        { id: 3, label: "Option 1" },
        { id: 4, label: "Option 2" }
      ]
    },
    {
      title : "фильтр2",
      variants : [
        { id: 1, label: "Option 1" },
        { id: 2, label: "Option 2" },
        { id: 3, label: "Option 1" },
        { id: 4, label: "Option 2" }
      ]
    },
    {
      title : "фильтр3",
      variants : [
        { id: 1, label: "Option 1" },
        { id: 2, label: "Option 2" },
        { id: 3, label: "Option 1" },
        { id: 4, label: "Option 2" }
      ]
    },
    {
      title : "фильтр4",
      variants : [
        { id: 1, label: "Option 1" },
        { id: 2, label: "Option 2" },
        { id: 3, label: "Option 1" },
        { id: 4, label: "Option 2" }
      ]
    },
  ];

    return (
        <>
        {showTitle ? <h1 className={styles.title}>{title}</h1> : ""}
        <div className={styles.burger}  style={{ left: showModalSources ? '0' : '-77%' }}>
          <div className={styles.burgerContainer}>

            <div className={styles.optionContainer}>
              <div>фильтры</div>
              <img style={{height: "17px", cursor: "pointer"}} onClick={() => {setShowModalSources(false)}} src={cross}/>
            </div>
            <div className={styles.optionsContainer}>
              {filters.map((filter, index) => (
                <FilterOpt Optfilter={filter}/>
              ))}
            </div>
          </div>
          <div className={styles.buttonContainer}>
              <div className={styles.button}>применить</div>
              <div className={styles.button}>очистить</div>
          </div>
        </div>
        
        <div className={styles.mainContainer}>
{/* ниработайт свертка бренд описание нащальника */}
          <div className={styles.itemOpinionContainer}
              style={isOpinionExpanded ? { overflowY: "scroll" } : {overflowY: "hidden"}}>
             <span
                 ref={opinionRef}
                 className={`${styles.itemOpinion} ${!isOpinionExpanded ? styles.itemOpinionCollapsed : ''}`}
             >
                 {description}
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
        <div className={styles.options}>
          {filters.map((filter) => (
            <div
              className={styles.optionItem}
              key={filter.id}
            >
              <div className={styles.optionTitle}>
                {filter.title}
              </div>
          
              <div className={styles.dropdown}>
                {filter.variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={styles.dropdownItem}
                    type="button"
                  >
                    {variant.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.mobileOptions}>
          <div onClick={() => {setShowModalSources(true)}} style={{cursor: "pointer"}}>фильтры</div>
          <div style={{display: "flex", flexDirection: "row", gap: "5px"}}>
            <img src={arrowopen}/>
          сортировка</div>
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