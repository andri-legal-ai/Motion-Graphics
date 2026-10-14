# BaseNet strings in staging's Dutch dictionary (13 Oct 2026)

Read from staging's own JS chunk (`_next/static/immutable/chunks/2njmv8hcfdaoj.js`, the nl dictionary), because the
BaseNet screens don't show for our UK test firm. These are the labels the app renders; {{connector}} = "BaseNet".
Newer than Timothy's brief where they differ (marked NEW).

## Personalisatie > Koppelingen (personalisation connectors)
- groupMail "E-mail en bestanden", groupFirm "Systemen van uw kantoor"
- notSignedIn "Niet aangemeld", signIn "Aanmelden", signOut "Afmelden"
- basenetRequirement "Vereist BaseNeQXt Advanced of Ultimate"  (NEW; brief had "Vereist een BaseNeQXt-abonnement")
- signedInToast "Aangemeld bij {name}" -> "Aangemeld bij BaseNet"
- basenetNextStep "Koppel nu een zaak aan het dossier: open de kennisbank van de zaak en kies BaseNet."
- howItWorks "Hoe werkt het?"
- signedIn "Aangemeld met uw eigen login", signedInAsAccount "Aangemeld als {account}"
- firm note: "Sommige systemen van uw kantoor, zoals LegalSense, verschijnen hier pas als een beheerder ze onder Kantoor inschakelt. U meldt zich altijd aan met uw eigen account."

## Sign-in form (connectorLogin)
- title "Aanmelden bij BaseNet"
- description "Andri werkt hier onder uw eigen account. Uw wachtwoord wordt alleen gebruikt om uw sessie te starten en wordt nooit meer getoond."
- usernameLabel "Gebruikersnaam", passwordLabel "Wachtwoord", showPassword "Wachtwoord tonen"
- connectButton "Aanmelden", connecting "Aanmelden…", cancel "Annuleren"

## Kennisbank: link a dossier (connectorCaseLink, connectorChoice)
- link "BaseNet-dossier koppelen", linked "Gekoppeld aan BaseNet"
- unlinkedTitle "Geen BaseNet-dossier gekoppeld", unlinkedHint "Koppel deze zaak aan het dossier om de documenten van het dossier hier te zien."
- picker title "Koppel deze zaak aan een BaseNet-dossier"
- picker description "Uw dossiers in BaseNet. Kies het dossier waar deze zaak bij hoort. Andri leest daaruit en slaat er documenten, e-mails en uren in op wanneer u daarom vraagt."
- searchPlaceholder "Zoek op naam, dossiernummer, cliënt of zoekcode"
- row labels: numberLabel "Dossiernummer", clientLabel "Cliënt", areaLabel "Rechtsgebied", statusLabel "Status"; badges "Nu gekoppeld", "Privé"
- loading "Uw BaseNet-dossiers laden…", linking "Koppelen…"
- linkedToast "Deze zaak is gekoppeld aan {{name}}."
- markTooltip "Gekoppeld aan BaseNet: {{name}}"

## Kennisbank: BaseNet documents (connectorDocuments)
- sourceLabel "Documentbron"
- liveNotice "Documenten in het gekoppelde BaseNet-dossier. Selecteer de documenten die Andri moet lezen en synchroniseer ze naar deze zaak."
- columns: "Naam", "Datum", "Type", "Van", "Grootte", "Andri"; archivedEmail "E-mail (archief)"
- state: "In Andri" / "Alleen in BaseNet"
- selectedMany "documenten geselecteerd", sync "Synchroniseren naar Andri"
- syncing "{{done}} van {{count}} naar Andri synchroniseren"
- syncedMany "{{count}} documenten worden aan deze zaak toegevoegd"
- originTooltip "Gesynchroniseerd vanuit BaseNet", viewInAndri "Bekijken in Andri"

## Company > Kantoorkoppelingen (basenet card)
- "BaseNet" · "Praktijkmanagement" · "Nederland en België"
- "Werk met de dossiers, documenten en uren in de BaseNet-omgeving van uw kantoor. Werkt met BaseNeQXt Advanced en Ultimate."
- dialog: "BaseNet staat voor elk kantoor aan, dus er hoeft niets aangezet te worden; wel is BaseNeQXt Advanced of Ultimate nodig, niet alleen BaseNet. Elke advocaat logt eenmalig in met de eigen BaseNet-login, en Andri ziet alleen wat die advocaat in BaseNet kan zien."  (NEW: no admin step)

## BaseNet announcement (the pop-up on first visit, 5 beats)
1. BaseNet werkt nu in Andri: Met BaseNeQXt Advanced of Ultimate koppelt u een zaak één keer aan het BaseNet-dossier. Daarna werkt Andri vanuit dat dossier en wisselt u niet meer tussen systemen.
2. Andri leest live mee: Vraag naar partijen, agenda, uren of documenten. Andri leest het antwoord op dat moment uit BaseNet, met alleen de rechten die u daar zelf heeft.
3. U kiest wat Andri volledig leest: In de kennisbank van de zaak ziet u de documenten uit het dossier. Synchroniseer wat Andri volledig moet lezen; het blijft ook in BaseNet staan.
4. Vastleggen in BaseNet, als u het vraagt: Andri legt uren, documenten en e-mailconcepten vast in het dossier, maar alleen als u erom vraagt. Een concept wordt nooit verstuurd.
5. Zo begint u: Meld u eenmalig aan met uw eigen BaseNet-login. Open daarna de kennisbank van een zaak, kies BaseNet en koppel het dossier, of vraag Andri het voor u te zoeken.

## Not in the frontend dictionary (backend, from Timothy's brief, BE core.ts)
- chat chips: "BaseNet-documenten tonen", "BaseNet-document lezen", "Document in BaseNet opslaan", "Uren registreren in BaseNet"
