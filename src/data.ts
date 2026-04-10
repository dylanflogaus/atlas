export type PartyTag = 'REP' | 'IND' | 'DEM' | 'PERS' | 'SENT'

export interface Voter {
  id: string
  name: string
  address: string
  cityState: string
  party: PartyTag
  supportScore: number
  reliability: 'High' | 'Med' | 'Low'
  engageScore: number
  lastContact: string
  voteMethod: string
  photoUrl: string
  district: string
  subtitle: string
  mapImageUrl: string
  canvassingNote: string
  issues: { label: string; detail: string; icon: string; tone: 'red' | 'blue' | 'green' | 'amber' }[]
  history: { title: string; meta: string; icon: string; iconTone: 'primary' | 'secondary' }[]
}

/** Raster built from OpenStreetMap tiles (Delaware sector, z10); served from `/public`. */
export const MAP_STREET = '/dashboard-sector-map.png'

/** Static sector map image on the dashboard (replacing interactive tiles). */
export const MAP_TILE = MAP_STREET

/** Shared portrait placeholder for demo roster (replace with real headshots in production). */
export const DEMO_FACE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCWnvdWP-t5GhC651-0r1WirXeWKWZS9FoqstgOVD3dOBKZO3Jf60JmGPdB0ZiZJfKOS6bWamhc4YbWehnLxcgrCAL4HK40wMpr2NgE8dX1PpVnFu0EmWsvKIanplHOdRx_YgqAx6qE9SQj0b_ss11dbSim198ofGZgaD5CBXjFfDCPJFJtZVWq8paGVOujDCf7d-26NkB-ssOAhaELQwk8Uqlrltmcq0KM0cMBhw04n5E_fd-l_2a3QhntXhw4vbIm9xANMZZjS9I'

/** Tactical pins on the live dashboard map. */
export type TacticalPinTag = 'REP' | 'PERS' | 'SENT'

/** Single-family / townhome points verified from OpenStreetMap building footprints statewide. */
export interface DelawareHousePin {
  address: string
  lat: number
  lng: number
  tag: TacticalPinTag
  voterId: string
}

const delawareVerifiedHousePinsSeed: DelawareHousePin[] = [
  { address: '12 Gill Drive, Newark, DE 19713', lat: 39.65765, lng: -75.740825, tag: 'REP', voterId: 'john-miller' },
  { address: '9 Ritter Lane, Newark, DE 19711', lat: 39.6717546, lng: -75.7545734, tag: 'PERS', voterId: 'sarah-jenkins' },
  { address: '9 Kitty Lane, Newark, DE 19713', lat: 39.652432, lng: -75.7449445, tag: 'SENT', voterId: 'mark-thompson' },
  { address: '9 Natalie Lane, Newark, DE 19713', lat: 39.6579385, lng: -75.7397599, tag: 'REP', voterId: 'jameson-sterling' },
  { address: '12 Edjil Drive, Newark, DE 19713', lat: 39.6533385, lng: -75.7478838, tag: 'PERS', voterId: 'john-miller' },
  { address: '12 Oklahoma State Drive, Newark, DE 19713', lat: 39.6491468, lng: -75.7773308, tag: 'SENT', voterId: 'sarah-jenkins' },
  { address: '12 Donna Drive, Newark, DE 19713', lat: 39.651792, lng: -75.7442955, tag: 'REP', voterId: 'mark-thompson' },
  { address: '125 Sweetgum Drive, Dover, DE 19904', lat: 39.167368, lng: -75.5710758, tag: 'PERS', voterId: 'jameson-sterling' },
  { address: '14 Arbor Drive, Dover, DE 19904', lat: 39.1683588, lng: -75.5712012, tag: 'SENT', voterId: 'john-miller' },
  { address: '15 Hickman Road, Claymont, DE 19703', lat: 39.8152712, lng: -75.4449415, tag: 'REP', voterId: 'sarah-jenkins' },
  { address: 'West 9th Street (Wawaset Park), Wilmington, DE 19805', lat: 39.7505822, lng: -75.5623876, tag: 'PERS', voterId: 'mark-thompson' },
  { address: '7 Sunnyfield Road, Rehoboth Beach, DE 19971', lat: 38.7038939, lng: -75.1148625, tag: 'SENT', voterId: 'jameson-sterling' },
  { address: '7 Baybreeze Road, Rehoboth Beach, DE 19971', lat: 38.7041377, lng: -75.1158092, tag: 'REP', voterId: 'john-miller' },
  { address: '12 Branchwood Drive, Rehoboth Beach, DE 19971', lat: 38.7027205, lng: -75.1145979, tag: 'PERS', voterId: 'sarah-jenkins' },
  { address: '10 East Canal Street, Lewes, DE 19958', lat: 38.7815933, lng: -75.1369186, tag: 'SENT', voterId: 'mark-thompson' },
  { address: '12 Beach Plum Drive, Millville, DE 19967', lat: 38.5437192, lng: -75.1072006, tag: 'REP', voterId: 'jameson-sterling' },
  { address: '12 Sea Side Drive, Bethany Beach, DE 19930', lat: 38.5187107, lng: -75.0539422, tag: 'PERS', voterId: 'john-miller' },
  { address: '21 Rodney Street, Seaford, DE 19973', lat: 38.6445034, lng: -75.6279508, tag: 'SENT', voterId: 'sarah-jenkins' },
  { address: '9 West North Street, Georgetown, DE 19947', lat: 38.6949679, lng: -75.3928765, tag: 'REP', voterId: 'mark-thompson' },
  { address: '9 West Cannon Street, Fenwick Island, DE 19944', lat: 38.4588148, lng: -75.0535037, tag: 'PERS', voterId: 'jameson-sterling' },
  { address: '5 Bennett Street, Selbyville, DE 19975', lat: 38.4555163, lng: -75.2247721, tag: 'SENT', voterId: 'john-miller' },
  { address: '5 North Church Street, Greenwood, DE 19950', lat: 38.8078966, lng: -75.5935679, tag: 'REP', voterId: 'sarah-jenkins' },
  { address: '9 West Farmington Street, Fenwick Island, DE 19944', lat: 38.4616444, lng: -75.0534292, tag: 'PERS', voterId: 'maria-santos' },
  { address: '9 West Georgetown Street, Fenwick Island, DE 19944', lat: 38.4625986, lng: -75.0534054, tag: 'SENT', voterId: 'jacob-ellis' },
  { address: '9 West Bayard Street, Fenwick Island, DE 19944', lat: 38.457836, lng: -75.0535464, tag: 'REP', voterId: 'tanya-briggs' },
  { address: '9 West Dagsboro Street, Fenwick Island, DE 19944', lat: 38.4597153, lng: -75.0534843, tag: 'PERS', voterId: 'wei-chen' },
  { address: '9 West Atlantic Street, Fenwick Island, DE 19944', lat: 38.4569811, lng: -75.0535459, tag: 'SENT', voterId: 'olivia-park' },
  { address: '9 West Essex Street, Fenwick Island, DE 19944', lat: 38.4607171, lng: -75.0534502, tag: 'REP', voterId: 'derek-hayes' },
  { address: '5 Georgia Street, Selbyville, DE 19975', lat: 38.4551705, lng: -75.2232381, tag: 'PERS', voterId: 'kim-rivera' },
  { address: 'Windmill Lane, Ocean View, DE 19970', lat: 38.5391693, lng: -75.1092962, tag: 'SENT', voterId: 'pat-murphy' },
  { address: 'Longmeadow Drive, Middletown, DE 19709', lat: 39.4431377, lng: -75.6803867, tag: 'REP', voterId: 'nina-ortiz' },
  { address: 'Mulberry Street, Smyrna, DE 19977', lat: 39.296928, lng: -75.6103065, tag: 'PERS', voterId: 'avery-brooks' },
  { address: 'West Mispillion Street, Harrington, DE 19952', lat: 38.9223323, lng: -75.5834724, tag: 'SENT', voterId: 'john-miller' },
  { address: 'South Main Street, Bridgeville, DE 19933', lat: 38.7232542, lng: -75.592431, tag: 'REP', voterId: 'sarah-jenkins' },
  { address: 'South Dupont Boulevard, Camden, DE 19934', lat: 39.2780341, lng: -75.5920694, tag: 'PERS', voterId: 'mark-thompson' },
  { address: 'West Front Street, Laurel, DE 19956', lat: 38.5579145, lng: -75.5728599, tag: 'SENT', voterId: 'jameson-sterling' },
  { address: 'Southeast 2nd Street, Milford, DE 19963', lat: 38.9103289, lng: -75.4208077, tag: 'REP', voterId: 'maria-santos' },
  { address: 'New Granville Road, Pike Creek, DE 19808', lat: 39.7438726, lng: -75.7039361, tag: 'PERS', voterId: 'jacob-ellis' },
  { address: 'Yorklyn Road, Hockessin, DE 19707', lat: 39.7885186, lng: -75.6960397, tag: 'SENT', voterId: 'tanya-briggs' },
  { address: 'Wrangle Hill Road, Bear, DE 19701', lat: 39.6296, lng: -75.6659, tag: 'REP', voterId: 'wei-chen' },
  { address: 'Philadelphia Pike, Claymont, DE 19703', lat: 39.805, lng: -75.455, tag: 'PERS', voterId: 'olivia-park' },
  { address: 'Bay Vista Road, Rehoboth Beach, DE 19971', lat: 38.7097, lng: -75.0966, tag: 'SENT', voterId: 'derek-hayes' },
  { address: 'John J. Williams Highway, Millsboro, DE 19966', lat: 38.5915, lng: -75.2913, tag: 'REP', voterId: 'kim-rivera' },
  { address: 'DuPont Boulevard, Georgetown, DE 19947', lat: 38.69, lng: -75.378, tag: 'PERS', voterId: 'pat-murphy' },
  { address: 'Cannon Road, Townsend, DE 19734', lat: 39.3953, lng: -75.6917, tag: 'SENT', voterId: 'nina-ortiz' },
  { address: 'South Race Street, Smyrna, DE 19977', lat: 39.2992, lng: -75.6045, tag: 'REP', voterId: 'avery-brooks' },
  { address: 'Lincoln Street, Wilmington, DE 19805', lat: 39.7485, lng: -75.573, tag: 'PERS', voterId: 'john-miller' },
  { address: 'Coastal Highway, Dewey Beach, DE 19971', lat: 38.6926, lng: -75.0749, tag: 'SENT', voterId: 'sarah-jenkins' },
  { address: 'North Dupont Highway, Dover, DE 19901', lat: 39.1681, lng: -75.5245, tag: 'REP', voterId: 'mark-thompson' },
  { address: 'Concord Pike, Talleyville, DE 19803', lat: 39.8052, lng: -75.5447, tag: 'PERS', voterId: 'jameson-sterling' },
]

export const dashboardMapConfig = {
  center: { lat: 38.9897, lng: -75.505 },
  zoom: 9,
}

export const voters: Voter[] = [
  {
    id: 'john-miller',
    name: 'John Miller',
    address: '742 Evergreen Terrace',
    cityState: 'Elsmere, DE 19805',
    party: 'REP',
    supportScore: 88,
    reliability: 'High',
    engageScore: 88,
    lastContact: 'Oct 18, 2024',
    voteMethod: 'Election Day',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWnvdWP-t5GhC651-0r1WirXeWKWZS9FoqstgOVD3dOBKZO3Jf60JmGPdB0ZiZJfKOS6bWamhc4YbWehnLxcgrCAL4HK40wMpr2NgE8dX1PpVnFu0EmWsvKIanplHOdRx_YgqAx6qE9SQj0b_ss11dbSim198ofGZgaD5CBXjFfDCPJFJtZVWq8paGVOujDCf7d-26NkB-ssOAhaELQwk8Uqlrltmcq0KM0cMBhw04n5E_fd-l_2a3QhntXhw4vbIm9xANMZZjS9I',
    district: 'Elsmere - District 3',
    subtitle: 'Likely Supporter • High Propensity',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Strong yard signs. Prefers evening contact.',
    issues: [
      { label: 'Healthcare', detail: 'High Interest', icon: 'health_and_safety', tone: 'red' },
      { label: 'Economy', detail: 'Key Driver', icon: 'paid', tone: 'blue' },
    ],
    history: [
      {
        title: 'Phone Bank - Answered',
        meta: 'Oct 18 • Agent: Team West',
        icon: 'call',
        iconTone: 'primary',
      },
    ],
  },
  {
    id: 'sarah-jenkins',
    name: 'Sarah Jenkins',
    address: '104 Oakwood Ave',
    cityState: 'Elsmere, DE 19805',
    party: 'IND',
    supportScore: 52,
    reliability: 'Med',
    engageScore: 71,
    lastContact: 'Sep 30, 2024',
    voteMethod: 'Mail-in',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWnvdWP-t5GhC651-0r1WirXeWKWZS9FoqstgOVD3dOBKZO3Jf60JmGPdB0ZiZJfKOS6bWamhc4YbWehnLxcgrCAL4HK40wMpr2NgE8dX1PpVnFu0EmWsvKIanplHOdRx_YgqAx6qE9SQj0b_ss11dbSim198ofGZgaD5CBXjFfDCPJFJtZVWq8paGVOujDCf7d-26NkB-ssOAhaELQwk8Uqlrltmcq0KM0cMBhw04n5E_fd-l_2a3QhntXhw4vbIm9xANMZZjS9I',
    district: 'Elsmere - District 3',
    subtitle: 'Persuadable • Swing Profile',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Works from home Tuesdays. Eco issues resonate.',
    issues: [
      { label: 'Climate', detail: 'Moderate', icon: 'eco', tone: 'green' },
      { label: 'Education', detail: 'Supporter', icon: 'school', tone: 'amber' },
    ],
    history: [
      {
        title: 'Door Knock - No Answer',
        meta: 'Sep 30 • Agent: Mike R.',
        icon: 'door_front',
        iconTone: 'secondary',
      },
    ],
  },
  {
    id: 'mark-thompson',
    name: 'Mark Thompson',
    address: '21 Baker Street',
    cityState: 'Elsmere, DE 19805',
    party: 'REP',
    supportScore: 94,
    reliability: 'High',
    engageScore: 95,
    lastContact: 'Oct 22, 2024',
    voteMethod: 'Absentee',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWnvdWP-t5GhC651-0r1WirXeWKWZS9FoqstgOVD3dOBKZO3Jf60JmGPdB0ZiZJfKOS6bWamhc4YbWehnLxcgrCAL4HK40wMpr2NgE8dX1PpVnFu0EmWsvKIanplHOdRx_YgqAx6qE9SQj0b_ss11dbSim198ofGZgaD5CBXjFfDCPJFJtZVWq8paGVOujDCf7d-26NkB-ssOAhaELQwk8Uqlrltmcq0KM0cMBhw04n5E_fd-l_2a3QhntXhw4vbIm9xANMZZjS9I',
    district: 'Elsmere - District 3',
    subtitle: 'Likely Supporter • Volunteer Prospect',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Offered to host a coffee. Follow up Saturday.',
    issues: [
      { label: 'Healthcare', detail: 'High Interest', icon: 'health_and_safety', tone: 'red' },
      { label: 'Economy', detail: 'Key Driver', icon: 'paid', tone: 'blue' },
    ],
    history: [
      {
        title: 'Lit Drop - Completed',
        meta: 'Oct 22 • Agent: Dana L.',
        icon: 'description',
        iconTone: 'primary',
      },
    ],
  },
  {
    id: 'jameson-sterling',
    name: 'Jameson Sterling',
    address: '1284 Oakwood Terrace',
    cityState: 'Wilmington, DE 19805',
    party: 'REP',
    supportScore: 92,
    reliability: 'High',
    engageScore: 92,
    lastContact: 'Oct 12, 2024',
    voteMethod: 'Absentee',
    photoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWnvdWP-t5GhC651-0r1WirXeWKWZS9FoqstgOVD3dOBKZO3Jf60JmGPdB0ZiZJfKOS6bWamhc4YbWehnLxcgrCAL4HK40wMpr2NgE8dX1PpVnFu0EmWsvKIanplHOdRx_YgqAx6qE9SQj0b_ss11dbSim198ofGZgaD5CBXjFfDCPJFJtZVWq8paGVOujDCf7d-26NkB-ssOAhaELQwk8Uqlrltmcq0KM0cMBhw04n5E_fd-l_2a3QhntXhw4vbIm9xANMZZjS9I',
    district: 'Elsmere - District 3',
    subtitle: 'Likely Supporter • High Propensity',
    mapImageUrl: MAP_STREET,
    canvassingNote: '"Friendly, active in PTA. Prefers weekend visits."',
    issues: [
      { label: 'Healthcare', detail: 'High Interest', icon: 'health_and_safety', tone: 'red' },
      { label: 'Economy', detail: 'Key Driver', icon: 'paid', tone: 'blue' },
      { label: 'Climate', detail: 'Moderate', icon: 'eco', tone: 'green' },
      { label: 'Education', detail: 'Supporter', icon: 'school', tone: 'amber' },
    ],
    history: [
      {
        title: 'Door Knock - Successful',
        meta: 'Oct 12 • Agent: Sarah M.',
        icon: 'campaign',
        iconTone: 'primary',
      },
      {
        title: 'Mail Piece Sent',
        meta: 'Sep 28 • Campaign: Healthcare Focus',
        icon: 'mail',
        iconTone: 'secondary',
      },
    ],
  },
  {
    id: 'maria-santos',
    name: 'Maria Santos',
    address: '88 Scarborough Park Drive',
    cityState: 'Dover, DE 19904',
    party: 'DEM',
    supportScore: 61,
    reliability: 'Med',
    engageScore: 74,
    lastContact: 'Oct 8, 2024',
    voteMethod: 'Early voting',
    photoUrl: DEMO_FACE_URL,
    district: 'Kent — Capital corridor',
    subtitle: 'Healthcare voter • Open to local jobs pitch',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Bilingual household. Best after 6pm.',
    issues: [
      { label: 'Healthcare', detail: 'Top issue', icon: 'health_and_safety', tone: 'red' },
      { label: 'Jobs', detail: 'Manufacturing', icon: 'work', tone: 'blue' },
    ],
    history: [
      { title: 'SMS reply — positive', meta: 'Oct 8 • Auto', icon: 'sms', iconTone: 'primary' },
    ],
  },
  {
    id: 'jacob-ellis',
    name: 'Jacob Ellis',
    address: '402 Suburban Drive',
    cityState: 'Newark, DE 19711',
    party: 'REP',
    supportScore: 79,
    reliability: 'High',
    engageScore: 81,
    lastContact: 'Oct 14, 2024',
    voteMethod: 'Election Day',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — University rim',
    subtitle: 'Reliable primary voter',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Works at hospital. Short conversations only.',
    issues: [
      { label: 'Public safety', detail: 'High', icon: 'local_police', tone: 'red' },
      { label: 'Taxes', detail: 'Key', icon: 'account_balance', tone: 'blue' },
    ],
    history: [
      { title: 'Neighbor referral', meta: 'Oct 2 • Field', icon: 'groups', iconTone: 'secondary' },
    ],
  },
  {
    id: 'tanya-briggs',
    name: 'Tanya Briggs',
    address: '16 Cypress Branch Road',
    cityState: 'Millsboro, DE 19966',
    party: 'IND',
    supportScore: 48,
    reliability: 'Med',
    engageScore: 66,
    lastContact: 'Sep 22, 2024',
    voteMethod: 'Mail-in',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — inland',
    subtitle: 'Persuasion target • Climate concern',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Ask about agriculture / water quality framing.',
    issues: [
      { label: 'Climate', detail: 'High', icon: 'eco', tone: 'green' },
      { label: 'Education', detail: 'Moderate', icon: 'school', tone: 'amber' },
    ],
    history: [
      { title: 'Survey completed', meta: 'Sep 22 • Phone', icon: 'poll', iconTone: 'primary' },
    ],
  },
  {
    id: 'wei-chen',
    name: 'Wei Chen',
    address: '910 Valley Road',
    cityState: 'Hockessin, DE 19707',
    party: 'IND',
    supportScore: 55,
    reliability: 'High',
    engageScore: 77,
    lastContact: 'Oct 19, 2024',
    voteMethod: 'Absentee',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — Chateau country',
    subtitle: 'Split ticket history',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Data-forward; cite sources. No weekend mornings.',
    issues: [
      { label: 'Economy', detail: 'Top', icon: 'paid', tone: 'blue' },
      { label: 'Transit', detail: 'Interest', icon: 'directions_transit', tone: 'amber' },
    ],
    history: [
      { title: 'Email open — manifesto', meta: 'Oct 12 • Digital', icon: 'mail', iconTone: 'secondary' },
    ],
  },
  {
    id: 'olivia-park',
    name: 'Olivia Park',
    address: '3 Shipcarpenter Square',
    cityState: 'Lewes, DE 19958',
    party: 'DEM',
    supportScore: 68,
    reliability: 'High',
    engageScore: 85,
    lastContact: 'Oct 5, 2024',
    voteMethod: 'Early voting',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — Cape region',
    subtitle: 'Strong volunteer affinity',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Offered to hold sign. Steward small-dollar donor.',
    issues: [
      { label: 'Environment', detail: 'Coastal', icon: 'waves', tone: 'green' },
      { label: 'Healthcare', detail: 'Stable', icon: 'health_and_safety', tone: 'red' },
    ],
    history: [
      { title: 'Event RSVP — town hall', meta: 'Sep 30 • Ops', icon: 'event', iconTone: 'primary' },
    ],
  },
  {
    id: 'derek-hayes',
    name: 'Derek Hayes',
    address: '55 Northeast Front Street',
    cityState: 'Milford, DE 19963',
    party: 'REP',
    supportScore: 91,
    reliability: 'High',
    engageScore: 89,
    lastContact: 'Oct 21, 2024',
    voteMethod: 'Election Day',
    photoUrl: DEMO_FACE_URL,
    district: 'Kent / Sussex line',
    subtitle: 'Super-voter • Leadership prospect',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Introduce through veterans org contact.',
    issues: [
      { label: 'Veterans', detail: 'Champion', icon: 'military_tech', tone: 'red' },
      { label: 'Economy', detail: 'Small biz', icon: 'storefront', tone: 'blue' },
    ],
    history: [
      { title: 'Host committee pledge', meta: 'Oct 21 • Finance', icon: 'volunteer_activism', iconTone: 'primary' },
    ],
  },
  {
    id: 'kim-rivera',
    name: 'Kim Rivera',
    address: '1401 Tatnall Street',
    cityState: 'Wilmington, DE 19801',
    party: 'PERS',
    supportScore: 44,
    reliability: 'Low',
    engageScore: 58,
    lastContact: 'Aug 4, 2024',
    voteMethod: 'Unknown',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — Riverfront',
    subtitle: 'Low confidence model • Registrant churn',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Confirm address; possible unit turnover.',
    issues: [
      { label: 'Housing', detail: 'Interest', icon: 'real_estate_agent', tone: 'amber' },
      { label: 'Transit', detail: 'Moderate', icon: 'directions_bus', tone: 'blue' },
    ],
    history: [
      { title: 'Address verification mail returned', meta: 'Aug 4 • Data', icon: 'mark_email_unread', iconTone: 'secondary' },
    ],
  },
  {
    id: 'pat-murphy',
    name: 'Pat Murphy',
    address: '6 Irish Lane',
    cityState: 'Ocean View, DE 19970',
    party: 'REP',
    supportScore: 82,
    reliability: 'High',
    engageScore: 80,
    lastContact: 'Oct 17, 2024',
    voteMethod: 'Mail-in',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — south shore',
    subtitle: 'Retired • High response to door hangers',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Dog on site — call first.',
    issues: [
      { label: 'Taxes', detail: 'Key', icon: 'request_quote', tone: 'blue' },
      { label: 'Healthcare', detail: 'Medicare', icon: 'elderly', tone: 'red' },
    ],
    history: [
      { title: 'Door hanger — scanned QR', meta: 'Oct 17 • Field', icon: 'qr_code_2', iconTone: 'primary' },
    ],
  },
  {
    id: 'nina-ortiz',
    name: 'Nina Ortiz',
    address: '300 Main Street',
    cityState: 'Townsend, DE 19734',
    party: 'DEM',
    supportScore: 72,
    reliability: 'Med',
    engageScore: 75,
    lastContact: 'Oct 9, 2024',
    voteMethod: 'Early voting',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — southern tier',
    subtitle: 'Education parent • PTO connector',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Kids’ soccer schedule — try Saturday noon.',
    issues: [
      { label: 'Education', detail: 'Priority', icon: 'school', tone: 'amber' },
      { label: 'Healthcare', detail: 'Moderate', icon: 'health_and_safety', tone: 'red' },
    ],
    history: [
      { title: 'PTO booth signup', meta: 'Oct 1 • Event', icon: 'how_to_reg', iconTone: 'primary' },
    ],
  },
  {
    id: 'avery-brooks',
    name: 'Avery Brooks',
    address: '77 Lake Circle East',
    cityState: 'Smyrna, DE 19977',
    party: 'IND',
    supportScore: 51,
    reliability: 'Med',
    engageScore: 69,
    lastContact: 'Sep 18, 2024',
    voteMethod: 'Election Day',
    photoUrl: DEMO_FACE_URL,
    district: 'Kent — Smyrna neck',
    subtitle: 'First-time midterm in file',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Use neighbor social proof — same block lit drops.',
    issues: [
      { label: 'Economy', detail: 'Jobs', icon: 'construction', tone: 'blue' },
      { label: 'Public safety', detail: 'Moderate', icon: 'shield', tone: 'red' },
    ],
    history: [
      { title: 'ID request — new registrant', meta: 'Sep 18 • VR', icon: 'person_add', iconTone: 'secondary' },
    ],
  },
  {
    id: 'alice-graham',
    name: 'Alice Graham',
    address: '44 N Market Street',
    cityState: 'Wilmington, DE 19801',
    party: 'DEM',
    supportScore: 64,
    reliability: 'High',
    engageScore: 78,
    lastContact: 'Oct 16, 2024',
    voteMethod: 'Early voting',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — downtown',
    subtitle: 'Union household • Housing message tests well',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Ask through screen door — young kids nap early.',
    issues: [
      { label: 'Housing', detail: 'Rent burden', icon: 'real_estate_agent', tone: 'amber' },
      { label: 'Labor', detail: 'Strong', icon: 'engineering', tone: 'blue' },
    ],
    history: [
      { title: 'Canvass — short yes on lit', meta: 'Oct 16 • Field', icon: 'door_front', iconTone: 'primary' },
    ],
  },
  {
    id: 'brian-walsh',
    name: 'Brian Walsh',
    address: '208 Laurel Road',
    cityState: 'Seaford, DE 19973',
    party: 'REP',
    supportScore: 86,
    reliability: 'High',
    engageScore: 84,
    lastContact: 'Oct 20, 2024',
    voteMethod: 'Election Day',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — western',
    subtitle: 'Chamber member • Agriculture ally',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Cites poultry industry concerns; keep pitch local.',
    issues: [
      { label: 'Economy', detail: 'Ag / small biz', icon: 'agriculture', tone: 'blue' },
      { label: 'Regulation', detail: 'High', icon: 'gavel', tone: 'red' },
    ],
    history: [
      { title: 'County breakfast — card swap', meta: 'Oct 20 • Event', icon: 'restaurant', iconTone: 'primary' },
    ],
  },
  {
    id: 'carmen-diaz',
    name: 'Carmen Diaz',
    address: '115 West Pine Street',
    cityState: 'Georgetown, DE 19947',
    party: 'IND',
    supportScore: 49,
    reliability: 'Med',
    engageScore: 63,
    lastContact: 'Sep 28, 2024',
    voteMethod: 'Mail-in',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — county seat',
    subtitle: 'Persuadable • Spanish preferred',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Leave bilingual door hanger; SMS follow-up ok.',
    issues: [
      { label: 'Education', detail: 'ESL / schools', icon: 'school', tone: 'amber' },
      { label: 'Healthcare', detail: 'Moderate', icon: 'health_and_safety', tone: 'red' },
    ],
    history: [
      { title: 'Phone — partial survey', meta: 'Sep 28 • Dialer', icon: 'call', iconTone: 'secondary' },
    ],
  },
  {
    id: 'donovan-reed',
    name: 'Donovan Reed',
    address: '55 Paper Mill Road',
    cityState: 'Newark, DE 19711',
    party: 'PERS',
    supportScore: 41,
    reliability: 'Low',
    engageScore: 55,
    lastContact: 'Aug 30, 2024',
    voteMethod: 'Unknown',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — UD adjacent',
    subtitle: 'Sparse contact history • Student turnover block',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Model showing “drop-off”; confirm unit number.',
    issues: [
      { label: 'Housing', detail: 'Renter', icon: 'apartment', tone: 'amber' },
      { label: 'Transit', detail: 'Interest', icon: 'directions_bus', tone: 'blue' },
    ],
    history: [
      { title: 'Wrong number — corrected cell', meta: 'Aug 30 • Data', icon: 'sim_card_alert', iconTone: 'secondary' },
    ],
  },
  {
    id: 'elaine-frost',
    name: 'Elaine Frost',
    address: '600 Broad Street',
    cityState: 'Middletown, DE 19709',
    party: 'SENT',
    supportScore: 58,
    reliability: 'Med',
    engageScore: 70,
    lastContact: 'Oct 11, 2024',
    voteMethod: 'Early voting',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — Middletown growth',
    subtitle: 'Issue-led • Mixed federal signals',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Lead with schools bond; avoid national hot takes.',
    issues: [
      { label: 'Education', detail: 'Bond supporter', icon: 'school', tone: 'amber' },
      { label: 'Public safety', detail: 'Moderate', icon: 'local_police', tone: 'red' },
    ],
    history: [
      { title: 'Town hall question submitted', meta: 'Oct 11 • Virtual', icon: 'forum', iconTone: 'primary' },
    ],
  },
  {
    id: 'frank-okada',
    name: 'Frank Okada',
    address: '908 Philadelphia Pike',
    cityState: 'Claymont, DE 19703',
    party: 'REP',
    supportScore: 77,
    reliability: 'Med',
    engageScore: 76,
    lastContact: 'Oct 15, 2024',
    voteMethod: 'Absentee',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — I-95 corridor',
    subtitle: 'Commuter • Taxes / traffic',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Evening only; works in Philly.',
    issues: [
      { label: 'Transit', detail: 'Delays', icon: 'traffic', tone: 'amber' },
      { label: 'Taxes', detail: 'Property', icon: 'account_balance', tone: 'blue' },
    ],
    history: [
      { title: 'Metro ad click — landing page', meta: 'Oct 15 • Digital', icon: 'ads_click', iconTone: 'secondary' },
    ],
  },
  {
    id: 'gloria-mendez',
    name: 'Gloria Mendez',
    address: '12 Commerce Street',
    cityState: 'Harrington, DE 19952',
    party: 'DEM',
    supportScore: 66,
    reliability: 'High',
    engageScore: 82,
    lastContact: 'Oct 18, 2024',
    voteMethod: 'Mail-in',
    photoUrl: DEMO_FACE_URL,
    district: 'Kent — rural east',
    subtitle: 'Senior center volunteer',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Ask about fairgrounds event schedule — warm intro.',
    issues: [
      { label: 'Healthcare', detail: 'Rx costs', icon: 'medication', tone: 'red' },
      { label: 'Environment', detail: 'Water table', icon: 'water_drop', tone: 'green' },
    ],
    history: [
      { title: 'Senior fair booth', meta: 'Oct 18 • Event', icon: 'elderly', iconTone: 'primary' },
    ],
  },
  {
    id: 'hassan-abdi',
    name: 'Hassan Abdi',
    address: '33 Main Street',
    cityState: 'Bridgeville, DE 19933',
    party: 'IND',
    supportScore: 53,
    reliability: 'Med',
    engageScore: 67,
    lastContact: 'Sep 25, 2024',
    voteMethod: 'Election Day',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — Bridgeville',
    subtitle: 'New homeowner • Local infrastructure',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Paved roads and storm drains come up unprompted.',
    issues: [
      { label: 'Infrastructure', detail: 'Roads', icon: 'construction', tone: 'blue' },
      { label: 'Broadband', detail: 'Interest', icon: 'router', tone: 'amber' },
    ],
    history: [
      { title: 'Welcome wagon packet', meta: 'Sep 25 • Neighbor', icon: 'markunread_mailbox', iconTone: 'secondary' },
    ],
  },
  {
    id: 'iris-newton',
    name: 'Iris Newton',
    address: '220 Mechanic Street',
    cityState: 'Camden, DE 19934',
    party: 'REP',
    supportScore: 89,
    reliability: 'High',
    engageScore: 88,
    lastContact: 'Oct 23, 2024',
    voteMethod: 'Election Day',
    photoUrl: DEMO_FACE_URL,
    district: 'Kent — Camden-Wyoming',
    subtitle: 'Faith community liaison',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Introduce through pastor; offer ride to polls.',
    issues: [
      { label: 'Education', detail: 'Parochial credits', icon: 'church', tone: 'amber' },
      { label: 'Healthcare', detail: 'Pro-life lean', icon: 'favorite', tone: 'red' },
    ],
    history: [
      { title: 'Church picnic signup sheet', meta: 'Oct 23 • Grassroots', icon: 'celebration', iconTone: 'primary' },
    ],
  },
  {
    id: 'joel-brennan',
    name: 'Joel Brennan',
    address: '88 West Front Street',
    cityState: 'Laurel, DE 19956',
    party: 'DEM',
    supportScore: 59,
    reliability: 'Med',
    engageScore: 72,
    lastContact: 'Oct 7, 2024',
    voteMethod: 'Early voting',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — Laurel',
    subtitle: 'Union sheet metal • Swing on national headline days',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Respect overtime schedule; text don’t call weekdays.',
    issues: [
      { label: 'Labor', detail: 'UA member', icon: 'handyman', tone: 'blue' },
      { label: 'Economy', detail: 'Wages', icon: 'payments', tone: 'amber' },
    ],
    history: [
      { title: 'Petition signature — wage board', meta: 'Oct 7 • Worksites', icon: 'draw', iconTone: 'primary' },
    ],
  },
  {
    id: 'kendra-holt',
    name: 'Kendra Holt',
    address: '4 Coastal Avenue',
    cityState: 'Fenwick Island, DE 19944',
    party: 'IND',
    supportScore: 46,
    reliability: 'Low',
    engageScore: 61,
    lastContact: 'Jul 21, 2024',
    voteMethod: 'Mail-in',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — coastal strip',
    subtitle: 'Seasonal occupancy flagged',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Confirm primary residence before hard ask.',
    issues: [
      { label: 'Environment', detail: 'Beach erosion', icon: 'beach_access', tone: 'green' },
      { label: 'Taxes', detail: 'Second home', icon: 'holiday_village', tone: 'blue' },
    ],
    history: [
      { title: 'Vacation hold — returned postcard', meta: 'Jul 21 • Data', icon: 'mark_email_unread', iconTone: 'secondary' },
    ],
  },
  {
    id: 'luis-vega',
    name: 'Luis Vega',
    address: '22 Market Street',
    cityState: 'Greenwood, DE 19950',
    party: 'REP',
    supportScore: 73,
    reliability: 'Med',
    engageScore: 74,
    lastContact: 'Oct 13, 2024',
    voteMethod: 'Election Day',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — western inland',
    subtitle: 'Veteran • Small engine repair shop',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Closed Sunday; Monday afternoons best.',
    issues: [
      { label: 'Veterans', detail: 'VA backlog', icon: 'military_tech', tone: 'red' },
      { label: 'Economy', detail: 'Fuel costs', icon: 'local_gas_station', tone: 'blue' },
    ],
    history: [
      { title: 'VFW hall meet-and-greet', meta: 'Oct 13 • Event', icon: 'groups', iconTone: 'primary' },
    ],
  },
  {
    id: 'mona-shah',
    name: 'Mona Shah',
    address: '30 Baltimore Avenue',
    cityState: 'Rehoboth Beach, DE 19971',
    party: 'DEM',
    supportScore: 70,
    reliability: 'High',
    engageScore: 86,
    lastContact: 'Oct 10, 2024',
    voteMethod: 'Early voting',
    photoUrl: DEMO_FACE_URL,
    district: 'Sussex — boardwalk retail',
    subtitle: 'Business owner • Tourism seasonality',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Shop open late summer; fall evenings for contact.',
    issues: [
      { label: 'Economy', detail: 'Hospitality', icon: 'storefront', tone: 'blue' },
      { label: 'Environment', detail: 'Clean water', icon: 'waves', tone: 'green' },
    ],
    history: [
      { title: 'Merchant association pledge', meta: 'Oct 10 • Chamber', icon: 'handshake', iconTone: 'primary' },
    ],
  },
  {
    id: 'nate-coleman',
    name: 'Nate Coleman',
    address: '180 South Street',
    cityState: 'Townsend, DE 19734',
    party: 'PERS',
    supportScore: 38,
    reliability: 'Low',
    engageScore: 52,
    lastContact: 'Jun 12, 2024',
    voteMethod: 'Unknown',
    photoUrl: DEMO_FACE_URL,
    district: 'New Castle — southern tier',
    subtitle: 'Stale cell • Likely moved in-model',
    mapImageUrl: MAP_STREET,
    canvassingNote: 'Prioritize address confirmation knock.',
    issues: [
      { label: 'Housing', detail: 'Uncertain', icon: 'help_outline', tone: 'amber' },
    ],
    history: [
      { title: 'NCOA flag — unconfirmed', meta: 'Jun 12 • Data', icon: 'moving', iconTone: 'secondary' },
    ],
  },
]

/**
 * Dashboard “Priority targets” carousel — high-support and persuasion mix, field order.
 */
export const priorityTargetIds: string[] = [
  'jameson-sterling',
  'derek-hayes',
  'john-miller',
  'pat-murphy',
  'jacob-ellis',
  'mark-thompson',
  'sarah-jenkins',
  'maria-santos',
  'olivia-park',
  'nina-ortiz',
  'wei-chen',
  'tanya-briggs',
  'avery-brooks',
  'kim-rivera',
  'alice-graham',
  'brian-walsh',
  'iris-newton',
  'gloria-mendez',
  'mona-shah',
  'elaine-frost',
]

export function getVoter(id: string): Voter | undefined {
  return voters.find((v) => v.id === id)
}

export function getPriorityTargets(): Voter[] {
  return priorityTargetIds.map((id) => getVoter(id)).filter((v): v is Voter => v != null)
}

function nearestRepresentativeDistrictIndex(lat: number, lng: number): number {
  let nearest = 0
  let minDistanceSq = Number.POSITIVE_INFINITY
  for (let i = 0; i < representativeDistrictMapCentroids.length; i++) {
    const c = representativeDistrictMapCentroids[i]
    const dLat = lat - c.lat
    const dLng = lng - c.lng
    const distanceSq = dLat * dLat + dLng * dLng
    if (distanceSq < minDistanceSq) {
      minDistanceSq = distanceSq
      nearest = i
    }
  }
  return nearest
}

export function getPriorityTargetsForSector(sectorLabel: string): Voter[] {
  const districtMatch = sectorLabel.match(/District\s+(\d+)/i)
  const districtIndex = districtMatch ? Number(districtMatch[1]) - 1 : Number.NaN
  if (!Number.isFinite(districtIndex) || districtIndex < 0) {
    return getPriorityTargets()
  }

  const sectorVoterIds = new Set<string>()
  for (const pin of delawareVerifiedHousePins) {
    if (nearestRepresentativeDistrictIndex(pin.lat, pin.lng) === districtIndex) {
      sectorVoterIds.add(pin.voterId)
    }
  }
  if (sectorVoterIds.size === 0) return getPriorityTargets()

  const globalPriority = getPriorityTargets()
  const sectorPriority = globalPriority.filter((v) => sectorVoterIds.has(v.id))
  if (sectorPriority.length >= 8) return sectorPriority

  const remainder = globalPriority.filter((v) => !sectorVoterIds.has(v.id))
  return [...sectorPriority, ...remainder]
}

/** Delaware representative districts (41 seats). */
export const delawareRepresentativeDistricts: readonly string[] = Array.from({ length: 41 }, (_, i) => {
  const n = i + 1
  return `Delaware — Representative District ${n}`
})

/**
 * Leaflet fly targets: index 0 = Representative District 1. Centroids derived from U.S. Census
 * 2022 cartographic boundary shapefile (state legislative districts, lower chamber), GEOID prefix 10.
 */
export const representativeDistrictMapCentroids: readonly { lat: number; lng: number }[] = [
  { lat: 39.75968291148278, lng: -75.53395583202547 },
  { lat: 39.734330070140544, lng: -75.54215901308916 },
  { lat: 39.746868513744566, lng: -75.57068443811566 },
  { lat: 38.63720422590147, lng: -75.17948122758541 },
  { lat: 39.636585560233584, lng: -75.64973887702355 },
  { lat: 39.7783154710158, lng: -75.51176149780804 },
  { lat: 39.801587228712755, lng: -75.46749453055722 },
  { lat: 39.46425524100219, lng: -75.72583589126123 },
  { lat: 39.454103834022774, lng: -75.61217130845093 },
  { lat: 39.8233904545873, lng: -75.51924999462314 },
  { lat: 39.27541893604442, lng: -75.69244354641725 },
  { lat: 39.796014581445704, lng: -75.60799005616882 },
  { lat: 39.73947554534704, lng: -75.60332932526926 },
  { lat: 38.711454754683196, lng: -75.11371571255418 },
  { lat: 39.58044164726788, lng: -75.67021218810136 },
  { lat: 39.700297386050906, lng: -75.55809416015997 },
  { lat: 39.63965777527366, lng: -75.61247152820543 },
  { lat: 39.66995689933456, lng: -75.66176875631139 },
  { lat: 39.727953758625986, lng: -75.64308706344514 },
  { lat: 38.75960675686609, lng: -75.25614862700569 },
  { lat: 39.72279808580892, lng: -75.69245205265594 },
  { lat: 39.76808761595144, lng: -75.69986472298659 },
  { lat: 39.7117470988222, lng: -75.75374493701148 },
  { lat: 39.67356819849995, lng: -75.71401824446448 },
  { lat: 39.641509958380944, lng: -75.7594047213926 },
  { lat: 39.642584889595824, lng: -75.69877593624369 },
  { lat: 39.558813128994416, lng: -75.74409383561508 },
  { lat: 39.25916386480729, lng: -75.50441531080561 },
  { lat: 39.205796634816025, lng: -75.60408235908295 },
  { lat: 38.968897362282185, lng: -75.63409267854054 },
  { lat: 39.15779244118909, lng: -75.55405511840935 },
  { lat: 39.12253973925493, lng: -75.46196195735759 },
  { lat: 38.99429708456926, lng: -75.44043984087365 },
  { lat: 39.087599094626896, lng: -75.54195000052984 },
  { lat: 38.75360076767735, lng: -75.5486119899908 },
  { lat: 38.84505082084143, lng: -75.35488981032243 },
  { lat: 38.66222421936149, lng: -75.32969799356825 },
  { lat: 38.52971540956189, lng: -75.10069575760716 },
  { lat: 38.639186697400135, lng: -75.63210812114386 },
  { lat: 38.53045339959628, lng: -75.53570334091805 },
  { lat: 38.51720323831382, lng: -75.27595083453936 },
]

/** Small lat/lng offsets from each HD centroid so three pins spread (~200–350m) without stacking. */
const REPRESENTATIVE_DISTRICT_PIN_OFFSETS: readonly { dlat: number; dlng: number }[] = [
  { dlat: 0.0032, dlng: 0.0018 },
  { dlat: -0.0024, dlng: 0.0028 },
  { dlat: 0.0016, dlng: -0.0032 },
]

const DEMO_PIN_VOTER_IDS: readonly string[] = [
  'john-miller',
  'sarah-jenkins',
  'mark-thompson',
  'jameson-sterling',
  'maria-santos',
  'jacob-ellis',
  'tanya-briggs',
  'wei-chen',
  'olivia-park',
  'derek-hayes',
  'kim-rivera',
  'pat-murphy',
  'nina-ortiz',
  'avery-brooks',
  'alice-graham',
  'brian-walsh',
  'carmen-diaz',
  'donovan-reed',
  'elaine-frost',
  'frank-okada',
  'gloria-mendez',
  'hassan-abdi',
  'iris-newton',
  'joel-brennan',
  'kendra-holt',
  'luis-vega',
  'mona-shah',
  'nate-coleman',
]

function tacticalPinsForAllRepresentativeDistricts(): DelawareHousePin[] {
  const tags: TacticalPinTag[] = ['REP', 'PERS', 'SENT']
  const pins: DelawareHousePin[] = []
  for (let i = 0; i < representativeDistrictMapCentroids.length; i++) {
    const c = representativeDistrictMapCentroids[i]
    const d = i + 1
    for (let j = 0; j < REPRESENTATIVE_DISTRICT_PIN_OFFSETS.length; j++) {
      const o = REPRESENTATIVE_DISTRICT_PIN_OFFSETS[j]
      pins.push({
        address: `Canvass sector ${j + 1} — Delaware HD ${d}`,
        lat: c.lat + o.dlat,
        lng: c.lng + o.dlng,
        tag: tags[j % tags.length],
        voterId: DEMO_PIN_VOTER_IDS[(i * REPRESENTATIVE_DISTRICT_PIN_OFFSETS.length + j) % DEMO_PIN_VOTER_IDS.length],
      })
    }
  }
  return pins
}

/** Verified/sample points plus three tactical pins per state house district (centroid-based). */
export const delawareVerifiedHousePins: DelawareHousePin[] = [
  ...delawareVerifiedHousePinsSeed,
  ...tacticalPinsForAllRepresentativeDistricts(),
]

/** Approximate voter coordinates from the tactical pin dataset, if available. */
export function getVoterApproxCoords(voterId: string): { lat: number; lng: number } | null {
  const pin = delawareVerifiedHousePins.find((p) => p.voterId === voterId)
  if (!pin) return null
  return { lat: pin.lat, lng: pin.lng }
}

export const dashboardStats = {
  doorsCleared: 42,
  doorsTotal: 120,
  voterConv: 12,
  voterConvDelta: '+2% FROM AVG',
  sector: 'Delaware — statewide sweep',
  timeRemaining: '14:02 REM',
}

/** Session key for dashboard sector `<select>` (priority targets + map focus). */
export const DASHBOARD_SECTOR_STORAGE_KEY = 'atlas-dashboard-sector'

export function readDashboardSectorSelection(): string {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_SECTOR_STORAGE_KEY)
    if (raw) return raw
  } catch {
    /* private mode */
  }
  return dashboardStats.sector
}

export interface BallotChaserAchievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  tier?: 'gold' | 'silver' | 'bronze'
}

export interface BallotChaserAction {
  time: string
  summary: string
  detail: string
  icon: string
}

export interface BallotChaser {
  id: string
  name: string
  role: string
  photoUrl: string
  zone: string
  doorsKnocked: number
  doorsGoal: number
  ballotsSecured: number
  ballotGoal: number
  streakDays: number
  achievements: BallotChaserAchievement[]
  recentActions: BallotChaserAction[]
}

export const ballotChasers: BallotChaser[] = [
  {
    id: 'alex-morales',
    name: 'Alex Morales',
    role: 'Lead chaser',
    photoUrl: DEMO_FACE_URL,
    zone: 'Newark corridor',
    doorsKnocked: 38,
    doorsGoal: 50,
    ballotsSecured: 14,
    ballotGoal: 20,
    streakDays: 6,
    achievements: [
      {
        id: 'amen-1',
        title: 'Ballot anchor',
        description: '10 mail-ballot pledges in one week',
        icon: 'how_to_vote',
        unlocked: true,
        tier: 'gold',
      },
      {
        id: 'amen-2',
        title: 'Sprint shift',
        description: '25 doors in a single afternoon',
        icon: 'sprint',
        unlocked: true,
        tier: 'silver',
      },
      {
        id: 'amen-3',
        title: 'Century stripe',
        description: '100 lifetime quality contacts',
        icon: 'military_tech',
        unlocked: false,
      },
    ],
    recentActions: [
      {
        time: 'Today • 2:10p',
        summary: 'Ballot secured',
        detail: 'Jameson Sterling — absentee packet confirmed',
        icon: 'check_circle',
      },
      {
        time: 'Today • 11:40a',
        summary: 'Persuasion touch',
        detail: 'Sarah Jenkins — vote method discussion',
        icon: 'campaign',
      },
      {
        time: 'Yesterday',
        summary: 'Lit drop',
        detail: 'Oakwood Terrace strip (6 doors)',
        icon: 'description',
      },
      {
        time: 'Tue • 5:25p',
        summary: 'Reminder call',
        detail: 'Pat Murphy — mail-in deadline reviewed',
        icon: 'call',
      },
      {
        time: 'Mon • 3:15p',
        summary: 'Door revisit',
        detail: 'Nina Ortiz — absentee form questions answered',
        icon: 'door_front',
      },
      {
        time: 'Sun • 12:30p',
        summary: 'Volunteer handoff',
        detail: 'Shared updated walk packet with weekend team',
        icon: 'groups',
      },
      {
        time: 'Sat • 9:50a',
        summary: 'Route optimization',
        detail: 'Reordered turf for high-priority follow-ups',
        icon: 'route',
      },
    ],
  },
  {
    id: 'jordan-kim',
    name: 'Jordan Kim',
    role: 'Ballot chaser',
    photoUrl: DEMO_FACE_URL,
    zone: 'Wilmington north',
    doorsKnocked: 29,
    doorsGoal: 45,
    ballotsSecured: 9,
    ballotGoal: 18,
    streakDays: 3,
    achievements: [
      {
        id: 'jk-1',
        title: 'Early bird',
        description: 'First knock before 9am five days straight',
        icon: 'wb_twilight',
        unlocked: true,
        tier: 'bronze',
      },
      {
        id: 'jk-2',
        title: 'Turquoise tier',
        description: '15 consecutive successful contacts',
        icon: 'workspace_premium',
        unlocked: true,
        tier: 'silver',
      },
      {
        id: 'jk-3',
        title: 'Sweep lead',
        description: 'Clear an entire cul-de-sac same day',
        icon: 'route',
        unlocked: false,
      },
    ],
    recentActions: [
      {
        time: 'Today • 4:20p',
        summary: 'Not home log',
        detail: 'Mark Thompson — lit at door',
        icon: 'door_front',
      },
      {
        time: 'Today • 1:05p',
        summary: 'Ballot secured',
        detail: 'John Miller — Election Day commitment',
        icon: 'how_to_reg',
      },
    ],
  },
  {
    id: 'riley-torres',
    name: 'Riley Torres',
    role: 'Ballot chaser',
    photoUrl: DEMO_FACE_URL,
    zone: 'Dover / central',
    doorsKnocked: 44,
    doorsGoal: 55,
    ballotsSecured: 11,
    ballotGoal: 22,
    streakDays: 12,
    achievements: [
      {
        id: 'rt-1',
        title: 'Streak flame',
        description: '12-day knock streak',
        icon: 'local_fire_department',
        unlocked: true,
        tier: 'gold',
      },
      {
        id: 'rt-2',
        title: 'Map master',
        description: 'Zero missed addresses in assigned turf',
        icon: 'map',
        unlocked: true,
        tier: 'gold',
      },
      {
        id: 'rt-3',
        title: 'Coach’s pick',
        description: 'Top weekly conversion on the team',
        icon: 'emoji_events',
        unlocked: false,
      },
    ],
    recentActions: [
      {
        time: 'Today • 3:55p',
        summary: 'Follow-up call',
        detail: 'Voter returned pledge card',
        icon: 'call',
      },
      {
        time: 'Yesterday',
        summary: 'Ballot secured',
        detail: 'Three mail-ins logged from block walk',
        icon: 'mark_email_read',
      },
      {
        time: 'Mon',
        summary: 'Training assist',
        detail: 'Onboarded new weekend volunteer pair',
        icon: 'school',
      },
    ],
  },
  {
    id: 'sam-okonkwo',
    name: 'Sam Okonkwo',
    role: 'Ballot chaser',
    photoUrl: DEMO_FACE_URL,
    zone: 'Coastal route',
    doorsKnocked: 21,
    doorsGoal: 40,
    ballotsSecured: 6,
    ballotGoal: 15,
    streakDays: 1,
    achievements: [
      {
        id: 'so-1',
        title: 'First shift',
        description: 'Completed onboarding checklist',
        icon: 'verified',
        unlocked: true,
        tier: 'bronze',
      },
      {
        id: 'so-2',
        title: 'Relay handoff',
        description: 'Perfect pass-off notes to next shift',
        icon: 'sync_alt',
        unlocked: false,
      },
      {
        id: 'so-3',
        title: 'Harbor cup',
        description: 'Win coastal zone weekly goal',
        icon: 'anchor',
        unlocked: false,
      },
    ],
    recentActions: [
      {
        time: 'Today • 10:30a',
        summary: 'Neighbor referral',
        detail: 'Warm intro to undecided household',
        icon: 'diversity_3',
      },
      {
        time: 'Sun',
        summary: 'Event sign-ups',
        detail: '4 addresses from beach weekend canvass',
        icon: 'event',
      },
    ],
  },
]
