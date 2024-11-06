import React, { useState } from 'react';
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Countly from "countly-sdk-react-native-bridge";
import CountlyButton from "./CountlyButton";

interface UserDataPredefined {
    name?: string;
    username?: string;
    email?: string;
    organization?: string;
    phone?: string;
    picture?: string;
    picturePath?: string;
    gender?: string;
    byear?: number;
}

interface UserDataBulkCustom_1 extends UserDataPredefined {
    customeValueA?: string;
    customeValueB?: string;
}
const onSendUserData = () => {
    // example for setUserData
    const options: UserDataPredefined = {
        name: "Name of User",
        username: "Username",
        email: "User Email",
        organization: "User Organization",
        phone: "User Contact number",
        picture: "https://count.ly/images/logos/countly-logo.png",
        picturePath: "",
        gender: "Male",
        byear: 1989,
    };
    Countly.setUserData(options);
};

const onSetUserProperties = () => {
    // example for setUserData
    // Predefined user properties
    const options: UserDataBulkCustom_1 = {
        name: "Name of User",
        username: "Username",
        email: "User Email",
        organization: "User Organization",
        phone: "User Contact number",
        picture: "https://count.ly/images/logos/countly-logo.png",
        picturePath: "",
        gender: "Male",
        byear: 1989,
        // Custom User Properties
        customeValueA: "Custom value A",
        customeValueB: "Custom value B",
    };
    Countly.userDataBulk.setUserProperties(options);
    Countly.userDataBulk.save();
};

const onSendUserDataBulk = () => {
    // Promise.allSettled([Countly.userDataBulk.setProperty("key", "value"),
    //   Countly.userDataBulk.setProperty("increment", 5),
    //   Countly.userDataBulk.increment("increment"),
    //   Countly.userDataBulk.setProperty("incrementBy", 5),
    //   Countly.userDataBulk.incrementBy("incrementBy", 10),
    //   Countly.userDataBulk.setProperty("multiply", 5),
    //   Countly.userDataBulk.multiply("multiply", 20),
    //   Countly.userDataBulk.setProperty("saveMax", 5),
    //   Countly.userDataBulk.saveMax("saveMax", 100),
    //   Countly.userDataBulk.setProperty("saveMin", 5),
    //   Countly.userDataBulk.saveMin("saveMin", 50),
    //   Countly.userDataBulk.setOnce("setOnce", 200),
    //   Countly.userDataBulk.pushUniqueValue("type", "morning"),
    //   Countly.userDataBulk.pushValue("type", "morning"),
    //   Countly.userDataBulk.pullValue("type", "morning")])
    //   .then(values => {
    //     // We need to call the "save" in then block else it will cause a race condition and "save" may call before all the user profiles calls are completed
    //     Countly.userDataBulk.save();
    // })
};

const onUpdateUserData = () => {
    // example for setUserData
    const options: UserDataPredefined = {
        organization: "Updated User Organization",
        phone: "Updated User Contact number",
        gender: "Female",
        byear: 1995,
    };
    Countly.setUserData(options);
};

const userData_setProperty = () => {
    Countly.userData.setProperty("setProperty", "keyValue");
};

const userData_increment = () => {
    Countly.userData.setProperty("increment", 5);
    Countly.userData.increment("increment");
};

const userData_incrementBy = () => {
    Countly.userData.setProperty("incrementBy", 5);
    Countly.userData.incrementBy("incrementBy", 10);
};

const userData_multiply = () => {
    Countly.userData.setProperty("multiply", 5);
    Countly.userData.multiply("multiply", 20);
};

const userData_saveMax = () => {
    Countly.userData.setProperty("saveMax", 5);
    Countly.userData.saveMax("saveMax", 100);
};

const userData_saveMin = () => {
    Countly.userData.setProperty("saveMin", 5);
    Countly.userData.saveMin("saveMin", 50);
};

const userData_setOnce = () => {
    Countly.userData.setOnce("setOnce", 200);
};

const userData_pushUniqueValue = () => {
    Countly.userData.pushUniqueValue("type", "morning");
};

const userData_pushValue = () => {
    Countly.userData.pushValue("type", "morning");
};

const userData_pullValue = () => {
    Countly.userData.pullValue("type", "morning");
};

const onSetProperty = () => {
    Countly.userProfile.setProperty("Griselda", ["Conway", "Benny", "Westside Gunn"]);
};

const onSetProperties = () => {
    const userData = {
        name: "John Doe",                  // predefined key, valid type (string)
        username: "johndoe123",            // predefined key, valid type (string)
        email: "john.doe@example.com",     // predefined key, valid type (string)
        organization: "Example Corp",      // predefined key, valid type (string)
        phone: "+1234567890",              // predefined key, valid type (string)
        picture: "https://example.com/avatar.jpg",  // predefined key, valid type (string)
        gender: "M",                       // predefined key, valid type (string)
        byear: 1985,                       // predefined key, valid type (integer)
        customKey1: "Custom Value 1",      // custom key
        customKey2: 42,                    // custom key
        customKey3: ["item1", "item2"],    // custom key (array)
    };
    Countly.userProfile.setProperties(userData);
}

const onIncrement = () => {
    Countly.userProfile.increment("IncrementValue");
}

const onIncrementBy = () => {
    Countly.userProfile.incrementBy("IncrementByValue", 2);
}

const onMultiply = () => {
    Countly.userProfile.multiply("MultiplyValue", 3);
}

const onMax = () => {
    Countly.userProfile.saveMax("Max", 4);
}

const onMin = () => {
    Countly.userProfile.saveMin("Min", 5);
}

const onSetOnce = () => {
    Countly.userProfile.setOnce("Once", 6);
}

const onPushUnique = () => {
    Countly.userProfile.pushUnique("Unique", 7);
}

const onPush = () => {
    Countly.userProfile.push("push", 8);
}

const onPull = () => {
    Countly.userProfile.pull("pull", 9);
}

function UserProfilesScreen({ navigation }) {
    const [showDeprecated, setShowDeprecated] = useState(false);

    const toggleDeprecated = () => {
        setShowDeprecated(prevState => !prevState);
    };
    return (    
        <SafeAreaView>
            <ScrollView>
                <CountlyButton onPress={onSetProperty} title="Set Property" color="#00b5ad" />
                <CountlyButton onPress={onSetProperties} title="Set Properties" color="#00b5ad" />
                <CountlyButton onPress={onIncrement} title="Increment" color="#00b5ad" />
                <CountlyButton onPress={onIncrementBy} title="Increment By" color="#00b5ad" />
                <CountlyButton onPress={onMultiply} title="Multiply" color="#00b5ad" />
                <CountlyButton onPress={onMax} title="Save Max" color="#00b5ad" />
                <CountlyButton onPress={onMin} title="Save Min" color="#00b5ad" />
                <CountlyButton onPress={onSetOnce} title="Set Once" color="#00b5ad" />
                <CountlyButton onPress={onPushUnique} title="Push Unique" color="#00b5ad" />
                <CountlyButton onPress={onPush} title="Push" color="#00b5ad" />
                <CountlyButton onPress={onPull} title="Pull" color="#00b5ad" />
                <CountlyButton onPress={toggleDeprecated} title="Deprecated Calls" color="#00b5ad" />
                {showDeprecated && (
                    <ScrollView>
                        <CountlyButton onPress={onSendUserData} title="Send Users Data" color="#00b5ad" />
                        <CountlyButton onPress={onUpdateUserData} title="Update Users Data" color="#00b5ad" />
                        <CountlyButton onPress={userData_setProperty} title="UserData.setProperty" color="#00b5ad" />
                        <CountlyButton onPress={userData_increment} title="UserData.increment" color="#00b5ad" />
                        <CountlyButton onPress={userData_incrementBy} title="UserData.incrementBy" color="#00b5ad" />
                        <CountlyButton onPress={userData_multiply} title="UserData.multiply" color="#00b5ad" />
                        <CountlyButton onPress={userData_saveMax} title="UserData.saveMax" color="#00b5ad" />
                        <CountlyButton onPress={userData_saveMin} title="UserData.saveMin" color="#00b5ad" />
                        <CountlyButton onPress={userData_setOnce} title="UserData.setOnce" color="#00b5ad" />
                        <CountlyButton onPress={userData_pushUniqueValue} title="UserData.pushUniqueValue" color="#00b5ad" />
                        <CountlyButton onPress={userData_pushValue} title="UserData.pushValue" color="#00b5ad" />
                        <CountlyButton onPress={userData_pullValue} title="UserData.pullValue" color="#00b5ad" />
                        <CountlyButton onPress={onSetUserProperties} title="Set Users Properties" color="#00b5ad" />
                        <CountlyButton onPress={onSendUserDataBulk} title="Send Users Data Bulk" color="#00b5ad" />
                    </ScrollView>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

export default UserProfilesScreen;
