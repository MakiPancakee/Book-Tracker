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
   CHARGEMENT ET AFFICHAGE DES LIVRES
   ======================================================== */

function chargerLivres() {
    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyFlu8ZuK_k-YPKbcjfQLt95iE8U9mKq_kN-ZfE9xuz47tsbJAh4150k8vUkZyXTHDNYA/exec";

    fetch(URL_APPS_SCRIPT)
        .then(reponse => reponse.json())
        .then(lignes => {
            const grille = document.getElementById("grille-livres");
            grille.innerHTML = ""; // On vide la grille avant de recharger

            // i = 1 pour sauter la ligne d'en-tête du tableau
            for (let i = 1; i < lignes.length; i++) {
                const ligne = lignes[i];

                // Emplacements des colonnes dans ton Google Sheet :
                const personne = ligne[1]; // Col B
                const titre = ligne[6];    // Col G
                const auteur = ligne[7];   // Col H
                const statut = ligne[13];  // Col N

                // Si pas de titre sur la ligne, on passe
                if (!titre) continue;

                const carteHtml = `
                    <div class="col">
                        <div class="card h-100 shadow-sm border-0">
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
            }
        })
        .catch(erreur => console.error("Erreur lors du chargement des livres :", erreur));
}

/* ========================================================
   GESTION DE L'INTERFACE (VUES ET FORMULAIRE)
   ======================================================== */

// Fonction pour changer d'onglet (Ma bibliothèque, Sa bibliothèque, Commune)
function changerVue(vueDemandee) {
    console.log("Tu veux voir la bibliothèque : " + vueDemandee);
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