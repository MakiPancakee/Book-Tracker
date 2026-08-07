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