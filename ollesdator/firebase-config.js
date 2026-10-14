// =====================================================================
//  Olles dator – Firebase-inställningar för webbsidan
//  Klistra in värdena från Firebase-konsolen:
//  Projektinställningar (kugghjulet) → Allmänt → Dina appar → Webbapp → "Konfiguration"
//  Det här är inga hemligheter, det är OK att de ligger på GitHub.
//  Säkerheten sköts av inloggningen och databasreglerna.
// =====================================================================

export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "DITT-PROJEKT.firebaseapp.com",
  databaseURL: "https://DITT-PROJEKT-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "DITT-PROJEKT",
  appId: "1:000000000000:web:0000000000000000000000"
};

// Måste vara samma som LOGIN_DOMAIN i ESP32-koden (src/main.cpp).
// Användarnamnet "olle" blir då kontot olle@ollesdator.se i Firebase.
export const LOGIN_DOMAIN = "ollesdator.se";
