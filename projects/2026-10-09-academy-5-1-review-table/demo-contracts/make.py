# Six fictional supplier contracts for the 5.1 demo matter (client: Pennbridge Foods Limited).
import json, pathlib
here = pathlib.Path(__file__).parent
C = [
 dict(file="Supply_Agreement_Northvale_Packaging", title="SUPPLY AGREEMENT", supplier="Northvale Packaging Limited", sno="08812345", saddr="Unit 4, Calder Park, Wakefield WF2 7AW",
      goods="the corrugated cases, trays and printed sleeves described in Schedule 1 (the <b>Goods</b>)", date="1 April 2025", term="three years", end="31 March 2028",
      cap="The Supplier's total liability arising under or in connection with this Agreement, whether in contract, tort (including negligence) or otherwise, shall not exceed <b>£250,000</b> in aggregate.",
      notice="90 days", law="England and Wales", courts="the courts of England and Wales"),
 dict(file="Logistics_Services_Agreement_Brightmoor_Haulage", title="LOGISTICS SERVICES AGREEMENT", supplier="Brightmoor Haulage Limited", sno="09923456", saddr="Brightmoor Depot, Lowfields Road, Leeds LS12 6BU",
      goods="chilled and ambient road haulage between the Customer's sites and its retail customers, as described in Schedule 1 (the <b>Services</b>)", date="1 February 2025", term="two years", end="31 January 2027",
      cap="The Supplier shall be liable for all loss of or damage to goods in its care and for all other losses arising from its breach of this Agreement. Nothing in this Agreement limits or excludes either party's liability.",
      notice="60 days", law="England and Wales", courts="the courts of England and Wales"),
 dict(file="Software_Licence_Larchfield_Systems", title="SOFTWARE LICENCE AGREEMENT", supplier="Larchfield Systems Limited", sno="SC612345", saddr="12 Rutland Square, Edinburgh EH1 2BB",
      goods="a non-exclusive licence to use the Larchfield Stock warehouse management software and the support services described in Schedule 1 (the <b>Software</b>)", date="1 January 2026", term="one year, renewing automatically for further periods of one year", end="31 December 2026",
      cap="The Supplier's total liability under this Agreement in any year shall not exceed the licence fees paid by the Customer in the twelve months before the event giving rise to the claim.",
      notice="30 days", law="Scotland", courts="the Scottish courts"),
 dict(file="Ingredient_Supply_Agreement_Corran_Mills", title="INGREDIENT SUPPLY AGREEMENT", supplier="Corran Mills Limited", sno="07734567", saddr="Corran Mill, Skipton Road, Keighley BD20 6SD",
      goods="milled flour and blended baking ingredients to the specifications in Schedule 1 (the <b>Goods</b>)", date="1 July 2025", term="two years", end="30 June 2027",
      cap="Each party shall be liable to the other for all losses arising from its breach of this Agreement, including losses arising from a product recall caused by Goods that do not meet the specification.",
      notice="90 days", law="England and Wales", courts="the courts of England and Wales"),
 dict(file="Cleaning_Services_Contract_Ashby_Facilities", title="CLEANING SERVICES CONTRACT", supplier="Ashby Facilities Limited", sno="06645678", saddr="3 Kirkgate, Huddersfield HD1 1QS",
      goods="hygiene cleaning of the Customer's production areas at its Ossett site, as described in Schedule 1 (the <b>Services</b>)", date="1 November 2024", term="three years", end="31 October 2027",
      cap="The Supplier's total liability arising under or in connection with this Contract shall not exceed <b>£100,000</b> in aggregate.",
      notice="60 days", law="England and Wales", courts="the courts of England and Wales"),
 dict(file="Design_Services_Agreement_Holt_Creative", title="DESIGN SERVICES AGREEMENT", supplier="Holt Creative Limited", sno="11156789", saddr="The Old Chapel, Hebden Bridge HX7 8AD",
      goods="packaging design and artwork for the Customer's own-label range, as described in Schedule 1 (the <b>Services</b>)", date="15 May 2025", term="eighteen months", end="14 November 2026",
      cap="The Supplier's total liability arising under or in connection with this Agreement shall not exceed <b>£50,000</b>.",
      notice="30 days", law="England and Wales", courts="the courts of England and Wales"),
]
CSS = """@page{size:A4;margin:22mm 24mm}body{font:10.5pt/1.5 'Times New Roman',serif;color:#111}
h1{font-size:15pt;text-align:center;letter-spacing:.06em;margin:0 0 4mm}p.c{text-align:center;margin:0 0 7mm}
h2{font-size:11pt;margin:6mm 0 2mm}p{margin:0 0 2.6mm;text-align:justify}.sig{margin-top:12mm;display:flex;gap:20mm}.sig div{flex:1;border-top:1px solid #444;padding-top:2mm;font-size:9.5pt}"""
for c in C:
    h = f"""<html><head><meta charset=utf-8><style>{CSS}</style></head><body>
<h1>{c['title']}</h1><p class=c>Dated {c['date']}</p>
<h2>Parties</h2>
<p>(1) <b>{c['supplier']}</b>, a company registered under number {c['sno']}, whose registered office is at {c['saddr']} (the <b>Supplier</b>); and</p>
<p>(2) <b>Pennbridge Foods Limited</b>, a company registered in England and Wales under number 05512340, whose registered office is at Pennbridge House, Flanshaw Lane, Wakefield WF2 9JF (the <b>Customer</b>).</p>
<h2>1. Supply</h2>
<p>1.1 The Supplier shall provide to the Customer {c['goods']} in accordance with this Agreement.</p>
<p>1.2 The Supplier shall perform its obligations with reasonable skill and care, in accordance with good industry practice and all applicable laws, including food safety and hygiene legislation.</p>
<h2>2. Term</h2>
<p>2.1 This Agreement starts on {c['date']} and continues for {c['term']}, ending on {c['end']}, unless terminated earlier under clause 6.</p>
<h2>3. Price and payment</h2>
<p>3.1 The Customer shall pay the charges set out in Schedule 2. The Supplier shall invoice monthly in arrears and the Customer shall pay each undisputed invoice within 30 days of receipt.</p>
<p>3.2 Charges are exclusive of VAT, which the Customer shall pay at the applicable rate.</p>
<h2>4. Confidentiality</h2>
<p>4.1 Each party shall keep the other's confidential information confidential and use it only to perform this Agreement, during its term and for three years after it ends.</p>
<h2>5. Liability</h2>
<p>5.1 Nothing in this Agreement limits liability for death or personal injury caused by negligence, or for fraud or fraudulent misrepresentation.</p>
<p>5.2 {c['cap']}</p>
<p>5.3 The Supplier shall maintain public and product liability insurance with a reputable insurer throughout the term.</p>
<h2>6. Termination</h2>
<p>6.1 Either party may terminate this Agreement for convenience by giving the other not less than <b>{c['notice']}</b> written notice.</p>
<p>6.2 Either party may terminate this Agreement immediately by written notice if the other commits a material breach which is not remedied within 30 days of being notified of it, or becomes insolvent.</p>
<h2>7. General</h2>
<p>7.1 This Agreement is the entire agreement between the parties. No variation is effective unless in writing and signed by both parties.</p>
<p>7.2 This Agreement and any dispute arising from it are governed by the law of {c['law']}, and the parties submit to the exclusive jurisdiction of {c['courts']}.</p>
<div class=sig><div>Signed for and on behalf of<br>{c['supplier']}</div><div>Signed for and on behalf of<br>Pennbridge Foods Limited</div></div>
</body></html>"""
    (here / f"{c['file']}.html").write_text(h)
json.dump(C, open(here / "contracts.json", "w"), indent=1)
