const STORAGE_KEY = "air-verdict-cases";
function localCases() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (error) { console.warn("Could not read saved cases", error); return []; } }
function saveLocalCases(cases) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases.slice(0, 20))); return cases.slice(0, 20); }
function isGuestUser() { return Boolean(getSession()?.guest); }
function caseKey(item) { return `${item.mode || "flight"}:${item.reference}`; }

function normalizeCase(item) {
    if (!item) return item;
    const mode = item.mode || "flight";
    const reference = item.reference || item.flightNumber || "";
    return {
        ...item,
        id: item.id || `${mode}:${reference}`,
        mode,
        modeLabel: item.modeLabel || (typeof getMode === "function" ? getMode(mode).label : mode),
        reference,
        operator: item.operator || item.airline || "",
        issueLabel: item.issueLabel || item.label || "",
        context: item.context || item.route || "",
        value: item.value != null ? item.value : item.hours,
        savedAt: item.savedAt || new Date().toISOString()
    };
}

async function loadCases() {
    if (isGuestUser() || !getSupabaseAccessToken()) return localCases().map(normalizeCase);
    const rows = await supabaseRequest("/rest/v1/cases?select=*&order=created_at.desc", { accessToken: getSupabaseAccessToken() });
    return rows.map((row) => normalizeCase({ ...row.verdict, id: row.id, savedAt: row.created_at }));
}
async function addCase(item) {
    const normalized = normalizeCase(item);
    if (isGuestUser() || !getSupabaseAccessToken()) {
        const cases = localCases().filter((entry) => caseKey(normalizeCase(entry)) !== caseKey(normalized));
        cases.unshift({ ...normalized, savedAt: new Date().toISOString() });
        return saveLocalCases(cases);
    }
    const token = getSupabaseAccessToken();
    await supabaseRequest(`/rest/v1/cases?flight_number=eq.${encodeURIComponent(normalized.reference)}`, { method: "DELETE", accessToken: token });
    await supabaseRequest("/rest/v1/cases", {
        method: "POST",
        accessToken: token,
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: getSession().id, flight_number: normalized.reference, airline: normalized.operator, route: normalized.context, issue: normalized.issue, delay_hours: normalized.value, verdict: normalized })
    });
    return loadCases();
}
async function removeCases() {
    if (isGuestUser() || !getSupabaseAccessToken()) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
    }
    await supabaseRequest("/rest/v1/cases?id=not.is.null", { method: "DELETE", accessToken: getSupabaseAccessToken() });
    return [];
}
async function removeCase(caseId) {
    if (isGuestUser() || !getSupabaseAccessToken()) {
        const cases = localCases().filter((entry) => entry.id !== caseId);
        saveLocalCases(cases);
        return;
    }
    const token = getSupabaseAccessToken();
    await supabaseRequest(`/rest/v1/cases?id=eq.${encodeURIComponent(caseId)}`, { method: "DELETE", accessToken: token });
}