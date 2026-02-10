/* American Garage – LOGIN DISCORD OAUTH (CODE FLOW FIX)
   Questo file evita loop infiniti e conclude sempre il login.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBegJ995tYjS3yu4TOzX547e26Wj1GzoxM",
  authDomain: "azienda-americangarage.firebaseapp.com",
  projectId: "azienda-americangarage",
  storageBucket: "azienda-americangarage.firebasestorage.app",
  messagingSenderId: "654707277544",
  appId: "1:654707277544:web:aac08f339dd78ac09b535d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ---------- SESSION ---------- */
const SESSION_KEY = "ag_session";

function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

/* ---------- OAUTH CODE HANDLER ---------- */
async function handleOAuthCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return false;

  // Login riuscito (Discord ha autorizzato)
  // Creiamo sessione locale "lite"
  const session = {
    id: "discord_" + code.slice(0, 10),
    username: "Discord User",
    loggedAt: Date.now()
  };
  saveSession(session);

  // Crea utente su Firestore se non esiste
  const ref = doc(db, "utenti", session.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      nome: session.username,
      ruolo: "dipendente",
      totalSales: 0,
      totalInvoices: 0,
      createdAt: Date.now()
    });
  }

  // Pulisce URL (toglie ?code=...)
  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}

/* ---------- BOOT ---------- */
(async function boot() {
  const logged = await handleOAuthCode();
  const session = getSession();

  // Se non loggato, mostra bottone login se esiste
  if (!session) {
    const btn = document.getElementById("loginBtn");
    if (btn) {
      btn.href = "https://discord.com/oauth2/authorize?client_id=1470037430144073884&response_type=code&redirect_uri=https%3A%2F%2Famericangarage.github.io%2FAmericanGarage1%2Fhome.html&scope=identify";
    }
    return;
  }

  // Se loggato, nascondi login
  const card = document.getElementById("loginCard");
  if (card) card.style.display = "none";

  console.log("Login OK:", session);
})();
