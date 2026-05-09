export const CHANGELOG = [
  {
    version: '4.1',
    date: '2026-05-09',
    changes: [
      'Główne menu: logo powiększone (82% szerokości ekranu)',
      'Usunięto emoji ⚽/🏋️ z kafelków MECZ LIGOWY i TRENING',
      'Kafelki misji wyrównane z siatką nawigacji (ten sam grid 3×2)',
      'Emoji i nazwa misji w tej samej linii, tej samej wielkości',
      'Separator między blokiem meczu a misjami i misjami a nawigacją',
      'Misje: ponad 3 — pojawia się kafelek "+X więcej" otwierający pełną listę',
    ],
  },
  {
    version: '4.0',
    date: '2026-05-09',
    changes: [
      'Naprawiono: pierwsze uruchomienie — pre-match pokazuje auto-przydzielony skład zamiast pustych slotów',
      'Naprawiono: nie można już rozpocząć meczu z niepełnym składem — przycisk GRAJ przekierowuje do Składu gdy brakuje bramkarza lub min. 4 zawodników',
    ],
  },
  {
    version: '3.9',
    date: '2026-05-09',
    changes: [
      'Główne menu: stadionowe tło z reflektorami, dwie duże karty MECZ LIGOWY / TRENING',
      'Wybór trybu treningu pojawia się bezpośrednio w kafelku — bez osobnego panelu',
      'Misje dzienne: poziome karty z paskiem postępu; automatycznie się zwijają gdy wszystkie ukończone',
      'Logo powiększone; liga i bilans tylko w pasku statystyk (usunięte z avatar baru)',
      'Nawigacja: SKŁAD, ZAWODNICY, MARKET, STADION, USTAWIENIA, JAK GRAĆ?',
    ],
  },
  {
    version: '3.8',
    date: '2026-05-09',
    changes: [
      'Ekran podsumowania: brak tła pod wynikiem meczu — czystszy wygląd',
      'Zawodnik meczu przeniesiony wyżej, bezpośrednio pod chipami nagród',
      'Rating pokazuje zmianę i aktualną wartość w nawiasie: ⭐ -15 (945)',
      'Przebudowa głównego menu — kompaktowy top bar, siatka nawigacji 3×2, przycisk Stadion (wkrótce)',
    ],
  },
  {
    version: '3.7',
    date: '2026-05-08',
    changes: [
      'Powiadomienia (dzwoneczek 🔔 w profilu): kontuzja zawodnika, powrót po kontuzji, dostępna darmowa paczka',
      'Kontuzjowani zawodnicy nie mogą być wybrani do składu — AUTO i ładowanie zapisanego składu automatycznie ich pomija',
      'Kontuzjowany zawodnik w formacji oznaczony 🩹 i czerwoną obwódką',
    ],
  },
  {
    version: '3.6',
    date: '2026-05-08',
    changes: [
      'Kliknięcie zawodnika w meczu pokazuje teraz deltę statystyk: zielona liczba = buff, czerwona = debuff względem wartości bazowej',
      'Naprawiono: statystyki zawodników nie mogą już spaść poniżej 0 (wcześniej możliwy ujemny ATK/DEF)',
    ],
  },
  {
    version: '3.5',
    date: '2026-05-08',
    changes: [
      'Mecz ligowy: przeciwnik ma teraz losowy skład każdą rozgrywkę (wcześniej często ten sam lineup)',
    ],
  },
  {
    version: '3.4',
    date: '2026-05-08',
    changes: [
      'Nathan: pasywka DETERMINACJA zmieniona z +3 DEF → +1 DEF co rundę',
    ],
  },
  {
    version: '3.3',
    date: '2026-05-08',
    changes: [
      'Jim: pasywka ROZPĘD zmieniona z +2 → +1 ATK całemu atakowi co rundę',
      'Naprawiono opis umiejętności Jima — teraz poprawnie wskazuje że buff dotyczy drużyny, nie Jima',
    ],
  },
  {
    version: '3.2',
    date: '2026-05-08',
    changes: [
      'JIM (legendarny bramkarz): DEF 5→8, pasywka zmieniona — co rundę cały atak drużyny +2 ATK',
    ],
  },
  {
    version: '3.1',
    date: '2026-05-08',
    changes: [
      'Wskaźnik aktywnej umiejętności na kartach w meczu: czarny kwadracik z ⚡ sygnalizuje że karta ma umiejętność do aktywowania',
      'Naprawiono: LIS (starter) — umiejętność PRZEBIEGŁOŚĆ działa teraz jako pasywka (+1 ATK co rundę automatycznie)',
    ],
  },
  {
    version: '3.0',
    date: '2026-05-08',
    changes: [
      'Podświetlenie przycisku TRENING dla nowych graczy — pulsująca zielona obwódka zamiast strzałki rozjeżdżającej layout',
      'Naprawiono: misje dzienne nie wyświetlały się dla nowych graczy przy pierwszym uruchomieniu',
      'Zmieniono nazwę "Misje dnia" na "Misje dzienne"',
    ],
  },
  {
    version: '2.9',
    date: '2026-05-08',
    changes: [
      'Sklep zawodników: 3 losowe karty do kupienia za stałą cenę (2× wartość sprzedaży), zmiana co 12 godzin',
    ],
  },
  {
    version: '2.8',
    date: '2026-05-08',
    changes: [
      'System awansu i spadku ligowego: Bronze → Srebrna → Złota → Platynowa → Diamentowa',
      'Popup z gratulacjami przy awansie i ostrzeżeniem przy spadku',
      'Pasek postępu w lidze: strefa spadkowa (czerwona) i strefa awansu (zielona)',
    ],
  },
  {
    version: '2.7',
    date: '2026-05-08',
    changes: [
      'Interaktywny tutorial: podpowiedzi na żywo podczas pierwszego meczu zamiast statycznych slajdów',
      'Strzałka onboardingowa w menu wskazuje Trening nowym graczom (znika po pierwszym meczu)',
      'Długie przytrzymanie przycisków w menu pokazuje opis funkcji (tooltips)',
      'Nagroda za pierwszą wygraną: +200 monet z animowanym okienkiem',
    ],
  },
  {
    version: '2.6',
    date: '2026-05-08',
    changes: [
      'Pierwsze 2 mecze w Treningu Amatorskim: przeciwnik gra startowymi kartami (Borek, Kowal itd.) — łatwiej wygrać na początku',
    ],
  },
  {
    version: '2.5',
    date: '2026-05-08',
    changes: [
      'Przed pierwszym meczem ligowym pojawia się popup z pytaniem czy gracz chce zagrać trening — mecze rankingowe są trwałe',
    ],
  },
  {
    version: '2.4',
    date: '2026-05-08',
    changes: [
      'Startowi bramkarze (Borek, Pawel) mają teraz słabsze statystyki niż bramkarze dostępni w paczkach (DEF 6 i 5)',
    ],
  },
  {
    version: '2.3',
    date: '2026-05-08',
    changes: [
      'Karty KAPITAN i WETERAN otrzymały imiona: COSTA i MUNOZ',
      'Maksymalny poziom ulepszenia (3/3) daje teraz dodatkowy boost statystyki (+3 dla rzadkich, +5 dla legendarnych)',
      'Karta na maks. poziomie ma animowaną świecącą obwódkę (niebiesko-fioletowo-zielona), wirujący efekt i symbol ✦',
      'SFX triumfalnego fanfaru przy osiągnięciu maks. poziomu',
      'Ekran Zawodnicy pokazuje preview bonusu maks. poziomu przy każdej karcie',
    ],
  },
  {
    version: '2.2',
    date: '2026-05-08',
    changes: [
      'Naprawiono: po animacji gola nie pojawia się już błędne okienko rzutu monetą przeciwnika',
    ],
  },
  {
    version: '2.1',
    date: '2026-05-08',
    changes: [
      'Balans kart: bramkarze o ~40% słabsi (DEF 17-25 → 10-15), mecze bardziej wyrównane',
      'Balans kart: obrońcy lekko osłabieni (DEF -1 do -10 w zależności od karty i pasywki)',
      'Balans kart: atakujący Hugo +1 ATK, Thiago +2 ATK, Bardo +4 ATK',
      'Silas: najdroższa karta w grze (2000🪙), nowy efekt Mastermind — wszyscy przeciwnicy -5 ATK i -5 DEF',
      'Claus (legendarny bramkarz): pasywka zmniejszona z +2 DEF do +1 DEF na rundę',
    ],
  },
  {
    version: '2.0',
    date: '2026-05-08',
    changes: [
      'Animacja gola kończy się w pełni zanim pojawi się rzut monetą lub karta specjalna',
      'Główne menu: mniejszy odstęp między logo a profilem gracza, logo w większym polu',
    ],
  },
  {
    version: '1.9',
    date: '2026-05-08',
    changes: [
      'Licznik rund pokazuje dynamiczny limit: R12/15 zamiast R12/10 gdy aktywny Zenit lub Harvy',
      'Zmieniony limit rund wyświetlany na czerwono z pulsowaniem',
    ],
  },
  {
    version: '1.8',
    date: '2026-05-08',
    changes: [
      'Karty w ręce zmniejszone o 15% (globalnie)',
      'Wskaźniki ATK/DEF przeniesione do nagłówka pola ręki (wyżej)',
      'Mobile: 3 karty w sektorze automatycznie się zmniejszają żeby nie były ucinane',
    ],
  },
  {
    version: '1.7',
    date: '2026-05-08',
    changes: [
      'Logo w głównym menu powiększone o 20%',
    ],
  },
  {
    version: '1.6',
    date: '2026-05-08',
    changes: [
      'Nowe karty: KAPITAN (pasywna: +2 ATK sąsiednim kartom co rundę) i WETERAN (immunitet na VAR)',
      'Kontuzje: 8% szans na kontuzję karty po meczu — kontuzjowani gracze niedostępni przez 2-4 godziny (widoczne w Składzie)',
      'Historia meczów: ostatnie 3 mecze dostępne z ekranu głównego (przycisk 📋 obok bilansu W/R/P)',
      'Efekt holograficzny na kartach Rzadkich i Legendarnych (tęczowy shimmer)',
      'Legendarne karty w paczkach: paczka Premium gwarantuje Legendarną, pozostałe 5% szans na Legendarną, 30% na Rzadką',
      'Specjalna animacja otwarcia paczki przy trafieniu Legendarnej karty',
      'Mobile: karty na boisku i w ręce są o 20% mniejsze (tylko telefon, web bez zmian)',
    ],
  },
  {
    version: '1.5',
    date: '2026-05-08',
    changes: [
      'Animacja gola: widoczna karta strzelca (imię w pigułce ⚽)',
      'Nowe tło animacji gola: radialne rozbłyski, zielony (Ty) lub czerwony (Przeciwnik) gradient',
      'Napis GOL! powiększony do 88px z kolorową poświatą, wynik w złotym kolorze',
      'Czas animacji gola wydłużony z 2,4 s do 3,8 s',
      'Ulepszone SFX gola: 5-nutowy fanfar + trzy fale okrzyków (Twój gol), niski akord żałobny (Gol przeciwnika)',
      'Naprawa na desktopie: modalne okna (np. ulepszenie zawodnika) nie wychodzą poza okno 650×900',
    ],
  },
  {
    version: '1.4',
    date: '2026-05-08',
    changes: [
      'Powiadomienia o umiejętnościach przeniesione na środek ekranu',
      'Rzut monetą: własny rzut (niebieski) i rzut przeciwnika (czerwony) mają osobne kolory i etykiety',
      'Panele bramkarzy kolorystycznie dopasowane do stron (niebieski = Ty, czerwony = Przeciwnik)',
      'Karta Felix niszczy teraz pochłoniete karty — zostają na polu jako zablokowane (efekt zszarzenia + 💀)',
      'Changelog — ta lista zmian',
    ],
  },
  {
    version: '1.3',
    date: '2026-05-08',
    changes: [
      'Naprawiono buff Rodrigo (+10 ATK z rzutu monetą — wcześniej nie działał)',
      'Rzut monetą AI pokazuje teraz nazwę umiejętności i opisy wyników',
      'Nazwy rywali ligowych: kreatywne nicke gracza (xLucas99, kingRafael itp.)',
      'Nazwy botów treningowych: AUTOBOT-9, ROBO-KEEPER, BOT-3000 itp.',
    ],
  },
  {
    version: '1.2',
    date: '2026-05-08',
    changes: [
      'Widoczność tury: baner "Tura przeciwnika" + przyciemniona ręka',
      'Toast z komunikatem przy każdym użyciu umiejętności',
      'Nowe zasady rollowania ławki: popup potwierdzenia, max 2 razy na mecz, −5 DEF do końca gry, dobierasz 4 karty bez pomijania tury',
      'Odliczanie do resetu misji dnia (HH:MM:SS)',
      'Naprawiono i zastąpiono niedziałające efekty kart',
    ],
  },
  {
    version: '1.1',
    date: '2026-05-07',
    changes: [
      'Tryby treningowe Amator (+12🪙) i Pro (+80🪙) z różnymi poziomami trudności',
      'System misji dnia — 3 misje resetowane o północy, nagrody w monetach',
      'Rebalans ekonomii: ceny paczek ~3× wyższe, darmowa paczka co 60 minut',
      'Przycisk Auto w Składzie dobiera najlepszych zawodników na dane pozycje',
      'Zwijane panele bramkarzy i ręki w meczu',
    ],
  },
  {
    version: '1.0',
    date: '2026-05-06',
    changes: [
      'Premiera GOAL TCG',
      'Tryb Meczu Ligowego i Treningu',
      'Budowanie składu 11 zawodników',
      'Market z paczkami kart',
      'System rankingowy i tabela ligowa',
      'PWA — instalacja na ekranie głównym',
    ],
  },
]
