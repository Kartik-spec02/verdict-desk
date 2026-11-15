const AUTH_KEY = "air-verdict-session";

function getSession() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); }
    catch (error) { console.warn("Could not read the local session", error); return null; }
}

function sessionFromUser(user) {
    return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Passenger",
        email: user.email || "",
        signedInAt: user.last_sign_in_at || new Date().toISOString()
    };
}

async function restoreSupabaseSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    const nextSession = data.session ? sessionFromUser(data.session.user) : null;
    if (nextSession) localStorage.setItem(AUTH_KEY, JSON.stringify(nextSession));
    else if (!getSession()?.guest) localStorage.removeItem(AUTH_KEY);
    return nextSession;
}

async function authenticateUser(name, email, password, mode) {
    const normalizedEmail = email.trim().toLowerCase();
    const result = mode === "signup"
        ? await supabaseClient.auth.signUp({ email: normalizedEmail, password, options: { data: { name: name.trim() } } })
        : await supabaseClient.auth.signInWithPassword({ email: normalizedEmail, password });
    if (result.error) throw result.error;
    if (!result.data.user) throw new Error("Supabase did not return an account. Please try again.");
    if (mode === "signup" && !result.data.session) {
        return { session: null, message: "Account created. Check your email to confirm it, then sign in." };
    }
    const nextSession = sessionFromUser(result.data.user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(nextSession));
    return { session: nextSession, message: "" };
}

function startGuestSession() {
    const session = { name: "Guest", email: "", guest: true, signedInAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
}

async function endSession() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    localStorage.removeItem(AUTH_KEY);
}
