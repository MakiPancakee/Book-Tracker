/* ============================================================
   📚 LE CERCLE DES CERVEAUX DISPARUS — SCRIPT V2
   ============================================================

   Cette version a été réorganisée pour être plus facile à lire.

   PRINCIPES :

   1. Google Sheets reste notre base de données.
   2. Une ligne du Google Sheet est transformée en objet "Livre".
   3. Le reste du programme utilise des noms compréhensibles :

          livre.titre
          livre.auteur
          livre.note
          livre.statut

      au lieu de :

          livre[6]
          livre[7]
          livre[14]

   4. Les fonctions sont regroupées par fonctionnalité.
   5. Les fonctions répétitives sont regroupées autant que possible.
   6. Les commentaires expliquent volontairement beaucoup de choses.

   ------------------------------------------------------------

   STRUCTURE DU GOOGLE SHEET

   A  = id
   B  = personne
   C  = dateDebut
   D  = dateFin
   E  = duree
   F  = couverture
   G  = titre
   H  = auteur
   I  = pages
   J  = prixOfficiel
   K  = prixReel
   L  = format
   M  = genre
   N  = statut
   O  = note
   P  = review
   Q  = anneeLecture
   R  = coupDeCoeur
   S  = spice
   T  = citation

   IMPORTANT :
   Les indices [0], [1], etc. n'existent plus dans le reste
   du programme. Ils ne sont utilisés qu'une seule fois,
   dans convertirLivre(), pour transformer la ligne.

============================================================ */


/* ============================================================
   1. CONFIGURATION
============================================================ */

function echapperHTML(texte) {
    if (!texte) return "";
    return String(texte)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/*
 * URL de ton Google Apps Script.
 *
 * C'est cette URL qui permet au site de communiquer
 * avec ton Google Sheet.
 */
const URL_APPS_SCRIPT =
    "https://script.google.com/macros/s/AKfycbzfXagjnK-neDNfzMODyiTqx2wfgYDxIJTkvx5Ij-Ly_CdC4U27oBpnuqsxYVu0ZtSfyQ/exec";


/*
 * Clé API Google Books.
 *
 * Elle est utilisée uniquement pour rechercher les livres
 * et récupérer automatiquement leurs informations.
 */
const CLE_API_GOOGLE_BOOKS =
    "AIzaSyC6NWy-fhdyj7295-uMW9MTRRdvBwyHtCI";


/* ============================================================
   2. DONNÉES DE L'APPLICATION
============================================================ */

/*
 * Tableau contenant TOUS les livres récupérés depuis Google Sheets.
 *
 * Exemple :
 *
 * tousLesLivres = [
 *     livre1,
 *     livre2,
 *     livre3
 * ];
 */
let tousLesLivres = [];


/*
 * Les filtres actuellement utilisés.
 *
 * personne :
 *     "Matide"
 *     "Flaure"
 *     "Commune"
 *
 * statut :
 *     "TOUS"
 *     "À lire"
 *     etc.
 *
 * annee :
 *     "TOUS"
 *     "2025"
 *     "2026"
 *
 * genre :
 *     "TOUS"
 *     "Fantasy"
 *     etc.
 */
const filtres = {
    personne: "Commune",
    statut: "TOUS",
    annee: "TOUS",
    genre: "TOUS",
    coupDeCoeur: false
};


/*
 * Langue utilisée pour Google Books.
 */
let langueAPI = "fr";


/*
 * Timer utilisé pour le carrousel automatique.
 *
 * On le conserve dans une variable afin de pouvoir
 * arrêter l'ancien timer avant d'en créer un nouveau.
 */
let carrouselTimer = null;


/*
 * Liste des citations disponibles dans la vue actuelle.
 */
let citationsActuelles = [];


/* ============================================================
   3. CLASSE LIVRE
============================================================ */

/*
 * Cette classe représente un livre dans notre application.

 * Pourquoi utiliser une classe ?
 *
 * Parce qu'elle nous permet d'avoir une structure claire
 * et identique pour tous les livres.
 *
 * On pourrait aussi utiliser de simples objets JavaScript,
 * mais la classe rend la structure plus explicite pour quelqu'un
 * qui reprend le projet après plusieurs années.
 */
class Livre {

    constructor(donnees = {}) {

        /*
         * Informations générales
         */
        this.id = donnees.id ?? "";
        this.personne = donnees.personne ?? "";

        /*
         * Dates
         */
        this.dateDebut = donnees.dateDebut ?? "";
        this.dateFin = donnees.dateFin ?? "";
        this.duree = donnees.duree ?? "";

        /*
         * Informations du livre
         */
        this.couverture = donnees.couverture ?? "";
        this.titre = donnees.titre ?? "";
        this.auteur = donnees.auteur ?? "";
        this.pages = donnees.pages ?? "";

        /*
         * Prix
         */
        this.prixOfficiel = donnees.prixOfficiel ?? "";
        this.prixReel = donnees.prixReel ?? "";

        /*
         * Informations de lecture
         */
        this.format = donnees.format ?? "Physique";
        this.genre = donnees.genre ?? "";
        this.statut = donnees.statut ?? "À lire";
        this.note = donnees.note ?? 0;
        this.review = donnees.review ?? "";

        /*
         * Q = année de lecture.
         *
         * C'est important :
         * la colonne Q ne contient pas des tags.
         */
        this.anneeLecture = donnees.anneeLecture ?? "";

        /*
         * Informations supplémentaires
         */
        this.coupDeCoeur = convertirBooleen(donnees.coupDeCoeur);
        this.spice = donnees.spice ?? 0;
        this.citation = donnees.citation ?? "";
    }
}


/* ============================================================
   4. CONVERSION GOOGLE SHEETS → OBJET LIVRE
============================================================ */

/*
 * Cette fonction est l'UNIQUE endroit où nous avons besoin
 * de connaître les positions des colonnes du Google Sheet.
 *
 * C'est très important.
 *
 * Si un jour tu ajoutes ou déplaces une colonne dans ton Sheet,
 * c'est ici que tu devras adapter le programme.
 *
 * Exemple :
 *
 * ligne[6] = colonne G = titre
 *
 * ligne[13] = colonne N = statut
 */
function convertirLivre(ligne) {

    return new Livre({

        id: ligne[0],

        personne: ligne[1],

        dateDebut: ligne[2],

        dateFin: ligne[3],

        duree: ligne[4],

        couverture: ligne[5],

        titre: ligne[6],

        auteur: ligne[7],

        pages: ligne[8],

        prixOfficiel: ligne[9],

        prixReel: ligne[10],

        format: ligne[11],

        genre: ligne[12],

        statut: ligne[13],

        note: ligne[14],

        review: ligne[15],

        /*
         * Q = année de lecture
         */
        anneeLecture: ligne[16],

        coupDeCoeur: ligne[17],

        spice: ligne[18],

        citation: ligne[19]
    });
}


/*
 * Transforme différentes valeurs possibles de Google Sheets
 * en vrai booléen JavaScript.
 *
 * Par exemple :
 *
 * "VRAI"  → true
 * "FAUX"  → false
 * true    → true
 * false   → false
 */
function convertirBooleen(valeur) {

    if (valeur === true) {
        return true;
    }

    if (typeof valeur === "string") {
        return valeur.toUpperCase() === "VRAI";
    }

    return false;
}


/* ============================================================
   5. INITIALISATION
============================================================ */

/*
 * DOMContentLoaded signifie :
 *
 * "Attends que le HTML soit complètement chargé avant
 * d'exécuter le programme."
 */
document.addEventListener("DOMContentLoaded", initialiser);


/*
 * Fonction principale appelée au démarrage du site.
 */
function initialiser() {

    /*
     * Vérifie si quelqu'un a déjà choisi son profil.
     */
    verifierProfil();


    /*
     * Bouton "Ajouter un livre".
     *
     * On utilise addEventListener plutôt que de mettre
     * onclick partout dans le HTML.
     */
    const boutonAjouter = document.getElementById("btn-ajouter-livre");

    if (boutonAjouter) {
        boutonAjouter.addEventListener("click", ouvrirFormulaire);
    }


    /*
     * Tous les boutons de navigation possèdent maintenant
     * un attribut data-vue.
     *
     * Exemple :
     *
     * data-vue="Matide"
     *
     * On récupère cette valeur ici.
     */
    document.querySelectorAll("[data-vue]").forEach(bouton => {

        bouton.addEventListener("click", () => {

            changerVue(bouton.dataset.vue);

        });

    });
}


/* ============================================================
   6. GESTION DU PROFIL
============================================================ */

/*
 * Vérifie si un profil a déjà été enregistré dans le navigateur.
 *
 * localStorage permet de conserver cette information même
 * lorsque la page est fermée.
 */
function verifierProfil() {

    const utilisateur = localStorage.getItem("utilisateurActif");

    const ecranProfil = document.getElementById("ecran-profil");
    const application = document.getElementById("application");

    /*
     * Aucun profil enregistré :
     * on affiche l'écran de choix.
     */
    if (!utilisateur) {

        ecranProfil.classList.remove("cache");
        application.classList.add("cache");

        return;
    }


    /*
     * Profil déjà enregistré :
     * on affiche l'application.
     */
    ecranProfil.classList.add("cache");
    application.classList.remove("cache");


    /*
     * Message de bienvenue.
     */
    document.getElementById("message-bienvenue").textContent =
        `Connectée en tant que : ${utilisateur}`;


    /*
     * On charge les livres depuis Google Sheets.
     */
    chargerLivres();
}


/*
 * Enregistre le profil choisi.
 */
function choisirProfil(nom) {

    localStorage.setItem("utilisateurActif", nom);

    verifierProfil();
}

function genererEtoiles(note) {
    const maxEtoiles = 5;
    let noteNum = parseFloat(note) || 0;
    let html = "";

    for (let i = 1; i <= maxEtoiles; i++) {
        if (i <= noteNum) {
            // Étoile pleine (utilisation de FontAwesome, standard classique)
            html += '<i class="fas fa-star text-warning"></i>';
        } else {
            // Étoile vide
            html += '<i class="far fa-star text-warning"></i>';
        }
    }
    return html;
}

/* ============================================================
    6.1. GESTION DES BOUTONS - VUE
============================================================ */

const boutonsFiltres = document.querySelectorAll(".btn-filtre");

boutonsFiltres.forEach(bouton => {
    bouton.addEventListener("click", () => {
        // 1. Retire le style plein (btn-primary) et remet le contour (btn-outline-primary) sur tous les boutons
        boutonsFiltres.forEach(b => {
            b.classList.remove("btn-primary");
            b.classList.add("btn-outline-primary");
        });

        // 2. Applique le style plein (btn-primary) uniquement sur le bouton cliqué
        bouton.classList.remove("btn-outline-primary");
        bouton.classList.add("btn-primary");
    });
});

/* ============================================================
   7. COMMUNICATION AVEC GOOGLE SHEETS
============================================================ */

/*
 * Récupère toutes les données du Google Sheet.
 */
async function chargerLivres() {
    try {
        const reponse = await fetch(URL_APPS_SCRIPT);

        if (!reponse.ok) {
            throw new Error(`Erreur HTTP ${reponse.status}`);
        }

        const lignes = await reponse.json();

        // Vérifie si on a bien un tableau
        if (!Array.isArray(lignes)) {
            throw new Error("Les données reçues ne sont pas un tableau valide.");
        }

        const donnees = lignes.slice(1);

        // Transformation sécurisée pour éviter qu'un livre corrompu bloque tout
        tousLesLivres = donnees.map((ligne, index) => {
            try {
                return convertirLivre(ligne);
            } catch (e) {
                console.warn(`Erreur sur la ligne ${index + 1}:`, e);
                return null; // Ignore la ligne défectueuse au lieu de tout bloquer
            }
        }).filter(livre => livre !== null); // Nettoie les nuls

        appliquerFiltresEtAfficher();
        afficherCarousel();

    } catch (erreur) {
        console.error("Erreur lors du chargement des livres :", erreur);
        alert(
            "Impossible de charger la bibliothèque.\n\n" +
            "Vérifie ta connexion ou ton Google Apps Script."
        );
    }
}

function formatStatut(statut) {
    if (!statut) return "Inconnu";

    // Convertit et nettoie la valeur pour gérer les différents formats possibles
    const statutClean = String(statut).trim().toLowerCase();

    switch (statutClean) {
        case "lu":
        case "lus":
            return "Lu";
        case "en_cours":
        case "en cours":
            return "En cours";
        case "a_lire":
        case "à lire":
            return "À lire";
        case "abandonne":
        case "abandonné":
            return "Abandonné";
        default:
            return statut; // Retourne le statut original s'il ne correspond à aucun cas
    }
}

/* ============================================================
   8. FILTRES
============================================================ */

/*
 * Change la vue principale.
 *
 * Les boutons appellent cette fonction avec :
 *
 * "Matide"
 * "Flaure"
 * "Commune"
 * "PAL"
 * "CoupsDeCoeur"
 */
function changerVue(vue) {

    /*
     * Vue PAL
     */
    if (vue === "PAL") {

        filtres.statut =
            filtres.statut === "À lire"
                ? "TOUS"
                : "À lire";

        filtres.coupDeCoeur = false;
    }


    /*
     * Vue Coups de cœur
     */
    else if (vue === "CoupsDeCoeur") {

        filtres.coupDeCoeur =
            !filtres.coupDeCoeur;

        filtres.statut = "TOUS";
    }


    /*
     * Bibliothèque classique.
     */
    else {

        filtres.personne = vue;

        filtres.statut = "TOUS";

        filtres.coupDeCoeur = false;
    }


    /*
     * Quand on change complètement de vue,
     * on remet les sous-filtres à zéro.
     */
    filtres.annee = "TOUS";
    filtres.genre = "TOUS";


    appliquerFiltresEtAfficher();
}


/*
 * Filtre par année.
 *
 * Cette fonction est prévue pour la fonctionnalité
 * de tri par année que tu veux ajouter.
 */
function filtrerParAnnee(annee) {

    filtres.annee = annee;

    appliquerFiltresEtAfficher();
}


/*
 * Filtre par genre.
 */
function filtrerParGenre(genre) {

    filtres.genre = genre;

    appliquerFiltresEtAfficher();
}


/*
 * Retourne uniquement les livres correspondant
 * aux filtres actuels.
 */
function obtenirLivresFiltres() {

    return tousLesLivres.filter(livre => {

        /*
         * PERSONNE
         *
         * Si la vue est "Commune", on affiche tout.
         */
        const personneOK =
            filtres.personne === "Commune" ||
            !filtres.personne ||
            livre.personne === filtres.personne;


        /*
         * STATUT
         */
        const statutOK =
            filtres.statut === "TOUS" ||
            livre.statut.includes(filtres.statut);


        /*
         * COUP DE CŒUR
         */
        const coeurOK =
            !filtres.coupDeCoeur ||
            livre.coupDeCoeur;


        /*
         * ANNÉE
         *
         * Q = année de lecture.
         *
         * On transforme en String pour éviter les problèmes
         * si Google Sheets renvoie parfois un nombre
         * et parfois du texte.
         */
        const anneeOK =
            filtres.annee === "TOUS" ||
            String(livre.anneeLecture) === String(filtres.annee);


        /*
         * GENRE
         *
         * toLowerCase() permet de ne pas faire de différence
         * entre "Fantasy" et "fantasy".
         */
        const genreOK =
            filtres.genre === "TOUS" ||
            livre.genre
                .toLowerCase()
                .includes(filtres.genre.toLowerCase());


        /*
         * Le livre doit respecter TOUS les filtres.
         */
        return (
            personneOK &&
            statutOK &&
            coeurOK &&
            anneeOK &&
            genreOK
        );
    });
}


/* ============================================================
   9. AFFICHAGE PRINCIPAL
============================================================ */

/*
 * Fonction centrale de l'affichage.
 *
 * Dès qu'un filtre change, on revient ici.
 */
function appliquerFiltresEtAfficher() {

    const livres = obtenirLivresFiltres();


    /*
     * Mise à jour du titre.
     */
    mettreAJourTitreVue();


    /*
     * Mise à jour des statistiques.
     */
    mettreAJourWidgets(livres);


    /*
     * Affichage des cartes.
     */
    afficherLivres(livres);


    /*
     * Le carrousel n'est affiché que sur la bibliothèque
     * commune sans filtre supplémentaire.
     */
    afficherOuMasquerCarousel();
}


/*
 * Met à jour le titre au-dessus de la grille.
 */
function mettreAJourTitreVue() {

    let titre = "Ma Bibliothèque";


    if (filtres.coupDeCoeur) {

        titre = "❤️ Mes Coups de Cœur";

    }

    else if (filtres.statut === "À lire") {

        titre = "📚 Ma Pile à Lire";

    }


    if (filtres.annee !== "TOUS") {

        titre += ` (${filtres.annee})`;

    }


    if (filtres.genre !== "TOUS") {

        titre += ` — ${filtres.genre}`;

    }


    document.getElementById("titre-grille").textContent = titre;
}


/*
 * Détermine si le carrousel doit être visible.
 */
function afficherOuMasquerCarousel() {

    const carousel =
        document.getElementById("section-carousel");


    const doitAfficher =
        filtres.personne === "Commune" &&
        filtres.statut === "TOUS" &&
        filtres.annee === "TOUS" &&
        filtres.genre === "TOUS" &&
        !filtres.coupDeCoeur;


    carousel.style.display =
        doitAfficher ? "block" : "none";
}


/* ============================================================
   10. AFFICHAGE DES CARTES LIVRES
============================================================ */

/*
 * Affiche une liste de livres.
 */
function afficherLivres(livres) {

    const grille =
        document.getElementById("grille-livres");


    /*
     * Si aucun livre ne correspond au filtre,
     * on affiche un message plutôt qu'une page vide.
     */
    if (livres.length === 0) {

        grille.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-muted fs-5">
                    Aucun livre ne correspond à cette sélection.
                </p>
            </div>
        `;

        return;
    }


    /*
     * map transforme chaque Livre en HTML.
     *
     * join("") rassemble tous les morceaux HTML.
     *
     * C'est plus propre que de faire :
     *
     * grille.innerHTML += ...
     *
     * à chaque tour de boucle.
     */
    grille.innerHTML = livres
        .map(creerCarteLivre)
        .join("");


    /*
     * Maintenant que les cartes existent dans le HTML,
     * on leur ajoute leurs événements.
     */
    grille
        .querySelectorAll("[data-action='ouvrir-livre']")
        .forEach(element => {

            element.addEventListener("click", () => {

                const index =
                    Number(element.dataset.index);

                ouvrirFicheLivre(index);
            });
        });


    /*
     * Même chose pour les cœurs.
     */
    grille
        .querySelectorAll("[data-action='coeur']")
        .forEach(element => {

            element.addEventListener("click", event => {

                event.stopPropagation();

                const index =
                    Number(element.dataset.index);

                toggleCoupDeCoeur(index);
            });
        });
}


/*
 * Crée UNE carte de livre.
 *
 * C'est la seule fonction qui connaît le HTML
 * d'une carte.
 *
 * Cela évite de répéter le même gros morceau
 * de HTML à plusieurs endroits.
 */
function creerCarteLivre(livre) {

    /*
     * On retrouve l'index réel du livre dans
     * tousLesLivres.
     *
     * Cet index est nécessaire pour pouvoir modifier
     * le bon livre dans Google Sheets.
     */
    const index =
        tousLesLivres.indexOf(livre);


    const coeur =
        livre.coupDeCoeur ? "❤️" : "🤍";


    /*
     * Une couverture n'est pas obligatoire.
     */
    const couvertureHTML =
        livre.couverture
            ? `
                <img
                    src="${echapperHTML(livre.couverture)}"
                    class="card-img-top cover-image"
                    alt="Couverture de ${echapperHTML(livre.titre)}"
                >
              `
            : "";


    return `
        <div class="col">

            <div
                class="card h-100 shadow-sm border-0 position-relative fade-in"
                data-action="ouvrir-livre"
                data-index="${index}"
                style="cursor:pointer;"
            >

                <button
                    type="button"
                    class="btn position-absolute top-0 end-0 fs-4 p-1"
                    data-action="coeur"
                    data-index="${index}"
                    title="Coup de cœur"
                    style="z-index:2;"
                >
                    ${coeur}
                </button>

                ${couvertureHTML}

                <div class="card-body">

                    <span class="badge bg-primary mb-2">
                        ${echapperHTML(livre.personne)}
                    </span>

                    <h5 class="card-title fw-bold">
                        ${echapperHTML(livre.titre)}
                    </h5>

                    <p class="card-subtitle text-muted mb-3">
                        ${echapperHTML(livre.auteur)}
                    </p>

                    <span class="badge bg-light text-dark border">
                        ${formatStatut(livre.statut)}
                    </span>

                </div>

            </div>

        </div>
    `;
}


/* ============================================================
   11. STATISTIQUES
============================================================ */

/*
 * Met à jour les quatre widgets du haut.
 */
function mettreAJourWidgets(livres) {

    let totalLus = 0;
    let totalPages = 0;
    let budgetReel = 0;
    let budgetOfficiel = 0;

    const compteGenres = {};


    /*
     * Les citations sont également recalculées
     * à partir de la vue actuelle.
     */
    citationsActuelles = [];


    livres.forEach(livre => {

        /*
         * LIVRES LUS
         */
        if (
            livre.statut.includes("Terminé") ||
            livre.statut.includes("Lu")
        ) {

            totalLus++;

            totalPages +=
                parseInt(livre.pages) || 0;


            /*
             * GENRES
             */
            if (livre.genre) {

                const genres =
                    livre.genre
                        .split(",")
                        .map(genre => genre.trim())
                        .filter(Boolean);


                genres.forEach(genre => {

                    compteGenres[genre] =
                        (compteGenres[genre] || 0) + 1;

                });
            }
        }


        /*
         * BUDGET
         */
        budgetReel +=
            parseFloat(nettoyerPrix(livre.prixReel)) || 0;

        budgetOfficiel +=
            parseFloat(nettoyerPrix(livre.prixOfficiel)) || 0;


        /*
         * CITATIONS
         */
        if (livre.citation) {

            livre.citation
                .split(";")
                .map(citation => citation.trim())
                .filter(Boolean)
                .forEach(citation => {

                    citationsActuelles.push({

                        texte: citation,

                        source: livre.titre

                    });

                });
        }

    });


    /*
     * On récupère les trois genres les plus représentés.
     */
    const topGenres =
        Object.entries(compteGenres)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(element => element[0]);


    /*
     * AFFICHAGE
     */
    document.getElementById("stat-lus").textContent =
        totalLus;


    document.getElementById("stat-budget").textContent =
        `${budgetReel.toFixed(0)} € / ${budgetOfficiel.toFixed(0)} €`;


    document.getElementById("stat-pages").textContent =
        totalPages;


    document.getElementById("stat-genres").textContent =
        topGenres.length
            ? topGenres.join(", ")
            : "-";


    /*
     * On affiche également une citation.
     */
    afficherCitationAleatoire();
}


/*
 * Nettoie un prix provenant du Sheet.
 *
 * Google Sheets peut parfois renvoyer des valeurs
 * sous forme de texte.
 */
function nettoyerPrix(valeur) {

    if (!valeur) {
        return "";
    }


    const texte =
        String(valeur).trim();


    /*
     * On ignore les dates qui pourraient accidentellement
     * se retrouver dans une colonne de prix.
     */
    if (
        texte.includes("T") ||
        texte.includes("GMT") ||
        /^\d{4}-\d{2}-\d{2}/.test(texte)
    ) {

        return "";
    }


    /*
     * On conserve uniquement les chiffres,
     * le point et la virgule.
     */
    return texte.replace(/[^0-9.,]/g, "");
}


/* ============================================================
   12. CITATIONS
============================================================ */

/*
 * Affiche une citation aléatoire.
 */
function afficherCitationAleatoire() {

    const texte =
        document.getElementById("citation-texte");

    const source =
        document.getElementById("citation-source");


    /*
     * Aucune citation.
     */
    if (citationsActuelles.length === 0) {

        texte.textContent =
            "Aucune citation enregistrée pour l'instant.";

        source.textContent = "";

        return;
    }


    /*
     * Choisit un nombre aléatoire.
     */
    const index =
        Math.floor(
            Math.random() * citationsActuelles.length
        );


    const citation =
        citationsActuelles[index];


    /*
     * Petit effet de transition.
     */
    texte.style.opacity = "0";
    source.style.opacity = "0";


    setTimeout(() => {

        texte.textContent =
            citation.texte;

        source.innerHTML =
            `— <em>${echapperHTML(citation.source)}</em>`;


        texte.style.transition =
            "opacity .3s ease";

        source.style.transition =
            "opacity .3s ease";


        texte.style.opacity = "1";
        source.style.opacity = "1";

    }, 200);
}


/* ============================================================
   13. CARROUSEL
============================================================ */

/*
 * Construit le carrousel des dernières lectures terminées.
 */
function afficherCarousel() {

    const conteneur =
        document.getElementById("carousel-livres");


    /*
     * On sélectionne les cinq derniers livres terminés
     * de chacune des deux personnes.
     */
    const flaure =
        tousLesLivres
            .map((livre, index) => ({ livre, index }))
            .filter(({ livre }) =>
                livre.personne === "Flaure" &&
                livre.statut.includes("Terminé")
            )
            .reverse()
            .slice(0, 5);


    const matide =
        tousLesLivres
            .map((livre, index) => ({ livre, index }))
            .filter(({ livre }) =>
                livre.personne === "Matide" &&
                livre.statut.includes("Terminé")
            )
            .reverse()
            .slice(0, 5);


    const livres =
        [...flaure, ...matide];


    conteneur.innerHTML =
        livres
            .map(creerCarteCarousel)
            .join("");


    /*
     * Ajoute le clic sur chaque carte.
     */
    conteneur
        .querySelectorAll("[data-carousel-index]")
        .forEach(element => {

            element.addEventListener("click", () => {

                ouvrirFicheLivre(
                    Number(element.dataset.carouselIndex)
                );

            });

        });


    demarrerAutoScrollCarousel();
}


/*
 * Crée une carte du carrousel.
 */
function creerCarteCarousel({ livre, index }) {

    const couverture =
        livre.couverture ||
        "https://via.placeholder.com/150x220?text=Pas+de+couverture";


    return `
        <div
            class="card carousel-card shadow-sm border-0"
            data-carousel-index="${index}"
        >

            <div class="row g-0 align-items-center">

                <div class="col-4">

                    <img
                        src="${echapperHTML(couverture)}"
                        class="img-fluid rounded-start"
                        alt="Couverture"
                    >

                </div>

                <div class="col-8">

                    <div class="card-body p-2">

                        <h6
                            class="fw-bold mb-1 text-truncate"
                            title="${echapperHTML(livre.titre)}"
                        >
                            ${echapperHTML(livre.titre)}
                        </h6>

                        <small class="text-muted d-block text-truncate">
                            ${echapperHTML(livre.auteur)}
                        </small>

                        <div>
                            ${genererEtoiles(livre.note)}
                        </div>

                    </div>

                </div>

            </div>

        </div>
    `;
}


/*
 * Démarre le défilement automatique.
 */
function demarrerAutoScrollCarousel() {

    const conteneur =
        document.getElementById("carousel-livres");


    /*
     * Si un ancien timer existe,
     * on le supprime.
     */
    if (carrouselTimer) {

        clearInterval(carrouselTimer);

    }


    /*
     * Toutes les trois secondes,
     * on fait avancer le carrousel.
     */
    carrouselTimer =
        setInterval(() => {

            if (!conteneur) {
                return;
            }


            /*
             * Si on est arrivé au bout,
             * on revient au début.
             */
            if (
                conteneur.scrollLeft +
                conteneur.clientWidth >=
                conteneur.scrollWidth - 10
            ) {

                conteneur.scrollTo({
                    left: 0,
                    behavior: "smooth"
                });

            }

            else {

                conteneur.scrollBy({
                    left: 202,
                    behavior: "smooth"
                });

            }

        }, 2000);
}


/* ============================================================
   14. COUPS DE CŒUR
============================================================ */

/*
 * Active ou désactive le coup de cœur d'un livre.
 */
async function toggleCoupDeCoeur(index) {

    const livre =
        tousLesLivres[index];


    if (!livre) {
        return;
    }


    /*
     * Inverse la valeur.
     */
    livre.coupDeCoeur =
        !livre.coupDeCoeur;


    /*
     * On rafraîchit immédiatement l'écran.
     */
    appliquerFiltresEtAfficher();

    afficherCarousel();


    /*
     * Puis on sauvegarde dans Google Sheets.
     */
    await envoyerAuGoogleSheet({

        action: "UPDATE_COEUR",

        ligne: index + 2,

        coup_de_coeur: livre.coupDeCoeur

    });
}


/* ============================================================
   15. FORMULAIRE D'AJOUT
============================================================ */

/*
 * Ouvre le formulaire.
 *
 * Contrairement à l'ancienne version,
 * le HTML du formulaire sera créé ici.
 *
 * Cela permet d'avoir un index.html beaucoup plus léger.
 */
function ouvrirFormulaire() {

    const modal =
        document.getElementById("modal-formulaire");


    modal.innerHTML =
        creerFormulaireHTML();


    modal.classList.remove("cache");


    /*
     * On récupère le formulaire nouvellement créé.
     */
    const formulaire =
        document.getElementById("form-livre");


    /*
     * Quand il est envoyé,
     * on appelle soumettreLivre().
     */
    formulaire.addEventListener(
        "submit",
        soumettreLivre
    );


    /*
     * Gestion du statut.
     */
    document
        .getElementById("statut")
        .addEventListener(
            "change",
            gererAffichageCreation
        );


    /*
     * On prépare l'affichage.
     */
    gererAffichageCreation();


    /*
     * Étoiles.
     */
    document
        .querySelectorAll("#star-rating-creation span")
        .forEach((etoile, index) => {

            etoile.addEventListener(
                "click",
                () => selectionnerEtoileCreation(index + 1)
            );

        });


    /*
     * Piments.
     */
    document
        .querySelectorAll("#spice-rating-creation span")
        .forEach((piment, index) => {

            piment.addEventListener(
                "click",
                () => selectionnerPimentCreation(index + 1)
            );

        });


    /*
     * Coup de cœur.
     */
    document
        .getElementById("form-coeur-btn")
        .addEventListener(
            "click",
            toggleCoeurFormulaire
        );


    /*
     * Recherche Google Books.
     */
    document
        .getElementById("btn-recherche-api")
        .addEventListener(
            "click",
            rechercherLivreAPI
        );


    /*
     * Langues Google Books.
     */
    document
        .querySelectorAll("[data-langue-api]")
        .forEach(element => {

            element.addEventListener("click", () => {

                changerLangueAPI(
                    element.dataset.langueApi,
                    element.textContent
                );

            });

        });


    /*
     * Bouton fermer.
     */
    document
        .getElementById("btn-fermer-formulaire")
        .addEventListener(
            "click",
            fermerFormulaire
        );


    /*
     * Permet aussi de fermer en cliquant
     * sur le fond sombre.
     */
    modal.addEventListener(
        "click",
        gererClicOverlay
    );
}


/*
 * Ferme le formulaire.
 */
function fermerFormulaire() {

    const modal =
        document.getElementById("modal-formulaire");


    modal.classList.add("cache");

    modal.innerHTML = "";
}


/*
 * Ferme une modale lorsque l'utilisateur clique
 * sur le fond, mais pas sur sa carte intérieure.
 */
function gererClicOverlay(event) {

    if (
        event.target === event.currentTarget
    ) {

        fermerFormulaire();

    }
}


/*
 * Génère le HTML complet du formulaire.
 */
function creerFormulaireHTML() {

    return `

        <div class="card shadow-lg w-100"
             style="max-width:700px; max-height:95vh; overflow-y:auto;">

            <div class="card-header bg-success text-white
                        d-flex justify-content-between align-items-center">

                <h5 class="mb-0">
                    Ajouter une nouvelle lecture
                </h5>

                <button
                    type="button"
                    id="btn-fermer-formulaire"
                    class="btn-close btn-close-white">
                </button>

            </div>


            <div class="card-body">

                <form id="form-livre">

                    <!-- GOOGLE BOOKS -->

                    <div class="card bg-light border-0 p-3 mb-3">

                        <label class="fw-bold mb-2">
                            🔍 Auto-remplissage via Google Books
                        </label>

                        <div class="input-group">

                            <button
                                class="btn btn-outline-secondary dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                id="btn-langue-api">
                                🇫🇷 FR
                            </button>

                            <ul class="dropdown-menu">

                                <li>
                                    <button
                                        type="button"
                                        class="dropdown-item"
                                        data-langue-api="fr">
                                        🇫🇷 Français
                                    </button>
                                </li>

                                <li>
                                    <button
                                        type="button"
                                        class="dropdown-item"
                                        data-langue-api="en">
                                        🇺🇸 English
                                    </button>
                                </li>

                            </ul>

                            <input
                                type="text"
                                id="recherche-api-input"
                                class="form-control"
                                placeholder="Titre du livre..."
                            >

                            <button
                                type="button"
                                id="btn-recherche-api"
                                class="btn btn-primary">
                                Chercher
                            </button>

                        </div>

                        <div
                            id="resultats-api"
                            class="list-group mt-2">
                        </div>

                    </div>


                    <!-- INFORMATIONS PRINCIPALES -->

                    <div class="row">

                        <div class="col-md-6 mb-3">

                            <label class="form-label fw-bold">
                                Titre
                            </label>

                            <input
                                type="text"
                                id="titre"
                                class="form-control"
                                required
                            >

                        </div>

                        <div class="col-md-6 mb-3">

                            <label class="form-label fw-bold">
                                Auteur
                            </label>

                            <input
                                type="text"
                                id="auteur"
                                class="form-control"
                                required
                            >

                        </div>

                    </div>


                    <div class="mb-3">

                        <label class="form-label fw-bold">
                            URL de la couverture
                        </label>

                        <input
                            type="text"
                            id="nouveau-couverture"
                            class="form-control"
                        >

                    </div>


                    <div class="row">

                        <div class="col-md-4 mb-3">

                            <label class="form-label fw-bold">
                                Pages
                            </label>

                            <input
                                type="number"
                                id="nouveau-pages"
                                class="form-control"
                            >

                        </div>

                        <div class="col-md-4 mb-3">

                            <label class="form-label fw-bold">
                                Prix officiel (€)
                            </label>

                            <input
                                type="text"
                                id="nouveau-prix-officiel"
                                class="form-control"
                            >

                        </div>

                        <div class="col-md-4 mb-3">

                            <label class="form-label fw-bold">
                                Genre
                            </label>

                            <input
                                type="text"
                                id="nouveau-genre"
                                class="form-control"
                                placeholder="Fantasy, Romance..."
                            >

                        </div>

                    </div>


                    <div class="row border-bottom pb-3 mb-3">

                        <div class="col-md-6">

                            <label class="form-label fw-bold">
                                Statut
                            </label>

                            <select
                                id="statut"
                                class="form-select">

                                <option value="À lire">
                                    À lire 📚
                                </option>

                                <option value="En cours">
                                    En cours 📖
                                </option>

                                <option value="Pause">
                                    Pause ⏸
                                </option>

                                <option value="Terminé">
                                    Terminé ✔️
                                </option>

                                <option value="Abandonné">
                                    Abandonné ❌☠️
                                </option>

                            </select>

                        </div>


                        <div class="col-md-6">

                            <label class="form-label fw-bold">
                                Format
                            </label>

                            <select
                                id="nouveau-format"
                                class="form-select">

                                <option value="Physique">
                                    Physique
                                </option>

                                <option value="E-Book">
                                    E-Book
                                </option>

                                <option value="Audio">
                                    Audio
                                </option>

                            </select>

                        </div>

                    </div>


                    <!-- OPTIONS AVANCÉES -->

                    <div id="bloc-avance-creation">

                        <div class="row">

                            <div class="col-md-6 mb-3">

                                <label class="form-label fw-bold">
                                    Date de début
                                </label>

                                <input
                                    type="text"
                                    id="nouveau-date-debut"
                                    class="form-control"
                                    placeholder="JJ/MM/AAAA"
                                >

                            </div>

                            <div class="col-md-6 mb-3">

                                <label class="form-label fw-bold">
                                    Date de fin
                                </label>

                                <input
                                    type="text"
                                    id="nouveau-date-fin"
                                    class="form-control"
                                    placeholder="JJ/MM/AAAA"
                                >

                            </div>

                        </div>


                        <div class="row bg-light rounded p-2 mb-3">

                            <div class="col-md-4 text-center">

                                <label class="fw-bold">
                                    Note
                                </label>

                                <div
                                    id="star-rating-creation"
                                    class="fs-4">

                                    ${creerEtoilesInteractives()}

                                </div>

                                <input
                                    type="hidden"
                                    id="nouveau-note"
                                    value="0"
                                >

                            </div>


                            <div class="col-md-4 text-center border-start border-end">

                                <label class="fw-bold">
                                    Spice
                                </label>

                                <div
                                    id="spice-rating-creation"
                                    class="fs-4">

                                    ${creerPimentsInteractifs()}

                                </div>

                                <input
                                    type="hidden"
                                    id="nouveau-spice"
                                    value="0"
                                >

                            </div>


                            <div class="col-md-4 text-center">

                                <label class="fw-bold">
                                    Coup de cœur
                                </label>

                                <div
                                    id="form-coeur-btn"
                                    class="fs-4"
                                    style="cursor:pointer;">
                                    🤍
                                </div>

                                <input
                                    type="hidden"
                                    id="nouveau-coeur"
                                    value="false"
                                >

                            </div>

                        </div>


                        <div class="mb-3">

                            <label class="form-label fw-bold">
                                Citations préférées
                            </label>

                            <textarea
                                id="nouveau-citation"
                                class="form-control"
                                rows="2"
                                placeholder="Séparées par un point-virgule (;)">
                            </textarea>

                        </div>

                    </div>


                    <div class="d-flex justify-content-end gap-2">

                        <button
                            type="button"
                            id="btn-annuler-formulaire"
                            class="btn btn-secondary">
                            Annuler
                        </button>

                        <button
                            type="submit"
                            class="btn btn-success fw-bold">
                            💾 Ajouter
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;
}


/*
 * Crée les cinq étoiles du formulaire.
 */
function creerEtoilesInteractives() {

    return Array.from(
        { length: 5 },
        () => `<span class="text-muted"
                       style="cursor:pointer;">★</span>`
    ).join("");
}


/*
 * Crée les cinq piments.
 */
function creerPimentsInteractifs() {

    return Array.from(
        { length: 5 },
        () => `
            <span
                style="
                    cursor:pointer;
                    filter:grayscale(100%) opacity(40%);
                ">
                🌶️
            </span>
        `
    ).join("");
}


/*
 * Montre ou cache les informations avancées.
 *
 * Si le livre est simplement "À lire",
 * nous n'avons pas besoin des dates, note, etc.
 */
function gererAffichageCreation() {

    const statut =
        document.getElementById("statut");


    const bloc =
        document.getElementById("bloc-avance-creation");


    if (!statut || !bloc) {
        return;
    }


    bloc.classList.toggle(
        "cache",
        statut.value === "À lire"
    );
}


/*
 * Sélection d'une note.
 */
function selectionnerEtoileCreation(note) {

    document.getElementById("nouveau-note").value =
        note;


    document
        .querySelectorAll("#star-rating-creation span")
        .forEach((etoile, index) => {

            etoile.classList.toggle(
                "text-warning",
                index < note
            );

            etoile.classList.toggle(
                "text-muted",
                index >= note
            );

        });
}


/*
 * Sélection du niveau de spice.
 */
function selectionnerPimentCreation(note) {

    document.getElementById("nouveau-spice").value =
        note;


    document
        .querySelectorAll("#spice-rating-creation span")
        .forEach((piment, index) => {

            piment.style.filter =
                index < note
                    ? "none"
                    : "grayscale(100%) opacity(40%)";

        });
}


/*
 * Active/désactive le cœur du formulaire.
 */
function toggleCoeurFormulaire() {

    const champ =
        document.getElementById("nouveau-coeur");


    const bouton =
        document.getElementById("form-coeur-btn");


    const actif =
        champ.value === "true";


    champ.value =
        actif ? "false" : "true";


    bouton.textContent =
        actif ? "🤍" : "❤️";
}


/* ============================================================
   16. ENVOI D'UN NOUVEAU LIVRE
============================================================ */

/*
 * Fonction appelée quand on valide le formulaire.
 */
async function soumettreLivre(event) {

    event.preventDefault();


    /*
     * Création de l'objet à envoyer à Google Apps Script.
     */
    const donnees = {

        action: "INSERT",

        id: Date.now(),

        personne:
            localStorage.getItem("utilisateurActif"),

        titre:
            document.getElementById("titre").value,

        auteur:
            document.getElementById("auteur").value,

        couverture:
            document.getElementById("nouveau-couverture").value,

        pages:
            document.getElementById("nouveau-pages").value,

        prix_officiel:
            nettoyerPrix(
                document.getElementById("nouveau-prix-officiel").value
            ),

        genre:
            document.getElementById("nouveau-genre").value,

        format:
            document.getElementById("nouveau-format").value,

        statut:
            document.getElementById("statut").value,

        date_debut:
            document.getElementById("nouveau-date-debut").value,

        date_fin:
            document.getElementById("nouveau-date-fin").value,

        note:
            document.getElementById("nouveau-note").value,

        coup_de_coeur:
            document.getElementById("nouveau-coeur").value === "true",

        spice:
            document.getElementById("nouveau-spice").value,

        citation:
            document.getElementById("nouveau-citation").value.trim()
    };


    try {

        const resultat =
            await envoyerAuGoogleSheet(donnees);


        if (resultat?.statut === "succès") {

            fermerFormulaire();

            await chargerLivres();

        }

        else {

            alert(
                "Erreur Google : " +
                (resultat?.message || "Erreur inconnue")
            );

        }

    }

    catch (erreur) {

        console.error(erreur);

        alert(
            "Impossible d'enregistrer le livre."
        );
    }
}


/* ============================================================
   17. GOOGLE BOOKS
============================================================ */

/*
 * Change la langue de recherche Google Books.
 */
function changerLangueAPI(langue, label) {

    langueAPI = langue;

    const bouton =
        document.getElementById("btn-langue-api");


    if (bouton) {

        bouton.textContent =
            label.trim();

    }
}


/*
 * Recherche un livre dans Google Books.
 */
async function rechercherLivreAPI() {

    const input =
        document.getElementById("recherche-api-input");


    const conteneur =
        document.getElementById("resultats-api");


    const requete =
        input.value.trim();


    /*
     * On évite une recherche inutile
     * avec moins de trois caractères.
     */
    if (requete.length < 3) {

        conteneur.innerHTML =
            `<div class="list-group-item text-muted">
                Tape au moins 3 caractères.
             </div>`;

        return;
    }


    conteneur.innerHTML =
        `<div class="list-group-item text-muted">
            🔎 Recherche en cours...
         </div>`;


    const url =
        `https://www.googleapis.com/books/v1/volumes` +
        `?q=${encodeURIComponent(requete)}` +
        `&langRestrict=${langueAPI}` +
        `&maxResults=5` +
        `&key=${CLE_API_GOOGLE_BOOKS}`;


    try {

        const reponse =
            await fetch(url);


        if (!reponse.ok) {

            throw new Error(
                `Erreur Google Books (${reponse.status})`
            );

        }


        const donnees =
            await reponse.json();


        if (
            !donnees.items ||
            donnees.items.length === 0
        ) {

            conteneur.innerHTML =
                `<div class="list-group-item text-muted">
                    Aucun résultat trouvé.
                 </div>`;

            return;
        }


        conteneur.innerHTML =
            "";


        donnees.items.forEach(item => {

            const info =
                item.volumeInfo;


            const livreAPI = {

                titre:
                    info.title || "",

                auteur:
                    info.authors
                        ? info.authors.join(", ")
                        : "Auteur inconnu",

                couverture:
                    info.imageLinks?.thumbnail
                        ?.replace("http://", "https://")
                    || "",

                pages:
                    info.pageCount || "",

                genre:
                    info.categories?.[0] || "",

                // Ajout du prix officiel
                prixOfficiel:
                    item.saleInfo?.retailPrice?.amount ||
                    item.saleInfo?.listPrice?.amount ||
                    ""

            };


            const bouton =
                document.createElement("button");


            bouton.type = "button";

            bouton.className =
                "list-group-item list-group-item-action";


            bouton.innerHTML = `

                <div class="d-flex align-items-center gap-2">

                    ${livreAPI.couverture
                    ? `
                                <img
                                    src="${echapperHTML(livreAPI.couverture)}"
                                    style="
                                        width:28px;
                                        height:40px;
                                        object-fit:cover;
                                    "
                                >
                              `
                    : ""
                }

                    <div>

                        <strong>
                            ${echapperHTML(livreAPI.titre)}
                        </strong>

                        <small class="text-muted d-block">
                            ${echapperHTML(livreAPI.auteur)}
                        </small>

                    </div>

                </div>
            `;


            bouton.addEventListener(
                "click",
                () => remplirDepuisGoogleBooks(livreAPI)
            );


            conteneur.appendChild(bouton);

        });

    }

    catch (erreur) {

        console.error(erreur);

        conteneur.innerHTML =
            `<div class="list-group-item text-danger">
                ⚠️ ${echapperHTML(erreur.message)}
             </div>`;
    }
}


/*
 * Remplit le formulaire avec les informations
 * récupérées auprès de Google Books.
 */
function remplirDepuisGoogleBooks(livre) {

    document.getElementById("titre").value =
        livre.titre;

    document.getElementById("auteur").value =
        livre.auteur;

    document.getElementById("nouveau-couverture").value =
        livre.couverture;

    document.getElementById("nouveau-pages").value =
        livre.pages;

    document.getElementById("nouveau-genre").value =
        livre.genre;

    // Ajout du remplissage du prix officiel
    document.getElementById("nouveau-prix-officiel").value =
        livre.prixOfficiel;

    document.getElementById("resultats-api").innerHTML =
        "";
}

/* ============================================================
   18. FICHE DÉTAILLÉE D'UN LIVRE
============================================================ */

/*
 * Ouvre la fiche détaillée d'un livre.
 *
 * Un même titre peut avoir plusieurs entrées dans le Sheet
 * si Matide et Flaure l'ont lu, ou si une personne l'a relu.
 *
 * On regroupe donc les entrées portant le même titre.
 */

function ouvrirFicheLivre(index) {

    const livre =
        tousLesLivres[index];


    if (!livre) {
        return;
    }


    /*
     * Recherche des autres exemplaires du même titre.
     */
    const titreRecherche =
        String(livre.titre || "").trim().toLowerCase();


    const doublons =
        tousLesLivres.filter(element =>
            String(element.titre || "").trim().toLowerCase() ===
            titreRecherche
        );


    /*
     * Calculs cumulés.
     */
    let totalPages = 0;

    let totalPrixReel = 0;

    let totalPrixOfficiel = 0;


    const personnes = new Set();

    const formats = new Set();


    let coupDeCoeurGlobal = false;


    const avis = [];


    doublons.forEach(element => {

        if (element.personne) {
            personnes.add(element.personne);
        }


        if (element.format) {
            formats.add(element.format);
        }


        totalPages +=
            parseInt(element.pages) || 0;


        totalPrixReel +=
            parseFloat(
                nettoyerPrix(element.prixReel)
                    .replace(",", ".")
            ) || 0;


        totalPrixOfficiel +=
            parseFloat(
                nettoyerPrix(element.prixOfficiel)
                    .replace(",", ".")
            ) || 0;


        if (element.coupDeCoeur) {

            coupDeCoeurGlobal = true;

        }


        if (
            element.review &&
            element.review.trim()
        ) {

            avis.push({

                personne:
                    element.personne || "Moi",

                format:
                    element.format || "Standard",

                texte:
                    element.review

            });

        }

    });


    /*
     * Création du HTML des avis.
     */
    const avisHTML =
        avis.length
            ? avis.map(creerBlocAvis).join("")
            : `<p class="text-muted">
                    Aucun avis enregistré pour ce titre.
               </p>`;


    /*
     * Informations de date du livre sélectionné.
     */
    let lectureHTML =
        `<p class="text-muted">
            <em>
                Dates exactes non renseignées.
            </em>
         </p>`;


    if (livre.dateDebut && livre.dateFin) {

        lectureHTML =
            `<p>
                <strong>Période de lecture :</strong>
                Du ${echapperHTML(livre.dateDebut)}
                au ${echapperHTML(livre.dateFin)}
                ${livre.duree
                ? `(${echapperHTML(livre.duree)} jours)`
                : ""
            }
             </p>`;

    }

    else if (livre.dateDebut) {

        lectureHTML =
            `<p>
                <strong>Date de lecture :</strong>
                ${echapperHTML(livre.dateDebut)}
             </p>`;

    }


    /*
     * HTML de la fiche.
     */
    const contenu = `

        <div class="card shadow-lg bg-white"
             style="
                max-width:700px;
                width:90%;
                max-height:90vh;
                overflow-y:auto;
             ">

            <div class="card-body">

                <div class="d-flex justify-content-between
                            align-items-center mb-3">

                    <div class="d-flex align-items-center gap-3">

                        <h3 class="mb-0 fw-bold">
                            ${echapperHTML(livre.titre)}
                        </h3>

                        <button
                            id="popup-coeur-btn"
                            class="btn btn-link fs-3 p-0"
                            title="Coup de cœur">
                            ${coupDeCoeurGlobal ? "❤️" : "🤍"}
                        </button>

                    </div>


                    <div class="d-flex gap-2">

                        <button
                            id="btn-editer-livre"
                            class="btn btn-outline-primary btn-sm">
                            ✏️ Modifier
                        </button>

                        <button
                            id="btn-fermer-fiche"
                            class="btn-close">
                        </button>

                    </div>

                </div>


                <h5 class="text-muted">
                    ${echapperHTML(livre.auteur)}
                </h5>


                ${doublons.length > 1
            ? `
                            <div class="alert alert-info py-2">
                                ℹ️ Ce livre est enregistré
                                en <strong>
                                ${doublons.length}
                                </strong> exemplaires / éditions.
                            </div>
                          `
            : ""
        }


                <hr>


                <div class="row g-4">

                    ${livre.couverture
            ? `
                                <div class="col-md-4">

                                    <img
                                        src="${echapperHTML(livre.couverture)}"
                                        class="img-fluid rounded shadow-sm"
                                        alt="Couverture"
                                    >

                                </div>
                              `
            : ""
        }


                    <div class="${livre.couverture
            ? "col-md-8"
            : "col-12"
        }">

                        <p>
                            <strong>Propriétaires / Lecteurs :</strong>
                            ${Array.from(personnes)
            .map(echapperHTML)
            .join(", ") || "-"}
                        </p>


                        <p>
                            <strong>Formats :</strong>
                            ${Array.from(formats)
            .map(echapperHTML)
            .join(", ") || "-"}
                        </p>


                        ${lectureHTML}


                        <p>
                            <strong>Pages lues cumulées :</strong>
                            ${totalPages}
                        </p>


                        <p>
                            <strong>Budget dépensé :</strong>
                            ${totalPrixReel.toFixed(2)} €
                            <br>
                            <small class="text-muted">
                                Prix officiel :
                                ${totalPrixOfficiel.toFixed(2)} €
                            </small>
                        </p>


                        <p>
                            <strong>Nombre de lectures :</strong>
                            <span class="badge bg-success">
                                ${doublons.length}
                            </span>
                        </p>

                    </div>

                </div>


                <div class="mt-4">

                    <h5 class="fw-bold">
                        💬 Avis & relectures
                    </h5>

                    ${avisHTML}

                </div>

            </div>

        </div>
    `;


    const modal =
        document.getElementById("modal-fiche");


    modal.innerHTML =
        contenu;


    modal.classList.remove("cache");


    /*
     * Bouton fermer.
     */
    document
        .getElementById("btn-fermer-fiche")
        .addEventListener(
            "click",
            fermerFicheLivre
        );


    /*
     * Bouton modifier.
     */
    document
        .getElementById("btn-editer-livre")
        .addEventListener(
            "click",
            () => passerEnModeEdition(index)
        );


    /*
     * Bouton coup de cœur.
     */
    document
        .getElementById("popup-coeur-btn")
        .addEventListener(
            "click",
            () => toggleCoupDeCoeurPopup(index)
        );


    /*
     * Clic sur le fond.
     */
    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === event.currentTarget
            ) {

                fermerFicheLivre();

            }

        }
    );
}


/*
 * Crée un bloc d'avis.
 */
function creerBlocAvis(avis) {

    return `

        <div
            class="border-start border-4 border-primary
                   ps-3 py-2 bg-light rounded mb-3"
            style="white-space:pre-wrap;"
        >

            <div class="text-muted small mb-1">
                <em>
                    ${echapperHTML(avis.personne)}
                    -
                    ${echapperHTML(avis.format)}
                </em>
            </div>

            ${echapperHTML(avis.texte)}

        </div>
    `;
}


/*
 * Ferme la fiche.
 */
function fermerFicheLivre() {

    const modal =
        document.getElementById("modal-fiche");


    modal.classList.add("cache");

    modal.innerHTML = "";
}


/*
 * Cœur depuis la fiche détaillée.
 */
async function toggleCoupDeCoeurPopup(index) {

    await toggleCoupDeCoeur(index);


    /*
     * On réouvre la fiche afin de mettre à jour
     * son affichage.
     */
    ouvrirFicheLivre(index);
}


/* ============================================================
   19. MODE ÉDITION
============================================================ */

/*
 * Affiche le formulaire de modification d'un livre.
 */
function passerEnModeEdition(index) {

    const livre =
        tousLesLivres[index];


    if (!livre) {
        return;
    }


    const modal =
        document.getElementById("modal-fiche");


    modal.innerHTML =
        creerFormulaireEdition(livre, index);


    /*
     * Étoiles.
     */
    document
        .querySelectorAll("#star-rating span")
        .forEach((etoile, i) => {

            etoile.addEventListener(
                "click",
                () => selectionnerEtoileEdition(i + 1)
            );

        });


    /*
     * Piments.
     */
    document
        .querySelectorAll("#spice-rating span")
        .forEach((piment, i) => {

            piment.addEventListener(
                "click",
                () => selectionnerPimentEdition(i + 1)
            );

        });


    /*
     * Formulaire.
     */
    document
        .getElementById("form-edition")
        .addEventListener(
            "submit",
            event =>
                sauvegarderModification(event, index)
        );


    /*
     * Bouton annuler.
     */
    document
        .getElementById("btn-annuler-edition")
        .addEventListener(
            "click",
            () => {
                // On vérifie que l'index existe avant d'ouvrir la fiche
                if (typeof index !== 'undefined' && index !== null) {
                    ouvrirFicheLivre(index);
                } else {
                    console.warn("Index non défini pour l'annulation");
                    // Optionnel : fermer directement la modale si l'index est perdu
                }
            }
        );


    /*
     * Génère le formulaire d'édition.
     */
    function creerFormulaireEdition(livre, index) {

        const note =
            parseInt(livre.note) || 0;


        const spice =
            parseInt(livre.spice) || 0;


        return `

        <div class="card shadow-lg bg-white"
             style="
                max-width:700px;
                width:90%;
                max-height:90vh;
                overflow-y:auto;
             ">

            <div class="card-body">

                <form id="form-edition">

                    <div class="d-flex justify-content-between mb-3">

                        <h4>
                            Modifier mon exemplaire
                        </h4>

                    </div>


                    <div class="alert alert-light border small">

                        👤 <strong>Lecture de :</strong>
                        ${echapperHTML(livre.personne || "Moi")}

                        <br>

                        📖 <strong>Format :</strong>
                        ${echapperHTML(livre.format || "Standard")}

                    </div>


                    <div class="row">

                        <div class="col-md-6 mb-3">

                            <label class="fw-bold">
                                Titre
                            </label>

                            <input
                                id="edit-titre"
                                class="form-control"
                                value="${echapperAttribut(livre.titre)}"
                                required
                            >

                        </div>


                        <div class="col-md-6 mb-3">

                            <label class="fw-bold">
                                Auteur
                            </label>

                            <input
                                id="edit-auteur"
                                class="form-control"
                                value="${echapperAttribut(livre.auteur)}"
                                required
                            >

                        </div>

                    </div>


                    <div class="mb-3">

                        <label class="fw-bold">
                            URL de couverture
                        </label>

                        <input
                            id="edit-couverture"
                            class="form-control"
                            value="${echapperAttribut(livre.couverture)}"
                        >

                    </div>


                    <div class="row">

                        <div class="col-md-4 mb-3">

                            <label class="fw-bold">
                                Date début
                            </label>

                            <input
                                id="edit-date-debut"
                                class="form-control"
                                value="${echapperAttribut(livre.dateDebut)}"
                            >

                        </div>


                        <div class="col-md-4 mb-3">

                            <label class="fw-bold">
                                Date fin
                            </label>

                            <input
                                id="edit-date-fin"
                                class="form-control"
                                value="${echapperAttribut(livre.dateFin)}"
                            >

                        </div>


                        <div class="col-md-4 mb-3">

                            <label class="fw-bold">
                                Durée
                            </label>

                            <input
                                id="edit-duree"
                                class="form-control"
                                value="${echapperAttribut(livre.duree)}"
                            >

                        </div>

                    </div>


                    <div class="row">

                        <div class="col-md-4 mb-3">

                            <label class="fw-bold">
                                Pages
                            </label>

                            <input
                                type="number"
                                id="edit-pages"
                                class="form-control"
                                value="${echapperAttribut(livre.pages)}"
                            >

                        </div>


                        <div class="col-md-4 mb-3">

                            <label class="fw-bold">
                                Prix officiel
                            </label>

                            <input
                                id="edit-prix-officiel"
                                class="form-control"
                                value="${echapperAttribut(
            nettoyerPrix(livre.prixOfficiel)
        )}"
                            >

                        </div>


                        <div class="col-md-4 mb-3">

                            <label class="fw-bold">
                                Prix réel
                            </label>

                            <input
                                id="edit-prix-reel"
                                class="form-control"
                                value="${echapperAttribut(
            nettoyerPrix(livre.prixReel)
        )}"
                            >

                        </div>

                    </div>


                    <div class="row">

                        <div class="col-md-6 mb-3">

                            <label class="fw-bold">
                                Genre
                            </label>

                            <input
                                id="edit-genre"
                                class="form-control"
                                value="${echapperAttribut(livre.genre)}"
                            >

                        </div>


                        <div class="col-md-6 mb-3">

                            <label class="fw-bold">
                                Format
                            </label>

                            <select
                                id="edit-format"
                                class="form-select">

                                ${creerOption(
            "Physique",
            livre.format
        )}

                                ${creerOption(
            "E-Book",
            livre.format
        )}

                                ${creerOption(
            "Audio",
            livre.format
        )}

                            </select>

                        </div>

                    </div>


                    <div class="row">

                        <div class="col-md-6 mb-3">

                            <label class="fw-bold">
                                Statut
                            </label>

                            <select
                                id="edit-statut"
                                class="form-select">

                                ${creerOption(
            "À lire",
            livre.statut
        )}

                                ${creerOption(
            "En cours",
            livre.statut
        )}

                                ${creerOption(
            "Pause",
            livre.statut
        )}

                                ${creerOption(
            "Terminé",
            livre.statut
        )}

                                ${creerOption(
            "Abandonné",
            livre.statut
        )}

                            </select>

                        </div>


                        <div class="col-md-6 mb-3">

                            <label class="fw-bold">
                                Année de lecture
                            </label>

                            <input
                                type="number"
                                id="edit-annee"
                                class="form-control"
                                value="${echapperAttribut(livre.anneeLecture)}"
                            >

                        </div>

                    </div>


                    <div class="row bg-light rounded p-2 mb-3">

                        <div class="col-md-4 text-center">

                            <label class="fw-bold">
                                Note
                            </label>

                            <div
                                id="star-rating"
                                class="fs-4">

                                ${creerEtoilesEdition(note)}

                            </div>

                            <input
                                type="hidden"
                                id="edit-note"
                                value="${note}"
                            >

                        </div>


                        <div class="col-md-4 text-center border-start border-end">

                            <label class="fw-bold">
                                Spice
                            </label>

                            <div
                                id="spice-rating"
                                class="fs-4">

                                ${creerPimentsEdition(spice)}

                            </div>

                            <input
                                type="hidden"
                                id="edit-spice"
                                value="${spice}"
                            >

                        </div>


                        <div class="col-md-4 text-center">

                            <label class="fw-bold">
                                Coup de cœur
                            </label>

                            <div class="form-check mt-2">

                                <input
                                    type="checkbox"
                                    id="edit-coeur"
                                    class="form-check-input"
                                    ${livre.coupDeCoeur ? "checked" : ""}
                                >

                                <label
                                    for="edit-coeur"
                                    class="form-check-label">
                                    ❤️
                                </label>

                            </div>

                        </div>

                    </div>


                    <div class="mb-3">

                        <label class="fw-bold">
                            Citations préférées
                        </label>

                        <textarea
                            id="edit-citation"
                            class="form-control"
                            rows="2"
                        >${echapperHTML(livre.citation)}</textarea>

                    </div>


                    <div class="mb-3">

                        <div class="d-flex justify-content-between">

                            <label class="fw-bold">
                                Mon avis & historique
                            </label>

                            <button
                                type="button"
                                id="btn-relecture"
                                class="btn btn-sm btn-outline-info">
                                + Ajouter une relecture
                            </button>

                        </div>

                        <textarea
                            id="edit-review"
                            class="form-control"
                            rows="5"
                        >${echapperHTML(livre.review)}</textarea>

                    </div>


                    <div class="d-flex justify-content-end gap-2">

                        <button
                            type="button"
                            id="btn-annuler-edition"
                            class="btn btn-secondary">
                            Annuler
                        </button>

                        <button
                            type="submit"
                            class="btn btn-success">
                            💾 Enregistrer
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;
    }


    /*
     * Crée une option de <select>.
     */
    function creerOption(valeur, valeurActuelle) {

        const selected =
            String(valeurActuelle || "").includes(valeur)
                ? "selected"
                : "";


        return `
        <option value="${valeur}" ${selected}>
            ${valeur}
        </option>
    `;
    }


    /*
     * Crée les étoiles d'édition.
     */
    function creerEtoilesEdition(note) {

        return Array.from(
            { length: 5 },
            (_, index) => `

            <span
                class="${index < note
                    ? "text-warning"
                    : "text-muted"
                }"
                style="cursor:pointer;">
                ★
            </span>

        `
        ).join("");
    }


    /*
     * Crée les piments d'édition.
     */
    function creerPimentsEdition(spice) {

        return Array.from(
            { length: 5 },
            (_, index) => `

            <span
                style="
                    cursor:pointer;
                    filter:${index < spice
                    ? "none"
                    : "grayscale(100%) opacity(40%)"
                };
                ">
                🌶️
            </span>

        `
        ).join("");
    }


    /*
     * Change la note pendant l'édition.
     */
    function selectionnerEtoileEdition(note) {

        document.getElementById("edit-note").value =
            note;


        document
            .querySelectorAll("#star-rating span")
            .forEach((etoile, index) => {

                etoile.classList.toggle(
                    "text-warning",
                    index < note
                );

                etoile.classList.toggle(
                    "text-muted",
                    index >= note
                );

            });
    }


    /*
     * Change le niveau de spice pendant l'édition.
     */
    function selectionnerPimentEdition(note) {

        document.getElementById("edit-spice").value =
            note;


        document
            .querySelectorAll("#spice-rating span")
            .forEach((piment, index) => {

                piment.style.filter =
                    index < note
                        ? "none"
                        : "grayscale(100%) opacity(40%)";

            });
    }


    /*
     * Sauvegarde les modifications d'un livre.
     */
    async function sauvegarderModification(event, index) {

        event.preventDefault();


        const livre =
            tousLesLivres[index];


        /*
         * Données envoyées à Google Apps Script.
         */
        const modifications = {

            action: "UPDATE",

            ligne: index + 2,

            titre:
                document.getElementById("edit-titre").value,

            auteur:
                document.getElementById("edit-auteur").value,

            couverture:
                document.getElementById("edit-couverture").value,

            date_debut:
                document.getElementById("edit-date-debut").value,

            date_fin:
                document.getElementById("edit-date-fin").value,

            duree:
                document.getElementById("edit-duree").value,

            pages:
                document.getElementById("edit-pages").value,

            prix_officiel:
                document.getElementById("edit-prix-officiel").value,

            prix_reel:
                document.getElementById("edit-prix-reel").value,

            format:
                document.getElementById("edit-format").value,

            genre:
                document.getElementById("edit-genre").value,

            statut:
                document.getElementById("edit-statut").value,

            notes:
                document.getElementById("edit-note").value,

            review:
                document.getElementById("edit-review").value,

            anneeLecture:
                document.getElementById("edit-annee").value,

            coup_de_coeur:
                document.getElementById("edit-coeur").checked,

            spice:
                document.getElementById("edit-spice").value,

            citation:
                document.getElementById("edit-citation").value.trim()
        };


        /*
         * Le Google Apps Script actuel attend probablement
         * encore un champ correspondant à Q.
         *
         * Comme ta colonne Q est l'année, nous envoyons
         * également le nom "annee".
         *
         * Si ton Apps Script utilise un autre nom pour Q,
         * il faudra simplement adapter cette ligne.
         */
        modifications.annee =
            modifications.anneeLecture;


        try {

            const resultat =
                await envoyerAuGoogleSheet(modifications);


            if (resultat?.statut !== "succès") {

                alert(
                    "Erreur : " +
                    (resultat?.message || "Erreur inconnue")
                );

                return;
            }


            /*
             * Mise à jour locale immédiate.
             *
             * Cela évite de devoir obligatoirement recharger
             * toute la page.
             */
            livre.titre =
                modifications.titre;

            livre.auteur =
                modifications.auteur;

            livre.couverture =
                modifications.couverture;

            livre.dateDebut =
                modifications.date_debut;

            livre.dateFin =
                modifications.date_fin;

            livre.duree =
                modifications.duree;

            livre.pages =
                modifications.pages;

            livre.prixOfficiel =
                modifications.prix_officiel;

            livre.prixReel =
                modifications.prix_reel;

            livre.format =
                modifications.format;

            livre.genre =
                modifications.genre;

            livre.statut =
                modifications.statut;

            livre.note =
                modifications.notes;

            livre.review =
                modifications.review;

            livre.anneeLecture =
                modifications.anneeLecture;

            livre.coupDeCoeur =
                modifications.coup_de_coeur;

            livre.spice =
                modifications.spice;

            livre.citation =
                modifications.citation;


            /*
             * Ferme la modale puis rafraîchit l'affichage.
             */
            fermerFicheLivre();

            appliquerFiltresEtAfficher();

            afficherCarousel();

        }

        catch (erreur) {

            console.error(erreur);

            alert(
                "Impossible d'enregistrer les modifications."
            );
        }
    }


    /*
     * Ajoute un séparateur de relecture dans l'avis.
     */
    function ajouterBlocRelecture() {

        const champ =
            document.getElementById("edit-review");


        if (!champ) {
            return;
        }


        const date =
            new Date().toLocaleDateString("fr-FR");


        champ.value +=
            `\n\n--- 🔄 Relecture du ${date} ---\n`;


        champ.focus();
    }


    /* ============================================================
       20. COMMUNICATION GOOGLE SHEETS — FONCTION CENTRALE
    ============================================================ */

    /*
     * Toutes les requêtes POST vers Google Sheets passent
     * par cette fonction.
     *
     * C'est pratique parce que si un jour tu changes ton
     * système de communication, tu n'auras qu'une fonction
     * à modifier.
     */
    async function envoyerAuGoogleSheet(donnees) {

        const reponse =
            await fetch(
                URL_APPS_SCRIPT,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify(donnees)
                }
            );


        return await reponse.json();
    }


    /* ============================================================
       21. OUTILS D'AFFICHAGE
    ============================================================ */

    /*
     * Transforme un statut brut en statut plus joli.
     */
    function formatStatut(statut) {

        if (!statut) {
            return "-";
        }


        if (statut.includes("À lire")) {
            return "À lire 📚";
        }


        if (statut.includes("En cours")) {
            return "En cours 📖";
        }


        if (statut.includes("Pause")) {
            return "Pause ⏸";
        }


        if (statut.includes("Terminé")) {
            return "Terminé ✔️";
        }


        if (statut.includes("Abandonné")) {
            return "Abandonné ❌☠️";
        }


        return statut;
    }


    /*
     * Génère les cinq étoiles utilisées pour afficher
     * la note d'un livre.
     */
    function genererEtoiles(note) {

        const valeur =
            parseInt(note) || 0;


        return Array.from(
            { length: 5 },
            (_, index) => `

            <span
                class="${index < valeur
                    ? "text-warning"
                    : "text-muted"
                }">
                ★
            </span>

        `
        ).join("");
    }


    /* ============================================================
       22. SÉCURITÉ HTML
    ============================================================ */

    /*
     * Cette fonction protège le HTML lorsqu'on affiche
     * une information provenant du Google Sheet.
     *
     * Exemple :
     *
     * Si quelqu'un écrit dans le Sheet :
     *
     * <script>alert("bonjour")</script>
     *
     * le navigateur ne doit PAS exécuter ce code.
     *
     * Cette fonction transforme les caractères spéciaux
     * en texte inoffensif.
     */
    function echapperHTML(valeur) {

        if (valeur === null || valeur === undefined) {
            return "";
        }


        return String(valeur)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /*
     * Version destinée aux valeurs placées
     * dans un attribut HTML comme :
     *
     * value="..."
     */
    function echapperAttribut(valeur) {

        return echapperHTML(valeur);
    }

}
/* ============================================================
   FIN DU SCRIPT
============================================================ */

/*
 * 🎉 Si tu arrives jusqu'ici :
 *
 * Le fichier paraît encore long, mais il est maintenant
 * organisé en blocs indépendants.
 *
 * Pour modifier :
 *
 * - les filtres       → section 8
 * - les statistiques  → section 11
 * - les cartes        → section 10
 * - Google Books      → section 17
 * - le formulaire     → sections 15-16
 * - la fiche livre    → section 18
 * - l'édition         → section 19
 * - Google Sheets     → sections 4 et 20
 *
 * Le point le plus important à retenir :
 *
 *     livre.titre
 *     livre.auteur
 *     livre.note
 *     livre.genre
 *     livre.anneeLecture
 *
 * sont maintenant les informations que tu utiliseras
 * presque partout dans le programme.
 */