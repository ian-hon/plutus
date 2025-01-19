import { Theme } from '@/constants/theme';
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './login';
import Homepage from './homepage';

// npx expo start --tunnel

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        NotoSans: require('../assets/fonts/NotoSans.ttf'),
        NotoSansItalic: require('../assets/fonts/NotoSans-Italic.ttf'),
    });

    const safeAreaInsets = useSafeAreaInsets();

    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={'homepage'} component={Homepage} />
            <Stack.Screen name={'login'} component={Login} />
        </Stack.Navigator>
    );
}
