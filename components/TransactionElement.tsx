import { Account } from "@/constants/account";
import { Theme } from "@/constants/theme";
import { Transaction } from "@/constants/transaction";
import { toID } from "@/constants/utils";
import { Image, StyleSheet, Text, View } from "react-native";

export default function TransactionElement({ parent, t, fmt, incoming, outgoing }: { parent: Account, t: Transaction, fmt: any, incoming: any, outgoing: any }): React.JSX.Element {
    const styles = StyleSheet.create({
        text: {
            fontFamily:'SpaceMono',
            fontSize:15,
            color:Theme.text
        },
        description: {
            fontFamily:'NotoSansItalic',
            fontSize:13,
            color:Theme.textTranslucent,
            opacity:0.7
        }
    })

    // Bank,
    // User(i64), // from
    // AutoTransfer(i64), // from;

    return <View style={{
        width:'100%',
        justifyContent:'space-between',
        flexDirection:'row',
        marginTop:15
    }}>
        <View style={{
            justifyContent:'flex-start',
            alignItems:'center',
            flexDirection:'row'
        }}>
            <Image source={t.destination.id == parent.id ? incoming : outgoing} style={{
                width:15,
                height:15,
                marginLeft:10,
            }}/>
            <View style={{
                marginLeft:20
            }}>
                <View style={{
                    justifyContent:'flex-start',
                    flexDirection:'row',
                    alignItems:'center'
                }}>
                    <Text style={styles.text}>{fmt.format(t.balance)}</Text>
                    <Text style={[styles.description, {
                        fontFamily:'NotoSansItalic',
                        color:Theme.textTranslucent,
                        marginLeft:5
                    }]}>{t.origin.type == 'AutoTransfer' ? '(auto)' : ''}</Text>
                </View>
                <Text style={[
                        styles.description,
                        {
                            fontSize: 12
                        }
                    ]}>
                    {
                        new Date(t.timestamp * 1000).toLocaleString()
                    }
                </Text>
            </View>
        </View>
        <View style={{
            justifyContent:'center',
            flex:1
        }}>
            <View style={{
                justifyContent:'flex-end',
                alignItems:'center',
                flexDirection:'row',
                marginRight:10
            }}>
                <Text style={[styles.text, {
                    fontFamily:'NotoSans',
                    marginRight: 5
                }]}>
                    from
                </Text>
                <Text style={styles.text}>
                    {toID(t.destination.id)}
                </Text>
            </View>
        </View>
    </View>
}