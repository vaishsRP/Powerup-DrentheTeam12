// UI text, Dutch default. Owner: Video & Dutch (Teammate B). Dutch strings marked "// NL?" need proofreading.
// Usage: t("title"). Add every visible string here; never hardcode text in the views.

const I18N = {
  nl: {
    title: "Regionale maatregelkaart",           // from the track title
    demo_badge: "Demo · fictieve gegevens",
    year: "Jaar",
    offtake: "Afname",
    feed_in: "Teruglevering",
    room: "Ruimte", limited: "Beperkt", bottleneck: "Knelpunt",
    tab_location: "Locatiecheck",                 // NL?
    tab_plans: "Plannen", tab_load: "Belasting", tab_scenarios: "Scenario's",
    pick_area: "Klik op een gebied op de kaart.", // NL?
    peak: "Piek", grid_limit: "Netgrens",          // NL?
    connect_estimate: "Verwachte aansluiting",     // NL?
    because_of: "Wacht op",                        // NL?
    on_time: "Op tijd",                            // NL?
    no_upgrade: "Geen netuitbreiding gepland",     // NL?
    upgrades: "Netuitbreidingen",
    deadline: "Besluit nodig",                     // NL?
    too_late: "Te laat voor netuitbreiding: alleen maatregelen helpen", // NL?
    must_be_in_pmiek: "Moet in het pMIEK van februari", // NL?
    add_battery: "Test: batterij 10 MW",           // NL?
    reset: "Reset",
    source_years: "Jaartallen: Enexis Investeringsplan 2026", // NL?
  },
  en: {
    title: "Regional measures map",
    demo_badge: "Demo · illustrative data",
    year: "Year",
    offtake: "Offtake",
    feed_in: "Feed-in",
    room: "Room", limited: "Limited", bottleneck: "Bottleneck",
    tab_location: "Location check",
    tab_plans: "Plans", tab_load: "Load", tab_scenarios: "Scenarios",
    pick_area: "Click an area on the map.",
    peak: "Peak", grid_limit: "Grid limit",
    connect_estimate: "Expected connection",
    because_of: "Waiting for",
    on_time: "On time",
    no_upgrade: "No grid upgrade planned",
    upgrades: "Grid upgrades",
    deadline: "Decision needed",
    too_late: "Too late for grid expansion: only measures can help",
    must_be_in_pmiek: "Must be in the pMIEK of February",
    add_battery: "Test: 10 MW battery",
    reset: "Reset",
    source_years: "Years: Enexis Investment Plan 2026",
  },
};

function t(key) {
  return I18N[APP.state.lang]?.[key] ?? I18N.nl[key] ?? key;
}
