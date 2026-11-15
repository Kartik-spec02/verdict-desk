(function() {
  'use strict';

  const DEMO_JOURNEYS = [
    {
      id: "demo-flight-1",
      mode: "flight",
      reference: "6E-2341",
      operator: "IndiGo",
      issue: "delay",
      value: 5,
      label: "Meals + care due",
      summary: "5-hour operational delay on Delhi→Mumbai. Airline must provide meals, refreshments, and communication.",
      reason: "For a 5-hour operational delay, IndiGo must provide reasonable meals and refreshments at appropriate intervals. Operational issues are within the airline's control and do not remove passenger protections.",
      entitlement: "Ask for complimentary meals and refreshments now. If the delay crosses 6 hours, request the option of a refund or alternate flight. Keep every receipt.",
      source: "DGCA CAR Section 3, Series M, Part IV",
      context: "DEL → BOM",
      savedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      modeLabel: "Flight",
      issueLabel: "Meals + care due"
    },
    {
      id: "demo-train-1",
      mode: "train",
      reference: "12951",
      operator: "Indian Railways",
      issue: "delay",
      value: 4,
      label: "Refund eligible",
      summary: "4-hour delay on Rajdhani Express. Eligible for full refund under delay refund rules.",
      reason: "Premium trains like Rajdhani have specific delay refund thresholds. A 4-hour delay qualifies for full fare refund when the train arrives at destination more than 3 hours late.",
      entitlement: "File TDR (Ticket Deposit Receipt) within 4 hours of scheduled arrival. Refund processed to original payment mode. No cancellation fee applies.",
      source: "Indian Railways Refund Rules 2015",
      context: "NDLS → BCT",
      savedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      modeLabel: "Train",
      issueLabel: "Refund eligible"
    },
    {
      id: "demo-bus-1",
      mode: "bus",
      reference: "KSRTC-4455",
      operator: "KSRTC",
      issue: "cancel",
      value: 0,
      label: "Rebooking or refund",
      summary: "Last-minute cancellation by operator. Full refund plus alternate transport required.",
      reason: "State transport undertakings must provide either alternate bus within 2 hours or full refund with 10% compensation when they cancel a scheduled service.",
      entitlement: "Demand written confirmation of cancellation. Claim full fare refund + 10% of fare as compensation. If alternate bus provided, no compensation but must reach destination same day.",
      source: "Karnataka Motor Vehicles Rules / State Transport Act",
      context: "BLR → MYS",
      savedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      modeLabel: "Bus",
      issueLabel: "Rebooking or refund"
    },
    {
      id: "demo-cab-1",
      mode: "cab",
      reference: "UBER-8892",
      operator: "Uber",
      issue: "fare",
      value: 0,
      label: "Fare dispute",
      summary: "Driver took longer route, fare 40% higher than estimate. Platform dispute available.",
      reason: "Aggregators must ensure fare transparency. If route deviation is unjustified, passenger can dispute within 48 hours. Platform must respond within 7 days.",
      entitlement: "Open dispute in app with screenshots of route and estimate. Request fare adjustment to estimated amount. Escalate to consumer forum if unresolved.",
      source: "Consumer Protection Act 2019 / Aggregator Guidelines",
      context: "HSR Layout → Airport",
      savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      modeLabel: "Cab / Metro",
      issueLabel: "Fare dispute"
    },
    {
      id: "demo-hotel-1",
      mode: "hotel",
      reference: "BOOK-7721",
      operator: "Taj Hotels",
      issue: "room",
      value: 0,
      label: "Room category mismatch",
      summary: "Booked sea-view suite, given garden-view standard room. Full refund for difference + compensation.",
      reason: "Hotels must provide booked category or superior. Downgrade entitles guest to price difference refund + reasonable compensation. Document with photos at check-in.",
      entitlement: "Request immediate upgrade or written confirmation of unavailability. Claim price difference + 1 night complimentary. File complaint with hotel chain and consumer forum if denied.",
      source: "Hotel Booking Terms / Consumer Protection Act",
      context: "Taj Exotica, Goa",
      savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      modeLabel: "Hotel",
      issueLabel: "Room category mismatch"
    }
  ];

  var AIRLINES = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'Akasa Air', 'Air India Express'];
  var TRAINS = ['Rajdhani Express', 'Shatabdi Express', 'Duronto Express', 'Vande Bharat', 'Jan Shatabdi'];
  var BUS_OPS = ['KSRTC', 'MSRTC', 'APSRTC', 'TSRTC', 'RedBus', 'AbhiBus'];
  var CAB_OPS = ['Uber', 'Ola', 'Rapido', 'BluSmart', 'Namma Yatri'];
  var HOTELS = ['Taj Hotels', 'Oberoi', 'ITC Hotels', 'Marriott', 'Hilton', 'Radisson'];

  var FLIGHT_ROUTES = ['DEL → BOM', 'BOM → BLR', 'DEL → MAA', 'BLR → HYD', 'CCU → DEL', 'GOI → BOM'];
  var TRAIN_ROUTES = ['NDLS → BCT', 'MAS → SBC', 'HWH → NDLS', 'PUNE → NZM', 'CSTM → HWH'];
  var BUS_ROUTES = ['BLR → MYS', 'CHE → BLR', 'HYD → VIZ', 'PNQ → BOM', 'DEL → JPR'];
  var CAB_ROUTES = ['HSR Layout → Airport', 'Koramangala → Whitefield', 'Cyber City → Dwarka', 'Andheri → BKC', 'Salt Lake → Park Street'];
  var HOTEL_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Jaipur', 'Chennai'];

  var FLIGHT_NUMBERS = ['6E', 'AI', 'SG', 'UK', 'QP', 'IX', 'G8'];
  var TRAIN_NUMBERS = ['12951', '12009', '12213', '20833', '12055'];
  var BUS_REFS = ['KSRTC-', 'MSRTC-', 'APSRTC-', 'TSRTC-', 'RB-'];

  function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function getModeIcon(modeId) {
    var icons = {
      flight: '<svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/></svg>',
      train: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 11h14M9 20l-2 2M15 20l2 2M9 16h.01M15 16h.01"/></svg>',
      bus: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M8 20v-3M16 20v-3M8 8h.01M16 8h.01"/></svg>',
      cab: '<svg viewBox="0 0 24 24"><path d="M5 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2l-1.5-5.5A2 2 0 0 0 15.6 9H8.4a2 2 0 0 0-1.9 1.5L5 16Z"/><path d="M7.5 13h.01M16.5 13h.01"/></svg>',
      hotel: '<svg viewBox="0 0 24 24"><path d="M3 21V7l9-4 9 4v14M3 21h18M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01M8 13h.01M16 13h.01"/></svg>'
    };
    return icons[modeId] || '';
  }

  var demoMode = false;
  var onboardingStep = 1;

  function initDemoMode() {
    document.body.style.overflow = '';
    var toggle = document.getElementById('demo-toggle');
    if (!toggle) {
      console.error('[Demo] Toggle button not found');
      return;
    }

    var savedDemo = 'false';
    try { savedDemo = localStorage.getItem('verdct-demo-mode') || 'false'; } catch (e) {}
    if (savedDemo === 'true') {
      console.log('[Demo] Restoring demo mode');
      enableDemoMode(true);
    }

    toggle.addEventListener('click', function(e) {
      console.log('[Demo] Click event fired');
      var onboarding = document.getElementById('onboarding-overlay');
      if (onboarding) {
        onboarding.classList.add('hidden');
        document.body.style.overflow = '';
      }
      enableDemoMode(!demoMode);
    });

    initOnboarding();
    initSmartFeatures();
    initRandomDemoButton();
    console.log('[Demo] Initialized v5.0.0');
  }

  function enableDemoMode(enable) {
    console.log('[Demo] enableDemoMode:', enable);
    demoMode = enable;
    try { localStorage.setItem('verdct-demo-mode', enable); } catch (e) {}

    var toggle = document.getElementById('demo-toggle');
    var shell = document.getElementById('app-shell');
    var overviewBadge = document.getElementById('overview-demo-badge');

    var onboarding = document.getElementById('onboarding-overlay');
    if (onboarding) onboarding.classList.add('hidden');

    if (enable) {
      toggle.classList.add('active');
      toggle.setAttribute('aria-pressed', 'true');
      shell.classList.add('demo-mode');
      if (overviewBadge) overviewBadge.classList.remove('hidden');
      loadDemoData();
      showToast('Demo mode enabled — sample journeys loaded', 'success');
      if (typeof setView === 'function') setView('overview');
    } else {
      toggle.classList.remove('active');
      toggle.setAttribute('aria-pressed', 'false');
      shell.classList.remove('demo-mode');
      if (overviewBadge) overviewBadge.classList.add('hidden');
      clearDemoData();
      showToast('Demo mode disabled', 'info');
    }
  }

  async function loadDemoData() {
    console.log('[Demo] Loading demo data...');
    try {
      var cases = await loadCases();
      console.log('[Demo] Existing cases:', cases.length);
      var demoIds = new Set(DEMO_JOURNEYS.map(function(j) { return j.id; }));
      var toKeep = cases.filter(function(c) { return !demoIds.has(c.id); });
      if (toKeep.length !== cases.length) {
        console.log('[Demo] Removing old demo cases');
        await removeCases();
        for (var i = 0; i < toKeep.length; i++) {
          await addCase(toKeep[i]);
        }
      }
      for (var j = 0; j < DEMO_JOURNEYS.length; j++) {
        await addCase(DEMO_JOURNEYS[j]);
      }
      console.log('[Demo] Calling render functions...');
      try { await renderRecent(); console.log('[Demo] renderRecent done'); } catch (e) { console.error('[Demo] renderRecent failed:', e); }
      try { await updateClaimScore(); console.log('[Demo] updateClaimScore done'); } catch (e) { console.error('[Demo] updateClaimScore failed:', e); }
      try { await renderCases(); console.log('[Demo] renderCases done'); } catch (e) { console.error('[Demo] renderCases failed:', e); }
      console.log('[Demo] Demo data loaded successfully');
      var finalCases = await loadCases();
      console.log('[Demo] Final cases:', finalCases.length, 'Demo cases:', finalCases.filter(function(c) { return demoIds.has(c.id); }).length);
    } catch (e) {
      console.error('[Demo] Load failed:', e);
    }
  }

  async function clearDemoData() {
    try {
      var cases = await loadCases();
      var demoIds = new Set(DEMO_JOURNEYS.map(function(j) { return j.id; }));
      var toKeep = cases.filter(function(c) { return !demoIds.has(c.id); });
      if (toKeep.length !== cases.length) {
        await removeCases();
        for (var i = 0; i < toKeep.length; i++) {
          await addCase(toKeep[i]);
        }
        try { await renderRecent(); } catch (e) {}
        try { await updateClaimScore(); } catch (e) {}
        try { await renderCases(); } catch (e) {}
      }
    } catch (e) {
      console.error('[Demo] Clear failed:', e);
    }
  }

  function generateRandomJourney() {
    var modes = ['flight', 'train', 'bus', 'cab', 'hotel'];
    var mode = randomPick(modes);
    var modeInfo = getMode(mode);

    var reference, operator, context, issue, value, label, summary, reason, entitlement, source, modeLabel, issueLabel;

    switch (mode) {
      case 'flight': {
        var prefix = randomPick(FLIGHT_NUMBERS);
        reference = prefix + '-' + randomInt(100, 9999);
        operator = randomPick(AIRLINES);
        context = randomPick(FLIGHT_ROUTES);
        var issues = modeInfo.issues;
        var issueObj = randomPick(issues);
        issue = issueObj.id;
        value = issueObj.slider?.default || randomInt(2, 8);
        label = issueObj.label;
        issueLabel = label;
        modeLabel = modeInfo.label;

        if (issue === 'delay') {
          summary = value + '-hour delay on ' + operator + ' ' + reference + ' (' + context + '). Meals and care due under DGCA.';
          reason = 'For a ' + value + '-hour delay, ' + operator + ' must provide meals, refreshments, and communication. If delay exceeds 5 hours, option of refund or rebooking applies.';
          entitlement = 'Request meals/refreshments now. If delay >5h, ask for refund or alternate flight. Keep all receipts.';
          source = 'DGCA CAR Section 3, Series M, Part IV';
        } else if (issue === 'cancel') {
          summary = operator + ' ' + reference + ' cancelled. Full refund or alternate flight required.';
          reason = 'Airline must offer full refund or rebooking on next available flight at no extra cost. Compensation may apply if informed <14 days before departure.';
          entitlement = 'Demand full refund to original payment or rebooking. Ask for compensation if eligible under DGCA.';
          source = 'DGCA CAR Section 3, Series M, Part IV';
        } else {
          summary = 'Baggage issue on ' + operator + ' ' + reference + '. File PIR at airport.';
          reason = 'File Property Irregularity Report before leaving airport. Compensation up to ~₹20,000 for essentials.';
          entitlement = 'File PIR immediately. Claim essential expenses. Follow up in writing within 21 days.';
          source = 'DGCA CAR / Montreal Convention';
        }
        break;
      }
      case 'train': {
        reference = randomPick(TRAIN_NUMBERS);
        operator = randomPick(TRAINS);
        context = randomPick(TRAIN_ROUTES);
        var issues = modeInfo.issues;
        var issueObj = randomPick(issues);
        issue = issueObj.id;
        value = issueObj.slider?.default || randomInt(2, 6);
        label = issueObj.label;
        issueLabel = label;
        modeLabel = modeInfo.label;

        if (issue === 'delay') {
          summary = value + '-hour delay on ' + operator + ' ' + reference + ' (' + context + '). Refund eligible under IRCTC rules.';
          reason = 'Premium trains have specific delay refund thresholds. ' + value + ' hour delay qualifies for full fare refund when arrival is >3 hours late.';
          entitlement = 'File TDR within 4 hours of scheduled arrival. Refund to original payment. No cancellation fee.';
          source = 'Indian Railways Refund Rules 2015';
        } else {
          summary = 'Waitlisted ticket on ' + operator + ' ' + reference + '. RAC/confirmation rules apply.';
          reason = 'RAC passengers get shared berth. Waitlisted tickets auto-cancel with full refund if not confirmed by chart prep.';
          entitlement = 'Check chart status. If waitlisted, refund auto-processed. If RAC, travel with shared berth.';
          source = 'IRCTC Ticketing Rules';
        }
        break;
      }
      case 'bus': {
        reference = randomPick(BUS_REFS) + randomInt(1000, 9999);
        operator = randomPick(BUS_OPS);
        context = randomPick(BUS_ROUTES);
        var issues = modeInfo.issues;
        var issueObj = randomPick(issues);
        issue = issueObj.id;
        value = issueObj.slider?.default || randomInt(0, 3);
        label = issueObj.label;
        issueLabel = label;
        modeLabel = modeInfo.label;

        if (issue === 'cancel') {
          summary = operator + ' cancelled ' + reference + ' (' + context + '). Full refund + 10% compensation.';
          reason = 'State transport must provide alternate bus within 2 hours or full refund with 10% compensation for operator-caused cancellations.';
          entitlement = 'Demand written cancellation confirmation. Claim full fare refund + 10% compensation.';
          source = 'State Motor Vehicles Rules / Transport Act';
        } else {
          summary = 'Delay on ' + operator + ' ' + reference + '. Refreshments/refund per state policy.';
          reason = 'State transport undertakings must provide refreshments for delays >2 hours. Refund policies vary by state.';
          entitlement = 'Ask for refreshments. File written refund request with ticket number if delay excessive.';
          source = 'State Transport Rules';
        }
        break;
      }
      case 'cab': {
        reference = randomPick(CAB_OPS).toUpperCase() + '-' + randomInt(1000, 9999);
        operator = randomPick(CAB_OPS);
        context = randomPick(CAB_ROUTES);
        var issues = modeInfo.issues;
        var issueObj = randomPick(issues);
        issue = issueObj.id;
        value = issueObj.slider?.default || 0;
        label = issueObj.label;
        issueLabel = label;
        modeLabel = modeInfo.label;

        if (issue === 'fare') {
          summary = 'Fare dispute on ' + operator + ' (' + context + '). Actual fare exceeded estimate significantly.';
          reason = 'Aggregators must ensure fare transparency. Unjustified route deviation allows dispute within 48 hours. Platform must respond in 7 days.';
          entitlement = 'Open in-app dispute with route screenshots. Request adjustment to estimated fare. Escalate if needed.';
          source = 'Consumer Protection Act 2019 / Aggregator Guidelines';
        } else {
          summary = 'Safety issue on ' + operator + ' ride. Driver behavior violated policy.';
          reason = 'Use in-app SOS for emergencies. Report in writing within 24 hours. Platform must investigate and respond.';
          entitlement = 'Use SOS button. File detailed report. Request ride refund and safety follow-up.';
          source = 'Consumer Protection Act 2019 / Platform Safety Guidelines';
        }
        break;
      }
      case 'hotel': {
        reference = 'BOOK-' + randomInt(1000, 9999);
        operator = randomPick(HOTELS);
        context = randomPick(HOTEL_CITIES);
        var issues = modeInfo.issues;
        var issueObj = randomPick(issues);
        issue = issueObj.id;
        value = issueObj.slider?.default || 0;
        label = issueObj.label;
        issueLabel = label;
        modeLabel = modeInfo.label;

        if (issue === 'room') {
          summary = 'Room issue at ' + operator + ' (' + context + '). Booked category not provided.';
          reason = 'Hotel must provide booked category or equivalent upgrade at no extra cost. Refund difference if downgraded.';
          entitlement = 'Report at front desk immediately. Demand booked room or free upgrade. Get written confirmation.';
          source = 'Consumer Protection Act 2019 / Hotel Policy';
        } else {
          summary = 'Overbooking at ' + operator + ' (' + context + '). Guest relocated to alternative property.';
          reason = 'Hotel must provide comparable alternative at same or lower rate, cover transport, and compensate for inconvenience.';
          entitlement = 'Demand equivalent hotel at no extra cost. Require transport coverage. Ask for compensation/goodwill.';
          source = 'Consumer Protection Act 2019 / Booking Terms';
        }
        break;
      }
    }

    return {
      id: 'demo-' + mode + '-' + Date.now(),
      mode: mode,
      reference: reference,
      operator: operator,
      issue: issue,
      value: value,
      label: label,
      summary: summary,
      reason: reason,
      entitlement: entitlement,
      source: source,
      context: context,
      savedAt: new Date().toISOString(),
      modeLabel: modeLabel,
      issueLabel: issueLabel
    };
  }

  function loadRandomDemo() {
    var journey = generateRandomJourney();
    selectMode(journey.mode);
    document.getElementById('flight-input').value = journey.reference;
    document.getElementById('operator-input').value = journey.operator;
    document.getElementById('issue-input').value = journey.issue;
    document.getElementById('delay-input').value = journey.value;
    document.getElementById('delay-output').textContent = sliderText(getMode(journey.mode), journey.value);
    showToast('Random demo journey loaded — click Analyze', 'info');
  }

  function initRandomDemoButton() {
    var toggle = document.getElementById('demo-toggle');
    if (!toggle) return;

    toggle.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      if (demoMode) loadRandomDemo();
    });

    var lastClick = 0;
    toggle.addEventListener('click', function() {
      var now = Date.now();
      if (now - lastClick < 300 && demoMode) {
        loadRandomDemo();
      }
      lastClick = now;
    });
  }

  function initOnboarding() {
    var overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;

    var seen = false;
    try { seen = !!localStorage.getItem('verdct-onboarded'); } catch (e) {}
    if (!seen) {
      setTimeout(function() { showOnboarding(); }, 800);
    }

    document.getElementById('onboarding-close')?.addEventListener('click', hideOnboarding);
    document.getElementById('onboarding-skip')?.addEventListener('click', hideOnboarding);
    document.getElementById('onboarding-next-1')?.addEventListener('click', function() { goOnboardingStep(2); });
    document.getElementById('onboarding-next-2')?.addEventListener('click', function() { goOnboardingStep(3); });
    document.getElementById('onboarding-next-3')?.addEventListener('click', function() { goOnboardingStep(4); });
    document.getElementById('onboarding-finish')?.addEventListener('click', function() {
      hideOnboarding();
      setTimeout(function() { document.querySelector('[data-view="checker"]')?.click(); }, 150);
    });
    document.getElementById('onboarding-back-2')?.addEventListener('click', function() { goOnboardingStep(1); });
    document.getElementById('onboarding-back-3')?.addEventListener('click', function() { goOnboardingStep(2); });
    document.getElementById('onboarding-back-4')?.addEventListener('click', function() { goOnboardingStep(3); });

    var modesContainer = document.getElementById('onboarding-modes');
    if (modesContainer) {
      var MODE_LIST = getModeList();
      modesContainer.innerHTML = MODE_LIST.map(function(m) {
        return '<button class="onboarding-mode" data-mode="' + m.id + '"><span class="onboarding-mode-icon">' + getModeIcon(m.id) + '</span><span>' + m.label + '</span></button>';
      }).join('');
    }
  }

  function showOnboarding() {
    var overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      updateOnboardingProgress(1);
      setTimeout(function() {
        if (overlay && !overlay.classList.contains('hidden')) hideOnboarding();
      }, 60000);
    }
  }

  function hideOnboarding() {
    var overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
      try { localStorage.setItem('verdct-onboarded', 'true'); } catch (e) {}
    }
  }

  function goOnboardingStep(step) {
    document.querySelectorAll('.onboarding-step').forEach(function(s) { s.classList.remove('active'); });
    document.querySelector('.onboarding-step[data-step="' + step + '"]')?.classList.add('active');
    updateOnboardingProgress(step);
    onboardingStep = step;
  }

  function updateOnboardingProgress(step) {
    var bar = document.getElementById('onboarding-progress-bar');
    if (bar) bar.style.width = ((step / 4) * 100) + '%';
    var progress = document.querySelector('.onboarding-progress');
    if (progress) progress.setAttribute('aria-valuenow', step);
  }

  function initSmartFeatures() {
    initAirlineAutoDetect();
    initSmartIssueSuggestions();
    initKeyboardShortcuts();
    initLoadingStates();
    initConfetti();
  }

  function initAirlineAutoDetect() {
    var flightInput = document.getElementById('flight-input');
    var operatorInput = document.getElementById('operator-input');
    if (!flightInput || !operatorInput) return;

    var AIRLINE_CODES = {
      "6E": "IndiGo", "AI": "Air India", "UK": "Vistara", "SG": "SpiceJet",
      "IX": "Air India Express", "G8": "Go First", "QP": "Akasa Air",
      "S2": "JetLite", "9W": "Jet Airways"
    };

    flightInput.addEventListener('input', function() {
      var val = flightInput.value.trim().toUpperCase();
      for (var code in AIRLINE_CODES) {
        if (val.startsWith(code)) {
          operatorInput.value = AIRLINE_CODES[code];
          showToast('Airline detected: ' + AIRLINE_CODES[code], 'info');
          break;
        }
      }
    });
  }

  function initSmartIssueSuggestions() {
    var issueInput = document.getElementById('issue-input');
    var delayInput = document.getElementById('delay-input');
    var delayOutput = document.getElementById('delay-output');
    if (!issueInput || !delayInput || !delayOutput) return;

    var issueDelayMap = {
      'delay': { min: 2, max: 8, default: 5 },
      'cancel': { min: 0, max: 0, default: 0 },
      'baggage': { min: 0, max: 0, default: 0 },
      'denied': { min: 0, max: 0, default: 0 },
      'downgrade': { min: 0, max: 0, default: 0 }
    };

    issueInput.addEventListener('change', function() {
      var issue = issueInput.value;
      var config = issueDelayMap[issue];
      if (config) {
        delayInput.min = config.min;
        delayInput.max = config.max;
        delayInput.value = config.default;
        delayOutput.textContent = sliderText(getMode(currentModeId), config.default);
        showToast('Delay range updated for ' + issue, 'info');
      }
    });
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'n': e.preventDefault(); document.querySelector('[data-view="checker"]')?.click(); break;
          case 'r': e.preventDefault(); document.querySelector('[data-view="overview"]')?.click(); break;
          case 'c': e.preventDefault(); document.querySelector('[data-view="cases"]')?.click(); break;
          case 'o': e.preventDefault(); document.querySelector('[data-view="rights"]')?.click(); break;
          case '/': e.preventDefault(); document.getElementById('rights-search')?.focus(); break;
        }
      }
    });
  }

  function initLoadingStates() {
    var originalAnalyze = window.analyzeJourney;
    window.analyzeJourney = async function() {
      var btn = document.getElementById('analyze-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Analyzing...';
      }
      try { await originalAnalyze(); }
      finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = 'Analyze journey <span>→</span>';
        }
      }
    };
  }

  function initConfetti() {
    window.triggerConfetti = function() {
      var container = document.getElementById('confetti-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'confetti-container';
        document.body.appendChild(container);
      }
      var colors = ['#1d4ed8', '#12805c', '#d92d20', '#b54708', '#0e7490'];
      for (var i = 0; i < 50; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 0.5) + 's';
        piece.style.animationDuration = (1.5 + Math.random()) + 's';
        container.appendChild(piece);
        setTimeout(function(p) { p.remove(); }, 3000, piece);
      }
    };
  }

  function showToast(message, type) {
    var container = getOrCreateToastContainer();
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + getToastIcon(type) + '</span><span class="toast-message">' + message + '</span>';
    container.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('show'); });
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
  }

  function getOrCreateToastContainer() {
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function getToastIcon(type) {
    switch (type) {
      case 'success': return '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';
      case 'error': return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
      case 'warning': return '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      default: return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }
  }

  window.exportCaseAsPDF = function(caseData) {
    try {
      var jsPDF = window.jspdf;
      if (!jsPDF) throw new Error('jsPDF not loaded');
      var doc = new jsPDF();
      var accent = [29, 78, 216];
      var ink = [16, 24, 40];
      var muted = [102, 112, 133];
      var canvas = [245, 246, 247];

      doc.setFillColor.apply(doc, accent);
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
      var today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.text('Generated: ' + today, 160, 20);

      var y = 55;
      doc.setFillColor.apply(doc, canvas);
      doc.roundedRect(15, y, 180, 35, 4, 4, 'F');
      doc.setTextColor.apply(doc, ink);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(caseData.modeLabel + ' ' + caseData.reference, 20, y + 10);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor.apply(doc, muted);
      doc.text(caseData.operator + '  |  ' + (caseData.context || 'N/A'), 20, y + 18);
      doc.text('Issue: ' + caseData.issueLabel, 20, y + 25);
      var badgeColor = caseData.label === 'Eligible' ? [18, 128, 92] : caseData.label === 'Partial' ? [181, 71, 8] : [217, 45, 32];
      doc.setFillColor.apply(doc, badgeColor);
      doc.roundedRect(145, y + 5, 40, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(caseData.label.toUpperCase(), 149, y + 13.5);

      y += 45;
      var sections = [
        { title: 'WHY THIS APPLIES', body: caseData.reason },
        { title: 'WHAT YOU ARE OWED', body: caseData.entitlement },
        { title: 'SOURCE REGULATION', body: caseData.source }
      ];
      sections.forEach(function(section) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFillColor.apply(doc, accent);
        doc.rect(15, y, 180, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, 20, y + 7);
        y += 14;
        doc.setTextColor.apply(doc, ink);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        var lines = doc.splitTextToSize(section.body, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 8;
      });

      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFillColor.apply(doc, canvas);
      doc.roundedRect(15, y, 180, 85, 4, 4, 'F');
      y += 8;
      doc.setTextColor.apply(doc, accent);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('READY TO SEND — CLAIM LETTER TEMPLATE', 20, y);
      y += 10;
      doc.setTextColor.apply(doc, ink);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      var letter = generateClaimLetter(caseData);
      var letterLines = doc.splitTextToSize(letter, 170);
      doc.text(letterLines, 20, y);
      y += letterLines.length * 4.5 + 10;
      doc.setTextColor.apply(doc, muted);
      doc.setFontSize(7);
      doc.text('This document is for informational purposes only and does not constitute legal advice.', 105, 285, { align: 'center' });
      doc.text('Verdict Desk | Travel rights, made clear', 105, 290, { align: 'center' });

      var filename = 'claim-' + caseData.reference + '-' + new Date().toISOString().slice(0,10) + '.pdf';
      doc.save(filename);
      showToast('Claim letter exported as PDF', 'success');
    } catch (e) {
      console.error('[Demo] PDF export failed:', e);
      var content = generateClaimLetter(caseData);
      var blob = new Blob([content], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'claim-' + caseData.reference + '-' + new Date().toISOString().slice(0,10) + '.txt';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Claim letter downloaded (text fallback)', 'info');
    }
  };

  window.shareCase = function(caseData) {
    var shareData = {
      title: 'Verdict: ' + caseData.modeLabel + ' ' + caseData.reference,
      text: caseData.summary + '\n\n' + caseData.entitlement,
      url: window.location.origin + window.location.pathname
    };
    if (navigator.share) {
      navigator.share(shareData).catch(function() {});
    } else {
      navigator.clipboard.writeText(shareData.text).then(function() { showToast('Case summary copied to clipboard', 'success'); });
    }
  };

  function generateClaimLetter(caseData) {
    return 'Subject: Request for assistance — ' + caseData.modeLabel + ' ' + caseData.reference + '\n\n' +
      'Dear ' + caseData.operator + ' Customer Support,\n\n' +
      'I am writing regarding ' + caseData.issueLabel.toLowerCase() + ' affecting ' + caseData.modeLabel.toLowerCase() + ' ' + caseData.reference + (caseData.context ? ' (' + caseData.context + ')' : '') + '.\n\n' +
      'Under ' + caseData.source + ', I request the assistance and entitlements applicable to this situation: ' + caseData.entitlement + '\n\n' +
      'Passenger name: [Your full name]\n' +
      'Booking reference: [Your booking reference]\n' +
      'Date of travel: [Date]\n\n' +
      'Please respond in writing within seven days. I have retained my booking confirmation and travel records for reference.\n\n' +
      'Sincerely,\n' +
      '[Your full name]\n' +
      '[Phone number]\n';
  }

  function getModeList() {
    return [
      { id: 'flight', label: 'Flight', issues: [{id:'delay',label:'Delay',slider:{default:5}},{id:'cancel',label:'Cancellation',slider:{default:0}},{id:'baggage',label:'Baggage',slider:{default:0}},{id:'denied',label:'Denied Boarding',slider:{default:0}}] },
      { id: 'train', label: 'Train', issues: [{id:'delay',label:'Delay',slider:{default:4}},{id:'waitlist',label:'Waitlist',slider:{default:0}}] },
      { id: 'bus', label: 'Bus', issues: [{id:'cancel',label:'Cancellation',slider:{default:0}},{id:'delay',label:'Delay',slider:{default:2}}] },
      { id: 'cab', label: 'Cab / Metro', issues: [{id:'fare',label:'Fare Dispute',slider:{default:0}},{id:'safety',label:'Safety',slider:{default:0}}] },
      { id: 'hotel', label: 'Hotel', issues: [{id:'room',label:'Room Issue',slider:{default:0}},{id:'overbooking',label:'Overbooking',slider:{default:0}}] }
    ];
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemoMode);
  } else {
    initDemoMode();
  }
})();