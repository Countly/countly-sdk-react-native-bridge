package com.pushmodule;

import android.content.Intent;
import android.util.Log;

import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import ly.count.android.sdk.Countly;
import ly.count.android.sdk.messaging.CountlyPush;

// modules needed for sending message data to JS
import java.util.Map;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

/**
 * Demo service explaining Firebase Messaging notifications handling:
 * - how to decode Countly messages;
 * - how to handle other notifications sent from other tools (FCM console, for example);
 * - how to override message handling based on message content;
 * - how to report Actioned metric back to Countly server.
 */

public class DemoFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "Countly";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);

        Log.d("DemoFirebaseService", "got new token: " + token);
        int retries = 1;
        try {
            while (retries <= 10 && !Countly.sharedInstance().isInitialized()) {
              Log.d("DemoFirebaseService", "Waiting for Countly to get initialized");
              Thread.sleep(retries * 1000);
              retries++;
            }
        } catch (InterruptedException e) {
          Thread.currentThread().interrupt();
        }
        if (!Countly.sharedInstance().isInitialized()) {
          Log.d("DemoFirebaseService", "Gave up waiting for Countly to get initialized. Countly onTokenRefresh not called.");
        }
        else {
          CountlyPush.onTokenRefresh(token);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Log.d("DemoFirebaseService", "got new message: " + remoteMessage.getData());

        // decode message data and extract meaningful information from it: title, body, badge, etc.
        CountlyPush.Message message = CountlyPush.decodeMessage(remoteMessage.getData());
        // get react context
        ReactInstanceManager mReactInstanceManager = ((ReactApplication) getApplication()).getReactNativeHost().getReactInstanceManager();
        ReactContext context = mReactInstanceManager.getCurrentReactContext();
        // If app is swiped from recent list context will be null
        if (context != null) {
          Log.d("DemoFirebaseService", "ReactContext constructed");
          // convert message data to react native WritableMap
          final WritableMap params = new WritableNativeMap();
          for(Map.Entry<String, String> entry : remoteMessage.getData().entrySet()) {
              params.putString(entry.getKey(), entry.getValue());
          }
          ((ReactApplicationContext) context)
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit("push_notification", params);
          Log.d("DemoFirebaseService", "React Native Event emitted");
        }


        Log.d("DemoFirebaseService", "Message: " + message.message());



        if (message != null && message.has("typ")) {
            Log.d("DemoFirebaseService", "Message type: " + message.data("typ"));
            // custom handling only for messages with specific "typ" keys
            if (message.data("typ").equals("download")) {
                // Some bg download case.
                // We want to know how much devices started downloads after this particular message,
                // so we report Actioned metric back to server:

                // AppDownloadManager.initiateBackgroundDownload(message.link());
                message.recordAction(getApplicationContext());
                return;
            } else if (message.data("typ").equals("promo")) {
                // Now we want to override default Countly UI for a promo message type.
                // We know that it should contain 2 buttons, so we start Activity
                // which would handle UI and report Actioned metric back to the server.

//                Intent intent = new Intent(this, PromoActivity.class);
//                intent.putExtra("countly_message", message);
//                startActivity(intent);
//
//                // ... and then in PromoActivity:
//
//                final CountlyPush.Message msg = intent.getParcelableExtra("countly_message");
//                if (msg != null) {
//                    Button btn1 = new Button(this);
//                    btn1.setText(msg.buttons().get(0).title());
//                    btn1.setOnClickListener(new View.OnClickListener() {
//                        @Override
//                        public void onClick(View v) {
//                            msg.recordAction(getApplicationContext(), 1);
//                        }
//                    });
//
//                    Button btn2 = new Button(this);
//                    btn2.setText(msg.buttons().get(1).title());
//                    btn2.setOnClickListener(new View.OnClickListener() {
//                        @Override
//                        public void onClick(View v) {
//                            msg.recordAction(getApplicationContext(), 2);
//                        }
//                    });
//                }

                return;
            }
        }

        Intent intent = null;
        intent = new Intent(getApplicationContext(), MainActivity.class);

        Boolean result = CountlyPush.displayMessage(getApplicationContext(), message, getApplicationContext().getApplicationInfo().icon, intent);
        if (result == null) {
            Log.i(TAG, "Message wasn't sent from Countly server, so it cannot be handled by Countly SDK");
        } else if (result) {
            Log.i(TAG, "Message was handled by Countly SDK");
        } else {
            Log.i(TAG, "Message wasn't handled by Countly SDK because API level is too low for Notification support or because currentActivity is null (not enough lifecycle method calls)");
        }
    }

    @Override
    public void onDeletedMessages() {
        super.onDeletedMessages();
    }
}
