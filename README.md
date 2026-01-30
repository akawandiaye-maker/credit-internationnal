# CISA - Logiciel d'Archivage Électronique

Système complet d'archivage électronique pour banques avec backend PHP et base de données MySQL.

## 🚀 Installation

### Prérequis

- PHP 7.4 ou supérieur
- MySQL 5.7 ou supérieur (ou MariaDB)
- Serveur web (Apache/Nginx)
- Extensions PHP requises :
  - PDO
  - PDO_MySQL
  - GD (pour traitement d'images si nécessaire)
  - Fileinfo

### Configuration

1. **Cloner ou copier les fichiers** dans votre répertoire web (ex: `htdocs`, `www`, etc.)

2. **Configurer la base de données** :
   - Créer une base de données MySQL
   - Modifier les paramètres dans `config.php` :
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'cisa_banque');
     define('DB_USER', 'root');
     define('DB_PASS', '');
     ```

3. **Importer le schéma de la base de données** :
   ```bash
   mysql -u root -p < schema.sql
   ```
   Ou via phpMyAdmin : importer le fichier `schema.sql`

4. **Créer le dossier uploads** (si pas déjà créé) :
   ```bash
   mkdir uploads
   chmod 755 uploads
   ```
   
   Le dossier `uploads` doit être accessible en écriture par le serveur web.

5. **Configurer les permissions** :
   - Le dossier `uploads/` doit être accessible en écriture (chmod 755 ou 777)
   - Les fichiers PHP doivent être lisibles

### Compte administrateur par défaut

Un compte administrateur est créé automatiquement :
- **Email** : `admin@cisa.com`
- **Mot de passe** : `admin123`

⚠️ **IMPORTANT** : Changez le mot de passe après la première connexion !

## 📁 Structure du projet

```
banque2/
├── api/                    # API PHP backend
│   ├── auth.php           # Authentification
│   ├── users.php          # Gestion utilisateurs (Admin)
│   ├── accounts.php       # Gestion comptes
│   ├── documents.php      # Gestion documents
│   └── stats.php          # Statistiques
├── uploads/               # Dossier de stockage des fichiers
│   └── .htaccess         # Protection des fichiers
├── config.php            # Configuration et connexion DB
├── schema.sql            # Schéma de base de données
├── index.php             # Page principale (anciennement interface.html)
├── interface.css         # Styles
├── interface.js          # JavaScript frontend
├── api-helper.js         # Helper JavaScript pour les API
├── logo.jpg              # Logo
├── dark.jpg              # Image
└── README.md             # Ce fichier
```

## 🔧 Fonctionnalités

### Authentification
- Connexion / Déconnexion
- Inscription
- Gestion de session PHP
- Récupération de mot de passe (structure préparée)

### Gestion des utilisateurs (Admin)
- Création / Modification / Suppression
- Rôles : Admin, Agent, Consultation
- Gestion des mots de passe

### Gestion des comptes
- Comptes particuliers
- Comptes entreprises
- Recherche et pagination

### Gestion des documents
- Upload de fichiers (PDF, Word, Images)
- Organisation par services, dossiers et sous-dossiers
- Recherche avancée
- Téléchargement
- Suppression

### Services disponibles
- 💼 Compte
- 📊 Comptabilité
- 👥 Ressources Humaines
- 🌍 Service Étranger
- 🔍 Audit
- ⚠️ Service Risque

### Statistiques
- Tableau de bord avec statistiques
- Documents par service
- Documents récents
- Statistiques détaillées

## 🔐 Sécurité

- Mots de passe hashés avec `password_hash()` (bcrypt)
- Sessions PHP sécurisées
- Protection contre les injections SQL (PDO Prepared Statements)
- Validation des types de fichiers
- Limitation de taille de fichiers (10MB par défaut)
- Protection du dossier uploads via .htaccess

## 📝 Utilisation

1. **Accéder à l'application** :
   ```
   http://localhost/banque2/
   ```

2. **Se connecter** avec le compte admin ou créer un nouveau compte

3. **Utiliser les fonctionnalités** :
   - Ajouter des comptes (particuliers ou entreprises)
   - Uploader des documents
   - Rechercher des documents
   - Consulter les statistiques

## 🔄 Migration depuis localStorage

Le système a été migré de localStorage vers PHP/MySQL. Les anciennes données localStorage ne sont plus utilisées. Toutes les données sont maintenant stockées dans la base de données MySQL.

## 🛠️ Développement

### API Endpoints

Tous les endpoints sont dans le dossier `api/` :

- **Authentification** : `api/auth.php?action={login|register|logout|check}`
- **Utilisateurs** : `api/users.php?action={list|get|create|update|delete|change-password}`
- **Comptes** : `api/accounts.php?action={list|get|create|update|delete|search}&type={particulier|entreprise}`
- **Documents** : `api/documents.php?action={list|get|upload|update|delete|download|search}`
- **Statistiques** : `api/stats.php?action={dashboard|by-service|by-dossier|recent}`

### Utilisation des APIs en JavaScript

Le fichier `api-helper.js` fournit des fonctions wrapper :

```javascript
// Connexion
const result = await CISA_API.Auth.login('email@example.com', 'password');

// Lister les comptes
const accounts = await CISA_API.Accounts.list('particulier', 1, 20);

// Uploader un document
const file = document.getElementById('file-input').files[0];
const result = await CISA_API.Documents.upload({
    titre: 'Mon document',
    service: 'compte',
    dossier: 'dossier1',
    sousDossier: 'sous-dossier1'
}, file);

// Obtenir les statistiques
const stats = await CISA_API.Stats.getDashboard();
```

## ⚠️ Notes importantes

1. **Changement de mot de passe admin** : Changez le mot de passe par défaut dès la première connexion
2. **Sauvegarde** : Faites des sauvegardes régulières de la base de données
3. **Permissions** : Vérifiez que le dossier `uploads/` est accessible en écriture
4. **HTTPS** : En production, utilisez HTTPS et modifiez `config.php` pour activer les cookies sécurisés

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifiez les paramètres dans `config.php`
- Vérifiez que MySQL est démarré
- Vérifiez que la base de données existe

### Erreur d'upload de fichiers
- Vérifiez les permissions du dossier `uploads/`
- Vérifiez la taille maximale dans `php.ini` (`upload_max_filesize`, `post_max_size`)
- Vérifiez que le type de fichier est autorisé

### Session ne fonctionne pas
- Vérifiez que les sessions PHP sont activées
- Vérifiez les permissions du dossier de sessions PHP

## 📞 Support

Pour toute question ou problème, contactez le support technique.

---

**CISA** - Credit International  
© 2025 - Tous droits réservés
