import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

const remoteConfigUpdate = () => {
    Countly.remoteConfigUpdate((data) => {
        console.log(data);
    });
};

const updateRemoteConfigForKeysOnly = () => {
    Countly.updateRemoteConfigForKeysOnly(["test1"], (data) => {
        console.log(data);
    });
};

const updateRemoteConfigExceptKeys = () => {
    Countly.updateRemoteConfigExceptKeys(["test1"], (data) => {
        console.log(data);
    });
};

const getRemoteConfigValueForKeyBoolean = () => {
    Countly.getRemoteConfigValueForKey("booleanValue", (data) => {
        console.log(data);
    });
};
const getRemoteConfigValueForKeyFloat = () => {
    Countly.getRemoteConfigValueForKey("floatValue", (data) => {
        console.log(data);
    });
};
const getRemoteConfigValueForKeyInteger = () => {
    Countly.getRemoteConfigValueForKey("integerValue", (data) => {
        console.log(data);
    });
};
const getRemoteConfigValueForKeyString = () => {
    Countly.getRemoteConfigValueForKey("stringValue", (data) => {
        console.log(data);
    });
};
const getRemoteConfigValueForKeyJSON = () => {
    Countly.getRemoteConfigValueForKey("jsonValue", (data) => {
        console.log(data);
    });
};

const remoteConfigClearValues = () => {
    Countly.remoteConfigClearValues();
};

function RemoteConfigScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <CountlyButton onPress={remoteConfigUpdate} title="Update Remote Config" color="#00b5ad" />
                <CountlyButton onPress={updateRemoteConfigForKeysOnly} title="Update Remote Config with Keys Only" color="#00b5ad" />
                <CountlyButton onPress={updateRemoteConfigExceptKeys} title="Update Remote Config Except Keys" color="#00b5ad" />
                <CountlyButton onPress={getRemoteConfigValueForKeyBoolean} title="Boolean Test" color="#00b5ad" />
                <CountlyButton onPress={getRemoteConfigValueForKeyFloat} title="Float Test" color="#00b5ad" />
                <CountlyButton onPress={getRemoteConfigValueForKeyInteger} title="Integer Test" color="#00b5ad" />
                <CountlyButton onPress={getRemoteConfigValueForKeyString} title="String Test" color="#00b5ad" />
                <CountlyButton onPress={getRemoteConfigValueForKeyJSON} title="JSON Test" color="#00b5ad" />
                <CountlyButton onPress={remoteConfigClearValues} title="Clear remote config cache" color="#00b5ad" />
            </ScrollView>
        </SafeAreaView>
    );
}

export default RemoteConfigScreen;
