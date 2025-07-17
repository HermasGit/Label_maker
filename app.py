 from flask import Flask, render_template, request, send_file, jsonify, after_this_request
 import os
+import json
+import atexit
+from pathlib import Path
 from svg_to_pdf import svg_to_pdf
 import tempfile
 import svgwrite
 
 app = Flask(__name__)
 
-# --- In-memory sets for auto-complete suggestions (session only) ---
-product_name_suggestions = set()
-batch_number_suggestions = set()
+# --- Autocomplete suggestions persisted to a JSON file ---
+SUGGESTIONS_FILE = Path(app.root_path) / "suggestions.json"
+try:
+    with open(SUGGESTIONS_FILE, "r", encoding="utf-8") as fh:
+        data = json.load(fh)
+        product_name_suggestions = set(data.get("product_names", []))
+        batch_number_suggestions = set(data.get("batch_numbers", []))
+except FileNotFoundError:
+    product_name_suggestions = set()
+    batch_number_suggestions = set()
+
+
+def _save_suggestions():
+    with open(SUGGESTIONS_FILE, "w", encoding="utf-8") as fh:
+        json.dump({
+            "product_names": sorted(product_name_suggestions),
+            "batch_numbers": sorted(batch_number_suggestions)
+        }, fh)
+
+
+atexit.register(_save_suggestions)
 
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
     """Generate a PDF of labels from posted JSON data."""
diff --git a/app.py b/app.py
index 0379c43259ede92299203bee3d4ce028f14a6f07..15da0f6083a03445e86163e9875c076992a2e8a9 100644
--- a/app.py
+++ b/app.py
@@ -116,51 +137,51 @@ def generate_labels_pdf():
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
 
     svg_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".svg")
     pdf_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
     svg_file = svg_temp.name
     pdf_file = pdf_temp.name
     svg_temp.close()
     pdf_temp.close()
     dwg = svgwrite.Drawing(svg_file, size=(mm(PAGE_WIDTH_MM), mm(PAGE_HEIGHT_MM)))
 
     # Embed Franklin Gothic Demi font using @font-face in SVG defs with absolute file path for CairoSVG compatibility
-    font_abs_path = os.path.join(app.root_path, 'static', 'font', 'franklingothic_demi.ttf').replace('\\', '/')
+    font_abs_path = (Path(app.root_path) / 'static' / 'font' / 'franklingothic_demi.ttf').resolve().as_posix()
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
