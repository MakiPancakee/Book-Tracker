/* ========================================================
   VARIABLES GLOBALES ET URL
   ======================================================== */
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzfXagjnK-neDNfzMODyiTqx2wfgYDxIJTkvx5Ij-Ly_CdC4U27oBpnuqsxYVu0ZtSfyQ/exec"; // ⚠️ Remplace par la NOUVELLE URL si tu as mis à jour le script Google

let tousLesLivres = [];
let filtrePersonne = "Commune";
let filtreStatut = "TOUS";
let vueCoupDeCoeur = false; // Nouveau filtre

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
            tousLesLivres = lignes.slice(1); // Retire l'en-tête
            afficherLivres();
            afficherCarousel();
        })
        .catch(erreur => console.error("Erreur chargement :", erreur));
}

// Variable globale pour gérer le minuteur du carrousel
let carrouselTimer = null;

/* ========================================================
   AFFICHAGE ET FILTRES (Règle du carrousel appliquée)
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
    
    // 🟢 MASQUAGE DU CARROUSEL : Visible UNIQUEMENT sur la vue "Commune" sans autre filtre actif
    const sectionCarousel = document.getElementById("section-carousel");
    if (filtrePersonne === "Commune" && filtreStatut === "TOUS" && !vueCoupDeCoeur) {
        sectionCarousel.style.display = "block";
    } else {
        sectionCarousel.style.display = "none";
    }

    document.getElementById("titre-grille").innerText = vueCoupDeCoeur ? "❤️ Mes Coups de Cœur" : (filtreStatut === "À lire" ? "📚 Ma Pile à Lire" : "Ma Bibliothèque");
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

        // --- GESTION DES WIDGETS (Statistiques) ---
        // On calcule les stats seulement pour les livres de la vue actuelle
        if (filtrePersonne === "Commune" || personne === filtrePersonne) {
            if (statut.includes("Terminé")) livresLus++;
            budgetOfficiel += p_officiel;
            budgetReel += p_reel;
        }

        // --- GESTION DES FILTRES ---
        if (filtrePersonne !== "Commune" && personne !== filtrePersonne) return;
        if (filtreStatut === "À lire" && !statut.includes("À lire")) return;
        if (vueCoupDeCoeur && !estCoupDeCoeur) return;

        // --- AFFICHAGE DE LA CARTE ---
        const coeurCouleur = estCoupDeCoeur ? "❤️" : "🤍";

        const carteHtml = `
            <div class="col">
                <div class="card h-100 shadow-sm border-0 position-relative" onclick="ouvrirFicheLivre(${index})" style="cursor: pointer;">
                    
                    <!-- Bouton Coup de Coeur -->
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

    // Mise à jour des Widgets HTML
    document.getElementById("stat-lus").innerText = livresLus;
    document.getElementById("stat-budget").innerText = `${budgetReel.toFixed(2)} € / ${budgetOfficiel.toFixed(2)} €`;
}

/* ========================================================
   CARROUSEL ANIMÉ ET COMPACT
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

    // 🟢 DÉMARRAGE DE L'ANIMATION AUTOMATIQUE
    demarrerAutoScrollCarousel();
}

function demarrerAutoScrollCarousel() {
    const conteneur = document.getElementById("carousel-livres");
    if (carrouselTimer) clearInterval(carrouselTimer);

    // Défile de 200px toutes les 3 secondes
    carrouselTimer = setInterval(() => {
        if (!conteneur) return;

        // Si on atteint la fin du carrousel, on revient au début
        if (conteneur.scrollLeft + conteneur.clientWidth >= conteneur.scrollWidth - 10) {
            conteneur.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            conteneur.scrollBy({ left: 202, behavior: 'smooth' });
        }
    }, 3000);
}


/* ========================================================
   GESTION DU COUP DE COEUR (Enregistrement)
   ======================================================== */
function toggleCoupDeCoeur(event, index) {
    event.stopPropagation(); // Empêche d'ouvrir la fiche détaillée quand on clique sur le cœur

    const estCoupDeCoeur = (tousLesLivres[index][17] === "VRAI" || tousLesLivres[index][17] === true);
    const nouveauStatut = !estCoupDeCoeur;

    // Mise à jour visuelle instantanée
    tousLesLivres[index][17] = nouveauStatut ? "VRAI" : "FAUX";
    afficherLivres();

    // Envoi à Google Sheets
    fetch(URL_APPS_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            action: "UPDATE_COEUR",
            ligne: index + 2,
            coup_de_coeur: nouveauStatut
        })
    }).catch(erreur => console.error("Erreur d'enregistrement du coeur :", erreur));
}

/* ========================================================
   Outils, Étoiles, Formulaires et Fiches
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

function ouvrirFormulaire() { document.getElementById("modal-formulaire").classList.remove("cache"); }

/* ========================================================
   SOUMISSION ET RÉINITIALISATION DU FORMULAIRE
   ======================================================== */
function fermerFormulaire() {
    document.getElementById("modal-formulaire").classList.add("cache");
    document.getElementById("form-livre").reset();
    document.getElementById("nouveau-note").value = "0";
    document.getElementById("nouveau-coeur").checked = false; // 🟢 Réinitialise la case
    document.querySelectorAll('#star-rating-creation span').forEach(e => { e.classList.remove('text-warning'); e.classList.add('text-muted'); });
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
        coup_de_coeur: document.getElementById("nouveau-coeur").checked // 🟢 Récupère l'état de la case
    };

    fetch(URL_APPS_SCRIPT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(nouveauLivre) })
        .then(reponse => reponse.json())
        .then(resultat => {
            if (resultat.statut === "succès") { alert("Ajouté !"); fermerFormulaire(); chargerLivres(); }
            else { alert("Erreur Google : " + resultat.message); }
        }).catch(erreur => console.error("Erreur :", erreur));
}

function ouvrirFicheLivre(index) {
    const livre = tousLesLivres[index];
    if (!livre) return;
    const [id, personne, date_debut, date_fin, duree, couverture, titre, auteur, pages, prix_officiel, prix_reel, format, genre, statut, notes, review, tags, coup_de_coeur] = livre;

    const contenu = `
        <div class="d-flex justify-content-between align-items-center mb-3 pe-4">
            <h3 class="mb-0 fw-bold">${titre || "Sans titre"} ${coup_de_coeur === "VRAI" ? "❤️" : ""}</h3>
            <button class="btn btn-outline-primary btn-sm fw-bold ms-2" onclick="passerEnModeEdition(${index})">✏️ Modifier</button>
        </div>
        <h5 class="text-muted mb-3">${auteur || "Auteur inconnu"}</h5>
        <hr>
        <div class="row g-4">
            ${couverture ? `<div class="col-md-4"><img src="${couverture}" class="img-fluid rounded shadow-sm"></div>` : ''}
            <div class="${couverture ? 'col-md-8' : 'col-12'}">
                <p><strong>Appartient à :</strong> ${personne || "-"}</p>
                <p><strong>Statut :</strong> ${formatStatut(statut)}</p>
                <p><strong>Nombre de pages :</strong> ${pages || "-"}</p>
                <p><strong>Prix :</strong> ${prix_reel || "-"} € (Officiel : ${prix_officiel || "-"} €)</p>
                <p class="d-flex align-items-center gap-2"><strong>Note :</strong> ${notes ? genererEtoiles(notes) + ` (${notes}/5)` : "-"}</p>
                <p><strong>Avis :</strong> ${review || "-"}</p>
            </div>
        </div>`;
    document.getElementById("fiche-details").innerHTML = contenu;
    document.getElementById("modal-fiche").classList.remove("cache");
}

function fermerFicheLivre() { document.getElementById("modal-fiche").classList.add("cache"); }

function passerEnModeEdition(index) {
    const livre = tousLesLivres[index];
    if (!livre) return;
    const [id, personne, date_debut, date_fin, duree, couverture, titre, auteur, pages, prix_officiel, prix_reel, format, genre, statut, notes, review] = livre;
    const noteActuelle = parseInt(notes) || 0;
    const statutActuel = statut || "";

    const contenuEdit = `
        <form onsubmit="sauvegarderModification(event, ${index})">
            <h4 class="mb-3">Modifier la fiche</h4>
            <div class="mb-3"><label class="fw-bold">Titre :</label><input type="text" id="edit-titre" class="form-control" value="${titre || ''}" required></div>
            <div class="mb-3"><label class="fw-bold">Auteur :</label><input type="text" id="edit-auteur" class="form-control" value="${auteur || ''}" required></div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="fw-bold">Statut :</label>
                    <select id="edit-statut" class="form-select">
                        <option value="À lire" ${statutActuel.includes('À lire') ? 'selected' : ''}>À lire 📚</option>
                        <option value="En cours" ${statutActuel.includes('En cours') ? 'selected' : ''}>En cours 📖</option>
                        <option value="Pause" ${statutActuel.includes('Pause') ? 'selected' : ''}>Pause ⏸</option>
                        <option value="Terminé" ${statutActuel.includes('Terminé') ? 'selected' : ''}>Terminé ✔️</option>
                        <option value="Abandonné" ${statutActuel.includes('Abandonné') ? 'selected' : ''}>Abandonné ❌☠️</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
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
            <div class="mb-3"><label class="fw-bold">Avis :</label><textarea id="edit-review" class="form-control" rows="3">${review || ''}</textarea></div>
            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-secondary" onclick="ouvrirFicheLivre(${index})">Annuler</button>
                <button type="submit" class="btn btn-success">💾 Enregistrer</button>
            </div>
        </form>`;
    document.getElementById("fiche-details").innerHTML = contenuEdit;
}

function sauvegarderModification(event, index) {
    event.preventDefault();
    const livreModifie = {
        action: "UPDATE", ligne: index + 2,
        titre: document.getElementById("edit-titre").value, auteur: document.getElementById("edit-auteur").value,
        statut: document.getElementById("edit-statut").value, notes: document.getElementById("edit-note").value,
        review: document.getElementById("edit-review").value
    };

    fetch(URL_APPS_SCRIPT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(livreModifie) })
        .then(reponse => reponse.json())
        .then(resultat => {
            if (resultat.statut === "succès") {
                tousLesLivres[index][6] = livreModifie.titre; tousLesLivres[index][7] = livreModifie.auteur;
                tousLesLivres[index][13] = livreModifie.statut; tousLesLivres[index][14] = livreModifie.notes; tousLesLivres[index][15] = livreModifie.review;
                fermerFicheLivre(); filtreStatut = "TOUS"; chargerLivres(); // Recharge tout pour relancer le carrousel
            } else { alert("Erreur : " + resultat.message); }
        }).catch(erreur => console.error("Erreur :", erreur));
}