/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores insignia "Lumina"
        lumina: {
          bg: "#0f172a",       // Fondo principal (Slate 950)
          surface: "#1e293b",  // Tarjetas/Paneles (Slate 800)
          border: "#334155",   // Bordes sutiles
          text: "#f8fafc",     // Texto principal
          muted: "#94a3b8",    // Texto secundario
          
          // Acentos (Gradientes o botones)
          primary: "#6366f1",  // Indigo 500
          accent: "#06b6d4",   // Cyan 500
        },
      },
      // Animaciones personalizadas
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
