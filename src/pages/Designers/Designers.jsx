import styles from './Designers.module.css'


const Designers = () => {
    
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "#"]
    const brands = [
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik", "abibas"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik"]
        },
        {
            letter: "A",
            brandNames: ["adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik"]
        },
        {
            letter: "A",
            brandNames: ["aboba19", "adolf", "adik", "abibas"]
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
                <button className={styles.textBrand}>{brand}</button>)}
                </div>
            </div>)}

        </div>
        </div>
        </div>
        </>
    )
}

export default Designers