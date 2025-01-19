import { ActionSheetIOS, Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from './homepage.module.css';
import { Theme } from "@/constants/theme";
import React, { useState } from "react";
import { Account } from "@/constants/account";
import { BlurView } from "expo-blur";
import CircleBackground from "@/components/CircleBackground";
import AccountElement from "@/components/AccountElement";

export default function Homepage() {
    const safeAreaInsets = useSafeAreaInsets();
    const dimensions = {
        width:Dimensions.get('window').width,
        height:Dimensions.get('window').height,
    };
    const styles = StyleSheet.create({
        smallText: {
            fontFamily:'NotoSans',
            fontSize:16,
            lineHeight:30,
            color:Theme.text,
        },
        mediumText: {
            fontSize:20,
            fontFamily:'NotoSans',
            lineHeight:25,
            color:Theme.text,
        },
        largeText: {
            fontSize:32,
            fontFamily:'NotoSans',
            lineHeight:35,
            color:Theme.text,
        }
    });

    const noiseImage = require('../assets/images/noise.png');

    const [accounts, changeAccounts] = useState<Account[]>([
        {
            id: 2388376114,
            name: 'Savings',
            balance: 10.0
        },
        {
            id: 123123123,
            name: 'Allowance',
            balance: 100.0
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 1000
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 10000
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 100000
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 1230.00
        },
    ]);
    const [activeAccount, changeActiveAccount] = useState<Account | undefined>(accounts[0]);

    return <View style={{
        justifyContent:'flex-start',
        alignItems:'center',
        flexDirection:'column',
        width:'100%',
        height:'100%',
        backgroundColor:Theme.background,
    }}>
        <View style={{
            width:'100%',
            height:'100%',
            paddingTop:safeAreaInsets.top,
            paddingBottom:safeAreaInsets.bottom,
            paddingLeft:safeAreaInsets.left,
            paddingRight:safeAreaInsets.right,
            backgroundColor:'#0000',
            overflow:'hidden'
        }}>
            <View style={{
                justifyContent:'space-between',
                alignContent:'center',
                flexDirection:'row',

                paddingLeft:15,
                paddingRight:15,
                paddingTop:5,
                paddingBottom:5,

                width:'100%'
            }}>
                {/* top navbar */}
                <View style={{
                    justifyContent:'center',
                    alignItems:'flex-start',
                    flexDirection:'row'
                }}>
                    <Image source={require('../assets/images/profile.png')} style={{
                        height:30,
                        width:30,
                    }}/>
                    <Text style={[styles.smallText, {
                        marginLeft:10
                    }]}>
                        han_yuji
                    </Text>
                </View>
            </View>
            <View style={{
                marginTop:15,
                marginBottom:15,
            }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentInset={{ left:50, right:50 }} contentOffset={{ x: -50, y: 0 }} snapToAlignment="center" decelerationRate={0.9} snapToInterval={dimensions.width - 100} style={{
                    width:'100%',
                }} onScroll={(event) => {
                    let s = Math.round((event.nativeEvent.contentOffset.x + 50) / (dimensions.width - 100));
                    if ((s < 0) || (s > accounts.length)) {
                        return;
                    } 

                    if (activeAccount?.id != accounts[s].id) {
                        changeActiveAccount({...accounts[s]});
                    }
                }}>
                    {
                        accounts.map((a, i) => <AccountElement a={a} last={i == (accounts.length - 1)} noiseImage={noiseImage} dimensions={dimensions} styles={styles} />)
                    }
                </ScrollView>
            </View>
            <View>
                {
                    activeAccount == undefined ? <></> : <>
                        <ScrollView horizontal style={{
                            marginTop:15,
                            marginBottom:15,
                            paddingLeft:20,
                            paddingRight:20
                        }}>
                            {
                                Array<[string, () => void]>(
                                    ['Send', () => {
                                        console.log('transfer');
                                    }],
                                    ['Request', () => {
                                        console.log('request');
                                        changeActiveAccount(accounts[0]);
                                    }],
                                    ['Scan', () => {
                                        console.log('scan');
                                        ActionSheetIOS.showActionSheetWithOptions({
                                            options:['cancel', 'test', 'lorem'],
                                            tintColor:Theme.accent,
                                            destructiveButtonIndex:[1],
                                            cancelButtonIndex:0
                                        }, index => {
                                            console.log(`${index} pressed`);
                                        })
                                    }]
                                ).map((e) => <Pressable style={{
                                    backgroundColor:`${Theme.accent}bb`,
                                    borderRadius:Theme.borderRadius / 2,
                                    paddingVertical:2,
                                    paddingHorizontal:15,
                                    marginRight:15
                                }} onPress={e[1]}>
                                    <Text style={styles.smallText}>
                                        {e[0].toString()}
                                    </Text>
                                </Pressable>)
                            }
                        </ScrollView>
                        <View>
                            
                        </View>
                    </>
                }
            </View>
        </View>
    </View>
}