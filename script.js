// Chargement de la page
document.addEventListener("DOMContentLoaded", () => {
    verifierProfil();

    // Soumission du formulaire d'ajout de livre
    document.getElementById("form-livre").addEventListener("submit", soumettreLivre);
});

/* ========================================================
   GESTION DU PROFIL 
   ======================================================== */

// Fonction qui vérifie si l'utilisateur est déjà venu sur le site
function verifierProfil() {
    const utilisateurEnregistre = localStorage.getItem("utilisateurActif");

    if (utilisateurEnregistre) {
        document.getElementById("ecran-profil").classList.add("cache");
        document.getElementById("application-principale").classList.remove("cache");
        document.getElementById("message-bienvenue").innerText = "Connectée en tant que : " + utilisateurEnregistre;

        // Appel de la fonction de chargement des livres
        chargerLivres();
    } else {
        document.getElementById("ecran-profil").classList.remove("cache");
        document.getElementById("application-principale").classList.add("cache");
    }
}

// Fonction appelée quand on clique sur "Moi" ou "Mon Amie" au début
function choisirProfil(nom) {
    localStorage.setItem("utilisateurActif", nom);
    verifierProfil();
}

/* ========================================================
   VARIABLES GLOBALES ET FILTRES
   ======================================================== */
let tousLesLivres = []; // Stocke la liste complète reçue de Google
let filtrePersonne = "Commune"; // "Flaure", "Matide" ou "Commune"
let filtreStatut = "TOUS"; // "TOUS" ou "À lire"

/* ========================================================
   CHARGEMENT ET AFFICHAGE DES LIVRES
   ======================================================== */

function chargerLivres() {
    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyFlu8ZuK_k-YPKbcjfQLt95iE8U9mKq_kN-ZfE9xuz47tsbJAh4150k8vUkZyXTHDNYA/exec";

    fetch(URL_APPS_SCRIPT)
        .then(reponse => reponse.json())
        .then(lignes => {
            // On sauvegarde tous les livres (en retirant la ligne d'en-tête 0)
            tousLesLivres = lignes.slice(1);
            afficherLivres();
        })
        .catch(erreur => console.error("Erreur lors du chargement des livres :", erreur));
}

// Fonction qui applique les filtres et dessine les cartes
function afficherLivres() {
    const grille = document.getElementById("grille-livres");
    grille.innerHTML = "";

    tousLesLivres.forEach((ligne, index) => {
        const personne = ligne[1];     // Col B
        const couverture = ligne[5];   // Col F
        const titre = ligne[6];        // Col G
        const auteur = ligne[7];       // Col H
        const statut = ligne[13];      // Col N

        if (!titre) return;

        // Filtre 1 : Personne (Flaure / Matide / Commune)
        if (filtrePersonne !== "Commune" && personne !== filtrePersonne) {
            return;
        }

        // 🟢 Filtre 2 : Pile à lire (Corrigé avec "À lire")
        if (filtreStatut === "À lire" && statut !== "À lire") {
            return;
        }

        const carteHtml = `
            <div class="col" onclick="ouvrirFicheLivre(${index})" style="cursor: pointer;">
                <div class="card h-100 shadow-sm border-0">
                    ${couverture ? `<img src="${couverture}" class="card-img-top" alt="Couverture" style="height: 220px; object-fit: cover;">` : ''}
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div>
                            <span class="badge bg-primary mb-2">${personne}</span>
                            <h5 class="card-title fw-bold">${titre}</h5>
                            <h6 class="card-subtitle mb-3 text-muted">${auteur}</h6>
                        </div>
                        <div>
                            <span class="badge bg-light text-dark border">${statut}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grille.innerHTML += carteHtml;
    });
}

/* ========================================================
   GESTION DE L'INTERFACE (VUES ET FORMULAIRE)
   ======================================================== */

// Fonction pour changer d'onglet
function changerVue(vueDemandee) {
    if (vueDemandee === "PAL") {
        // 🟢 Alterne entre afficher uniquement "À lire" et tout afficher
        filtreStatut = (filtreStatut === "À lire") ? "TOUS" : "À lire";
    } else {
        // Adapte les clics ("Flaure", "Matide", "Commune")
        filtrePersonne = vueDemandee;
    }
    afficherLivres();
}

// Fonction pour afficher la fenêtre d'ajout de livre
function ouvrirFormulaire() {
    document.getElementById("modal-formulaire").classList.remove("cache");
}

// Fonction pour cacher la fenêtre d'ajout de livre
function fermerFormulaire() {
    document.getElementById("modal-formulaire").classList.add("cache");
    document.getElementById("form-livre").reset();
}

/* ========================================================
   GESTION DE L'AJOUT D'UN LIVRE
   ======================================================== */

function soumettreLivre(event) {
    event.preventDefault();

    const personne = localStorage.getItem("utilisateurActif");

    const nouveauLivre = {
        id: Date.now(),
        personne: personne,
        titre: document.getElementById("titre").value,
        auteur: document.getElementById("auteur").value,
        statut: document.getElementById("statut").value,
    };

    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyFlu8ZuK_k-YPKbcjfQLt95iE8U9mKq_kN-ZfE9xuz47tsbJAh4150k8vUkZyXTHDNYA/exec";

    const options = {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(nouveauLivre)
    };

    fetch(URL_APPS_SCRIPT, options)
        .then(reponse => reponse.json())
        .then(resultat => {
            if (resultat.statut === "succès") {
                alert("Le livre \"" + nouveauLivre.titre + "\" a bien été ajouté !");
                fermerFormulaire();
                chargerLivres(); // Recharges automatiquement les cartes sans rafraîchir la page !
            } else {
                alert("Erreur retournée par Google : " + resultat.message);
            }
        })
        .catch(erreur => {
            console.error("Erreur d'envoi :", erreur);
            alert("Oups, impossible de contacter le serveur Google.");
        });
}

/* ========================================================
   CODE 3 : FICHE COMPLÈTE DU LIVRE
   ======================================================== */

function ouvrirFicheLivre(index) {
    const livre = tousLesLivres[index];
    if (!livre) return;

    // Récupération des colonnes B à P
    const personne = livre[1];
    const date_debut = livre[2];
    const date_fin = livre[3];
    const duree = livre[4];
    const couverture = livre[5];
    const titre = livre[6];
    const auteur = livre[7];
    const pages = livre[8];
    const prix_officiel = livre[9];
    const prix_reel = livre[10];
    const format = livre[11];
    const genre = livre[12];
    const statut = livre[13];
    const notes = livre[14];
    const review = livre[15];

    const contenu = `
        <!-- En-tête de la modale avec le titre et le bouton Modifier -->
        <div class="d-flex justify-content-between align-items-center mb-3 pe-4">
            <h3 class="mb-0 fw-bold">${titre || "Sans titre"}</h3>
            <button type="button" class="btn btn-outline-primary btn-sm fw-bold ms-2" onclick="passerEnModeEdition(${index})">
                ✏️ Modifier
            </button>
        </div>
        <h5 class="text-muted mb-3">${auteur || "Auteur inconnu"}</h5>
        <hr>

        <div class="row g-4">
            ${couverture ? `<div class="col-md-4"><img src="${couverture}" class="img-fluid rounded shadow-sm" alt="Couverture"></div>` : ''}
            <div class="${couverture ? 'col-md-8' : 'col-12'}">
                <p><strong>Appartient à :</strong> ${personne || "-"}</p>
                <p><strong>Statut :</strong> ${statut || "-"}</p>
                <p><strong>Genre :</strong> ${genre || "-"} | <strong>Format :</strong> ${format || "-"}</p>
                <p><strong>Nombre de pages :</strong> ${pages || "-"}</p>
                <p><strong>Période de lecture :</strong> Du ${date_debut || "?"} au ${date_fin || "?"} (${duree || "-"})</p>
                <p><strong>Prix payé :</strong> ${prix_reel || "-"} € (Prix officiel : ${prix_officiel || "-"} €)</p>
                <p><strong>Note :</strong> ${notes || "-"}</p>
                <p><strong>Avis :</strong> ${review || "Aucun avis pour le moment."}</p>
            </div>
        </div>
    `;

    document.getElementById("fiche-details").innerHTML = contenu;
    document.getElementById("modal-fiche").classList.remove("cache");
}

function fermerFicheLivre() {
    document.getElementById("modal-fiche").classList.add("cache");
}

function passerEnModeEdition(index) {
    const livre = tousLesLivres[index];
    if (!livre) return;

    const [id, personne, date_debut, date_fin, duree, couverture, titre, auteur, pages, prix_officiel, prix_reel, format, genre, statut, notes, review] = livre;

    const contenuEdit = `
        <form id="form-edition" onsubmit="sauvegarderModification(event, ${index})">
            <h4 class="mb-3">Modifier la fiche</h4>
            
            <div class="mb-3">
                <label class="form-label fw-bold">Titre :</label>
                <input type="text" id="edit-titre" class="form-control" value="${titre || ''}" required>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Auteur :</label>
                <input type="text" id="edit-auteur" class="form-control" value="${auteur || ''}" required>
            </div>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Statut :</label>
                    <select id="edit-statut" class="form-select">
                        <option value="À lire" ${statut === 'À lire' ? 'selected' : ''}>À lire</option>
                        <option value="En cours 📖" ${statut === 'En cours 📖' ? 'selected' : ''}>En cours 📖</option>
                        <option value="Terminé ✔️" ${statut === 'Terminé ✔️' ? 'selected' : ''}>Terminé ✔️</option>
                        <option value="Pause ⏸" ${statut === 'Pause ⏸' ? 'selected' : ''}>Pause ⏸</option>
                        <option value="Abandonné ❌☠️" ${statut === 'Abandonné ❌☠️' ? 'selected' : ''}>Abandonné ❌☠️</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Note :</label>
                    <input type="text" id="edit-note" class="form-control" value="${notes || ''}">
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Avis / Critique :</label>
                <textarea id="edit-review" class="form-control" rows="3">${review || ''}</textarea>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-secondary" onclick="ouvrirFicheLivre(${index})">Annuler</button>
                <button type="submit" class="btn btn-success">💾 Enregistrer</button>
            </div>
        </form>
    `;

    document.getElementById("fiche-details").innerHTML = contenuEdit;
}

function sauvegarderModification(event, index) {
    event.preventDefault();

    // Calcul du numéro de ligne dans le Google Sheet (+2 car index 0 = ligne 2 du tableau)
    const numeroLigne = index + 2;

    const livreModifie = {
        action: "UPDATE",
        ligne: numeroLigne,
        titre: document.getElementById("edit-titre").value,
        auteur: document.getElementById("edit-auteur").value,
        statut: document.getElementById("edit-statut").value,
        notes: document.getElementById("edit-note").value,
        review: document.getElementById("edit-review").value
    };

    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyFlu8ZuK_k-YPKbcjfQLt95iE8U9mKq_kN-ZfE9xuz47tsbJAh4150k8vUkZyXTHDNYA/exec";

    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(livreModifie)
    })
        .then(reponse => reponse.json())
        .then(resultat => {
            if (resultat.statut === "succès") {
                fermerFicheLivre();
                chargerLivres(); // Recharge les cartes mises à jour
            } else {
                alert("Erreur lors de la modification : " + resultat.message);
            }
        })
        .catch(erreur => {
            console.error("Erreur de sauvegarde :", erreur);
            alert("Impossible de contacter le serveur Google.");
        });
}