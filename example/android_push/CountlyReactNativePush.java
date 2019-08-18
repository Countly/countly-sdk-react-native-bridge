package com.pushmodule;

import android.app.Activity;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.util.Map;
import java.util.HashMap;

// for debug logging
import android.util.Log;
import static ly.count.android.sdk.Countly.TAG;

import ly.count.android.sdk.Countly;

// Push Related imports
// import android.support.annotation.NonNull;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;
import ly.count.android.sdk.messaging.CountlyPush;

public class CountlyReactNativePush extends ReactContextBaseJavaModule {
  private ReactApplicationContext _reactContext;

  public CountlyReactNativePush(ReactApplicationContext reactContext) {
    super(reactContext);
    _reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "CountlyReactNativePush";
  }

  @ReactMethod
  public void setupPush(Integer messagingMode, ReadableMap options){
        Log.d(TAG, "Push consent: " + Countly.CountlyFeatureNames.push + " " + Countly.sharedInstance().getConsent(Countly.CountlyFeatureNames.push));
        if (!Countly.sharedInstance().getConsent(Countly.CountlyFeatureNames.push)) {
           Log.d(TAG, "User doesn't have consent for push notifications.");
           return;
        }
        String channelName = "Countly Notifications";
        if (options.hasKey("channelName")) {
           channelName = options.getString("channelName");
        }
        String channelDescription = "<![CDATA[Notifications from Countly React Bridge App]]>";
        if (options.hasKey("channelDescription")) {
           channelDescription = options.getString("channelDescription");
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            // Register the channel with the system; you can't change the importance
            // or other notification behaviors after this
            NotificationManager notificationManager = (NotificationManager) _reactContext.getSystemService(_reactContext.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                // Create the NotificationChannel
                NotificationChannel channel = new NotificationChannel(CountlyPush.CHANNEL_ID, channelName, NotificationManager.IMPORTANCE_DEFAULT);
                channel.setDescription(channelDescription);
                notificationManager.createNotificationChannel(channel);
            }
        }

        final Activity activity = getCurrentActivity();
        Countly.CountlyMessagingMode mode = Countly.CountlyMessagingMode.TEST;
        if (messagingMode == 0) {
           mode = Countly.CountlyMessagingMode.PRODUCTION;
        }
        CountlyPush.init(activity.getApplication(), mode);


        FirebaseInstanceId.getInstance().getInstanceId()
                .addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
                    @Override
                    public void onComplete(Task<InstanceIdResult> task) {
                        if (!task.isSuccessful()) {
                            Log.w(TAG, "getInstanceId failed", task.getException());
                            return;
                        }

                        // Get new Instance ID token
                        String token = task.getResult().getToken();
                        CountlyPush.onTokenRefresh(token);
                    }
                });
  }
}
