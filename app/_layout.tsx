import { Theme } from '@/constants/theme';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import Login from './login';
import Homepage from './homepage';
import { Image, ImageSourcePropType, Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationRoute, ParamListBase, TabNavigationState } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        NotoSans: require('../assets/fonts/NotoSans.ttf'),
        NotoSansItalic: require('../assets/fonts/NotoSans-Italic.ttf'),
    });

    const safeAreaInsets = useSafeAreaInsets();
    const Tab = createBottomTabNavigator();
    const StateIcons = new Map<String, ImageSourcePropType>([
        ['homepage', require('../assets/images/state_icons/home.png')],
        ['login', require('../assets/images/state_icons/profile.png')]
    ]);

    const pages = ['homepage'];

    function NavBar({ state, descriptors, navigation }:{ state:TabNavigationState<ParamListBase>, descriptors:any, navigation:any }) {
        return state.routeNames[state.index] == 'login' ? <></> :
        <BlurView intensity={20} style={{
            position:'absolute',
            bottom:0,

            display:'flex',
            justifyContent:'center',
            alignItems:'center',

            width:'100%',
            
            paddingBottom:safeAreaInsets.bottom,

            backgroundColor:'#000a',
        }}>
            <View style={{
                display:'flex',
                justifyContent:'space-evenly',
                alignItems:'center',
                flexDirection:'row',

                width:'70%',
            }}>
                {
                    state.routes.filter((n) => pages.includes(n.name)).map((r, i) =>
                        <Pressable key={r.name} style={{
                            display:'flex',
                            justifyContent:'center',
                            alignItems:'center',
                            paddingTop:15,

                            flex:1,

                            opacity:state.index == i ? 1 : 0.5
                        }} onPress={() => {
                            navigation.navigate(r.name, r.params);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        }}>
                            <Image source={StateIcons.get(r.name)} style={{
                                height:25,
                                width:25,
                            }}/>
                        </Pressable>
                    )
                }
            </View>
        </BlurView>
    }

    return (
        <Tab.Navigator
            tabBar={(props) => <NavBar {...props} />}
            screenOptions={{
                headerShown:false,
                tabBarStyle: {
                    position:'absolute',
                    borderTopWidth:0
                },
            }}
        >
            <Tab.Screen name='login' component={Login} />
            <Tab.Screen name='homepage' component={Homepage} />
        </Tab.Navigator>
    );
}
