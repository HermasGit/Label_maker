# Label-maker

This project provides a small web application for generating printable label sheets. The main application is written in Flask and exposes a single page interface where label details can be entered. Generated labels are returned as a PDF file ready for printing.

## Prerequisites

- **Python 3.8+** – used for the Flask backend.
- **Node.js** (optional) – only needed if you want to run the provided `server.js` Express server or install JavaScript dependencies.

## Installation

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. (Optional) install Node packages if you plan to use the Node server:
   ```bash
   npm install
   ```

## Usage

### Running the Flask server

```
python app.py
```

The application will be available at `http://localhost:8000/`. You can also run it with `waitress` in production:

```
python -m waitress --call 'app:create_app'
```

### Optional Node server

If you prefer serving static files through Node/Express:

```
npm start
```

### Generating labels

Navigate to the root URL in your browser and fill out the form. Submitting the form sends the label data to `/generate-labels-pdf`, which returns a PDF containing your labels. The application will also remember product names and batch numbers you have entered during the current session for autocomplete suggestions.
