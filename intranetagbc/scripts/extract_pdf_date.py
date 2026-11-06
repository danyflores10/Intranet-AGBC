import sys
import json
import re
import os

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

meses = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'setiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
}
meses_regex = '|'.join(meses.keys())

# Regex full date
r_full = re.compile(r'\b([0-3]?\d)\s+de\s+(' + meses_regex + r')\s+de\s+(20[12]\d|19\d\d)\b', re.IGNORECASE)
# Regex short date
r_short = re.compile(r'\b([0-3]?\d)[\/\.-]([01]?\d)[\/\.-](20[12]\d|19\d\d)\b')
# Regex year
r_year = re.compile(r'\b(20[12]\d)\b')

def extract_date_from_pdf(filepath):
    try:
        doc = pymupdf.open(filepath)
    except Exception as e:
        return None
    
    n = len(doc)
    # 1st 5 pages and last 5 pages
    pages = sorted(list(set(list(range(min(5, n))) + list(range(max(0, n - 5), n)))))
    full_text = ""
    for p in pages:
        full_text += "\n" + doc[p].get_text()
    
    # 1. Search full date
    matches = r_full.findall(full_text)
    if matches:
        # take the first or the one near the end/beginning
        day, month, year = matches[0]
        return f"{int(day)} de {month.lower()} de {year}"
    
    # 2. Search short date
    matches_short = r_short.findall(full_text)
    if matches_short:
        day, month, year = matches_short[0]
        # format to spanish
        m_num = int(month)
        m_names = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        m_name = m_names[m_num] if 1 <= m_num <= 12 else str(m_num)
        return f"{int(day)} de {m_name} de {year}"
    
    # 3. Check metadata
    meta = doc.metadata or {}
    cdate = meta.get("creationDate") or meta.get("modDate") or ""
    # D:20191224...
    m_meta = re.search(r'D:(\d{4})(\d{2})(\d{2})', cdate)
    if m_meta:
        y, m, d = m_meta.groups()
        m_names = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        m_num = int(m)
        if 1 <= m_num <= 12:
            return f"{int(d)} de {m_names[m_num]} de {y}"

    # 4. Search year only in text
    matches_yr = r_year.findall(full_text)
    if matches_yr:
        return matches_yr[0]
    
    # 5. Check filename for year
    base = os.path.basename(filepath)
    m_fn_yr = r_year.findall(base)
    if m_fn_yr:
        return m_fn_yr[0]
        
    return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        res = extract_date_from_pdf(sys.argv[1])
        print(json.dumps({"fecha": res}))

