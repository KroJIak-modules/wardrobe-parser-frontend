import React, { useState } from 'react'
import styles from './AboutMe.module.css'
import image1 from '@/images/aboutme.png'
import image2 from '@/images/product.png'
import Carousel from '@/components/imageCarousel/imageCarousel'

const AboutMe = () => {

    const [item, setItem] = useState({
        description: "Anton Shell — молодой байер из Москвы, превращающий продажи в искусство. Начиная свой путь с китайских платформ в 15 лет, он быстро понял разницу между массовым рынком и настоящим стилем. Теперь доставляет вещи из Европы, США и Великобритании, собирая гардеробы, которые говорят громче слов. Визуал — его оружие. Продуманная стилизация, сильные промо-съемки, точный вкус. За два года работы Антон успел посотрудничать с многими брендами: Jaded London, Racer Worldwide, Alice Hollywood, Nofaithstudios, Project gr, Yori Sport и другие. Антон не просто продает одежду — он продает образ жизни. sdakff adawpfdwfkwfwofkwf", 
    })

    return (
        <>
        <div className={styles.mainShow}>
        <div className={styles.textfield}>
            <div className={styles.textfieldinner}>
                <span>{item.description}</span>
            </div>
        </div>
            <div className={styles.textfieldinner}>
                <Carousel images={[image1,image2]}/>
            </div>
        <div className={styles.textfield}>
            <div className={styles.textfieldinner}>
                <span>{item.description}</span>
            </div>
        </div>
        </div>
        </>
    )
}

export default AboutMe;