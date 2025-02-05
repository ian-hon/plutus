import { ActionSheetIOS, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles, Theme } from "@/constants/theme";
import { useEffect, useRef, useState } from "react";
import { Account } from "@/constants/account";
import { AccountElement, AccountList } from "@/components/AccountElement";
import { ToggledSection } from "@/components/ToggledSection";
import { parseTransaction, Transaction } from "@/constants/transaction";
import TransactionElement from "@/components/TransactionElement";
import { BACKEND_ADDRESS } from "@/constants/backend";
import { constructBody, repackDict } from "@/constants/utils";
import * as Haptics from 'expo-haptics';

export const assets: Map<String, any>= new Map([
    ['noise', require('../assets/images/noise.png')],
    ['outgoing', require('../assets/images/outgoing.png')],
    ['incoming', require('../assets/images/incoming.png')],
    ['send', require('../assets/images/actions/send.png')],
    ['request', require('../assets/images/actions/request.png')],
    ['scan', require('../assets/images/actions/scan.png')],
    ['top_up', require('../assets/images/actions/top_up.png')],
]);

export default function Homepage({ navigation, route }: { navigation:any, route: any }) {
    const safeAreaInsets = useSafeAreaInsets();
    const dimensions = {
        width:Dimensions.get('window').width,
        height:Dimensions.get('window').height,
    };
    const currencyFormatter = new Intl.NumberFormat('en-UK', {
        style:'currency',
        currency:'MYR'
    });


    // const sessionID = route.params.sessionID;
    // TODO : remove in prod
    const sessionID = '1cc9cb0195ef807';
    // const sessionID = '5c99c59025593b4';
    const [accounts, changeAccounts] = useState<Account[]>([]);
    const [transactionMap, changeTransactionMap] = useState<Map<number, Transaction[]>>(new Map());

    const [activeAccount, changeActiveAccount] = useState<Account | undefined>(undefined);
    const [activeTransactions, changeActiveTransactions] = useState<Transaction[]>([]);

    function updateAccountDetails() {
        fetch(`${BACKEND_ADDRESS}/account/fetch/all`, constructBody(sessionID))
        .then(r => r.json())
        .then(r => {
            let data = repackDict(r)['Data'];
            if (data == undefined) {
                return;
            }
            let a = JSON.parse(data);
            let currentAccount = a[0];

            changeAccounts(a);
            changeActiveAccount(currentAccount);

            a.forEach((i: any) => {
                changeTransactionMap(e => e.set(i.id, []));
        
                fetch(`${BACKEND_ADDRESS}/log/fetch?account=${i.id}&amount=5`, constructBody(sessionID))
                .then(r => r.json())
                .then(r => {
                    let data = repackDict(r)['Data'];
                    if (data == undefined) {
                        return;
                    }
                    // request can be sent whilst in between swiping,
                    // a's transactions might arrive when user is already viewing b

                    let c = JSON.parse(data).map((e: any) => parseTransaction(e));

                    changeTransactionMap(e => e.set(i.id, c));
                    if (i.id == currentAccount.id) {
                        changeActiveTransactions(c);
                    }
                })
            })
        })
    }

    useEffect(() => {
        const screenChange = navigation.addListener('focus', () => {
            updateAccountDetails();
        })

        return screenChange;
    }, [])


    return <View style={{
        justifyContent:'flex-start',
        alignItems:'center',
        flexDirection:'column',
        width:'100%',
        height:'100%',
        backgroundColor:Theme.background,
    }}>
        <ScrollView style={{
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
                <AccountList accounts={accounts} dimensions={dimensions} noiseImage={assets.get('noise')} styles={styles} showCreation={true} func={(i: any) => {
                    let t = transactionMap.get(i.id);
                    changeActiveTransactions(t == undefined ? [] : t);
                }} activeAccount={activeAccount} changeActiveAccount={changeActiveAccount} />
            </View>
            <View>
                {(activeAccount != undefined) && <>
                <View style={{
                    marginTop:15,
                    marginBottom:15,
                    paddingLeft:20,
                    paddingRight:20,

                    justifyContent:'center',
                    alignItems:'center',
                    flexDirection:'row'
                }}>
                    {
                        Array<[string, () => void]>(
                            ['send', () => {
                                navigation.navigate('send', {
                                    sessionID: sessionID,
                                    accountID: activeAccount.id
                                });
                            }],
                            ['request', () => {
                                console.log('request');
                                navigation.navigate('wip', {
                                    sessionID: sessionID,
                                    accountID: activeAccount.id
                                });
                            }],
                            ['scan', () => {
                                console.log('scan');
                                ActionSheetIOS.showActionSheetWithOptions({
                                    options:['cancel', 'test', 'lorem'],
                                    tintColor:Theme.accent,
                                    destructiveButtonIndex:[1],
                                    cancelButtonIndex:0
                                }, index => {
                                    console.log(`${index} pressed`);
                                })
                            }],
                            ['top_up', () => {
                                console.log('top up');
                                navigation.navigate('wip', {
                                    sessionID: sessionID,
                                    accountID: activeAccount.id
                                });
                            }]
                        ).map((e, index) => <Pressable key={e[0]} style={{
                            backgroundColor:`${Theme.accent}bb`,
                            borderRadius:1000,
                            marginRight:index == 3 ? 0 : 15,
                            padding:13,
                        }} onPress={e[1]}>
                            <Image source={assets.get(e[0])} style={{
                                height:22,
                                width:22,
                            }}/>
                        </Pressable>)
                    }
                </View>
                <View style={{
                    marginHorizontal:20,
                    marginTop:10,
                }}>
                    <Text style={[styles.mediumText, {
                        fontFamily:'SpaceMono'
                    }]}>
                        recent history
                    </Text>
                    <View>
                        {
                            activeTransactions.map((e) => <TransactionElement parent={activeAccount} incoming={assets.get('incoming')} outgoing={assets.get('outgoing')} key={e.id} t={e} fmt={currencyFormatter} />)
                        }
                    </View>
                    <Pressable onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    }} style={{
                        marginTop:10
                    }}>
                        <Text style={[styles.hyperlink, {
                            textAlign:'center'
                        }]}>
                            view more
                        </Text>
                    </Pressable>
                </View>
                </>}
            </View>
        </ScrollView>
    </View>
}