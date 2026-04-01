import React from 'react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import styles from './imageCarousel.module.css'
import { cn } from '@/lib/utils'

const imageCarousel = ({images}) => {
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
        <Carousel setApi={setApi}
        opts={{
            align: "center",
            loop: true,
        }}
        className="w-full z-10"
        >
            <CarouselContent className="-ml04">
                {images.map((image, index) => (
                    <CarouselItem key={index}>
                        <div className="overflow-hidden">
                            <div style={{backgroundImage: `url(${image})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: "center"}}
                                className="h-[70vh] w-full object-cover center"
                                alt="">
                            </div>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>

            {/* <CarouselPrevious className={cn("left-2", styles.carouselButton)} /> */}
            {/* <CarouselNext className={cn("right-2", styles.carouselButton)} />  */}
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

export default imageCarousel