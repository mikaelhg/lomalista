const en = {
  tagline: 'Shared vacation lists for your team. No sign-up: share the link and everyone adds their own dates.',
  createTitle: 'Create a vacation list',
  seasonStart: 'Season starts',
  seasonEnd: 'Season ends',
  create: 'Create list',
  shareTitle: 'Your list is ready',
  shareWarn: 'Anyone with this link can view and edit the list. Share it only with your team. The list becomes read-only two weeks after the season ends.',
  copy: 'Copy link',
  copied: 'Copied!',
  open: 'Open the list',
  archivedBanner: 'This season is over. The list is archived and read-only.',
  addPerson: 'Add yourself',
  nameLabel: 'Name',
  nameHint: 'Letters only, up to 15 characters.',
  add: 'Add',
  noPeople: 'Nobody has added their vacation yet.',
  addRange: 'Add vacation',
  from: 'From',
  to: 'To',
  remove: 'Remove',
  removePerson: 'Remove person',
  confirmOthers: 'This entry was not created in this browser. Remove it anyway?',
  mine: 'you',
  away: 'away',
  week: 'Week',
  notFound: 'This list does not exist (or has been deleted).',
  home: 'Create a new list',
  loading: 'Loading…',
  stored: 'Only names and dates are stored.',
  err_name_empty: 'Enter a name.',
  err_name_too_long: 'The name can be at most 15 characters.',
  err_name_chars: 'Use only letters (Nordic letters are fine), with single spaces or hyphens between.',
  err_name_taken: 'That name is already on the list.',
  err_range_order: 'The end date is before the start date.',
  err_range_outside_season: 'The dates must be within the season.',
  err_range_overlap: 'This overlaps one of your existing vacations.',
  err_too_many_ranges: 'Too many vacation periods for one person.',
  err_too_many_people: 'This list is full.',
  err_season_order: 'The season must end after it starts.',
  err_season_too_long: 'The season can be at most one year.',
  err_season_in_past: 'That season is already over.',
  err_archived: 'This list is archived and read-only.',
  err_rate_limited: 'Too many lists created right now. Try again later.',
  err_not_found: 'Not found.',
  err_internal: 'Something went wrong. Try again.',
};

export type Dict = typeof en;

const fi: Dict = {
  tagline: 'Yhteinen lomalista tiimille. Ei rekisteröitymistä: jaa linkki ja jokainen lisää omat päivänsä.',
  createTitle: 'Luo lomalista',
  seasonStart: 'Kausi alkaa',
  seasonEnd: 'Kausi päättyy',
  create: 'Luo lista',
  shareTitle: 'Listasi on valmis',
  shareWarn: 'Kuka tahansa linkin tietävä voi nähdä ja muokata listaa. Jaa se vain tiimillesi. Lista muuttuu vain luettavaksi kaksi viikkoa kauden päättymisen jälkeen.',
  copy: 'Kopioi linkki',
  copied: 'Kopioitu!',
  open: 'Avaa lista',
  archivedBanner: 'Kausi on päättynyt. Lista on arkistoitu ja vain luettavissa.',
  addPerson: 'Lisää itsesi',
  nameLabel: 'Nimi',
  nameHint: 'Vain kirjaimia, enintään 15 merkkiä.',
  add: 'Lisää',
  noPeople: 'Kukaan ei ole vielä lisännyt lomaansa.',
  addRange: 'Lisää loma',
  from: 'Alkaa',
  to: 'Päättyy',
  remove: 'Poista',
  removePerson: 'Poista henkilö',
  confirmOthers: 'Tätä merkintää ei ole luotu tässä selaimessa. Poistetaanko silti?',
  mine: 'sinä',
  away: 'poissa',
  week: 'Viikko',
  notFound: 'Listaa ei ole olemassa (tai se on poistettu).',
  home: 'Luo uusi lista',
  loading: 'Ladataan…',
  stored: 'Vain nimet ja päivämäärät tallennetaan.',
  err_name_empty: 'Anna nimi.',
  err_name_too_long: 'Nimi voi olla enintään 15 merkkiä.',
  err_name_chars: 'Käytä vain kirjaimia (pohjoismaiset kirjaimet käyvät); sanojen välissä yksi väli tai tavuviiva.',
  err_name_taken: 'Nimi on jo listalla.',
  err_range_order: 'Loppupäivä on ennen alkupäivää.',
  err_range_outside_season: 'Päivien on oltava kauden sisällä.',
  err_range_overlap: 'Tämä menee päällekkäin aiemman lomasi kanssa.',
  err_too_many_ranges: 'Liian monta lomajaksoa yhdelle henkilölle.',
  err_too_many_people: 'Lista on täynnä.',
  err_season_order: 'Kauden on päätyttävä alkamisen jälkeen.',
  err_season_too_long: 'Kausi voi olla enintään vuoden.',
  err_season_in_past: 'Kausi on jo ohi.',
  err_archived: 'Lista on arkistoitu ja vain luettavissa.',
  err_rate_limited: 'Listoja luodaan nyt liikaa. Yritä myöhemmin uudelleen.',
  err_not_found: 'Ei löytynyt.',
  err_internal: 'Jokin meni pieleen. Yritä uudelleen.',
};

const sv: Dict = {
  tagline: 'Gemensam semesterlista för ditt team. Ingen registrering: dela länken så lägger alla in sina egna datum.',
  createTitle: 'Skapa en semesterlista',
  seasonStart: 'Säsongen börjar',
  seasonEnd: 'Säsongen slutar',
  create: 'Skapa lista',
  shareTitle: 'Din lista är klar',
  shareWarn: 'Alla som har länken kan se och ändra listan. Dela den bara med ditt team. Listan blir skrivskyddad två veckor efter säsongens slut.',
  copy: 'Kopiera länk',
  copied: 'Kopierad!',
  open: 'Öppna listan',
  archivedBanner: 'Säsongen är slut. Listan är arkiverad och skrivskyddad.',
  addPerson: 'Lägg till dig själv',
  nameLabel: 'Namn',
  nameHint: 'Endast bokstäver, högst 15 tecken.',
  add: 'Lägg till',
  noPeople: 'Ingen har lagt in sin semester än.',
  addRange: 'Lägg till semester',
  from: 'Från',
  to: 'Till',
  remove: 'Ta bort',
  removePerson: 'Ta bort person',
  confirmOthers: 'Den här posten skapades inte i den här webbläsaren. Ta bort ändå?',
  mine: 'du',
  away: 'borta',
  week: 'Vecka',
  notFound: 'Listan finns inte (eller har raderats).',
  home: 'Skapa en ny lista',
  loading: 'Laddar…',
  stored: 'Endast namn och datum sparas.',
  err_name_empty: 'Ange ett namn.',
  err_name_too_long: 'Namnet får vara högst 15 tecken.',
  err_name_chars: 'Använd endast bokstäver (nordiska bokstäver går bra), med enstaka mellanslag eller bindestreck emellan.',
  err_name_taken: 'Namnet finns redan i listan.',
  err_range_order: 'Slutdatumet är före startdatumet.',
  err_range_outside_season: 'Datumen måste ligga inom säsongen.',
  err_range_overlap: 'Det här överlappar en av dina befintliga semestrar.',
  err_too_many_ranges: 'För många semesterperioder för en person.',
  err_too_many_people: 'Listan är full.',
  err_season_order: 'Säsongen måste sluta efter att den börjar.',
  err_season_too_long: 'Säsongen får vara högst ett år.',
  err_season_in_past: 'Den säsongen är redan slut.',
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
const dict = dicts[lang];
if (typeof document !== 'undefined') document.documentElement.lang = lang;

export function t(key: keyof Dict): string {
  return dict[key];
}

export function tError(code: string): string {
  const k = `err_${code}` as keyof Dict;
  return k in dict ? dict[k] : dict.err_internal;
}
