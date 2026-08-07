// On attend que la page HTML soit complètement chargée avant d'exécuter le code
document.addEventListener("DOMContentLoaded", () => {
    verifierProfil();

    // On écoute la soumission du formulaire d'ajout de livre
    document.getElementById("form-livre").addEventListener("submit", soumettreLivre);
});

/* ========================================================
   GESTION DU PROFIL (QUI EST CONNECTÉ ?)
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

    // Remplace ce faux lien par l'URL que tu viens de copier dans Apps Script !
    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxv7Vv59HeTFWD0IY9GwVkznKTpa__4lE1x_tum-wkAF9BlCLp_nSE6JbYkPw54WpuSkw/exec";

    // On prépare le colis à envoyer
    const options = {
        method: "POST",
        // 'text/plain' évite certains blocages de sécurité des navigateurs (CORS)
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(nouveauLivre) // On transforme notre objet en texte
    };

    // On envoie le colis au facteur (Google)
    fetch(URL_APPS_SCRIPT, options)
        .then(reponse => reponse.json())
        .then(resultat => {
            console.log("Succès :", resultat);
            alert("Le livre " + nouveauLivre.titre + " a été ajouté au Google Sheet !");
            fermerFormulaire(); // On ferme la fenêtre
        })
        .catch(erreur => {
            console.error("Erreur :", erreur);
            alert("Oups, une erreur s'est produite...");
        });
    // fetch('TON_URL_APPS_SCRIPT_SECRETE', { ... })

    // On ferme le formulaire une fois terminé
    fermerFormulaire();
    alert("Le livre " + nouveauLivre.titre + " est prêt à être envoyé !");
}

