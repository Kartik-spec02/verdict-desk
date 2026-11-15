const CHAT_KEY = "air-verdict-chat";

function currentSubject() {
    if (typeof currentCase !== "undefined" && currentCase) return `For ${currentCase.modeLabel.toLowerCase()} ${currentCase.reference}, ${currentCase.operator} should be able to explain the situation clearly. `;
    return "";
}

function getRuleBasedReply(message) {
    const text = message.toLowerCase();
    const subject = currentSubject();
    if (text.includes("refund") || text.includes("money back") || text.includes("cancel")) {
        return `${subject}Ask whether you can choose a refund or an alternative, and request the answer in writing. Keep the cancellation or delay notice, booking confirmation and any receipts.`;
    }
    if (text.includes("evidence") || text.includes("proof") || text.includes("document") || text.includes("receipt") || text.includes("keep")) {
        return "Keep your booking confirmation, ticket or PNR, any delay or cancellation messages, screenshots of the status, and receipts for reasonable expenses. Write down the time and name of anyone you speak with.";
    }
    if (text.includes("train") || text.includes("railway") || text.includes("rail") || text.includes("pnr") || text.includes("tdr")) {
        return "For trains, track the live running status and keep your PNR. If the train is cancelled or you do not travel, ask about an alternate train or file a TDR for a refund. At the station, ask the station manager for written confirmation of any cancellation.";
    }
    if (text.includes("bus") || text.includes("operator")) {
        return `${subject}For buses, ask the operator for the reason and the next available bus or a refund under its policy. Keep your ticket and any messages, and raise a written refund request with your ticket number if needed.`;
    }
    if (text.includes("cab") || text.includes("ola") || text.includes("uber") || text.includes("metro") || text.includes("ride")) {
        return "For cabs and metro, compare the final fare with the estimate, raise an in-app complaint with the fare breakdown, and keep the receipt. For safety issues, use the in-app SOS or helpline and report it in writing.";
    }
    if (text.includes("hotel") || text.includes("room") || text.includes("booking") || text.includes("checkin") || text.includes("check-in")) {
        return "For hotels, report problems to the front desk immediately and ask for the booked room type or an equivalent at no extra cost. Keep the booking confirmation, dated photos and the name of the staff member you spoke with.";
    }
    if (text.includes("baggage") || text.includes("bag") || text.includes("lost")) {
        return "For lost or damaged baggage, file a report before leaving the airport or station. Keep the report number, baggage tag, ticket and receipts for essential purchases.";
    }
    if (text.includes("ask") || text.includes("airline") || text.includes("meal") || text.includes("food") || text.includes("compensation") || text.includes("owe") || text.includes("eligible")) {
        return `${subject}Ask them to confirm in writing what assistance, refund or compensation applies to your situation, and request the reason for the disruption. Eligibility depends on the cause, notice given and the applicable rules; the operator must confirm the final remedy.`;
    }
    if (text.includes("rule") || text.includes("law") || text.includes("dgca") || text.includes("irctc") || text.includes("policy")) {
        return "The relevant rules depend on how you travelled: flights follow the DGCA Passenger Charter, trains follow Indian Railways refund rules, and buses, cabs and hotels follow the operator's terms and consumer law. Tell me the mode and what happened for a more specific answer.";
    }
    return "I can help with refunds, delays, cancellations, denied boarding, baggage, train waitlists, bus tickets, cab fares and hotel problems, plus the evidence to keep. Tell me how you travelled and what went wrong.";
}

function buildChatContext() {
    if (typeof currentCase !== "undefined" && currentCase) {
        return `Current case: ${currentCase.modeLabel} ${currentCase.reference} with ${currentCase.operator}. Issue: ${currentCase.issueLabel}. Delay: ${currentCase.value}h.`;
    }
    return "No active case. General travel guidance mode.";
}

async function getChatReply(message) {
    const context = buildChatContext();
    
    if (typeof isGeminiConfigured === "function" && isGeminiConfigured()) {
        try {
            return await askGemini(message, context);
        } catch (e) {
            console.warn("Gemini failed, using fallback:", e);
        }
    }
    return getRuleBasedReply(message);
}

async function getChatReplyStream(message, onChunk) {
    const context = buildChatContext();
    
    if (typeof isGeminiConfigured === "function" && isGeminiConfigured()) {
        try {
            await askGeminiStream(message, context, onChunk);
            return;
        } catch (e) {
            console.warn("Gemini streaming failed, using fallback:", e);
        }
    }
    const fallback = getRuleBasedReply(message);
    onChunk(fallback);
}

function getChatHistory() {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]"); } catch { return []; }
}

function saveChatHistory(history) {
    localStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-30)));
}

function addChatMessage(text, role) {
    const messages = document.getElementById("chat-messages");
    const message = document.createElement("div");
    message.className = `chat-message ${role}`;
    if (role === "assistant") message.innerHTML = `<span class="message-label">VERDICT DESK AI</span><p></p>`;
    else message.innerHTML = "<p></p>";
    message.querySelector("p").textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
}

function restoreChatHistory() {
    getChatHistory().forEach((item) => addChatMessage(item.text, item.role));
}

function sendChatMessage(text) {
    const cleanText = text.trim();
    if (!cleanText) return;
    addChatMessage(cleanText, "user");
    const history = getChatHistory();
    history.push({ text: cleanText, role: "user" });
    saveChatHistory(history);
    const messages = document.getElementById("chat-messages");
    const assistantMsg = addChatMessage("", "assistant");
    const p = assistantMsg.querySelector("p");
    
    getChatReplyStream(cleanText, (chunk) => {
        p.textContent += chunk;
        messages.scrollTop = messages.scrollHeight;
    }).finally(() => {
        const nextHistory = getChatHistory();
        nextHistory.push({ text: p.textContent, role: "assistant" });
        saveChatHistory(nextHistory);
    });
}

function updateChatContext() {
    const context = document.getElementById("chat-context");
    if (typeof currentCase !== "undefined" && currentCase) {
        context.innerHTML = `<span class="chat-live"></span> Context: ${currentCase.modeLabel} ${currentCase.reference} · ${currentCase.operator}`;
    } else {
        context.innerHTML = `<span class="chat-live"></span> General travel guidance mode`;
    }
}

document.getElementById("chat-launcher").addEventListener("click", () => {
    document.getElementById("chat-panel").classList.toggle("hidden");
    updateChatContext();
    document.getElementById("chat-input").focus();
});
document.getElementById("chat-close").addEventListener("click", () => document.getElementById("chat-panel").classList.add("hidden"));
document.getElementById("chat-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    sendChatMessage(input.value);
    input.value = "";
});
document.querySelectorAll(".chat-suggestions button").forEach((button) => {
    button.addEventListener("click", () => sendChatMessage(button.dataset.question));
});
restoreChatHistory();