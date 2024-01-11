import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { navigationName } from "./Constants";
import HomeScreen from "./Home";
import FeedbackScreen from "./Feedback";
import EventScreen from "./Events";
import UserProfilesScreen from "./UserProfiles";
import ViewsScreen from "./Views";
import APMScreen from "./APM";
import DeviceIDScreen from "./DeviceID";
import ConsentScreen from "./Consent";
import RemoteConfigScreen from "./RemoteConfig";
import OthersScreen from "./Others";
import CrashesScreen from "./Crashes";
import { Image } from "react-native";

const Stack = createNativeStackNavigator();
class Example extends React.Component {
    render() {
        return (
            <NavigationContainer>
                <Stack.Navigator initialRouteName={navigationName.Home}>
                    <Stack.Screen
                        name={navigationName.Home}
                        component={HomeScreen}
                        options={{
                            headerTitle: (props) => (
                                <Image
                                    source={require("./asset/countly-logo.png")}
                                    style={{ width: 144, height: 42 }}
                                    onError={(e) => {
                                        console.log(e.nativeEvent.error);
                                    }}
                                />
                            ),
                        }}
                    />
                    <Stack.Screen name={navigationName.Feedback} component={FeedbackScreen} />
                    <Stack.Screen name={navigationName.Events} component={EventScreen} />
                    <Stack.Screen name={navigationName.UserProfiles} component={UserProfilesScreen} />
                    <Stack.Screen name={navigationName.Views} component={ViewsScreen} />
                    <Stack.Screen name={navigationName.APM} component={APMScreen} />
                    <Stack.Screen name={navigationName.DeviceID} component={DeviceIDScreen} />
                    <Stack.Screen name={navigationName.Consent} component={ConsentScreen} />
                    <Stack.Screen name={navigationName.RemoteConfig} component={RemoteConfigScreen} />
                    <Stack.Screen name={navigationName.Others} component={OthersScreen} />
                    <Stack.Screen name={navigationName.Crashes} component={CrashesScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        );
    }
}

export default Example;
