package ly.count.android.sdk.react;

import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import ly.count.android.sdk.messaging.CountlyConfigPush;
import ly.count.android.sdk.messaging.CountlyPush;
import ly.count.android.sdk.Countly;

public class CountlyMessagingService extends FirebaseMessagingService {

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        if(Countly.sharedInstance().isLoggingEnabled()) {
            Log.d(Countly.TAG, "[CountlyMessagingService] got new token: " + token);
        }
        if(Countly.sharedInstance().isInitialized()) {
            CountlyPush.onTokenRefresh(token);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        if(Countly.sharedInstance().isLoggingEnabled()) {
            Log.d(Countly.TAG, "[CountlyMessagingService] got new message: " + remoteMessage.getData().toString());
        }

        if(!Countly.sharedInstance().isInitialized()) {
            Application application = getApplication();
            if(application == null){
                Log.d(Countly.TAG, "[CountlyMessagingService] getApplication() returns null: application must be non-null to init CountlyPush");
            }
            else {
                CountlyConfigPush configPush = new CountlyConfigPush(application);
                CountlyPush.init(configPush);
            }
        }


        // decode message data and extract meaningful information from it: title, body, badge, etc.
        CountlyPush.Message message = CountlyPush.decodeMessage(remoteMessage.getData());

        // if (message != null && message.message().contains("typ")) {
        //     // custom handling only for messages with specific "typ" keys
        //     message.recordAction(getApplicationContext());
        //     return;
        // }
        Context context = getApplicationContext();
        if(context == null){
            Log.d(Countly.TAG, "[CountlyMessagingService] getApplicationContext() returns null: context must be non-null to displayNotification");
            return;
        }
        Boolean result = CountlyPush.displayMessage(context, message, context.getApplicationInfo().icon, null);
        if(Countly.sharedInstance().isLoggingEnabled()) {
            if (result == null) {
                Log.i(Countly.TAG, "[CountlyMessagingService] Message wasn't sent from Countly server, so it cannot be handled by Countly SDK");
            } else if (result) {
                Log.i(Countly.TAG, "[CountlyMessagingService] Message was handled by Countly SDK");
            } else {
                Log.i(Countly.TAG, "[CountlyMessagingService] Message wasn't handled by Countly SDK because API level is too low for Notification support or because currentActivity is null (not enough lifecycle method calls)");
            }
        }
        
        // 'onNotification' should be called at the end of 'onMessageReceived'. This is due to an unknown issue that prevents showing notifications from the "killed" state for some app/hardware configurations
        CountlyReactNativeImpl.onNotification(remoteMessage.getData());
    }

    @Override
    public void onDeletedMessages() {
        super.onDeletedMessages();
    }
}
