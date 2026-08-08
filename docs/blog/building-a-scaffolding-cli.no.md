---
title: "Jeg ble lei av de samme 30 minuttene, så jeg bygget min egen create-next-app"
description: "Hvorfor et startprosjekt trenger et designsystem, hva som skjer når du genererer en fargepalett fra én HEX, og kontrastfeilen som gjorde dark mode ubrukelig."
date: 2026-08-08
lang: nb
alternate: https://create-next-app.larsenutvikling.no/blog/building-a-scaffolding-cli
tags:
  - Next.js
  - Designsystem
  - CSS
  - Åpen kildekode
excerpt: "Hvert nytt prosjekt startet likt: kjør create-next-app, slett boilerplate, kopier tokens fra forrige prosjekt, skriv den samme AGENTS.md på nytt. Så pakket jeg det."
---

Hvert nytt prosjekt startet likt. Kjør `create-next-app`. Slett demosiden. Slett
CSS-en som fulgte med. Kopier spacing-tokens fra det jeg bygget sist. Prøv å
huske hvilken easing-kurve jeg landet på. Skriv omtrent den samme `AGENTS.md`
igjen, litt dårligere enn forrige gang, fordi jeg skrev den fra hukommelsen.

En halvtime, cirka, før prosjektet faktisk var mitt. Gang det med hver prototype,
hver kundeidé som skulle testes raskt, hvert innfall som varte en helg.

Så jeg pakket det: `npx @larsen-utvikling/create-next-app`.

## Hva et startprosjekt egentlig mangler

Offisielle `create-next-app` gjør jobben sin godt. Du får rammeverket, riktig
satt opp, i nyeste versjon. Det den ikke kan gi deg er et standpunkt - den må
tjene alle.

Det er helt greit for rammeverket og ubrukelig for alt som ligger over. Du må
fortsatt bestemme spacing-skalaen din, typografiskalaen, hvordan dark mode
fungerer, hva varighetene dine er. De fleste av oss bestemmer det én gang, og
utleder det så på nytt - dårligere - prosjekt etter prosjekt.

En template med et standpunkt kan bare svare:

- **Spacing**: åtte steg på 4px-base. 4, 8, 12, 16, 24, 32, 48, 64.
- **Typografi**: enhetsløs linjehøyde som skalerer, tettere tracking på display-størrelser.
- **Motion**: varigheter navngitt etter hva som beveger seg, fire kurver i én fil.
- **Farge**: generert, ikke håndplukket - mer om det under.
- **Dark mode**: `prefers-color-scheme` med `data-theme`-overstyring. Null JavaScript.

Ingenting av dette er nyskapende. Poenget er at det er bestemt, skrevet ned, og
med i første commit.

## Hvorfor ikke Tailwind

Dette er ikke en kritikk av Tailwind, men av hva som skjer når utility-klasser er
det eneste laget du har. Når hver verdi bor i et klassenavn i markupen, slutter
designsystemet å eksistere som noe du kan se på. Spør «hva er spacing-stegene
våre?», og det ærlige svaret blir «det folk har skrevet».

Vanilla CSS med custom properties beholder systemet som et artefakt. Fem små
filer du leser i én økt:

```
src/lib/design-system/
├── index.css    den eneste importen appen din trenger
├── core.css     spacing, bredder, radier, typografi, lagdeling
├── theme.css    farge, lys og mørk
├── motion.css   varigheter, kurver, reduced motion
└── base.css     reset
```

`globals.css` er én linje. Systemet er én ting du kan versjonere, bytte ut eller
slette.

## En palett fra én HEX

Farge er det folk utleder dårligst på nytt, fordi å gjøre det ordentlig er
skikkelig arbeid. Du trenger en 12-stegs aksentskala der hvert steg har en jobb,
en gråskala med et snev av din egen fargetone, semantiske farger for suksess og
feil - og alt sammen én gang til for dark mode.

Jeg hadde allerede en motor for dette; jeg bygget [rampkit](https://rampkit.app)
nettopp for det. Så CLI-en tar den med seg og kjører den lokalt under
installasjonen. Du svarer på ett spørsmål med `#22C55E` og får hele systemet
skrevet til `theme.css`, i det formatet du ba om.

Landingssiden kjører den samme motoren i nettleseren din, importert fra den
publiserte pakken, så det du genererer der er byte for byte det `npx` skriver.
Det sjekket jeg med en diff, i stedet for å anta det.

## Feilen som gjorde dark mode ubrukelig

Her er delen som er verdt å skrive ned, for jeg holdt på å publisere den.

Standardtemaet er monokromt - svart og hvitt med blå aksent, som matcher min egen
profil. Så jeg seedet generatoren med `#0A0A0A`, nesten svart, og fikk en helt
grei lys modus.

Så målte jeg mørk modus.

```
--background: 0 0% 6%    #0F0F0F
--primary:    0 0% 4%    #0A0A0A   kontrast mot bakgrunn: 1.03:1
--ring:       0 0% 4%    #0A0A0A   kontrast mot bakgrunn: 1.03:1
```

1.03:1 er usynlig. Hver primærknapp og hver fokusring ville vært et svart
rektangel på en svart flate. Siden så helt fin ut, fordi demosiden min tilfeldigvis
ikke brukte `--primary` - som er nøyaktig slik denne typen feil overlever en
visuell gjennomgang.

Årsaken er strukturell, ikke en regnefeil. Motoren beholder `--primary` og
`--ring` på seed-fargen din i *begge* moduser. Det er riktig for en farge midt på
skalaen: en grønn knapp er grønn i både lys og mørk. Det bryter sammen i
ytterpunktene, fordi en nesten svart seed gir en nesten svart primærfarge på en
nesten svart mørk flate.

Løsningen er å slutte å late som én seed dekker begge moduser. Lys modus trenger
en mørk aksent, mørk modus trenger en lys. Så hver modus genereres nå fra den
seeden som fungerer i den, og en ekstrem seed pares automatisk med sin
lyshetsinverterte motpart. `--primary` i mørk modus gikk fra **1.03:1 til
18.97:1**.

En kontrastsjekk kjører nå i testene før hver publisering, og den er skrevet for
å fange nettopp denne feilen - ikke fargevalg generelt. En merkevareaksent får
gjerne ligge under WCAG-terskelen som knappeflate, men ingenting får være
usynlig.

## Motion hører hjemme i templaten

De fleste startprosjekter leverer null motion-lag. Resultatet er at hvert
prosjekt finner opp sine egne kurver, og de matcher aldri helt på tvers av
komponenter.

Verdiene i `motion.css` kommer fra `motion-craft`-skillen i
[Larsen Skills](https://github.com/Stianlars1/larsen-skills)-samlingen min, og er
de samme som larsenutvikling.no allerede kjører. Varighetene er navngitt etter
hva som beveger seg - `--duration-press`, `--duration-ui`, `--duration-slow` - så
du velger ut fra hva du animerer, ikke ut fra smak.

Det jeg bryr meg mest om er reduced motion. Standardoppskriften dreper all
animasjon med `animation-duration: 0.01ms !important`, inkludert lastesnurrer og
fremdriftsindikatorer folk er avhengige av for å vite at noe skjer. Reduced
motion handler om vestibulære triggere, ikke om tilbakemelding.

Så i stedet for en altomfattende regel kollapser avstand, skala og stagger:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --enter-distance: 0px;
    --enter-scale: 1;
    --press-scale: 1;
    --stagger-item: 0ms;
  }
}
```

Transitions går videre. Bevegelsen stopper. Det som er ren dekorasjon og går i
løkke melder seg av med `data-motion="decorative"`.

## Docs er en del av leveransen

En agent som ikke kjenner konvensjonene dine finner opp sine egne, og den finner
opp nye hver økt. Så hvert prosjekt får en `AGENTS.md` med de faktiske reglene -
aldri Tailwind, token-idiomet for paletten du valgte, motion-reglene - og en
`CLAUDE.md` som kun inneholder én `@AGENTS.md`-import, ikke en kopi som driver
fra hverandre.

`create-next-app` skriver sin egen `AGENTS.md` full av rammeverksveiledning. Den
er faktisk nyttig, så den bevares som `NEXTJS.md` i stedet for å overskrives.

Du kan også velge å installere selve skills-samlingen, i `.agents/skills/`, der
alle agentene plukker den opp.

## Hva jeg ville sagt før du bygger en selv

Tre ting overrasket meg.

**Å ta motoren med slår å skrive den på nytt.** Palett-motoren bor i én mappe med
én eksportert funksjon og en `NOTICE.md` som pinner commit-en oppstrøms. Fordi
landingssiden importerer den fra den publiserte pakken i stedet for å kopiere
den, kan ikke demoen drive fra CLI-en. Den egenskapen kom gratis av hvor koden
ligger.

**Test det genererte, ikke generatoren.** Røyktesten scaffolder ekte apper og
sjekker filene som kommer ut - at designsystemet finnes, at ingen
tailwind-avhengighet er der, at ingen placeholders står igjen, at kontrasten
består. Den kjører automatisk før hver publisering. En grønn kjøring betyr at
tarballen er verifisert.

**Kjør matrisen.** Jeg testet hver package manager, hver linter, flere
palettkombinasjoner og all ugyldig input i ett script. Den fant to reelle feil
jeg ellers hadde publisert: feil bakgrunnsfarge med ett preset, og en CLI som
hang i CI og døde med en kryptisk Node-advarsel i stedet for å si hvilket flagg
du skulle sende.

## Prøv den

```bash
npx @larsen-utvikling/create-next-app my-app
```

Sju spørsmål, alle med et flagg hvis du heller vil slippe å svare. Kildekoden
ligger på [GitHub](https://github.com/Stianlars1/larsen-create-next-app), og det
er en [levende fargedemo](https://create-next-app.larsenutvikling.no) hvis du vil
se hva merkevarefargen din blir til først.

Den er MIT, og den er mest bygget for meg selv - men sparer den deg de samme
tretti minuttene, er det hele poenget.
