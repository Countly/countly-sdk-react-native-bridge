package ly.count.android.sdk.react;

import androidx.annotation.Nullable;
import java.util.HashMap;
import java.util.Map;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;

public class CountlyReactNativePackage extends TurboReactPackage {

    @Nullable
    @Override
    public NativeModule getModule(String name, ReactApplicationContext reactContext) {
      if (name.equals(CountlyReactNativeImpl.NAME)) {
        return new CountlyReactNative(reactContext);
      } else {
        return null;
      }
    }
  
    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
      return () -> {
        final Map<String, ReactModuleInfo> map = new HashMap<>();
        boolean isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        map.put(
            CountlyReactNativeImpl.NAME,
            new ReactModuleInfo(
                CountlyReactNativeImpl.NAME,
                CountlyReactNativeImpl.NAME,
                false, // canOverrideExistingModule
                false, // needsEagerInit
                true, // hasConstants
                false, // isCxxModule
                isTurboModule // isTurboModule
        ));
        return map;
      };
    }
}
