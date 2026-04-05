import { Link } from 'react-router-dom'
import styles from './Designers.module.css'


const Designers = () => {
    
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "#"]
    const brands = [
        {
            letter: "A",
            brandNames: ["designer1", "designer3", "designer2"]
        },
        {
            letter: "B",
            brandNames: ["designer1", "designer2"]
        },
        {
            letter: "C",
            brandNames: ["designer1", "designer3", "designer2"]
        },
        {
            letter: "D",
            brandNames: ["designer1", "designer3", "designer2"]
        },
        {
            letter: "E",
            brandNames: ["designer1", "designer3", "designer2"]
        },
        {
            letter: "F",
            brandNames: ["designer1", "designer3", "designer2", "abibas"]
        },
        {
            letter: "G",
            brandNames: ["designer1", "designer3", "designer2"]
        },
        {
            letter: "H",
            brandNames: ["designer2"]
        },
        {
            letter: "I",
            brandNames: ["designer1", "designer3", "designer2"]
        },
        {
            letter: "J",
            brandNames: ["designer1", "designer3", "designer2"]
        },
        {
            letter: "K",
            brandNames: ["designer1", "designer3", "designer2"]
        },
        {
            letter: "L",
            brandNames: ["designer1", "designer3", "designer2", "abibas"]
        },
    ]

    return (
        <>
        <div className={styles.mainContainer}>
        <div className={styles.alphabet}>
            {letters.map((letter, index) =>
            <button className={styles.textSearch}>{letter}</button>)}
        </div>
        <div>
        <div className={styles.brands}>
            {brands.map((brands,index) =>
            <div className={styles.brand}>
                <div style={{display: "grid" ,justifyItems: "start", rowGap: "1vh"}}>
                <div className={styles.textSearch}>{brands.letter}</div>
                {brands.brandNames.map((brand,ind) => 
                <Link to='/designer' state={{ brandName: brand }}>
                <div className={styles.textBrand}>{brand}</div>
                </Link>)}
                </div>
            </div>)}

        </div>
        </div>
        </div>
        </>
    )
}

export default Designers