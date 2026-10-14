// =====================================================================
//  Olles dator – Firebase-inställningar för webbsidan
//  Klistra in värdena från Firebase-konsolen:
//  Projektinställningar (kugghjulet) → Allmänt → Dina appar → Webbapp → "Konfiguration"
//  Det här är inga hemligheter, det är OK att de ligger på GitHub.
//  Säkerheten sköts av inloggningen och databasreglerna.
// =====================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyDOzvL4atHN-PrfG7Do-5Imud25vmq_iYA",
  authDomain: "wol-esp32-26411.firebaseapp.com",
  databaseURL: "https://wol-esp32-26411-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wol-esp32-26411",
  storageBucket: "wol-esp32-26411.firebasestorage.app",
  messagingSenderId: "64051925596",
  appId: "1:64051925596:web:a65663ea2ec93593d18c99",
  measurementId: "G-JG6QZ21KN1"
};

// Måste vara samma som LOGIN_DOMAIN i ESP32-koden (src/main.cpp).
// Användarnamnet "olle" blir då kontot olle@ollesdator.se i Firebase.
export const LOGIN_DOMAIN = "ollesdator.se";
