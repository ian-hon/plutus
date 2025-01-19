import { Account } from "@/constants/account";
import { Theme } from "@/constants/theme";
import { Image, Pressable, Text, View } from "react-native";
import CircleBackground from "./CircleBackground";
import { BlurView } from "expo-blur";
import React from "react";

export function AccountElement({ a, last, noiseImage, dimensions, styles } : { a : Account, last: boolean, noiseImage: any, dimensions: { width: number, height: number }, styles: any }): React.JSX.Element {
    let currencyFormatter = new Intl.NumberFormat('en-UK', {
        style:'currency',
        currency:'MYR'
    });

    let height = Theme.account.height;
    let width = dimensions.width - 100 - 30;
    return <>
        <View style={{
            width:width,
            height:height,
            marginLeft:15,
            marginRight:15,
            borderRadius:Theme.borderRadius,
            overflow:'hidden',

            borderStyle:'solid',
            borderWidth:1,
            borderColor:`${Theme.accent}88`,
        }}>
            <View style={{
                position:'absolute',
                height:height - 2,
                width:width - 2,
                overflow:'hidden',
                borderRadius:Theme.borderRadius
            }}>
                <CircleBackground amount={Math.min(Math.max(a.balance.toString().length - 1, 1), 6)} dimensions={{ width: width, height: height }} />
            </View>
            <BlurView key={a.id} intensity={100} style={{
                backgroundColor:`${Theme.accent}40`,
                width:'100%',
                height:'100%',
                overflow:'hidden',
                borderRadius:Theme.borderRadius - 2
            }}>
                <Image source={noiseImage} style={{
                    position:'absolute',
                    height:'100%',
                    width:'100%',
                    opacity:1
                }} />
                <View style={{
                    padding:20
                }}>
                    <Text style={[styles.largeText, {
                        fontSize:25,
                    }]}>{a.name}</Text>
                    <Text style={[styles.smallText, {
                        fontFamily:'SpaceMono'
                    }]}>
                        {a.id.toString(16).slice(0, 4)}-{a.id.toString(16).slice(4, 8)}
                    </Text>
                    <Text style={[styles.mediumText, {
                        fontFamily:'SpaceMono'
                    }]}>{currencyFormatter.format(a.balance)}</Text>
                </View>
            </BlurView>
        </View>
        {
            last ?
            <Pressable style={({pressed}) => [
                {
                    height:height,
                    width:width,
                    marginLeft:15,
                    marginRight:15,

                    borderRadius:Theme.borderRadius,

                    borderStyle:'solid',
                    borderWidth:2,
                    borderColor:Theme.text,

                    justifyContent:'center',
                    alignItems:'center',

                    opacity:pressed ? 0.3 : 0.5
                }
            ]}>
                <View style={{
                    justifyContent:'center',
                    alignItems:'center',

                    height:70,
                    width:70,

                    borderRadius:1000,

                    borderStyle:'dashed',
                    borderWidth:2,
                    borderColor:Theme.text,
                }}>
                    <Text style={[styles.largeText,
                        {
                            color:Theme.text,
                            lineHeight:0
                        }
                    ]}>
                        +
                    </Text>
                </View>
            </Pressable>
            : <></>
        }
    </>
}

export const AccountList = React.memo(function AccountList({ accounts, noiseImage, dimensions, styles }: { accounts: Account[], noiseImage: any, dimensions: any, styles: any }) {
    // prevent account list from rerendering everytime accounts is read
    // why is reading accounts counted as a mutation? dont ask me
    return accounts.map((a, i) => <AccountElement a={a} last={i == (accounts.length - 1)} noiseImage={noiseImage} dimensions={dimensions} styles={styles} />)
},
(previous, current) => {
    // if true, then wont change
    // compare strings because shallow comparison fails on identical arrays
    return previous.accounts.toString() == current.accounts.toString();
});