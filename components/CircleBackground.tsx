import { Theme } from "@/constants/theme";
import { BlurView } from "expo-blur";
import React, { useEffect } from "react";
import { Animated, Easing, useAnimatedValue, View } from "react-native";

function animateHelper(a: Animated.Value, start: number, end: number, duration: number) {
    Animated.loop(
        Animated.sequence([
            Animated.timing(
                a,
                {
                    toValue:end,
                    duration:duration,
                    useNativeDriver:false
                }
            ),
            Animated.timing(
                a,
                {
                    toValue:start,
                    duration:duration,
                    useNativeDriver:false
                }
            ),
        ])
    ).start();
}

export default function CircleBackground({ dimensions, amount }: { dimensions: { width:number, height: number }, amount: number }): React.JSX.Element {
    function Circle({ i, xStart, yStart, diameter }:{i : number, xStart: number, yStart: number, diameter: number }): React.JSX.Element {
        let opacityStart = (Math.random() * 0.3) + 0.7;

        const xAnim = useAnimatedValue(xStart);
        const yAnim = useAnimatedValue(yStart);
        const opacityAnim = useAnimatedValue(opacityStart); // needed?

        useEffect(() => {
            animateHelper(xAnim, xStart, xStart + ((Math.random() - 0.5) * 200), (Math.random() * 2000) + 3000);
            animateHelper(yAnim, yStart, yStart + ((Math.random() - 0.5) * 100), (Math.random() * 2000) + 3000);
            animateHelper(opacityAnim, opacityStart, (Math.random() * 0.5) + 0.5, (Math.random() * 1000) + 20000);

            // Animated.loop(
            //     Animated.sequence([
            //         Animated.timing(
            //             xAnim,
            //             {
            //                 toValue:(Math.random() * 150) + 100,
            //                 duration:(Math.random() * 5000) + 15000,
            //                 useNativeDriver:false
            //             }
            //         ),
            //         Animated.timing(
            //             xAnim,
            //             {
            //                 toValue:xStart,
            //                 duration:(Math.random() * 5000) + 15000,
            //                 useNativeDriver:false
            //             }
            //         ),
            //     ])
            // ).start();
            // Animated.loop(
            //     Animated.sequence([
            //         Animated.timing(
            //             yAnim,
            //             {
            //                 toValue:Math.random() * (dimensions.width - diameter),
            //                 duration:(Math.random() * 5000) + 15000,
            //                 useNativeDriver:false
            //             }
            //         ),
            //         Animated.timing(
            //             yAnim,
            //             {
            //                 toValue:yStart,
            //                 duration:(Math.random() * 5000) + 15000,
            //                 useNativeDriver:false
            //             }
            //         )
            //     ])
            // ).start();
            // Animated.loop(
            //     Animated.sequence([
            //         Animated.timing(
            //             opacityAnim,
            //             {
            //                 toValue:(Math.random() * 0.5) + 0.5,
            //                 duration:(Math.random() * 1000) + 20000,
            //                 useNativeDriver:false
            //             }
            //         ),
            //         Animated.timing(
            //             opacityAnim,
            //             {
            //                 toValue:opacityStart,
            //                 duration:(Math.random() * 1000) + 20000,
            //                 useNativeDriver:false
            //             }
            //         )
            //     ])
            // ).start();
        }, [xAnim, yAnim, opacityAnim]);

        return <Animated.View key={i} style={{
            position:'absolute',
            marginTop:yAnim,
            marginLeft:xAnim,
            backgroundColor:`${colors[Math.round(Math.random() * (colors.length - 1))]}`,
            height:diameter,
            width:diameter,
            borderRadius:1000,
            opacity: opacityAnim,
        }}/>
    }

    let result = Array<React.JSX.Element>();
    let colors = Array('#211951', '#836FFF', '#15F5BA', '#48CFCB');
    // let colors = Array(Theme.accent);
    let previous = Math.random();
    for (let i = 0; i < amount; i++) {
        let diameter = (Math.random() * 50) + 100;
        let a =  (((Math.random() - 0.5) * 0.2) + 0.6) * Math.PI;
        let d = (Math.random() * 30) + 80;
        let x = (Math.cos(a + previous) * d) + ((dimensions.width / 2) - (diameter / 2));
        let y = (Math.sin(a + previous) * d) + ((dimensions.height / 2) - (diameter / 2));
        previous += a;

        result.push(<Circle i={i} xStart={x} yStart={y} diameter={diameter} />);
    }

    return <>
        {
            result.map((e) => e)
        }
    </>
}