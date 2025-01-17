import React, { useEffect } from "react";
import { Animated, Easing, useAnimatedValue, View } from "react-native";

export default function CircleBackground({ dimensions }: { dimensions: { width:number, height: number } }): React.JSX.Element {
    function Circle({ i }:{i : number}): React.JSX.Element {
        let diameter = (Math.random() * 50) + 100;

        let xStart = (Math.random() * 150) + 100;
        let yStart = Math.random() * (dimensions.width - diameter);
        // let opacityStart = Math.random() + 0.5;
        let opacityStart = 0.8;

        const xAnim = useAnimatedValue(xStart);
        const yAnim = useAnimatedValue(yStart);
        const opacityAnim = useAnimatedValue(opacityStart);

        useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(
                        xAnim,
                        {
                            toValue:(Math.random() * 150) + 100,
                            duration:(Math.random() * 2000) + 10000,
                            useNativeDriver:false
                        }
                    ),
                    Animated.timing(
                        xAnim,
                        {
                            toValue:xStart,
                            duration:(Math.random() * 2000) + 10000,
                            useNativeDriver:false
                        }
                    ),
                ])
            ).start();
            // Animated.loop(
            //     Animated.timing(
            //         xAnim,
            //         {
            //             toValue:(Math.random() * 150) + 100,
            //             duration:(Math.random() * 1000) + 2000,
            //             useNativeDriver:false
            //         }
            //     )
            // ).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(
                        yAnim,
                        {
                            toValue:Math.random() * (dimensions.width - diameter),
                            duration:(Math.random() * 2000) + 10000,
                            useNativeDriver:false
                        }
                    ),
                    Animated.timing(
                        yAnim,
                        {
                            toValue:yStart,
                            duration:(Math.random() * 2000) + 10000,
                            useNativeDriver:false
                        }
                    )
                ])
            ).start();
            // Animated.loop(
            //     Animated.sequence([
            //         Animated.timing(
            //             opacityAnim,
            //             {
            //                 toValue:Math.random(),
            //                 duration:(Math.random() * 1000) + 2000,
            //                 useNativeDriver:false
            //             }
            //         ),
            //         Animated.timing(
            //             opacityAnim,
            //             {
            //                 toValue:opacityStart,
            //                 duration:(Math.random() * 1000) + 2000,
            //                 useNativeDriver:false
            //             }
            //         )
            //     ])
            // ).start();
        }, [xAnim, yAnim, opacityAnim]);

        return <Animated.View key={i} style={{
            position:'absolute',
            // marginTop:(Math.random() * 150) + 100,
            marginTop:xAnim,
            marginLeft:yAnim,
            // left:Math.random() * (dimensions.width - diameter),
            backgroundColor:`${colors[Math.round(Math.random() * colors.length)]}aa`,
            height:diameter,
            width:diameter,
            borderRadius:1000,
            opacity: opacityAnim
        }}/>
    }

    let result = Array<React.JSX.Element>();
    let colors = Array('#211951', '#836FFF', '#15F5BA', '#48CFCB');
    for (let i = 0; i < 3; i++) {
        result.push(<Circle i={i}/>);
    }

    return <>
        {
            result.map((e) => e)
        }
    </>
}