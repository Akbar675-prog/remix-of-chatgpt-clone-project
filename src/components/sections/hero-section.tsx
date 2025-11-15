"use client";

import { useEffect, useState } from 'react';

const HeroSection = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [greeting, setGreeting] = useState("What can I help with?");

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);

        // Set time-based greeting - shorter versions for better fit
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) {
            setGreeting("Good morning!");
        } else if (hour >= 12 && hour < 18) {
            setGreeting("Good afternoon!");
        } else {
            setGreeting("Good evening!");
        }

        return () => clearTimeout(timer);
    }, []);

    const animationClasses = `transition-all duration-300 ease-in-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[10px]'}`;

    return (
        <div className="relative basis-auto flex-col shrink flex flex-col justify-end items-center max-sm:grow max-sm:justify-center sm:min-h-[12svh] md:min-h-[15svh] lg:min-h-[20svh]">
            <div className={`mb-2 w-full text-center md:mb-3 lg:mb-4 ${animationClasses}`}>
                <h1 className="text-[20px] font-semibold leading-[1.1] -tracking-[0.01em] text-black sm:text-[22px] md:text-[24px] lg:text-[26px]">
                    {greeting}
                </h1>
            </div>
        </div>
    );
};

export default HeroSection;