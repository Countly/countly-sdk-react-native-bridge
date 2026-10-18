package ly.count.android.sdk.react;

import android.content.Context;

/**
 * The no-push package has no push notifications, so it never requests a push token.
 */
final class CountlyPushTokenFetcher {

    private CountlyPushTokenFetcher() {
    }

    /**
     * Does nothing, as the no-push package does not depend on Firebase.
     *
     * @param context any context of the app
     */
    static void fetchToken(Context context) {
        CountlyReactNativeImpl.log("askForNotificationPermission, push notifications are not part of the no-push package, ignoring the call", CountlyReactNativeImpl.LogLevel.WARNING);
    }
}
