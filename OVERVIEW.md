# GOAL TCG — Przegląd Projektu

> Dokument dla game designerów, grafików i osób dołączających do projektu.  
> Wersja techniczna: `CLAUDE.md`

---

## Czym jest GOAL TCG?

GOAL TCG to mobilna gra karciana osadzona w świecie piłki nożnej. Gracz wciela się w menedżera drużyny — zbiera karty zawodników, buduje skład i rozgrywa taktyczne mecze przeciwko AI. Gra działa jak aplikacja mobilna (PWA) i jest w całości po polsku.

Inspiracje: FIFA Ultimate Team (kolekcjonowanie kart), Clash Royale (szybkie taktyczne mecze), Pokemon TCG Pocket (otwieranie paczek).

---

## Główna pętla rozgrywki

```
Zbieraj karty → Buduj skład → Rozgrywaj mecze → Zdobywaj nagrody → Zbieraj karty
```

1. Gracz otwiera paczki i kupuje karty, budując kolekcję
2. Ustawia skład 11 zawodników (formacja w Kreatorze Składu)
3. Rozgrywa mecz (ok. 5–8 minut) przeciwko AI
4. Otrzymuje monety, awansuje w lidze, odbiera misje
5. Wydaje monety na kolejne paczki i ulepszenia kart

---

## Mecz — jak to działa?

Mecz trwa **10 rund**. W każdej rundzie obie strony (gracz i AI) mogą:
- Zagrać kartę na pozycję **Atak** (zwiększa szansę na gola)
- Zagrać kartę na pozycję **Obrona** (blokuje gole przeciwnika)
- Aktywować **umiejętność** jednej karty na boisku

Po każdej rundzie system oblicza szanse na gola — im więcej punktów ATK vs DEF przeciwnika, tym wyższa szansa. Jeśli obie drużyny strzelą w tej samej rundzie, **obydwa gole są anulowane** (mechanika wzajemnego bloku).

Mecz kończy wyższa suma goli. Przy równym wyniku — **remis**.

### Typy meczów
| Typ | Wpływ na ligę | Nagroda za wygraną |
|-----|-------------|-------------------|
| Liga | Tak (+25 pkt) | 190 monet |
| Trening Amator | Nie | 40 monet |
| Trening PRO | Nie | 150 monet |

---

## Karty zawodników

Każda karta to zawodnik z dwoma statystykami: **ATK** (atak) i **DEF** (obrona), pozycją i unikalną umiejętnością.

### Pozycje
- **Napastnik (A)** — wysokie ATK, niskie DEF
- **Pomocnik (M)** — zbalansowany ATK i DEF
- **Obrońca (D)** — niskie ATK, wysokie DEF
- **Bramkarz (G)** — tylko DEF, stoi w bramce przez cały mecz

### Rzadkości
| Rzadkość | Liczba kart | Charakterystyka |
|----------|------------|-----------------|
| Pospolita | 33 | Podstawowe statystyki i umiejętności |
| Rzadka | 29 | Lepsze staty, ulepszenie daje +3 bonus |
| Legendarna | 9 | Najwyższe staty, ulepszenie daje +5 bonus, efekt holograficzny |
| Startowa | 14 | Słabsze karty na start, nie do sprzedania |

### Umiejętności (3 typy)
- **Pasywna** — działa automatycznie każdą rundę bez żadnej akcji
- **Aktywna** — gracz decyduje kiedy użyć, zawsze daje efekt
- **Rzut monetą** — aktywacja losuje wynik: Piłka = efekt korzystny, Rękawica = efekt niekorzystny

Gra ma **75+ unikalnych umiejętności**: zwiększanie statystyk, usuwanie kart przeciwnika, buffy całego sektora, blokowanie tur, zamiana pozycji kart i wiele innych.

---

## Skład i formacja

Gracz ustawia **11 zawodników** w Kreatorze Składu:
- 1 Bramkarz
- 4 Obrońców
- 4 Pomocników
- 2 Napastników
- + 3 rezerwowych

Bramkarz wybrany w kreatorze wchodzi na mecz automatycznie. Skład można dowolnie edytować między meczami.

### Kontuzje
Po meczu każdy zawodnik ma **8% szansy na kontuzję** (blokada na 2–4 godziny). Kontuzjowany zawodnik nie może grać — trzeba go zastąpić w składzie.

---

## Liga i postęp

Gracz startuje w **Lidze Srebrnej** (1000 pkt ratingu) i awansuje przez 5 lig:

| Liga | Rating |
|------|--------|
| Brąz | 0–999 |
| Srebro | 1000–1999 |
| Złoto | 2000–2999 |
| Platyna | 3000–3999 |
| Diament | 4000+ |

Wygrana w lidze = +25 pkt, remis = +5, przegrana = -15.  
Ekran ligi pokazuje **symulowany ranking 20 graczy** wokół pozycji gracza.

---

## Ekonomia i waluta

Dwie waluty:
- **Monety 🪙** — zarabiane z meczów i misji, wydawane na paczki i ulepszenia
- **Klejnoty 💎** — waluta premium (5 na start), zdobywane z misji tygodniowych

### Paczki z kartami
| Paczka | Koszt | Zawartość |
|--------|-------|-----------|
| Losowa | 450🪙 lub 2💎 | 3 karty, min. 1 rzadka |
| Ataku / Obrony / Środka | 550🪙 lub 3💎 | 3 karty danej pozycji |
| Bramkarzy | 650🪙 lub 3💎 | 3 karty z naciskiem na GK |
| Mega | 950🪙 lub 5💎 | 5 kart, 15% szansa na legendarną |
| Premium | 12💎 | 5 kart, gwarantowana legendarna |
| Darmowa | — | 1 karta co 12h |

### Ulepszanie kart
Każdą kartę można ulepszyć **3 razy** za monety. Każdy poziom daje bonus do statystyk. Na maksymalnym poziomie Rzadka dostaje +3, a Legendarna +5 do statystyk.

---

## Misje

**Dzienne** (3 losowe, reset o północy):
- Zagraj/wygraj mecze, strzel gole, utrzymaj czyste konto
- Nagrody: 80–320 monet

**Tygodniowe** (6 losowych, reset w poniedziałek):
- Trudniejsze cele (np. 15 meczów, 30 goli, 5 wygranych w lidze)
- Ostatnie 2 odblokują się po ukończeniu pierwszych 4
- Nagrody: 450–1100 monet + 2–3 klejnoty

---

## Sklep (Market)

Trzy sekcje:
1. **Paczki** — kupno paczek za monety lub klejnoty, animacja otwierania z odkrywaniem kart 3D
2. **Sklep zawodników** — 3 rotujące karty (zmiana co 12h), cena = 2× wartość sprzedaży
3. **Sprzedaj** — sprzedaj niepotrzebne karty za monety (karty startowe nie do sprzedania)

---

## Ekrany aplikacji

| Ekran | Co robi gracz |
|-------|--------------|
| Menu Główne | Start meczu, podgląd misji, odbiór darmowej paczki, historia meczów |
| Mecz | Rozgrywa turową potyczkę karcianą |
| Po meczu | Widzi wynik, zarobione monety, zmianę ratingu, MVP |
| Kreator Składu | Ustawia formację na kolejny mecz |
| Market | Kupuje paczki, przegląda sklep, sprzedaje karty |
| Liga | Sprawdza pozycję w rankingu i postęp w lidze |
| Zawodnicy | Przegląda kolekcję, ulepsza karty |
| Ustawienia | Zmienia nick, dźwięki, resetuje profil |

---

## Co jeszcze NIE jest w grze (planowane)

- **Tutorial / onboarding** — nowy gracz nie ma wprowadzenia do mechanik
- **Battle Pass / Sezon** — preview widoczny w changelogu, niezaimplementowany
- **Zakupy IAP** — Pakiet Startowy jest zaślepką ("Wkrótce")
- **Reklamy wideo** — przycisk w Market jest zaślepką
- **Notyfikacje push** — system powiadomień istnieje w profilu, ale nie wysyła powiadomień na urządzenie
- **Cloud save** — wszystko lokalnie w przeglądarce, zmiana urządzenia = utrata postępu
- **PvP** — tylko AI, bez meczów między prawdziwymi graczami

---

## Styl wizualny

- Ciemne tło (`#080b16`), zielony akcent (`#00e676`)
- Czcionki: **Bangers** (nagłówki, liczby), **Outfit** (body text)
- Karty mają gradient tła zależny od pozycji i rzadkości
- Legendarne karty mają efekt holograficznego połysku
- Animacje: otwieranie paczek (3D flip kart), gol (pełnoekranowa animacja), rzut monetą
