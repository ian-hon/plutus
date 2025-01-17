import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from './homepage.module.css';
import { Theme } from "@/constants/theme";
import React, { useState } from "react";
import { Account } from "@/constants/account";
import { BlurView } from "expo-blur";
import CircleBackground from "@/components/CircleBackground";

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
            fontFamily:'NotoSans',
            color:Theme.text,
        },
        largeText: {
            fontFamily:'NotoSans',
            color:Theme.text,
        }
    });

    const [accounts, changeAccounts] = useState<Account[]>([
        {
            id: 123123123,
            name: 'Savings',
            balance: 1230.00
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 1230.00
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 1230.00
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 1230.00
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 1230.00
        },
        {
            id: 123123123,
            name: 'Savings',
            balance: 1230.00
        },
    ]);

    function AccountElement({ a } : { a : Account }): React.JSX.Element {
        return <BlurView key={a.id} intensity={65} style={{
            backgroundColor:`${Theme.accent}55`,
            width:dimensions.width - 100 - 30,
            height:150,
            marginLeft:15,
            marginRight:15,
            padding:20,
            borderRadius:Theme.borderRadius,
            overflow:'hidden'
        }}>
            <Text style={[styles.largeText, {
                fontSize:25,
            }]}>{a.name}</Text>
            <Text style={[styles.smallText, {

            }]}>{a.id}</Text>
            <Text style={[styles.mediumText, {

            }]}>{a.balance}</Text>
        </BlurView>
    }

    return <View style={{
        paddingTop:safeAreaInsets.top,
        paddingBottom:safeAreaInsets.bottom,
        paddingLeft:safeAreaInsets.left,
        paddingRight:safeAreaInsets.right,

        justifyContent:'flex-start',
        alignItems:'center',
        flexDirection:'column',
        width:'100%',
        height:'100%',
        backgroundColor:Theme.background
    }}>
        <BlurView intensity={10} style={{
            position:'absolute',

            paddingTop:safeAreaInsets.top,
            paddingBottom:safeAreaInsets.bottom,
            paddingLeft:safeAreaInsets.left,
            paddingRight:safeAreaInsets.right,

            height:dimensions.height,
            width:'100%',
        }}>
            <CircleBackground dimensions={dimensions} />
        </BlurView>
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
        <ScrollView horizontal snapToAlignment="center" decelerationRate={0.9} snapToInterval={dimensions.width - 100} style={{
            width:'100%',
            height:'auto',
            marginTop:15,
        }}>
            {
                accounts.map((a) => <AccountElement a={a} />)
            }
        </ScrollView>
    </View>
}