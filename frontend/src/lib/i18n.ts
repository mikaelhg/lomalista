const en = {
  tagline:
    'Shared vacation lists for your team. No sign-up: share the link and everyone adds their own dates.',
  listTitle: 'Vacation list',
  heroTitle: "Plan your team's vacations together",
  howTitle: 'How it works',
  step1Title: 'Create a list',
  step1: 'One click gives you a new list with its own private link.',
  step2Title: 'Share the link',
  step2: 'Send it to your team, for example in your team chat. The link is the only key to the list.',
  step3Title: 'Add your dates',
  step3: 'Everyone adds their own name and vacation dates. The timeline shows who is away and when.',
  featNoSignup: 'No accounts or passwords',
  featOverlap: 'See at a glance how many are away each day',
  featPrivacy: 'Only names and dates are stored, and old lists are deleted automatically',
  privacyLink: 'Privacy policy',
  create: 'Create list',
  shareTitle: 'Your list is ready',
  shareWarn:
    'Anyone with this link can view and edit the list. Share it only with your team. The list becomes read-only a year after it was created, or a month after its last vacation if that is later.',
  copy: 'Copy link',
  copied: 'Copied!',
  open: 'Open the list',
  archivedBanner: 'This list is archived and read-only.',
  addPerson: 'Add yourself',
  nameLabel: 'Name',
  nameHint: 'Letters only, up to 15 characters.',
  add: 'Add',
  noPeople: 'Nobody has added their vacation yet.',
  addRange: 'Add vacation',
  dates: 'Vacation dates',
  remove: 'Remove',
  removePerson: 'Remove person',
  confirmOthers: 'This entry was not created in this browser. Change it anyway?',
  cancel: 'Cancel',
  proceed: 'Continue',
  mine: 'you',
  away: 'away',
  week: 'Week',
  weekShort: 'Wk',
  notFound: 'This list does not exist (or has been deleted).',
  home: 'Create a new list',
  loading: 'Loading…',
  stored: 'Only names and dates are stored.',
  err_name_empty: 'Enter a name.',
  err_name_too_long: 'The name can be at most 15 characters.',
  err_name_chars: 'Use only letters (Nordic letters are fine), with single spaces or hyphens between.',
  err_name_taken: 'That name is already on the list.',
  err_range_order: 'The end date is before the start date.',
  err_range_in_past: 'The vacation has already ended.',
  err_range_too_far: 'The vacation can start at most 18 months from now.',
  err_range_overlap: 'This overlaps one of your existing vacations.',
  err_too_many_ranges: 'Too many vacation periods for one person.',
  err_too_many_people: 'This list is full.',
  err_archived: 'This list is archived and read-only.',
  err_rate_limited: 'Too many lists created right now. Try again later.',
  err_not_found: 'Not found.',
  err_internal: 'Something went wrong. Try again.',
};

export type Dict = typeof en;

const fi: Dict = {
  tagline: 'Yhteinen lomalista tiimille. Ei rekisteröitymistä: jaa linkki ja jokainen lisää omat päivänsä.',
  listTitle: 'Lomalista',
  heroTitle: 'Suunnitelkaa tiimin lomat yhdessä',
  howTitle: 'Näin se toimii',
  step1Title: 'Luo lista',
  step1: 'Yhdellä napsautuksella saat uuden listan ja sille oman yksityisen linkin.',
  step2Title: 'Jaa linkki',
  step2: 'Lähetä se tiimillesi esimerkiksi tiimin chatissa. Linkki on listan ainoa avain.',
  step3Title: 'Lisää lomasi',
  step3: 'Jokainen lisää oman nimensä ja lomapäivänsä. Aikajanalta näkee, kuka on poissa ja milloin.',
  featNoSignup: 'Ei käyttäjätunnuksia eikä salasanoja',
  featOverlap: 'Näet yhdellä silmäyksellä, montako on lomalla kunakin päivänä',
  featPrivacy: 'Vain nimet ja päivämäärät tallennetaan, ja vanhat listat poistetaan automaattisesti',
  privacyLink: 'Tietosuojaseloste',
  create: 'Luo lista',
  shareTitle: 'Listasi on valmis',
  shareWarn:
    'Kuka tahansa linkin tietävä voi nähdä ja muokata listaa. Jaa se vain tiimillesi. Lista muuttuu vain luettavaksi vuoden kuluttua luomisesta tai kuukausi viimeisen loman jälkeen, jos se on myöhemmin.',
  copy: 'Kopioi linkki',
  copied: 'Kopioitu!',
  open: 'Avaa lista',
  archivedBanner: 'Lista on arkistoitu ja vain luettavissa.',
  addPerson: 'Lisää itsesi',
  nameLabel: 'Nimi',
  nameHint: 'Vain kirjaimia, enintään 15 merkkiä.',
  add: 'Lisää',
  noPeople: 'Kukaan ei ole vielä lisännyt lomaansa.',
  addRange: 'Lisää loma',
  dates: 'Lomapäivät',
  remove: 'Poista',
  removePerson: 'Poista henkilö',
  confirmOthers: 'Tätä merkintää ei ole luotu tässä selaimessa. Muutetaanko silti?',
  cancel: 'Peruuta',
  proceed: 'Jatka',
  mine: 'sinä',
  away: 'poissa',
  week: 'Viikko',
  weekShort: 'Vk',
  notFound: 'Listaa ei ole olemassa (tai se on poistettu).',
  home: 'Luo uusi lista',
  loading: 'Ladataan…',
  stored: 'Vain nimet ja päivämäärät tallennetaan.',
  err_name_empty: 'Anna nimi.',
  err_name_too_long: 'Nimi voi olla enintään 15 merkkiä.',
  err_name_chars:
    'Käytä vain kirjaimia (pohjoismaiset kirjaimet käyvät); sanojen välissä yksi väli tai tavuviiva.',
  err_name_taken: 'Nimi on jo listalla.',
  err_range_order: 'Loppupäivä on ennen alkupäivää.',
  err_range_in_past: 'Loma on jo päättynyt.',
  err_range_too_far: 'Loma voi alkaa enintään 18 kuukauden päästä.',
  err_range_overlap: 'Tämä menee päällekkäin aiemman lomasi kanssa.',
  err_too_many_ranges: 'Liian monta lomajaksoa yhdelle henkilölle.',
  err_too_many_people: 'Lista on täynnä.',
  err_archived: 'Lista on arkistoitu ja vain luettavissa.',
  err_rate_limited: 'Listoja luodaan nyt liikaa. Yritä myöhemmin uudelleen.',
  err_not_found: 'Ei löytynyt.',
  err_internal: 'Jokin meni pieleen. Yritä uudelleen.',
};

const sv: Dict = {
  tagline:
    'Gemensam semesterlista för ditt team. Ingen registrering: dela länken så lägger alla in sina egna datum.',
  listTitle: 'Semesterlista',
  heroTitle: 'Planera teamets semestrar tillsammans',
  howTitle: 'Så fungerar det',
  step1Title: 'Skapa en lista',
  step1: 'Med ett klick får du en ny lista med en egen privat länk.',
  step2Title: 'Dela länken',
  step2: 'Skicka den till ditt team, till exempel i teamets chatt. Länken är den enda nyckeln till listan.',
  step3Title: 'Lägg in dina datum',
  step3: 'Alla lägger in sitt eget namn och sina semesterdatum. Tidslinjen visar vem som är borta och när.',
  featNoSignup: 'Inga konton eller lösenord',
  featOverlap: 'Se direkt hur många som är lediga varje dag',
  featPrivacy: 'Endast namn och datum sparas, och gamla listor raderas automatiskt',
  privacyLink: 'Dataskyddsbeskrivning',
  create: 'Skapa lista',
  shareTitle: 'Din lista är klar',
  shareWarn:
    'Alla som har länken kan se och ändra listan. Dela den bara med ditt team. Listan blir skrivskyddad ett år efter att den skapades, eller en månad efter den sista semestern om det är senare.',
  copy: 'Kopiera länk',
  copied: 'Kopierad!',
  open: 'Öppna listan',
  archivedBanner: 'Listan är arkiverad och skrivskyddad.',
  addPerson: 'Lägg till dig själv',
  nameLabel: 'Namn',
  nameHint: 'Endast bokstäver, högst 15 tecken.',
  add: 'Lägg till',
  noPeople: 'Ingen har lagt in sin semester än.',
  addRange: 'Lägg till semester',
  dates: 'Semesterdatum',
  remove: 'Ta bort',
  removePerson: 'Ta bort person',
  confirmOthers: 'Den här posten skapades inte i den här webbläsaren. Ändra ändå?',
  cancel: 'Avbryt',
  proceed: 'Fortsätt',
  mine: 'du',
  away: 'borta',
  week: 'Vecka',
  weekShort: 'V',
  notFound: 'Listan finns inte (eller har raderats).',
  home: 'Skapa en ny lista',
  loading: 'Laddar…',
  stored: 'Endast namn och datum sparas.',
  err_name_empty: 'Ange ett namn.',
  err_name_too_long: 'Namnet får vara högst 15 tecken.',
  err_name_chars:
    'Använd endast bokstäver (nordiska bokstäver går bra), med enstaka mellanslag eller bindestreck emellan.',
  err_name_taken: 'Namnet finns redan i listan.',
  err_range_order: 'Slutdatumet är före startdatumet.',
  err_range_in_past: 'Semestern har redan tagit slut.',
  err_range_too_far: 'Semestern kan börja högst 18 månader framåt.',
  err_range_overlap: 'Det här överlappar en av dina befintliga semestrar.',
  err_too_many_ranges: 'För många semesterperioder för en person.',
  err_too_many_people: 'Listan är full.',
  err_archived: 'Listan är arkiverad och skrivskyddad.',
  err_rate_limited: 'För många listor skapas just nu. Försök igen senare.',
  err_not_found: 'Hittades inte.',
  err_internal: 'Något gick fel. Försök igen.',
};

const dicts: Record<string, Dict> = { en, fi, sv };

export function detectLang(): string {
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l.slice(0, 2).toLowerCase();
    if (code in dicts) return code;
  }
  return 'en';
}

export const lang = detectLang();
/** Full locale for date widgets: Nordic conventions (Monday first, day-month order) for English too. */
export const locale = { en: 'en-GB', fi: 'fi-FI', sv: 'sv-SE' }[lang] ?? 'en-GB';
const dict = dicts[lang];
if (typeof document !== 'undefined') document.documentElement.lang = lang;

export function t(key: keyof Dict): string {
  return dict[key];
}

export function tError(code: string): string {
  const k = `err_${code}` as keyof Dict;
  return k in dict ? dict[k] : dict.err_internal;
}
