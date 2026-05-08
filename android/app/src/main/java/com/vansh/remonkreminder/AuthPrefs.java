package com.vansh.remonkreminder;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Reads the Supabase auth session that the JS app mirrors via
 * Capacitor Preferences. Capacitor stores Preferences in
 * SharedPreferences named "CapacitorStorage".
 */
public class AuthPrefs {
    public String accessToken;
    public String refreshToken;
    public String userId;
    public String supabaseUrl;
    public String anonKey;

    public static AuthPrefs read(Context ctx) {
        AuthPrefs a = new AuthPrefs();
        SharedPreferences sp = ctx.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        a.accessToken = sp.getString("remonk.auth.access_token", null);
        a.refreshToken = sp.getString("remonk.auth.refresh_token", null);
        a.userId = sp.getString("remonk.auth.user_id", null);
        a.supabaseUrl = sp.getString("remonk.auth.supabase_url", null);
        a.anonKey = sp.getString("remonk.auth.anon_key", null);
        return a;
    }
}
