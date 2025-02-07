import { AccountElement, AccountList } from "@/components/AccountElement";
import { Account } from "@/constants/account";
import { BACKEND_ADDRESS } from "@/constants/backend";
import { getValue } from "@/constants/outcome";
import { styles, Theme } from "@/constants/theme";
import { constructBody, repackDict, toID } from "@/constants/utils";
import React, { useEffect, useState } from "react";
import { Animated, Dimensions, Easing, Image, Pressable, Text, TextInput, useAnimatedValue, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

enum State {
    AccountSelection,
    AmountSelection,
    Done
}

export default function Send({ navigation, route }: { navigation: any, route: any }): React.JSX.Element {
    const sessionID = route.params.sessionID;
    const accountID = route.params.accountID;

    const chevronBack = require('../assets/images/chevron_left.png');
    const noiseImage = require('../assets/images/noise.png');

    const safeAreaInsets = useSafeAreaInsets();
    const dimensions = {
        width:Dimensions.get('window').width,
        height:Dimensions.get('window').height,
    };
    const currencyFormatter = new Intl.NumberFormat('en-UK', {
        style:'currency',
        currency:'MYR'
    });

    const [state, _changeState] = useState(State.AccountSelection);

    const [account, changeAccount] = useState<Account | undefined>(undefined);
    const [allAccounts, changeAllAccounts] = useState<Account[]>([]);

    const [selectedAccount, changeSelectedAccount] = useState<Account | undefined>(undefined);

    const [selectedBalance, changeSelectedBalance] = useState('0');

    const balanceInputAnimations = {
        height: useAnimatedValue(0),
        opacity: useAnimatedValue(0),
        padding: useAnimatedValue(0)
    }

    const statusAnimations = {
        opacity: useAnimatedValue(0)
    }

    const [statusMessage, changeStatusMessage] = useState('');

    function changeState(s: State) {
        _changeState(s);

        let animationDuration = 300;

        switch (s) {
            case State.AccountSelection:
                Animated.timing(balanceInputAnimations.height, {
                    toValue: 0,
                    duration: animationDuration,
                    useNativeDriver: false,
                    easing:Easing.bezier(0.77, 0.0, 0.175, 1.0),
                }).start();
                Animated.timing(balanceInputAnimations.opacity, {
                    toValue: 0,
                    duration: animationDuration,
                    useNativeDriver: false,
                    easing:Easing.bezier(0.77, 0.0, 0.175, 1.0),
                }).start();
                Animated.timing(balanceInputAnimations.padding, {
                    toValue: 0,
                    duration: animationDuration,
                    useNativeDriver: false,
                    easing:Easing.bezier(0.77, 0.0, 0.175, 1.0),
                }).start();
                break;
            case State.AmountSelection:
                Animated.timing(balanceInputAnimations.height, {
                    toValue: 100,
                    duration: animationDuration,
                    useNativeDriver: false,
                    easing:Easing.bezier(0.77, 0.0, 0.175, 1.0),
                }).start();
                Animated.timing(balanceInputAnimations.opacity, {
                    toValue: 1,
                    duration: animationDuration,
                    useNativeDriver: false,
                    easing:Easing.bezier(0.77, 0.0, 0.175, 1.0),
                }).start();
                Animated.timing(balanceInputAnimations.padding, {
                    toValue: 20,
                    duration: animationDuration,
                    useNativeDriver: false,
                    easing:Easing.bezier(0.77, 0.0, 0.175, 1.0),
                }).start();
                break;
            case State.Done:
                break;
        }
    }

    function attemptTransfer() {
        if (selectedAccount == undefined) {
            return;
        }

        let amount = parseFloat(selectedBalance);
        let origin = accountID;
        let destination = selectedAccount.id;

        fetch(`${BACKEND_ADDRESS}/transfer/account/account?amount=${amount}&origin=${origin}&destination=${destination}`, constructBody(sessionID))
        .then(r => r.json())
        .then(r => {
            if (r == 'Success') {
                navigation.goBack();
                return;
            }

            let status = new Map([
                ['InsufficientBalance', 'Insufficient balance'],
                ['SurpassedLimit', 'Limit already surpassed'],
                ['WillSurpassLimit', 'Limit will be surpassed']
            ]).get(getValue(r));
            changeStatusMessage(status ? status : 'Invalid');

            Animated.sequence([
                Animated.timing(
                    statusAnimations.opacity,
                    {
                        toValue:1,
                        duration:0,
                        useNativeDriver:false
                    }
                ),
                Animated.timing(
                    statusAnimations.opacity,
                    {
                        toValue:0,
                        duration:1500,
                        useNativeDriver:false,
                        easing:Easing.bezier(0.77, 0.0, 0.175, 1.0)
                    }
                ),
            ]).start();

            // InsufficientBalance
            // SurpassedLimit,
            // WillSurpassLimit
        })
    }

    useEffect(() => {
        fetch(`${BACKEND_ADDRESS}/account/fetch?id=${accountID}`, constructBody(sessionID))
        .then(r => r.json())
        .then(r => {
            changeAccount(JSON.parse(repackDict(r)['Data']));
        })

        fetch(`${BACKEND_ADDRESS}/account/fetch/all`, constructBody(sessionID))
        .then(r => r.json())
        .then(r => {
            let a: Account[] = JSON.parse(repackDict(r)['Data']);
            a = a.filter((i) => i.id != accountID); // remove the currently active one
            changeAllAccounts(a);
            changeSelectedAccount(a[0]);
        })
    }, []);

    return <View style={{
        backgroundColor:Theme.background,
        height:'100%',
        width:'100%',
        paddingTop:safeAreaInsets.top,
        paddingRight:safeAreaInsets.right,
        paddingBottom:safeAreaInsets.bottom,
        paddingLeft:safeAreaInsets.left,
    }}>
        <View style={{
            justifyContent:'center',
            alignItems:'center',
            flexDirection:'row',
            width:'100%',
            marginVertical:10,
        }}>
            <Pressable style={{
                position:'absolute',
                left:0,
                padding:20
            }} onPress={() => {
                navigation.goBack();
            }}>
                <Image source={chevronBack} style={{
                    height:20,
                    width:20,
                }} />
            </Pressable>
            <Text style={[styles.mediumText, {
                fontFamily:'SpaceMono',
            }]}>send</Text>
        </View>
        <View style={{
            justifyContent:'center',
            alignItems:'center',
            marginTop:20
        }}>
            <Text style={[styles.mediumText, {
                opacity: 0.7
            }]}>from</Text>
            {(account != undefined) &&
                <AccountElement style={{
                    marginTop:15
                }} last={false} noiseImage={noiseImage} dimensions={dimensions} a={account} />
            }
        </View>
        <View style={{
            marginTop:20,
            width:'100%',
            justifyContent:'center',
            alignItems:'center',
        }}>
            <Animated.View style={{
                width:'60%',
                height:balanceInputAnimations.height,
                overflow:'hidden',
                opacity:balanceInputAnimations.opacity,
                paddingVertical:balanceInputAnimations.padding,
                paddingHorizontal:20,
                justifyContent:'center',
                alignItems:'center',
                borderRadius:Theme.borderRadius,
                borderColor:`${Theme.accent}88`,
                borderWidth:1.5,
            }}>
                <View>
                    <Text style={[styles.smallText, {
                        opacity:0.7,
                        width:'100%',
                    }]}>
                        enter amount :
                    </Text>
                    <View style={{
                        width:'100%',
                        justifyContent:'center',
                        alignItems:'center',
                        flexDirection:'row',
                        overflow:'hidden',
                        borderBottomColor:Theme.textTranslucent,
                        borderBottomWidth:1.5,
                    }}>
                        <Text style={[styles.mediumText, {
                            fontFamily:'SpaceMono',
                            textAlignVertical:'center',
                            lineHeight:0
                        }]}>
                            MYR
                        </Text>
                        <TextInput value={selectedBalance.toString()}
                        style={[styles.mediumText, {
                            fontFamily:'SpaceMono',
                            flexGrow:1,
                            flex:1,
                            lineHeight:0,
                            margin:0,
                            padding:0,
                            marginLeft:10,
                            textAlignVertical:'center',
                        }]}
                        onChangeText={(e) => {
                            let i = e.split('.');
                            let result = '';
                            i.forEach((n, index) => {
                                result += n;
                                if ((index == 0) && (i.length >= 2)) {
                                    result += '.';
                                }
                            })

                            if (result.split('.').length == 2) {
                                result = `${result.split('.')[0]}.${result.split('.')[1].substring(0, 2)}`;
                            }

                            changeSelectedBalance(result);
                        }} keyboardType={'numeric'} returnKeyType={'done'}/>
                    </View>
                </View>
            </Animated.View>
            <Animated.View style={{
                width:'60%',
                height:balanceInputAnimations.height,
                backgroundColor:'red',
                position:'absolute',
                borderRadius:Theme.borderRadius,
                overflow:'hidden',
                justifyContent:'center',
                alignItems:'center',
                opacity:statusAnimations.opacity,
                pointerEvents:'none'
            }}>
                <Text style={[styles.mediumText,{
                    fontFamily:'SpaceMono',
                    textAlign:'center',
                    width:'80%',
                    fontSize:18,
                    lineHeight:20
                }]}>
                    {statusMessage}
                </Text>
            </Animated.View>
        </View>
        <View style={{
            justifyContent:'center',
            alignItems:'center',
            marginTop:30
        }}>
            <Text style={[styles.mediumText, {
                opacity:0.7
            }]}>to</Text>
            <AccountList styles={{
                marginTop:15
            }} accounts={allAccounts.filter((i) => (state == State.AccountSelection) || (selectedAccount?.id == i.id))} noiseImage={noiseImage} dimensions={dimensions} showCreation={false} activeAccount={selectedAccount} changeActiveAccount={changeSelectedAccount}/>
        </View>
        <View style={{
            justifyContent:'center',
            alignItems:'center',
            flexDirection:'column',
            marginTop:20
        }}>
            <Pressable style={{
                backgroundColor:Theme.accent,
                paddingHorizontal:20,
                paddingVertical:10,
                borderRadius:1000
            }} onPress={() => {
                switch (state) {
                    case State.AccountSelection:
                        changeState(State.AmountSelection);
                        break;
                    case State.AmountSelection:
                        attemptTransfer();
                        break;
                }
            }}>
                <Text style={[styles.mediumText, {
                    fontFamily:'SpaceMono'
                }]}>
                    {state == State.AccountSelection ? 'select' : 'transfer'}
                </Text>
            </Pressable>
            <Animated.View style={{
                opacity:balanceInputAnimations.opacity
            }}>
                <Pressable style={{
                    paddingHorizontal:12,
                    paddingVertical:8,
                }} onPress={() => {
                    changeState(State.AccountSelection);
                }}>
                    <Text style={[styles.mediumText, {
                        fontFamily:'SpaceMono',
                        fontSize:18,
                        color:'crimson',
                        opacity:0.8
                    }]}>
                        cancel
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    </View>
}