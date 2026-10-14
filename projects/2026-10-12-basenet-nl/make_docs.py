"""Fictional case files for the BaseNeQXt video: Rijnveld Distributie B.V. / Verhoef (arbeidsrecht).

Timothy's brief names the matter, dossier 2026-0418 and four documents with their dates; everything else here is invented
for the video. No real client, firm, person or address. Written in Dutch, as a Dutch employment lawyer would.
Run: <scratch venv>/bin/python make_docs.py
"""
import pathlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

OUT = pathlib.Path(__file__).resolve().parent / "demo-files"
OUT.mkdir(exist_ok=True)


class Doc:
    def __init__(self, name):
        self.c = canvas.Canvas(str(OUT / name), pagesize=A4)
        self.c.setTitle(name.rsplit(".", 1)[0])
        self.W, self.H = A4
        self.page, self.y = 1, A4[1] - 25 * mm
        self.left, self.right = 25 * mm, A4[0] - 25 * mm

    def need(self, h):
        if self.y - h < 25 * mm:
            self.footer(); self.c.showPage(); self.page += 1; self.y = self.H - 25 * mm

    def footer(self):
        self.c.setFont("Helvetica", 8.5); self.c.drawCentredString(self.W / 2, 14 * mm, f"Pagina {self.page}")

    def line(self, text, font="Helvetica", size=10.5, align="left", gap=4):
        self.need(size + gap); self.c.setFont(font, size)
        if align == "center": self.c.drawCentredString(self.W / 2, self.y, text)
        elif align == "right": self.c.drawRightString(self.right, self.y, text)
        else: self.c.drawString(self.left, self.y, text)
        self.y -= size + gap

    def para(self, text, font="Helvetica", size=10.5, lead=14.5, indent=0, after=7):
        words, cur, lines = text.split(), "", []
        width = self.right - self.left - indent
        for w in words:
            t = (cur + " " + w).strip()
            if self.c.stringWidth(t, font, size) > width: lines.append(cur); cur = w
            else: cur = t
        lines.append(cur)
        for ln in lines:
            self.need(lead); self.c.setFont(font, size); self.c.drawString(self.left + indent, self.y, ln); self.y -= lead
        self.y -= after

    def head(self, text): self.y -= 4; self.line(text, "Helvetica-Bold", 11.5, gap=6)

    def num(self, n, text): self.para(f"{n}.  {text}", indent=0)

    def gap(self, h=8): self.y -= h

    def save(self): self.footer(); self.c.save()


def caption(d, title, sub):
    d.line("RECHTBANK GELDERLAND", "Helvetica-Bold", 12, "center")
    d.line("Team kanton Arnhem", size=10.5, align="center")
    d.line("Zaaknummer: 11284561 \\ AR VERZ 26-1903", size=10, align="center", gap=14)
    d.line(title, "Helvetica-Bold", 14, "center", gap=6)
    d.line(sub, size=10.5, align="center", gap=16)


# ------------------------------------------------------------------ 1 verzoekschrift (4 september 2026)
d = Doc("2026-09-04 Verzoekschrift ontbinding arbeidsovereenkomst.pdf")
caption(d, "VERZOEKSCHRIFT", "tot ontbinding van de arbeidsovereenkomst (artikel 7:671b BW)")
d.para("Verzoekster: de besloten vennootschap Rijnveld Distributie B.V., gevestigd te Arnhem, hierna: Rijnveld, "
       "advocaat mr. S. van Hoven, Van Hoven & Partners.")
d.para("Tegen: de heer J. Verhoef, wonende te Arnhem, hierna: Verhoef.")
d.head("1. De arbeidsovereenkomst")
d.num("1.1", "Verhoef is sinds 1 maart 2017 in dienst van Rijnveld, laatstelijk als teamleider expeditie, voor 40 uur per week, "
      "tegen een bruto maandsalaris van EUR 4.150, exclusief vakantietoeslag. Op de arbeidsovereenkomst is de cao Beroepsgoederenvervoer niet van toepassing.")
d.head("2. Wat er is gebeurd")
d.num("2.1", "Sinds de reorganisatie van de expeditie in januari 2026 is de samenwerking tussen Verhoef en de operationeel manager, "
      "mevrouw R. Smit, ernstig verslechterd. Verhoef weigert structureel deel te nemen aan het weekoverleg en spreekt de manager in het bijzijn van zijn team aan op een wijze die Rijnveld niet accepteert.")
d.num("2.2", "Op 14 juli 2026 heeft een gesprek plaatsgevonden tussen Verhoef, mevrouw Smit en HR-adviseur de heer T. Bos. "
      "Het verslag van dat gesprek is als productie 4 bijgevoegd. Een mediationtraject is aangeboden; Verhoef heeft dat op 28 juli 2026 afgewezen.")
d.num("2.3", "Sinds 3 augustus 2026 is Verhoef op eigen verzoek vrijgesteld van werk, met behoud van loon.")
d.head("3. Grond voor ontbinding")
d.num("3.1", "Rijnveld verzoekt ontbinding op grond van een verstoorde arbeidsverhouding (artikel 7:669 lid 3 sub g BW). "
      "De verhouding is zodanig verstoord dat van Rijnveld redelijkerwijs niet kan worden gevergd de arbeidsovereenkomst te laten voortduren.")
d.num("3.2", "Herplaatsing binnen redelijke termijn is niet mogelijk: Rijnveld heeft geen passende functie buiten de expeditie, "
      "en alle leidinggevende functies vallen onder dezelfde operationeel manager.")
d.num("3.3", "Rijnveld betaalt de wettelijke transitievergoeding van EUR 13.512 bruto. Van ernstig verwijtbaar handelen van Rijnveld is geen sprake.")
d.head("4. Verzoek")
d.para("Rijnveld verzoekt de kantonrechter de arbeidsovereenkomst te ontbinden met ingang van 1 november 2026, met toekenning van de wettelijke transitievergoeding.")
d.gap(); d.line("Arnhem, 4 september 2026"); d.line("mr. S. van Hoven")
d.save()

# ------------------------------------------------------------------ 2 verweerschrift (16 september 2026)
d = Doc("2026-09-16 Verweerschrift wederpartij.pdf")
caption(d, "VERWEERSCHRIFT", "in de procedure tot ontbinding van de arbeidsovereenkomst")
d.para("Verweerder: de heer J. Verhoef, advocaat mr. M. Kuipers, Kuipers Arbeidsrecht.")
d.para("Tegen: Rijnveld Distributie B.V., verzoekster.")
d.head("1. Inleiding")
d.num("1.1", "Verhoef verzet zich tegen de ontbinding. Hij werkt negen jaar naar volle tevredenheid bij Rijnveld; zijn beoordelingen over 2023, 2024 en 2025 waren alle 'goed'. "
      "De problemen zijn pas ontstaan na de reorganisatie van januari 2026.")
d.head("2. Geen verstoorde arbeidsverhouding")
d.num("2.1", "Er is geen sprake van een duurzaam verstoorde arbeidsverhouding. Er is een conflict met één persoon, de operationeel manager. "
      "Met zijn eigen team en met de directie is de verhouding goed. Een conflict met één leidinggevende maakt de arbeidsverhouding niet verstoord in de zin van artikel 7:669 lid 3 sub g BW.")
d.num("2.2", "Verhoef heeft het weekoverleg niet 'structureel' gemist. Hij was op twee van de veertien overleggen afwezig, beide keren vanwege een spoedlevering die de manager zelf had ingepland.")
d.num("2.3", "Mediation is niet geweigerd. Verhoef heeft op 28 juli 2026 gevraagd om een andere mediator dan de vaste bedrijfsmediator van Rijnveld. Op dat verzoek is nooit gereageerd.")
d.head("3. Herplaatsing niet onderzocht")
d.num("3.1", "Rijnveld heeft niet onderzocht of Verhoef kan worden herplaatst. De vacature planner retourstromen, opengesteld op 1 september 2026, valt niet onder de operationeel manager en past bij zijn ervaring.")
d.head("4. Ernstig verwijtbaar handelen van Rijnveld")
d.num("4.1", "Rijnveld heeft het conflict laten escaleren: de vrijstelling van werk was niet op verzoek van Verhoef, maar werd hem op 3 augustus 2026 opgelegd, "
      "en in het gespreksverslag van 14 juli 2026 ontbreekt zijn reactie, die hij per e-mail van 17 juli 2026 heeft gestuurd.")
d.num("4.2", "Als de kantonrechter toch ontbindt, verzoekt Verhoef naast de transitievergoeding een billijke vergoeding van EUR 45.000 bruto (artikel 7:671b lid 9 sub c BW).")
d.head("5. Opzegtermijn")
d.num("5.1", "Bij ontbinding moet de einddatum rekening houden met de opzegtermijn van twee maanden en de proceduretijd. De gevraagde einddatum van 1 november 2026 is te vroeg; de juiste datum is niet eerder dan 1 januari 2027.")
d.head("6. Verzoek")
d.para("Verhoef verzoekt het verzoek af te wijzen; subsidiair bij ontbinding een billijke vergoeding van EUR 45.000 bruto toe te kennen, met een einddatum niet eerder dan 1 januari 2027, "
       "en Rijnveld te veroordelen in de proceskosten.")
d.gap(); d.line("Arnhem, 16 september 2026"); d.line("mr. M. Kuipers")
d.save()

# ------------------------------------------------------------------ 3 schikkingsvoorstel (18 september 2026)
d = Doc("2026-09-18 Schikkingsvoorstel wederpartij.pdf")
d.line("Kuipers Arbeidsrecht", "Helvetica-Bold", 12, gap=16)
d.line("Aan: mr. S. van Hoven, Van Hoven & Partners")
d.line("Datum: 18 september 2026")
d.line("Betreft: Rijnveld Distributie B.V. / Verhoef, schikkingsvoorstel", "Helvetica-Bold", gap=14)
d.para("Geachte collega,")
d.para("Zonder enige erkenning van aansprakelijkheid en onder voorbehoud van alle rechten doet mijn cliënt, de heer Verhoef, het volgende voorstel om de procedure te beëindigen met een vaststellingsovereenkomst:")
d.num(1, "De arbeidsovereenkomst eindigt met wederzijds goedvinden per 1 december 2026, op initiatief van Rijnveld.")
d.num(2, "Tot die datum blijft mijn cliënt vrijgesteld van werk, met behoud van loon en emolumenten.")
d.num(3, "Rijnveld betaalt de transitievergoeding van EUR 13.512 bruto en daarbovenop een aanvullende vergoeding van EUR 18.000 bruto.")
d.num(4, "Rijnveld verstrekt een positief getuigschrift en een neutrale vertrekreden naar collega's en klanten.")
d.num(5, "Rijnveld vergoedt de kosten van juridische bijstand tot EUR 1.500 exclusief btw.")
d.num(6, "Partijen verlenen elkaar finale kwijting; het ontbindingsverzoek wordt ingetrokken.")
d.para("Dit voorstel geldt tot en met 2 oktober 2026. Ik verneem graag uw reactie.")
d.gap(); d.line("Met vriendelijke groet,"); d.line("mr. M. Kuipers")
d.save()

# ------------------------------------------------------------------ 4 gespreksverslag (14 juli 2026)
d = Doc("2026-07-14 Gespreksverslag.pdf")
d.line("Rijnveld Distributie B.V.", "Helvetica-Bold", 12, gap=16)
d.line("Gespreksverslag", "Helvetica-Bold", 14, gap=10)
d.line("Datum: 14 juli 2026, 10:00 tot 11:15")
d.line("Aanwezig: J. Verhoef (teamleider expeditie), R. Smit (operationeel manager), T. Bos (HR-adviseur, verslag)", gap=12)
d.head("Aanleiding")
d.para("Gesprek over de samenwerking tussen de heer Verhoef en mevrouw Smit sinds de reorganisatie van de expeditie in januari 2026.")
d.head("Besproken")
d.num(1, "Mevrouw Smit geeft aan dat de heer Verhoef twee weekoverleggen heeft gemist en dat hij haar op 30 juni 2026 in het bijzijn van zijn team heeft tegengesproken over de nieuwe roosters.")
d.num(2, "De heer Verhoef zegt dat beide overleggen samenvielen met spoedleveringen en dat hij zijn bezwaar tegen de roosters eerder per e-mail had gemeld, zonder antwoord.")
d.num(3, "HR stelt mediation voor. De heer Verhoef staat open voor mediation, maar wil een externe mediator.")
d.head("Afspraken")
d.num(1, "HR doet binnen twee weken een voorstel voor mediation.")
d.num(2, "Tot die tijd vindt het weekoverleg plaats in aanwezigheid van HR.")
d.gap(); d.line("Opgesteld door T. Bos, 14 juli 2026")
d.save()
print(sorted(p.name for p in OUT.iterdir()))
