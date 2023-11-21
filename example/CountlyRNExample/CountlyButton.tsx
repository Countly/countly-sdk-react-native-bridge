import React from 'react';
import { Text, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';

const customStyleOverrides = StyleSheet.create({
    button: {
        height: 40,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
        marginTop: 10,
        marginRight: 20,
    },
    text: {
        fontSize: 14,
    },
});

interface CountlyButtonProps {
    color: string;
    disabled?: boolean;
    lightText?: boolean;
    onPress: (event: GestureResponderEvent) => void;
    title: string;
}

const CountlyButton = (props: CountlyButtonProps) : JSX.Element => {
    return (
        <TouchableOpacity disabled={props.disabled} style={{ ...customStyleOverrides.button, backgroundColor: props.color }} onPress={props.onPress}>
            <Text style={{ ...customStyleOverrides.text, color: props.lightText == true ? '#FFFFFF' : '#000000' }} numberOfLines={1} adjustsFontSizeToFit={true}>
                {props.title}
            </Text>
        </TouchableOpacity>
    );
};

export default CountlyButton;
