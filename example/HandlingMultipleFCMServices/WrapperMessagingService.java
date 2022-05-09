package com.countly.demo;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService;
import ly.count.android.sdk.react.CountlyMessagingService;


public class WrapperMessagingService extends FirebaseMessagingService {


    private List<FirebaseMessagingService> messagingServices = new ArrayList<>(2);

    public WrapperMessagingService() {
        messagingServices.add(new CountlyMessagingService());
        messagingServices.add(new ReactNativeFirebaseMessagingService());
    }

    private void addService(FirebaseMessagingService firebaseMessagingService) {
        injectContext(firebaseMessagingService);
        messagingServices.add(firebaseMessagingService);
    }

    @Override
    public void onNewToken(String s) {
        delegate(service -> {
            injectContext(service);
            service.onNewToken(s);
        });
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        delegate(service -> {
            injectContext(service);
            service.onMessageReceived(remoteMessage);
        });
    }

    private void delegate(GCAction1<FirebaseMessagingService> action) {
        for (FirebaseMessagingService service : messagingServices) {
            action.run(service);
        }
    }

    private void injectContext(FirebaseMessagingService service) {
        // tested on emulator with Android Q (Dev Preview 1)
        // Accessing hidden field Landroid/content/ContextWrapper;->mBase:Landroid/content/Context; (greylist, reflection)
        //
        // https://developer.android.com/distribute/best-practices/develop/restrictions-non-sdk-interfaces
        // https://android.googlesource.com/platform/frameworks/base/+/pie-release/config/hiddenapi-light-greylist.txt
        setField(service, "mBase", this);
    }

    private boolean setField(Object targetObject, String fieldName, Object fieldValue) {
        Field field;
        try {
            field = targetObject.getClass().getDeclaredField(fieldName);
        } catch (NoSuchFieldException e) {
            field = null;
        }
        Class superClass = targetObject.getClass().getSuperclass();
        while (field == null && superClass != null) {
            try {
                field = superClass.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                superClass = superClass.getSuperclass();
            }
        }
        if (field == null) {
            return false;
        }
        field.setAccessible(true);
        try {
            field.set(targetObject, fieldValue);
            return true;
        } catch (IllegalAccessException e) {
            return false;
        }
    }

    interface GCAction1<T> {
        void run(T t);
    }
}
