import React from 'react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import styles from './HeroCarousel.module.css'
import image1 from '../../images/carousel/1.png'
import image2 from '../../images/carousel/2.png'
import image3 from '../../images/carousel/3.png'
import { cn } from '@/lib/utils'


const HeroCarousel = () => {
    const images = [image2, image3, image1]

    const [api, setApi] = React.useState(null)
    const [current, setCurrent] = React.useState(0)
    const [count, setCount] = React.useState(0)

    React.useEffect(() => {
        if (!api) return

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    return (
        <Carousel
            setApi={setApi}
            opts={{
                align: "center",
                loop: true,
            }}
            className="w-full z-10 mt-7"
        >
            <CarouselContent className="-ml-4">
                {images.map((image, index) => (
                    <CarouselItem
                        key={index}
                        className={styles.CarouselItem}
                    >
                        <div className="overflow-hidden">
                            <div
                                style={{backgroundImage: `url(${image})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: "center"}}
                                className="h-[60vh] w-full object-cover center"
                                alt=""
                            />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>

            <CarouselPrevious className={cn("left-8", styles.carouselButton)} />
            <CarouselNext className={cn("right-8", styles.carouselButton)} />
            <div className="mt-4 flex justify-center gap-2" style={{alignItems: "center"}}>
                {Array.from({ length: count }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => api?.scrollTo((i - 1 + count) % count)}
                        className={`h-[6px] w-[6px] rounded-full transition-all ${((i - 1) + count) % count === current ? "bg-[#C0C0C0] w-[10px] h-[10px]" : "bg-[#D0D0D0]"
                            }`}
                    />
                ))}
            </div>
        </Carousel>
    )
}

export default HeroCarousel