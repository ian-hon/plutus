import { Account } from "@/constants/account";
import { styles, Theme } from "@/constants/theme";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import CircleBackground from "./CircleBackground";
import { BlurView } from "expo-blur";
import React from "react";
import { toID } from "@/constants/utils";
import { assets } from "@/app/homepage";
import * as Haptics from "expo-haptics";

export const AccountElement = React.memo(function AccountElement({ a, last, noiseImage, dimensions, style } : { a : Account, last: boolean, noiseImage: any, dimensions: { width: number, height: number }, style?: any}): React.JSX.Element {
    let currencyFormatter = new Intl.NumberFormat('en-UK', {
        style:'currency',
        currency:'MYR'
    });

    let height = Theme.account.height;
    let width = dimensions.width - 100 - 30;
    return <>
        <View style={[{
            width:width,
            height:height,
            marginLeft:15,
            marginRight:15,
            borderRadius:Theme.borderRadius,
            overflow:'hidden',

            borderStyle:'solid',
            borderWidth:1,
            borderColor:`${Theme.accent}88`,
        }, style]}>
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
                        {toID(a.id)}
                    </Text>
                    <Text style={[styles.mediumText, {
                        fontFamily:'SpaceMono'
                    }]}>{currencyFormatter.format(a.balance)}</Text>
                </View>
            </BlurView>
        </View>
        {
            last ?
            <Pressable key='new' style={({pressed}) => [
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
},
(previous, current) => {
    return JSON.stringify(previous.a) == JSON.stringify(current.a);
    // return previous.a.id == current.a.id;
});

export const AccountList = React.memo(function AccountList({ accounts, noiseImage, dimensions, styles, activeAccount, changeActiveAccount, func, showCreation }: { accounts: Account[], noiseImage: any, dimensions: any, styles?: any, activeAccount: Account | undefined, changeActiveAccount: any, func?: any, showCreation: boolean }) {
    // memo to prevent account list from rerendering everytime accounts is read
    // why is reading accounts counted as a mutation? dont ask me

    let a = activeAccount;
    return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentInset={{ left:50, right:50 }} contentOffset={{ x: -50, y: 0 }} snapToAlignment="center" decelerationRate={0.9} snapToInterval={dimensions.width - 100} style={[{
        width:'100%',
    }, styles]} onScroll={(event) => {
        let s = Math.round((event.nativeEvent.contentOffset.x + 50) / (dimensions.width - 100));

        if ((s < 0) || (s >= accounts.length + (showCreation ? 1 : 0))) { // + 1 because the additional index is for the account creation tab
            return;
        }

        if ((a == undefined) || (accounts[s] == undefined) || (a?.id != accounts[s].id)) {
            if ((a != accounts[s])) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
            }
            a = accounts[s];
            changeActiveAccount(accounts[s]);
            if (accounts[s] != undefined) {
                (func != undefined) && func(accounts[s]);
            }
        }
    }}>
        {
            accounts.map((a, i) => <AccountElement key={a.id} a={a} last={showCreation && (i == (accounts.length - 1))} noiseImage={noiseImage} dimensions={dimensions} />)
        }
    </ScrollView>
},
(previous, current) => {
    // if true, then wont change
    // compare strings because shallow comparison fails on identical arrays
    return JSON.stringify(previous.accounts) == JSON.stringify(current.accounts);
});