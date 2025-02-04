import { Dimensions, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WIP(): React.JSX.Element {
    return <View style={{
        width:'100%',
        height:'100%',
        justifyContent:'center',
        alignItems:'center'
    }}>
        <Text style={{
            textAlign:'center'
        }}>
            still work in progress lol
        </Text>
    </View>
}