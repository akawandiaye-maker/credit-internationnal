// Variables globales
let utilisateurConnecte = false;
let listeEmployesCourante = [];
let listeEtudiantsCourante = [];
let sections, navButtons;
let documentEnModification = null;

// Vérifier l'état de connexion au chargement
function verifierConnexion() {
    const userData = localStorage.getItem('utilisateurConnecte');
    if (userData) {
        utilisateurConnecte = true;
        const user = JSON.parse(userData);
        mettreAJourInfoUtilisateur(user);
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialiser les sélecteurs après le chargement du DOM
        sections = document.querySelectorAll('.section');
        navButtons = document.querySelectorAll('.nav-btn');
        
        console.log('Sections trouvées:', sections.length);
        console.log('Boutons de navigation trouvés:', navButtons.length);
        
        if (sections.length === 0 || navButtons.length === 0) {
            console.error('Éléments DOM critiques manquants');
            return;
        }
        
        setupNavigation();
        setupAuthentication();
        setupDocumentManagement();
        setupSearch();
        
        verifierConnexion();
        
        // Initialisation différée pour permettre le rendu
        setTimeout(() => {
            afficherDocumentsParCategories();
            mettreAJourStatistiques();
        }, 100);
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }
});

// Configuration de la navigation
function setupNavigation() {
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.id.replace('btn-', '');
            
            // Sections nécessitant une authentification
            const sectionsProtegees = ['documents', 'recherche', 'parametres'];
            
            if (sectionsProtegees.includes(targetId) && !utilisateurConnecte) {
                afficherAccesRestreint();
                return;
            }

            afficherSection(targetId);
        });
    });
}

// Configuration de l'authentification
function setupAuthentication() {
    // Boutons de redirection vers connexion/inscription
    const btnsVersConnexion = ['btn-commencer', 'ajouter-document', 'btn-connexion-restreint'];
    btnsVersConnexion.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!utilisateurConnecte) {
                    afficherSection('connexion');
                } else if (btnId === 'btn-commencer' || btnId === 'ajouter-document') {
                    afficherSection('documents');
                }
            });
        }
    });

    // Boutons d'inscription
    const btnsVersInscription = ['btn-vers-inscription', 'btn-inscription-restreint'];
    btnsVersInscription.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', () => afficherSection('inscription'));
    });

    // Bouton vers connexion depuis inscription
    const btnVersConnexion = document.getElementById('btn-vers-connexion');
    if (btnVersConnexion) {
        btnVersConnexion.addEventListener('click', () => afficherSection('connexion'));
    }

    // Gestion mot de passe oublié
    const lienMotDePasseOublie = document.getElementById('lien-mot-de-passe-oublie');
    if (lienMotDePasseOublie) {
        lienMotDePasseOublie.addEventListener('click', (e) => {
            e.preventDefault();
            afficherSection('mot-de-passe-oublie');
        });
    }

    // Retours vers connexion
    const btnRetourConnexion = document.getElementById('btn-retour-connexion');
    if (btnRetourConnexion) {
        btnRetourConnexion.addEventListener('click', () => afficherSection('connexion'));
    }

    const btnAnnulerReinitialisation = document.getElementById('btn-annuler-reinitialisation');
    if (btnAnnulerReinitialisation) {
        btnAnnulerReinitialisation.addEventListener('click', () => afficherSection('connexion'));
    }

    // Formulaires d'authentification
    setupAuthForms();
}

// Configuration des formulaires d'authentification
function setupAuthForms() {
    // Formulaire mot de passe oublié
    const formMotDePasseOublie = document.getElementById('form-mot-de-passe-oublie');
    if (formMotDePasseOublie) {
        formMotDePasseOublie.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email-recuperation').value;
            
            const utilisateurs = JSON.parse(localStorage.getItem('utilisateurs')) || [];
            const userExists = utilisateurs.find(u => u.email === email);
            
            if (userExists) {
                alert(`📧 Un lien de récupération a été envoyé à ${email}.\n\nPour cette démo, vous pouvez directement réinitialiser votre mot de passe.`);
                const emailReinitialisation = document.getElementById('email-reinitialisation');
                if (emailReinitialisation) emailReinitialisation.value = email;
                afficherSection('reinitialiser-mot-de-passe');
            } else {
                alert('❌ Aucun compte associé à cette adresse email.');
            }
        });
    }

    // Formulaire réinitialisation mot de passe
    const formReinitialiserMotDePasse = document.getElementById('form-reinitialiser-mot-de-passe');
    if (formReinitialiserMotDePasse) {
        formReinitialiserMotDePasse.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email-reinitialisation').value;
            const nouveauMotDePasse = document.getElementById('nouveau-mot-de-passe').value;
            const confirmerMotDePasse = document.getElementById('confirmer-nouveau-mot-de-passe').value;
            
            if (nouveauMotDePasse !== confirmerMotDePasse) {
                alert('❌ Les mots de passe ne correspondent pas.');
                return;
            }
            
            if (nouveauMotDePasse.length < 6) {
                alert('❌ Le mot de passe doit contenir au moins 6 caractères.');
                return;
            }
            
            let utilisateurs = JSON.parse(localStorage.getItem('utilisateurs')) || [];
            const userIndex = utilisateurs.findIndex(u => u.email === email);
            
            if (userIndex !== -1) {
                utilisateurs[userIndex].motDePasse = nouveauMotDePasse;
                localStorage.setItem('utilisateurs', JSON.stringify(utilisateurs));
                alert('✅ Votre mot de passe a été réinitialisé avec succès !');
                afficherSection('connexion');
            } else {
                alert('❌ Erreur lors de la réinitialisation.');
            }
        });
    }

    // Formulaire connexion
    const formConnexion = document.getElementById('form-connexion');
    if (formConnexion) {
        formConnexion.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email-connexion').value;
            const motDePasse = document.getElementById('mot-de-passe-connexion').value;
            
            const utilisateurs = JSON.parse(localStorage.getItem('utilisateurs')) || [];
            const user = utilisateurs.find(u => u.email === email && u.motDePasse === motDePasse);
            
            if (user) {
                utilisateurConnecte = true;
                localStorage.setItem('utilisateurConnecte', JSON.stringify(user));
                mettreAJourInfoUtilisateur(user);
                afficherSection('dashboard');
                alert('Connexion réussie !');
            } else {
                alert('Email ou mot de passe incorrect.');
            }
        });
    }

    // Formulaire inscription
    const formInscription = document.getElementById('form-inscription');
    if (formInscription) {
        formInscription.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userData = Object.fromEntries(formData);
            
            if (userData.motDePasse !== userData.confirmerMotDePasse) {
                alert('Les mots de passe ne correspondent pas.');
                return;
            }
            
            let utilisateurs = JSON.parse(localStorage.getItem('utilisateurs')) || [];
            if (utilisateurs.find(u => u.email === userData.email)) {
                alert('Un compte avec cet email existe déjà.');
                return;
            }
            
            delete userData.confirmerMotDePasse;
            delete userData.accepterConditions;
            utilisateurs.push(userData);
            localStorage.setItem('utilisateurs', JSON.stringify(utilisateurs));
            
            alert('Compte créé avec succès !');
            afficherSection('connexion');
        });
    }

    // Déconnexion
    const btnDeconnexion = document.getElementById('btn-deconnexion');
    if (btnDeconnexion) {
        btnDeconnexion.addEventListener('click', () => {
            utilisateurConnecte = false;
            localStorage.removeItem('utilisateurConnecte');
            mettreAJourInfoUtilisateur({ nom: '', prenom: '', email: '', organisation: '' });
            afficherSection('dashboard');
            alert('Déconnexion réussie.');
        });
    }
}

// Configuration de la gestion des documents
function setupDocumentManagement() {
    const ajouterDocBtn = document.getElementById('ajouter-document');
    if (ajouterDocBtn) {
        ajouterDocBtn.addEventListener('click', () => {
            if (!utilisateurConnecte) {
                afficherSection('connexion');
                return;
            }
            resetFormState();
            const typeContainer = document.getElementById('type-document-container');
            if (typeContainer) {
                typeContainer.classList.remove('hidden');
            }
        });
    }

    const typeDocSelect = document.getElementById('type-document');
    if (typeDocSelect) {
        typeDocSelect.addEventListener('change', function() {
            gererChangementTypeDocument(this.value);
        });
    }
}

// Configuration de la recherche
function setupSearch() {
    const champRecherche = document.getElementById('champ-recherche');
    const filtreCategorie = document.getElementById('filtre-categorie');
    
    if (champRecherche) {
        ['input', 'change'].forEach(event => {
            champRecherche.addEventListener(event, rechercherDocuments);
        });
    }
    
    if (filtreCategorie) {
        ['input', 'change'].forEach(event => {
            filtreCategorie.addEventListener(event, rechercherDocuments);
        });
    }
}

// Fonction utilitaire pour afficher une section
function afficherSection(sectionId) {
    console.log('Affichage de la section:', sectionId);
    
    if (!sections || !navButtons) {
        console.error('Sections ou navButtons non initialisés');
        return;
    }
    
    // Mettre à jour les sections
    sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
        section.classList.toggle('hidden', section.id !== sectionId);
    });
    
    // Mettre à jour la navigation active
    navButtons.forEach(btn => {
        const btnTargetId = btn.id.replace('btn-', '');
        btn.classList.toggle('active', btnTargetId === sectionId);
    });
}

// Afficher la page d'accès restreint
function afficherAccesRestreint() {
    if (!sections) {
        console.error('Sections non initialisées');
        return;
    }
    afficherSection('acces-restreint');
}

// Mettre à jour les infos utilisateur
function mettreAJourInfoUtilisateur(user) {
    const userNom = document.getElementById('user-nom');
    const userEmail = document.getElementById('user-email');
    const userOrganisation = document.getElementById('user-organisation');
    
    if (userNom) userNom.textContent = `${user.nom || ''} ${user.prenom || ''}`.trim() || '-';
    if (userEmail) userEmail.textContent = user.email || '-';
    if (userOrganisation) userOrganisation.textContent = user.organisation || 'Non spécifiée';
}

// Gestion des états de formulaire
function resetFormState() {
    documentEnModification = null;
    listeEmployesCourante = [];
    listeEtudiantsCourante = [];
    
    const typeContainer = document.getElementById('type-document-container');
    const formContainer = document.getElementById('formulaire-document');
    const typeDocSelect = document.getElementById('type-document');
    
    if (typeContainer) typeContainer.classList.add('hidden');
    if (formContainer) formContainer.classList.add('hidden');
    if (typeDocSelect) typeDocSelect.value = '';
}

// Fonction pour gérer le changement de type de document
function gererChangementTypeDocument(typeDocument) {
    const formContainer = document.getElementById('formulaire-document');
    if (!formContainer) return;

    const formsTemplates = {
        'cv': genererFormulaireCV(),
        'document-administratif': genererFormulaireDocumentAdministratif(),
        'fiche-paie': genererFormulaireFichePaie(),
        'liste-employes': genererFormulaireListeEmployes(),
        'liste-etudiants': genererFormulaireListeEtudiants()
    };

    formContainer.innerHTML = formsTemplates[typeDocument] || '';
    
    if (typeDocument) {
        formContainer.classList.remove('hidden');
        
        // Si on est en mode modification, pré-remplir le formulaire
        if (documentEnModification && documentEnModification.type === typeDocument) {
            setTimeout(() => preremplirFormulaire(documentEnModification), 100);
        }
        
        if (!['liste-employes', 'liste-etudiants'].includes(typeDocument)) {
            attacherEvenementFormulaire(typeDocument);
        } else {
            // Réinitialiser les listes temporaires
            if (typeDocument === 'liste-employes') listeEmployesCourante = [];
            if (typeDocument === 'liste-etudiants') listeEtudiantsCourante = [];
        }
    } else {
        formContainer.classList.add('hidden');
    }
}

// Fonction pour pré-remplir le formulaire en mode modification
function preremplirFormulaire(document) {
    const form = document.querySelector('#formulaire-document form');
    if (!form || !document.donnees) return;

    Object.entries(document.donnees).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input && typeof value === 'string' && !value.startsWith('data:')) {
            input.value = value;
        }
    });

    // Changer le texte du bouton pour indiquer la modification
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = '✏️ Modifier le document';
        submitBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    }
}

// Fonctions pour générer les formulaires
function genererFormulaireCV() {
    return `<h3>${documentEnModification ? '✏️ Modifier le CV' : 'Ajouter un CV'}</h3>
    <form id="form-cv">
        <label>Nom du document:</label><input name="documentName" required>
        <label>Nom:</label><input name="nom" required>
        <label>Prénom:</label><input name="prenom" required>
        <label>Date de naissance:</label><input name="dateNaissance" type="date" required>
        <label>Lieu de naissance:</label><input name="lieuNaissance" required>
        <label>Nationalité:</label><input name="nationalite" required>
        <label>Situation matrimoniale:</label>
        <select name="situationMatrimoniale" required>
            <option value="">-- Sélectionnez --</option>
            <option value="Célibataire">Célibataire</option>
            <option value="Marié(e)">Marié(e)</option>
            <option value="Divorcé(e)">Divorcé(e)</option>
            <option value="Veuf/Veuve">Veuf/Veuve</option>
        </select>
        <label>Adresse complète:</label><textarea name="adresse" required></textarea>
        <label>Email:</label><input name="email" type="email" required>
        <label>Téléphone:</label><input name="telephone" type="tel" required>
        <label>Profession/Poste souhaité:</label><input name="profession" required>
        <label>Niveau d'études:</label>
        <select name="niveauEtudes" required>
            <option value="">-- Sélectionnez --</option>
            <option value="Sans diplôme">Sans diplôme</option>
            <option value="CEP">CEP</option>
            <option value="BFEM">BFEM</option>
            <option value="BAC">BAC</option>
            <option value="BAC+2">BAC+2</option>
            <option value="BAC+3">BAC+3</option>
            <option value="BAC+4">BAC+4</option>
            <option value="BAC+5">BAC+5</option>
            <option value="BAC+8">BAC+8</option>
        </select>
        <label>Domaine d'études:</label><input name="domaineEtudes" required>
        <label>Années d'expérience:</label><input name="anneesExperience" type="number" min="0" required>
        <label>Compétences principales:</label>
        <textarea name="competences" placeholder="Ex: Informatique, Gestion, Communication..." required></textarea>
        <label>Langues parlées:</label>
        <textarea name="langues" placeholder="Ex: Français (courant), Anglais (intermédiaire)..." required></textarea>
        <label>Disponibilité:</label>
        <select name="disponibilite" required>
            <option value="">-- Sélectionnez --</option>
            <option value="Immédiate">Immédiate</option>
            <option value="1 semaine">1 semaine</option>
            <option value="2 semaines">2 semaines</option>
            <option value="1 mois">1 mois</option>
            <option value="À négocier">À négocier</option>
        </select>
        <label>Prétentions salariales (FCFA):</label><input name="salaire" type="number" placeholder="Ex: 250000">
        <label>Fichier CV (PDF/Word):</label><input name="fichier" type="file" accept=".pdf,.doc,.docx" ${documentEnModification ? '' : 'required'}>
        <button type="submit" class="btn-submit">${documentEnModification ? '✏️ Modifier le CV' : 'Enregistrer le CV'}</button>
    </form>`;
}

function genererFormulaireDocumentAdministratif() {
    return `<h3>${documentEnModification ? '✏️ Modifier le Document Administratif' : 'Ajouter un Document Administratif'}</h3>
    <form id="form-document-administratif">
        <label>Nom du document:</label><input name="documentName" required>
        <label>Type de document:</label>
        <select name="typeDocument" required>
            <option value="">-- Sélectionnez le type --</option>
            <option value="Certificat de naissance">Certificat de naissance</option>
            <option value="Certificat de mariage">Certificat de mariage</option>
            <option value="Certificat de décès">Certificat de décès</option>
            <option value="Certificat de nationalité">Certificat de nationalité</option>
            <option value="Carte d'identité nationale">Carte d'identité nationale</option>
            <option value="Passeport">Passeport</option>
            <option value="Permis de conduire">Permis de conduire</option>
            <option value="Diplôme">Diplôme</option>
            <option value="Attestation de travail">Attestation de travail</option>
            <option value="Certificat médical">Certificat médical</option>
            <option value="Casier judiciaire">Casier judiciaire</option>
            <option value="Attestation de résidence">Attestation de résidence</option>
            <option value="Autorisation parentale">Autorisation parentale</option>
            <option value="Procuration">Procuration</option>
            <option value="Contrat">Contrat</option>
            <option value="Facture officielle">Facture officielle</option>
            <option value="Reçu fiscal">Reçu fiscal</option>
            <option value="Autre">Autre</option>
        </select>
        <label>Numéro de référence/Série:</label><input name="numeroReference" placeholder="Ex: CIN123456789, PASS-SN-2024-001234...">
        <label>Nom du titulaire:</label><input name="nomTitulaire" required>
        <label>Prénom du titulaire:</label><input name="prenomTitulaire" required>
        <label>Date d'émission:</label><input name="dateEmission" type="date" required>
        <label>Date d'expiration:</label><input name="dateExpiration" type="date">
        <label>Organisme émetteur:</label><input name="organismeEmetteur" required placeholder="Ex: Mairie de Dakar, Préfecture...">
        <label>Lieu d'émission:</label><input name="lieuEmission" required placeholder="Ex: Dakar, Thiès, Saint-Louis...">
        <label>Statut du document:</label>
        <select name="statutDocument" required>
            <option value="">-- Sélectionnez --</option>
            <option value="Original">Original</option>
            <option value="Copie certifiée conforme">Copie certifiée conforme</option>
            <option value="Photocopie simple">Photocopie simple</option>
            <option value="Copie légalisée">Copie légalisée</option>
        </select>
        <label>Observations/Notes:</label>
        <textarea name="observations" placeholder="Notes additionnelles..."></textarea>
        <label>Fichier document:</label><input name="fichier" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" ${documentEnModification ? '' : 'required'}>
        <button type="submit" class="btn-submit">${documentEnModification ? '✏️ Modifier le document' : 'Enregistrer le document'}</button>
    </form>`;
}

function genererFormulaireFichePaie() {
    return `<h3>${documentEnModification ? '✏️ Modifier la Fiche de Salaire' : 'Ajouter une Fiche de Salaire'}</h3>
    <form id="form-fiche-paie">
        <label>Nom du document:</label><input name="documentName" required>
        <label>Nom de l'employé:</label><input name="nomEmploye" required>
        <label>Prénom de l'employé:</label><input name="prenomEmploye" required>
        <label>Matricule employé:</label><input name="matriculeEmploye" required placeholder="Ex: EMP-2025-001">
        <label>Poste/Fonction:</label><input name="posteEmploye" required>
        <label>Département/Service:</label><input name="departement" placeholder="Ex: Ressources Humaines...">
        <label>Mois de paie:</label><input name="moisPaie" type="month" required>
        <label>Nombre d'heures travaillées:</label><input name="heuresTravaillees" type="number" step="0.5" required placeholder="Ex: 173.33">
        <label>Taux horaire (FCFA):</label><input name="tauxHoraire" type="number" step="0.01" placeholder="Ex: 1500">
        <label>Salaire de base (FCFA):</label><input name="salaireBase" type="number" step="0.01" required onchange="calculerMontantsFichePaie()">
        <label>Primes et indemnités (FCFA):</label><input name="primes" type="number" step="0.01" value="0" placeholder="Primes diverses..." onchange="calculerMontantsFichePaie()">
        <label>Heures supplémentaires (FCFA):</label><input name="heuresSupplementaires" type="number" step="0.01" value="0" onchange="calculerMontantsFichePaie()">
        <label>Total brut (FCFA):</label><input name="totalBrut" type="number" step="0.01" readonly style="background-color: #f0f0f0;">
        <label>Cotisations sociales (FCFA):</label><input name="cotisationsSociales" type="number" step="0.01" required placeholder="CSS, retraite..." onchange="calculerMontantsFichePaie()">
        <label>Impôts sur le revenu (FCFA):</label><input name="impots" type="number" step="0.01" value="0" placeholder="IRPP..." onchange="calculerMontantsFichePaie()">
        <label>Autres déductions (FCFA):</label><input name="autresDeductions" type="number" step="0.01" value="0" placeholder="Avances, retenues..." onchange="calculerMontantsFichePaie()">
        <label>Total déductions (FCFA):</label><input name="totalDeductions" type="number" step="0.01" readonly style="background-color: #f0f0f0;">
        <label>Salaire net à payer (FCFA):</label><input name="salaireNet" type="number" step="0.01" readonly style="background-color: #e8f5e8; font-weight: bold;">
        <label>Mode de paiement:</label>
        <select name="modePaiement" required>
            <option value="">-- Sélectionnez --</option>
            <option value="Virement bancaire">Virement bancaire</option>
            <option value="Chèque">Chèque</option>
            <option value="Espèces">Espèces</option>
            <option value="Mobile Money">Mobile Money</option>
        </select>
        <label>Observations:</label><textarea name="observations" placeholder="Notes particulières..."></textarea>
        <label>Fichier fiche de paie (PDF):</label><input name="fichier" type="file" accept=".pdf" ${documentEnModification ? '' : 'required'}>
        <button type="submit" class="btn-submit">${documentEnModification ? '✏️ Modifier la fiche de paie' : 'Enregistrer la fiche de paie'}</button>
    </form>`;
}

function genererFormulaireListeEmployes() {
    return `<h3>${documentEnModification ? '✏️ Modifier la Liste d\'Employés' : 'Créer une Liste d\'Employés'}</h3>
        <div id="form-liste-employes">
            <label>Nom de la liste:</label><input id="nom-liste-employes" required placeholder="Ex: Équipe Marketing 2025">
            <div id="employes-container">
                <h4>Ajouter des employés :</h4>
                <div id="form-employe" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label>Matricule:</label><input id="matricule-employe" required placeholder="Ex: EMP-2025-001">
                        </div>
                        <div>
                            <label>Nom complet:</label><input id="nom-employe" required placeholder="Ex: Dupont Jean">
                        </div>
                        <div>
                            <label>Date de recrutement:</label><input id="date-employe" type="date" required>
                        </div>
                        <div>
                            <label>Heures de travail/semaine:</label><input id="heures-employe" type="number" required placeholder="Ex: 40">
                        </div>
                        <div>
                            <label>Téléphone:</label><input id="telephone-employe" type="tel" required placeholder="Ex: +221 77 123 45 67">
                        </div>
                        <div>
                            <label>Email:</label><input id="email-employe" type="email" required placeholder="Ex: jean.dupont@entreprise.com">
                        </div>
                    </div>
                    <button type="button" onclick="ajouterEmploye()" class="btn-primary" style="margin-top: 15px; width: 100%;">➕ Ajouter cet employé à la liste</button>
                </div>
            </div>
            <div id="liste-employes-preview" style="margin: 20px 0;"></div>
            <button type="button" onclick="sauvegarderListeEmployes()" class="btn-submit" style="width: 100%;">💾 ${documentEnModification ? 'Modifier la liste complète' : 'Sauvegarder la liste complète'}</button>
        </div>`;
}

function genererFormulaireListeEtudiants() {
    return `<h3>${documentEnModification ? '✏️ Modifier la Liste d\'Étudiants' : 'Créer une Liste d\'Étudiants'}</h3>
        <div id="form-liste-etudiants">
            <label>Nom de la liste:</label><input id="nom-liste-etudiants" required placeholder="Ex: Promotion Informatique 2025">
            <div id="etudiants-container">
                <h4>Ajouter des étudiants :</h4>
                <div id="form-etudiant" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label>Matricule:</label><input id="matricule-etudiant" required placeholder="Ex: ETU-2025-001">
                        </div>
                        <div>
                            <label>Nom complet:</label><input id="nom-etudiant" required placeholder="Ex: Diallo Fatou">
                        </div>
                        <div>
                            <label>Filière:</label><input id="filiere-etudiant" required placeholder="Ex: Informatique, Droit">
                        </div>
                        <div>
                            <label>Niveau:</label><input id="niveau-etudiant" required placeholder="Ex: Licence 2, Master 1">
                        </div>
                        <div>
                            <label>Téléphone (facultatif):</label><input id="telephone-etudiant" type="tel" placeholder="Ex: +221 77 123 45 67">
                        </div>
                        <div>
                            <label>Email (facultatif):</label><input id="email-etudiant" type="email" placeholder="Ex: fatou.diallo@universite.edu.sn">
                        </div>
                    </div>
                    <button type="button" onclick="ajouterEtudiant()" class="btn-primary" style="margin-top: 15px; width: 100%;">➕ Ajouter cet étudiant à la liste</button>
                </div>
            </div>
            <div id="liste-etudiants-preview" style="margin: 20px 0;"></div>
            <button type="button" onclick="sauvegarderListeEtudiants()" class="btn-submit" style="width: 100%;">💾 ${documentEnModification ? 'Modifier la liste complète' : 'Sauvegarder la liste complète'}</button>
        </div>`;
}

// Fonction globale pour calculer les montants des fiches de paie
function calculerMontantsFichePaie() {
    const form = document.getElementById('form-fiche-paie');
    if (!form) return;
    
    try {
        const salaireBase = parseFloat(form.querySelector('[name="salaireBase"]').value) || 0;
        const primes = parseFloat(form.querySelector('[name="primes"]').value) || 0;
        const heuresSupp = parseFloat(form.querySelector('[name="heuresSupplementaires"]').value) || 0;
        const cotisations = parseFloat(form.querySelector('[name="cotisationsSociales"]').value) || 0;
        const impots = parseFloat(form.querySelector('[name="impots"]').value) || 0;
        const autres = parseFloat(form.querySelector('[name="autresDeductions"]').value) || 0;
        
        const totalBrut = salaireBase + primes + heuresSupp;
        const totalDeductions = cotisations + impots + autres;
        const salaireNet = totalBrut - totalDeductions;
        
        form.querySelector('[name="totalBrut"]').value = totalBrut.toFixed(0);
        form.querySelector('[name="totalDeductions"]').value = totalDeductions.toFixed(0);
        form.querySelector('[name="salaireNet"]').value = salaireNet.toFixed(0);
    } catch (error) {
        console.error('Erreur lors du calcul des montants:', error);
    }
}

// Gestion soumission formulaires documents
function attacherEvenementFormulaire(typeDocument) {
    const formulaire = document.querySelector('#formulaire-document form');
    if (!formulaire) {
        console.error('Formulaire non trouvé');
        return;
    }
    
    // Supprimer les anciens événements pour éviter les doublons
    const newForm = formulaire.cloneNode(true);
    formulaire.parentNode.replaceChild(newForm, formulaire);
    
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const documentData = {};

            for (let [key, value] of formData.entries()) {
                if (value instanceof File && value.size > 0) {
                    try {
                        documentData[key] = await lireFichierBase64(value);
                    } catch (error) {
                        console.error('Erreur lecture fichier:', error);
                        documentData[key] = value;
                    }
                } else if (value instanceof File && value.size === 0 && documentEnModification) {
                    // En mode modification, garder l'ancien fichier si aucun nouveau fichier
                    documentData[key] = documentEnModification.donnees[key];
                } else {
                    documentData[key] = value;
                }
            }

            let documents = JSON.parse(localStorage.getItem('documents')) || [];
            
            if (documentEnModification) {
                // Mode modification
                const index = documentEnModification.index;
                documents[index] = {
                    type: typeDocument,
                    donnees: documentData,
                    dateAjout: documents[index].dateAjout // Garder la date originale
                };
                alert('Document modifié avec succès !');
            } else {
                // Mode création
                documents.push({
                    type: typeDocument,
                    donnees: documentData,
                    dateAjout: new Date().toISOString()
                });
                alert('Document enregistré avec succès !');
            }

            localStorage.setItem('documents', JSON.stringify(documents));
            
            e.target.reset();
            resetFormState();
            afficherDocumentsParCategories();
            mettreAJourStatistiques();
            
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            alert('Erreur lors de l\'enregistrement du document.');
        }
    });
}

// Fonctions pour gérer la liste des employés
function ajouterEmploye() {
    try {
        const matricule = document.getElementById('matricule-employe')?.value.trim();
        const nom = document.getElementById('nom-employe')?.value.trim();
        const date = document.getElementById('date-employe')?.value;
        const heures = document.getElementById('heures-employe')?.value;
        const telephone = document.getElementById('telephone-employe')?.value.trim();
        const email = document.getElementById('email-employe')?.value.trim();

        if (!matricule || !nom || !date || !heures || !telephone || !email) {
            alert('Tous les champs sont obligatoires pour un employé.');
            return;
        }

        // Vérifier unicité du matricule
        if (listeEmployesCourante.find(emp => emp.matricule === matricule)) {
            alert('Ce matricule existe déjà dans la liste.');
            return;
        }

        const employe = { matricule, nom, date, heures, telephone, email };
        listeEmployesCourante.push(employe);
        
        // Réinitialiser le formulaire
        ['matricule-employe', 'nom-employe', 'date-employe', 'heures-employe', 'telephone-employe', 'email-employe']
            .forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = '';
            });
        
        afficherPreviewEmployes();
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'employé:', error);
        alert('Erreur lors de l\'ajout de l\'employé.');
    }
}

function afficherPreviewEmployes() {
    const preview = document.getElementById('liste-employes-preview');
    if (!preview) return;
    
    if (listeEmployesCourante.length === 0) {
        preview.innerHTML = '<p>Aucun employé ajouté.</p>';
        return;
    }
    
    preview.innerHTML = `
        <h4>Employés dans la liste (${listeEmployesCourante.length}) :</h4>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
            ${listeEmployesCourante.map((emp, index) => `
                <div style="background: #f8f9fa; margin: 5px 0; padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${emp.nom}</strong> (${emp.matricule})<br>
                        <small>Recruté le ${emp.date} • ${emp.heures}h • ${emp.telephone} • ${emp.email}</small>
                    </div>
                    <button onclick="supprimerEmploye(${index})" class="btn-supprimer" style="margin: 0;">×</button>
                </div>
            `).join('')}
        </div>
    `;
}

function supprimerEmploye(index) {
    try {
        listeEmployesCourante.splice(index, 1);
        afficherPreviewEmployes();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'employé:', error);
    }
}

function sauvegarderListeEmployes() {
    try {
        const nomListe = document.getElementById('nom-liste-employes')?.value.trim();
        
        if (!nomListe) {
            alert('Veuillez saisir un nom pour la liste.');
            return;
        }
        
        if (listeEmployesCourante.length === 0) {
            alert('Ajoutez au moins un employé à la liste.');
            return;
        }

        let documents = JSON.parse(localStorage.getItem('documents')) || [];
        
        if (documentEnModification) {
            // Mode modification
            const index = documentEnModification.index;
            documents[index] = {
                type: 'liste-employes',
                donnees: {
                    documentName: nomListe,
                    employes: [...listeEmployesCourante],
                    nombreEmployes: listeEmployesCourante.length
                },
                dateAjout: documents[index].dateAjout
            };
            alert(`Liste "${nomListe}" modifiée avec ${listeEmployesCourante.length} employé(s) !`);
        } else {
            // Mode création
            documents.push({
                type: 'liste-employes',
                donnees: {
                    documentName: nomListe,
                    employes: [...listeEmployesCourante],
                    nombreEmployes: listeEmployesCourante.length
                },
                dateAjout: new Date().toISOString()
            });
            alert(`Liste "${nomListe}" sauvegardée avec ${listeEmployesCourante.length} employé(s) !`);
        }

        localStorage.setItem('documents', JSON.stringify(documents));
        resetFormState();
        afficherDocumentsParCategories();
        mettreAJourStatistiques();
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde de la liste.');
    }
}

// Fonctions pour gérer la liste des étudiants
function ajouterEtudiant() {
    try {
        const matricule = document.getElementById('matricule-etudiant')?.value.trim();
        const nom = document.getElementById('nom-etudiant')?.value.trim();
        const filiere = document.getElementById('filiere-etudiant')?.value.trim();
        const niveau = document.getElementById('niveau-etudiant')?.value.trim();
        const telephone = document.getElementById('telephone-etudiant')?.value.trim();
        const email = document.getElementById('email-etudiant')?.value.trim();

        if (!matricule || !nom || !filiere || !niveau) {
            alert('Matricule, nom, filière et niveau sont obligatoires.');
            return;
        }

        // Vérifier unicité du matricule
        if (listeEtudiantsCourante.find(etu => etu.matricule === matricule)) {
            alert('Ce matricule existe déjà dans la liste.');
            return;
        }

        const etudiant = { matricule, nom, filiere, niveau, telephone: telephone || '', email: email || '' };
        listeEtudiantsCourante.push(etudiant);
        
        // Réinitialiser le formulaire
        ['matricule-etudiant', 'nom-etudiant', 'filiere-etudiant', 'niveau-etudiant', 'telephone-etudiant', 'email-etudiant']
            .forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = '';
            });
        
        afficherPreviewEtudiants();
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'étudiant:', error);
        alert('Erreur lors de l\'ajout de l\'étudiant.');
    }
}

function afficherPreviewEtudiants() {
    const preview = document.getElementById('liste-etudiants-preview');
    if (!preview) return;
    
    if (listeEtudiantsCourante.length === 0) {
        preview.innerHTML = '<p>Aucun étudiant ajouté.</p>';
        return;
    }
    
    preview.innerHTML = `
        <h4>Étudiants dans la liste (${listeEtudiantsCourante.length}) :</h4>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
            ${listeEtudiantsCourante.map((etu, index) => `
                <div style="background: #f8f9fa; margin: 5px 0; padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${etu.nom}</strong> (${etu.matricule})<br>
                        <small>${etu.filiere} - ${etu.niveau}${etu.telephone ? ' • ' + etu.telephone : ''}${etu.email ? ' • ' + etu.email : ''}</small>
                    </div>
                    <button onclick="supprimerEtudiant(${index})" class="btn-supprimer" style="margin: 0;">×</button>
                </div>
            `).join('')}
        </div>
    `;
}

function supprimerEtudiant(index) {
    try {
        listeEtudiantsCourante.splice(index, 1);
        afficherPreviewEtudiants();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'étudiant:', error);
    }
}

function sauvegarderListeEtudiants() {
    try {
        const nomListe = document.getElementById('nom-liste-etudiants')?.value.trim();
        
        if (!nomListe) {
            alert('Veuillez saisir un nom pour la liste.');
            return;
        }
        
        if (listeEtudiantsCourante.length === 0) {
            alert('Ajoutez au moins un étudiant à la liste.');
            return;
        }

        let documents = JSON.parse(localStorage.getItem('documents')) || [];
        
        if (documentEnModification) {
            // Mode modification
            const index = documentEnModification.index;
            documents[index] = {
                type: 'liste-etudiants',
                donnees: {
                    documentName: nomListe,
                    etudiants: [...listeEtudiantsCourante],
                    nombreEtudiants: listeEtudiantsCourante.length
                },
                dateAjout: documents[index].dateAjout
            };
            alert(`Liste "${nomListe}" modifiée avec ${listeEtudiantsCourante.length} étudiant(s) !`);
        } else {
            // Mode création
            documents.push({
                type: 'liste-etudiants',
                donnees: {
                    documentName: nomListe,
                    etudiants: [...listeEtudiantsCourante],
                    nombreEtudiants: listeEtudiantsCourante.length
                },
                dateAjout: new Date().toISOString()
            });
            alert(`Liste "${nomListe}" sauvegardée avec ${listeEtudiantsCourante.length} étudiant(s) !`);
        }

        localStorage.setItem('documents', JSON.stringify(documents));
        resetFormState();
        afficherDocumentsParCategories();
        mettreAJourStatistiques();
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde de la liste.');
    }
}

// Fonction pour ouvrir le document dans une modal
function ouvrirDocument(index) {
    try {
        const documents = JSON.parse(localStorage.getItem('documents')) || [];
        const doc = documents[index];
        
        if (!doc) {
            alert('Document introuvable.');
            return;
        }

        let contenuSpecifique = '';
        
        // Affichage spécial selon le type
        switch (doc.type) {
            case 'cv':
                contenuSpecifique = genererAffichageCV(doc);
                break;
            case 'document-administratif':
                contenuSpecifique = genererAffichageDocumentAdministratif(doc);
                break;
            case 'fiche-paie':
                contenuSpecifique = genererAffichageFichePaie(doc);
                break;
            case 'liste-employes':
                contenuSpecifique = genererAffichageListeEmployes(doc);
                break;
            case 'liste-etudiants':
                contenuSpecifique = genererAffichageListeEtudiants(doc);
                break;
            default:
                contenuSpecifique = genererAffichageStandard(doc);
        }

        // Créer une modal pour afficher le document
        const modal = document.createElement('div');
        modal.id = 'modal-document';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 2rem;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            position: relative;
            animation: slideUp 0.3s ease;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem;">
                <h2 style="margin: 0; color: #0f172a;">📄 Détail du document</h2>
                <button onclick="fermerModal()" style="
                    background: #ef4444;
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">×</button>
            </div>
            <div style="margin-bottom: 1rem;">
                <p><strong>Type:</strong> <span style="background: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem;">${doc.type}</span></p>
                <p><strong>Date d'ajout:</strong> ${new Date(doc.dateAjout).toLocaleDateString('fr-FR')}</p>
            </div>
            ${contenuSpecifique}
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Ajouter les styles d'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Fermer la modal en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fermerModal();
            }
        });

        // Fermer avec la touche Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                fermerModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
    } catch (error) {
        console.error('Erreur lors de l\'ouverture du document:', error);
        alert('Erreur lors de l\'ouverture du document.');
    }
}

// Fonction pour fermer la modal
function fermerModal() {
    const modal = document.getElementById('modal-document');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Fonctions d'affichage des documents
function genererAffichageCV(doc) {
    return `
        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #007bff;">
            <h3>📋 Informations personnelles</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div><strong>Nom complet:</strong> ${doc.donnees.nom || ''} ${doc.donnees.prenom || ''}</div>
                <div><strong>Date de naissance:</strong> ${doc.donnees.dateNaissance ? new Date(doc.donnees.dateNaissance).toLocaleDateString('fr-FR') : 'Non spécifiée'}</div>
                <div><strong>Nationalité:</strong> ${doc.donnees.nationalite || 'Non spécifiée'}</div>
                <div><strong>Téléphone:</strong> ${doc.donnees.telephone || 'Non spécifié'}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <strong>📧 Email:</strong> <a href="mailto:${doc.donnees.email || ''}" style="color: #007bff;">${doc.donnees.email || 'Non spécifié'}</a>
            </div>
            <div style="margin-bottom: 20px;">
                <strong>🎯 Profession:</strong> ${doc.donnees.profession || 'Non spécifiée'}
            </div>
        </div>
    `;
}

function genererAffichageDocumentAdministratif(doc) {
    return `
        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #28a745;">
            <h3>📋 Informations du document</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div><strong>Type:</strong> ${doc.donnees.typeDocument || 'Non spécifié'}</div>
                <div><strong>Titulaire:</strong> ${doc.donnees.nomTitulaire || ''} ${doc.donnees.prenomTitulaire || ''}</div>
            </div>
        </div>
    `;
}

function genererAffichageFichePaie(doc) {
    return `
        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; border-left: 4px solid #17a2b8;">
            <h3>💼 Informations de l'employé</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div><strong>Nom complet:</strong> ${doc.donnees.nomEmploye || ''} ${doc.donnees.prenomEmploye || ''}</div>
                <div><strong>Salaire de base:</strong> ${Number(doc.donnees.salaireBase || 0).toLocaleString('fr-FR')} FCFA</div>
            </div>
        </div>
    `;
}

function genererAffichageListeEmployes(doc) {
    return `
        <h3>👥 Liste des employés (${doc.donnees.employes?.length || 0})</h3>
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; border-radius: 10px; background: #fff;">
            ${doc.donnees.employes?.map((emp, index) => `
                <div style="background: #f8f9fa; margin: 8px 0; padding: 15px; border-radius: 8px;">
                    <strong>${emp.nom || 'Nom non spécifié'}</strong> (${emp.matricule || 'Non spécifié'})<br>
                    <small>📞 ${emp.telephone || 'Tél. non spécifié'} • 📧 ${emp.email || 'Email non spécifié'}</small>
                </div>
            `).join('') || '<p style="text-align: center; color: #6b7280;">Aucun employé dans cette liste.</p>'}
        </div>
    `;
}

function genererAffichageListeEtudiants(doc) {
    return `
        <h3>🎓 Liste des étudiants (${doc.donnees.etudiants?.length || 0})</h3>
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; border-radius: 10px; background: #fff;">
            ${doc.donnees.etudiants?.map((etu, index) => `
                <div style="background: #f8f9fa; margin: 8px 0; padding: 15px; border-radius: 8px;">
                    <strong>${etu.nom || 'Nom non spécifié'}</strong> (${etu.matricule || 'Non spécifié'})<br>
                    <small>${etu.filiere || 'Filière non spécifiée'} - ${etu.niveau || 'Niveau non spécifié'}</small>
                </div>
            `).join('') || '<p style="text-align: center; color: #6b7280;">Aucun étudiant dans cette liste.</p>'}
        </div>
    `;
}

function genererAffichageStandard(doc) {
    return `
        <h3>Données:</h3>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
            ${Object.entries(doc.donnees || {}).map(([key, value]) => 
                typeof value === 'string' && value.startsWith('data:') ? 
                `<p><strong>${key}:</strong> <button onclick="afficherFichier('${value}')" class="btn-primary" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">Voir Fichier</button></p>` :
                `<p><strong>${key}:</strong> ${value || 'Non spécifié'}</p>`
            ).join('')}
        </div>
    `;
}

// Fonction pour afficher un fichier
function afficherFichier(base64) {
    try {
        const w = window.open();
        if (w) {
            w.document.write(`<html><head><title>Fichier</title></head><body style="margin:0;"><iframe src="${base64}" style="width:100%;height:100%;border:none;"></iframe></body></html>`);
        } else {
            alert("Veuillez autoriser les pop-ups pour voir le fichier.");
        }
    } catch (error) {
        console.error('Erreur lors de l\'affichage du fichier:', error);
        alert('Erreur lors de l\'affichage du fichier.');
    }
}

// Fonction de recherche
function rechercherDocuments() {
    try {
        const champRecherche = document.getElementById('champ-recherche');
        const filtreCategorie = document.getElementById('filtre-categorie');
        const resultatsContainer = document.getElementById('resultats-recherche');
        
        if (!champRecherche || !filtreCategorie || !resultatsContainer) return;
        
        const motCle = champRecherche.value.trim();
        const categorieFiltre = filtreCategorie.value;
        const documents = JSON.parse(localStorage.getItem('documents')) || [];

        if (!motCle && !categorieFiltre) {
            resultatsContainer.innerHTML = '<p>Entrez un mot-clé ou sélectionnez une catégorie.</p>';
            return;
        }

        let resultats = documents.map((doc, index) => ({...doc, index}))
            .filter(doc => !categorieFiltre || doc.type === categorieFiltre)
            .filter(doc => {
                if (!motCle) return true;
                
                const searchText = [
                    doc.type, 
                    doc.donnees?.documentName || '',
                    ...Object.values(doc.donnees || {}).filter(val => typeof val === 'string' && !val.startsWith('data:'))
                ].filter(Boolean).join(' ').toLowerCase();
                
                return searchText.includes(motCle.toLowerCase());
            });

        resultatsContainer.innerHTML = resultats.length === 0 ? '<p>Aucun document trouvé.</p>' :
            `<h3>Résultats (${resultats.length})</h3><ul style="list-style: none; padding: 0;">
                ${resultats.map(doc => `
                    <li onclick="ouvrirDocument(${doc.index})" style="cursor:pointer; background: #f8f9fa; margin-bottom: 0.5rem; padding: 1rem; border-radius: 8px;">
                        <strong>${doc.donnees?.documentName || `${doc.type} - ${doc.index + 1}`}</strong> 
                        <span style="color: #6c757d;">(${doc.type})</span><br>
                        <small style="color: #6c757d;">Ajouté le ${new Date(doc.dateAjout).toLocaleDateString()}</small>
                    </li>
                `).join('')}
            </ul>`;
            
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
    }
}

// Fonction pour modifier un document
function modifierDocument(index) {
    try {
        const documents = JSON.parse(localStorage.getItem('documents')) || [];
        const document = documents[index];
        
        if (!document) {
            alert('Document introuvable.');
            return;
        }

        // Définir le mode modification
        documentEnModification = { ...document, index };
        
        // Pré-charger les données selon le type
        if (document.type === 'liste-employes') {
            listeEmployesCourante = [...(document.donnees.employes || [])];
        } else if (document.type === 'liste-etudiants') {
            listeEtudiantsCourante = [...(document.donnees.etudiants || [])];
        }
        
        // Afficher le formulaire approprié
        const typeContainer = document.getElementById('type-document-container');
        const typeDocSelect = document.getElementById('type-document');
        
        if (typeContainer) typeContainer.classList.remove('hidden');
        if (typeDocSelect) {
            typeDocSelect.value = document.type;
            gererChangementTypeDocument(document.type);
        }
        
        // Pré-remplir le nom de la liste si applicable
        if (document.type === 'liste-employes') {
            setTimeout(() => {
                const nomListeInput = document.getElementById('nom-liste-employes');
                if (nomListeInput) nomListeInput.value = document.donnees.documentName || '';
                afficherPreviewEmployes();
            }, 200);
        } else if (document.type === 'liste-etudiants') {
            setTimeout(() => {
                const nomListeInput = document.getElementById('nom-liste-etudiants');
                if (nomListeInput) nomListeInput.value = document.donnees.documentName || '';
                afficherPreviewEtudiants();
            }, 200);
        }
        
        // Naviguer vers la section documents
        afficherSection('documents');
        
    } catch (error) {
        console.error('Erreur lors de la modification:', error);
        alert('Erreur lors de la modification du document.');
    }
}

// Fonctions utilitaires
function afficherDocumentsParCategories() {
    try {
        const documents = JSON.parse(localStorage.getItem('documents')) || [];
        const documentsParType = {
            'cv': [], 'document-administratif': [], 'fiche-paie': [], 
            'liste-employes': [], 'liste-etudiants': []
        };

        documents.forEach((doc, index) => {
            if (documentsParType[doc.type]) {
                documentsParType[doc.type].push({...doc, index});
            }
        });

        Object.keys(documentsParType).forEach(type => {
            const folderContent = document.getElementById(`folder-${type}`);
            const documentCount = document.getElementById(`count-${type}`);
            const docs = documentsParType[type];

            if (documentCount) documentCount.textContent = docs.length;
            if (folderContent) {
                folderContent.innerHTML = docs.length === 0 ? 
                    '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun document dans cette catégorie</p>' :
                    docs.sort((a, b) => new Date(b.dateAjout) - new Date(a.dateAjout))
                        .map(doc => creerElementDocument(doc, type).outerHTML).join('');
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'affichage des documents:', error);
    }
}

function creerElementDocument(doc, type) {
    const div = document.createElement('div');
    div.className = 'document-item';
    const nomDocument = doc.donnees.documentName || `${type} - ${doc.index + 1}`;
    const dateFormatee = new Date(doc.dateAjout).toLocaleDateString('fr-FR');
    
    const infosMap = {
        'cv': `${doc.donnees.nom || ''} ${doc.donnees.prenom || ''} - ${doc.donnees.profession || 'Profession non spécifiée'}`,
        'document-administratif': `${doc.donnees.typeDocument || 'Document'} - ${doc.donnees.nomTitulaire || ''} ${doc.donnees.prenomTitulaire || ''}`,
        'fiche-paie': `${doc.donnees.nomEmploye || ''} ${doc.donnees.prenomEmploye || ''} - ${doc.donnees.moisPaie || ''} (${Number(doc.donnees.salaireNet || 0).toLocaleString('fr-FR')} FCFA)`,
        'liste-employes': `${doc.donnees.nombreEmployes || doc.donnees.employes?.length || 0} employé(s)`,
        'liste-etudiants': `${doc.donnees.nombreEtudiants || doc.donnees.etudiants?.length || 0} étudiant(s)`
    };

    div.innerHTML = `
        <div class="document-info">
            <div><strong>${nomDocument}</strong></div>
            <div style="color: #6c757d; font-size: 0.9rem;">${infosMap[type]}</div>
            <div class="date">Ajouté le ${dateFormatee}</div>
        </div>
        <div class="document-actions">
            <button onclick="ouvrirDocument(${doc.index})" class="btn-primary" style="font-size: 0.85rem; padding: 0.4rem 0.8rem; margin: 0;">Voir</button>
            <button onclick="modifierDocument(${doc.index})" class="btn-primary" style="font-size: 0.85rem; padding: 0.4rem 0.8rem; margin: 0;">Modifier</button>
            <button onclick="supprimerDocument(${doc.index})" class="btn-supprimer" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">Supprimer</button>
        </div>
    `;
    return div;
}

// Fonctions pour les dossiers
function toggleFolder(type) {
    const folderContent = document.getElementById(`folder-${type}`);
    const toggleButton = document.querySelector(`[onclick="toggleFolder('${type}')"]`);
    if (folderContent && toggleButton) {
        folderContent.classList.toggle('open');
        toggleButton.classList.toggle('open');
    }
}

function supprimerDocument(index) {
    if (confirm('Voulez-vous vraiment supprimer ce document ?')) {
        try {
            let documents = JSON.parse(localStorage.getItem('documents')) || [];
            documents.splice(index, 1);
            localStorage.setItem('documents', JSON.stringify(documents));
            afficherDocumentsParCategories();
            mettreAJourStatistiques();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du document.');
        }
    }
}

function mettreAJourStatistiques() {
    try {
        const documents = JSON.parse(localStorage.getItem('documents')) || [];
        const stats = {
            total: documents.length,
            cv: documents.filter(d => d.type === 'cv').length,
            admin: documents.filter(d => d.type === 'document-administratif').length,
            paie: documents.filter(d => d.type === 'fiche-paie').length,
            employes: documents.filter(d => d.type === 'liste-employes').length,
            etudiants: documents.filter(d => d.type === 'liste-etudiants').length
        };
        
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key === 'total' ? 'total-documents' : `stat-${key}`);
            if (element) element.textContent = value;
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques:', error);
    }
}

function exporterDonnees() {
    try {
        const documents = JSON.parse(localStorage.getItem('documents')) || [];
        const dataBlob = new Blob([JSON.stringify(documents, null, 2)], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dark_documents_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        alert('Données exportées !');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des données.');
    }
}

function confirmerSuppression() {
    if (confirm('⚠️ ATTENTION : Supprimer tous les documents ?') && 
        confirm('Action irréversible. Confirmer ?')) {
        try {
            localStorage.removeItem('documents');
            afficherDocumentsParCategories();
            mettreAJourStatistiques();
            alert('Données supprimées.');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression des données.');
        }
    }
}

// Fonctions de tri/filtrage (à implémenter selon besoins)
function filtrerParDates() {
    alert("Filtrage par dates à implémenter selon besoins.");
}

function resetFiltreDates() {
    ['date-debut', 'date-fin'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    afficherDocumentsParCategories();
}

// Fonction utilitaire pour lire un fichier en base64
function lireFichierBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}