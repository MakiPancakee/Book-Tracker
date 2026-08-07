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
    // On regarde dans la mémoire du navigateur (localStorage)
    const utilisateurEnregistre = localStorage.getItem("utilisateurActif");

    if (utilisateurEnregistre) {
        // S'il est connu, on cache l'écran de profil et on montre l'application
        document.getElementById("ecran-profil").classList.add("cache");
        document.getElementById("application-principale").classList.remove("cache");
        document.getElementById("message-bienvenue").innerText = "Connectée en tant que : " + utilisateurEnregistre;

        // On charge les livres de la bibliothèque (fonction à créer plus tard)
        console.log("Chargement des livres pour : " + utilisateurEnregistre);
    } else {
        // S'il est inconnu, on s'assure que l'écran de choix de profil est visible
        document.getElementById("ecran-profil").classList.remove("cache");
        document.getElementById("application-principale").classList.add("cache");
    }

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

                    // Index ajustés par rapport à appendRow :
                    const personne = ligne[1]; // Col B
                    const date_debut = ligne[2]; // Col C
                    const date_fin = ligne[3];   // Col D
                    const duree = ligne[4];      // Col E
                    const couverture = ligne[5];  // Col F
                    const titre = ligne[6];    // Col G
                    const auteur = ligne[7];   // Col H
                    const pages = ligne[8];    // Col I
                    const prix_officiel = ligne[9]; // Col J
                    const prix_reel = ligne[10]; // Col K
                    const format = ligne[11]; // Col L
                    const genre = ligne[12]; // Col M
                    const statut = ligne[13];  // Col N
                    const notes = ligne[14];   // Col O
                    const review = ligne[15];  // Col P

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
}

// Fonction appelée quand on clique sur "Moi" ou "Mon Amie" au début
function choisirProfil(nom) {
    // On sauvegarde le nom dans la mémoire du navigateur
    localStorage.setItem("utilisateurActif", nom);
    // On relance la vérification pour afficher l'application
    verifierProfil();
}


/* ========================================================
   GESTION DE L'INTERFACE (VUES ET FORMULAIRE)
   ======================================================== */

// Fonction pour changer d'onglet (Ma bibliothèque, Sa bibliothèque, Commune)
function changerVue(vueDemandee) {
    console.log("Tu veux voir la bibliothèque : " + vueDemandee);
    // Plus tard, on filtrera les livres ici en fonction de la vue demandée
}

// Fonction pour afficher la fenêtre d'ajout de livre
function ouvrirFormulaire() {
    document.getElementById("modal-formulaire").classList.remove("cache");
}

// Fonction pour cacher la fenêtre d'ajout de livre
function fermerFormulaire() {
    document.getElementById("modal-formulaire").classList.add("cache");
    document.getElementById("form-livre").reset(); // Vide les champs
}


/* ========================================================
   GESTION DE L'AJOUT D'UN LIVRE
   ======================================================== */

// Fonction déclenchée quand on clique sur "Enregistrer" dans le formulaire
function soumettreLivre(event) {
    // On empêche la page de se recharger (comportement par défaut d'un formulaire)
    event.preventDefault();

    // 1. On récupère qui ajoute le livre (Toi ou ton amie)
    const personne = localStorage.getItem("utilisateurActif");

    // 2. On fabrique notre objet "Livre" avec les données du formulaire
    const nouveauLivre = {
        id: Date.now(), // Génère un identifiant unique basé sur la date et l'heure
        personne: personne, // Rempli automatiquement en arrière-plan !
        titre: document.getElementById("titre").value,
        auteur: document.getElementById("auteur").value,
        statut: document.getElementById("statut").value,
        // Tu ajouteras les autres champs ici quand tu auras mis à jour le HTML
    };

    console.log("Nouveau livre prêt à être envoyé :", nouveauLivre);

    // URL GOOGLE APPS SCRIPT
    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyFlu8ZuK_k-YPKbcjfQLt95iE8U9mKq_kN-ZfE9xuz47tsbJAh4150k8vUkZyXTHDNYA/exec";

    // On prépare le colis à envoyer
    const options = {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(nouveauLivre)
    };

    // On envoie le colis à Google Apps Script
    fetch(URL_APPS_SCRIPT, options)
        .then(reponse => reponse.json())
        .then(resultat => {
            console.log("Résultat reçu de Google :", resultat);

            if (resultat.statut === "succès") {
                alert("Le livre \"" + nouveauLivre.titre + "\" a bien été ajouté au Google Sheet !");
                fermerFormulaire(); // La fenêtre se ferme automatiquement après l'ajout
            } else {
                alert("Erreur retournée par Google : " + resultat.message);
            }
        })
        .catch(erreur => {
            console.error("Erreur d'envoi :", erreur);
            alert("Oups, impossible de contacter le serveur Google.");
        });
}

