"""German versions of the six Nair case files and the Aldridge Vine letter template (Academy 1.1 German).

Same case, same people, same facts and dates as the English mock case, translated into German.
UK statute names stay in English (as German legal translations of UK law usually keep them).
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
OUT = HERE / "demo-files-de"
SRC = pathlib.Path.home() / "Desktop/Andri/2 - Product/Demo Files/Mock Case/employment"
TPL = pathlib.Path.home() / "Desktop/Andri/Motion Graphics/projects/2026-10-12-academy-7-1-specialists/demo-files/Aldridge_Vine_Letter_Template.docx"
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
        self.c.setFont("Helvetica", 8.5); self.c.drawCentredString(self.W / 2, 14 * mm, f"Seite {self.page}")

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
    d.line("ZWISCHEN:", "Helvetica-Bold", 10.5, "center", gap=10)
    d.line("FRAU PRIYA NAIR", "Helvetica-Bold", 11, "center", gap=4)
    d.line("Klägerin", "Helvetica", 10.5, "right", gap=6)
    d.line(DASH, "Helvetica", 8, "center", gap=8)
    d.line("CALDERDALE LOGISTICS LIMITED", "Helvetica-Bold", 11, "center", gap=4)
    d.line("Beklagte", "Helvetica", 10.5, "right", gap=6)
    d.line(DASH, "Helvetica", 8, "center", gap=12)


# ------------------------------------------------------------------ 01 ET1
def et1():
    d = Doc(OUT / "01_ET1_Klagebegründung.pdf")
    d.line("VOR DEM EMPLOYMENT TRIBUNAL (ARBEITSGERICHT) LEEDS", "Helvetica-Bold", 12, "center", gap=8)
    d.line("Aktenzeichen: 1803442/2025", "Helvetica", 10.5, "right", gap=14)
    parties(d)
    d.line("KLAGEBEGRÜNDUNG (ET1)", "Helvetica-Bold", 12.5, "center", gap=14)
    d.heading("Arbeitsverhältnis")
    d.para("1.  Die Klägerin war vom 4. Januar 2018 bis zu ihrer Entlassung mit Wirkung zum 31. März 2025 bei der Beklagten als Operations Manager beschäftigt. Ihr Bruttojahresgehalt betrug 58.000 GBP.")
    d.para("2.  Die Klägerin war über sieben Jahre ununterbrochen beschäftigt und zu allen maßgeblichen Zeitpunkten Arbeitnehmerin im Sinne von Section 230 des Employment Rights Act 1996.")
    d.heading("Mutterschaftsurlaub")
    d.para("3.  Die Klägerin trat am 1. Mai 2024 ihren Mutterschaftsurlaub an und brachte am 19. Mai 2024 ihren Sohn zur Welt. Sie teilte der Beklagten mit, dass sie am 6. Januar 2025 an ihren Arbeitsplatz zurückkehren werde.")
    d.para("4.  Während des Mutterschaftsurlaubs stellte die Beklagte Herrn James Thornton als Vertretung für die Stelle der Klägerin ein. Bei ihrer Rückkehr stellte die Klägerin fest, dass Herr Thornton weiterbeschäftigt wurde und ihre Aufgaben erheblich beschnitten worden waren.")
    d.heading("Entlassung")
    d.para("5.  Am 17. Februar 2025 wurde der Klägerin mitgeteilt, dass ihre Stelle „von einem betriebsbedingten Wegfall bedroht“ sei. Es folgte ein Konsultationsverfahren, das nach Auffassung der Klägerin nur zum Schein geführt wurde. Am 14. März 2025 erhielt sie die Kündigung wegen Wegfalls des Arbeitsplatzes (redundancy) mit Wirkung zum 31. März 2025.")
    d.para("6.  Herr Thornton, der während des Mutterschaftsurlaubs der Klägerin eingestellt worden war, wurde in einer im Wesentlichen identischen Funktion weiterbeschäftigt. Ein echter betriebsbedingter Wegfall des Arbeitsplatzes lag nicht vor.")
    d.heading("Ungerechtfertigte Kündigung")
    d.para("7.  Die Kündigung war ungerechtfertigt (unfair) im Sinne der Sections 98 und 99 des Employment Rights Act 1996. Es lag kein echter Wegfall des Arbeitsplatzes vor; die Auswahl stand von vornherein fest, und die Konsultation wurde nur zum Schein geführt. Darüber hinaus war die Kündigung nach Section 99 ERA 1996 und Regulation 20 der Maternity and Parental Leave etc Regulations 1999 automatisch ungerechtfertigt, da sie mit dem Mutterschaftsurlaub der Klägerin zusammenhing.")
    d.heading("Diskriminierung")
    d.para("8.  Die Kündigung und die Beschneidung der Aufgaben der Klägerin stellen eine unmittelbare Diskriminierung wegen des Geschlechts nach Section 13 des Equality Act 2010 sowie eine Diskriminierung wegen Schwangerschaft und Mutterschaft nach Section 18 des Equality Act 2010 dar. Die Klägerin stützt sich auf die Weiterbeschäftigung eines männlichen Vergleichsarbeitnehmers, Herrn Thornton, der zu ihrer Vertretung während des Mutterschaftsurlaubs eingestellt wurde.")
    d.heading("Ansprüche")
    d.para("9.  Die Klägerin verlangt eine Grundabfindung (basic award), eine Ausgleichszahlung (compensatory award) und eine Entschädigung für immaterielle Schäden (injury to feelings) im mittleren Vento-Band, jeweils zuzüglich Zinsen. Eine Schadensaufstellung (schedule of loss) ist beigefügt.")
    d.heading("DIE KLÄGERIN BEANTRAGT:")
    for t in ["(1)  festzustellen, dass die Klägerin unter Verstoß gegen den Employment Rights Act 1996 ungerechtfertigt entlassen wurde;",
              "(2)  festzustellen, dass eine unmittelbare Diskriminierung wegen des Geschlechts nach Section 13 des Equality Act 2010 vorliegt;",
              "(3)  festzustellen, dass eine Diskriminierung wegen Schwangerschaft und Mutterschaft nach Section 18 des Equality Act 2010 vorliegt;",
              "(4)  eine Entschädigung einschließlich der Entschädigung für immaterielle Schäden und Zinsen;",
              "(5)  die Kosten des Verfahrens."]:
        d.para(t, indent=8, after=4)
    d.space(10)
    d.heading("WAHRHEITSERKLÄRUNG")
    d.para("Die Klägerin versichert, dass die in dieser Klagebegründung dargelegten Tatsachen wahr sind. Ich bin von der Klägerin ordnungsgemäß bevollmächtigt, diese Erklärung zu unterzeichnen.")
    d.line("Hester Ramsbottom", "Helvetica-Bold", 10.5, gap=4)
    d.line("Park Lane Chambers, Leeds", gap=4)
    d.line("Datum: 2. Juni 2025", gap=4)
    d.save()


# ------------------------------------------------------------------ 03 ET3
def et3():
    d = Doc(OUT / "03_ET3_Klageerwiderung.pdf")
    d.line("HM Courts & Tribunals Service", "Helvetica-Bold", 11, gap=6)
    d.line("Klageerwiderung im Verfahren vor dem Employment Tribunal (ET3)", "Helvetica-Bold", 13, gap=16)
    for k, v in [("Aktenzeichen", "1803442/2025"), ("Klägerin", "Frau Priya Nair"), ("Beklagte", "Calderdale Logistics Limited"),
                 ("Prozessbevollmächtigte der Beklagten", "Bowater Sykes Solicitors, Leeds"), ("Eingegangen am", "30. Juni 2025")]:
        d.line(k, "Helvetica-Bold", 9.5, gap=3); d.line(v, "Helvetica", 10.5, gap=9)
    d.space(4)
    d.para("Die Beklagte tritt der Klage in vollem Umfang entgegen. Die Beklagte trägt vor, dass die Klägerin aus einem echten betriebsbedingten Grund (redundancy) entlassen wurde, der sich aus einer Umstrukturierung des Bereichs Operations nach einem Rückgang des Transportvolumens um 22 % im Geschäftsjahr zum 31. Dezember 2024 ergab.")
    d.para("Die Beklagte bestreitet, dass die Auswahl für den Stellenabbau von vornherein feststand, und trägt vor, dass ein faires und angemessenes Konsultationsverfahren durchgeführt wurde, einschließlich individueller Konsultationsgespräche am 24. Februar und 7. März 2025.")
    d.para("Die Beklagte bestreitet, dass die von Herrn James Thornton besetzte Stelle mit der Stelle der Klägerin identisch war. Herr Thornton hat eine Stelle im Bereich Transport Planning inne, die niedriger eingestuft und vergütet ist.")
    d.para("Die Beklagte bestreitet eine Diskriminierung wegen des Geschlechts sowie wegen Schwangerschaft und Mutterschaft. Grund für die Kündigung war der Wegfall des Arbeitsplatzes; sie stand in keinerlei Zusammenhang mit dem Geschlecht, der Schwangerschaft oder dem Mutterschaftsurlaub der Klägerin.")
    d.para("Die Beklagte bestreitet die geltend gemachten Schäden mit Nichtwissen und trägt vor, dass die Klägerin ihrer Pflicht zur Schadensminderung nicht nachgekommen ist.")
    d.space(6)
    d.para("Eingereicht beim Employment Tribunal Leeds nach den Employment Tribunals Rules of Procedure 2013.", size=9, lead=12)
    d.save()


# ------------------------------------------------------------------ 05 judgment
def judgment():
    d = Doc(OUT / "05_Urteil_Arbeitsgericht.pdf")
    d.line("Aktenzeichen: 1803442/2025", "Helvetica", 10.5, "right", gap=10)
    d.line("VOR DEM EMPLOYMENT TRIBUNAL (ARBEITSGERICHT) LEEDS", "Helvetica-Bold", 12, "center", gap=8)
    d.line("An die Parteien versandt: 19. März 2026", "Helvetica", 10.5, "center", gap=12)
    d.line("Besetzung:", "Helvetica-Bold", 10.5, gap=4)
    d.line("EMPLOYMENT JUDGE HARTLEY (mit den Beisitzern Frau A. Okafor und Herrn D. Sutcliffe)", "Helvetica", 10, gap=12)
    parties(d)
    d.line("SCHRIFTLICHES URTEIL", "Helvetica-Bold", 12.5, "center", gap=14)
    d.heading("Klagegegenstand und Streitfragen")
    d.para("1.  Die Klägerin macht eine ungerechtfertigte Kündigung nach dem Employment Rights Act 1996 sowie eine unmittelbare Diskriminierung wegen des Geschlechts und eine Diskriminierung wegen Schwangerschaft und Mutterschaft nach den Sections 13 und 18 des Equality Act 2010 geltend. Die Beklagte trägt vor, die Klägerin sei wegen Wegfalls ihres Arbeitsplatzes rechtmäßig entlassen worden.")
    d.heading("Tatsächliche Feststellungen")
    d.para("2.  Wir haben die Klägerin sowie für die Beklagte Herrn Marsden und Frau Caldwell (Personalabteilung) angehört. Die Klägerin war eine glaubwürdige und widerspruchsfreie Zeugin. Die Aussage von Herrn Marsden zur behaupteten Umstrukturierung war vage und wird durch keine zeitnah erstellten Unterlagen gestützt. Der behauptete Rückgang des Volumens um 22 % wird durch die Zahlen nicht belegt; diese zeigen ein weitgehend unverändertes Volumen, und Anfang 2025 kamen zwei neue Kunden hinzu.")
    d.para("3.  Wir stellen fest, dass Herr Thornton als Vertretung während des Mutterschaftsurlaubs der Klägerin eingestellt und in einer Funktion weiterbeschäftigt wurde, die der Funktion der Klägerin im Wesentlichen entspricht. Die von der Beklagten getroffene Unterscheidung zwischen „Operations Manager“ und „Transport Planning“ war ein Etikett ohne Inhalt. Ein echter Wegfall des Arbeitsplatzes lag nicht vor.")
    d.para("4.  Wir stellen fest, dass die Konsultation nur zum Schein geführt wurde und die Entscheidung zur Entlassung der Klägerin bereits vor ihrem Beginn gefallen war. Nachdem sich die Beweislast nach Section 136 des Equality Act 2010 verlagert hat, hat die Beklagte nicht dargelegt, dass die Behandlung in keiner Weise auf dem Geschlecht oder der Mutterschaft der Klägerin beruhte.")
    d.heading("Ergebnis")
    d.para("5.  Die Kündigung war nach Section 98 ERA 1996 ungerechtfertigt und nach Section 99 ERA 1996 automatisch ungerechtfertigt. Die Kündigung und die Beschneidung der Funktion der Klägerin stellen eine unmittelbare Diskriminierung wegen des Geschlechts nach Section 13 und eine Diskriminierung wegen Schwangerschaft und Mutterschaft nach Section 18 des Equality Act 2010 dar. Die Klagen haben Erfolg.")
    d.para("6.  Über die Ansprüche (remedy) wird, sofern sich die Parteien nicht einigen, in einer weiteren Verhandlung entschieden. Nach unserer vorläufigen Einschätzung ist eine Entschädigung für immaterielle Schäden im mittleren Vento-Band angemessen, zusammen mit einer Grundabfindung und einer Ausgleichszahlung für den Verdienstausfall der Klägerin, vorbehaltlich der Schadensminderung.")
    d.heading("TENOR")
    for t in ["(1)  Die Klage wegen ungerechtfertigter Kündigung ist begründet und hat Erfolg;",
              "(2)  Die Klage wegen unmittelbarer Diskriminierung wegen des Geschlechts nach Section 13 des Equality Act 2010 hat Erfolg;",
              "(3)  Die Klage wegen Diskriminierung wegen Schwangerschaft und Mutterschaft nach Section 18 des Equality Act 2010 hat Erfolg;",
              "(4)  Termin zur Verhandlung über die Ansprüche wird auf den 11. Mai 2026 bestimmt, sofern keine Einigung erzielt wird."]:
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
        "PRIVATE AND CONFIDENTIAL": "PERSÖNLICH UND VERTRAULICH",
        "Ms Priya Nair": "Frau Priya Nair",
        "Our ref: HR/PN/RED-2025": "Unser Zeichen: HR/PN/RED-2025",
        "Dear Priya": "Sehr geehrte Frau Nair,",
        "Re: Re: Termination of Employment by Reason of Redundancy": "Betreff: Beendigung des Arbeitsverhältnisses aus betriebsbedingten Gründen",
        "Further to our consultation meetings on 24 February and 7 March 2025, I write to confirm the outcome of the redundancy process affecting the Operations function.":
            "im Anschluss an unsere Konsultationsgespräche vom 24. Februar und 7. März 2025 bestätige ich Ihnen hiermit das Ergebnis des Verfahrens zum Stellenabbau im Bereich Operations.",
        "I regret to inform you that your role of Operations Manager has been identified as redundant following the restructuring of the department. After consultation, the company has concluded that your employment will terminate by reason of redundancy with effect from 31 March 2025.":
            "Leider muss ich Ihnen mitteilen, dass Ihre Stelle als Operations Manager im Zuge der Umstrukturierung der Abteilung weggefallen ist. Nach Abschluss der Konsultation hat das Unternehmen entschieden, dass Ihr Arbeitsverhältnis aus betriebsbedingten Gründen mit Wirkung zum 31. März 2025 endet.",
        "You will be paid your salary up to the termination date together with payment in lieu of accrued but untaken holiday and a statutory redundancy payment based on your length of service. You will also be paid in lieu of your contractual notice period.":
            "Sie erhalten Ihr Gehalt bis zum Beendigungsdatum, eine Abgeltung für entstandenen, aber nicht genommenen Urlaub sowie eine gesetzliche Abfindung entsprechend Ihrer Betriebszugehörigkeit. Ihre vertragliche Kündigungsfrist wird ebenfalls finanziell abgegolten.",
        "You have the right to appeal this decision in writing within seven days of the date of this letter. Any appeal should be addressed to me and will be heard by a manager not previously involved in the process.":
            "Sie können gegen diese Entscheidung innerhalb von sieben Tagen ab dem Datum dieses Schreibens schriftlich Widerspruch einlegen. Bitte richten Sie einen Widerspruch an mich; er wird von einer Führungskraft geprüft, die bisher nicht an dem Verfahren beteiligt war.",
        "I would like to thank you for your contribution to the company over the past seven years and wish you well for the future.":
            "Ich danke Ihnen für Ihren Einsatz für das Unternehmen in den vergangenen sieben Jahren und wünsche Ihnen für die Zukunft alles Gute.",
        "Yours sincerely": "Mit freundlichen Grüßen",
        "Calderdale Logistics Limited, registered in England and Wales No 06214477.": "Calderdale Logistics Limited, eingetragen in England und Wales unter Nr. 06214477.",
    }
    # dates and address lines are filled in below once we see them
    d = docx.Document(SRC / "09_Dismissal_Letter.docx")
    for p in d.paragraphs:
        t = p.text
        if t.startswith("Tel:"): m[t] = t.replace("Tel:", "Tel.:")
        if t.startswith("Company No"): m[t] = t.replace("Company No", "Handelsregister-Nr.")
        if t.strip().endswith("2025") and len(t) < 20: m[t] = t.replace(" March", ". März")
        if "Operations Director" in t and "\n" in t: m[t] = t
    translate_docx(SRC / "09_Dismissal_Letter.docx", OUT / "09_Kündigungsschreiben.docx", m)


def settlement():
    m = {
        "WITHOUT PREJUDICE SAVE AS TO COSTS": "OHNE PRÄJUDIZ, VORBEHALTLICH DER KOSTENFRAGE",
        "12 January 2026": "12. Januar 2026",
        "Our ref: AV/HR/NAIR/0318": "Unser Zeichen: AV/HR/NAIR/0318",
        "Your ref: BS/CLL/2291": "Ihr Zeichen: BS/CLL/2291",
        "Dear Sirs": "Sehr geehrte Damen und Herren,",
        "Re: Re: Nair v Calderdale Logistics Limited - Case No 1803442/2025": "Betreff: Nair ./. Calderdale Logistics Limited, Az. 1803442/2025",
        "We act for Ms Priya Nair, the Claimant in the above proceedings. We write on a without prejudice basis to invite your client to settle this matter in advance of the final hearing listed for February 2026.":
            "wir vertreten Frau Priya Nair, die Klägerin im oben genannten Verfahren. Ohne Präjudiz regen wir an, dass Ihre Mandantin die Sache vor der für Februar 2026 angesetzten Hauptverhandlung vergleichsweise erledigt.",
        "Our client's claims of unfair dismissal and discrimination are strong. The contemporaneous documents do not support a genuine redundancy, and the retention of Mr Thornton, recruited to cover our client's maternity leave, in her former role is striking. The burden of proof under section 136 of the Equality Act 2010 will shift to your client.":
            "Die Ansprüche unserer Mandantin wegen ungerechtfertigter Kündigung und Diskriminierung sind gut begründet. Die zeitnah erstellten Unterlagen stützen keinen echten Wegfall des Arbeitsplatzes, und die Weiterbeschäftigung von Herrn Thornton, der als Vertretung während des Mutterschaftsurlaubs unserer Mandantin eingestellt wurde, auf ihrer früheren Stelle ist auffällig. Die Beweislast nach Section 136 des Equality Act 2010 wird sich auf Ihre Mandantin verlagern.",
        "Our client's schedule of loss totals GBP 71,640, comprising a basic award, loss of earnings to date and continuing, and injury to feelings in the middle Vento band, before interest and any uplift for failure to follow the Acas Code.":
            "Die Schadensaufstellung unserer Mandantin beläuft sich auf insgesamt 71.640 GBP. Sie umfasst eine Grundabfindung, den bisherigen und künftigen Verdienstausfall sowie eine Entschädigung für immaterielle Schäden im mittleren Vento-Band, zuzüglich Zinsen und eines etwaigen Aufschlags wegen Nichtbeachtung des Acas Code.",
        "Our client is willing to settle the entirety of her claims for GBP 52,000 inclusive, by way of a COT3 agreement through Acas, on terms to be agreed. This offer remains open for 21 days, after which our client will rely on this letter on the question of costs.":
            "Unsere Mandantin ist bereit, sämtliche Ansprüche gegen Zahlung von pauschal 52.000 GBP im Wege einer COT3-Vereinbarung über Acas zu noch abzustimmenden Bedingungen zu erledigen. Dieses Angebot gilt 21 Tage; danach wird sich unsere Mandantin in der Kostenfrage auf dieses Schreiben berufen.",
        "We look forward to hearing from you.": "Wir sehen Ihrer Antwort entgegen.",
        "Yours faithfully": "Mit freundlichen Grüßen",
        "Regulated by the Solicitors Regulation Authority": "Zugelassen und beaufsichtigt durch die Solicitors Regulation Authority",
    }
    translate_docx(SRC / "10_Letter_Settlement.docx", OUT / "10_Vergleichsangebot.docx", m)


def template():
    m = {
        "PRIVATE AND CONFIDENTIAL": "PERSÖNLICH UND VERTRAULICH",
        "Ms Priya Nair": "Frau Priya Nair",
        "14 April 2025": "14. April 2025",
        "Our ref: AV/HR/NAIR/0318": "Unser Zeichen: AV/HR/NAIR/0318",
        "Your ref: -": "Ihr Zeichen: -",
        "Dear Ms Nair": "Sehr geehrte Frau Nair,",
        "Claim for unfair dismissal against Calderdale Logistics Limited": "Klage wegen ungerechtfertigter Kündigung gegen Calderdale Logistics Limited",
        "Thank you for attending our offices on 10 April 2025 to give us your initial instructions. This letter confirms the advice I gave you at that meeting and sets out the next steps. Your employment ended by reason of an asserted redundancy with effect from 31 March 2025, and you have seven years of continuous service as Operations Manager.":
            "vielen Dank, dass Sie uns am 10. April 2025 in unserer Kanzlei aufgesucht und uns Ihre ersten Informationen gegeben haben. Mit diesem Schreiben bestätige ich die Beratung aus unserem Gespräch und lege die nächsten Schritte dar. Ihr Arbeitsverhältnis endete wegen eines behaupteten Wegfalls Ihres Arbeitsplatzes mit Wirkung zum 31. März 2025; Sie waren sieben Jahre ununterbrochen als Operations Manager beschäftigt.",
        "On your account of events you have the qualifying service to bring an ordinary unfair dismissal claim, and there are also arguments open to you arising from your return from maternity leave in January 2025. We will need to test that account against the documents before we advise you on prospects, so please send us your contract of employment, your recent payslips, your last two appraisals and the full redundancy correspondence.":
            "Nach Ihrer Schilderung erfüllen Sie die erforderliche Beschäftigungsdauer für eine Klage wegen ungerechtfertigter Kündigung; zudem ergeben sich Argumente aus Ihrer Rückkehr aus dem Mutterschaftsurlaub im Januar 2025. Bevor wir die Erfolgsaussichten beurteilen, müssen wir Ihre Schilderung anhand der Unterlagen prüfen. Bitte senden Sie uns daher Ihren Arbeitsvertrag, Ihre letzten Gehaltsabrechnungen, Ihre letzten beiden Leistungsbeurteilungen und den vollständigen Schriftverkehr zur Kündigung.",
        "Tribunal time limits are short and are applied strictly. We will start Acas early conciliation this week so that the primary three month limit running from 31 March 2025 is protected, and we have diarised the limitation date. Please telephone me on the direct dial below if anything in this letter is unclear or if your circumstances change.":
            "Die Fristen vor dem Employment Tribunal sind kurz und werden streng angewendet. Wir leiten noch diese Woche das Acas-Schlichtungsverfahren ein, damit die dreimonatige Frist ab dem 31. März 2025 gewahrt bleibt, und haben den Fristablauf notiert. Rufen Sie mich bitte unter der unten genannten Durchwahl an, wenn in diesem Schreiben etwas unklar ist oder sich Ihre Umstände ändern.",
        "Yours sincerely": "Mit freundlichen Grüßen",
        "Partner, Employment": "Partner, Arbeitsrecht",
        "Direct dial 0113 246 8814   |   adam.frith@aldridgevine.example": "Durchwahl 0113 246 8814   |   adam.frith@aldridgevine.example",
    }
    header = {"Minerva House, 29 East Parade, Leeds LS1 5PS   |   T 0113 246 8800   |   DX 26411 Leeds Park Square   |   www.aldridgevine.example":
              "Minerva House, 29 East Parade, Leeds LS1 5PS   |   Tel. 0113 246 8800   |   DX 26411 Leeds Park Square   |   www.aldridgevine.example"}
    footer = {"Aldridge Vine LLP is a limited liability partnership registered in England and Wales, authorised and regulated by the Solicitors Regulation Authority (SRA No. 000000). Minerva House, 29 East Parade, Leeds LS1 5PS.":
              "Aldridge Vine LLP ist eine in England und Wales eingetragene Limited Liability Partnership, zugelassen und beaufsichtigt durch die Solicitors Regulation Authority (SRA-Nr. 000000). Minerva House, 29 East Parade, Leeds LS1 5PS.",
              "Page 1 of 1": "Seite 1 von 1"}
    translate_docx(TPL, OUT / "Aldridge_Vine_Briefvorlage.docx", m, header, footer)


# ------------------------------------------------------------------ 20 email
def email():
    body = ("Liebe Priya,\n\nwillkommen zurück. Wir freuen uns, Sie am 13. Januar wiederzusehen.\n\n"
            "Während Ihrer Abwesenheit hat sich die Struktur des Operations-Teams weiterentwickelt, und James hat das Tagesgeschäft "
            "des Depots und die Routenplanung übernommen. Nach Ihrer Rückkehr liegt Ihr Schwerpunkt zunächst auf der Lieferantenverwaltung, "
            "dem Berichtswesen und einzelnen Projekten.\n\n"
            "Geoff möchte sich in Ihrer ersten Woche mit Ihnen treffen, um über das Team und die weitere Planung zu sprechen.\n\n"
            "Viele Grüße\nSandra Okeke\nPersonalabteilung, Calderdale Logistics Limited")
    msg = EmailMessage()
    msg["From"] = "Calderdale Logistics HR <hr@calderdalelogistics.co.uk>"
    msg["To"] = "Priya Nair <priya.nair@outlook.com>"
    msg["Subject"] = "Re: Rückkehr aus dem Mutterschaftsurlaub - 13. Januar 2025"
    msg["Date"] = format_datetime(datetime(2025, 1, 8, 16, 20, tzinfo=timezone.utc))
    msg["Reply-To"] = "hr@calderdalelogistics.co.uk"
    msg["X-Mailer"] = "Microsoft Outlook 16.0"
    msg["Message-ID"] = "<639336.6079@calderdalelogistics.co.uk>"
    msg.set_content(body)
    html = "<html><head><meta charset=\"utf-8\"></head><body style=\"font-family: Calibri, Arial, sans-serif; font-size: 11pt;\">" + body.replace("\n", "<br>\n") + "</body></html>"
    msg.add_alternative(html, subtype="html")
    (OUT / "20_Email_HR_Rückkehr.eml").write_bytes(bytes(msg))


if __name__ == "__main__":
    et1(); et3(); judgment(); dismissal(); settlement(); template(); email()
    for f in sorted(OUT.iterdir()): print(f.name, f.stat().st_size)
