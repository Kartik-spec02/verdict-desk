const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let currentCase = null;
let currentModeId = "flight";
let checkCount = Number(localStorage.getItem("air-verdict-checks") || 0);
let session = getSession();

function sliderText(mode, value) {
    return mode.slider.unit ? `${value} ${mode.slider.unit}` : `Level ${value}`;
}

function getAnalysis(modeId, reference, issueId, value, operator) {
    const mode = getMode(modeId);
    const issue = mode.issues.find((item) => item.id === issueId) || mode.issues[0];
    const resolvedOperator = (operator || "").trim() || mode.defaultOperator({ reference, value });
    const ctx = { mode, reference, value, operator: resolvedOperator };
    return {
        id: `${mode.id}:${reference}`,
        mode: mode.id,
        modeLabel: mode.label,
        reference,
        operator: resolvedOperator,
        issue: issue.id,
        issueLabel: issue.label,
        value,
        label: issue.label,
        summary: typeof issue.summary === "function" ? issue.summary(ctx) : issue.summary,
        reason: issue.reason(ctx),
        entitlement: issue.entitlement(ctx),
        source: issue.source || mode.source,
        context: mode.context ? mode.context(ctx) : "",
        savedAt: new Date().toISOString()
    };
}

function setView(viewName) {
    $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
    $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
    $("#page-name").textContent = viewName === "checker" ? "Rights checker" : viewName === "rights" ? "Rights library" : viewName === "cases" ? "My cases" : "Overview";
    $("#sidebar").classList.remove("open");
    if (viewName === "cases") renderCases();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderRights(filter = "all", search = "") {
    const query = search.toLowerCase();
    const items = RIGHTS.filter((right) => (filter === "all" || right.mode === filter) && `${right.title} ${right.summary} ${right.tag} ${right.detail}`.toLowerCase().includes(query));
    $("#rights-grid").innerHTML = items.length ? items.map((right) => `<article class="right-card"><div class="right-card-top"><span class="right-icon">${right.icon}</span><span class="right-tag">${right.tag}</span></div><h2>${right.title}</h2><p>${right.summary}</p><details><summary>Read the guide <span>+</span></summary><p>${right.detail}</p><small>${right.source}</small></details></article>`).join("") : `<div class="empty-state"><span>⌕</span><h2>No rights found</h2><p>Try a different search term.</p></div>`;
}

function caseRow(item) {
    return `<button class="case-row" data-case-open="${item.id}"><span class="case-ref">${item.reference}</span><span class="case-op">${item.operator}</span><span class="case-issue">${item.issueLabel || item.label}</span><span class="case-when">${new Date(item.savedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span></button>`;
}

function openCase(cases, button) {
    const item = cases.find((entry) => entry.id === button.dataset.caseOpen);
    if (!item) return;
    currentCase = item;
    selectMode(item.mode || "flight");
    $("#flight-input").value = item.reference || "";
    $("#operator-input").value = item.operator || "";
    $("#issue-input").value = item.issue;
    $("#delay-input").value = item.value != null ? item.value : 0;
    $("#delay-output").textContent = sliderText(getMode(item.mode || "flight"), Number(item.value != null ? item.value : 0));
    setView("checker");
    renderResult(item);
}

function renderSignal(cases) {
    const content = $("#signal-content");
    const status = $("#signal-status");
    if (!content) return;
    if (!cases.length) {
        if (status) { status.textContent = "Waiting"; status.classList.remove("live"); }
        content.innerHTML = `<div class="live-empty"><span class="live-empty-mark">+</span><b>No journey monitored yet</b><p>Run a rights check and this panel fills with your latest verdict and a link back into the case.</p><button class="link-btn" data-view="checker">Start a check →</button></div>`;
        return;
    }
    const item = cases[0];
    if (status) { status.textContent = "Live"; status.classList.add("live"); }
    content.innerHTML = `<div class="live-case"><div class="live-case-top"><span class="badge">${item.label}</span><span class="live-ref">${item.reference}</span></div><h3>${item.operator}</h3><p>${item.summary}</p><div class="live-case-actions"><button class="link-btn" data-case-open="${item.id}">View case →</button><button class="link-btn" data-view="cases">All cases →</button></div></div>`;
}

async function renderRecent() {
    let cases;
    try { cases = await loadCases(); } catch (error) { console.error("Could not load cases", error); cases = []; }
    $("#case-count").textContent = cases.length;
    if ($("#case-count-chip")) $("#case-count-chip").textContent = `${cases.length} saved`;
    $("#saved-metric").textContent = cases.length;
    $("#saved-line").style.width = `${Math.min(cases.length * 12, 100)}%`;
    $("#checks-metric").textContent = checkCount;
    $("#rights-metric").textContent = RIGHTS.length;
    $("#rights-line").style.width = `${Math.min(RIGHTS.length * 12, 100)}%`;
    $("#recent-list").innerHTML = cases.length ? cases.slice(0, 3).map(caseRow).join("") : `<div class="table-empty"><b>No journeys analysed yet</b><span>Run a check and the verdict shows up here with a shortcut back into the case.</span><button class="link-btn" data-view="checker">Run your first check →</button></div>`;
    renderSignal(cases);
    $$("[data-case-open]").forEach((button) => button.addEventListener("click", () => openCase(cases, button)));
    $$("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
}

async function updateClaimScore() {
    let saved = 0;
    try { saved = (await loadCases()).length; } catch (error) { console.error("Could not calculate case health", error); }
    const score = saved ? Math.min(92, 72 + Math.min(saved * 4, 12)) : 0;
    const ring = $("#score-ring");
    if (ring) {
        ring.classList.toggle("empty-score", !saved);
        ring.style.background = `conic-gradient(var(--accent) ${score * 3.6}deg, var(--canvas-deep) 0)`;
    }
    if ($("#claim-score")) $("#claim-score").textContent = score;
    if ($("#claim-score-side")) $("#claim-score-side").textContent = score;
    if ($("#claim-bar")) $("#claim-bar").style.width = `${score}%`;
    if ($("#claim-title")) $("#claim-title").textContent = saved ? "Ready" : "No case yet";
    if ($("#claim-side-title")) $("#claim-side-title").textContent = saved ? "Case ready to revisit" : "No case yet";
    const copy = saved
        ? `${saved} saved case${saved === 1 ? "" : "s"} in your history. Reopen one to check the rule and the evidence.`
        : "Start a rights check to score your position.";
    if ($("#claim-copy")) $("#claim-copy").textContent = copy;
    if ($("#claim-side-copy")) $("#claim-side-copy").textContent = copy;
    $$(".checklist li").forEach((item, index) => item.classList.toggle("done", saved > 0 && index === 0));
}

async function renderCases() {
    let cases;
    try { cases = await loadCases(); } catch (error) { console.error("Could not load saved cases", error); cases = []; }
    $("#cases-list").innerHTML = cases.length ? cases.map(caseRow).join("") : `<div class="empty-state"><span>□</span><h2>No saved cases yet</h2><p>Analyze a journey and save it here for later. Saved cases keep the verdict, the matched rule and the drafted next step, so you can pick the claim back up whenever you are ready.</p><button class="primary-btn" data-view="checker">Check a journey →</button></div>`;
    $$("[data-case-open]").forEach((button) => button.addEventListener("click", () => openCase(cases, button)));
    $$("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
}

async function renderResult(data) {
    $("#verdict-title").textContent = `${data.modeLabel} ${data.reference} has a verdict`;
    $("#verdict-badge").textContent = data.label;
    $("#verdict-summary").textContent = data.summary;
    $("#flight-route").textContent = data.context ? `${data.operator}  |  ${data.context}` : data.operator;
    $("#verdict-reason").textContent = data.reason;
    $("#verdict-action").textContent = data.entitlement;
    $("#verdict-source").textContent = data.source;
    $("#letter-section").classList.add("hidden");
    $("#letter-btn").classList.remove("hidden");
    $("#letter-btn").disabled = false;
    const cases = await loadCases();
    const isSaved = cases.some((item) => item.id === data.id);
    $("#save-case-btn").textContent = isSaved ? "Saved to cases" : "Save this case";

    const actionsContainer = $("#result-section .result-actions");
    if (actionsContainer && !actionsContainer.dataset.enhanced) {
        actionsContainer.dataset.enhanced = "true";
        actionsContainer.innerHTML = `
            <button class="primary-btn" id="letter-btn">Generate claim letter <span>→</span></button>
            <button class="outline-btn" id="save-case-btn">Save this case</button>
            <button class="outline-btn" id="export-case-btn"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Export</span></button>
            <button class="outline-btn" id="share-case-btn"><svg viewBox="0 0 24 24" width="16" height="16"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg><span>Share</span></button>
            <span class="source-note" id="verdict-source"></span>
        `;
        $("#export-case-btn")?.addEventListener("click", () => exportCaseAsPDF(data));
        $("#share-case-btn")?.addEventListener("click", () => shareCase(data));
    } else if (actionsContainer) {
        const newExportBtn = $("#export-case-btn");
        const newShareBtn = $("#share-case-btn");
        if (newExportBtn) {
            newExportBtn.replaceWith(newExportBtn.cloneNode(true));
            $("#export-case-btn")?.addEventListener("click", () => exportCaseAsPDF(data));
        }
        if (newShareBtn) {
            newShareBtn.replaceWith(newShareBtn.cloneNode(true));
            $("#share-case-btn")?.addEventListener("click", () => shareCase(data));
        }
    }

    $("#result-section").classList.remove("hidden");
    if (typeof updateChatContext === "function") updateChatContext();
    $("#result-section").scrollIntoView({ behavior: "smooth", block: "start" });

    if (!localStorage.getItem('verdct-first-verdict')) {
        localStorage.setItem('verdct-first-verdict', 'true');
        setTimeout(() => {
            if (window.triggerConfetti) triggerConfetti();
        }, 300);
    }
}

function analyzeJourney() {
    const mode = getMode(currentModeId);
    const input = $("#flight-input").value.trim().toUpperCase().replace(/\s+/g, "");
    $("#error-msg").classList.add("hidden");
    if (!mode.referencePattern.test(input)) {
        $("#error-msg").textContent = mode.referenceError;
        $("#error-msg").classList.remove("hidden");
        $("#flight-input").focus();
        return;
    }
    currentCase = getAnalysis(mode.id, input, $("#issue-input").value, Number($("#delay-input").value), $("#operator-input").value);
    $("#result-section").classList.add("hidden");
    $("#loading-section").classList.remove("hidden");
    setTimeout(async () => {
        checkCount += 1;
        localStorage.setItem("air-verdict-checks", checkCount);
        $("#loading-section").classList.add("hidden");
        await renderResult(currentCase);
        renderRecent();
    }, 650);
}

function generateLetter() {
    if (!currentCase) return;
    const button = $("#letter-btn");
    button.textContent = "Drafting your letter...";
    button.disabled = true;
    const letter = `Subject: Request for assistance - ${currentCase.modeLabel} ${currentCase.reference}\n\nDear ${currentCase.operator} Customer Support,\n\nI am writing regarding ${currentCase.issueLabel.toLowerCase()} affecting ${currentCase.modeLabel.toLowerCase()} ${currentCase.reference}${currentCase.context ? ` (${currentCase.context})` : ""}.\n\nUnder ${currentCase.source}, I request the assistance and entitlements applicable to this situation: ${currentCase.entitlement}\n\nPassenger name: [Your full name]\nBooking reference: [Your booking reference]\nDate of travel: [Date]\n\nPlease respond in writing within seven days. I have retained my booking confirmation and travel records for reference.\n\nSincerely,\n[Your full name]\n[Phone number]`;
    setTimeout(() => {
        $("#letter-text").value = letter;
        $("#letter-section").classList.remove("hidden");
        button.classList.add("hidden");
    }, 450);
}

async function copyLetter() {
    const button = $("#copy-btn");
    try { await navigator.clipboard.writeText($("#letter-text").value); }
    catch { $("#letter-text").select(); document.execCommand("copy"); }
    button.textContent = "Copied!";
    setTimeout(() => { button.textContent = "Copy text"; }, 1800);
}

function exportCaseAsPDF(caseData) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const accent = [29, 78, 216];
        const ink = [16, 24, 40];
        const muted = [102, 112, 133];
        const canvas = [245, 246, 247];
        
        doc.setFillColor(...accent);
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('VERDICT DESK', 20, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Travel rights, made clear', 20, 28);
        
        doc.setFillColor(255, 255, 255, 0.2);
        doc.roundedRect(20, 32, 45, 8, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('CLAIM LETTER', 23, 37.5);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        doc.text(`Generated: ${today}`, 160, 20);
        
        let y = 55;
        doc.setFillColor(...canvas);
        doc.roundedRect(15, y, 180, 35, 4, 4, 'F');
        
        doc.setTextColor(...ink);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${caseData.modeLabel} ${caseData.reference}`, 20, y + 10);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...muted);
        doc.text(`${caseData.operator}  |  ${caseData.context || 'N/A'}`, 20, y + 18);
        doc.text(`Issue: ${caseData.issueLabel}`, 20, y + 25);
        
        const badgeColor = caseData.label === 'Eligible' ? [18, 128, 92] : caseData.label === 'Partial' ? [181, 71, 8] : [217, 45, 32];
        doc.setFillColor(...badgeColor);
        doc.roundedRect(145, y + 5, 40, 12, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(caseData.label.toUpperCase(), 149, y + 13.5);
        
        y += 45;
        
        const sections = [
            { title: 'WHY THIS APPLIES', body: caseData.reason },
            { title: 'WHAT YOU ARE OWED', body: caseData.entitlement },
            { title: 'SOURCE REGULATION', body: caseData.source }
        ];
        
        sections.forEach((section, i) => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            doc.setFillColor(...accent);
            doc.rect(15, y, 180, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(section.title, 20, y + 7);
            
            y += 14;
            doc.setTextColor(...ink);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            const lines = doc.splitTextToSize(section.body, 170);
            doc.text(lines, 20, y);
            y += lines.length * 5 + 8;
        });
        
        if (y > 220) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFillColor(...canvas);
        doc.roundedRect(15, y, 180, 85, 4, 4, 'F');
        
        y += 8;
        doc.setTextColor(...accent);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('READY TO SEND — CLAIM LETTER TEMPLATE', 20, y);
        
        y += 10;
        doc.setTextColor(...ink);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const letter = generateClaimLetter(caseData);
        const letterLines = doc.splitTextToSize(letter, 170);
        doc.text(letterLines, 20, y);
        y += letterLines.length * 4.5 + 10;
        
        doc.setTextColor(...muted);
        doc.setFontSize(7);
        doc.text('This document is for informational purposes only and does not constitute legal advice.', 105, 285, { align: 'center' });
        doc.text('Verdict Desk | Travel rights, made clear', 105, 290, { align: 'center' });
        
        const filename = `claim-${caseData.reference}-${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(filename);
        
        if (window.showToast) showToast('Claim letter exported as PDF', 'success');
    } catch (e) {
        console.error('PDF export failed:', e);
        const content = generateClaimLetter(caseData);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claim-${caseData.reference}-${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        if (window.showToast) showToast('Claim letter downloaded (text fallback)', 'info');
    }
}

function shareCase(caseData) {
    const shareData = {
        title: `Verdict: ${caseData.modeLabel} ${caseData.reference}`,
        text: `${caseData.summary}\n\n${caseData.entitlement}`,
        url: window.location.origin + window.location.pathname
    };
    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareData.text).then(() => {
            if (window.showToast) showToast('Case summary copied to clipboard', 'success');
        });
    }
}

function generateClaimLetter(caseData) {
    return `Subject: Request for assistance — ${caseData.modeLabel} ${caseData.reference}

Dear ${caseData.operator} Customer Support,

I am writing regarding ${caseData.issueLabel.toLowerCase()} affecting ${caseData.modeLabel.toLowerCase()} ${caseData.reference}${caseData.context ? ` (${caseData.context})` : ""}.

Under ${caseData.source}, I request the assistance and entitlements applicable to this situation: ${caseData.entitlement}

Passenger name: [Your full name]
Booking reference: [Your booking reference]
Date of travel: [Date]

Please respond in writing within seven days. I have retained my booking confirmation and travel records for reference.

Sincerely,
[Your full name]
[Phone number]
`;
}

function renderModeTabs() {
    $("#mode-tabs").innerHTML = MODE_LIST.map((mode) => `<button type="button" class="mode-tab${mode.id === currentModeId ? " active" : ""}" data-mode="${mode.id}">${mode.label}</button>`).join("");
    $$("#mode-tabs .mode-tab").forEach((tab) => tab.addEventListener("click", () => selectMode(tab.dataset.mode)));
}

function selectMode(modeId) {
    currentModeId = modeId;
    const mode = getMode(modeId);
    $$("#mode-tabs .mode-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === modeId));
    $("#reference-label-text").textContent = mode.referenceLabel;
    $("#flight-input").placeholder = mode.referencePlaceholder;
    $("#operator-label-text").textContent = `${mode.operatorLabel} (optional)`;
    $("#operator-input").placeholder = mode.operatorPlaceholder;
    $("#delay-label-text").textContent = mode.slider.label;
    const slider = $("#delay-input");
    slider.min = mode.slider.min;
    slider.max = mode.slider.max;
    slider.step = mode.slider.step;
    slider.value = mode.slider.default;
    $("#delay-output").textContent = sliderText(mode, Number(slider.value));
    $("#issue-input").innerHTML = mode.issues.map((issue) => `<option value="${issue.id}">${issue.label}</option>`).join("");
}

function setTodayLabels() {
    const now = new Date();
    const longDate = now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    if ($("#today-overline")) $("#today-overline").textContent = longDate;
    if ($("#top-note-date")) $("#top-note-date").textContent = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    if ($("#greeting")) $("#greeting").textContent = `${greeting},`;
}

function updateAccountUI() {
    const name = session?.name || "Guest";
    const avatarSymbols = ["✦", "◈", "●", "◆", "✚", "▲", "✺", "✧"];
    const avatarSeed = `${session?.email || name}:${session?.signedInAt || ""}`;
    const avatarIndex = [...avatarSeed].reduce((total, character) => total + character.charCodeAt(0), 0) % avatarSymbols.length;
    const avatar = avatarSymbols[avatarIndex];
    $("#welcome-name").textContent = `${name}.`;
    $("#account-name").textContent = name;
    $("#avatar").textContent = avatar;
    $("#menu-avatar").textContent = avatar;
    $("#avatar").className = `avatar avatar-${avatarIndex}`;
    $("#menu-avatar").className = `avatar avatar-${avatarIndex}`;
    $("#avatar").setAttribute("aria-label", `${name}'s avatar`);
    $("#menu-avatar").setAttribute("aria-label", `${name}'s avatar`);
    $("#menu-name").textContent = name;
    $("#menu-email").textContent = session?.email || "Local guest session";
}

function openAuth(mode = "signin") {
    $("#auth-overlay").classList.remove("hidden");
    setAuthMode(mode);
    $("#auth-email").focus();
}

function setAuthMode(mode) {
    const signup = mode === "signup";
    $$(".auth-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.authMode === mode));
    $$(".signup-only").forEach((field) => field.classList.toggle("hidden", !signup));
    $("#auth-overline").textContent = signup ? "JOIN THE DESK" : "WELCOME BACK";
    $("#auth-title").textContent = signup ? "Create your desk" : "Sign in to your desk";
    $("#auth-subtitle").textContent = signup ? "Keep every verdict, claim letter and travel case in one place, across sessions and devices." : "Save cases across sessions and keep your travel trail in one place. Your checks still work without an account.";
    $("#auth-submit").innerHTML = `${signup ? "Create account" : "Sign in"} <span>→</span>`;
    $("#auth-form").dataset.mode = mode;
    $("#auth-error").classList.add("hidden");
}

$("#account-trigger").addEventListener("click", (event) => { event.stopPropagation(); $("#account-menu").classList.toggle("hidden"); });
$("#modal-close").addEventListener("click", () => $("#auth-overlay").classList.add("hidden"));
$("#guest-btn").addEventListener("click", () => { session = startGuestSession(); updateAccountUI(); $("#auth-overlay").classList.add("hidden"); });
$$(".auth-tab").forEach((tab) => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
$("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const mode = event.currentTarget.dataset.mode || "signin";
    const submit = $("#auth-submit");
    const email = $("#auth-email").value.trim();
    const password = $("#auth-password").value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        $("#auth-error").textContent = "Enter a valid email address.";
        $("#auth-error").classList.remove("hidden");
        $("#auth-email").focus();
        return;
    }
    if (password.length < 6) {
        $("#auth-error").textContent = "Your password must be at least 6 characters.";
        $("#auth-error").classList.remove("hidden");
        $("#auth-password").focus();
        return;
    }
    submit.disabled = true;
    submit.innerHTML = `${mode === "signup" ? "Creating account..." : "Signing in..."} <span>→</span>`;
    try {
        const result = await authenticateUser($("#auth-name").value, email, password, mode);
        if (!result.session) {
            $("#auth-error").textContent = result.message;
            $("#auth-error").classList.remove("hidden");
            $("#auth-form").reset();
            return;
        }
        session = result.session;
        updateAccountUI();
        $("#auth-overlay").classList.add("hidden");
        $("#auth-form").reset();
    } catch (error) {
        $("#auth-error").textContent = error?.message || "We could not complete that request. Please try again.";
        $("#auth-error").classList.remove("hidden");
    } finally {
        submit.disabled = false;
        submit.innerHTML = `${mode === "signup" ? "Create account" : "Sign in"} <span>→</span>`;
    }
});
$("#signout-btn").addEventListener("click", async () => {
    try {
        await endSession();
        session = null;
        $("#account-menu").classList.add("hidden");
        openAuth();
    } catch (error) {
        $("#auth-error").textContent = error.message;
        $("#auth-error").classList.remove("hidden");
    }
});
document.addEventListener("click", (event) => {
    if (!event.target.closest(".account-menu, #account-trigger")) $("#account-menu").classList.add("hidden");
    const sidebar = $("#sidebar");
    if (sidebar.classList.contains("open") && !event.target.closest("#sidebar, #mobile-menu")) {
        sidebar.classList.remove("open");
    }
    const start = event.target.closest("[data-start-mode]");
    if (start) {
        selectMode(start.dataset.startMode);
        if (start.dataset.startIssue) $("#issue-input").value = start.dataset.startIssue;
        setView("checker");
    }
});

$$("[data-view]").forEach((button) => button.addEventListener("click", (event) => {
    if (button.tagName === "A") event.preventDefault();
    setView(button.dataset.view);
}));
$("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#analyze-btn").addEventListener("click", analyzeJourney);
$("#letter-btn").addEventListener("click", generateLetter);
$("#copy-btn").addEventListener("click", copyLetter);
$("#new-check-btn").addEventListener("click", () => { $("#result-section").classList.add("hidden"); $("#flight-input").value = ""; $("#flight-input").focus(); });
$("#save-case-btn").addEventListener("click", async () => {
    if (!currentCase) return;
    const button = $("#save-case-btn");
    const wasSaved = button.textContent === "Saved to cases";
    button.disabled = true;
    try {
        if (wasSaved) {
            await removeCase(currentCase.id);
            button.textContent = "Save this case";
            if (window.showToast) showToast('Case removed', 'info');
        } else {
            await addCase(currentCase);
            button.textContent = "Saved to cases";
            if (window.showToast) showToast('Case saved — ready to reopen anytime', 'success');
            if (window.triggerConfetti) triggerConfetti();
        }
        await renderRecent();
        await updateClaimScore();
        if ($("#cases-list")) renderCases();
    } catch (error) {
        $("#error-msg").textContent = error.message || "Could not save this case.";
        $("#error-msg").classList.remove("hidden");
        if (window.showToast) showToast('Could not save case', 'error');
    } finally { button.disabled = false; }
});
$("#clear-cases").addEventListener("click", async () => {
    const button = $("#clear-cases");
    button.disabled = true;
    try { await removeCases(); await renderRecent(); await renderCases(); }
    catch (error) { console.error("Could not clear cases", error); }
    finally { button.disabled = false; }
});
$("#flight-input").addEventListener("keydown", (event) => { if (event.key === "Enter") analyzeJourney(); });
$("#delay-input").addEventListener("input", (event) => { $("#delay-output").textContent = sliderText(getMode(currentModeId), Number(event.target.value)); });
$$(".filter-tab").forEach((tab) => tab.addEventListener("click", () => { $$(".filter-tab").forEach((item) => item.classList.remove("active")); tab.classList.add("active"); renderRights(tab.dataset.filter, $("#rights-search").value); }));
$("#rights-search").addEventListener("input", (event) => renderRights($(".filter-tab.active").dataset.filter, event.target.value));

setTodayLabels();
renderModeTabs();
selectMode(currentModeId);
renderRights();
renderRecent();
updateClaimScore();
updateAccountUI();
setView("overview");
if (!session) openAuth();

supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession ? sessionFromUser(nextSession.user) : (session?.guest ? session : null);
    if (session) {
        localStorage.setItem("air-verdict-session", JSON.stringify(session));
        updateAccountUI();
    }
});

restoreSupabaseSession().then((restored) => {
    session = restored || session;
    updateAccountUI();
    if (session) $("#auth-overlay").classList.add("hidden");
    else openAuth();
}).catch((error) => {
    console.error("Could not restore the Supabase session", error);
    if (!session) openAuth();
});