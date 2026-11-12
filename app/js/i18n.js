// All visible text. Dutch is the default. Dutch written by Claude: ask the Dutch teammate to proofread (whole nl block).
const TEXT = {
  nl: {
    product: "NetWijzer", tagline: "Net een stukje wijzer.", demo: "Demo met echte netdata", legend: "Legenda", at_risk: "Gepland, vertraagd of onzeker", // NL?
    show_all: "Toon alle {n} gebieden", show_less: "Alleen gebieden die aandacht vragen", // NL?
    role_customer: "Klant", role_planner: "Planner",
    nav_start: "Start", nav_projects: "Mijn projecten", nav_new: "Nieuwe aanvraag", nav_overview: "Overzicht", nav_sim: "Simulator", nav_about: "Over",
    // start
    hero_title: "Eén register voor alle energieplannen in Drenthe",
    hero_lead: "Klanten zien wanneer en waarom hun project kan aansluiten. Planners zien waar het net vastloopt en welk besluit helpt.",
    dot_caption_afname: "Ruimte voor afname vandaag", dot_caption_teruglevering: "Ruimte voor teruglevering vandaag",
    dot_source: "Elke stip is ongeveer 2 km. Grotere stip: langere wachtrij in dat voedingsgebied. Bron: capaciteitskaart, Netbeheer Nederland.",
    st_areas_queue: "van de {n} voedingsgebieden in Drenthe hebben een wachtrij", st_queue_mw: "MW wacht op aansluiting", st_solved: "TenneT verwacht ruimte voor teruglevering in Drenthe",
    rc_title: "Ik heb een project", rc_1: "Zie of en wanneer uw project kan aansluiten, met de reden", rc_2: "Volg uw aanvraag stap voor stap", rc_3: "Ontdek wat uw aansluiting kan versnellen", rc_go: "Naar mijn projecten",
    rp_title: "Ik plan het net", rp_sub: "Netbeheerder, provincie of gemeente",
    rp_1: "Zie per gebied en jaar waar het net vastloopt", rp_2: "Weet welk besluit vóór welk pMIEK nodig is", rp_3: "Test een besluit en zie welke aanvragen sneller of later gaan", rp_go: "Naar het overzicht",
    how_title: "Zo werkt het",
    how1_t: "Klant registreert", how1_p: "Eén formulier, hetzelfde formaat voor iedereen.",
    how2_t: "Gedeeld register", how2_p: "Alle plannen per voedingsgebied en jaar, met hun zekerheid.",
    how3_t: "Planner besluit", how3_p: "Test netuitbreiding, batterij of flexibel contract.",
    how4_t: "Klant ziet waarom", how4_p: "Elke wijziging komt met de reden in de tijdlijn.",
    // shared status words
    afname: "Afname", teruglevering: "Teruglevering",
    room: "Ruimte", limited: "Beperkt", bottleneck: "Knelpunt",
    cap0: "Capaciteit beschikbaar", cap1: "Beperkt, zonder wachtrij", cap2: "In onderzoek, met wachtrij", cap3: "Tekort, met wachtrij",
    proceeds: "Op schema", delayed: "Vertraagd", not_possible: "Niet vóór 2035",
    operational: "In bedrijf", under_construction: "In aanbouw", planned: "Gepland", underground: "Ondergrondse kabel, in bedrijf", planned_cable: "Gepland, ondergrondse kabel", overhead: "Hoogspanningslijn, in bedrijf",
    affects: "Bepaalt uw aansluiting", tbc: "Te bevestigen door de netbeheerder",
    grid_note: "Alleen het hoogspanningsnet van TenneT. Het regionale net naar woningen en bedrijven is niet weergegeven.",
    pr1: "Congestieverlichter", pr2: "Veiligheid", pr3: "Maatschappelijk", pr4: "Overig",
    // types
    t_solar: "Zonnepark", t_battery: "Batterij", t_defence: "Defensie", t_hospital: "Zorg", t_school: "School", t_housing: "Woningbouw",
    t_business_park: "Bedrijventerrein", t_industry: "Industrie", t_charging: "Laadplein", t_hydrogen: "Elektrolyser", t_heat: "Warmtepompen",
    m_idea: "Idee", m_planned: "Gepland", m_permit: "Vergunning", m_contracted: "Gecontracteerd",
    // customer
    projects_title: "Mijn projecten", projects_lead: "Alle aanvragen van uw organisatie op één plek. Klik op een project voor de tijdlijn en de volgende stap.",
    projects_empty: "U heeft nog geen projecten. Dien een aanvraag in om te zien wanneer u kunt aansluiten.",
    expected: "Verwachte aansluiting", waiting_for: "Wacht op", next_step: "Volgende stap", area: "Netgebied",
    back_projects: "Mijn projecten", location_status: "Uw locatie op de capaciteitskaart", queue: "Wachtrij", requests: "aanvragen",
    tennet_solved: "TenneT verwacht ruimte in", history: "Wat er gebeurde en waarom", sooner: "Sneller aansluiten",
    sooner_lead: "Berekend met dezelfde wachtrij en netuitbreidingen als uw inschatting.", no_gain: "geen winst",
    request_option: "Bespreken met netbeheerder", option_requested: "Gesprek aangevraagd over",
    o_timeblock: "Blokstroom", o_timeblock_p: "U neemt geen stroom af tussen 16 en 21 uur.",
    o_cablepool: "Cable pooling", o_cablepool_p: "Deel de aansluiting met een batterij of windpark.",
    o_battery: "Eigen batterij", o_battery_p: "Halveer uw piek met een batterij achter de meter.",
    o_nonfirm: "Flexibel transportrecht", o_nonfirm_p: "Direct aansluiten; de netbeheerder mag u bij drukte afschakelen.",
    next_idea: "Dien een formele aansluitaanvraag in bij de netbeheerder.", next_planned: "Lever uw netimpactgegevens aan vóór 1 februari 2027, zodat ze in het pMIEK meetellen.",
    next_permit: "Onderteken de transportovereenkomst zodra die klaarstaat.", next_contracted: "Er is niets te doen. U krijgt bericht als de inschatting verandert.",
    ev_submitted: "Aanvraag ingediend", ev_queued: "In de wachtrij geplaatst", ev_estimate: "Eerste inschatting", ev_changed: "Inschatting gewijzigd",
    ev_connected: "Verwachte aansluiting",
    because_upg: "omdat {u} nu in {y} klaar is", because_bat: "omdat een batterij in uw gebied ruimte maakt", because_cancel: "omdat een andere aanvraag is ingetrokken", because_prio: "door aanvragen met voorrang",
    // new request
    new_title: "Nieuwe aansluitaanvraag", new_lead: "Vul in wat u al weet. U ziet direct een eerste inschatting.",
    s1: "Uw project", s2: "Locatie", s3: "Controleren en indienen",
    f_name: "Projectnaam", f_name_ph: "Zonnepark De Velden", f_type: "Soort project", f_mw: "Vermogen in MW", f_mw_hint: "Het hoogste vermogen dat u van het net vraagt of terug levert.",
    f_year: "Nodig vanaf", f_phase: "Hoe ver bent u?", f_loc_hint: "Klik op de kaart waar het project komt.", f_loc_none: "Nog geen locatie gekozen", f_loc_set: "Locatie gekozen in",
    prio_note: "Voorrang volgens het ACM-kader", submit: "Aanvraag indienen", submitted: "Aanvraag ingediend",
    first_estimate: "Eerste inschatting",
    // planner
    ov_title: "Overzicht Drenthe", view_today: "Vandaag", view_today_hint: "capaciteitskaart", view_proj: "Projectie", view_proj_hint: "register",
    no_data: "Geen gegevens op de capaciteitskaart", // NL?
    // teammate feedback (Thu night): customer facts + next-step owner, unmet demand, decision per bottleneck
    f_location: "Locatie", grid_owner: "Netbeheerder", pref_start: "Gewenste start", from_year: "vanaf {y}", who: "Wie", who_you: "U", // NL?
    who_op: "{op} (netbeheerder)", who_op_you: "{op} (netbeheerder), daarna u", netbeheerder: "netbeheerder", // NL?
    next_review: "Een expert van de netbeheerder beoordeelt uw aanvraag en stuurt u een eerste inschatting.", // NL?
    c_load: "Belasting (aangesloten)", c_unmet_f: "Niet ingepast: formele aanvragen", c_unmet_e: "Niet ingepast: plannen in vroeg stadium", c_short: "Tekort", // NL?
    unmet_short: "niet ingepast in", k_unmet: "MW niet ingepast in {y}", k_unmet_split: "waarvan formele aanvragen / plannen", formal: "formele aanvraag", early: "plan in vroeg stadium", // NL?
    unmet_note: "Niet ingepast = vraag die voor dat jaar is aangevraagd maar nog niet past. Die telt mee in de status, zodat een jaar niet vrij lijkt omdat projecten naar later zijn geschoven.", // NL?
    dec_shortfall: "Grootste tekort ({y})", dec_split: "niet ingepast: {f} MW formele aanvragen, {e} MW plannen", dec_projects: "Projecten die hierop wachten", // NL?
    dec_next: "Volgende actie", next_moment: "Eerstvolgende besluitmoment", dec_owner: "Eigenaar", dec_due: "Besluit uiterlijk", dec_block: "Wat houdt het op", // NL?
    model_est: "Modelschatting", model_short: "model", model_est_note: "Datums zijn een modelschatting tot er een bevestigde besluitdatum is.", // NL?
    blk_location: "Locatie / grond nog niet rond", blk_permit: "Vergunning / ruimtelijke procedure", blk_contractors: "Tekort aan aannemers", blk_coord: "Afstemming Enexis en TenneT", blk_none_known: "Geen blokkade bekend in de bronnen", // NL?
    own_pmiek: "Provincie en netbeheerder (pMIEK)", act_propose: "Netuitbreiding voorstellen voor het pMIEK", act_study: "Locatie en ontwerp vastleggen, investering opnemen in het investeringsplan", // NL?
    act_build: "Bouw afronden en vertraging op tijd melden", act_plan: "Vergunning en planning bevestigen", act_measures: "Tot dan: maatregelen (batterij, flexibel contract, cable pooling)", no_upg: "Nog geen netuitbreiding gepland in dit gebied", // NL?
    // new request review + simulator decisions (Thu evening)
    review_title: "Wat gebeurt er na het indienen?", review_p: "Een expert van de netbeheerder beoordeelt uw aanvraag. Daarna krijgt u een eerste inschatting van de aansluitdatum.", // NL?
    review_today: "Vandaag op de capaciteitskaart", in_review: "In beoordeling", // NL?
    review_wait: "Een expert van de netbeheerder controleert uw aanvraag. Zodra de inschatting bevestigd is, ziet u hier de verwachte aansluitdatum en de reden.", // NL?
    ev_review: "De netbeheerder beoordeelt uw aanvraag. Hierna krijgt u een eerste inschatting.", ev_confirmed: "Eerste inschatting van de netbeheerder", // NL?
    rv_title: "Nieuwe aanvragen te beoordelen", rv_lead: "Controleer het voorstel van het model en stuur de inschatting naar de klant.", rv_model: "Voorstel", rv_send: "Bevestigen en versturen", rv_sent: "Inschatting verstuurd naar de klant", // NL?
    sim_upg_lead: "Kies een gebied om de netuitbreidingen daar te zien, of kies er hieronder een.", sim_upg_pick: "Netuitbreiding toevoegen…", sim_upg_ready: "Klaar in", sim_upg_off: "Niet uitvoeren", sim_upg_hide: "Uit de lijst halen", // NL?
    sim_projects: "Projecten", sim_projects_lead: "Klik een project om zijn gebied en netuitbreidingen te kiezen.", sim_scope_area: "Dit gebied", sim_scope_all: "Heel Drenthe", sim_projects_none: "Geen projecten in dit gebied.", // NL?
    req_cancel: "Aanvraag intrekken", req_cancel_q: "De netbeheerder verwerkt de intrekking. Daarna vervalt uw plek in de wachtrij.", req_cancel_yes: "Ja, intrekken aanvragen", req_cancel_no: "Aanvraag houden", // NL?
    cancel_pending: "Intrekking aangevraagd", cancelled: "Ingetrokken", ev_cancel_req: "U heeft gevraagd de aanvraag in te trekken.", ev_cancelled: "Aanvraag ingetrokken door de netbeheerder. Uw plek in de wachtrij is vrijgegeven.", // NL?
    cx_title: "Verzoeken om in te trekken", cx_lead: "De klant wil deze aanvraag intrekken. Bevestig om de plek in de wachtrij vrij te geven.", cx_send: "Intrekking bevestigen", cx_frees: "Geeft {mw} MW vrij in {area}", cx_done: "Aanvraag ingetrokken. {n} andere klanten zien de wijziging in hun tijdlijn.", cx_done1: "Aanvraag ingetrokken. 1 andere klant ziet de wijziging in de tijdlijn.", cx_done0: "Aanvraag ingetrokken.", next_withdrawn: "Niets meer te doen: de aanvraag is ingetrokken.", next_withdraw_req: "De netbeheerder verwerkt uw verzoek om de aanvraag in te trekken.", because_withdrawn: "ingetrokken", // NL?
    // NL?
    sim_new: "Nieuwe netuitbreiding", sim_new_kind: "Soort", sim_new_mw: "Extra capaciteit (MW)", sim_new_btn: "Toevoegen in {area}", sim_new_tag: "nieuw", // NL?
    k_transformer: "Trafo-uitbreiding", k_new_station: "Nieuw station", k_line: "Verzwaring verbinding", because_upg_off: "omdat {u} niet doorgaat", // NL?
    view_proj_legend: "verwachte status per gebied", // NL?
    layers: "Lagen", l_areas: "Gebieden", l_infra: "Netinfrastructuur", l_stations: "Onderstations", l_upgrades: "Netuitbreidingen", l_cables: "Hoogspanningsnet (TenneT)", l_projects: "Projecten",
    k_bottlenecks: "gebieden met knelpunt in", k_delayed: "netuitbreidingen te laat", k_queue: "MW in de wachtrij (echt)", k_first: "eerste besluit nodig",
    too_late: "Te laat", attention: "Gebieden die aandacht vragen", attention_lead: "Gesorteerd op het eerste jaar met een knelpunt.",
    first_bn: "Eerste knelpunt", none_bn: "Geen knelpunt tot 2035", open_area: "Open gebied",
    back_overview: "Overzicht", area_lead: "Projectie uit het gedeelde register. Gebieden zijn een benadering rond echte TenneT-stations.",
    peak: "Piek", capacity: "Capaciteit", decision: "Besluit nodig", needed_in: "Capaciteit nodig in", ip: "Investeringsplan jan", pmiek: "pMIEK feb", in_service: "In bedrijf",
    late_measures: "Te laat voor netuitbreiding. Alleen maatregelen helpen nog.", decide_by: "Leg dit vast in het pMIEK van februari",
    upgrades: "Netuitbreidingen", affected_projects: "Betrokken projecten", desired: "gewenst", feasible: "haalbaar", delay_y: "{n} jaar te laat", on_time_u: "op tijd",
    queue_title: "Wachtrij in dit gebied", queue_lead: "In volgorde van voorrang (ACM-kader), daarna op datum.",
    real_here: "Echte capaciteitskaart in dit gebied", test_sim: "Test een besluit",
    // simulator
    sim_title: "Wat gebeurt er als…", sim_lead: "Verander een besluit. De wachtrij wordt opnieuw verdeeld.",
    sim_upg: "Netuitbreidingen in dit besluit", sim_bat: "Batterij plaatsen", sim_bat_btn: "Plaats {mw} MW batterij", sim_bat_mw: "Vermogen batterij (MW)", sim_bat_placed: "Geplaatst in dit besluit", sim_bat_remove: "Verwijder", sim_choose: "Kies een gebied", // NL?
    sim_withdraw: "Aanvraag intrekken", effect: "Effect op aanvragen", now: "nu", after: "na besluit",
    no_change: "Nog geen verschil. Verander links een besluit.", confirm: "Besluit vastleggen en klanten informeren", reset: "Terugzetten",
    informed: "Besluit vastgelegd. {n} klanten zien de wijziging in hun tijdlijn.", informed1: "Besluit vastgelegd. 1 klant ziet de wijziging in de tijdlijn.", informed0: "Besluit vastgelegd.",
    // about
    about_title: "Over deze demo",
    about_p1: "Deze demo laat zien hoe één gedeeld register van energieplannen klanten en planners dezelfde informatie geeft. Klanten krijgen inzicht in ruil voor het vroeg registreren van hun plannen. Planners krijgen zo actuele gegevens per locatie.",
    about_h_data: "Wat is echt en wat is demo",
    about_h_method: "Hoe de inschatting werkt",
    about_method: "Per voedingsgebied en jaar telt de demo de piekvraag van alle geregistreerde aanvragen op en zet die tegen de capaciteit, inclusief netuitbreidingen zodra die in bedrijf zijn. Schaarse ruimte gaat eerst naar aanvragen met voorrang volgens het ACM-kader: congestieverlichters, dan veiligheid, dan maatschappelijke functies, dan de rest op datum. Een aanvraag sluit aan in het eerste jaar dat ze past.",
    about_h_limits: "Beperkingen", about_limits: "Belasting en capaciteit per gebied zijn niet openbaar en dus fictief. De gebieden voor de projectie zijn een benadering rond echte stations. Kabeltracés van geplande werken zijn schematisch. Alleen het hoogspanningsnet van TenneT is zichtbaar; het regionale net naar woningen en bedrijven niet. De tool rangschikt geen projecten met punten; hij volgt alleen de officiële volgorde.",
    reset_demo: "Demo terugzetten", reset_done: "Demo teruggezet",
    th_what: "Onderdeel", th_status: "Status", th_source: "Bron",
    src_rows: [
      ["Voedingsgebieden met status, wachtrij en aantal aanvragen", "real", "Capaciteitskaart, Netbeheer Nederland (12-11-2026)"],
      ["Jaar waarin TenneT ruimte verwacht", "real", "Capaciteitskaart, TenneT-laag"],
      ["Hoogspanningslijnen, kabels en stations", "real", "TenneT"],
      ["Jaartallen van netuitbreidingen (gewenst en haalbaar)", "real", "Enexis Investeringsplan 2026, TenneT IP2026"],
      ["Gemeentegrenzen", "real", "CBS / PDOK"],
      ["Belasting en capaciteit per gebied (MW)", "demo", "Fictief, station-gegevens zijn niet openbaar"],
      ["Aanvragen, klanten en tijdlijnen", "demo", "Fictief"],
    ],
    real: "Echt", demo_word: "Demo",
  },
  en: {
    product: "NetWijzer", tagline: "A little wiser about the grid.", demo: "Demo with real grid data", legend: "Legend", at_risk: "Planned, delayed or uncertain",
    show_all: "Show all {n} areas", show_less: "Only areas that need attention",
    role_customer: "Customer", role_planner: "Planner",
    nav_start: "Start", nav_projects: "My projects", nav_new: "New request", nav_overview: "Overview", nav_sim: "Simulator", nav_about: "About",
    hero_title: "One register for every energy plan in Drenthe",
    hero_lead: "Customers see when and why their project can connect. Planners see where the grid gets stuck and which decision helps.",
    dot_caption_afname: "Room for offtake today", dot_caption_teruglevering: "Room for feed-in today",
    dot_source: "Each dot is about 2 km. A bigger dot means a longer queue in that supply area. Source: capaciteitskaart, Netbeheer Nederland.",
    st_areas_queue: "of the {n} supply areas in Drenthe have a queue", st_queue_mw: "MW waiting for a connection", st_solved: "TenneT expects room for feed-in in Drenthe",
    rc_title: "I have a project", rc_1: "See if and when your project can connect, and why", rc_2: "Follow your request step by step", rc_3: "Find out what could speed up your connection", rc_go: "Go to my projects",
    rp_title: "I plan the grid", rp_sub: "Grid operator, province or municipality",
    rp_1: "See per area and year where the grid gets stuck", rp_2: "Know which decision is needed before which pMIEK", rp_3: "Test a decision and see which requests move", rp_go: "Go to the overview",
    how_title: "How it works",
    how1_t: "Customer registers", how1_p: "One form, the same format for everyone.",
    how2_t: "Shared register", how2_p: "All plans per supply area and year, with their certainty.",
    how3_t: "Planner decides", how3_p: "Test a grid upgrade, battery or flexible contract.",
    how4_t: "Customer sees why", how4_p: "Every change arrives with its reason in the timeline.",
    afname: "Offtake", teruglevering: "Feed-in",
    room: "Room", limited: "Limited", bottleneck: "Bottleneck",
    cap0: "Capacity available", cap1: "Limited, no queue", cap2: "Under investigation, with queue", cap3: "Shortage, with queue",
    proceeds: "On schedule", delayed: "Delayed", not_possible: "Not before 2035",
    operational: "Operational", under_construction: "Under construction", planned: "Planned", underground: "Underground cable, in service", planned_cable: "Planned, underground cable", overhead: "Overhead line, in service",
    affects: "Determines your connection", tbc: "To be confirmed by the grid operator",
    grid_note: "TenneT high-voltage grid only. The regional grid to homes and companies is not shown.",
    pr1: "Congestion reliever", pr2: "Safety", pr3: "Public function", pr4: "Other",
    t_solar: "Solar park", t_battery: "Battery", t_defence: "Defence", t_hospital: "Healthcare", t_school: "School", t_housing: "Housing",
    t_business_park: "Business park", t_industry: "Industry", t_charging: "Charging hub", t_hydrogen: "Electrolyser", t_heat: "Heat pumps",
    m_idea: "Idea", m_planned: "Planned", m_permit: "Permit", m_contracted: "Contracted",
    projects_title: "My projects", projects_lead: "All your organisation's requests in one place. Open a project for its timeline and next step.",
    projects_empty: "You have no projects yet. Submit a request to see when you can connect.",
    expected: "Expected connection", waiting_for: "Waiting for", next_step: "Next step", area: "Grid area",
    back_projects: "My projects", location_status: "Your location on the capacity map", queue: "Queue", requests: "requests",
    tennet_solved: "TenneT expects room in", history: "What happened and why", sooner: "Connect sooner",
    sooner_lead: "Calculated with the same queue and grid upgrades as your estimate.", no_gain: "no gain",
    request_option: "Discuss with grid operator", option_requested: "Meeting requested about",
    o_timeblock: "Time-block contract", o_timeblock_p: "You take no power between 16:00 and 21:00.",
    o_cablepool: "Cable pooling", o_cablepool_p: "Share the connection with a battery or wind farm.",
    o_battery: "Own battery", o_battery_p: "Halve your peak with a battery behind the meter.",
    o_nonfirm: "Flexible transport right", o_nonfirm_p: "Connect now; the operator may curtail you when the grid is busy.",
    next_idea: "Submit a formal connection request to the grid operator.", next_planned: "Provide your grid impact data before 1 February 2027 so it counts in the pMIEK.",
    next_permit: "Sign the transport agreement as soon as it is ready.", next_contracted: "Nothing to do. You'll be notified if the estimate changes.",
    ev_submitted: "Request submitted", ev_queued: "Placed in the queue", ev_estimate: "First estimate", ev_changed: "Estimate changed",
    ev_connected: "Expected connection",
    because_upg: "because {u} is now ready in {y}", because_bat: "because a battery in your area frees up room", because_cancel: "because another request was withdrawn", because_prio: "because of requests with priority",
    new_title: "New connection request", new_lead: "Fill in what you already know. You'll see a first estimate straight away.",
    s1: "Your project", s2: "Location", s3: "Check and submit",
    f_name: "Project name", f_name_ph: "Solar park De Velden", f_type: "Type of project", f_mw: "Power in MW", f_mw_hint: "The highest power you take from or feed into the grid.",
    f_year: "Needed from", f_phase: "How far along are you?", f_loc_hint: "Click on the map where the project will be.", f_loc_none: "No location chosen yet", f_loc_set: "Location chosen in",
    prio_note: "Priority under the ACM framework", submit: "Submit request", submitted: "Request submitted",
    first_estimate: "First estimate",
    ov_title: "Drenthe overview", view_today: "Today", view_today_hint: "capacity map", view_proj: "Projection", view_proj_hint: "register",
    no_data: "No data on the capacity map",
    f_location: "Location", grid_owner: "Grid operator", pref_start: "Preferred start", from_year: "from {y}", who: "Who", who_you: "You",
    who_op: "{op} (grid operator)", who_op_you: "{op} (grid operator), then you", netbeheerder: "grid operator",
    next_review: "An expert at the grid operator reviews your request and sends you a first estimate.",
    c_load: "Load (connected)", c_unmet_f: "Not fitted: formal requests", c_unmet_e: "Not fitted: early-stage plans", c_short: "Shortfall",
    unmet_short: "not fitted in", k_unmet: "MW not fitted in {y}", k_unmet_split: "of which formal requests / plans", formal: "formal request", early: "early-stage plan",
    unmet_note: "Not fitted = demand requested for that year that doesn't fit yet. It counts in the status, so a year never looks free because projects were pushed to later.",
    dec_shortfall: "Biggest shortfall ({y})", dec_split: "not fitted: {f} MW formal requests, {e} MW plans", dec_projects: "Projects waiting on this",
    dec_next: "Next action", next_moment: "Next decision moment", dec_owner: "Owner", dec_due: "Decision due", dec_block: "What is holding it up",
    model_est: "Model estimate", model_short: "model", model_est_note: "Dates are a model estimate until a decision date is confirmed.",
    blk_location: "Location / land not settled", blk_permit: "Permit / spatial procedure", blk_contractors: "Shortage of contractors", blk_coord: "Coordination Enexis and TenneT", blk_none_known: "No blocker known in the sources",
    own_pmiek: "Province and grid operator (pMIEK)", act_propose: "Propose a grid upgrade for the pMIEK", act_study: "Fix location and design, put the investment in the investment plan",
    act_build: "Finish construction and report delays early", act_plan: "Confirm permit and schedule", act_measures: "Until then: measures (battery, flexible contract, cable pooling)", no_upg: "No grid upgrade planned in this area yet",
    review_title: "What happens after you submit?", review_p: "An expert at the grid operator reviews your request. You then get a first estimate of the connection date.",
    review_today: "Today on the capacity map", in_review: "Under review",
    review_wait: "An expert at the grid operator is checking your request. Once the estimate is confirmed, you'll see the expected connection date and the reason here.",
    ev_review: "The grid operator is reviewing your request. You'll get a first estimate next.", ev_confirmed: "First estimate from the grid operator",
    rv_title: "New requests to review", rv_lead: "Check the model's proposal and send the estimate to the customer.", rv_model: "Proposal", rv_send: "Confirm and send", rv_sent: "Estimate sent to the customer",
    sim_upg_lead: "Choose an area to see its grid upgrades, or pick one below.", sim_upg_pick: "Add a grid upgrade…", sim_upg_ready: "Ready in", sim_upg_off: "Don't build", sim_upg_hide: "Remove from the list",
    sim_projects: "Projects", sim_projects_lead: "Click a project to choose its area and grid upgrades.", sim_scope_area: "This area", sim_scope_all: "All of Drenthe", sim_projects_none: "No projects in this area.",
    req_cancel: "Withdraw request", req_cancel_q: "The grid operator processes the withdrawal. After that your place in the queue is released.", req_cancel_yes: "Yes, ask to withdraw", req_cancel_no: "Keep request",
    cancel_pending: "Withdrawal requested", cancelled: "Withdrawn", ev_cancel_req: "You asked to withdraw the request.", ev_cancelled: "Request withdrawn by the grid operator. Your place in the queue has been released.",
    cx_title: "Withdrawal requests", cx_lead: "The customer wants to withdraw this request. Confirm to release its place in the queue.", cx_send: "Confirm withdrawal", cx_frees: "Frees {mw} MW in {area}", cx_done: "Request withdrawn. {n} other customers see the change in their timeline.", cx_done1: "Request withdrawn. 1 other customer sees the change in their timeline.", cx_done0: "Request withdrawn.", next_withdrawn: "Nothing left to do: the request has been withdrawn.", next_withdraw_req: "The grid operator is processing your request to withdraw.", because_withdrawn: "withdrawn",
   
    sim_new: "New grid upgrade", sim_new_kind: "Type", sim_new_mw: "Extra capacity (MW)", sim_new_btn: "Add in {area}", sim_new_tag: "new",
    k_transformer: "Transformer upgrade", k_new_station: "New station", k_line: "Line upgrade", because_upg_off: "because {u} will not go ahead",
    view_proj_legend: "expected status per area",
    layers: "Layers", l_areas: "Areas", l_infra: "Grid infrastructure", l_stations: "Substations", l_upgrades: "Grid upgrades", l_cables: "HV grid (TenneT)", l_projects: "Projects",
    k_bottlenecks: "areas with a bottleneck in", k_delayed: "grid upgrades late", k_queue: "MW in the queue (real)", k_first: "first decision needed",
    too_late: "Too late", attention: "Areas that need attention", attention_lead: "Sorted by the first year with a bottleneck.",
    first_bn: "First bottleneck", none_bn: "No bottleneck until 2035", open_area: "Open area",
    back_overview: "Overview", area_lead: "Projection from the shared register. Areas are an approximation around real TenneT stations.",
    peak: "Peak", capacity: "Capacity", decision: "Decision needed", needed_in: "Capacity needed in", ip: "Investment plan Jan", pmiek: "pMIEK Feb", in_service: "In service",
    late_measures: "Too late for grid expansion. Only measures can help now.", decide_by: "Record this in the pMIEK of February",
    upgrades: "Grid upgrades", affected_projects: "Affected projects", desired: "desired", feasible: "feasible", delay_y: "{n} years late", on_time_u: "on time",
    queue_title: "Queue in this area", queue_lead: "In order of priority (ACM framework), then by date.",
    real_here: "Real capacity map in this area", test_sim: "Test a decision",
    sim_title: "What happens if…", sim_lead: "Change a decision. The queue is shared out again.",
    sim_upg: "Grid upgrades in this decision", sim_bat: "Place a battery", sim_bat_btn: "Place a {mw} MW battery", sim_bat_mw: "Battery power (MW)", sim_bat_placed: "Placed in this decision", sim_bat_remove: "Remove", sim_choose: "Choose an area",
    sim_withdraw: "Withdraw request", effect: "Effect on requests", now: "now", after: "after decision",
    no_change: "No difference yet. Change a decision on the left.", confirm: "Record decision and notify customers", reset: "Reset",
    informed: "Decision recorded. {n} customers see the change in their timeline.", informed1: "Decision recorded. 1 customer sees the change in their timeline.", informed0: "Decision recorded.",
    about_title: "About this demo",
    about_p1: "This demo shows how one shared register of energy plans gives customers and planners the same information. Customers get transparency in return for registering their plans early. Planners get current data per location.",
    about_h_data: "What is real and what is demo",
    about_h_method: "How the estimate works",
    about_method: "Per supply area and year, the demo adds up the peak demand of all registered requests and compares it with capacity, including grid upgrades once they are in service. Scarce room goes first to requests with priority under the ACM framework: congestion relievers, then safety, then public functions, then the rest by date. A request connects in the first year it fits.",
    about_h_limits: "Limitations", about_limits: "Load and capacity per area are not public, so they are illustrative. The areas for the projection approximate the real stations. Routes of planned works are schematic. Only TenneT's high-voltage grid is shown; the regional grid to homes and companies is not. The tool does not score projects; it only follows the official order.",
    reset_demo: "Reset demo", reset_done: "Demo reset",
    th_what: "Part", th_status: "Status", th_source: "Source",
    src_rows: [
      ["Supply areas with status, queue and number of requests", "real", "Capaciteitskaart, Netbeheer Nederland (12-11-2026)"],
      ["Year TenneT expects room", "real", "Capaciteitskaart, TenneT layer"],
      ["High-voltage lines, cables and stations", "real", "TenneT"],
      ["Grid upgrade years (desired and feasible)", "real", "Enexis Investment Plan 2026, TenneT IP2026"],
      ["Municipal borders", "real", "CBS / PDOK"],
      ["Load and capacity per area (MW)", "demo", "Illustrative, station data is not public"],
      ["Requests, customers and timelines", "demo", "Illustrative"],
    ],
    real: "Real", demo_word: "Demo",
  },
};
function t(key, vars = {}) {
  const v = TEXT[STORE.state.lang]?.[key] ?? TEXT.nl[key] ?? key;
  return typeof v === "string" ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "") : v;
}
