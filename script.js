// Chargement de la page
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
   VARIABLES GLOBALES ET FILTRES
   ======================================================== */
let tousLesLivres = [];
let filtrePersonne = "Commune";
let filtreStatut = "TOUS";

/* ========================================================
   CHARGEMENT ET AFFICHAGE DES LIVRES
   ======================================================== */

function chargerLivres() {
    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzfXagjnK-neDNfzMODyiTqx2wfgYDxIJTkvx5Ij-Ly_CdC4U27oBpnuqsxYVu0ZtSfyQ/exec";

    fetch(URL_APPS_SCRIPT)
        .then(reponse => reponse.json())
        .then(lignes => {
            tousLesLivres = lignes.slice(1);
            afficherLivres();
        })
        .catch(erreur => console.error("Erreur lors du chargement des livres :", erreur));
}

function afficherLivres() {
    const grille = document.getElementById("grille-livres");
    grille.innerHTML = "";

    tousLesLivres.forEach((ligne, index) => {
        const personne = ligne[1];
        const couverture = ligne[5];
        const titre = ligne[6];
        const auteur = ligne[7];
        const statut = ligne[13];

        if (!titre) return;

        if (filtrePersonne !== "Commune" && personne !== filtrePersonne) {
            return;
        }

        // Filtre Pile à lire
        if (filtreStatut === "À lire" && !statut.includes("À lire")) {
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
                            <span class="badge bg-light text-dark border">${formatStatut(statut)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grille.innerHTML += carteHtml;
    });
}

/* ========================================================
   GESTION DE L'INTERFACE
   ======================================================== */

function changerVue(vueDemandee) {
    if (vueDemandee === "PAL") {
        filtreStatut = (filtreStatut === "À lire") ? "TOUS" : "À lire";
    } else {
        filtrePersonne = vueDemandee;
    }
    afficherLivres();
}

function ouvrirFormulaire() {
    document.getElementById("modal-formulaire").classList.remove("cache");
}

function fermerFormulaire() {
    document.getElementById("modal-formulaire").classList.add("cache");
    document.getElementById("form-livre").reset();

    // Remet les étoiles à zéro
    document.getElementById("nouveau-note").value = "0";
    const etoiles = document.querySelectorAll('#star-rating-creation span');
    etoiles.forEach(etoile => {
        etoile.classList.remove('text-warning');
        etoile.classList.add('text-muted');
    });
}

/* ========================================================
   GESTION DES ÉTOILES DE NOTATION
   ======================================================== */

function genererEtoiles(note) {
    const nb = parseInt(note) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="${i <= nb ? 'text-warning' : 'text-muted'} fs-5">★</span>`;
    }
    return html;
}

function selectionnerEtoileCreation(valeur) {
    document.getElementById('nouveau-note').value = valeur;
    const etoiles = document.querySelectorAll('#star-rating-creation span');
    etoiles.forEach((etoile, index) => {
        if (index < valeur) {
            etoile.classList.remove('text-muted');
            etoile.classList.add('text-warning');
        } else {
            etoile.classList.remove('text-warning');
            etoile.classList.add('text-muted');
        }
    });
}

function selectionnerEtoile(valeur) {
    document.getElementById('edit-note').value = valeur;
    const etoiles = document.querySelectorAll('#star-rating span');
    etoiles.forEach((etoile, index) => {
        if (index < valeur) {
            etoile.classList.remove('text-muted');
            etoile.classList.add('text-warning');
        } else {
            etoile.classList.remove('text-warning');
            etoile.classList.add('text-muted');
        }
    });
}

/* ========================================================
   GESTION DE FORMATAGE DU STATUT
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
        note: document.getElementById("nouveau-note").value
    };

    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzfXagjnK-neDNfzMODyiTqx2wfgYDxIJTkvx5Ij-Ly_CdC4U27oBpnuqsxYVu0ZtSfyQ/exec";

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
                chargerLivres();
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
   FICHE COMPLÈTE ET ÉDITION
   ======================================================== */

function ouvrirFicheLivre(index) {
    const livre = tousLesLivres[index];
    if (!livre) return;

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
                <p><strong>Statut :</strong> ${formatStatut(statut)}</p>
                <p><strong>Genre :</strong> ${genre || "-"} | <strong>Format :</strong> ${format || "-"}</p>
                <p><strong>Nombre de pages :</strong> ${pages || "-"}</p>
                <p><strong>Période de lecture :</strong> Du ${date_debut || "?"} au ${date_fin || "?"} (${duree || "-"})</p>
                <p><strong>Prix payé :</strong> ${prix_reel || "-"} € (Prix officiel : ${prix_officiel || "-"} €)</p>
                <p class="d-flex align-items-center gap-2"><strong>Note :</strong> ${notes ? genererEtoiles(notes) + ` <span class="text-muted">(${notes}/5)</span>` : "-"}</p>
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
    const noteActuelle = parseInt(notes) || 0;
    const statutActuel = statut || "";

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
                        <option value="À lire" ${statutActuel.includes('À lire') ? 'selected' : ''}>À lire 📚</option>
                        <option value="En cours" ${statutActuel.includes('En cours') ? 'selected' : ''}>En cours 📖</option>
                        <option value="Pause" ${statutActuel.includes('Pause') ? 'selected' : ''}>Pause ⏸</option>
                        <option value="Terminé" ${statutActuel.includes('Terminé') ? 'selected' : ''}>Terminé ✔️</option>
                        <option value="Abandonné" ${statutActuel.includes('Abandonné') ? 'selected' : ''}>Abandonné ❌☠️</option>
                    </select>
                </div>

                <div class="col-md-6 mb-3">
                    <label class="form-label fw-bold">Note :</label>
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

    const numeroLigne = index + 2;

    const nouveauTitre = document.getElementById("edit-titre").value;
    const nouveauAuteur = document.getElementById("edit-auteur").value;
    const nouveauStatut = document.getElementById("edit-statut").value;
    const nouvelleNote = document.getElementById("edit-note").value;
    const nouvelAvis = document.getElementById("edit-review").value;

    const livreModifie = {
        action: "UPDATE",
        ligne: numeroLigne,
        titre: nouveauTitre,
        auteur: nouveauAuteur,
        statut: nouveauStatut,
        notes: nouvelleNote,
        review: nouvelAvis
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
                // Mise à jour immédiate en mémoire
                if (tousLesLivres[index]) {
                    tousLesLivres[index][6] = nouveauTitre;
                    tousLesLivres[index][7] = nouveauAuteur;
                    tousLesLivres[index][13] = nouveauStatut;
                    tousLesLivres[index][14] = nouvelleNote;
                    tousLesLivres[index][15] = nouvelAvis;
                }

                fermerFicheLivre();
                filtreStatut = "TOUS"; // Bascule la vue pour afficher le livre modifié
                afficherLivres();
            } else {
                alert("Erreur lors de la modification : " + resultat.message);
            }
        })
        .catch(erreur => {
            console.error("Erreur de sauvegarde :", erreur);
            alert("Impossible de contacter le serveur Google.");
        });
}