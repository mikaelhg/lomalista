/**
 * Privacy policy (tietosuojaseloste) texts, as required by the GDPR (art. 13) and the Finnish
 * Data Protection Act (1050/2018). Keep them in sync with what the app actually stores
 * (see AGENTS.md) and bump `updated` whenever the substance changes.
 */

/** The data controller (rekisterinpitäjä). Fill in before deploying. */
export const controller = {
  name: '[ylläpitäjän nimi]',
  contact: '[sähköpostiosoite]',
};

export const updated = '2026-10-24';

export interface Policy {
  title: string;
  updatedLabel: string;
  controllerTitle: string;
  controllerContact: string;
  sections: { title: string; body: string[] }[];
}

const fi: Policy = {
  title: 'Tietosuojaseloste',
  updatedLabel: 'Päivitetty',
  controllerTitle: 'Rekisterinpitäjä',
  controllerContact: 'Yhteydenotot',
  sections: [
    {
      title: 'Mitä tietoja käsittelemme',
      body: [
        'Listalle itse kirjoittamasi nimi (vain kirjaimia, enintään 15 merkkiä) sekä lomiesi alku- ja loppupäivät. Lisäksi tallennamme päivän, jolloin lista luotiin.',
        'Emme kysy sähköpostiosoitetta, puhelinnumeroa tai muita yhteystietoja. Suosittelemme käyttämään etunimeä tai lempinimeä.',
      ],
    },
    {
      title: 'Mihin tietoja käytetään',
      body: [
        'Ainoastaan siihen, että tiimisi voi suunnitella lomat yhdessä. Emme käytä tietoja markkinointiin tai profilointiin emmekä kerää käyttötilastoja.',
        'Käsittelyn peruste on oikeutettu etu (EU:n tietosuoja-asetuksen 6 artiklan 1 kohdan f alakohta): palvelun tarjoaminen sinulle ja tiimillesi.',
      ],
    },
    {
      title: 'Kuka tiedot näkee',
      body: [
        'Kaikki, joilla on listan linkki. Linkki on satunnainen eikä sitä voi arvata, joten jaa se vain tiimillesi.',
        'Emme luovuta tietoja kolmansille osapuolille emmekä siirrä niitä EU:n ja ETA:n ulkopuolelle.',
      ],
    },
    {
      title: 'Evästeet ja lokit',
      body: [
        'Palvelu ei käytä evästeitä eikä seurantaa. Selaimesi muistaa omalla laitteellasi, mitkä merkinnät lisäsit itse, jotta ne voidaan korostaa. Tämä tieto ei lähde laitteeltasi.',
        'Palvelin ei tallenna IP-osoitteita eikä tietoa siitä, mitä listoja avataan.',
      ],
    },
    {
      title: 'Kuinka kauan tietoja säilytetään',
      body: [
        'Lista muuttuu vain luettavaksi, kun sen luomisesta on kulunut 12 kuukautta tai viimeisen loman päättymisestä kuukausi, sen mukaan kumpi on myöhemmin. Vuoden kuluttua siitä lista poistetaan pysyvästi.',
      ],
    },
    {
      title: 'Oikeutesi',
      body: [
        'Voit itse poistaa nimesi ja lomasi listalta niin kauan kuin lista on muokattavissa.',
        'Sinulla on oikeus tarkastaa tietosi, oikaista ne, pyytää niiden poistamista ja vastustaa niiden käsittelyä. Koska emme tiedä, kuka olet, kerro yhteydenotossa listan linkki ja nimi, jolla olet listalla.',
        'Voit tehdä valituksen tietosuojavaltuutetun toimistolle (tietosuoja.fi).',
      ],
    },
  ],
};

const en: Policy = {
  title: 'Privacy policy',
  updatedLabel: 'Updated',
  controllerTitle: 'Data controller',
  controllerContact: 'Contact',
  sections: [
    {
      title: 'What we process',
      body: [
        'The name you type in yourself (letters only, at most 15 characters) and the start and end dates of your vacations. We also store the day the list was created.',
        'We never ask for an email address, phone number or other contact details. We recommend using a first name or a nickname.',
      ],
    },
    {
      title: 'What it is used for',
      body: [
        'Only to let your team plan vacations together. We do not use the data for marketing or profiling, and we collect no usage statistics.',
        'The legal basis is legitimate interest (Article 6(1)(f) of the EU General Data Protection Regulation): providing the service to you and your team.',
      ],
    },
    {
      title: 'Who can see it',
      body: [
        'Everyone who has the link to the list. The link is random and cannot be guessed, so share it only with your team.',
        'We do not disclose the data to third parties or transfer it outside the EU and EEA.',
      ],
    },
    {
      title: 'Cookies and logs',
      body: [
        'The service uses no cookies and no tracking. Your browser remembers on your own device which entries you added, so they can be highlighted. This never leaves your device.',
        'The server does not record IP addresses or which lists are opened.',
      ],
    },
    {
      title: 'How long we keep it',
      body: [
        'A list becomes read-only 12 months after it was created or one month after its last vacation ends, whichever is later. A year after that, it is permanently deleted.',
      ],
    },
    {
      title: 'Your rights',
      body: [
        'You can remove your name and vacations from a list yourself for as long as it can be edited.',
        'You have the right to access, correct and erase your data and to object to its processing. As we do not know who you are, include the link to the list and the name you used when you contact us.',
        'You can lodge a complaint with the Office of the Data Protection Ombudsman in Finland (tietosuoja.fi).',
      ],
    },
  ],
};

const sv: Policy = {
  title: 'Dataskyddsbeskrivning',
  updatedLabel: 'Uppdaterad',
  controllerTitle: 'Personuppgiftsansvarig',
  controllerContact: 'Kontakt',
  sections: [
    {
      title: 'Vilka uppgifter vi behandlar',
      body: [
        'Namnet du själv skriver in (endast bokstäver, högst 15 tecken) och start- och slutdatum för dina semestrar. Vi sparar också dagen då listan skapades.',
        'Vi frågar aldrig efter e-postadress, telefonnummer eller andra kontaktuppgifter. Vi rekommenderar att du använder ett förnamn eller smeknamn.',
      ],
    },
    {
      title: 'Vad uppgifterna används till',
      body: [
        'Endast till att ditt team kan planera semestrarna tillsammans. Vi använder inte uppgifterna för marknadsföring eller profilering och samlar ingen användningsstatistik.',
        'Den rättsliga grunden är berättigat intresse (artikel 6.1 f i EU:s dataskyddsförordning): att tillhandahålla tjänsten åt dig och ditt team.',
      ],
    },
    {
      title: 'Vem som ser uppgifterna',
      body: [
        'Alla som har länken till listan. Länken är slumpmässig och kan inte gissas, så dela den bara med ditt team.',
        'Vi lämnar inte ut uppgifterna till tredje part och överför dem inte utanför EU och EES.',
      ],
    },
    {
      title: 'Kakor och loggar',
      body: [
        'Tjänsten använder inga kakor och ingen spårning. Din webbläsare kommer ihåg på din egen enhet vilka poster du själv lagt till, så att de kan markeras. Uppgiften lämnar aldrig din enhet.',
        'Servern sparar inte IP-adresser eller vilka listor som öppnas.',
      ],
    },
    {
      title: 'Hur länge uppgifterna sparas',
      body: [
        'En lista blir skrivskyddad 12 månader efter att den skapades eller en månad efter att den sista semestern slutat, beroende på vilket som infaller senare. Ett år därefter raderas listan permanent.',
      ],
    },
    {
      title: 'Dina rättigheter',
      body: [
        'Du kan själv ta bort ditt namn och dina semestrar från listan så länge den går att ändra.',
        'Du har rätt att få tillgång till, rätta och radera dina uppgifter samt att invända mot behandlingen. Eftersom vi inte vet vem du är, ange länken till listan och namnet du använt när du kontaktar oss.',
        'Du kan lämna in klagomål till dataombudsmannens byrå i Finland (tietosuoja.fi).',
      ],
    },
  ],
};

export const policies: Record<string, Policy> = { en, fi, sv };
