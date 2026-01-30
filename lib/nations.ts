// Nation configuration for grouping matches by country
// Teams are mapped to nations for Champions League/Copa Libertadores assignment

export interface Nation {
  id: string;
  name: string;
  flag: string;
  domesticLeagues: string[];  // Competition codes (e.g., 'PD', 'PL')
  internationalCompetitions: string[];  // CL, CLI, etc.
}

export const NATIONS: Nation[] = [
  {
    id: 'spain',
    name: 'Spain',
    flag: '🇪🇸',
    domesticLeagues: ['PD', 'CDR'],  // La Liga, Copa del Rey
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'england',
    name: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    domesticLeagues: ['PL', 'ELC', 'FAC'],  // Premier League, Championship, FA Cup
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'italy',
    name: 'Italy',
    flag: '🇮🇹',
    domesticLeagues: ['SA', 'CIT'],  // Serie A, Coppa Italia
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'germany',
    name: 'Germany',
    flag: '🇩🇪',
    domesticLeagues: ['BL1', 'DFB'],  // Bundesliga, DFB Pokal
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    domesticLeagues: ['FL1', 'CDF'],  // Ligue 1, Coupe de France
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'brazil',
    name: 'Brazil',
    flag: '🇧🇷',
    domesticLeagues: ['BSA'],  // Brasileirão
    internationalCompetitions: ['CLI'],  // Copa Libertadores
  },
  {
    id: 'argentina',
    name: 'Argentina',
    flag: '🇦🇷',
    domesticLeagues: [],  // Liga Profesional Argentina (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'colombia',
    name: 'Colombia',
    flag: '🇨🇴',
    domesticLeagues: [],  // Liga BetPlay (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'chile',
    name: 'Chile',
    flag: '🇨🇱',
    domesticLeagues: [],  // Primera División Chile (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'uruguay',
    name: 'Uruguay',
    flag: '🇺🇾',
    domesticLeagues: [],  // Primera División Uruguay (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'paraguay',
    name: 'Paraguay',
    flag: '🇵🇾',
    domesticLeagues: [],  // Primera División Paraguay (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'ecuador',
    name: 'Ecuador',
    flag: '🇪🇨',
    domesticLeagues: [],  // Liga Pro Ecuador (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'peru',
    name: 'Peru',
    flag: '🇵🇪',
    domesticLeagues: [],  // Liga 1 Peru (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'bolivia',
    name: 'Bolivia',
    flag: '🇧🇴',
    domesticLeagues: [],  // División Profesional Bolivia (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'venezuela',
    name: 'Venezuela',
    flag: '🇻🇪',
    domesticLeagues: [],  // Liga FUTVE (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'mexico',
    name: 'Mexico',
    flag: '🇲🇽',
    domesticLeagues: [],  // Liga MX (future)
    internationalCompetitions: ['CLI'],
  },
  {
    id: 'portugal',
    name: 'Portugal',
    flag: '🇵🇹',
    domesticLeagues: ['PPL'],  // Primeira Liga
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'netherlands',
    name: 'Netherlands',
    flag: '🇳🇱',
    domesticLeagues: ['DED'],  // Eredivisie
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'belgium',
    name: 'Belgium',
    flag: '🇧🇪',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'scotland',
    name: 'Scotland',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'turkey',
    name: 'Turkey',
    flag: '🇹🇷',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'ukraine',
    name: 'Ukraine',
    flag: '🇺🇦',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'austria',
    name: 'Austria',
    flag: '🇦🇹',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'switzerland',
    name: 'Switzerland',
    flag: '🇨🇭',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'greece',
    name: 'Greece',
    flag: '🇬🇷',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'czech',
    name: 'Czech Republic',
    flag: '🇨🇿',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'denmark',
    name: 'Denmark',
    flag: '🇩🇰',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'norway',
    name: 'Norway',
    flag: '🇳🇴',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'cyprus',
    name: 'Cyprus',
    flag: '🇨🇾',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'azerbaijan',
    name: 'Azerbaijan',
    flag: '🇦🇿',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
  {
    id: 'kazakhstan',
    name: 'Kazakhstan',
    flag: '🇰🇿',
    domesticLeagues: [],
    internationalCompetitions: ['CL', 'EL', 'ECL'],
  },
];

// Map competition codes to their nation
// Domestic leagues and cups map directly to one nation
export const LEAGUE_TO_NATION: Record<string, string> = {
  'PD': 'spain',      // La Liga
  'CDR': 'spain',     // Copa del Rey
  'PL': 'england',    // Premier League
  'ELC': 'england',   // Championship
  'FAC': 'england',   // FA Cup
  'SA': 'italy',      // Serie A
  'CIT': 'italy',     // Coppa Italia
  'BL1': 'germany',   // Bundesliga
  'DFB': 'germany',   // DFB Pokal
  'FL1': 'france',    // Ligue 1
  'CDF': 'france',    // Coupe de France
  'BSA': 'brazil',    // Brasileirão
  'PPL': 'portugal',  // Primeira Liga
  'DED': 'netherlands', // Eredivisie
};

// International competitions (CL, EL, ECL, CLI) need team-based lookup
export const INTERNATIONAL_COMPETITIONS = ['CL', 'EL', 'ECL', 'CLI'];

// Team ID to Nation mapping for Champions League teams
// API-Football team IDs
export const TEAM_TO_NATION: Record<number, string> = {
  // Spain - La Liga teams
  529: 'spain',   // Barcelona
  530: 'spain',   // Atletico Madrid
  531: 'spain',   // Athletic Club
  532: 'spain',   // Valencia
  533: 'spain',   // Villarreal
  536: 'spain',   // Sevilla
  537: 'spain',   // Leganes
  538: 'spain',   // Celta Vigo
  539: 'spain',   // Espanyol
  540: 'spain',   // Getafe
  541: 'spain',   // Real Madrid
  542: 'spain',   // Real Sociedad
  543: 'spain',   // Real Betis
  546: 'spain',   // Rayo Vallecano
  547: 'spain',   // Girona
  548: 'spain',   // Real Valladolid
  720: 'spain',   // Las Palmas
  723: 'spain',   // Almeria
  724: 'spain',   // Cadiz
  727: 'spain',   // Osasuna
  728: 'spain',   // Mallorca
  798: 'spain',   // Alaves

  // England - Premier League teams
  33: 'england',  // Manchester United
  34: 'england',  // Newcastle
  35: 'england',  // Bournemouth
  36: 'england',  // Fulham
  39: 'england',  // Wolves
  40: 'england',  // Liverpool
  41: 'england',  // Southampton
  42: 'england',  // Arsenal
  45: 'england',  // Everton
  46: 'england',  // Leicester
  47: 'england',  // Tottenham
  48: 'england',  // West Ham
  49: 'england',  // Chelsea
  50: 'england',  // Manchester City
  51: 'england',  // Brighton
  52: 'england',  // Crystal Palace
  55: 'england',  // Brentford
  57: 'england',  // Ipswich
  63: 'england',  // Leeds
  65: 'england',  // Nottingham Forest
  66: 'england',  // Aston Villa

  // Italy - Serie A teams
  487: 'italy',   // Lazio
  488: 'italy',   // Sassuolo
  489: 'italy',   // AC Milan
  492: 'italy',   // Napoli
  494: 'italy',   // Udinese
  495: 'italy',   // Genoa
  496: 'italy',   // Juventus
  497: 'italy',   // AS Roma
  498: 'italy',   // Sampdoria
  499: 'italy',   // Atalanta
  500: 'italy',   // Bologna
  502: 'italy',   // Fiorentina
  503: 'italy',   // Torino
  504: 'italy',   // Verona
  505: 'italy',   // Inter
  511: 'italy',   // Empoli
  512: 'italy',   // Frosinone
  514: 'italy',   // Salernitana
  515: 'italy',   // Cagliari
  517: 'italy',   // Venezia
  518: 'italy',   // Monza
  520: 'italy',   // Lecce
  521: 'italy',   // Parma
  867: 'italy',   // Como

  // Germany - Bundesliga teams
  157: 'germany', // Bayern München
  159: 'germany', // Hertha BSC
  160: 'germany', // SC Freiburg
  161: 'germany', // VfL Wolfsburg
  162: 'germany', // Werder Bremen
  163: 'germany', // Borussia Mönchengladbach
  164: 'germany', // FC Augsburg
  165: 'germany', // Borussia Dortmund
  167: 'germany', // 1. FC Köln
  168: 'germany', // Bayer Leverkusen
  169: 'germany', // Eintracht Frankfurt
  170: 'germany', // FC Augsburg
  172: 'germany', // VfB Stuttgart
  173: 'germany', // RB Leipzig
  174: 'germany', // 1. FC Union Berlin
  176: 'germany', // VfL Bochum
  178: 'germany', // 1. FSV Mainz 05
  180: 'germany', // TSG Hoffenheim
  181: 'germany', // SV Darmstadt
  182: 'germany', // 1. FC Heidenheim
  186: 'germany', // FC St. Pauli
  192: 'germany', // Holstein Kiel

  // France - Ligue 1 teams
  77: 'france',   // Angers
  79: 'france',   // Lille
  80: 'france',   // Lyon
  81: 'france',   // Marseille
  82: 'france',   // Montpellier
  83: 'france',   // Nantes
  84: 'france',   // Nice
  85: 'france',   // Paris Saint Germain
  91: 'france',   // Monaco
  93: 'france',   // Reims
  94: 'france',   // Rennes
  95: 'france',   // Strasbourg
  96: 'france',   // Toulouse
  97: 'france',   // Saint-Etienne
  99: 'france',   // Auxerre
  106: 'france',  // Stade Brestois 29
  108: 'france',  // Le Havre
  112: 'france',  // Metz
  114: 'france',  // Paris FC
  116: 'france',  // Lens

  // Portugal - Primeira Liga teams
  211: 'portugal', // Benfica
  212: 'portugal', // FC Porto
  215: 'portugal', // Vitoria Guimaraes
  217: 'portugal', // SC Braga
  222: 'portugal', // Rio Ave
  223: 'portugal', // Boavista
  225: 'portugal', // Nacional
  228: 'portugal', // Sporting CP
  229: 'portugal', // Moreirense
  230: 'portugal', // Arouca
  231: 'portugal', // Gil Vicente
  240: 'portugal', // Estoril
  242: 'portugal', // Famalicao
  712: 'portugal', // Santa Clara
  810: 'portugal', // Casa Pia
  4716: 'portugal', // AVS

  // Netherlands - Eredivisie teams
  194: 'netherlands', // Ajax
  195: 'netherlands', // AZ Alkmaar
  196: 'netherlands', // Feyenoord
  197: 'netherlands', // PSV Eindhoven
  198: 'netherlands', // Vitesse
  199: 'netherlands', // Willem II
  200: 'netherlands', // PEC Zwolle
  201: 'netherlands', // Twente
  202: 'netherlands', // FC Groningen
  203: 'netherlands', // Sparta Rotterdam
  204: 'netherlands', // RKC Waalwijk
  205: 'netherlands', // SC Heerenveen
  206: 'netherlands', // NEC Nijmegen
  207: 'netherlands', // FC Utrecht
  209: 'netherlands', // Feyenoord
  210: 'netherlands', // Go Ahead Eagles
  415: 'netherlands', // Fortuna Sittard
  417: 'netherlands', // Heracles
  1909: 'netherlands', // Almere City

  // Brazil - Brasileirão teams
  118: 'brazil',  // Bahia
  119: 'brazil',  // Internacional
  120: 'brazil',  // Botafogo
  121: 'brazil',  // Palmeiras
  124: 'brazil',  // Fluminense
  126: 'brazil',  // Sao Paulo
  127: 'brazil',  // Flamengo
  128: 'brazil',  // Santos
  130: 'brazil',  // Gremio
  131: 'brazil',  // Corinthians
  132: 'brazil',  // Chapecoense
  133: 'brazil',  // Vasco da Gama
  134: 'brazil',  // Atletico Paranaense
  136: 'brazil',  // Vitoria
  138: 'brazil',  // Criciuma
  140: 'brazil',  // Sport Recife
  147: 'brazil',  // Coritiba
  794: 'brazil',  // RB Bragantino
  1062: 'brazil', // Atletico Mineiro
  1193: 'brazil', // Fortaleza
  1198: 'brazil', // Remo
  1211: 'brazil', // Ceara
  1213: 'brazil', // Goias
  1214: 'brazil', // Mirassol
  1216: 'brazil', // Cruzeiro
  2139: 'brazil', // Juventude
  7848: 'brazil', // Cuiaba

  // Belgium - for CL teams
  554: 'belgium', // Anderlecht
  569: 'belgium', // Club Brugge
  631: 'belgium', // Gent
  739: 'belgium', // Royal Antwerp
  740: 'belgium', // Standard Liege
  1393: 'belgium', // Union St. Gilloise

  // Other CL nations
  327: 'norway',    // Bodo/Glimt
  400: 'denmark',   // FC Copenhagen
  553: 'greece',    // Olympiakos Piraeus
  556: 'azerbaijan', // Qarabag
  560: 'czech',     // Slavia Praha
  564: 'austria',   // Salzburg
  571: 'austria',   // Sturm Graz
  573: 'scotland',  // Celtic
  598: 'scotland',  // Rangers
  609: 'switzerland', // Young Boys
  611: 'switzerland', // Basel
  620: 'ukraine',   // Shakhtar Donetsk
  645: 'turkey',    // Galatasaray
  664: 'kazakhstan', // Kairat Almaty
  3403: 'cyprus',   // Pafos

  // Argentina - Copa Libertadores teams
  435: 'argentina', // River Plate
  436: 'argentina', // Racing Club
  437: 'argentina', // Independiente
  442: 'argentina', // Defensa y Justicia
  445: 'argentina', // Huracan
  446: 'argentina', // Lanus
  448: 'argentina', // Rosario Central
  449: 'argentina', // Talleres Cordoba
  450: 'argentina', // Tigre
  451: 'argentina', // Union Santa Fe
  452: 'argentina', // San Lorenzo
  453: 'argentina', // Argentinos Juniors
  455: 'argentina', // Banfield
  456: 'argentina', // Newells Old Boys
  457: 'argentina', // Estudiantes
  458: 'argentina', // Boca Juniors
  459: 'argentina', // Central Cordoba
  460: 'argentina', // Colon Santa Fe
  461: 'argentina', // Godoy Cruz
  462: 'argentina', // Gimnasia La Plata
  463: 'argentina', // Aldosivi
  464: 'argentina', // Arsenal de Sarandi
  465: 'argentina', // Atletico Tucuman
  466: 'argentina', // Belgrano Cordoba
  467: 'argentina', // Patronato
  468: 'argentina', // Platense
  477: 'argentina', // Velez Sarsfield
  478: 'argentina', // Sarmiento
  1064: 'argentina', // Instituto
  2434: 'argentina', // Barracas Central

  // Colombia - Copa Libertadores teams
  1127: 'colombia', // Atletico Nacional
  1130: 'colombia', // Junior Barranquilla
  1131: 'colombia', // Millonarios
  1133: 'colombia', // America de Cali
  1134: 'colombia', // Independiente Medellin
  1135: 'colombia', // Santa Fe
  1137: 'colombia', // Deportivo Cali
  1139: 'colombia', // Once Caldas
  1140: 'colombia', // Deportes Tolima
  1143: 'colombia', // La Equidad
  1146: 'colombia', // Deportivo Pasto

  // Chile - Copa Libertadores teams
  2379: 'chile',    // Colo-Colo
  2380: 'chile',    // Universidad Catolica
  2381: 'chile',    // Universidad de Chile
  2382: 'chile',    // Union Espanola
  2384: 'chile',    // Audax Italiano
  2385: 'chile',    // Palestino
  2386: 'chile',    // Cobresal

  // Uruguay - Copa Libertadores teams
  830: 'uruguay',   // Penarol
  832: 'uruguay',   // Nacional
  834: 'uruguay',   // Defensor Sporting
  835: 'uruguay',   // Danubio
  838: 'uruguay',   // River Plate (Uruguay)
  839: 'uruguay',   // Racing Montevideo
  842: 'uruguay',   // Wanderers

  // Paraguay - Copa Libertadores teams
  2341: 'paraguay', // Olimpia
  2342: 'paraguay', // Cerro Porteno
  2343: 'paraguay', // Libertad
  2344: 'paraguay', // Guarani
  2345: 'paraguay', // Nacional Asuncion
  2346: 'paraguay', // Sol de America

  // Ecuador - Copa Libertadores teams
  1150: 'ecuador',  // Barcelona SC
  1151: 'ecuador',  // LDU Quito
  1152: 'ecuador',  // Emelec
  1153: 'ecuador',  // Independiente del Valle
  1154: 'ecuador',  // El Nacional
  1155: 'ecuador',  // Deportivo Cuenca
  1156: 'ecuador',  // Delfin

  // Peru - Copa Libertadores teams
  2317: 'peru',     // Alianza Lima
  2318: 'peru',     // Universitario
  2319: 'peru',     // Sporting Cristal
  2320: 'peru',     // FBC Melgar
  2321: 'peru',     // Cienciano

  // Bolivia - Copa Libertadores teams
  2650: 'bolivia',  // Bolivar
  2651: 'bolivia',  // The Strongest
  2652: 'bolivia',  // Jorge Wilstermann
  2722: 'bolivia',  // Blooming
  2723: 'bolivia',  // Oriente Petrolero

  // Venezuela - Copa Libertadores teams
  2772: 'venezuela', // Caracas FC
  2773: 'venezuela', // Deportivo Tachira
  2774: 'venezuela', // Zamora FC
  2775: 'venezuela', // Carabobo FC

  // Mexico - Liga MX teams
  2279: 'mexico',   // Club America
  2280: 'mexico',   // Guadalajara (Chivas)
  2281: 'mexico',   // Cruz Azul
  2282: 'mexico',   // Pumas UNAM
  2283: 'mexico',   // Monterrey
  2284: 'mexico',   // Tigres UANL
  2286: 'mexico',   // Leon
  2288: 'mexico',   // Pachuca
  2290: 'mexico',   // Atlas
  2292: 'mexico',   // Toluca
  2293: 'mexico',   // Santos Laguna
  2294: 'mexico',   // Necaxa
  2295: 'mexico',   // Queretaro
};

// Helper: Get nation ID for a match based on league code and team IDs
export function getNationsForMatch(
  leagueCode: string,
  homeTeamId: number,
  awayTeamId: number
): string[] {
  // If it's a domestic league, return the single nation
  if (LEAGUE_TO_NATION[leagueCode]) {
    return [LEAGUE_TO_NATION[leagueCode]];
  }

  // For international competitions, look up both teams
  if (INTERNATIONAL_COMPETITIONS.includes(leagueCode)) {
    const nations = new Set<string>();

    const homeNation = TEAM_TO_NATION[homeTeamId];
    const awayNation = TEAM_TO_NATION[awayTeamId];

    if (homeNation) nations.add(homeNation);
    if (awayNation) nations.add(awayNation);

    // If we found nations, return them
    if (nations.size > 0) {
      return Array.from(nations);
    }
  }

  // Fallback: return empty array (match won't be grouped)
  return [];
}

// Helper: Get nation by ID
export function getNationById(nationId: string): Nation | undefined {
  return NATIONS.find(n => n.id === nationId);
}

// Helper: Get all league codes we need to fetch
export function getAllLeagueCodes(): string[] {
  const codes = new Set<string>();

  for (const nation of NATIONS) {
    for (const league of nation.domesticLeagues) {
      codes.add(league);
    }
    for (const comp of nation.internationalCompetitions) {
      codes.add(comp);
    }
  }

  return Array.from(codes);
}

// Get internal league ID from competition code
export function getLeagueIdFromCode(code: string): string {
  const mapping: Record<string, string> = {
    'PD': 'laliga',
    'PL': 'premier',
    'ELC': 'championship',
    'SA': 'seriea',
    'BL1': 'bundesliga',
    'FL1': 'ligue1',
    'BSA': 'brasileirao',
    'PPL': 'primeiraliga',
    'DED': 'eredivisie',
    'CL': 'championsleague',
    'EL': 'europaleague',
    'ECL': 'conferenceleague',
    'CLI': 'copalibertadores',
    'CDR': 'copadelrey',
    'FAC': 'facup',
    'CIT': 'coppadeitalia',
    'DFB': 'dfbpokal',
    'CDF': 'coupdefrance',
  };
  return mapping[code] || code.toLowerCase();
}
