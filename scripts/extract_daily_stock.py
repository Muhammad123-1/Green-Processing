import openpyxl
import json
import re
import os

EXCEL_PATH = r'C:\Users\yoqub\.gemini\antigravity\brain\b27a4739-ead0-4ecf-bb94-a3c32401d892\.user_uploaded\media_1795666924107_4f195101.xlsx'
OUTPUT_PATH = r'C:\Users\yoqub\OneDrive\Desktop\Green Processing\src\data\dailyStockLedger.json'

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)

def parse_num(v):
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        # Handle tiny scientific notation numbers like -1.15e-14
        if abs(v) < 1e-6:
            return 0.0
        return round(float(v), 2)
    s = str(v).strip().replace(',', '').replace(' ', '')
    if not s or s == '-' or s == 'None':
        return 0.0
    try:
        val = float(s)
        if abs(val) < 1e-6:
            return 0.0
        return round(val, 2)
    except:
        return 0.0

def parse_nullable_num(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        if abs(v) < 1e-6:
            return None
        return round(float(v), 2)
    s = str(v).strip().replace(',', '').replace(' ', '')
    if not s or s == '-' or s == 'None':
        return None
    try:
        val = float(s)
        if abs(val) < 1e-6:
            return None
        return round(val, 2)
    except:
        return None

def parse_weeks(v):
    if v is None:
        return '#DIV/0!'
    if isinstance(v, (int, float)):
        if abs(v) < 1e-6:
            return 0.0
        return round(float(v), 2)
    s = str(v).strip()
    if '#DIV/0' in s or '#VALUE' in s or not s:
        return '#DIV/0!'
    try:
        val = float(s.replace(',', ''))
        return round(val, 2)
    except:
        return s

all_tables = []
available_dates = []

month_sheets = [
    'январь 2026', 'февраль 2026', 'март 2026', 'апрель 2026', 'май 2026',
    'июнь 2026', 'июль 2026', 'август 2026', 'сентябрь 2026', 'октябрь 2026',
    'ноябрь 2026'
]

uz_days = {
    'понедельник': 'Dushanba',
    'вторник': 'Seshanba',
    'среда': 'Chorshanba',
    'четверг': 'Payshanba',
    'пятница': 'Juma',
    'суббота': 'Shanba',
    'воскресенье': 'Yakshanba'
}

for sheet_name in month_sheets:
    if sheet_name not in wb.sheetnames:
        continue
    ws = wb[sheet_name]
    r = 1
    while r <= ws.max_row:
        c1 = str(ws.cell(r, 1).value or '').strip()
        
        is_daily = c1.startswith('на ') and bool(re.search(r'\d{2}\.\d{2}\.\d{4}', c1))
        is_weekly = bool(re.match(r'^\d{2}\.\d{2}\.\d{4}\s*-\s*\d{2}\.\d{2}\.\d{4}', c1))
        
        if is_daily or is_weekly:
            title = c1
            day_ru = ''
            for col_idx in [10, 11, 9, 8, 7]:
                val = str(ws.cell(r, col_idx).value or '').strip()
                if val.lower() in uz_days:
                    day_ru = val.lower()
                    break
            
            day_uz = uz_days.get(day_ru, '')
            
            # Extract standard dates
            iso_date = ''
            start_iso = ''
            end_iso = ''
            if is_daily:
                m = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', title)
                if m:
                    iso_date = f'{m.group(3)}-{m.group(2)}-{m.group(1)}'
            elif is_weekly:
                m = re.search(r'(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})', title)
                if m:
                    start_iso = f'{m.group(3)}-{m.group(2)}-{m.group(1)}'
                    end_iso = f'{m.group(6)}-{m.group(5)}-{m.group(4)}'
                    iso_date = f'{start_iso}_{end_iso}'
            
            header_row = r + 1
            # Product rows
            items = []
            ir = header_row + 1
            
            total_vegetables = None
            boxes = None
            hypochlorite = None
            
            while ir <= ws.max_row:
                pname = str(ws.cell(ir, 1).value or '').strip()
                if not pname or pname.startswith('Примечание:') or ir > header_row + 25:
                    break
                
                punit = str(ws.cell(ir, 2).value or '').strip()
                price = parse_num(ws.cell(ir, 3).value)
                start_stock = parse_num(ws.cell(ir, 4).value)
                inflow = parse_nullable_num(ws.cell(ir, 5).value)
                outflow = parse_nullable_num(ws.cell(ir, 6).value)
                kitchen = parse_nullable_num(ws.cell(ir, 7).value)
                end_stock = parse_num(ws.cell(ir, 8).value)
                weekly_avg = parse_num(ws.cell(ir, 9).value)
                weeks_rem = parse_weeks(ws.cell(ir, 10).value)
                row_sum = parse_num(ws.cell(ir, 11).value)
                
                item_obj = {
                    'name': pname,
                    'unit': punit,
                    'price': price,
                    'startStock': start_stock,
                    'inflow': inflow,
                    'outflow': outflow,
                    'kitchenTransfer': kitchen,
                    'endStock': end_stock,
                    'weeklyAvg': weekly_avg,
                    'weeksRemaining': weeks_rem,
                    'sum': row_sum
                }
                
                if pname.lower() == 'всего':
                    item_obj['isHighlight'] = True
                    total_vegetables = item_obj
                    items.append(item_obj)
                elif pname.lower() == 'коробка':
                    item_obj['isConsumable'] = True
                    boxes = item_obj
                    items.append(item_obj)
                elif 'гипохлорид' in pname.lower() or 'гипохлорит' in pname.lower():
                    item_obj['isConsumable'] = True
                    hypochlorite = item_obj
                    items.append(item_obj)
                else:
                    items.append(item_obj)
                
                ir += 1
            
            # Check for grand total & notes
            grand_total_sum = 0.0
            notes = []
            
            while ir <= ws.max_row:
                cell_v = str(ws.cell(ir, 1).value or '').strip()
                col11_v = ws.cell(ir, 11).value
                if col11_v and isinstance(col11_v, (int, float)) and not cell_v:
                    grand_total_sum = parse_num(col11_v)
                
                if cell_v.startswith('Примечание:'):
                    # Clean up multiple whitespaces
                    cleaned = re.sub(r'\s+', ' ', cell_v).strip()
                    notes.append(cleaned)
                    # Check next rows for continuation notes
                    for nr in range(ir + 1, ir + 6):
                        nxt_v = str(ws.cell(nr, 1).value or '').strip()
                        if nxt_v and not nxt_v.startswith('на ') and not re.match(r'^\d{2}\.\d{2}\.\d{4}', nxt_v):
                            notes.append(re.sub(r'\s+', ' ', nxt_v).strip())
                        else:
                            break
                    break
                elif cell_v.startswith('на ') or re.match(r'^\d{2}\.\d{2}\.\d{4}', cell_v):
                    break
                ir += 1
            
            # Calculate Grand Total Sum if not directly in col 11
            if not grand_total_sum:
                veg_sum = total_vegetables['sum'] if total_vegetables else sum(x['sum'] for x in items if not x.get('isConsumable') and not x.get('isHighlight'))
                box_sum = boxes['sum'] if boxes else 0.0
                hypo_sum = hypochlorite['sum'] if hypochlorite else 0.0
                grand_total_sum = round(veg_sum + box_sum + hypo_sum, 2)
            
            table_id = iso_date if iso_date else f'{sheet_name}_{r}'
            
            table_entry = {
                'id': table_id,
                'type': 'daily' if is_daily else 'weekly',
                'title': title,
                'dayRu': day_ru,
                'dayUz': day_uz,
                'isoDate': iso_date,
                'startDate': start_iso if is_weekly else iso_date,
                'endDate': end_iso if is_weekly else iso_date,
                'sheetName': sheet_name,
                'items': items,
                'vegetableCount': len([x for x in items if not x.get('isHighlight') and not x.get('isConsumable')]),
                'totalVegetables': total_vegetables,
                'boxes': boxes,
                'hypochlorite': hypochlorite,
                'grandTotalSum': grand_total_sum,
                'notes': notes
            }
            
            all_tables.append(table_entry)
            available_dates.append({
                'id': table_id,
                'type': 'daily' if is_daily else 'weekly',
                'title': title,
                'dayUz': day_uz,
                'dayRu': day_ru,
                'isoDate': iso_date,
                'sheetName': sheet_name,
                'grandTotalSum': grand_total_sum
            })
            
            r = ir - 1
        r += 1

output_data = {
    'updatedAt': '2026-11-26T11:00:00Z',
    'totalTables': len(all_tables),
    'dailyCount': len([t for t in all_tables if t['type'] == 'daily']),
    'weeklyCount': len([t for t in all_tables if t['type'] == 'weekly']),
    'availableDates': available_dates,
    'tables': all_tables
}

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"Successfully extracted {len(all_tables)} tables ({output_data['dailyCount']} daily, {output_data['weeklyCount']} weekly) to {OUTPUT_PATH}")
