export const CHANGELOG = [
  {
    version: '7.1',
    date: '2026-05-13',
    changes: [
      'Tutorial runda 1: jeśli timer dobiegnie do 0 bez wystawionych kart, gra automatycznie wystawia napastnika i obrońcę z ręki gracza, a następnie kończy turę — gracz nie może już pominąć obowiązkowego wystawienia',
    ],
  },
  {
    version: '7.0',
    date: '2026-05-13',
    changes: [
      'Anatomia karty: popup używa teraz prawdziwej karty HUGO z awatarem PNG (tak jak w składzie i meczu)',
      'Tutorial: naprawiono bug rundy 10 — mecz nie kończył się z powodu przedwczesnego return w obsłudze kontuzji',
      'Tutorial: misje zablokowane do czasu ukończenia pierwszego meczu',
      'Zawodnicy: ikona 🩹 na kartach kontuzjowanych w siatce, czerwony baner z czasem powrotu w szczegółach',
      'Start meczu: blokada jeśli którykolwiek z 14 zawodników w składzie jest kontuzjowany — wymagany zdrowy skład 11+3',
      'Liga: popup ostrzegający o kontuzjowanych zawodnikach z opcją zmiany składu',
      'Floating dock: Skład i Market zablokowane dla nowych graczy',
      'Naprawiono deadlock AI w niestandardowych rundach (coalAnim + effects disabled)',
      'Kafelki Liga/Trening mają teraz równą wysokość',
      'Nagrody za trening wyświetlają emoji monety 🪙',
    ],
  },
  {
    version: '6.6',
    date: '2026-05-13',
    changes: [
      'Naprawiono deadlock w rundzie 6: karta specjalna nie pojawiała się gdy wyłączone były efekty wizualne (goalAnim nigdy nie był kasowany) — dotyczyło wszystkich typów meczów',
      'Tutorial match: karta specjalna pomijana w rundzie 6 (zapobiega blokadom niezależnie od ustawień)',
    ],
  },
  {
    version: '6.5',
    date: '2026-05-13',
    changes: [
      'Onboarding: popup "Anatomia karty" przed pierwszym meczem — karta HUGO z 4 elementami do odkrycia (pozycja, ATK, DEF, umiejętność)',
      'Onboarding: Market zablokowany dla nowych graczy do czasu ukończenia tutorialu',
      'Tutorial match nie liczy się do misji dziennych ani tygodniowych',
    ],
  },
  {
    version: '6.4',
    date: '2026-05-13',
    changes: [
      'Onboarding: welcome popup dla nowych graczy z wyjaśnieniem 3 zasad i przyciskiem "Zacznij trening!"',
      'Onboarding: LIGA, ZAWODNICY i Trening PRO zablokowane dla nowych graczy — odblokowują się po ukończeniu tutorialu',
      'Tutorial match: pierwszy mecz amatorski jest oskryptowany — gracz strzela gola (runda 2), rywal odpowiada (runda 3), gracz wygrywa 3:1 po 5 rundach',
      'Tutorial match: runda 1 wymaga wystawienia napastnika i obrońcy przed zakończeniem tury',
      'Tutorial match: 10-krokowy pasek z podpowiedziami tłumaczy ATK/DEF, umiejętności i rozliczenie goli w czasie rzeczywistym',
    ],
  },
  {
    version: '6.3',
    date: '2026-05-13',
    changes: [
      'Dane kart przeniesione do JSON (cards.json, special-cards.json, starter-cards.json) — łatwiejsza edycja i balansowanie bez dotykania kodu',
      'Desktop — naprawiono przycinanie ramki gry na małych rozdzielczościach i fullscreenie: ramka skaluje się proporcjonalnie do okna zamiast wystawać poza ekran',
    ],
  },
  {
    version: '6.2',
    date: '2026-05-12',
    changes: [
      'Banner instalacji PWA: pojawia się na mobile dla użytkowników przeglądarki z instrukcją dodania do ekranu głównego',
      'Instrukcje instalacji dopasowane do przeglądarki: Safari (przycisk Udostępnij), Chrome iOS (menu ⋯), Android Chrome (natywny dialog)',
      'Banner ukryty podczas meczu — nie zakłóca rozgrywki',
      'Licznik dnia gry w topbarze obok nazwy gracza — podstawa dla systemu daily rewards',
      'Popup "Nagrody dzienne" z siatką 7 dni (podgląd nagród) — aktywacja wkrótce',
      'Limit nazwy gracza zmniejszony z 16 do 10 znaków (popup startowy i Ustawienia)',
      'Desktop — naprawiono scrollowanie w Składzie: footer z przyciskami zawsze widoczny bez przewijania',
    ],
  },
  {
    version: '6.1',
    date: '2026-05-12',
    changes: [
      'Skład: redesign UX — zakładki FORMACJA / ZAWODNICY zamiast jednoczesnego widoku',
      'Skład: kliknięcie slotu otwiera modal z listą pasujących zawodników do przypisania',
      'Skład: kliknięcie + przy zawodniku automatycznie przypisuje go do wolnego slotu (lub popup wyboru gdy kilka wolnych)',
      'Skład: rezerwa jako pionowy panel po prawej stronie boiska — zawsze widoczna bez scrollowania',
      'Skład: blokada duplikatów — ten sam zawodnik nie może być przypisany do dwóch slotów',
      'Przyciski powrotu: ujednolicony wygląd SVG we wszystkich ekranach',
      'Panel monet i diamentów: ujednolicony styl (Inter 800, ciemne tło) na wszystkich ekranach',
      'Statystyki kart: ujednolicony format ×ATK / ◈DEF we wszystkich widokach',
    ],
  },
  {
    version: '6.0',
    date: '2026-05-11',
    changes: [
      'Emoji: kompleksowa zamiana emoji na symbole Unicode we wszystkich ekranach gry (MainMenu, Market, League, PostMatch, Players, Settings, komponenty)',
      'Ekran meczu: ikony drużyn w scoreboard — tarcze SVG zamiast tekstu AI/TY',
      'Ekran meczu: sektory ataku/obrony — więcej wewnętrznego paddingu (8px) zapobiegającego nakładaniu kart na obwódkę strefy',
      'Ekran ligi: panel "Rozpocznij mecz" zawsze widoczny bez scrollowania (naprawiono layout na desktop/web)',
    ],
  },
  {
    version: '5.9',
    date: '2026-05-11',
    changes: [
      'Ekran meczu: tablica wyników wyższa (68px) z wyraźnym separatorem od boiska',
      'Ekran meczu: tło boiska z CSS (naprzemienne paski trawy) — usunięto pitch.jpg',
      'Ekran meczu: naprawiono start gry — gracz otrzymuje 3 karty na ręce (wcześniej bywało 2 przy brakującym typie)',
      'Ekran meczu: liczba kart w talii widoczna również gdy ręka jest pusta',
      'Ekran meczu: avatar bramkarza obniżony — widoczne oczy i twarz (object-position 38%)',
      'Czcionki: zamiana Outfit → Inter (body), dodano Lilita One; wszystkie pliki CSS zaktualizowane',
      'Czcionki: nazwy kart — Bangers uppercase; pozycja — Inter Bold; stats — Bangers; małe wartości — Inter Bold',
      'Czcionki: CTA (ZAKOŃCZ TURĘ, NOWA RĘKA) — Bangers; tura/czas — Inter Bold; opisy — Inter SemiBold',
      'Emoji: zamiana większości emoji na symbole Unicode (●, ◎, ▶, ☰, ★, ↺, ≡); zachowano ⚽, 💎, 🧤',
      'Ekran meczu: ikony drużyn w scoreboard — stylowane kółka z tekstem AI/TY zamiast emoji',
    ],
  },
  {
    version: '5.8',
    date: '2026-05-11',
    changes: [
      'Ekran meczu: naprawiono widoczność kart bramkarzy (przywrócono flex:1 zamiast flex-shrink:0)',
      'Ekran meczu: panele ATK/DEF skrócone o 50% wysokości (100px→50px) i poszerzone o 20% (90px→108px) — stała wielkość na wszystkich urządzeniach',
      'Ekran meczu: czcionka liczb w panelach ATK/DEF zmniejszona do 22px dopasowana do niższego panelu',
      'Ekran meczu: strefa ataku i obrony ma stałą minimalną wysokość (110px) niezależnie od urządzenia',
    ],
  },
  {
    version: '5.7',
    date: '2026-05-11',
    changes: [
      'Ekran meczu: zielona murawa CSS z poziomymi paskami i ulepszonym środkowym kręgiem',
      'Ekran meczu: kolorowe obwódki stref — pomarańczowa (ATK przeciwnika), niebieska (DEF przeciwnika), zielona (Twoja obrona), złota (Twój atak)',
      'Ekran meczu: etykiety stref w dopasowanych kolorach, większy wynik w tablicy (40px)',
      'Ekran meczu: nowy action bar — TWOJA TURA + timer MM:SS + zielony pasek, trzy przyciski: 🚩 / NOWA RĘKA / ZAKOŃCZ TURĘ',
      'Market: pełny redesign — baner reklamowy z ad-reward.png, siatka paczek 2 kolumny, sekcja Ofert Specjalnych',
      'Dev panel: +10 diamentów i awans w lidze (Bronze→Silver→…→Diamond z popupem zmiany)',
    ],
  },
  {
    version: '5.6',
    date: '2026-05-11',
    changes: [
      'Market: siatka paczek 2 kolumny — większe karty, obraz paczki wyśrodkowany z zachowaniem proporcji',
      'Market: animacja otwierania paczek — prawdziwy 3D flip (rotateY) kolejno per karta, legendarny flash ekranu',
      'Market: pakiet startowy pełna wizualizacja — złoty banner z nagrodami, cena, przycisk WKRÓTCE (oczekuje na system płatności)',
      'Market: przycisk klejnotów wyraźnie wtórny ("lub 💎X") — mniej przypadkowych zakupów',
      'Changelog: ukryty panel deweloperski (hasło) z przyciskami: +5k monet, wszyscy zawodnicy, ukończ misje dzienne/tygodniowe, +10 diamentów, awans w lidze',
    ],
  },
  {
    version: '5.5',
    date: '2026-05-11',
    changes: [
      'Nawigacja: floating dock (SKŁAD / MENU / MARKET) na wszystkich ekranach poza meczem',
      'Sekcja Zawodników: redesign — siatka 3 kolumny, pasek statystyk, kolorowe taby pozycji, jeden przycisk sortowania, efekt poświaty w podglądzie karty',
      'Modal zawodnika w meczu: redesign — awatar po lewej, kolorowe odznaki pozycji, sekcja zdolności z ikoną i nazwą w jednym wierszu',
      'Rzut żetonem: pełny redesign — stadionowe tło, żeton 140px z obracającym się złotym pierścieniem, animowany baner wyniku',
      'Mechanika goli: wzajemne anulowanie — jeśli obie strony strzelają w tej samej rundzie, żaden gol nie pada',
      'iOS: dodano apple-touch-icon.png bez sufiksu (iOS default lookup) — poprawia wyświetlanie ikony po dodaniu do ekranu głównego',
    ],
  },
  {
    version: '5.4',
    date: '2026-05-11',
    changes: [
      'Balans ekonomii: liga wygrana 280→190🪙, remis 100→70🪙, przegrana 50→65🪙 (wolniejszy mid game, mniej kary za porażkę)',
      'Trening Amator: wygrana 30→40🪙, przegrana 4→5🪙',
      'Trening PRO: przegrana 18→25🪙',
      'Mega Paczka: cena 1200→950🪙, 6→5💎',
      'Misje tygodniowe "Zagraj 15/25 meczów": nagrody 400→600🪙 i 700→1100🪙',
    ],
  },
  {
    version: '5.3',
    date: '2026-05-11',
    changes: [
      'Sklep paczek: siatka 2 kolumny, Premium full-width na górze; monety = duży przycisk główny, klejnoty = mały wtórny "lub 💎X" — mniej przypadkowych zakupów',
      'Cenzura nazwy: filtr działa też przy zmianie nazwy z poziomu Ustawień',
      'Inflacja kart: ceny kart w sklepie i wartość sprzedaży ×1.7 (proporcjonalnie do cen paczek)',
      'Nagrody za mecze: liga wygrana 200→280🪙 (+do 60 bonus), PRO wygrana 100→150🪙, Amator wygrana 15→30🪙',
      'Nagrody za misje dzienne ×1.5 (np. wygraj 1 mecz: 80🪙, wygraj 3: 320🪙)',
      'Misje tygodniowe: twardsze targety (7-12 wygranych, 30-50 goli itp.), 6 misji/tydzień zamiast 4 — ostatnie 2 zablokowane do odblokowania po ukończeniu pierwszych 4',
      'Nagroda za pierwszą wygraną: 200→350🪙',
    ],
  },
  {
    version: '5.2',
    date: '2026-05-10',
    changes: [
      'Filtr nazwy gracza: cenzura wulgaryzmów (PL+EN), losowa nazwa przy pustym polu',
      'Darmowa paczka: cooldown zmieniony z 45 min na 12 h; nagroda 50→30 monet',
      'Balans sklepu: wyższe ceny paczek, nowa Mega Paczka (5 kart), Premium 5💎→12💎 (5 kart), możliwość płacenia klejnotami za paczki monetowe',
      'Sprzedaż kart: zwrot 60→80 monet',
      'Sezon (Battle Pass): 40 poziomów, widok wyróżnionych nagród — kity, herby, kontrakty, karty specjalne na poz. 20 i 40',
    ],
  },
  {
    version: '5.1',
    date: '2026-05-10',
    changes: [
      'Misje tygodniowe: 4 misje resetowane co poniedziałek, jedna nagradza diamentami 💎',
      'Powiadomienia: przycisk "Wyczyść wszystkie" w panelu',
      'Sezonowe (Battle Pass): podgląd sezonu free/premium — wkrótce',
      'Tablica wyników: pasek 5+5 segmentów zastępuje etykietę połowy, runda widoczna jako R3/10',
    ],
  },
  {
    version: '5.0.2',
    date: '2026-05-10',
    changes: [
      'Naprawiono: czarny ekran przy uruchamianiu meczu — handleEndTurn używany przed deklaracją (TDZ)',
    ],
  },
  {
    version: '5.0.1',
    date: '2026-05-10',
    changes: [
      'Naprawiono: czarny ekran przy uruchamianiu meczu po aktualizacji v5.0 (błąd timera tury)',
    ],
  },
  {
    version: '5.0',
    date: '2026-05-10',
    changes: [
      'Podział meczu: 1. połowa (rundy 1–5), 2. połowa (6–10), dogrywka (11+) — widoczne w tablicy wyników',
      'Zapowiedzi zdarzeń: w linii środkowej widać "Dobierasz kartę po rundzie" i "Karta specjalna po rundzie!"',
      'Licznik czasu: 45 sekund na ruch — tura kończy się automatycznie przy upływie czasu',
      'Naprawiono: zniszczona karta nie może strzelić gola',
      'Limit cofnięcia: ten sam zawodnik może wrócić na rękę max 2 razy na rundę',
    ],
  },
  {
    version: '4.9',
    date: '2026-05-09',
    changes: [
      'Darmowa paczka: otwieranie przez animowany overlay (jak płatna paczka)',
      'Reklama: nagroda pokazywana w dedykowanym okienku zamiast powiadomienia',
      'Naprawiono: baner "Obejrzyj reklamę" niewidoczny na PC — zmieniono layout na grid',
    ],
  },
  {
    version: '4.8',
    date: '2026-05-09',
    changes: [
      'Naprawiono: baner "Obejrzyj reklamę" niewidoczny na PC (błąd stacking context w przeglądarce desktopowej)',
    ],
  },
  {
    version: '4.7',
    date: '2026-05-09',
    changes: [
      'Karta specjalna: nowy wygląd modala — ciemne tło, unoszący się obrócony fioletowy kafelek z błyskawicami, badge z nazwą, zielony przycisk',
    ],
  },
  {
    version: '4.6',
    date: '2026-05-09',
    changes: [
      'Mobile: panele bramkarzy kompaktowe na telefonach (≤480px) — nie zasłaniają kart na boisku',
      'Desktop: brak zmian w wyglądzie',
    ],
  },
  {
    version: '4.5',
    date: '2026-05-09',
    changes: [
      'Jedno tło stadionu (bg.jpg) — usunięto podwójne gradienty CSS',
      'bg.jpg aktywne też w Markecie, Zawodnikach i Ustawieniach',
      'Kafelek LIGA: opis zmieniony na "Zagraj mecz rankingowy PvP!"',
      'Stopka: biały napis, dodano "Powered by AppHill.Agency"',
      'Misje: ciemnozielone tło, odróżnia się od niebieskich kafelków nawigacji',
      'Drobny odstęp powiększony między logo a paskiem bilansu',
    ],
  },
  {
    version: '4.4',
    date: '2026-05-09',
    changes: [
      'Główne menu: kafelek "MECZ LIGOWY" przemianowany na "LIGA"',
      'Tło stadionu (bg.jpg) aktywne na całym menu — widoczne przez ciemny gradient',
      'Kafelki LIGA i TRENING: grafiki zawodników z players_bg.png widoczne',
    ],
  },
  {
    version: '4.3',
    date: '2026-05-09',
    changes: [
      'Logo: ograniczono wysokość (max 90px) — menu nie wymaga już scrollowania',
      'Bramkarz: skrót zmieniony z B na G, kolor zmieniony na pomarańczowy (odróżnialny od obrońców)',
      'Bramkarz na ławce: wyświetla statystykę DEF zamiast ATK (które wynosiło 0)',
    ],
  },
  {
    version: '4.2',
    date: '2026-05-09',
    changes: [
      'Główne menu: tło stadionu pokrywa cały ekran (nie tylko górny panel)',
      'Logo pomniejszone o 15%, mniejsze odstępy między elementami nagłówka',
      'Niepełny skład: popup "Uzupełnij skład" z listą brakujących pozycji, przycisk przenosi do Składu',
      'Walidacja składu: wymaga wszystkich 11 pozycji w polu ORAZ 3 miejsc na ławce',
    ],
  },
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
