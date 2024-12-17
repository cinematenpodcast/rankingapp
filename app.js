import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, set, get, child } 
    from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase Configuratie
const firebaseConfig = {
    apiKey: "AIzaSyDzhXSivBTgCNLvhmge5LpI9q0TaDC-05s",
    authDomain: "cinematenrankingapp.firebaseapp.com",
    databaseURL: "https://cinematenrankingapp-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "cinematenrankingapp",
    storageBucket: "cinematenrankingapp.appspot.com",
    messagingSenderId: "186578044336",
    appId: "1:186578044336:web:960326a525f4ea75e2c275"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

let rankings = { films: [], series: [], worstFilms: [], worstSeries: [] };

// Wacht op Firebase-authenticatie bij het laden van de pagina
window.onload = () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadUserData();
            document.getElementById("loginPopup").style.display = "none";
        } else {
            const isLoggedIn = document.cookie.includes("loggedIn=true");
            if (!isLoggedIn) {
                document.getElementById("loginPopup").style.display = "flex";
            } else {
                document.getElementById("loginPopup").style.display = "none";
            }
        }
    });
};

// Login-functionaliteit
document.getElementById("registerBtn").onclick = () => handleAuth("register");
document.getElementById("loginBtn").onclick = () => handleAuth("login");

function handleAuth(type) {
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;
    const authFn = type === "register" ? createUserWithEmailAndPassword : signInWithEmailAndPassword;

    authFn(auth, email, password)
        .then(() => {
            document.cookie = "loggedIn=true; path=/; max-age=31536000"; // 1 jaar geldig
            document.getElementById("loginPopup").style.display = "none";
            alert(type === "register" ? "Account aangemaakt!" : "Succesvol ingelogd!");
            loadUserData();
        })
        .catch(err => alert(err.message));
}

// Firebase Data Laden
function loadUserData() {
    onAuthStateChanged(auth, user => {
        if (user) {
            ["films", "series", "worstFilms", "worstSeries"].forEach(type => {
                get(child(ref(database), `${user.uid}/${type}`)).then(snapshot => {
                    if (snapshot.exists()) rankings[type] = snapshot.val();
                    if (type === "films" || type === "series") renderList(type);
                    else renderWorstList(type);
                });
            });
        }
    });
}

// Titel Toevoegen
document.getElementById("addFilmBtn").onclick = () => processRanking("films", document.getElementById("filmInput").value);
document.getElementById("addSeriesBtn").onclick = () => processRanking("series", document.getElementById("seriesInput").value);
document.getElementById("addWorstFilmBtn").onclick = () => processWorstRanking("worstFilms", document.getElementById("worstFilmInput").value);
document.getElementById("addWorstSeriesBtn").onclick = () => processWorstRanking("worstSeries", document.getElementById("worstSeriesInput").value);

function processRanking(type, title) {
    if (!title) return alert("Voer een titel in!");

    let inserted = false;
    for (let i = 0; i < 5; i++) {
        if (!rankings[type][i]) {
            rankings[type].splice(i, 0, title);
            inserted = true;
            break;
        }
        const isBetter = confirm(`Is "${title}" beter dan "${rankings[type][i]}"?`);
        if (isBetter) {
            rankings[type].splice(i, 0, title);
            inserted = true;
            break;
        }
    }

    if (rankings[type].length > 5) rankings[type].pop();
    if (!inserted) alert(`${title} staat niet in de top 5.`);
    renderList(type);
    saveToFirebase(type);
}

function processWorstRanking(type, title) {
    if (!title) return alert("Voer een titel in!");

    let inserted = false;
    for (let i = 0; i < 5; i++) {
        if (!rankings[type][i]) {
            rankings[type].splice(i, 0, title);
            inserted = true;
            break;
        }
        const isWorse = confirm(`Is "${title}" slechter dan "${rankings[type][i]}"?`);
        if (isWorse) {
            rankings[type].splice(i, 0, title);
            inserted = true;
            break;
        }
    }

    if (rankings[type].length > 5) rankings[type].pop();
    if (!inserted) alert(`${title} staat niet in de slechtste 5.`);
    renderWorstList(type);
    saveToFirebase(type);
}

// Render Lijst
function renderList(type) {
    const listElement = document.getElementById(type === "films" ? "filmList" : "seriesList");
    listElement.innerHTML = "";

    rankings[type].forEach((item, index) => {
        listElement.innerHTML += `
            <li>
                <span id="${type}-title-${index}">${index + 1}. ${item}</span>
                <button id="edit-btn-${type}-${index}" onclick="editTitle('${type}', ${index})">✏️</button>
                <div id="actions-${type}-${index}" style="display: none;">
                    <button onclick="moveUp('${type}', ${index})">🔼</button>
                    <button onclick="moveDown('${type}', ${index})">🔽</button>
                    <button onclick="deleteTitle('${type}', ${index})">❌</button>
                </div>
            </li>
        `;
    });
}

function renderWorstList(type) {
    const listElement = document.getElementById(type === "worstFilms" ? "worstFilmList" : "worstSeriesList");
    listElement.innerHTML = "";

    rankings[type].forEach((item, index) => {
        listElement.innerHTML += `
            <li>
                <span id="${type}-title-${index}">${index + 1}. ${item}</span>
                <button id="edit-btn-${type}-${index}" onclick="editTitle('${type}', ${index})">✏️</button>
                <div id="actions-${type}-${index}" style="display: none;">
                    <button onclick="moveUp('${type}', ${index})">🔼</button>
                    <button onclick="moveDown('${type}', ${index})">🔽</button>
                    <button onclick="deleteTitle('${type}', ${index})">❌</button>
                </div>
            </li>
        `;
    });
}

// Titel Bewerken
window.editTitle = function(type, index) {
    const span = document.getElementById(`${type}-title-${index}`);
    const actions = document.getElementById(`actions-${type}-${index}`);
    const editBtn = document.getElementById(`edit-btn-${type}-${index}`);
    const currentTitle = rankings[type][index];

    span.innerHTML = `
        <input type="text" id="edit-${type}-${index}" value="${currentTitle}">
        <button onclick="saveEdit('${type}', ${index})">💾</button>
    `;
    actions.style.display = "block";
    editBtn.style.display = "none"; // Verberg de edit-knop
};

window.saveEdit = function(type, index) {
    const newTitle = document.getElementById(`edit-${type}-${index}`).value.trim();
    const actions = document.getElementById(`actions-${type}-${index}`);
    const editBtn = document.getElementById(`edit-btn-${type}-${index}`);
    if (newTitle) {
        rankings[type][index] = newTitle;
        if (type === "films" || type === "series") renderList(type);
        else renderWorstList(type);
        saveToFirebase(type);
    } else {
        alert("Titel mag niet leeg zijn!");
    }
    actions.style.display = "none"; // Verberg acties na opslaan
    editBtn.style.display = "inline"; // Toon edit-knop opnieuw
};

// Titel Verplaatsen
window.moveUp = function(type, index) {
    if (index > 0) {
        [rankings[type][index - 1], rankings[type][index]] = [rankings[type][index], rankings[type][index - 1]];
        if (type === "films" || type === "series") renderList(type);
        else renderWorstList(type);
    }
};

window.moveDown = function(type, index) {
    if (index < rankings[type].length - 1) {
        [rankings[type][index + 1], rankings[type][index]] = [rankings[type][index], rankings[type][index + 1]];
        if (type === "films" || type === "series") renderList(type);
        else renderWorstList(type);
    }
};

window.deleteTitle = function(type, index) {
    if (confirm("Weet je zeker dat je deze titel wilt verwijderen?")) {
        rankings[type].splice(index, 1);
        if (type === "films" || type === "series") renderList(type);
        else renderWorstList(type);
        saveToFirebase(type);
    }
};

function saveToFirebase(type) {
    const user = auth.currentUser;
    if (user) set(ref(database, `${user.uid}/${type}`), rankings[type]);
}
