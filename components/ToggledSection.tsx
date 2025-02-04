import { Theme } from "@/constants/theme";
import React, { useState } from "react";
import { Image, ScrollView } from "react-native";
import { Pressable, Text, View } from "react-native";

export const ToggledSection = React.memo(function ToggledSection({ children, title }: { children: any, title: string }) {
    const [active, changeActive] = useState(true);
    const arrowImage = require('../assets/images/chevron.png');

    return <View style={{
    }}>
        <Pressable onPress={() => { changeActive(!active) }} style={{
            justifyContent:'flex-start',
            alignItems:'center',
            flexDirection:'row',
            width:'100%'
        }}>
            <Image source={arrowImage} style={{
                height:12,
                width:12,
                marginRight:8,
                marginLeft:5,
                opacity:0.8,

                transform:[
                    {
                        rotateZ:active ? '90deg' : '0deg'
                    }
                ],
            }}/>
            <Text style={{
                fontSize:20,
                fontFamily:'SpaceMono',
                lineHeight:25,
                color:Theme.text,
            }}>
                {title}
            </Text>
        </Pressable>
        <View style={{
            display:active ? 'flex' : 'none'
        }}>
            {children}
        </View>
    </View>
});