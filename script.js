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

        // 🟢 Appel de la fonction de chargement des livres
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
let filtrePersonne = "Commune"; // "Flore", "Mathilde" ou "Commune"
let filtreStatut = "TOUS"; // "TOUS" ou "A lire"

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

        // Filtre 1 : Personne (Flore / Mathilde / Commune)
        if (filtrePersonne !== "Commune" && personne !== filtrePersonne) {
            return;
        }

        // Filtre 2 : Pile à lire ("A lire")
        if (filtreStatut === "A lire" && statut !== "A lire") {
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

// Fonction pour changer d'onglet (Ma bibliothèque, Sa bibliothèque, Commune)
function changerVue(vueDemandee) {
    if (vueDemandee === "PAL") {
        // Alterne entre afficher uniquement "A lire" et tout afficher
        filtreStatut = (filtreStatut === "A lire") ? "TOUS" : "A lire";
    } else {
        // Adapte les clics ("Flore", "Mathilde", "Commune")
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

    // Récupération de l'ensemble des champs (sans ID ni Année)
    const personne = livre[1];      // Col B
    const date_debut = livre[2];    // Col C
    const date_fin = livre[3];      // Col D
    const duree = livre[4];         // Col E
    const couverture = livre[5];    // Col F
    const titre = livre[6];         // Col G
    const auteur = livre[7];        // Col H
    const pages = livre[8];         // Col I
    const prix_officiel = livre[9]; // Col J
    const prix_reel = livre[10];    // Col K
    const format = livre[11];       // Col L
    const genre = livre[12];        // Col M
    const statut = livre[13];       // Col N
    const notes = livre[14];        // Col O
    const review = livre[15];       // Col P

    const contenu = `
        <div class="row g-4">
            ${couverture ? `<div class="col-md-4"><img src="${couverture}" class="img-fluid rounded" alt="Couverture"></div>` : ''}
            <div class="${couverture ? 'col-md-8' : 'col-12'}">
                <h3>${titre || "Sans titre"}</h3>
                <h5 class="text-muted mb-3">${auteur || "Auteur inconnu"}</h5>
                <hr>
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