package ly.count.android.sdk.react;

import android.content.Context;

import androidx.annotation.NonNull;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;

import ly.count.android.sdk.messaging.CountlyPush;

/**
 * Requests the Firebase push token and hands it to the Countly SDK.
 * The no-push package replaces this class with one that does nothing, so that it does not depend on Firebase.
 */
final class CountlyPushTokenFetcher {

    /**
     * Not instantiated: the class only holds a static helper.
     */
    private CountlyPushTokenFetcher() {
    }

    /**
     * Asks Firebase for the current push token and passes it to CountlyPush when it arrives.
     *
     * @param context any context of the app
     */
    static void fetchToken(Context context) {
        try {
            CountlyReactNativeImpl.log("Will initialize Firebase", CountlyReactNativeImpl.LogLevel.INFO);
            FirebaseApp.initializeApp(context);
            CountlyReactNativeImpl.log("Firebase initialized", CountlyReactNativeImpl.LogLevel.INFO);
            FirebaseMessaging firebaseMessagingInstance = FirebaseMessaging.getInstance();
            CountlyReactNativeImpl.log("FirebaseMessaging instance initialized", CountlyReactNativeImpl.LogLevel.INFO);
            if (firebaseMessagingInstance == null) {
                CountlyReactNativeImpl.log("askForNotificationPermission, firebaseMessagingInstance is null", CountlyReactNativeImpl.LogLevel.WARNING);
                return;
            }
            Task<String> firebaseMessagingTokenTask = firebaseMessagingInstance.getToken();
            CountlyReactNativeImpl.log("FirebaseMessaging token task initialized", CountlyReactNativeImpl.LogLevel.INFO);
            if (firebaseMessagingTokenTask == null) {
                CountlyReactNativeImpl.log("askForNotificationPermission, firebaseMessagingTokenTask is null", CountlyReactNativeImpl.LogLevel.WARNING);
                return;
            }

            firebaseMessagingTokenTask.addOnCompleteListener(new OnCompleteListener<String>() {
                @Override
                public void onComplete(@NonNull Task<String> task) {
                    if (!task.isSuccessful()) {
                        CountlyReactNativeImpl.log("askForNotificationPermission, Fetching FCM registration token failed", task.getException(), CountlyReactNativeImpl.LogLevel.WARNING);
                        return;
                    }

                    String token = task.getResult();
                    CountlyPush.onTokenRefresh(token);
                }
            });
        } catch (Exception exception) {
            CountlyReactNativeImpl.log("askForNotificationPermission, Firebase exception", exception, CountlyReactNativeImpl.LogLevel.WARNING);
        }
    }
}
