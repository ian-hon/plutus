import { BACKEND_ADDRESS } from "@/constants/backend";
import { Theme } from "@/constants/theme";
import { repackDict } from "@/constants/utils";
import { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login({ navigation }: { navigation:any }) {
    const safeAreaInsets = useSafeAreaInsets();

    const [isLogin, changeIsLogin] = useState(true);
    const [errorMessage, changeErrorMessage] = useState('');

    const [username, changeUsername] = useState('');
    const [password, changePassword] = useState('');
    const [confirmPassword, changeConfirmPassword] = useState('');

    const loginStyle = StyleSheet.create({
        text: {
            color:Theme.text,
            fontFamily:'NotoSans',
            textAlign:'center'
        },
        input: {
            color:Theme.text,
            fontFamily:'NotoSans',

            borderStyle:'solid',
            borderColor:Theme.textTranslucent,
            borderBottomWidth:1,

            width:'50%',
            marginBottom:10,

            fontSize:Theme.fontMedium,
        }
    })

    const passwordInput = useRef<TextInput | null>(null);
    const confirmPasswordInput = useRef<TextInput | null>(null);

    function attemptLogin() {
        fetch(`${BACKEND_ADDRESS}/user/${isLogin ? 'login' : 'signup'}`, {
            method: 'POST',
            body: JSON.stringify({
                'username':username,
                'password':password
            }),
            headers: {
                'Content-type': 'application/json'
            }
        })
        .then(r => r.json())
        .then(r => {
            let id = repackDict(r)['Success'];
            if (id != undefined) {
                navigation.navigate('homepage', {
                    sessionID: id
                });
            } else {
                let message = {
                    'PasswordWrong': 'password is wrong',
                    'UsernameNoExist': "username doesn't exist",

                    'UsernameExist': 'username already taken',
                }[JSON.stringify(r).replaceAll('"', '')];
                changeErrorMessage(message ? message : 'error or something idk');
            }
        })
    }

    return <View style={{
        backgroundColor:Theme.background,

        display:'flex',
        justifyContent:'center',
        alignItems:'center',
        flexDirection:'column',

        width:'100%',
        height:'100%',

        paddingTop:safeAreaInsets.top,
        paddingBottom:Theme.navbarHeight + safeAreaInsets.bottom
    }}>
        <View>
            <Text style={[loginStyle.text,{
                fontSize:Theme.fontHeader
            }]}>
                plutus
            </Text>
            <Text  style={[loginStyle.text, {
                fontSize:Theme.fontSmall,
                fontFamily:'NotoSansItalic',
                opacity:0.5
            }]}>
                your money, your say
            </Text>
        </View>
        <View style={{
            display:'flex',
            justifyContent:'center',
            alignItems:'center',

            width:'100%',

            marginTop:50,
        }}>
            <TextInput value={username} onChangeText={changeUsername} style={loginStyle.input} placeholder="username" returnKeyType='next' onSubmitEditing={() => { passwordInput.current?.focus() }} />
            <TextInput value={password} onChangeText={changePassword} style={loginStyle.input} placeholder="password" returnKeyType={isLogin ? 'done' : 'next'} textContentType='password' ref={passwordInput} onSubmitEditing={() => {
                if (isLogin) {
                    return;
                }
                confirmPasswordInput.current?.focus();
            }} />
            {
                isLogin ? <></> :
                <TextInput value={confirmPassword} onChangeText={changeConfirmPassword} style={loginStyle.input} placeholder="confirm password" returnKeyType='done' textContentType='password' ref={confirmPasswordInput} />
            }
        </View>
        <View style={{
            marginTop:30
        }}>
            <Text style={[loginStyle.text, {
                fontFamily:'NotoSansItalic',
                color:'red',
                fontSize:Theme.fontSmall,
                marginBottom:15
            }]}>
                {errorMessage}
            </Text>
            <Pressable onPress={() => {
                changeErrorMessage('');
                attemptLogin();
            }}>
                <Text style={[loginStyle.text, {
                    fontSize:Theme.fontMedium
                }]}>
                    {
                        isLogin ? 'log in' : 'sign up'
                    }
                </Text>
            </Pressable>
            <Pressable onPress={() => { changeIsLogin(!isLogin); }}>
                <Text style={[loginStyle.text, {
                    fontSize:Theme.fontSmall,
                    fontFamily:'NotoSansItalic',
                    opacity:0.5
                }]}>
                    {
                        isLogin ? 'dont have an account?' : 'already have an account?'
                    }
                </Text>
            </Pressable>
        </View>
    </View>
}