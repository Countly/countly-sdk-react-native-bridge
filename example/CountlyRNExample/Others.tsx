import React from "react";
import { Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge-np";
import CountlyButton from "./CountlyButton";

class AttributionKey {
    static IDFA = "idfa";

    static AdvertisingID = "adid";
}

const campaignData = "{\"cid\":\"[PROVIDED_CAMPAIGN_ID]\", \"cuid\":\"[PROVIDED_CAMPAIGN_USER_ID]\"}";

const setLocation = () => {
    const countryCode = "us";
    const city = "Houston";
    const latitude = "29.634933";
    const longitude = "-95.220255";
    const ipAddress = "103.238.105.167";
    Countly.setLocation(countryCode, city, `${latitude},${longitude}`, ipAddress);
};
const disableLocation = () => {
    Countly.disableLocation();
};

const setCustomMetrics = () => {
    const customMetric = {
        _carrier: "Custom Carrier",
    };
    Countly.setCustomMetrics(customMetric);
};

const recordDirectAttribution = () => {
    Countly.recordDirectAttribution("countly", campaignData);
};

const recordIndirectAttribution = () => {
    const attributionValues = {};
    if (/ios/.exec(Platform.OS)) {
        attributionValues[AttributionKey.IDFA] = "IDFA";
    } else {
        attributionValues[AttributionKey.AdvertisingID] = "AdvertisingID";
    }

    Countly.recordIndirectAttribution(attributionValues);
};

function OthersScreen({ navigation }) {
    return (
        <SafeAreaView>
            <ScrollView>
                <CountlyButton onPress={setLocation} title="Set Location" color="#00b5ad" />
                <CountlyButton onPress={disableLocation} title="Disable Location" color="#00b5ad" />
                <CountlyButton onPress={setCustomMetrics} title="Set Custom Metrics" color="#00b5ad" />
                <CountlyButton onPress={recordDirectAttribution} title="Record Direct Attribution" color="#1b1c1d" lightText={true} />
                <CountlyButton onPress={recordIndirectAttribution} title="Record Indirect Attribution" color="#1b1c1d" lightText={true} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default OthersScreen;
