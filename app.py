from flask import Flask, render_template, request, send_file, jsonify
import os
from svg_to_pdf import svg_to_pdf
import tempfile
import svgwrite

app = Flask(__name__)

# --- In-memory sets for auto-complete suggestions (session only) ---
product_name_suggestions = set()
batch_number_suggestions = set()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/autocomplete/product-name")
def autocomplete_product_name():
    query = request.args.get("q", "").strip().upper()
    if not query:
        return jsonify([])
    matches = [name for name in product_name_suggestions if name.startswith(query)]
    return jsonify(matches[:10])

@app.route("/autocomplete/batch-number")
def autocomplete_batch_number():
    query = request.args.get("q", "").strip().upper()
    if not query:
        return jsonify([])
    matches = [num for num in batch_number_suggestions if num.startswith(query)]
    return jsonify(matches[:10])

# --- Add to suggestions when generating labels ---
@app.route("/generate-labels-pdf", methods=["POST"])
def generate_labels_pdf():
    data = request.json
    label_array = data.get("labels", [])

    # Fixed hardcoded values for all label design
    PRODUCT_NAME_FONT_SIZE_MM = 8
    PRODUCT_NAME_SCALE_X = 0.55
    PRODUCT_NAME_X_MM = 1.6
    PRODUCT_NAME_Y_MM = 6.8

    BATCH_FONT_SIZE_MM = 6.8
    BATCH_SCALE_X = 0.48
    BATCH_X_MM = 2.3
    BATCH_Y_MM = 14

    QTY_FONT_SIZE_MM = 6.3
    QTY_SCALE_X = 0.6
    QTY_X_MM = 1.8
    QTY_Y_MM = 20.5

    MFG_FONT_SIZE_MM = 6.3
    MFG_SCALE_X = 0.6
    MFG_X_MM = 1.8
    MFG_Y_MM = 27

    ARROW1_FONT_SIZE_MM = 5
    ARROW1_SCALE_X = 0.7
    ARROW1_X_MM = 14
    ARROW1_Y_MM = 20

    ARROW2_FONT_SIZE_MM = 5
    ARROW2_SCALE_X = 0.7
    ARROW2_X_MM = 14
    ARROW2_Y_MM = 26.5

    BATCH_INPUT_FONT_SIZE_MM = 8.1
    BATCH_INPUT_SCALE_X = 0.48
    BATCH_INPUT_X_MM = 38.6
    BATCH_INPUT_Y_MM = 14

    QTY_INPUT_FONT_SIZE_MM = 6.8
    QTY_INPUT_SCALE_X = 0.7
    QTY_INPUT_X_MM = 22
    QTY_INPUT_Y_MM = 20.5

    MFG_INPUT_FONT_SIZE_MM = 6.6
    MFG_INPUT_SCALE_X = 0.6
    MFG_INPUT_X_MM = 25
    MFG_INPUT_Y_MM = 27

    VOLUME_FONT_SIZE_MM = 6
    VOLUME_SCALE_X = 0.6
    VOLUME_X_MM = 62
    VOLUME_Y_MM = 14.5

    # --- Layout Constants (in mm) ---
    PAGE_WIDTH_MM = 145
    PAGE_HEIGHT_MM = 225
    LABEL_WIDTH_MM = 45.997
    LABEL_HEIGHT_MM = 29.438
    STICKER_GAP_X_MM = 1.2
    STICKER_GAP_Y_MM = 1.5
    COLS = 3
    ROWS = 7
    LABELS_PER_PAGE = COLS * ROWS
    GRID_WIDTH_MM = COLS * LABEL_WIDTH_MM + (COLS - 1) * STICKER_GAP_X_MM
    GRID_HEIGHT_MM = ROWS * LABEL_HEIGHT_MM + (ROWS - 1) * STICKER_GAP_Y_MM
    MARGIN_X_MM = (PAGE_WIDTH_MM - GRID_WIDTH_MM) / 2
    MARGIN_Y_MM = (PAGE_HEIGHT_MM - GRID_HEIGHT_MM) / 2
    INNER_BOX_X_OFFSET_MM = 30.689
    INNER_BOX_Y_OFFSET_MM = 8.949
    INNER_BOX_WIDTH_MM = 13.121
    INNER_BOX_HEIGHT_MM = 11.1488

    # SVG uses px, so convert mm to px (1 mm ≈ 3.7795275591 px)
    MM_TO_PX = 3.7795275591
    def mm(val):
        return val * MM_TO_PX

    # Flatten label array according to numberOfStickers
    stickers = []
    for label in label_array:
        count = int(label.get('numberOfStickers', 1))
        for _ in range(count):
            stickers.append(label)
    stickers = stickers[:LABELS_PER_PAGE]

    svg_file = tempfile.mktemp(suffix=".svg")
    pdf_file = tempfile.mktemp(suffix=".pdf")
    dwg = svgwrite.Drawing(svg_file, size=(mm(PAGE_WIDTH_MM), mm(PAGE_HEIGHT_MM)))

    # Embed Franklin Gothic Demi font using @font-face in SVG defs with absolute file path for CairoSVG compatibility
    font_abs_path = os.path.abspath(os.path.join('static', 'font', 'franklingothic_demi.ttf')).replace('\\', '/')
    font_face_css = f'''
    @font-face {{
        font-family: "Franklin Gothic Demi";
        src: url("file:///{font_abs_path}");
    }}
    '''
    dwg.defs.add(dwg.style(font_face_css))

    for idx, label in enumerate(stickers):
        row = idx // COLS
        col = idx % COLS
        x = MARGIN_X_MM + col * (LABEL_WIDTH_MM + STICKER_GAP_X_MM)
        y = MARGIN_Y_MM + row * (LABEL_HEIGHT_MM + STICKER_GAP_Y_MM)
        group = dwg.g(transform=f"translate({mm(x)},{mm(y)})")
        # Outer label box
        group.add(dwg.rect(insert=(0, 0), size=(mm(LABEL_WIDTH_MM), mm(LABEL_HEIGHT_MM)), fill='white', stroke='black', stroke_width=mm(0.3)))
        # Inner box
        group.add(dwg.rect(insert=(mm(INNER_BOX_X_OFFSET_MM), mm(INNER_BOX_Y_OFFSET_MM)), size=(mm(INNER_BOX_WIDTH_MM), mm(INNER_BOX_HEIGHT_MM)), fill='white', stroke='black', stroke_width=mm(0.3)))
        # Placeholders and label content (only for actual stickers)
        group.add(dwg.text(
            "BATCH NO :",
            insert=(mm(BATCH_X_MM), mm(BATCH_Y_MM)),
            font_size=mm(BATCH_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({BATCH_SCALE_X},1)'
        ))
        group.add(dwg.text(
            "NOS",
            insert=(mm(QTY_X_MM), mm(QTY_Y_MM)),
            font_size=mm(QTY_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({QTY_SCALE_X},1)'
        ))
        group.add(dwg.text(
            "→",
            insert=(mm(ARROW1_X_MM), mm(ARROW1_Y_MM)),
            font_size=mm(ARROW1_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({ARROW1_SCALE_X},1)'
        ))
        group.add(dwg.text(
            "→",
            insert=(mm(ARROW2_X_MM), mm(ARROW2_Y_MM)),
            font_size=mm(ARROW2_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({ARROW2_SCALE_X},1)'
        ))
        group.add(dwg.text(
            "MFG",
            insert=(mm(MFG_X_MM), mm(MFG_Y_MM)),
            font_size=mm(MFG_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({MFG_SCALE_X},1)'
        ))
        # Product Name (dynamic)
        group.add(dwg.text(
            label.get("productName", ""),
            insert=(mm(PRODUCT_NAME_X_MM), mm(PRODUCT_NAME_Y_MM)),
            font_size=mm(PRODUCT_NAME_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({PRODUCT_NAME_SCALE_X},1)'
        ))
        group.add(dwg.text(
            label.get("batchNumber", ""),
            insert=(mm(BATCH_INPUT_X_MM), mm(BATCH_INPUT_Y_MM)),
            font_size=mm(BATCH_INPUT_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({BATCH_INPUT_SCALE_X},1)'
        ))
        qty_val = label.get("quantityInBox", "").replace(" NOS", "").strip()
        group.add(dwg.text(
            qty_val,
            insert=(mm(QTY_INPUT_X_MM), mm(QTY_INPUT_Y_MM)),
            font_size=mm(QTY_INPUT_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({QTY_INPUT_SCALE_X},1)'
        ))
        mfg_val = label.get("mfgDate", "").strip()
        group.add(dwg.text(
            mfg_val,
            insert=(mm(MFG_INPUT_X_MM), mm(MFG_INPUT_Y_MM)),
            font_size=mm(MFG_INPUT_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({MFG_INPUT_SCALE_X},1)'
        ))
        weight_vol = label.get("weightVolume", "").strip()
        if weight_vol:
            parts = weight_vol.split()
            if len(parts) == 2:
                value, unit = parts
                weight_vol = f"{value} {unit.lower()}"
        group.add(dwg.text(
            weight_vol,
            insert=(mm(VOLUME_X_MM), mm(VOLUME_Y_MM)),
            font_size=mm(VOLUME_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            text_anchor='middle',
            alignment_baseline='middle',
            transform=f'scale({VOLUME_SCALE_X},1)'
        ))
        dwg.add(group)

    dwg.save()
    svg_to_pdf(svg_file, pdf_file)
    return send_file(pdf_file, as_attachment=True, download_name="herbal_product_labels.pdf")

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=8000)
