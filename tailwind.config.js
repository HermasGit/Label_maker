module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(220, 30%, 97%)',
        foreground: 'hsl(220, 25%, 25%)',
        card: 'hsl(0, 0%, 100%)',
        'card-foreground': 'hsl(220, 25%, 25%)',
        popover: 'hsl(0, 0%, 100%)',
        'popover-foreground': 'hsl(220, 25%, 25%)',
        primary: {
          DEFAULT: 'hsl(189, 99%, 31%)', // #01889F
          foreground: 'hsl(0, 0%, 100%)'
        },
        secondary: {
          DEFAULT: 'hsl(189, 80%, 92%)',
          foreground: 'hsl(189, 90%, 25%)'
        },
        muted: {
          DEFAULT: 'hsl(220, 15%, 80%)',
          foreground: 'hsl(220, 15%, 50%)'
        },
        accent: {
          DEFAULT: 'hsl(189, 90%, 40%)',
          foreground: 'hsl(0, 0%, 100%)'
