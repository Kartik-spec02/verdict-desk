const SUPABASE_URL = "https://fwsrnrdttvvupfvskokq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xWAbF4uoxXFcVS5sOucZjw_Qkz8zzKv";
const SUPABASE_SESSION_KEY = "air-verdict-supabase-session";

function supabaseHeaders(accessToken = "") {
    return {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    };
}

async function supabaseRequest(path, options = {}) {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
        ...options,
        headers: { ...supabaseHeaders(options.accessToken), ...(options.headers || {}) }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 429) throw new Error("Supabase email limit reached. Wait a few minutes or use an existing account to sign in.");
        throw new Error(body.msg || body.message || body.error_description || body.error || "Supabase request failed.");
    }
    return body;
}

const supabaseClient = {
    auth: {
        async signUp({ email, password, options }) {
            const data = await supabaseRequest("/auth/v1/signup", {
                method: "POST",
                body: JSON.stringify({ email, password, data: options?.data || {} })
            });
            if (data.access_token) localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(data));
            return { data: { user: data.user || null, session: data.access_token ? data : null }, error: null };
        },
        async signInWithPassword({ email, password }) {
            const data = await supabaseRequest("/auth/v1/token?grant_type=password", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
            localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(data));
            return { data: { user: data.user, session: data }, error: null };
        },
        async getSession() {
            try {
                const session = JSON.parse(localStorage.getItem(SUPABASE_SESSION_KEY) || "null");
                return { data: { session }, error: null };
            } catch (error) {
                return { data: { session: null }, error };
            }
        },
        onAuthStateChange() {
            return { data: { subscription: { unsubscribe() {} } } };
        },
        async signOut() {
            const stored = JSON.parse(localStorage.getItem(SUPABASE_SESSION_KEY) || "null");
            if (stored?.access_token) {
                await supabaseRequest("/auth/v1/logout", { method: "POST", accessToken: stored.access_token });
            }
            localStorage.removeItem(SUPABASE_SESSION_KEY);
            return { error: null };
        }
    }
};

function getSupabaseAccessToken() {
    try { return JSON.parse(localStorage.getItem(SUPABASE_SESSION_KEY) || "null")?.access_token || ""; }
    catch { return ""; }
}
