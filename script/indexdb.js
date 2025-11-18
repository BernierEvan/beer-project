// Open or Create database, 1 is meant to execute onupgradeneeded if the database doesn't exist
let myDb;
const request = indexedDB.open('BeerDatabase', 2);
// function called if the database is created or updated
request.onupgradeneeded = event => {
  const db = event.target.result;

  // Create a Table(called objectStore), keyPath = 'id' => chaque enregistrement aura une clé unique : id
  const objectStore = db.createObjectStore('BeerDatabase2', { keyPath: 'name' });

  // Creation of an index to do quick search, unique:false mean that more than one item can have the same value for "propertyName"
  objectStore.createIndex('indexName', 'propertyName', { unique: false });

  console.log('Base de données initialisée avec succès');
};

// is called when the database is successfully open
request.onsuccess = event => {
  const db = event.target.result; // we catch the database access

  console.log("Base ouverte et prête à l'emploi");

  // array example containing beers
  let i = 1;

  // start a read/write transaction
  const transaction = db.transaction(['BeerDatabase2'], 'readwrite');

  //catch the objectStore object
  const objectStore = transaction.objectStore('BeerDatabase2');
};

async function addToStore(beerarray) {
  beerarray.forEach(element => {
    const transaction = db.transaction(['BeerDatabase'], 'readwrite'); // start a read/write transaction
    transaction.oncomplete = () => {
      console.log('Transaction succeeded');
    };

    transaction.onerror = () => {
      console.error("Erreur dans la transaction d'ajout");
    };

    const objectStore = transaction.objectStore('BeerDatabase2'); //catch the objectStore object
    objectStore.onsuccess = () => {
      console.log('objectStore creation Success');
    };
    objectStore.onerror = () => {
      console.log('objectStore creation Error');
    };

    const addRequest = objectStore.add({ element }); // New Registry in objectStore
    addRequest.onsuccess = () => {
      console.log(`Bière ajouté avec succès : ${element} `);
    };

    addRequest.onerror = () => {
      console.error(`Erreur lors de l'ajout de la bière n°${i}`);
    };

    i++;
  });
}

//if the database can't be open
request.onerror = event => {
  console.error("Erreur lors de l'ouverture de la base Indexeddb");
};
