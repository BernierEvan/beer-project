// Module IndexedDB pour gérer le cache des bières
const DB_NAME = 'BeerDB';
const DB_VERSION = 1;
const STORE_NAME = 'beers';

let db = null;

/**
 * Initialise la base de données IndexedDB
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    console.log('Initialisation de la base de données...');
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const database = event.target.result;

      // Créer l'object store si nécessaire
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        console.log('Object store créé');
      }
    };

    request.onsuccess = event => {
      db = event.target.result;
      console.log('Base de données initialisée avec succès');
      resolve(db);
    };

    request.onerror = event => {
      console.error("Erreur d'ouverture de la base de données:", event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Ajoute des bières à la base de données
 */
async function addBeers(beersArray) {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    beersArray.forEach(beer => {
      store.put(beer); // put au lieu de add pour éviter les doublons
    });

    transaction.oncomplete = () => {
      console.log(`${beersArray.length} bière(s) ajoutée(s) à la base`);
      resolve();
    };

    transaction.onerror = event => {
      console.error("Erreur lors de l'ajout des bières:", event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Récupère toutes les bières de la base de données
 */
async function getBeers() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = event => {
      resolve(event.target.result || []);
    };

    request.onerror = event => {
      console.error('Erreur lors de la récupération des bières:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Récupère le dernier ID utilisé
 */
async function getLastId() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor(null, 'prev'); // Curseur en ordre inverse

    request.onsuccess = event => {
      const cursor = event.target.result;
      if (cursor) {
        // On a trouvé la dernière bière
        resolve(cursor.value.id);
      } else {
        // Aucune bière, on commence à 0
        resolve(0);
      }
    };

    request.onerror = event => {
      console.error('Erreur lors de la récupération du dernier ID:', event.target.error);
      resolve(0); // En cas d'erreur, on commence à 0
    };
  });
}

/**
 * Supprime toutes les bières de la base de données
 */
async function clearBeers() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('Base de données vidée');
      resolve();
    };

    request.onerror = event => {
      console.error('Erreur lors du vidage:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Initialiser automatiquement la base de données
(async () => {
  try {
    await initDB();

    // Exposer l'API globalement pour script.js et beerClass.js
    window.BeerDB = {
      addBeers,
      getBeers,
      clearBeers,
      getLastId,
      initDB,
    };

    console.log('✅ BeerDB API exposée globalement');
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de BeerDB:", error);
  }
})();

// Exports pour les modules ES6
export { initDB, addBeers, getBeers, clearBeers, getLastId };
