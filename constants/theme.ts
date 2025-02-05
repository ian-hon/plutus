import { StyleSheet } from "react-native";

export const Theme = {
    text: "#fff",
    textTranslucent: "#888888",
    background: "#000",
    secondary: "#111",
    // accent: "#3a31d8",
    // accent: "#ca86e5",
    accent: "#926df2",

    fontSmall: 15,
    fontMedium: 20,
    fontBig: 30,
    fontHeader: 35,

    navbarHeight: 40,

    borderRadius: 15,

    account: {
        height:150,
    }
};

export const styles = StyleSheet.create({
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
    },
    hyperlink: {
        fontSize:15,
        fontFamily:'NotoSansItalic',
        lineHeight:25,
        color:Theme.accent,
    }
});
