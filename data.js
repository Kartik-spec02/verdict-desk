const AIRLINES = { "6E": "IndiGo", AI: "Air India", UK: "Vistara", SG: "SpiceJet", IX: "Air India Express", G8: "Go First", QP: "Akasa Air" };
const ROUTES = [["DEL", "BOM"], ["BLR", "DEL"], ["BOM", "GOI"], ["HYD", "DEL"], ["MAA", "BLR"]];

const MODE_LIST = [
    {
        id: "flight",
        label: "Flight",
        operatorLabel: "Airline",
        operatorPlaceholder: "e.g. IndiGo (optional)",
        referenceLabel: "Flight number",
        referencePlaceholder: "e.g. 6E-204",
        referencePattern: /^[A-Z0-9]{2}-?\d{1,4}$/,
        referenceError: "Enter a valid flight number, like 6E-204.",
        source: "DGCA CAR Section 3, Series M, Part IV",
        slider: { label: "How long was the delay?", min: 0, max: 12, step: 1, unit: "hours", default: 4 },
        defaultOperator(ctx) {
            const code = ctx.reference.replace(/[^A-Z0-9]/g, "").slice(0, 2);
            return AIRLINES[code] || "Your airline";
        },
        context(ctx) {
            const route = ROUTES[ctx.reference.charCodeAt(ctx.reference.length - 1) % ROUTES.length];
            return `${route[0]} -> ${route[1]}`;
        },
        issues: [
            { id: "delay", label: "Meals + care due", summary: "The airline has a duty of care during a qualifying delay.", reason: (c) => `For a ${c.value}-hour operational delay, ${c.operator} must provide reasonable meals and refreshments at appropriate intervals. Operational issues are generally within the airline's control and do not automatically remove passenger protections.`, entitlement: () => "Ask for complimentary meals and refreshments now. If the delay crosses the applicable threshold, request the option of a refund or alternate flight, and keep every receipt.", source: "DGCA CAR Section 3, Series M, Part IV" },
            { id: "cancel", label: "Rebooking or refund", summary: "You may have a choice between continuing your trip and getting your money back.", reason: (c) => `${c.operator} should explain the cancellation reason and offer the applicable rebooking or refund route. If you were not informed in time, ask whether additional compensation rules apply to your booking.`, entitlement: () => "Request an alternate flight or a full refund in writing. Save the cancellation message, booking confirmation and any expense receipts." },
            { id: "denied", label: "Assistance may be due", summary: "A confirmed passenger should not be left without a clear remedy.", reason: () => "When a passenger with a confirmed booking is denied boarding, the airline should state the reason and offer the applicable alternate travel and compensation process.", entitlement: () => "Ask for the next available flight, written confirmation of the reason, and details of any compensation. Record the representative's name and the exact time." },
            { id: "baggage", label: "Report + receipts", summary: "Your first move is a documented baggage report.", reason: () => "Baggage issues need to be recorded before leaving the airport so the airline can trace the bag or assess damage. Your baggage tag and Property Irregularity Report are key evidence.", entitlement: () => "File a Property Irregularity Report immediately. Keep the report number, baggage tag and receipts for essential purchases while the issue is resolved." }
        ]
    },
    {
        id: "train",
        label: "Train",
        operatorLabel: "Railway",
        operatorPlaceholder: "e.g. Indian Railways (optional)",
        referenceLabel: "Train number",
        referencePlaceholder: "e.g. 12951",
        referencePattern: /^\d{1,5}$/,
        referenceError: "Enter a valid train number, like 12951.",
        source: "Indian Railways",
        slider: { label: "How late was the train?", min: 0, max: 12, step: 1, unit: "hours", default: 3 },
        defaultOperator: () => "Indian Railways",
        context: (ctx) => `Train ${ctx.reference}`,
        issues: [
            { id: "delay", label: "Late-running train", summary: "A long delay may still entitle you to options or a refund.", reason: (c) => `Train ${c.reference} is running about ${c.value} hour(s) late. Indian Railways publishes live running status, and for long delays you can ask the station manager about alternate trains, refunds or assistance. Keep your ticket and PNR.`, entitlement: () => "Check the live running status, ask at the station about the next available train, and keep your ticket and PNR. If you choose not to travel, claim a refund under the applicable railway refund rules." },
            { id: "cancel", label: "Train cancelled", summary: "An alternate train or a full refund should be offered.", reason: (c) => `If train ${c.reference} is cancelled, Indian Railways should arrange an alternate train or a full refund. Ask for written confirmation of the cancellation.`, entitlement: () => "Request an alternate train or a full refund. Keep the cancellation SMS or notice and your ticket. File a TDR if the ticket is not refunded automatically." },
            { id: "waitlist", label: "Waitlist or RAC", summary: "A waitlisted ticket is not a confirmed berth.", reason: (c) => `A waitlisted ticket for train ${c.reference} is not a confirmed berth. If it stays waitlisted, the amount is normally refunded automatically; RAC passengers may get a shared berth.`, entitlement: () => "Track your PNR status. If you stay waitlisted and do not travel, claim the automatic refund or file a TDR. Do not board without a confirmed berth unless you accept the risk." },
            { id: "refund", label: "Refund or TDR", summary: "Refunds depend on when you cancel and the ticket type.", reason: (c) => `Refunds for train ${c.reference} follow Indian Railways rules and depend on when you cancel and the ticket type. File a TDR within the prescribed time if the refund is not automatic.`, entitlement: () => "Cancel or file a TDR online with your PNR and keep the acknowledgement. Refunds are credited to the original payment method after any cancellation charge." }
        ]
    },
    {
        id: "bus",
        label: "Bus",
        operatorLabel: "Operator",
        operatorPlaceholder: "e.g. your bus operator (optional)",
        referenceLabel: "Ticket / booking number",
        referencePlaceholder: "e.g. AB1234",
        referencePattern: /^[A-Z0-9-]{4,}$/,
        referenceError: "Enter a valid ticket or booking number.",
        source: "State transport & operator terms",
        slider: { label: "How long was the delay?", min: 0, max: 12, step: 1, unit: "hours", default: 3 },
        defaultOperator: () => "Your bus operator",
        context: (ctx) => `Bus ${ctx.reference}`,
        issues: [
            { id: "delay", label: "Delayed bus", summary: "Ask the operator for the reason and your options.", reason: (c) => `Your bus (${c.reference}) was delayed by about ${c.value} hour(s). Bus services are usually governed by the operator's terms and state transport rules.`, entitlement: () => "Ask the operator for the reason and the next available bus or a refund as per their policy. Keep your ticket and any messages." },
            { id: "cancel", label: "Bus cancelled", summary: "A refund or an alternate bus should be offered.", reason: (c) => `If your bus (${c.reference}) is cancelled, ${c.operator} should offer an alternate bus or a refund according to its cancellation policy.`, entitlement: () => "Request an alternate bus or a full refund in writing. Save the cancellation message and your ticket." },
            { id: "refund", label: "Refund request", summary: "Check the operator's refund window and method.", reason: (c) => `Refunds for ${c.reference} follow the operator's terms. Most operators refund to the original payment method after a cancellation charge, within a stated number of days.`, entitlement: () => "Raise the refund request in writing with your ticket number, keep the acknowledgement, and follow up if it is not credited within the stated time." },
            { id: "seat", label: "Seat or luggage", summary: "A booked seat and reasonable luggage should be provided.", reason: (c) => `If your seat or luggage allowance on ${c.reference} was not honoured, the operator should provide the seat you booked or a reasonable alternative and carry your luggage within its stated limits.`, entitlement: () => "Ask for the booked seat or a comparable seat, and for any extra luggage charge to be explained. Record the conductor's name and the time." }
        ]
    },
    {
        id: "cab",
        label: "Cab / Metro",
        operatorLabel: "Operator",
        operatorPlaceholder: "e.g. Ola, Uber, Metro (optional)",
        referenceLabel: "Ride / booking ID",
        referencePlaceholder: "e.g. R12345",
        referencePattern: /^[A-Z0-9-]{3,}$/,
        referenceError: "Enter a valid ride or booking ID.",
        source: "Aggregator terms & consumer law",
        slider: { label: "How long did you wait?", min: 0, max: 120, step: 5, unit: "min", default: 15 },
        defaultOperator: () => "Your cab operator",
        context: (ctx) => `Ride ${ctx.reference}`,
        issues: [
            { id: "fare", label: "Fare or overcharge", summary: "The final fare should match the estimate and breakdown.", reason: (c) => `You were charged more than the estimate for ride ${c.reference}. Aggregators publish fare estimates and breakdowns, and material differences can be disputed.`, entitlement: () => "Compare the final fare with the estimate, raise an in-app complaint with the fare breakdown, and request a refund for any overcharge. Keep the receipt." },
            { id: "cancel", label: "Unfair cancellation", summary: "Cancellation fees should be reasonable and justified.", reason: (c) => `If ride ${c.reference} was cancelled by the driver or the platform, a cancellation fee should only apply under the operator's stated policy.`, entitlement: () => "Ask for the cancellation reason and the fee breakdown, then request a refund of any unfair cancellation charge in writing." },
            { id: "safety", label: "Safety incident", summary: "Report safety issues to the operator and authorities.", reason: () => "Safety incidents should be reported to the operator immediately so they can act, and to the local authorities where needed. Your safety comes before the fare.", entitlement: () => "Use the in-app SOS or helpline, share the ride details and driver information, and file a written complaint with the operator. Keep screenshots of the trip." },
            { id: "lost", label: "Lost item", summary: "Report a lost item to support right away.", reason: (c) => `For a lost item in ride ${c.reference}, contact support as soon as possible so the driver can be reached while the trip is recent.`, entitlement: () => "Report the lost item in the app with the ride ID and a description, ask for the driver's contact through support, and follow up in writing." },
            { id: "refund", label: "Refund request", summary: "Ask for a refund with the trip evidence attached.", reason: (c) => `Refunds for ${c.reference} depend on the operator's policy and the trip record. Attaching the fare breakdown and trip details speeds up review.`, entitlement: () => "Submit a refund request in writing with the ride ID, fare breakdown and any supporting screenshots, and keep the complaint number." }
        ]
    },
    {
        id: "hotel",
        label: "Hotel",
        operatorLabel: "Hotel / platform",
        operatorPlaceholder: "e.g. the hotel or booking site (optional)",
        referenceLabel: "Booking ID",
        referencePlaceholder: "e.g. HTL2026",
        referencePattern: /^[A-Z0-9-]{3,}$/,
        referenceError: "Enter a valid booking ID.",
        source: "Hotel terms & consumer law",
        slider: { label: "How serious was the issue?", min: 1, max: 5, step: 1, unit: "", default: 3 },
        defaultOperator: () => "The hotel",
        context: (ctx) => `Booking ${ctx.reference}`,
        issues: [
            { id: "room", label: "Room not as booked", summary: "You should get the room type you paid for.", reason: (c) => `Your booking ${c.reference} was not honoured as described. The hotel should provide the room type booked or a reasonable equivalent at no extra cost.`, entitlement: () => "Ask for the booked room type or an equivalent upgrade at no extra cost, or a refund if you choose not to stay. Record the front-desk name and the time." },
            { id: "cancel", label: "Cancellation or refund", summary: "Cancellation terms should be honoured as published.", reason: (c) => `Cancellation for ${c.reference} follows the rate you booked. The hotel should apply the published policy and explain any charge.`, entitlement: () => "Request written confirmation of the cancellation and the refund amount and timeline, and keep the booking confirmation and policy screenshot." },
            { id: "clean", label: "Cleanliness or maintenance", summary: "Report problems immediately and ask for a change.", reason: () => "Cleanliness and maintenance problems should be reported immediately so the hotel can fix them or move you. Photos and timestamps make the complaint stronger.", entitlement: () => "Report the issue to the front desk at once, ask for a room change or rate adjustment, and keep dated photos and the name of the staff member." },
            { id: "overcharge", label: "Overcharging", summary: "Check the final bill against what you booked.", reason: () => "The final bill should match the booked rate plus clearly disclosed charges. Unexplained extras can be disputed before you pay.", entitlement: () => "Ask for an itemised bill, question any charge you did not agree to, and request a correction or refund. Pay only the undisputed amount if possible." },
            { id: "safety", label: "Safety or security", summary: "Report unsafe conditions to the hotel and authorities.", reason: () => "Safety and security failures should be reported to the hotel management and, where needed, to local authorities. Do not accept an unsafe room.", entitlement: () => "Ask to be moved to a safe room, record the incident in writing, and escalate to the platform you booked through if the hotel does not act." }
        ]
    }
];

const MODES = Object.fromEntries(MODE_LIST.map((mode) => [mode.id, mode]));

function getMode(id) {
    return MODES[id] || MODE_LIST[0];
}

const RIGHTS = [
    { id: "flight-delay-care", mode: "flight", icon: "◷", title: "Meals during a delay", summary: "Reasonable meals and refreshments at appropriate intervals.", detail: "When a delay is within the airline's control, passengers should be offered meals and refreshments during the wait. Ask the airport desk directly and keep receipts if you buy food yourself.", tag: "Flight · delay care", source: "DGCA CAR Section 3, Series M, Part IV" },
    { id: "flight-delay-refund", mode: "flight", icon: "↩", title: "Refund or alternate flight", summary: "Options may apply when a delay crosses the applicable threshold.", detail: "If the delay becomes substantial, ask the airline to clearly explain whether you can choose a refund or an alternate flight. Do not accept a vague answer; request it in writing.", tag: "Flight · delay care", source: "Passenger Charter" },
    { id: "flight-cancellation", mode: "flight", icon: "×", title: "Cancelled flight options", summary: "Rebooking or a refund when the airline cancels your service.", detail: "Airlines should offer an alternate flight or refund according to the applicable cancellation conditions. Save the cancellation notification and your original booking confirmation.", tag: "Flight · cancellation", source: "DGCA Passenger Charter" },
    { id: "flight-denied", mode: "flight", icon: "↗", title: "Denied boarding", summary: "Compensation and alternate travel can apply.", detail: "If you are denied boarding despite a confirmed booking, ask for the reason, the next available flight and the compensation process. Document the time and name of the airline representative.", tag: "Flight · airport", source: "Passenger Charter" },
    { id: "flight-baggage", mode: "flight", icon: "▣", title: "Baggage disruption", summary: "Report delayed, lost or damaged baggage immediately.", detail: "File a Property Irregularity Report before leaving the airport. Keep your baggage tag, boarding pass and receipts for essential purchases made while waiting.", tag: "Flight · baggage", source: "Airline conditions of carriage" },
    { id: "flight-force-majeure", mode: "flight", icon: "!", title: "Weather exceptions", summary: "Force majeure can change what an airline owes.", detail: "Severe weather and airport closures may be outside an airline's control. Even then, ask about rebooking, refunds and assistance, and request the reason for the disruption.", tag: "Flight · good to know", source: "Passenger Charter" },
    { id: "train-late", mode: "train", icon: "◷", title: "Late-running trains", summary: "Check live status and ask about options on long delays.", detail: "Track the train on the live running status. For long delays, ask the station manager about alternate trains, refunds or assistance, and keep your ticket and PNR.", tag: "Train · delay", source: "Indian Railways" },
    { id: "train-tdr", mode: "train", icon: "↩", title: "Refund and TDR", summary: "File a TDR when a refund is not automatic.", detail: "Cancelled or unused e-tickets are often auto-refunded. If not, file a TDR with your PNR within the prescribed time and keep the acknowledgement.", tag: "Train · refund", source: "IRCTC / Railways refund rules" },
    { id: "train-waitlist", mode: "train", icon: "◇", title: "Waitlist and RAC", summary: "A waitlisted ticket is not a confirmed berth.", detail: "If your ticket stays waitlisted and you do not travel, the amount is normally refunded automatically. RAC passengers may get a shared berth; confirm before boarding.", tag: "Train · waitlist", source: "Indian Railways" },
    { id: "train-cancelled", mode: "train", icon: "×", title: "Cancelled train", summary: "Ask for an alternate train or a full refund.", detail: "When a train is cancelled, request an alternate train or a full refund and keep the cancellation notice. Escalate at the station if you are not offered either.", tag: "Train · cancellation", source: "Indian Railways" },
    { id: "bus-delay", mode: "bus", icon: "◷", title: "Delayed bus", summary: "Ask for the reason and the next available bus.", detail: "Bus delays are governed by the operator's terms and state transport rules. Ask for the reason, the next bus or a refund, and keep your ticket.", tag: "Bus · delay", source: "State transport & operator terms" },
    { id: "bus-cancel", mode: "bus", icon: "×", title: "Cancelled bus", summary: "A refund or an alternate bus should be offered.", detail: "If the operator cancels your service, request an alternate bus or a refund under its cancellation policy, and keep the cancellation message.", tag: "Bus · cancellation", source: "Operator terms" },
    { id: "bus-refund", mode: "bus", icon: "↩", title: "Bus refunds", summary: "Raise the refund with your ticket number.", detail: "Most operators refund to the original payment method after a cancellation charge. Raise the request in writing and follow up if it is not credited in time.", tag: "Bus · refund", source: "Operator terms" },
    { id: "bus-seat", mode: "bus", icon: "▣", title: "Seat or luggage", summary: "The seat you booked should be provided.", detail: "If your seat or luggage allowance was not honoured, ask for the booked seat or a comparable one and for any extra luggage charge to be explained.", tag: "Bus · onboard", source: "Operator terms" },
    { id: "cab-fare", mode: "cab", icon: "↩", title: "Fare dispute", summary: "Compare the final fare with the estimate.", detail: "Aggregators publish fare estimates and breakdowns. If the final fare differs materially, raise an in-app complaint with the breakdown and ask for a correction.", tag: "Cab · fare", source: "Aggregator terms & consumer law" },
    { id: "cab-cancel", mode: "cab", icon: "×", title: "Unfair cancellation fee", summary: "Cancellation fees must be reasonable and justified.", detail: "If the driver or platform cancelled, ask for the cancellation reason and fee breakdown, then request a refund of any unfair charge in writing.", tag: "Cab · cancellation", source: "Aggregator terms" },
    { id: "cab-safety", mode: "cab", icon: "!", title: "Safety incident", summary: "Report safety issues to the operator and authorities.", detail: "Use the in-app SOS or helpline, share the ride and driver details, and file a written complaint. Keep screenshots of the trip for evidence.", tag: "Cab · safety", source: "Aggregator terms & consumer law" },
    { id: "cab-lost", mode: "cab", icon: "◇", title: "Lost item in a ride", summary: "Report it to support straight away.", detail: "Contact support as soon as possible with the ride ID and a description so the driver can be reached while the trip is recent. Follow up in writing.", tag: "Cab · lost item", source: "Aggregator terms" },
    { id: "hotel-room", mode: "hotel", icon: "◇", title: "Room not as booked", summary: "You should get the room type you paid for.", detail: "If the room is not as described, ask for the booked room type or an equivalent upgrade at no extra cost, or a refund if you choose not to stay.", tag: "Hotel · room", source: "Hotel terms & consumer law" },
    { id: "hotel-cancel", mode: "hotel", icon: "↩", title: "Cancellation and refund", summary: "The published cancellation policy should be honoured.", detail: "Request written confirmation of the cancellation and the refund amount and timeline. Keep the booking confirmation and the policy screenshot.", tag: "Hotel · cancellation", source: "Hotel terms" },
    { id: "hotel-clean", mode: "hotel", icon: "▣", title: "Cleanliness or maintenance", summary: "Report problems immediately and ask for a change.", detail: "Report cleanliness or maintenance issues to the front desk at once and ask for a room change or rate adjustment. Keep dated photos.", tag: "Hotel · room", source: "Hotel terms & consumer law" },
    { id: "hotel-overcharge", mode: "hotel", icon: "↗", title: "Overcharging", summary: "Check the final bill against what you booked.", detail: "Ask for an itemised bill, question any charge you did not agree to, and request a correction or refund. Pay only the undisputed amount if possible.", tag: "Hotel · billing", source: "Consumer law" },
    { id: "hotel-safety", mode: "hotel", icon: "!", title: "Safety or security", summary: "Report unsafe conditions to the hotel and authorities.", detail: "Ask to be moved to a safe room, record the incident in writing, and escalate to the platform you booked through if the hotel does not act.", tag: "Hotel · safety", source: "Consumer law" }
];