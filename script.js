// Fonction pour nettoyer un prix et retirer les dates parasites de Google Sheets
function nettoyerPrix(valeur) {
    if (!valeur) return "";
    let str = String(valeur).trim();

    // Si Google Sheets a envoyé une date (contient 'T', 'GMT' ou des tirets de type AAAA-MM-JJ)
    if (str.includes("T") || str.includes("GMT") || /^\d{4}-\d{2}-\d{2}/.test(str)) {
        return ""; // Ou met 0 selon ce que tu préfères
    }

    // Garde uniquement les chiffres, les points et les virgules
    let prixPropre = str.replace(/[^0-9.,]/g, "");
    return prixPropre;
}

/* ========================================================
   VARIABLES GLOBALES ET INITIALISATION
   ======================================================== */
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzfXagjnK-neDNfzMODyiTqx2wfgYDxIJTkvx5Ij-Ly_CdC4U27oBpnuqsxYVu0ZtSfyQ/exec";

let tousLesLivres = [];
let filtrePersonne = "Commune";
let filtreStatut = "TOUS";
let vueCoupDeCoeur = false;
let carrouselTimer = null;
let langueAPI = "fr";
let timeoutRecherche = null;

document.addEventListener("DOMContentLoaded", () => {
    verifierProfil();
    document.getElementById("form-livre").addEventListener("submit", soumettreLivre);
});

/* ========================================================
   GESTION DU PROFIL 
   ======================================================== */
function verifierProfil() {
    const utilisateurEnregistre = localStorage.getItem("utilisateurActif");
    if (utilisateurEnregistre) {
        document.getElementById("ecran-profil").classList.add("cache");
        document.getElementById("application-principale").classList.remove("cache");
        document.getElementById("message-bienvenue").innerText = "Connectée en tant que : " + utilisateurEnregistre;
        chargerLivres();
    } else {
        document.getElementById("ecran-profil").classList.remove("cache");
        document.getElementById("application-principale").classList.add("cache");
    }
}

function choisirProfil(nom) {
    localStorage.setItem("utilisateurActif", nom);
    verifierProfil();
}

/* ========================================================
   CHARGEMENT DES DONNÉES
   ======================================================== */
function chargerLivres() {
    fetch(URL_APPS_SCRIPT)
        .then(reponse => reponse.json())
        .then(lignes => {
            tousLesLivres = lignes.slice(1); // Retire la ligne d'en-tête
            afficherLivres();
            afficherCarousel();
        })
        .catch(erreur => console.error("Erreur chargement :", erreur));
}

/* ========================================================
   AFFICHAGE ET FILTRES
   ======================================================== */
function changerVue(vueDemandee) {
    if (vueDemandee === "PAL") {
        filtreStatut = (filtreStatut === "À lire") ? "TOUS" : "À lire";
        vueCoupDeCoeur = false;
    } else if (vueDemandee === "CoupsDeCoeur") {
        vueCoupDeCoeur = !vueCoupDeCoeur;
        filtreStatut = "TOUS";
    } else {
        filtrePersonne = vueDemandee;
        filtreStatut = "TOUS";
        vueCoupDeCoeur = false;
    }

    // Le carrousel reste masqué en dehors de la vue Commune globale
    const sectionCarousel = document.getElementById("section-carousel");
    if (filtrePersonne === "Commune" && filtreStatut === "TOUS" && !vueCoupDeCoeur) {
        sectionCarousel.style.display = "block";
    } else {
        sectionCarousel.style.display = "none";
    }

    document.getElementById("titre-grille").innerText = vueCoupDeCoeur
        ? "❤️ Mes Coups de Cœur"
        : (filtreStatut === "À lire" ? "📚 Ma Pile à Lire" : "Ma Bibliothèque");

    afficherLivres();
}

function afficherLivres() {
    const grille = document.getElementById("grille-livres");
    grille.innerHTML = "";

    let livresLus = 0;
    let budgetReel = 0;
    let budgetOfficiel = 0;

    tousLesLivres.forEach((ligne, index) => {
        const personne = ligne[1];
        const couverture = ligne[5];
        const titre = ligne[6];
        const auteur = ligne[7];
        const p_officiel = parseFloat(String(ligne[9]).replace(',', '.')) || 0;
        const p_reel = parseFloat(String(ligne[10]).replace(',', '.')) || 0;
        const statut = ligne[13] || "";
        const estCoupDeCoeur = (ligne[17] === "VRAI" || ligne[17] === true);

        if (!titre) return;

        // Statistiques
        if (filtrePersonne === "Commune" || personne === filtrePersonne) {
            if (statut.includes("Terminé")) livresLus++;
            budgetOfficiel += p_officiel;
            budgetReel += p_reel;
        }

        // Applique les filtres
        if (filtrePersonne !== "Commune" && personne !== filtrePersonne) return;
        if (filtreStatut === "À lire" && !statut.includes("À lire")) return;
        if (vueCoupDeCoeur && !estCoupDeCoeur) return;

        const coeurCouleur = estCoupDeCoeur ? "❤️" : "🤍";

        const carteHtml = `
            <div class="col">
                <div class="card h-100 shadow-sm border-0 position-relative" onclick="ouvrirFicheLivre(${index})" style="cursor: pointer;">
                    <div class="position-absolute top-0 end-0 m-2 fs-3" style="z-index: 10;" onclick="toggleCoupDeCoeur(event, ${index})">
                        ${coeurCouleur}
                    </div>
                    ${couverture ? `<img src="${couverture}" class="card-img-top" alt="Couverture" style="height: 220px; object-fit: cover;">` : ''}
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div>
                            <span class="badge bg-primary mb-2">${personne}</span>
                            <h5 class="card-title fw-bold">${titre}</h5>
                            <h6 class="card-subtitle mb-3 text-muted">${auteur}</h6>
                        </div>
                        <div>
                            <span class="badge bg-light text-dark border">${formatStatut(statut)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grille.innerHTML += carteHtml;
    });

    document.getElementById("stat-lus").innerText = livresLus;
    document.getElementById("stat-budget").innerText = `${budgetReel.toFixed(2)} € / ${budgetOfficiel.toFixed(2)} €`;
}

/* ========================================================
   CARROUSEL ANIMÉ
   ======================================================== */
function afficherCarousel() {
    const conteneur = document.getElementById("carousel-livres");
    conteneur.innerHTML = "";

    const livresTermines = tousLesLivres
        .map((livre, index) => ({ livre, index }))
        .filter(item => item.livre[13] && item.livre[13].includes("Terminé"))
        .reverse()
        .slice(0, 10);

    livresTermines.forEach(item => {
        const couverture = item.livre[5] || "https://via.placeholder.com/150x220?text=Pas+de+couverture";
        const titre = item.livre[6];
        const auteur = item.livre[7];
        const note = item.livre[14];

        const html = `
            <div class="card carousel-card shadow-sm border-0" onclick="ouvrirFicheLivre(${item.index})">
                <div class="row g-0 h-100 align-items-center">
                    <div class="col-4">
                        <img src="${couverture}" class="img-fluid rounded-start" alt="Couverture">
                    </div>
                    <div class="col-8">
                        <div class="card-body p-2">
                            <h6 class="fw-bold mb-0 text-truncate" style="font-size: 0.8rem;" title="${titre}">${titre}</h6>
                            <small class="text-muted d-block text-truncate mb-1" style="font-size: 0.75rem;">${auteur}</small>
                            <div>${genererEtoiles(note)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        conteneur.innerHTML += html;
    });

    demarrerAutoScrollCarousel();
}

function demarrerAutoScrollCarousel() {
    const conteneur = document.getElementById("carousel-livres");
    if (carrouselTimer) clearInterval(carrouselTimer);

    carrouselTimer = setInterval(() => {
        if (!conteneur) return;
        if (conteneur.scrollLeft + conteneur.clientWidth >= conteneur.scrollWidth - 10) {
            conteneur.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            conteneur.scrollBy({ left: 202, behavior: 'smooth' });
        }
    }, 3000);
}

/* ========================================================
   GESTION DES COUPS DE CŒUR
   ======================================================== */
// Bascule rapide depuis la carte dans la grille
function toggleCoupDeCoeur(event, index) {
    event.stopPropagation();
    const estCoupDeCoeur = (tousLesLivres[index][17] === "VRAI" || tousLesLivres[index][17] === true);
    const nouveauStatut = !estCoupDeCoeur;

    tousLesLivres[index][17] = nouveauStatut ? "VRAI" : "FAUX";
    afficherLivres();

    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            action: "UPDATE_COEUR",
            ligne: index + 2,
            coup_de_coeur: nouveauStatut
        })
    }).catch(erreur => console.error("Erreur d'enregistrement du cœur :", erreur));
}

// Bascule depuis la pop-up de détails
function toggleCoupDeCoeurPopup(index) {
    const estActuellementCoeur = (tousLesLivres[index][17] === "VRAI" || tousLesLivres[index][17] === true);
    const nouveauStatut = !estActuellementCoeur;

    tousLesLivres[index][17] = nouveauStatut ? "VRAI" : "FAUX";

    const spanCoeur = document.getElementById("popup-coeur-btn");
    if (spanCoeur) {
        spanCoeur.innerText = nouveauStatut ? "❤️" : "🤍";
    }

    afficherLivres();
    afficherCarousel();

    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            action: "UPDATE_COEUR",
            ligne: index + 2,
            coup_de_coeur: nouveauStatut
        })
    }).catch(erreur => console.error("Erreur d'enregistrement du cœur :", erreur));
}

// Bascule dans le formulaire d'ajout
function toggleCoeurFormulaire() {
    const inputHidden = document.getElementById("nouveau-coeur");
    const spanCoeur = document.getElementById("form-coeur-btn");

    const estActif = inputHidden.value === "true";
    inputHidden.value = estActif ? "false" : "true";
    spanCoeur.innerText = estActif ? "🤍" : "❤️";
}

/* ========================================================
   GESTION DU FORMULAIRE D'AJOUT ET ÉTOILES
   ======================================================== */
function ouvrirFormulaire() {
    document.getElementById("modal-formulaire").classList.remove("cache");
}

function fermerFormulaire() {
    document.getElementById("modal-formulaire").classList.add("cache");
    document.getElementById("form-livre").reset();
    document.getElementById("nouveau-note").value = "0";

    // Réinitialise les étoiles
    document.querySelectorAll('#star-rating-creation span').forEach(e => {
        e.classList.remove('text-warning');
        e.classList.add('text-muted');
    });

    // Réinitialise le bouton cœur du formulaire
    document.getElementById("nouveau-coeur").value = "false";
    if (document.getElementById("form-coeur-btn")) {
        document.getElementById("form-coeur-btn").innerText = "🤍";
    }
}

function selectionnerEtoileCreation(valeur) {
    document.getElementById('nouveau-note').value = valeur;
    document.querySelectorAll('#star-rating-creation span').forEach((e, i) => {
        if (i < valeur) { e.classList.remove('text-muted'); e.classList.add('text-warning'); }
        else { e.classList.remove('text-warning'); e.classList.add('text-muted'); }
    });
}

function selectionnerEtoile(valeur) {
    document.getElementById('edit-note').value = valeur;
    document.querySelectorAll('#star-rating span').forEach((e, i) => {
        if (i < valeur) { e.classList.remove('text-muted'); e.classList.add('text-warning'); }
        else { e.classList.remove('text-warning'); e.classList.add('text-muted'); }
    });
}

function soumettreLivre(event) {
    event.preventDefault();
    const nouveauLivre = {
        action: "INSERT",
        id: Date.now(),
        personne: localStorage.getItem("utilisateurActif"),
        titre: document.getElementById("titre").value,
        auteur: document.getElementById("auteur").value,
        statut: document.getElementById("statut").value,
        note: document.getElementById("nouveau-note").value,
        coup_de_coeur: document.getElementById("nouveau-coeur").value === "true"
    };

    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(nouveauLivre)
    })
        .then(reponse => reponse.json())
        .then(resultat => {
            if (resultat.statut === "succès") {
                fermerFormulaire();
                chargerLivres();
            } else {
                alert("Erreur Google : " + resultat.message);
            }
        })
        .catch(erreur => console.error("Erreur :", erreur));
}

/* ========================================================
   INTEGRATION API GOOGLE BOOKS
   ======================================================== */
function changerLangueAPI(langue, label) {
    langueAPI = langue;
    document.getElementById("btn-langue-api").innerText = label;
}

function rechercherLivreAPI() {
    const requete = document.getElementById("recherche-api-input").value.trim();
    const conteneur = document.getElementById("resultats-api");

    if (!requete || requete.length < 3) {
        conteneur.innerHTML = "";
        return;
    }

    conteneur.innerHTML = "<div class='list-group-item text-muted'>Recherche en cours...</div>";

    // 🔑 Remplace la chaîne ci-dessous par ta NOUVELLE clé Google
    const CLE_API = "AIzaSyC6NWy-fhdyj7295-uMW9MTRRdvBwyHtCI";

    // Récupération de la langue sélectionnée (ou 'fr' par défaut)
    const langueFixe = typeof langueAPI !== 'undefined' ? langueAPI : 'fr';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(requete)}&langRestrict=${langueFixe}&maxResults=5&key=${CLE_API}`;

    fetch(url)
        .then(reponse => {
            if (!reponse.ok) {
                if (reponse.status === 429) throw new Error("Quota dépassé ou clé bloquée.");
                throw new Error("Erreur serveur (" + reponse.status + ")");
            }
            return reponse.json();
        })
        .then(donnees => {
            conteneur.innerHTML = "";

            if (!donnees.items || donnees.items.length === 0) {
                conteneur.innerHTML = "<div class='list-group-item text-muted'>Aucun résultat trouvé</div>";
                return;
            }

            donnees.items.forEach(item => {
                const info = item.volumeInfo;
                const titre = info.title || "";
                const auteurs = info.authors ? info.authors.join(", ") : "Auteur inconnu";
                const couverture = info.imageLinks?.thumbnail?.replace("http://", "https://") || "";
                const pages = info.pageCount || "";
                const genre = info.categories ? info.categories[0] : "";

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "list-group-item list-group-item-action d-flex align-items-center gap-2";
                btn.innerHTML = `
                    ${couverture ? `<img src="${couverture}" style="height: 40px; width: 28px; object-fit: cover;">` : ''}
                    <div>
                        <strong>${titre}</strong> <small class="text-muted">par ${auteurs}</small>
                    </div>
                `;
                btn.onclick = () => {
                    if (document.getElementById("titre")) document.getElementById("titre").value = titre;
                    if (document.getElementById("auteur")) document.getElementById("auteur").value = auteurs;
                    if (document.getElementById("edit-couverture")) document.getElementById("edit-couverture").value = couverture;
                    if (document.getElementById("couverture")) document.getElementById("couverture").value = couverture;
                    if (document.getElementById("pages")) document.getElementById("pages").value = pages;
                    if (document.getElementById("genre")) document.getElementById("genre").value = genre;
                    conteneur.innerHTML = "";
                };
                conteneur.appendChild(btn);
            });
        })
        .catch(err => {
            conteneur.innerHTML = `<div class='list-group-item text-danger'>⚠️ ${err.message}</div>`;
        });
}

/* ========================================================
   FICHE DÉTAILLÉE ET RELECTURES MULTIPLES
   ======================================================== */
/* ========================================================
   FICHE DÉTAILLÉE ET RELECTURES MULTIPLES
   ======================================================== */
function ouvrirFicheLivre(index) {
    const livreActuel = tousLesLivres[index];
    if (!livreActuel) return;

    const titreCible = String(livreActuel[6] || "").trim().toLowerCase();
    const doublons = tousLesLivres.filter(l => String(l[6] || "").trim().toLowerCase() === titreCible);

    let tousLesAvis = [];
    let totalPages = 0;
    let totalPrixReel = 0;
    let totalPrixOfficiel = 0;
    let formatsConcernes = new Set();
    let personnesconcernees = new Set();
    let estCoupDeCoeurGlobal = false;

    doublons.forEach(l => {
        const [id, personne, date_debut, date_fin, duree, couverture, titre, auteur, pages, prix_officiel, prix_reel, format, genre, statut, notes, review, tags, coup_de_coeur] = l;

        if (personne) personnesconcernees.add(personne);
        if (format) formatsConcernes.add(format);
        if (pages) totalPages += parseInt(pages) || 0;
        if (prix_reel) totalPrixReel += parseFloat(String(prix_reel).replace(',', '.')) || 0;
        if (prix_officiel) totalPrixOfficiel += parseFloat(String(prix_officiel).replace(',', '.')) || 0;
        if (coup_de_coeur === "VRAI" || coup_de_coeur === true) estCoupDeCoeurGlobal = true;

        if (review && String(review).trim() !== "") {
            tousLesAvis.push(`<div class="text-muted small mb-1"><em>Exemplaire (${personne || 'Moi'} - ${format || 'Standard'}) :</em></div>` + review);
        }
    });

    let avisHtml = "<p class='text-muted'>Aucun avis enregistré pour ce titre.</p>";
    if (tousLesAvis.length > 0) {
        avisHtml = tousLesAvis.map(r => `
            <div class="border-start border-4 border-primary ps-3 py-2 bg-light rounded mb-3" style="white-space: pre-wrap;">
                ${r}
            </div>
        `).join("");
    }

    // Récupération sécurisée depuis le livre actuel (sans re-déclarer avec const)
    const auteurLivre = livreActuel[7] || "Auteur inconnu";
    const titreLivre = livreActuel[6] || "Sans titre";
    const couvertureLivre = livreActuel[5] || "";
    const dateDebutLivre = livreActuel[2];
    const dateFinLivre = livreActuel[3];
    const dureeLivre = livreActuel[4];

    // Gestion propre des dates (si absentes, on affiche l'année ou un message adapté)
    let infoLectureHtml = "";
    if (dateDebutLivre && dateFinLivre) {
        infoLectureHtml = `<p><strong>Période de lecture :</strong> Du ${dateDebutLivre} au ${dateFinLivre} (${dureeLivre || "?"} jours)</p>`;
    } else if (dateDebutLivre) {
        infoLectureHtml = `<p><strong>Date de lecture :</strong> ${dateDebutLivre}</p>`;
    } else {
        infoLectureHtml = `<p class="text-muted"><em>Lecture passée (dates exactes non renseignées)</em></p>`;
    }

    const contenu = `
        <div class="d-flex justify-content-between align-items-center mb-3 pe-2">
            <div class="d-flex align-items-center gap-3">
                <h3 class="mb-0 fw-bold">${titreLivre}</h3>
                <span id="popup-coeur-btn" onclick="toggleCoupDeCoeurPopup(${index})" class="fs-3" style="cursor: pointer; user-select: none;" title="Coup de cœur">
                    ${estCoupDeCoeurGlobal ? "❤️" : "🤍"}
                </span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-outline-primary btn-sm fw-bold" onclick="passerEnModeEdition(${index})">✏️ Modifier</button>
            </div>
        </div>
        <h5 class="text-muted mb-3">${auteurLivre}</h5>
        
        ${doublons.length > 1 ? `<div class="alert alert-info py-2 small">ℹ️ Ce livre est enregistré en <strong>${doublons.length} exemplaires/éditions</strong> (regroupés ici).</div>` : ''}
        
        <hr>
        <div class="row g-4">
            ${couvertureLivre ? `<div class="col-md-4"><img src="${couvertureLivre}" class="img-fluid rounded shadow-sm"></div>` : ''}
            <div class="${couvertureLivre ? 'col-md-8' : 'col-12'}">
                <p><strong>Propriétaires / Lecteurs :</strong> ${Array.from(personnesconcernees).join(", ") || "-"}</p>
                <p><strong>Formats enregistrés :</strong> ${Array.from(formatsConcernes).join(", ") || "-"}</p>
                
                ${infoLectureHtml}

                <p><strong>Total pages lues (cumulé) :</strong> ${totalPages} pages</p>
                <p><strong>Budget total dépensé :</strong> ${totalPrixReel.toFixed(2)} € (Officiel : ${totalPrixOfficiel.toFixed(2)} €)</p>
                <p><strong>Nombre total de lectures :</strong> <span class="badge bg-success">${doublons.length} fois</span></p>
            </div>
        </div>
        <div class="mt-4">
            <h5 class="fw-bold mb-2">💬 Tous les Avis & Relectures pour ce titre :</h5>
            ${avisHtml}
        </div>`;

    document.getElementById("fiche-details").innerHTML = contenu;
    document.getElementById("modal-fiche").classList.remove("cache");
}

function fermerFicheLivre() {
    document.getElementById("modal-fiche").classList.add("cache");
}

/* ========================================================
   MODIFICATION COMPLÈTE DE LA FICHE LIVRE
   ======================================================== */
function passerEnModeEdition(index) {
    const livre = tousLesLivres[index];
    if (!livre) return;

    const [id, personne, date_debut, date_fin, duree, couverture, titre, auteur, pages, prix_officiel, prix_reel, format, genre, statut, notes, review, tags, coup_de_coeur] = livre;
    const noteActuelle = parseInt(notes) || 0;
    const estCoupDeCoeur = (coup_de_coeur === "VRAI" || coup_de_coeur === true);

    const contenuEdit = `
        <form onsubmit="sauvegarderModification(event, ${index})">
            <h4 class="mb-3">Modifier la fiche complète</h4>
            
            <div class="row">
                <div class="col-md-6 mb-2"><label class="fw-bold">Titre :</label><input type="text" id="edit-titre" class="form-control" value="${titre || ''}" required></div>
                <div class="col-md-6 mb-2"><label class="fw-bold">Auteur :</label><input type="text" id="edit-auteur" class="form-control" value="${auteur || ''}" required></div>
            </div>

            <div class="mb-2"><label class="fw-bold">URL de la couverture :</label><input type="text" id="edit-couverture" class="form-control" value="${couverture || ''}"></div>

            <div class="row">
                <div class="col-md-4 mb-2"><label class="fw-bold">Date début :</label><input type="text" id="edit-date-debut" class="form-control" value="${date_debut || ''}"></div>
                <div class="col-md-4 mb-2"><label class="fw-bold">Date fin :</label><input type="text" id="edit-date-fin" class="form-control" value="${date_fin || ''}"></div>
                <div class="col-md-4 mb-2"><label class="fw-bold">Durée :</label><input type="text" id="edit-duree" class="form-control" value="${duree || ''}"></div>
            </div>

            <!-- 🟢 GRILLE CORRIGÉE (4 champs x col-md-3 = 12) -->
            <div class="row">
                <div class="col-md-3 mb-2">
                    <label class="fw-bold">Pages :</label>
                    <input type="number" id="edit-pages" class="form-control" value="${pages || ''}">
                </div>
                <div class="col-md-3 mb-2">
                    <label class="fw-bold">Prix Officiel (€) :</label>
                    <input type="text" id="edit-prix-officiel" class="form-control" value="${nettoyerPrix(prix_officiel)}">
                </div>
                <div class="col-md-3 mb-2">
                    <label class="fw-bold">Prix Réel (€) :</label>
                    <input type="text" id="edit-prix-reel" class="form-control" value="${nettoyerPrix(prix_reel)}">
                </div>
                <div class="col-md-3 mb-2">
                    <label class="fw-bold">Format :</label>
                    <input type="text" id="edit-format" class="form-control" value="${format || ''}">
                </div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-2"><label class="fw-bold">Genre :</label><input type="text" id="edit-genre" class="form-control" value="${genre || ''}"></div>`
                //<div class="col-md-6 mb-2"><label class="fw-bold">Année :</label><input type="text" id="edit-année" class="form-control" value="${année || ''}"></div>
            `</div>

            <div class="row">
                <div class="col-md-6 mb-2">
                    <label class="fw-bold">Statut :</label>
                    <select id="edit-statut" class="form-select">
                        <option value="À lire" ${statut && statut.includes('À lire') ? 'selected' : ''}>À lire 📚</option>
                        <option value="En cours" ${statut && statut.includes('En cours') ? 'selected' : ''}>En cours 📖</option>
                        <option value="Pause" ${statut && statut.includes('Pause') ? 'selected' : ''}>Pause ⏸</option>
                        <option value="Terminé" ${statut && statut.includes('Terminé') ? 'selected' : ''}>Terminé ✔️</option>
                        <option value="Abandonné" ${statut && statut.includes('Abandonné') ? 'selected' : ''}>Abandonné ❌☠️</option>
                    </select>
                </div>
                <div class="col-md-6 mb-2">
                    <label class="fw-bold">Note :</label>
                    <div id="star-rating" class="fs-3" style="cursor: pointer; user-select: none;">
                        <span onclick="selectionnerEtoile(1)" class="${noteActuelle >= 1 ? 'text-warning' : 'text-muted'}">★</span>
                        <span onclick="selectionnerEtoile(2)" class="${noteActuelle >= 2 ? 'text-warning' : 'text-muted'}">★</span>
                        <span onclick="selectionnerEtoile(3)" class="${noteActuelle >= 3 ? 'text-warning' : 'text-muted'}">★</span>
                        <span onclick="selectionnerEtoile(4)" class="${noteActuelle >= 4 ? 'text-warning' : 'text-muted'}">★</span>
                        <span onclick="selectionnerEtoile(5)" class="${noteActuelle >= 5 ? 'text-warning' : 'text-muted'}">★</span>
                    </div>
                    <input type="hidden" id="edit-note" value="${noteActuelle}">
                </div>
            </div>

            <div class="form-check my-2">
                <input class="form-check-input" type="checkbox" id="edit-coeur" ${estCoupDeCoeur ? 'checked' : ''}>
                <label class="form-check-label fw-bold" for="edit-coeur">❤️ Coup de Cœur</label>
            </div>

            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="fw-bold">Avis & Historique :</label>
                    <button type="button" class="btn btn-sm btn-outline-info" onclick="ajouterBlocRelecture()">+ Ajouter une relecture</button>
                </div>
                <textarea id="edit-review" class="form-control" rows="4">${review || ''}</textarea>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-secondary" onclick="ouvrirFicheLivre(${index})">Annuler</button>
                <button type="submit" class="btn btn-success">💾 Tout Enregistrer</button>
            </div>
        </form>`;

    document.getElementById("fiche-details").innerHTML = contenuEdit;
}

function ajouterBlocRelecture() {
    const champTexte = document.getElementById("edit-review");
    const dateAujourdhui = new Date().toLocaleDateString("fr-FR");
    champTexte.value += `\n\n--- 🔄 Relecture du ${dateAujourdhui} ---\n`;
}

function sauvegarderModification(event, index) {
    event.preventDefault();

    const livreModifie = {
        action: "UPDATE",
        ligne: index + 2,
        titre: document.getElementById("edit-titre").value,
        auteur: document.getElementById("edit-auteur").value,
        couverture: document.getElementById("edit-couverture").value,
        date_debut: document.getElementById("edit-date-debut").value,
        date_fin: document.getElementById("edit-date-fin").value,
        duree: document.getElementById("edit-duree").value,
        pages: document.getElementById("edit-pages").value,
        prix_officiel: document.getElementById("edit-prix-officiel").value,
        prix_reel: document.getElementById("edit-prix-reel").value,
        format: document.getElementById("edit-format").value,
        genre: document.getElementById("edit-genre").value,
        tags: document.getElementById("edit-tags").value,
        statut: document.getElementById("edit-statut").value,
        notes: document.getElementById("edit-note").value,
        review: document.getElementById("edit-review").value,
        coup_de_coeur: document.getElementById("edit-coeur").checked
    };

    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(livreModifie)
    })
        .then(reponse => reponse.json())
        .then(resultat => {
            if (resultat.statut === "succès") {
                tousLesLivres[index][2] = livreModifie.date_debut;
                tousLesLivres[index][3] = livreModifie.date_fin;
                tousLesLivres[index][4] = livreModifie.duree;
                tousLesLivres[index][5] = livreModifie.couverture;
                tousLesLivres[index][6] = livreModifie.titre;
                tousLesLivres[index][7] = livreModifie.auteur;
                tousLesLivres[index][8] = livreModifie.pages;
                tousLesLivres[index][9] = livreModifie.prix_officiel;
                tousLesLivres[index][10] = livreModifie.prix_reel;
                tousLesLivres[index][11] = livreModifie.format;
                tousLesLivres[index][12] = livreModifie.genre;
                tousLesLivres[index][13] = livreModifie.statut;
                tousLesLivres[index][14] = livreModifie.notes;
                tousLesLivres[index][15] = livreModifie.review;
                tousLesLivres[index][16] = livreModifie.tags;
                tousLesLivres[index][17] = livreModifie.coup_de_coeur ? "VRAI" : "FAUX";

                fermerFicheLivre();
                chargerLivres();
            } else {
                alert("Erreur : " + resultat.message);
            }
        })
        .catch(erreur => console.error("Erreur :", erreur));
}

/* ========================================================
   OUTILS DE FORMATAGE VISUEL
   ======================================================== */
function formatStatut(statut) {
    if (!statut) return "-";
    if (statut.includes("À lire")) return "À lire 📚";
    if (statut.includes("En cours")) return "En cours 📖";
    if (statut.includes("Pause")) return "Pause ⏸";
    if (statut.includes("Terminé")) return "Terminé ✔️";
    if (statut.includes("Abandonné")) return "Abandonné ❌☠️";
    return statut;
}

function genererEtoiles(note) {
    const nb = parseInt(note) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="${i <= nb ? 'text-warning' : 'text-muted'} fs-6">★</span>`;
    }
    return html;
}