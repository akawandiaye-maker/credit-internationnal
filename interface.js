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
        afficherInterfaceConnectee();
        afficherSection('tableau-de-bord');
    } else {
        masquerInterfaceConnectee();
        afficherSection('dashboard'); // Page d'accueil
    }
}

function afficherInterfaceConnectee() {
    const sidebar = document.getElementById('sidebar');
    const globalSearch = document.getElementById('global-search-container');
    const footer = document.getElementById('app-footer');
    const body = document.body;
    
    if (sidebar) sidebar.classList.remove('hidden');
    if (globalSearch) globalSearch.classList.remove('hidden');
    if (footer) footer.classList.remove('hidden');
    if (body) body.classList.add('sidebar-open');
}

function masquerInterfaceConnectee() {
    const sidebar = document.getElementById('sidebar');
    const globalSearch = document.getElementById('global-search-container');
    const footer = document.getElementById('app-footer');
    const body = document.body;
    
    if (sidebar) sidebar.classList.add('hidden');
    if (globalSearch) globalSearch.classList.add('hidden');
    if (footer) footer.classList.add('hidden');
    if (body) body.classList.remove('sidebar-open');
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
        setupClientsModule();
        
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
            let targetId = btn.id.replace('btn-', '');
            
            // Gérer le bouton tableau de bord
            if (targetId === 'dashboard') {
                afficherSection('tableau-de-bord');
                return;
            }
            
            // Gérer les boutons de service
            if (targetId.startsWith('service-')) {
                const serviceId = targetId.replace('service-', '');
                // Le service "Compte" redirige vers la section "Comptes"
                if (serviceId === 'compte') {
                    afficherSection('clients');
                    showCompteSelection();
                    return;
                }
                afficherSection('services');
                setTimeout(() => afficherService(serviceId), 100);
                return;
            }
            
            // Sections nécessitant une authentification
            const sectionsProtegees = ['documents', 'recherche', 'parametres', 'utilisateurs', 'clients', 'dossiers', 'profil', 'services', 'tableau-de-bord'];
            
            if (sectionsProtegees.includes(targetId) && !utilisateurConnecte) {
                afficherAccesRestreint();
                return;
            }

            afficherSection(targetId);
            
            // Réinitialiser l'affichage des comptes à la sélection
            if (targetId === 'clients') {
                showCompteSelection();
            }
            
            // Réinitialiser l'affichage des services à la sélection
            if (targetId === 'services') {
                showServiceSelection();
            }
        });
    });
    
    // Clic sur le logo pour revenir au tableau de bord ou à l'accueil
    const logoHeader = document.getElementById('logo-header');
    if (logoHeader) {
        logoHeader.addEventListener('click', () => {
            if (utilisateurConnecte) {
                afficherSection('tableau-de-bord');
            } else {
                afficherSection('dashboard');
            }
        });
    }
    
    // Bouton retour service
    const btnBackService = document.getElementById('btn-back-service');
    if (btnBackService) {
        btnBackService.addEventListener('click', () => {
            showServiceSelection();
        });
    }
}

// Configuration de l'authentification
function setupAuthentication() {
    // Boutons de redirection vers connexion/inscription
    const btnsVersConnexion = ['btn-commencer', 'ajouter-document', 'btn-connexion-restreint', 'btn-connexion'];
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
                // Stocker la dernière connexion avant de mettre à jour
                localStorage.setItem('derniereConnexion', new Date().toISOString());
                localStorage.setItem('utilisateurConnecte', JSON.stringify(user));
                mettreAJourInfoUtilisateur(user);
                afficherInterfaceConnectee();
                afficherSection('tableau-de-bord');
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
            masquerInterfaceConnectee();
            afficherSection('dashboard'); // Retour à la page d'accueil
            alert('Déconnexion réussie.');
        });
    }
    
    // Formulaire de gestion des utilisateurs (Admin)
    setupGestionUtilisateurs();
    
    // Formulaire de changement de mot de passe (Profil)
    setupChangementMotDePasse();
}

// Variable globale pour l'utilisateur en modification
let utilisateurEnModification = null;

// Configuration de la gestion des utilisateurs
function setupGestionUtilisateurs() {
    const formUtilisateur = document.getElementById('form-utilisateur');
    
    if (formUtilisateur) {
        // Réinitialiser le formulaire quand on clique sur "Réinitialiser"
        formUtilisateur.addEventListener('reset', () => {
            utilisateurEnModification = null;
            const submitBtn = formUtilisateur.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = '💾 Enregistrer';
            const motDePasseInput = document.getElementById('input-mot-de-passe') || formUtilisateur.querySelector('input[name="motDePasse"]');
            if (motDePasseInput) {
                motDePasseInput.required = true;
                motDePasseInput.placeholder = 'Mot de passe';
            }
        });
        
        formUtilisateur.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(formUtilisateur);
            const userData = Object.fromEntries(formData);
            
            // Vérifier que l'email n'est pas déjà utilisé (sauf en modification)
            let utilisateurs = JSON.parse(localStorage.getItem('utilisateurs') || '[]');
            const emailExistant = utilisateurs.find(u => u.email === userData.email && (!utilisateurEnModification || u.id !== utilisateurEnModification.id));
            
            if (emailExistant) {
                alert('❌ Un utilisateur avec cet email existe déjà.');
                return;
            }
            
            if (utilisateurEnModification) {
                // Mode modification
                const index = utilisateurs.findIndex(u => u.id === utilisateurEnModification.id);
                if (index !== -1) {
                    // Si le mot de passe n'est pas renseigné, garder l'ancien
                    if (!userData.motDePasse || userData.motDePasse.trim() === '') {
                        delete userData.motDePasse;
                    }
                    
                    utilisateurs[index] = {
                        ...utilisateurs[index],
                        ...userData,
                        id: utilisateurEnModification.id
                    };
                    localStorage.setItem('utilisateurs', JSON.stringify(utilisateurs));
                    alert('✅ Utilisateur modifié avec succès !');
                    utilisateurEnModification = null;
                    formUtilisateur.reset();
                    const submitBtn = formUtilisateur.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.textContent = '💾 Enregistrer';
                    const motDePasseInput = document.getElementById('input-mot-de-passe') || formUtilisateur.querySelector('input[name="motDePasse"]');
                    if (motDePasseInput) {
                        motDePasseInput.required = true;
                        motDePasseInput.placeholder = 'Mot de passe';
                    }
                }
            } else {
                // Mode création
                const nouvelUtilisateur = {
                    id: cryptoRandomId(),
                    ...userData
                };
                utilisateurs.push(nouvelUtilisateur);
                localStorage.setItem('utilisateurs', JSON.stringify(utilisateurs));
                alert('✅ Utilisateur créé avec succès !');
                formUtilisateur.reset();
            }
            
            afficherUtilisateurs();
        });
    }
    
    // Fonction pour afficher les utilisateurs dans le tableau
    window.afficherUtilisateurs = function() {
        const tbody = document.querySelector('#table-utilisateurs tbody');
        if (!tbody) return;
        
        const utilisateurs = JSON.parse(localStorage.getItem('utilisateurs') || '[]');
        
        if (utilisateurs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6c757d; font-style: italic;">Aucun utilisateur enregistré</td></tr>';
            return;
        }
        
        const getRoleName = (role) => {
            const roles = {
                'admin': '👑 Administrateur',
                'agent': '👤 Agent',
                'consultation': '👁️ Consultation'
            };
            return roles[role] || role;
        };
        
        tbody.innerHTML = utilisateurs.map(user => {
            const nomComplet = `${user.nom || ''} ${user.prenom || ''}`.trim() || user.email;
            return `
                <tr>
                    <td>${nomComplet}</td>
                    <td>${user.email || '-'}</td>
                    <td>${getRoleName(user.role)}</td>
                    <td>
                        <button class="btn-secondary" onclick='modifierUtilisateur("${user.id}")' style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-right: 0.5rem;">✏️ Modifier</button>
                        <button class="btn-supprimer" onclick='supprimerUtilisateur("${user.id}")' style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">🗑️ Supprimer</button>
                    </td>
                </tr>
            `;
        }).join('');
    };
    
    // Fonction pour modifier un utilisateur
    window.modifierUtilisateur = function(userId) {
        const utilisateurs = JSON.parse(localStorage.getItem('utilisateurs') || '[]');
        const user = utilisateurs.find(u => u.id === userId);
        
        if (!user) {
            alert('Utilisateur introuvable');
            return;
        }
        
        utilisateurEnModification = user;
        const form = document.getElementById('form-utilisateur');
        
        if (form) {
            form.nom.value = user.nom || '';
            form.prenom.value = user.prenom || '';
            form.email.value = user.email || '';
            form.role.value = user.role || '';
            form.organisation.value = user.organisation || '';
            const motDePasseInput = document.getElementById('input-mot-de-passe') || form.motDePasse;
            if (motDePasseInput) {
                motDePasseInput.value = ''; // Ne pas afficher le mot de passe
                motDePasseInput.required = false; // Rendre le mot de passe optionnel en modification
                motDePasseInput.placeholder = 'Laisser vide pour conserver le mot de passe actuel';
            }
            
            // Scroll vers le formulaire
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Changer le texte du bouton
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = '✏️ Modifier l\'utilisateur';
        }
    };
    
    // Fonction pour supprimer un utilisateur
    window.supprimerUtilisateur = function(userId) {
        const utilisateurs = JSON.parse(localStorage.getItem('utilisateurs') || '[]');
        const user = utilisateurs.find(u => u.id === userId);
        
        if (!user) {
            alert('Utilisateur introuvable');
            return;
        }
        
        // Empêcher la suppression de son propre compte
        const userConnecte = JSON.parse(localStorage.getItem('utilisateurConnecte'));
        if (userConnecte && userConnecte.id === userId) {
            alert('❌ Vous ne pouvez pas supprimer votre propre compte.');
            return;
        }
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.nom || user.email}" ?`)) {
            return;
        }
        
        const index = utilisateurs.findIndex(u => u.id === userId);
        if (index !== -1) {
            utilisateurs.splice(index, 1);
            localStorage.setItem('utilisateurs', JSON.stringify(utilisateurs));
            alert('✅ Utilisateur supprimé avec succès !');
            afficherUtilisateurs();
        }
    };
    
    // Afficher les utilisateurs au chargement
    if (document.getElementById('utilisateurs')) {
        afficherUtilisateurs();
    }
}

// Configuration du changement de mot de passe (Profil)
function setupChangementMotDePasse() {
    const formChangerMotDePasse = document.getElementById('form-changer-mot-de-passe');
    
    if (formChangerMotDePasse) {
        formChangerMotDePasse.addEventListener('submit', (e) => {
            e.preventDefault();
            const ancienMdp = document.getElementById('ancien-mot-de-passe').value;
            const nouveauMdp = document.getElementById('nouveau-mot-de-passe-profil').value;
            const confirmerMdp = document.getElementById('confirmer-mot-de-passe-profil').value;
            
            // Vérifier que les nouveaux mots de passe correspondent
            if (nouveauMdp !== confirmerMdp) {
                alert('❌ Les nouveaux mots de passe ne correspondent pas.');
                return;
            }
            
            // Vérifier la longueur du nouveau mot de passe
            if (nouveauMdp.length < 6) {
                alert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères.');
                return;
            }
            
            // Vérifier l'ancien mot de passe
            const userConnecte = JSON.parse(localStorage.getItem('utilisateurConnecte'));
            if (!userConnecte) {
                alert('❌ Vous devez être connecté pour changer votre mot de passe.');
                return;
            }
            
            let utilisateurs = JSON.parse(localStorage.getItem('utilisateurs') || '[]');
            const userIndex = utilisateurs.findIndex(u => u.id === userConnecte.id);
            
            if (userIndex === -1) {
                alert('❌ Utilisateur introuvable.');
                return;
            }
            
            // Vérifier l'ancien mot de passe
            if (utilisateurs[userIndex].motDePasse !== ancienMdp) {
                alert('❌ L\'ancien mot de passe est incorrect.');
                return;
            }
            
            // Mettre à jour le mot de passe
            utilisateurs[userIndex].motDePasse = nouveauMdp;
            localStorage.setItem('utilisateurs', JSON.stringify(utilisateurs));
            
            // Mettre à jour l'utilisateur connecté
            userConnecte.motDePasse = nouveauMdp;
            localStorage.setItem('utilisateurConnecte', JSON.stringify(userConnecte));
            
            alert('✅ Mot de passe modifié avec succès !');
            formChangerMotDePasse.reset();
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
                // Pré-remplir le service si on est dans un service
                if (currentService) {
                    const selectService = document.getElementById('select-service');
                    if (selectService) selectService.value = currentService;
                    mettreAJourDossiers();
                }
            }
        });
    }

    // Gestionnaire pour le sélecteur de service
    const selectService = document.getElementById('select-service');
    if (selectService) {
        selectService.addEventListener('change', function() {
            mettreAJourDossiers();
        });
    }

    // Gestionnaire pour le sélecteur de dossier
    const selectDossier = document.getElementById('dossier-principal');
    if (selectDossier) {
        selectDossier.addEventListener('change', function() {
            mettreAJourSousDossiers();
            verifierAffichageFormulaireUpload();
        });
    }
    
    // Gestionnaire pour le sélecteur de sous-dossier
    const selectSousDossier = document.getElementById('sous-dossier');
    if (selectSousDossier) {
        selectSousDossier.addEventListener('change', function() {
            verifierAffichageFormulaireUpload();
        });
    }
    
    // Gestionnaire pour le formulaire de téléversement direct
    const formUploadDirect = document.getElementById('form-upload-direct');
    if (formUploadDirect) {
        formUploadDirect.addEventListener('submit', function(e) {
            e.preventDefault();
            enregistrerDocumentUpload();
        });
    }
}

// Mettre à jour les dossiers selon le service sélectionné
function mettreAJourDossiers() {
    const selectService = document.getElementById('select-service');
    const selectDossier = document.getElementById('dossier-principal');
    const selectSousDossier = document.getElementById('sous-dossier');
    
    if (!selectService || !selectDossier) return;
    
    const serviceId = selectService.value;
    const service = structureServices[serviceId];
    
    selectDossier.innerHTML = '<option value="">-- Sélectionnez un dossier --</option>';
    if (selectSousDossier) {
        selectSousDossier.innerHTML = '<option value="">-- Sélectionnez d\'abord un dossier --</option>';
    }
    
    // Masquer le formulaire de téléversement lors du changement de service
    const formulaireUpload = document.getElementById('formulaire-upload-direct');
    if (formulaireUpload) {
        formulaireUpload.classList.add('hidden');
    }
    
    if (service && service.dossiers) {
        service.dossiers.forEach(dossier => {
            selectDossier.innerHTML += `<option value="${dossier.id}">${dossier.nom}</option>`;
        });
    }
}

// Mettre à jour les sous-dossiers selon le dossier sélectionné
function mettreAJourSousDossiers() {
    const selectService = document.getElementById('select-service');
    const selectDossier = document.getElementById('dossier-principal');
    const selectSousDossier = document.getElementById('sous-dossier');
    
    if (!selectService || !selectDossier || !selectSousDossier) return;
    
    const serviceId = selectService.value;
    const dossierId = selectDossier.value;
    const service = structureServices[serviceId];
    
    selectSousDossier.innerHTML = '<option value="">-- Sélectionnez un sous-dossier --</option>';
    
    if (service && service.dossiers) {
        const dossier = service.dossiers.find(d => d.id === dossierId);
        if (dossier && dossier.sousDossiers && dossier.sousDossiers.length > 0) {
            dossier.sousDossiers.forEach(sousDossier => {
                selectSousDossier.innerHTML += `<option value="${sousDossier.id}">${sousDossier.nom}</option>`;
            });
        } else {
            selectSousDossier.innerHTML = '<option value="">Aucun sous-dossier</option>';
        }
    }
    
    // Vérifier si on peut afficher le formulaire de téléversement
    verifierAffichageFormulaireUpload();
}

// Vérifier si on peut afficher le formulaire de téléversement
function verifierAffichageFormulaireUpload() {
    const selectService = document.getElementById('select-service');
    const selectDossier = document.getElementById('dossier-principal');
    const selectSousDossier = document.getElementById('sous-dossier');
    const formulaireUpload = document.getElementById('formulaire-upload-direct');
    
    if (!selectService || !selectDossier || !formulaireUpload) return;
    
    const serviceId = selectService.value;
    const dossierId = selectDossier.value;
    const sousDossierId = selectSousDossier ? selectSousDossier.value : '';
    
    // Afficher le formulaire si service et dossier sont sélectionnés
    // Si le dossier a des sous-dossiers, attendre la sélection du sous-dossier
    if (serviceId && dossierId) {
        const service = structureServices[serviceId];
        const dossier = service?.dossiers?.find(d => d.id === dossierId);
        
        if (dossier) {
            // Si le dossier a des sous-dossiers, attendre la sélection
            if (dossier.sousDossiers && dossier.sousDossiers.length > 0) {
                if (sousDossierId) {
                    formulaireUpload.classList.remove('hidden');
                } else {
                    formulaireUpload.classList.add('hidden');
                }
            } else {
                // Pas de sous-dossier, afficher directement
                formulaireUpload.classList.remove('hidden');
            }
        }
    } else {
        formulaireUpload.classList.add('hidden');
    }
}

// Générer automatiquement un numéro de document unique
function genererNumeroDocument(serviceId, dossierId, sousDossierId, documents) {
    const annee = new Date().getFullYear();
    
    // Filtrer les documents du même service, dossier et sous-dossier
    const documentsFiltres = documents.filter(doc => 
        doc.service === serviceId && 
        doc.dossier === dossierId && 
        (sousDossierId ? doc.sousDossier === sousDossierId : !doc.sousDossier)
    );
    
    // Compter les documents existants pour cette combinaison
    const count = documentsFiltres.length + 1;
    
    // Format : YYYY-XXX où XXX est le numéro séquentiel
    return `${annee}-${String(count).padStart(3, '0')}`;
}

// Enregistrer un document téléversé
function enregistrerDocumentUpload() {
    try {
        const selectService = document.getElementById('select-service');
        const selectDossier = document.getElementById('dossier-principal');
        const selectSousDossier = document.getElementById('sous-dossier');
        const titreInput = document.getElementById('titre-document');
        const clientInput = document.getElementById('client-document');
        const fichierInput = document.getElementById('fichier-document');
        
        if (!selectService || !selectDossier || !titreInput || !fichierInput) {
            alert('Erreur : certains champs sont manquants');
            return;
        }
        
        const serviceId = selectService.value;
        const dossierId = selectDossier.value;
        const sousDossierId = selectSousDossier ? selectSousDossier.value : null;
        const titre = titreInput.value.trim();
        const client = clientInput ? clientInput.value.trim() : '';
        const fichier = fichierInput.files[0];
        
        if (!serviceId || !dossierId || !titre || !fichier) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }
        
        // Vérifier la taille du fichier (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (fichier.size > maxSize) {
            alert('Le fichier est trop volumineux. Taille maximale : 10MB');
            return;
        }
        
        // Lire le fichier et le convertir en base64
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const base64Content = e.target.result;
                const documents = JSON.parse(localStorage.getItem('documents') || '[]');
                
                // Générer automatiquement un numéro de document unique
                const docNumero = genererNumeroDocument(serviceId, dossierId, sousDossierId, documents);
                
                // Créer l'objet document
                const nouveauDocument = {
                    id: cryptoRandomId(),
                    service: serviceId,
                    dossier: dossierId,
                    sousDossier: sousDossierId || null,
                    type: 'document-generique',
                    donnees: {
                        titre: titre,
                        client: client || '',
                        numero: docNumero,
                        fichier: base64Content,
                        nomFichier: fichier.name,
                        typeFichier: fichier.type,
                        tailleFichier: fichier.size
                    },
                    dateAjout: new Date().toISOString()
                };
                
                documents.push(nouveauDocument);
                localStorage.setItem('documents', JSON.stringify(documents));
                
                alert('✅ Document enregistré avec succès !');
                
                // Réinitialiser le formulaire
                resetFormUpload();
                
                // Rafraîchir l'affichage si on est dans un service
                if (currentService === serviceId) {
                    afficherDocumentsParService(serviceId);
                }
                
                // Mettre à jour les statistiques
                mettreAJourStatistiques();
                
            } catch (error) {
                console.error('Erreur lors de l\'enregistrement:', error);
                alert('Erreur lors de l\'enregistrement du document');
            }
        };
        
        reader.onerror = function() {
            alert('Erreur lors de la lecture du fichier');
        };
        
        reader.readAsDataURL(fichier);
        
    } catch (error) {
        console.error('Erreur lors du téléversement:', error);
        alert('Erreur lors du téléversement du document');
    }
}

// Réinitialiser le formulaire de téléversement
function resetFormUpload() {
    const formulaireUpload = document.getElementById('formulaire-upload-direct');
    const form = document.getElementById('form-upload-direct');
    
    if (form) {
        form.reset();
    }
    
    if (formulaireUpload) {
        formulaireUpload.classList.add('hidden');
    }
    
    // Réinitialiser aussi les sélecteurs
    const selectService = document.getElementById('select-service');
    const selectDossier = document.getElementById('dossier-principal');
    const selectSousDossier = document.getElementById('sous-dossier');
    const typeContainer = document.getElementById('type-document-container');
    
    if (selectService) selectService.value = '';
    if (selectDossier) selectDossier.innerHTML = '<option value="">-- Sélectionnez un dossier --</option>';
    if (selectSousDossier) selectSousDossier.innerHTML = '<option value="">-- Sélectionnez d\'abord un dossier --</option>';
    if (typeContainer) typeContainer.classList.add('hidden');
}

// Configuration de la recherche
function setupSearch() {
    const champRecherche = document.getElementById('champ-recherche');
    const rechercheDate = document.getElementById('recherche-date');
    const rechercheNumero = document.getElementById('recherche-numero');
    const filtreService = document.getElementById('filtre-service');
    const filtreDossier = document.getElementById('filtre-dossier');
    const filtreSousDossier = document.getElementById('filtre-sous-dossier');
    
    // Recherche globale dans le header
    const globalSearch = document.getElementById('global-search');
    const btnGlobalSearch = document.getElementById('btn-global-search');
    
    if (globalSearch) {
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                rechercherGlobalement();
            }
        });
    }
    
    if (btnGlobalSearch) {
        btnGlobalSearch.addEventListener('click', rechercherGlobalement);
    }
    
    if (champRecherche) {
        ['input', 'change'].forEach(event => {
            champRecherche.addEventListener(event, rechercherDocuments);
        });
    }
    
    if (rechercheDate) {
        rechercheDate.addEventListener('change', rechercherDocuments);
    }
    
    if (rechercheNumero) {
        rechercheNumero.addEventListener('input', rechercherDocuments);
    }
    
    // Gestionnaire pour le filtre service dans la recherche
    if (filtreService) {
        filtreService.addEventListener('change', function() {
            mettreAJourDossiersRecherche();
            rechercherDocuments();
        });
    }
    
    // Gestionnaire pour le filtre dossier dans la recherche
    if (filtreDossier) {
        filtreDossier.addEventListener('change', function() {
            mettreAJourSousDossiersRecherche();
            rechercherDocuments();
        });
    }
    
    if (filtreSousDossier) {
        filtreSousDossier.addEventListener('change', rechercherDocuments);
    }
}

// Fonction pour la recherche globale depuis le header
function rechercherGlobalement() {
    const globalSearch = document.getElementById('global-search');
    if (!globalSearch) return;
    
    const motCle = globalSearch.value.trim();
    if (!motCle) {
        alert('Veuillez entrer un terme de recherche');
        return;
    }
    
    // Naviguer vers la page de recherche avancée
    afficherSection('recherche');
    
    // Pré-remplir le champ de recherche
    setTimeout(() => {
        const champRecherche = document.getElementById('champ-recherche');
        if (champRecherche) {
            champRecherche.value = motCle;
            rechercherDocuments();
        }
    }, 100);
}

// Mettre à jour les dossiers dans la recherche selon le service sélectionné
function mettreAJourDossiersRecherche() {
    const filtreService = document.getElementById('filtre-service');
    const filtreDossier = document.getElementById('filtre-dossier');
    const filtreSousDossier = document.getElementById('filtre-sous-dossier');
    
    if (!filtreService || !filtreDossier) return;
    
    const serviceId = filtreService.value;
    const service = structureServices[serviceId];
    
    filtreDossier.innerHTML = '<option value="">Tous les dossiers</option>';
    filtreSousDossier.innerHTML = '<option value="">Tous les sous-dossiers</option>';
    
    if (service && service.dossiers) {
        service.dossiers.forEach(dossier => {
            filtreDossier.innerHTML += `<option value="${dossier.id}">${dossier.nom}</option>`;
        });
    }
}

// Mettre à jour les sous-dossiers dans la recherche selon le dossier sélectionné
function mettreAJourSousDossiersRecherche() {
    const filtreService = document.getElementById('filtre-service');
    const filtreDossier = document.getElementById('filtre-dossier');
    const filtreSousDossier = document.getElementById('filtre-sous-dossier');
    
    if (!filtreService || !filtreDossier || !filtreSousDossier) return;
    
    const serviceId = filtreService.value;
    const dossierId = filtreDossier.value;
    const service = structureServices[serviceId];
    
    filtreSousDossier.innerHTML = '<option value="">Tous les sous-dossiers</option>';
    
    if (service && service.dossiers && dossierId) {
        const dossier = service.dossiers.find(d => d.id === dossierId);
        if (dossier && dossier.sousDossiers && dossier.sousDossiers.length > 0) {
            dossier.sousDossiers.forEach(sousDossier => {
                filtreSousDossier.innerHTML += `<option value="${sousDossier.id}">${sousDossier.nom}</option>`;
            });
        }
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
    
    // Si on affiche le tableau de bord, mettre à jour les statistiques
    if (sectionId === 'tableau-de-bord') {
        setTimeout(() => {
            mettreAJourStatistiques();
        }, 100);
    }
    
    // Si on affiche la section utilisateurs, rafraîchir le tableau
    if (sectionId === 'utilisateurs') {
        setTimeout(() => {
            if (typeof afficherUtilisateurs === 'function') {
                afficherUtilisateurs();
            }
        }, 100);
    }
    
    // Si on affiche les paramètres, mettre à jour les statistiques
    if (sectionId === 'parametres') {
        setTimeout(() => {
            mettreAJourParametres();
            const userConnecte = JSON.parse(localStorage.getItem('utilisateurConnecte'));
            if (userConnecte) {
                mettreAJourInfoUtilisateur(userConnecte);
            }
        }, 100);
    }
    
    // Si on affiche le profil, mettre à jour les informations
    if (sectionId === 'profil') {
        setTimeout(() => {
            const userConnecte = JSON.parse(localStorage.getItem('utilisateurConnecte'));
            if (userConnecte) {
                mettreAJourProfil(userConnecte);
            }
        }, 100);
    }
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
    const userRole = document.getElementById('user-role');
    
    const nomComplet = `${user.nom || ''} ${user.prenom || ''}`.trim() || user.email || '-';
    
    if (userNom) userNom.textContent = nomComplet;
    if (userEmail) userEmail.textContent = user.email || '-';
    if (userOrganisation) userOrganisation.textContent = user.organisation || 'Non spécifiée';
    
    // Mettre à jour le rôle
    const getRoleName = (role) => {
        const roles = {
            'admin': '👑 Administrateur',
            'agent': '👤 Agent',
            'consultation': '👁️ Consultation'
        };
        return roles[role] || role || '-';
    };
    
    if (userRole) userRole.textContent = getRoleName(user.role);
    
    // Mettre à jour le profil
    mettreAJourProfil(user);
    
    // Mettre à jour les paramètres
    mettreAJourParametres();
}

// Mettre à jour la section profil
function mettreAJourProfil(user) {
    const profilNom = document.getElementById('profil-nom');
    const profilEmail = document.getElementById('profil-email');
    const profilRole = document.getElementById('profil-role');
    const profilOrganisation = document.getElementById('profil-organisation');
    
    const nomComplet = `${user.nom || ''} ${user.prenom || ''}`.trim() || user.email || '-';
    
    if (profilNom) profilNom.textContent = nomComplet;
    if (profilEmail) profilEmail.textContent = user.email || '-';
    if (profilOrganisation) profilOrganisation.textContent = user.organisation || 'Non spécifiée';
    
    const getRoleName = (role) => {
        const roles = {
            'admin': '👑 Administrateur',
            'agent': '👤 Agent',
            'consultation': '👁️ Consultation'
        };
        return roles[role] || role || '-';
    };
    
    if (profilRole) profilRole.textContent = getRoleName(user.role);
    
    // Statistiques du profil
    mettreAJourStatistiquesProfil(user);
}

// Mettre à jour les statistiques du profil
function mettreAJourStatistiquesProfil(user) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const comptesParticuliers = JSON.parse(localStorage.getItem('comptes-particulier') || '[]');
    const comptesEntreprises = JSON.parse(localStorage.getItem('comptes-entreprise') || '[]');
    
    // Compter les documents créés par cet utilisateur (si on a un champ créateur)
    // Pour l'instant, on compte tous les documents
    const docsCrees = documents.length;
    
    // Compter les comptes créés
    const comptesCrees = comptesParticuliers.length + comptesEntreprises.length;
    
    // Dernière connexion (stockée dans localStorage)
    const derniereConnexion = localStorage.getItem('derniereConnexion');
    
    const elDocsCrees = document.getElementById('profil-docs-crees');
    if (elDocsCrees) elDocsCrees.textContent = docsCrees;
    
    const elComptesCrees = document.getElementById('profil-comptes-crees');
    if (elComptesCrees) elComptesCrees.textContent = comptesCrees;
    
    const elDerniereConnexion = document.getElementById('profil-derniere-connexion');
    if (elDerniereConnexion) {
        if (derniereConnexion) {
            const date = new Date(derniereConnexion);
            elDerniereConnexion.textContent = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else {
            elDerniereConnexion.textContent = 'Aujourd\'hui';
        }
    }
}

// Mettre à jour les paramètres
function mettreAJourParametres() {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const comptesParticuliers = JSON.parse(localStorage.getItem('comptes-particulier') || '[]');
    const comptesEntreprises = JSON.parse(localStorage.getItem('comptes-entreprise') || '[]');
    const utilisateurs = JSON.parse(localStorage.getItem('utilisateurs') || '[]');
    
    const totalDocuments = documents.length;
    const totalComptes = comptesParticuliers.length + comptesEntreprises.length;
    
    // Documents ce mois
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const documentsCeMois = documents.filter(doc => {
        const docDate = new Date(doc.dateAjout);
        return docDate >= debutMois;
    }).length;
    
    // Documents aujourd'hui
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const documentsAujourdhui = documents.filter(doc => {
        const docDate = new Date(doc.dateAjout);
        docDate.setHours(0, 0, 0, 0);
        return docDate.getTime() === aujourdhui.getTime();
    }).length;
    
    // Services actifs
    const servicesActifs = new Set(documents.map(doc => doc.service).filter(Boolean));
    
    const elTotalDocs = document.getElementById('total-documents-param');
    if (elTotalDocs) elTotalDocs.textContent = totalDocuments;
    
    const elTotalComptes = document.getElementById('total-comptes-param');
    if (elTotalComptes) elTotalComptes.textContent = totalComptes;
    
    const elServicesActifs = document.getElementById('services-actifs-param');
    if (elServicesActifs) elServicesActifs.textContent = servicesActifs.size;
    
    const elUtilisateurs = document.getElementById('total-utilisateurs-param');
    if (elUtilisateurs) elUtilisateurs.textContent = utilisateurs.length;
    
    const elDocsMois = document.getElementById('docs-mois-param');
    if (elDocsMois) elDocsMois.textContent = documentsCeMois;
    
    const elDocsAujourdhui = document.getElementById('docs-aujourdhui-param');
    if (elDocsAujourdhui) elDocsAujourdhui.textContent = documentsAujourdhui;
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

            // Récupérer service, dossier et sous-dossier
            const selectService = document.getElementById('select-service');
            const selectDossier = document.getElementById('dossier-principal');
            const selectSousDossier = document.getElementById('sous-dossier');
            
            const service = selectService ? selectService.value : (currentService || '');
            const dossier = selectDossier ? selectDossier.value : '';
            const sousDossier = selectSousDossier ? selectSousDossier.value : '';

            let documents = JSON.parse(localStorage.getItem('documents')) || [];
            
            if (documentEnModification) {
                // Mode modification
                const index = documentEnModification.index;
                documents[index] = {
                    ...documents[index],
                    service: service,
                    dossier: dossier,
                    sousDossier: sousDossier || null,
                    type: typeDocument,
                    donnees: documentData,
                    dateAjout: documents[index].dateAjout // Garder la date originale
                };
                alert('Document modifié avec succès !');
            } else {
                // Mode création
                const docId = cryptoRandomId();
                documents.push({
                    id: docId,
                    service: service,
                    dossier: dossier,
                    sousDossier: sousDossier || null,
                    type: typeDocument,
                    donnees: documentData,
                    dateAjout: new Date().toISOString()
                });
                alert('Document enregistré avec succès !');
            }

            localStorage.setItem('documents', JSON.stringify(documents));
            
            e.target.reset();
            resetFormState();
            
            // Afficher les documents selon le contexte
            if (currentService) {
                afficherDocumentsParService(currentService);
            } else {
            afficherDocumentsParCategories();
            }
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
        const rechercheDate = document.getElementById('recherche-date');
        const rechercheNumero = document.getElementById('recherche-numero');
        const filtreService = document.getElementById('filtre-service');
        const filtreDossier = document.getElementById('filtre-dossier');
        const filtreSousDossier = document.getElementById('filtre-sous-dossier');
        const resultatsContainer = document.getElementById('resultats-recherche');
        
        if (!resultatsContainer) return;
        
        const motCle = champRecherche ? champRecherche.value.trim() : '';
        const dateFiltre = rechercheDate ? rechercheDate.value : '';
        const numeroFiltre = rechercheNumero ? rechercheNumero.value.trim() : '';
        const serviceFiltre = filtreService ? filtreService.value : '';
        const dossierFiltre = filtreDossier ? filtreDossier.value : '';
        const sousDossierFiltre = filtreSousDossier ? filtreSousDossier.value : '';
        
        const documents = JSON.parse(localStorage.getItem('documents')) || [];

        // Si aucun critère n'est rempli, afficher un message
        if (!motCle && !dateFiltre && !numeroFiltre && !serviceFiltre && !dossierFiltre && !sousDossierFiltre) {
            resultatsContainer.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">🔍 Utilisez les filtres ci-dessus pour rechercher des documents.</p>';
            return;
        }

        let resultats = documents.filter(doc => {
            // Filtre par service
            if (serviceFiltre && doc.service !== serviceFiltre) return false;
            
            // Filtre par dossier
            if (dossierFiltre && doc.dossier !== dossierFiltre) return false;
            
            // Filtre par sous-dossier
            if (sousDossierFiltre && doc.sousDossier !== sousDossierFiltre) return false;
            
            // Filtre par date
            if (dateFiltre && doc.dateAjout) {
                const docDate = new Date(doc.dateAjout).toISOString().split('T')[0];
                if (docDate !== dateFiltre) return false;
            }
            
            // Filtre par numéro
            if (numeroFiltre) {
                const docNumero = doc.donnees?.numero || doc.numero || '';
                if (!docNumero.toString().toLowerCase().includes(numeroFiltre.toLowerCase())) {
                    return false;
                }
            }
            
            // Filtre par mot-clé
            if (motCle) {
                const searchText = [
                    doc.service || '',
                    doc.dossier || '',
                    doc.sousDossier || '',
                    doc.type || '',
                    doc.donnees?.titre || doc.donnees?.nom || doc.donnees?.documentName || '',
                    doc.donnees?.client || '',
                    doc.donnees?.numero || doc.numero || '',
                    ...Object.values(doc.donnees || {}).filter(val => 
                        typeof val === 'string' && !val.startsWith('data:') && !val.startsWith('blob:')
                    )
                ].filter(Boolean).join(' ').toLowerCase();
                
                if (!searchText.includes(motCle.toLowerCase())) {
                    return false;
                }
            }
            
            return true;
        });

        // Afficher les résultats
        if (resultats.length === 0) {
            resultatsContainer.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun document trouvé avec ces critères.</p>';
            return;
        }

        // Trier par date (plus récent en premier)
        resultats.sort((a, b) => new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0));

        // Obtenir les noms de service et dossier pour l'affichage
        const getServiceName = (serviceId) => {
            const service = structureServices[serviceId];
            return service ? `${service.icone} ${service.nom}` : serviceId;
        };

        const getDossierName = (serviceId, dossierId) => {
            const service = structureServices[serviceId];
            if (!service) return dossierId;
            const dossier = service.dossiers?.find(d => d.id === dossierId);
            return dossier ? dossier.nom : dossierId;
        };

        const getSousDossierName = (serviceId, dossierId, sousDossierId) => {
            const service = structureServices[serviceId];
            if (!service) return sousDossierId;
            const dossier = service.dossiers?.find(d => d.id === dossierId);
            const sousDossier = dossier?.sousDossiers?.find(s => s.id === sousDossierId);
            return sousDossier ? sousDossier.nom : sousDossierId;
        };

        resultatsContainer.innerHTML = `
            <h3>Résultats (${resultats.length})</h3>
            <div style="display: grid; gap: 1rem; margin-top: 1rem;">
                ${resultats.map(doc => {
                    const titre = doc.donnees?.titre || doc.donnees?.nom || doc.donnees?.documentName || `Document ${doc.type || 'sans type'}`;
                    const client = doc.donnees?.client || '-';
                    const date = doc.dateAjout ? new Date(doc.dateAjout).toLocaleDateString('fr-FR') : '-';
                    const numero = doc.donnees?.numero || doc.numero || '';
                    const serviceName = doc.service ? getServiceName(doc.service) : '-';
                    const dossierName = (doc.service && doc.dossier) ? getDossierName(doc.service, doc.dossier) : '-';
                    const sousDossierName = (doc.service && doc.dossier && doc.sousDossier) ? getSousDossierName(doc.service, doc.dossier, doc.sousDossier) : '-';
                    
                    return `
                        <div onclick="ouvrirDocumentRecherche('${doc.id}')" style="cursor:pointer; background: var(--card-bg, #f8f9fa); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color, #dee2e6); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                <strong style="font-size: 1.1rem; color: var(--text-primary, #212529);">${titre}</strong>
                                <span style="color: #6c757d; font-size: 0.9rem;">${date}</span>
                            </div>
                            <div style="color: #6c757d; font-size: 0.9rem; margin-top: 0.5rem;">
                                ${serviceName !== '-' ? `<p><strong>Service:</strong> ${serviceName}</p>` : ''}
                                ${dossierName !== '-' ? `<p><strong>Dossier:</strong> ${dossierName}</p>` : ''}
                                ${sousDossierName !== '-' ? `<p><strong>Sous-dossier:</strong> ${sousDossierName}</p>` : ''}
                                ${client !== '-' ? `<p><strong>Client:</strong> ${client}</p>` : ''}
                                ${numero ? `<p><strong>Numéro:</strong> ${numero}</p>` : ''}
                                <p><strong>Type:</strong> ${doc.type || 'Non spécifié'}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
            
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        const resultatsContainer = document.getElementById('resultats-recherche');
        if (resultatsContainer) {
            resultatsContainer.innerHTML = '<p style="color: red;">Erreur lors de la recherche. Veuillez réessayer.</p>';
        }
    }
}

// Fonction pour ouvrir un document depuis les résultats de recherche
function ouvrirDocumentRecherche(docId) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents.find(d => d.id === docId);
    
    if (!doc) {
        alert('Document introuvable');
        return;
    }
    
    // Si le document a un service, naviguer vers ce service
    if (doc.service) {
        afficherSection('services');
        setTimeout(() => {
            afficherService(doc.service);
            // Scroll vers le document si possible
            setTimeout(() => {
                const docElement = document.querySelector(`[onclick*="${docId}"]`);
                if (docElement) {
                    docElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    docElement.style.background = '#fff3cd';
                    setTimeout(() => {
                        docElement.style.background = '';
                    }, 2000);
                }
            }, 500);
        }, 100);
    } else {
        // Sinon, utiliser la fonction de prévisualisation
        previewDocumentService(docId);
    }
}

// Fonction pour réinitialiser la recherche
function resetRecherche() {
    const champRecherche = document.getElementById('champ-recherche');
    const rechercheDate = document.getElementById('recherche-date');
    const rechercheNumero = document.getElementById('recherche-numero');
    const filtreService = document.getElementById('filtre-service');
    const filtreDossier = document.getElementById('filtre-dossier');
    const filtreSousDossier = document.getElementById('filtre-sous-dossier');
    const resultatsContainer = document.getElementById('resultats-recherche');
    
    if (champRecherche) champRecherche.value = '';
    if (rechercheDate) rechercheDate.value = '';
    if (rechercheNumero) rechercheNumero.value = '';
    if (filtreService) filtreService.value = '';
    if (filtreDossier) filtreDossier.innerHTML = '<option value="">Tous les dossiers</option>';
    if (filtreSousDossier) filtreSousDossier.innerHTML = '<option value="">Tous les sous-dossiers</option>';
    
    if (resultatsContainer) {
        resultatsContainer.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">🔍 Utilisez les filtres ci-dessus pour rechercher des documents.</p>';
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
        
        // Mettre à jour le nouveau tableau de bord
        mettreAJourTableauBord(documents);
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques:', error);
    }
}

// Mettre à jour le tableau de bord
function mettreAJourTableauBord(documents) {
    try {
        const comptesParticuliers = JSON.parse(localStorage.getItem('comptes-particulier') || '[]');
        const comptesEntreprises = JSON.parse(localStorage.getItem('comptes-entreprise') || '[]');
        const utilisateurs = JSON.parse(localStorage.getItem('utilisateurs') || '[]');
        
        const totalDocuments = documents.length;
        const totalComptes = comptesParticuliers.length + comptesEntreprises.length;
        
        // Documents ce mois
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const documentsCeMois = documents.filter(doc => {
            const docDate = new Date(doc.dateAjout);
            return docDate >= debutMois;
        }).length;
        
        // Documents aujourd'hui
        const aujourdhui = new Date();
        aujourdhui.setHours(0, 0, 0, 0);
        const documentsAujourdhui = documents.filter(doc => {
            const docDate = new Date(doc.dateAjout);
            docDate.setHours(0, 0, 0, 0);
            return docDate.getTime() === aujourdhui.getTime();
        }).length;
        
        // Services actifs
        const servicesActifs = new Set(documents.map(doc => doc.service).filter(Boolean));
        
        // Mettre à jour les widgets
        const elTotalDocs = document.getElementById('stat-total-documents');
        if (elTotalDocs) elTotalDocs.textContent = totalDocuments;
        
        const elTotalComptes = document.getElementById('stat-total-comptes');
        if (elTotalComptes) elTotalComptes.textContent = totalComptes;
        
        const elDocsMois = document.getElementById('stat-documents-mois');
        if (elDocsMois) elDocsMois.textContent = documentsCeMois;
        
        const elServicesActifs = document.getElementById('stat-services-actifs');
        if (elServicesActifs) elServicesActifs.textContent = servicesActifs.size;
        
        const elComptesPart = document.getElementById('stat-comptes-particuliers');
        if (elComptesPart) elComptesPart.textContent = comptesParticuliers.length;
        
        const elComptesEnt = document.getElementById('stat-comptes-entreprises');
        if (elComptesEnt) elComptesEnt.textContent = comptesEntreprises.length;
        
        const elUtilisateurs = document.getElementById('stat-utilisateurs');
        if (elUtilisateurs) elUtilisateurs.textContent = utilisateurs.length;
        
        const elDocsAujourdhui = document.getElementById('stat-documents-aujourdhui');
        if (elDocsAujourdhui) elDocsAujourdhui.textContent = documentsAujourdhui;
        
        // Afficher les graphiques et listes
        afficherDocumentsRecents(documents);
        afficherGraphiqueServices(documents);
        afficherStatsDossiers(documents);
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour du tableau de bord:', error);
    }
}

// Afficher les documents récents
function afficherDocumentsRecents(documents) {
    const container = document.getElementById('documents-recents');
    if (!container) return;
    
    const documentsRecents = documents
        .sort((a, b) => new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0))
        .slice(0, 5);
    
    if (documentsRecents.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun document récent</p>';
        return;
    }
    
    const getServiceName = (serviceId) => {
        const service = structureServices[serviceId];
        return service ? service.nom : serviceId || 'Non spécifié';
    };
    
    container.innerHTML = documentsRecents.map(doc => {
        const titre = doc.donnees?.titre || doc.donnees?.nom || doc.donnees?.documentName || 'Document sans titre';
        const date = doc.dateAjout ? new Date(doc.dateAjout).toLocaleDateString('fr-FR') : '-';
        const service = doc.service ? getServiceName(doc.service) : '-';
        
        return `
            <div style="padding: 1rem; border-bottom: 1px solid #dee2e6; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background=''">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <strong style="display: block; margin-bottom: 0.25rem;">${titre}</strong>
                        <small style="color: #6c757d;">${service}</small>
                    </div>
                    <small style="color: #6c757d; white-space: nowrap; margin-left: 1rem;">${date}</small>
                </div>
            </div>
        `;
    }).join('');
}

// Afficher le graphique des documents par service
function afficherGraphiqueServices(documents) {
    const container = document.getElementById('chart-services');
    if (!container) return;
    
    const statsParService = {};
    documents.forEach(doc => {
        if (doc.service) {
            statsParService[doc.service] = (statsParService[doc.service] || 0) + 1;
        }
    });
    
    if (Object.keys(statsParService).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun document par service</p>';
        return;
    }
    
    const maxValue = Math.max(...Object.values(statsParService));
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'];
    let colorIndex = 0;
    
    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
    Object.entries(statsParService).forEach(([serviceId, count]) => {
        const service = structureServices[serviceId];
        const serviceName = service ? `${service.icone} ${service.nom}` : serviceId;
        const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
        const color = colors[colorIndex % colors.length];
        colorIndex++;
        
        html += `
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 500;">${serviceName}</span>
                    <span style="font-weight: bold; color: ${color};">${count}</span>
                </div>
                <div style="background: #e9ecef; border-radius: 0.5rem; height: 1.5rem; overflow: hidden;">
                    <div style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s; border-radius: 0.5rem;"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Afficher les statistiques par dossier
function afficherStatsDossiers(documents) {
    const container = document.getElementById('dossiers-stats-list');
    if (!container) return;
    
    const statsParDossier = {};
    documents.forEach(doc => {
        if (doc.service && doc.dossier) {
            const key = `${doc.service}-${doc.dossier}`;
            if (!statsParDossier[key]) {
                statsParDossier[key] = {
                    service: doc.service,
                    dossier: doc.dossier,
                    count: 0
                };
            }
            statsParDossier[key].count++;
        }
    });
    
    if (Object.keys(statsParDossier).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun document dans les dossiers</p>';
        return;
    }
    
    const dossiersTries = Object.values(statsParDossier).sort((a, b) => b.count - a.count);
    
    const getServiceName = (serviceId) => {
        const service = structureServices[serviceId];
        return service ? service.nom : serviceId;
    };
    
    const getDossierName = (serviceId, dossierId) => {
        const service = structureServices[serviceId];
        if (!service) return dossierId;
        const dossier = service.dossiers?.find(d => d.id === dossierId);
        return dossier ? dossier.nom : dossierId;
    };
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">';
    dossiersTries.forEach(item => {
        const serviceName = getServiceName(item.service);
        const dossierName = getDossierName(item.service, item.dossier);
        
        html += `
            <div style="padding: 1rem; background: #f8f9fa; border-radius: 0.5rem; border-left: 4px solid #667eea;">
                <p style="margin: 0; color: #6c757d; font-size: 0.9rem;">${serviceName}</p>
                <h4 style="margin: 0.25rem 0 0; font-size: 1.1rem;">${dossierName}</h4>
                <p style="margin: 0.5rem 0 0; font-size: 1.5rem; font-weight: bold; color: #667eea;">${item.count}</p>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

function exporterDonnees() {
    try {
        const allData = {
            documents: JSON.parse(localStorage.getItem('documents') || '[]'),
            comptesParticuliers: JSON.parse(localStorage.getItem('comptes-particulier') || '[]'),
            comptesEntreprises: JSON.parse(localStorage.getItem('comptes-entreprise') || '[]'),
            utilisateurs: JSON.parse(localStorage.getItem('utilisateurs') || '[]'),
            dateExport: new Date().toISOString()
        };
        
        const dataBlob = new Blob([JSON.stringify(allData, null, 2)], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cis_donnees_completes_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        alert('✅ Toutes les données exportées !');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des données.');
    }
}

function exporterDocuments() {
    try {
        const documents = JSON.parse(localStorage.getItem('documents') || '[]');
        const dataBlob = new Blob([JSON.stringify(documents, null, 2)], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cis_documents_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        alert('✅ Documents exportés !');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des documents.');
    }
}

function exporterComptes() {
    try {
        const comptesParticuliers = JSON.parse(localStorage.getItem('comptes-particulier') || '[]');
        const comptesEntreprises = JSON.parse(localStorage.getItem('comptes-entreprise') || '[]');
        const allComptes = {
            particuliers: comptesParticuliers,
            entreprises: comptesEntreprises
        };
        const dataBlob = new Blob([JSON.stringify(allComptes, null, 2)], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cis_comptes_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        alert('✅ Comptes exportés !');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des comptes.');
    }
}

function exporterUtilisateurs() {
    try {
        const utilisateurs = JSON.parse(localStorage.getItem('utilisateurs') || '[]');
        // Ne pas exporter les mots de passe
        const utilisateursSansMdp = utilisateurs.map(u => {
            const { motDePasse, ...userSansMdp } = u;
            return userSansMdp;
        });
        const dataBlob = new Blob([JSON.stringify(utilisateursSansMdp, null, 2)], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `cis_utilisateurs_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        alert('✅ Utilisateurs exportés !');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des utilisateurs.');
    }
}

function confirmerSuppression() {
    if (confirm('⚠️ ATTENTION : Supprimer TOUTES les données ?\n\nCela supprimera :\n- Tous les documents\n- Tous les comptes\n- Tous les utilisateurs\n\nCette action est irréversible !') && 
        confirm('⚠️ DERNIÈRE CONFIRMATION : Êtes-vous absolument sûr ?')) {
        try {
            localStorage.removeItem('documents');
            localStorage.removeItem('comptes-particulier');
            localStorage.removeItem('comptes-entreprise');
            localStorage.removeItem('utilisateurs');
            localStorage.removeItem('utilisateurConnecte');
            alert('✅ Toutes les données ont été supprimées.');
            location.reload(); // Recharger la page
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

// Module Comptes (Particulier et Entreprise)
let currentCompteType = null; // 'particulier' ou 'entreprise'

function setupClientsModule() {
    // Boutons de sélection du type de compte
    const btnParticulier = document.getElementById('btn-compte-particulier');
    const btnEntreprise = document.getElementById('btn-compte-entreprise');
    const btnBackParticulier = document.getElementById('btn-back-particulier');
    const btnBackEntreprise = document.getElementById('btn-back-entreprise');
    
    if (btnParticulier) {
        btnParticulier.addEventListener('click', () => {
            showCompteType('particulier');
        });
    }
    
    if (btnEntreprise) {
        btnEntreprise.addEventListener('click', () => {
            showCompteType('entreprise');
        });
    }
    
    if (btnBackParticulier) {
        btnBackParticulier.addEventListener('click', () => {
            showCompteSelection();
        });
    }
    
    if (btnBackEntreprise) {
        btnBackEntreprise.addEventListener('click', () => {
            showCompteSelection();
        });
    }
    
    // Formulaire Compte Particulier
    const formParticulier = document.getElementById('form-client-particulier');
    if (formParticulier) {
        formParticulier.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(formParticulier).entries());
            saveCompte('particulier', data);
            formParticulier.reset();
            renderComptesTable('particulier');
        });
    }
    
    // Formulaire Compte Entreprise
    const formEntreprise = document.getElementById('form-client-entreprise');
    if (formEntreprise) {
        formEntreprise.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(formEntreprise).entries());
            saveCompte('entreprise', data);
            formEntreprise.reset();
            renderComptesTable('entreprise');
        });
    }
    
    // Recherche Compte Particulier
    const searchParticulier = document.getElementById('recherche-client-particulier');
    if (searchParticulier) {
        ['input', 'change'].forEach(ev => {
            searchParticulier.addEventListener(ev, () => {
                renderComptesTable('particulier', searchParticulier.value.trim());
            });
        });
    }
    
    // Recherche Compte Entreprise
    const searchEntreprise = document.getElementById('recherche-client-entreprise');
    if (searchEntreprise) {
        ['input', 'change'].forEach(ev => {
            searchEntreprise.addEventListener(ev, () => {
                renderComptesTable('entreprise', searchEntreprise.value.trim());
            });
        });
    }
}

function showCompteSelection() {
    currentCompteType = null;
    const selection = document.getElementById('compte-type-selection');
    const contentParticulier = document.getElementById('compte-particulier-content');
    const contentEntreprise = document.getElementById('compte-entreprise-content');
    
    if (selection) selection.classList.remove('hidden');
    if (contentParticulier) contentParticulier.classList.add('hidden');
    if (contentEntreprise) contentEntreprise.classList.add('hidden');
}

function showCompteType(type) {
    currentCompteType = type;
    const selection = document.getElementById('compte-type-selection');
    const contentParticulier = document.getElementById('compte-particulier-content');
    const contentEntreprise = document.getElementById('compte-entreprise-content');
    
    if (selection) selection.classList.add('hidden');
    if (contentParticulier) {
        contentParticulier.classList.toggle('hidden', type !== 'particulier');
        if (type === 'particulier') renderComptesTable('particulier');
    }
    if (contentEntreprise) {
        contentEntreprise.classList.toggle('hidden', type !== 'entreprise');
        if (type === 'entreprise') renderComptesTable('entreprise');
    }
}

function saveCompte(type, data) {
    const comptes = JSON.parse(localStorage.getItem(`comptes-${type}`) || '[]');
    comptes.push({ id: cryptoRandomId(), ...data, typeCompte: type });
    localStorage.setItem(`comptes-${type}`, JSON.stringify(comptes));
    alert(`Compte ${type === 'particulier' ? 'particulier' : 'entreprise'} enregistré !`);
}

function renderComptesTable(type, filterText = '', page = 1, pageSize = 10) {
    const tbody = document.querySelector(`#table-clients-${type} tbody`);
    const pager = document.getElementById(`clients-${type}-pagination`);
    if (!tbody) return;
    
    const all = JSON.parse(localStorage.getItem(`comptes-${type}`) || '[]');
    const filtered = !filterText ? all : all.filter(c => (
        `${c.nom} ${c.contact} ${c.telephone} ${c.email}`.toLowerCase().includes(filterText.toLowerCase())
    ));
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    
    tbody.innerHTML = items.map(c => `
        <tr>
            <td>${c.nom || '-'}</td>
            <td>${c.contact || '-'}</td>
            <td>${c.telephone || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>
                <button class="btn-secondary" onclick='editCompte("${c.id}", "${type}")'>Modifier</button>
                <button class="btn-supprimer" onclick='deleteCompte("${c.id}", "${type}")'>Supprimer</button>
            </td>
        </tr>
    `).join('');
    
    if (pager) {
        pager.innerHTML = Array.from({length: totalPages}, (_,i)=>`
            <button class="page-btn" onclick="renderComptesTable('${type}', '${filterText}', ${i+1}, ${pageSize})">${i+1}</button>
        `).join('');
    }
}

function editCompte(id, type) {
    const comptes = JSON.parse(localStorage.getItem(`comptes-${type}`) || '[]');
    const idx = comptes.findIndex(c => c.id === id);
    if (idx === -1) return;
    const c = comptes[idx];
    const form = document.getElementById(`form-client-${type}`);
    if (!form) return;
    
    form.nom.value = c.nom || '';
    form.contact.value = c.contact || '';
    form.telephone.value = c.telephone || '';
    form.email.value = c.email || '';
    
    comptes.splice(idx, 1);
    localStorage.setItem(`comptes-${type}`, JSON.stringify(comptes));
    renderComptesTable(type);
}

function deleteCompte(id, type) {
    if (!confirm(`Supprimer ce compte ${type === 'particulier' ? 'particulier' : 'entreprise'} ?`)) return;
    const comptes = JSON.parse(localStorage.getItem(`comptes-${type}`) || '[]');
    const idx = comptes.findIndex(c => c.id === id);
    if (idx !== -1) comptes.splice(idx, 1);
    localStorage.setItem(`comptes-${type}`, JSON.stringify(comptes));
    renderComptesTable(type);
}

// Fonction pour générer un ID unique
function cryptoRandomId() {
    try {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    } catch { // fallback
        return 'id_' + Math.random().toString(36).slice(2);
    }
}

// Structure des services avec dossiers et sous-dossiers
const structureServices = {
    compte: {
        nom: 'Compte',
        icone: '💼',
        dossiers: []
    },
    comptabilite: {
        nom: 'Comptabilité',
        icone: '📊',
        dossiers: [{
            nom: 'Journée Comptable',
            id: 'journee-comptable',
            sousDossiers: [
                { nom: 'Comptabilité', id: 'comptabilite' },
                { nom: 'Back Office', id: 'back-office' },
                { nom: 'Caisse', id: 'caisse' },
                { nom: 'Western', id: 'western' }
            ]
        }]
    },
    rh: {
        nom: 'Ressources Humaines',
        icone: '👥',
        dossiers: [
            { nom: 'Dossier du Personnel', id: 'dossier-personnel', sousDossiers: [] },
            { nom: 'Les Rapports', id: 'rapports', sousDossiers: [] }
        ]
    },
    etranger: {
        nom: 'Service Étranger',
        icone: '🌍',
        dossiers: [
            { nom: 'Transfert', id: 'transfert', sousDossiers: [] },
            { nom: 'Rapatriement', id: 'rapatriement', sousDossiers: [] }
        ]
    },
    audit: {
        nom: 'Audit',
        icone: '🔍',
        dossiers: [
            { nom: 'Rapport Audit', id: 'rapport-audit', sousDossiers: [] }
        ]
    },
    risque: {
        nom: 'Service Risque',
        icone: '⚠️',
        dossiers: [
            { nom: 'Les Bilans', id: 'bilans', sousDossiers: [] },
            { nom: 'Les États Financiers', id: 'etats-financiers', sousDossiers: [] }
        ]
    }
};

let currentService = null;

// Afficher la sélection des services
function showServiceSelection() {
    currentService = null;
    const selection = document.getElementById('service-selection');
    const content = document.getElementById('service-content');
    
    if (selection) selection.classList.remove('hidden');
    if (content) content.classList.add('hidden');
}

// Afficher un service spécifique
function afficherService(serviceId) {
    const service = structureServices[serviceId];
    if (!service) return;
    
    currentService = serviceId;
    const selection = document.getElementById('service-selection');
    const content = document.getElementById('service-content');
    const title = document.getElementById('service-title');
    
    if (selection) selection.classList.add('hidden');
    if (content) content.classList.remove('hidden');
    if (title) title.textContent = `${service.icone} ${service.nom}`;
    
    // Générer le HTML pour les dossiers et sous-dossiers
    genererStructureService(serviceId);
    
    // Afficher les documents existants
    afficherDocumentsParService(serviceId);
}

// Générer la structure HTML d'un service
function genererStructureService(serviceId) {
    const service = structureServices[serviceId];
    if (!service) return;
    
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    if (service.dossiers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun dossier configuré pour ce service.</p>';
        return;
    }
    
    let html = '';
    service.dossiers.forEach(dossier => {
        const dossierId = `${serviceId}-${dossier.id}`;
        const dossierFullId = `folder-${dossierId}`;
        html += `
            <div class="main-folder" data-service="${serviceId}" data-folder="${dossier.id}">
                <div class="folder-header main-folder-header">
                    <span class="folder-icon">📁</span>
                    <h3>${dossier.nom}</h3>
                    <span class="document-count" id="count-${dossierId}">0</span>
                    <button class="toggle-folder" onclick="toggleMainFolder('${dossierId}')">▼</button>
                </div>
                <div class="folder-content main-folder-content" id="${dossierFullId}">
        `;
        
        if (dossier.sousDossiers && dossier.sousDossiers.length > 0) {
            dossier.sousDossiers.forEach(sousDossier => {
                const sousDossierId = `${dossierId}-${sousDossier.id}`;
                const sousDossierFullId = `folder-${sousDossierId}`;
                html += `
                    <div class="sub-folder" data-subfolder="${sousDossier.id}">
                        <div class="folder-header sub-folder-header">
                            <span class="folder-icon">📂</span>
                            <h4>${sousDossier.nom}</h4>
                            <span class="document-count" id="count-${sousDossierId}">0</span>
                            <button class="toggle-folder" onclick="toggleSubFolder('${dossierId}', '${sousDossier.id}')">▼</button>
                        </div>
                        <div class="folder-content sub-folder-content" id="${sousDossierFullId}"></div>
                    </div>
                `;
            });
        } else {
            // Si pas de sous-dossier, afficher directement les documents dans le dossier
            html += `<div class="folder-content" id="folder-${dossierId}-documents"></div>`;
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Afficher les documents d'un service
function afficherDocumentsParService(serviceId) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const service = structureServices[serviceId];
    if (!service) return;
    
    service.dossiers.forEach(dossier => {
        const dossierId = `${serviceId}-${dossier.id}`;
        
        if (dossier.sousDossiers && dossier.sousDossiers.length > 0) {
            dossier.sousDossiers.forEach(sousDossier => {
                const sousDossierId = `${dossierId}-${sousDossier.id}`;
                const docs = documents.filter(doc => 
                    doc.service === serviceId && 
                    doc.dossier === dossier.id && 
                    doc.sousDossier === sousDossier.id
                );
                
                const countEl = document.getElementById(`count-${sousDossierId}`);
                const contentEl = document.getElementById(`folder-${sousDossierId}`);
                
                if (countEl) countEl.textContent = docs.length;
                if (contentEl) {
                    contentEl.innerHTML = docs.length === 0 ? 
                        '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun document</p>' :
                        docs.map(doc => creerElementDocumentService(doc).outerHTML).join('');
                }
            });
        } else {
            // Documents directement dans le dossier
            const docs = documents.filter(doc => 
                doc.service === serviceId && 
                doc.dossier === dossier.id &&
                !doc.sousDossier
            );
            
            const countEl = document.getElementById(`count-${dossierId}`);
            const contentEl = document.getElementById(`folder-${dossierId}-documents`);
            
            if (countEl) countEl.textContent = docs.length;
            if (contentEl) {
                contentEl.innerHTML = docs.length === 0 ? 
                    '<p style="text-align: center; color: #6c757d; font-style: italic;">Aucun document</p>' :
                    docs.map(doc => creerElementDocumentService(doc).outerHTML).join('');
            }
        }
        
        // Compter tous les documents du dossier
        const allDocsInDossier = documents.filter(doc => 
            doc.service === serviceId && doc.dossier === dossier.id
        );
        const countDossierEl = document.getElementById(`count-${dossierId}`);
        if (countDossierEl) countDossierEl.textContent = allDocsInDossier.length;
    });
}

// Créer un élément document pour un service
function creerElementDocumentService(doc) {
    const div = document.createElement('div');
    div.className = 'document-item';
    const titre = doc.donnees?.titre || doc.donnees?.nom || doc.titre || 'Sans titre';
    const client = doc.donnees?.client || doc.client || '-';
    const date = doc.dateAjout ? new Date(doc.dateAjout).toLocaleDateString('fr-FR') : '-';
    const numero = doc.donnees?.numero || doc.numero || '';
    div.innerHTML = `
        <div class="document-info">
            <h4>${titre}</h4>
            <p><strong>Client:</strong> ${client}</p>
            <p><strong>Date:</strong> ${date}</p>
            ${numero ? `<p><strong>Numéro:</strong> ${numero}</p>` : ''}
        </div>
        <div class="document-actions">
            <button class="btn-secondary" onclick='previewDocumentService("${doc.id}")'>👁️ Voir</button>
            <button class="btn-secondary" onclick='modifierDocumentService("${doc.id}")'>✏️ Modifier</button>
            <button class="btn-supprimer" onclick='supprimerDocumentService("${doc.id}")'>🗑️</button>
        </div>
    `;
    return div;
}

// Fonctions pour toggle les dossiers
function toggleMainFolder(dossierId) {
    const folderContent = document.getElementById(`folder-${dossierId}`);
    const toggleButton = event?.target || document.querySelector(`[onclick="toggleMainFolder('${dossierId}')"]`);
    if (folderContent && toggleButton) {
        folderContent.classList.toggle('open');
        toggleButton.textContent = folderContent.classList.contains('open') ? '▲' : '▼';
    }
}

function toggleSubFolder(dossierId, sousDossierId) {
    const sousDossierFullId = `${dossierId}-${sousDossierId}`;
    const folderContent = document.getElementById(`folder-${sousDossierFullId}`);
    const toggleButton = event?.target || document.querySelector(`[onclick="toggleSubFolder('${dossierId}', '${sousDossierId}')"]`);
    if (folderContent && toggleButton) {
        folderContent.classList.toggle('open');
        toggleButton.textContent = folderContent.classList.contains('open') ? '▲' : '▼';
    }
}

// Modifier un document dans un service
function modifierDocumentService(docId) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
        alert('Document introuvable');
        return;
    }
    
    documentEnModification = { ...doc, index: documents.findIndex(d => d.id === docId) };
    
    // Afficher le formulaire
    const typeContainer = document.getElementById('type-document-container');
    if (typeContainer) {
        typeContainer.classList.remove('hidden');
        
        // Pré-remplir les sélecteurs
        const selectService = document.getElementById('select-service');
        const selectDossier = document.getElementById('dossier-principal');
        const selectSousDossier = document.getElementById('sous-dossier');
        
        if (selectService && doc.service) {
            selectService.value = doc.service;
            mettreAJourDossiers();
            setTimeout(() => {
                if (selectDossier && doc.dossier) {
                    selectDossier.value = doc.dossier;
                    mettreAJourSousDossiers();
                    setTimeout(() => {
                        if (selectSousDossier && doc.sousDossier) {
                            selectSousDossier.value = doc.sousDossier;
                        }
                    }, 100);
                }
            }, 100);
        }
    }
    
    // Générer le formulaire selon le type
    if (doc.type) {
        gererChangementTypeDocument(doc.type);
    }
}

// Supprimer un document dans un service
function supprimerDocumentService(docId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const index = documents.findIndex(d => d.id === docId);
    if (index === -1) {
        alert('Document introuvable');
        return;
    }
    
    documents.splice(index, 1);
    localStorage.setItem('documents', JSON.stringify(documents));
    
    if (currentService) {
        afficherDocumentsParService(currentService);
    }
    mettreAJourStatistiques();
    alert('Document supprimé avec succès');
}

// Prévisualiser un document dans un service
function previewDocumentService(docId) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
        alert('Document introuvable');
        return;
    }
    
    // Créer une modal pour afficher le document
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:2rem;';
    
    const titre = doc.donnees?.titre || doc.titre || 'Document';
    const fichier = doc.donnees?.fichier;
    const typeFichier = doc.donnees?.typeFichier || '';
    const nomFichier = doc.donnees?.nomFichier || '';
    
    let contenuModal = `
        <div style="background:white;padding:2rem;border-radius:1rem;max-width:95vw;max-height:95vh;overflow:auto;position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <h3>${titre}</h3>
                <button onclick="this.closest('div[style*=\\'position:fixed\\']').remove()" class="btn-secondary" style="padding:0.5rem 1rem;">✕ Fermer</button>
            </div>
    `;
    
    // Si le document a un fichier (PDF, image, etc.)
    if (fichier && (typeFichier.includes('pdf') || typeFichier.includes('image') || fichier.startsWith('data:image') || fichier.startsWith('data:application/pdf'))) {
        if (typeFichier.includes('pdf') || fichier.startsWith('data:application/pdf')) {
            // Afficher un PDF
            contenuModal += `
                <iframe src="${fichier}" style="width:100%;height:70vh;border:none;border-radius:0.5rem;"></iframe>
                <p style="margin-top:1rem;color:#6c757d;"><small>Fichier: ${nomFichier}</small></p>
            `;
        } else if (typeFichier.includes('image') || fichier.startsWith('data:image')) {
            // Afficher une image
            contenuModal += `
                <img src="${fichier}" style="max-width:100%;max-height:70vh;border-radius:0.5rem;display:block;margin:0 auto;" alt="${titre}" />
                <p style="margin-top:1rem;color:#6c757d;"><small>Fichier: ${nomFichier}</small></p>
            `;
        }
    } else if (fichier) {
        // Fichier autre que PDF/image, proposer le téléchargement
        contenuModal += `
            <div style="text-align:center;padding:2rem;">
                <p>📄 Fichier: ${nomFichier}</p>
                <p style="color:#6c757d;">Type: ${typeFichier || 'Non spécifié'}</p>
                <a href="${fichier}" download="${nomFichier}" class="btn-primary" style="margin-top:1rem;display:inline-block;">📥 Télécharger</a>
            </div>
        `;
    } else {
        // Pas de fichier, afficher les données
        contenuModal += `
            <div style="background:#f8f9fa;padding:1rem;border-radius:0.5rem;">
                <pre style="white-space:pre-wrap;word-wrap:break-word;">${JSON.stringify(doc.donnees || doc, null, 2)}</pre>
            </div>
        `;
    }
    
    contenuModal += `
            <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #dee2e6;">
                <p><strong>Client:</strong> ${doc.donnees?.client || '-'}</p>
                <p><strong>Numéro:</strong> ${doc.donnees?.numero || '-'}</p>
                <p><strong>Date:</strong> ${doc.dateAjout ? new Date(doc.dateAjout).toLocaleDateString('fr-FR') : '-'}</p>
            </div>
        </div>
    `;
    
    modal.innerHTML = contenuModal;
    document.body.appendChild(modal);
    
    // Fermer avec Escape
    const fermerModal = () => {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
    };
    
    const handleEscape = (e) => {
        if (e.key === 'Escape') fermerModal();
    };
    
    document.addEventListener('keydown', handleEscape);
    
    // Fermer en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fermerModal();
    });
}