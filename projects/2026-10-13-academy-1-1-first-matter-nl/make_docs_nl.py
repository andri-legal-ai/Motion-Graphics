"""Dutch versions of the six Nair case files and the Aldridge Vine letter template (Academy 1.1 Dutch).

Same case, same people, same facts and dates as the English mock case, written in Dutch (natively, not word for word).
UK statute names stay in English (as Dutch legal texts about UK law usually keep them).
Word files are copied from the English originals and their text replaced, so layout and styles stay the same.
Run with the scratchpad venv (pypdf, python-docx, reportlab).
"""
import base64, copy, pathlib, sys
from email.message import EmailMessage
from email.utils import format_datetime
from datetime import datetime, timezone
import docx
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "demo-files-nl"
SRC = pathlib.Path.home() / "Desktop/Andri/2 - Product/Demo Files/Mock Case/employment"
TPL = pathlib.Path.home() / "Desktop/andri code /Motion Graphics/projects/2026-10-12-academy-7-1-specialists/demo-files/Aldridge_Vine_Letter_Template.docx"
OUT.mkdir(exist_ok=True)

DASH = "- " * 46


# ------------------------------------------------------------------ simple PDF writer
class Doc:
    def __init__(self, path):
        self.c = canvas.Canvas(str(path), pagesize=A4)
        self.c.setTitle(path.stem)
        self.W, self.H = A4
        self.page = 1
        self.y = self.H - 25 * mm
        self.left, self.right = 25 * mm, self.W - 25 * mm

    def need(self, h):
        if self.y - h < 25 * mm:
            self.footer(); self.c.showPage(); self.page += 1; self.y = self.H - 25 * mm

    def footer(self):
        self.c.setFont("Helvetica", 8.5); self.c.drawCentredString(self.W / 2, 14 * mm, f"Pagina {self.page}")

    def line(self, text, font="Helvetica", size=10.5, align="left", gap=4, indent=0):
        self.need(size + gap)
        self.c.setFont(font, size)
        if align == "center": self.c.drawCentredString(self.W / 2, self.y, text)
        elif align == "right": self.c.drawRightString(self.right, self.y, text)
        else: self.c.drawString(self.left + indent, self.y, text)
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

    def heading(self, text, size=11.5):
        self.y -= 4; self.line(text, "Helvetica-Bold", size, gap=7)

    def space(self, h=8): self.y -= h

    def save(self): self.footer(); self.c.save()


def parties(d):
    d.line("TUSSEN:", "Helvetica-Bold", 10.5, "center", gap=10)
    d.line("MEVROUW PRIYA NAIR", "Helvetica-Bold", 11, "center", gap=4)
    d.line("Eiseres", "Helvetica", 10.5, "right", gap=6)
    d.line(DASH, "Helvetica", 8, "center", gap=8)
    d.line("CALDERDALE LOGISTICS LIMITED", "Helvetica-Bold", 11, "center", gap=4)
    d.line("Verweerster", "Helvetica", 10.5, "right", gap=6)
    d.line(DASH, "Helvetica", 8, "center", gap=12)


# ------------------------------------------------------------------ 01 ET1
def et1():
    d = Doc(OUT / "01_ET1_Verzoekschrift.pdf")
    d.line("EMPLOYMENT TRIBUNAL (ARBEIDSRECHTER) TE LEEDS", "Helvetica-Bold", 12, "center", gap=8)
    d.line("Zaaknummer: 1803442/2025", "Helvetica", 10.5, "right", gap=14)
    parties(d)
    d.line("VERZOEKSCHRIFT (ET1)", "Helvetica-Bold", 12.5, "center", gap=14)
    d.heading("Dienstverband")
    d.para("1.  Eiseres was van 4 januari 2018 tot haar ontslag per 31 maart 2025 bij verweerster in dienst als Operations Manager. Haar bruto jaarsalaris bedroeg GBP 58.000.")
    d.para("2.  Eiseres was ruim zeven jaar onafgebroken in dienst en was op alle relevante momenten werknemer in de zin van Section 230 van de Employment Rights Act 1996.")
    d.heading("Zwangerschapsverlof")
    d.para("3.  Eiseres ging op 1 mei 2024 met zwangerschapsverlof en beviel op 19 mei 2024 van haar zoon. Zij liet verweerster weten dat zij op 6 januari 2025 weer aan het werk zou gaan.")
    d.para("4.  Tijdens het verlof nam verweerster de heer James Thornton aan als vervanger voor de functie van eiseres. Bij haar terugkeer bleek dat de heer Thornton was aangebleven en dat haar taken sterk waren ingeperkt.")
    d.heading("Ontslag")
    d.para("5.  Op 17 februari 2025 kreeg eiseres te horen dat haar functie “mogelijk zou vervallen”. Daarop volgde een consultatieprocedure die volgens eiseres slechts voor de vorm werd gevoerd. Op 14 maart 2025 ontving zij haar ontslag wegens het vervallen van haar functie (redundancy), met ingang van 31 maart 2025.")
    d.para("6.  De heer Thornton, die tijdens het verlof van eiseres was aangenomen, bleef in dienst in een functie die in wezen gelijk is aan de hare. Van een werkelijk vervallen functie was geen sprake.")
    d.heading("Onredelijk ontslag")
    d.para("7.  Het ontslag was onredelijk (unfair) in de zin van Sections 98 en 99 van de Employment Rights Act 1996. De functie was niet werkelijk vervallen, de keuze stond vooraf vast en de consultatie was slechts een formaliteit. Daarnaast was het ontslag op grond van Section 99 ERA 1996 en Regulation 20 van de Maternity and Parental Leave etc Regulations 1999 automatisch onredelijk, omdat het verband hield met het zwangerschapsverlof van eiseres.")
    d.heading("Discriminatie")
    d.para("8.  Het ontslag en het inperken van de taken van eiseres vormen directe discriminatie op grond van geslacht (Section 13 Equality Act 2010) en discriminatie wegens zwangerschap en moederschap (Section 18 Equality Act 2010). Eiseres vergelijkt zich met een mannelijke collega, de heer Thornton, die als haar vervanger tijdens het verlof was aangenomen.")
    d.heading("Vorderingen")
    d.para("9.  Eiseres vordert een basisvergoeding (basic award), een schadevergoeding (compensatory award) en smartengeld (injury to feelings) in de middelste Vento-schaal, telkens vermeerderd met rente. Een schadeoverzicht (schedule of loss) is bijgevoegd.")
    d.heading("EISERES VERZOEKT DE TRIBUNAL:")
    for t in ["(1)  te verklaren dat eiseres in strijd met de Employment Rights Act 1996 onredelijk is ontslagen;",
              "(2)  te verklaren dat sprake is van directe discriminatie op grond van geslacht (Section 13 Equality Act 2010);",
              "(3)  te verklaren dat sprake is van discriminatie wegens zwangerschap en moederschap (Section 18 Equality Act 2010);",
              "(4)  een schadevergoeding toe te kennen, met inbegrip van smartengeld en rente;",
              "(5)  verweerster te veroordelen in de kosten."]:
        d.para(t, indent=8, after=4)
    d.space(10)
    d.heading("VERKLARING VAN WAARHEID")
    d.para("Eiseres verklaart dat de feiten in dit verzoekschrift waar zijn. Ik ben door eiseres gemachtigd deze verklaring te ondertekenen.")
    d.line("Hester Ramsbottom", "Helvetica-Bold", 10.5, gap=4)
    d.line("Park Lane Chambers, Leeds", gap=4)
    d.line("Datum: 2 juni 2025", gap=4)
    d.save()


# ------------------------------------------------------------------ 03 ET3
def et3():
    d = Doc(OUT / "03_ET3_Verweerschrift.pdf")
    d.line("HM Courts & Tribunals Service", "Helvetica-Bold", 11, gap=6)
    d.line("Verweerschrift in de procedure voor de Employment Tribunal (ET3)", "Helvetica-Bold", 13, gap=16)
    for k, v in [("Zaaknummer", "1803442/2025"), ("Eiseres", "Mevrouw Priya Nair"), ("Verweerster", "Calderdale Logistics Limited"),
                 ("Advocaten van verweerster", "Bowater Sykes Solicitors, Leeds"), ("Ontvangen op", "30 juni 2025")]:
        d.line(k, "Helvetica-Bold", 9.5, gap=3); d.line(v, "Helvetica", 10.5, gap=9)
    d.space(4)
    d.para("Verweerster betwist de vorderingen volledig. Volgens verweerster is eiseres ontslagen omdat haar functie werkelijk is vervallen (redundancy), als gevolg van een reorganisatie van de afdeling Operations na een daling van het transportvolume met 22% in het boekjaar tot en met 31 december 2024.")
    d.para("Verweerster betwist dat de keuze voor het ontslag vooraf vaststond en stelt dat een eerlijke en redelijke consultatie heeft plaatsgevonden, met individuele gesprekken op 24 februari en 7 maart 2025.")
    d.para("Verweerster betwist dat de functie van de heer James Thornton gelijk is aan die van eiseres. De heer Thornton vervult een functie in Transport Planning, die lager is ingeschaald en lager wordt betaald.")
    d.para("Verweerster betwist discriminatie op grond van geslacht en wegens zwangerschap en moederschap. De reden voor het ontslag was het vervallen van de functie; het hield op geen enkele manier verband met het geslacht, de zwangerschap of het zwangerschapsverlof van eiseres.")
    d.para("Verweerster erkent de gestelde schade niet en voert aan dat eiseres haar schade onvoldoende heeft beperkt.")
    d.space(6)
    d.para("Ingediend bij de Employment Tribunal te Leeds op grond van de Employment Tribunals Rules of Procedure 2013.", size=9, lead=12)
    d.save()


# ------------------------------------------------------------------ 05 judgment
def judgment():
    d = Doc(OUT / "05_Uitspraak_Tribunal.pdf")
    d.line("Zaaknummer: 1803442/2025", "Helvetica", 10.5, "right", gap=10)
    d.line("EMPLOYMENT TRIBUNAL (ARBEIDSRECHTER) TE LEEDS", "Helvetica-Bold", 12, "center", gap=8)
    d.line("Aan partijen verzonden: 19 maart 2026", "Helvetica", 10.5, "center", gap=12)
    d.line("Samenstelling:", "Helvetica-Bold", 10.5, gap=4)
    d.line("EMPLOYMENT JUDGE HARTLEY (met de leden mevrouw A. Okafor en de heer D. Sutcliffe)", "Helvetica", 10, gap=12)
    parties(d)
    d.line("SCHRIFTELIJKE UITSPRAAK", "Helvetica-Bold", 12.5, "center", gap=14)
    d.heading("Vorderingen en geschilpunten")
    d.para("1.  Eiseres stelt dat zij onredelijk is ontslagen in de zin van de Employment Rights Act 1996 en dat zij direct is gediscrimineerd op grond van geslacht en wegens zwangerschap en moederschap (Sections 13 en 18 Equality Act 2010). Verweerster stelt dat eiseres rechtmatig is ontslagen omdat haar functie is vervallen.")
    d.heading("Vaststaande feiten")
    d.para("2.  Wij hebben eiseres gehoord en, voor verweerster, de heer Marsden en mevrouw Caldwell (HR). Eiseres was een geloofwaardige en consistente getuige. De verklaring van de heer Marsden over de gestelde reorganisatie was vaag en wordt niet gesteund door stukken uit die tijd. De gestelde daling van het volume met 22% blijkt niet uit de cijfers; die laten een grotendeels gelijk volume zien, en begin 2025 kwamen er twee nieuwe klanten bij.")
    d.para("3.  Wij stellen vast dat de heer Thornton is aangenomen als vervanger tijdens het zwangerschapsverlof van eiseres en is aangebleven in een functie die in wezen gelijk is aan de hare. Het onderscheid dat verweerster maakt tussen “Operations Manager” en “Transport Planning” was een etiket zonder inhoud. Van een werkelijk vervallen functie was geen sprake.")
    d.para("4.  Wij stellen vast dat de consultatie slechts voor de vorm werd gevoerd en dat het besluit om eiseres te ontslaan al vaststond voordat die begon. Nu de bewijslast op grond van Section 136 Equality Act 2010 is verschoven, heeft verweerster niet aangetoond dat de behandeling op geen enkele wijze verband hield met het geslacht of het moederschap van eiseres.")
    d.heading("Oordeel")
    d.para("5.  Het ontslag was onredelijk op grond van Section 98 ERA 1996 en automatisch onredelijk op grond van Section 99 ERA 1996. Het ontslag en het inperken van de functie van eiseres vormen directe discriminatie op grond van geslacht (Section 13) en discriminatie wegens zwangerschap en moederschap (Section 18 Equality Act 2010). De vorderingen slagen.")
    d.para("6.  Over de vergoedingen (remedy) wordt, als partijen er niet samen uitkomen, op een volgende zitting beslist. Naar ons voorlopig oordeel past smartengeld in de middelste Vento-schaal, naast een basisvergoeding en een schadevergoeding voor het inkomensverlies van eiseres, onder voorbehoud van schadebeperking.")
    d.heading("BESLISSING")
    for t in ["(1)  De vordering wegens onredelijk ontslag is gegrond en slaagt;",
              "(2)  De vordering wegens directe discriminatie op grond van geslacht (Section 13 Equality Act 2010) slaagt;",
              "(3)  De vordering wegens discriminatie wegens zwangerschap en moederschap (Section 18 Equality Act 2010) slaagt;",
              "(4)  De zitting over de vergoedingen wordt bepaald op 11 mei 2026, tenzij partijen eerder tot een regeling komen."]:
        d.para(t, indent=8, after=4)
    d.space(8)
    d.line("Employment Judge Hartley", "Helvetica-Bold", 10.5)
    d.save()


# ------------------------------------------------------------------ Word files: replace text paragraph by paragraph
def set_text(p, text):
    """Replace a paragraph's text but keep the formatting of its first run."""
    runs = p.runs
    if not runs:
        p.add_run(text); return
    runs[0].text = text
    for r in runs[1:]: r.text = ""


def translate_docx(src, dst, mapping, header=None, footer=None):
    d = docx.Document(src)
    paras = list(d.paragraphs)
    for t in d.tables:
        for row in t.rows:
            for cell in row.cells: paras += cell.paragraphs
    missing = set(mapping)
    for p in paras:
        key = p.text
        if key in mapping:
            set_text(p, mapping[key]); missing.discard(key)
    for s in d.sections:
        for part, m in ((s.header, header or {}), (s.footer, footer or {})):
            for p in part.paragraphs:
                if p.text in m: set_text(p, m[p.text]); missing.discard(p.text)
    left = [p.text for p in paras if p.text.strip() and p.text not in mapping.values()]
    d.save(dst)
    if missing: print("NOT FOUND in", src.name, missing, file=sys.stderr)
    if left: print("UNTRANSLATED in", src.name, left, file=sys.stderr)


def dismissal():
    m = {
        "PRIVATE AND CONFIDENTIAL": "PERSOONLIJK EN VERTROUWELIJK",
        "Ms Priya Nair": "Mevrouw Priya Nair",
        "Our ref: HR/PN/RED-2025": "Ons kenmerk: HR/PN/RED-2025",
        "Dear Priya": "Beste Priya,",
        "Re: Re: Termination of Employment by Reason of Redundancy": "Betreft: Beëindiging van uw dienstverband wegens het vervallen van uw functie",
        "Further to our consultation meetings on 24 February and 7 March 2025, I write to confirm the outcome of the redundancy process affecting the Operations function.":
            "Naar aanleiding van onze consultatiegesprekken van 24 februari en 7 maart 2025 bevestig ik hierbij de uitkomst van de reorganisatie binnen de afdeling Operations.",
        "I regret to inform you that your role of Operations Manager has been identified as redundant following the restructuring of the department. After consultation, the company has concluded that your employment will terminate by reason of redundancy with effect from 31 March 2025.":
            "Helaas moet ik u laten weten dat uw functie van Operations Manager door de reorganisatie van de afdeling is komen te vervallen. Na de consultatie heeft het bedrijf besloten dat uw dienstverband om die reden eindigt per 31 maart 2025.",
        "You will be paid your salary up to the termination date together with payment in lieu of accrued but untaken holiday and a statutory redundancy payment based on your length of service. You will also be paid in lieu of your contractual notice period.":
            "U ontvangt uw salaris tot de einddatum, een uitbetaling van opgebouwde maar niet opgenomen vakantiedagen en een wettelijke ontslagvergoeding op basis van uw dienstjaren. Uw contractuele opzegtermijn wordt eveneens uitbetaald.",
        "You have the right to appeal this decision in writing within seven days of the date of this letter. Any appeal should be addressed to me and will be heard by a manager not previously involved in the process.":
            "U kunt binnen zeven dagen na de datum van deze brief schriftelijk bezwaar maken tegen dit besluit. Stuur uw bezwaar aan mij; het wordt behandeld door een leidinggevende die niet eerder bij deze procedure betrokken was.",
        "I would like to thank you for your contribution to the company over the past seven years and wish you well for the future.":
            "Ik dank u voor uw inzet voor het bedrijf in de afgelopen zeven jaar en wens u veel succes voor de toekomst.",
        "Yours sincerely": "Met vriendelijke groet,",
        "Calderdale Logistics Limited, registered in England and Wales No 06214477.": "Calderdale Logistics Limited, ingeschreven in Engeland en Wales onder nr. 06214477.",
    }
    d = docx.Document(SRC / "09_Dismissal_Letter.docx")
    for p in d.paragraphs:
        t = p.text
        if t.startswith("Tel:"): m[t] = t.replace("Tel:", "Tel.:")
        if t.startswith("Company No"): m[t] = t.replace("Company No", "KvK-nr. (VK)")
        if t.strip().endswith("2025") and len(t) < 20: m[t] = t.replace(" March", " maart")
        if "Operations Director" in t and "\n" in t: m[t] = t
    translate_docx(SRC / "09_Dismissal_Letter.docx", OUT / "09_Ontslagbrief.docx", m)


def settlement():
    m = {
        "WITHOUT PREJUDICE SAVE AS TO COSTS": "ZONDER NADELIGE ERKENNING, BEHOUDENS DE PROCESKOSTEN",
        "12 January 2026": "12 januari 2026",
        "Our ref: AV/HR/NAIR/0318": "Ons kenmerk: AV/HR/NAIR/0318",
        "Your ref: BS/CLL/2291": "Uw kenmerk: BS/CLL/2291",
        "Dear Sirs": "Geachte heer, mevrouw,",
        "Re: Re: Nair v Calderdale Logistics Limited - Case No 1803442/2025": "Betreft: Nair / Calderdale Logistics Limited, zaaknr. 1803442/2025",
        "We act for Ms Priya Nair, the Claimant in the above proceedings. We write on a without prejudice basis to invite your client to settle this matter in advance of the final hearing listed for February 2026.":
            "Wij treden op voor mevrouw Priya Nair, eiseres in bovengenoemde procedure. Zonder nadelige erkenning nodigen wij uw cliënt uit deze zaak te schikken vóór de zitting die voor februari 2026 is gepland.",
        "Our client's claims of unfair dismissal and discrimination are strong. The contemporaneous documents do not support a genuine redundancy, and the retention of Mr Thornton, recruited to cover our client's maternity leave, in her former role is striking. The burden of proof under section 136 of the Equality Act 2010 will shift to your client.":
            "De vorderingen van onze cliënte wegens onredelijk ontslag en discriminatie staan sterk. De stukken uit die tijd wijzen niet op een werkelijk vervallen functie, en het is opvallend dat de heer Thornton, aangenomen als vervanger tijdens haar zwangerschapsverlof, in haar vroegere functie is aangebleven. De bewijslast op grond van section 136 van de Equality Act 2010 zal naar uw cliënt verschuiven.",
        "Our client's schedule of loss totals GBP 71,640, comprising a basic award, loss of earnings to date and continuing, and injury to feelings in the middle Vento band, before interest and any uplift for failure to follow the Acas Code.":
            "Het schadeoverzicht van onze cliënte komt uit op GBP 71.640: een basisvergoeding, het inkomensverlies tot nu toe en in de toekomst, en smartengeld in de middelste Vento-schaal, vóór rente en een eventuele verhoging wegens het niet volgen van de Acas Code.",
        "Our client is willing to settle the entirety of her claims for GBP 52,000 inclusive, by way of a COT3 agreement through Acas, on terms to be agreed. This offer remains open for 21 days, after which our client will rely on this letter on the question of costs.":
            "Onze cliënte is bereid al haar vorderingen te schikken voor GBP 52.000 in totaal, via een COT3-overeenkomst bij Acas, op nader overeen te komen voorwaarden. Dit aanbod staat 21 dagen open; daarna zal onze cliënte zich voor de proceskosten op deze brief beroepen.",
        "We look forward to hearing from you.": "Wij zien uw reactie graag tegemoet.",
        "Yours faithfully": "Hoogachtend,",
        "Regulated by the Solicitors Regulation Authority": "Onder toezicht van de Solicitors Regulation Authority",
    }
    translate_docx(SRC / "10_Letter_Settlement.docx", OUT / "10_Schikkingsvoorstel.docx", m)


def template():
    m = {
        "PRIVATE AND CONFIDENTIAL": "PERSOONLIJK EN VERTROUWELIJK",
        "Ms Priya Nair": "Mevrouw Priya Nair",
        "14 April 2025": "14 april 2025",
        "Our ref: AV/HR/NAIR/0318": "Ons kenmerk: AV/HR/NAIR/0318",
        "Your ref: -": "Uw kenmerk: -",
        "Dear Ms Nair": "Geachte mevrouw Nair,",
        "Claim for unfair dismissal against Calderdale Logistics Limited": "Vordering wegens onredelijk ontslag tegen Calderdale Logistics Limited",
        "Thank you for attending our offices on 10 April 2025 to give us your initial instructions. This letter confirms the advice I gave you at that meeting and sets out the next steps. Your employment ended by reason of an asserted redundancy with effect from 31 March 2025, and you have seven years of continuous service as Operations Manager.":
            "Dank u dat u op 10 april 2025 op ons kantoor bent langsgekomen om ons over uw zaak te informeren. In deze brief bevestig ik het advies uit dat gesprek en zet ik de volgende stappen op een rij. Uw dienstverband is per 31 maart 2025 geëindigd omdat uw functie zou zijn vervallen; u was zeven jaar onafgebroken in dienst als Operations Manager.",
        "On your account of events you have the qualifying service to bring an ordinary unfair dismissal claim, and there are also arguments open to you arising from your return from maternity leave in January 2025. We will need to test that account against the documents before we advise you on prospects, so please send us your contract of employment, your recent payslips, your last two appraisals and the full redundancy correspondence.":
            "Op basis van uw verhaal bent u lang genoeg in dienst om een vordering wegens onredelijk ontslag in te stellen, en ook uw terugkeer van zwangerschapsverlof in januari 2025 biedt argumenten. Voordat wij u over uw kansen adviseren, moeten wij uw verhaal toetsen aan de stukken. Stuurt u ons daarom uw arbeidsovereenkomst, uw recente loonstroken, uw laatste twee beoordelingen en de volledige correspondentie over het ontslag.",
        "Tribunal time limits are short and are applied strictly. We will start Acas early conciliation this week so that the primary three month limit running from 31 March 2025 is protected, and we have diarised the limitation date. Please telephone me on the direct dial below if anything in this letter is unclear or if your circumstances change.":
            "De termijnen bij de Employment Tribunal zijn kort en worden streng toegepast. Wij starten deze week de bemiddeling via Acas, zodat de termijn van drie maanden vanaf 31 maart 2025 veilig is, en wij hebben de uiterste datum genoteerd. Belt u mij gerust op het directe nummer hieronder als iets in deze brief onduidelijk is of als uw situatie verandert.",
        "Yours sincerely": "Met vriendelijke groet,",
        "Partner, Employment": "Partner, Arbeidsrecht",
        "Direct dial 0113 246 8814   |   adam.frith@aldridgevine.example": "Direct 0113 246 8814   |   adam.frith@aldridgevine.example",
    }
    header = {"Minerva House, 29 East Parade, Leeds LS1 5PS   |   T 0113 246 8800   |   DX 26411 Leeds Park Square   |   www.aldridgevine.example":
              "Minerva House, 29 East Parade, Leeds LS1 5PS   |   T 0113 246 8800   |   DX 26411 Leeds Park Square   |   www.aldridgevine.example"}
    footer = {"Aldridge Vine LLP is a limited liability partnership registered in England and Wales, authorised and regulated by the Solicitors Regulation Authority (SRA No. 000000). Minerva House, 29 East Parade, Leeds LS1 5PS.":
              "Aldridge Vine LLP is een limited liability partnership, ingeschreven in Engeland en Wales, onder toezicht van de Solicitors Regulation Authority (SRA-nr. 000000). Minerva House, 29 East Parade, Leeds LS1 5PS.",
              "Page 1 of 1": "Pagina 1 van 1"}
    translate_docx(TPL, OUT / "Aldridge_Vine_Briefsjabloon.docx", m, header, footer)


# ------------------------------------------------------------------ 20 email
def email():
    body = ("Beste Priya,\n\nWelkom terug. Fijn dat we je op 13 januari weer zien.\n\n"
            "Tijdens je afwezigheid is de opzet van het Operations-team veranderd, en James heeft het dagelijkse werk op het depot "
            "en de routeplanning overgenomen. Na je terugkeer richt je je in eerste instantie op leveranciersbeheer, rapportages "
            "en een paar losse projecten.\n\n"
            "Geoff wil in je eerste week graag met je om tafel om het team en de verdere planning door te nemen.\n\n"
            "Hartelijke groet,\nSandra Okeke\nHR, Calderdale Logistics Limited")
    msg = EmailMessage()
    msg["From"] = "Calderdale Logistics HR <hr@calderdalelogistics.co.uk>"
    msg["To"] = "Priya Nair <priya.nair@outlook.com>"
    msg["Subject"] = "Re: Terugkeer na zwangerschapsverlof - 13 januari 2025"
    msg["Date"] = format_datetime(datetime(2025, 1, 8, 16, 20, tzinfo=timezone.utc))
    msg["Reply-To"] = "hr@calderdalelogistics.co.uk"
    msg["X-Mailer"] = "Microsoft Outlook 16.0"
    msg["Message-ID"] = "<639336.6079@calderdalelogistics.co.uk>"
    msg.set_content(body)
    html = "<html><head><meta charset=\"utf-8\"></head><body style=\"font-family: Calibri, Arial, sans-serif; font-size: 11pt;\">" + body.replace("\n", "<br>\n") + "</body></html>"
    msg.add_alternative(html, subtype="html")
    (OUT / "20_Email_HR_Terugkeer.eml").write_bytes(bytes(msg))


if __name__ == "__main__":
    et1(); et3(); judgment(); dismissal(); settlement(); template(); email()
    for f in sorted(OUT.iterdir()): print(f.name, f.stat().st_size)
