// Variables Globales
let pageAll = 1;
let allBeers = [];
const cardContainer = document.getElementById('beer-card');
const searchInput = document.getElementById('searchIndex');
const loadMoreButton = document.getElementById('loadMore');
const suggestionsList = document.getElementById('suggestions-list');

// Variable globale pour le bouton d'installation
let installPrompt = null;
let installButton = null;

// Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('serviceworker.js')
    .then(reg => {
      console.log('Registration successful', reg);
    })
    .catch(e => console.error('Error during service worker registration:', e));
} else {
  console.warn('Service Worker is not supported');
}

/**
 * Affiche les bières dans le DOM
 */
function displayBeers(beersToDisplay, append = false) {
  let html = '';

  if (beersToDisplay.length === 0 && !append) {
    cardContainer.innerHTML =
      '<div class="col-12"><p class="text-muted fs-4">Aucune bière trouvée correspondant à votre recherche.</p></div>';
    return;
  }

  beersToDisplay.forEach(beer => {
    const imageUrl = beer.image
      ? `https://punkapi.online/v3/images/${beer.image}`
      : 'https://via.placeholder.com/300x300?text=No+Image';

    const customBadge = beer.isCustom ? '<span class="badge bg-success">Personnalisée</span> ' : '';

    html += `
      <div class="col-md-4">
        <div class="card h-100">
          <img class="card-img-top p-3" src="${imageUrl}" alt="${beer.name}"
              style="height:300px; object-fit:contain;"
              onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
          <div class="card-body">
            <h5 class="card-title">${beer.name}</h5>
            <p class="card-text">${
              beer.description ? beer.description.substring(0, 100) : 'Pas de description'
            }...</p>
            ${customBadge}
            <span class="badge bg-warning text-dark">${beer.abv}% ABV</span>
          </div>
        </div>
      </div>
    `;
  });

  if (append) {
    cardContainer.innerHTML += html;
  } else {
    cardContainer.innerHTML = html;
  }
}

/**
 * Charge les bières depuis l'API
 */
async function loadBeers(page, append) {
  try {
    const response = await fetch(`https://punkapi.online/v3/beers?page=${page}`);
    const dataJson = await response.json();

    if (dataJson.length > 0) {
      if (typeof BeerDB !== 'undefined') {
        await BeerDB.addBeers(dataJson);
      }
      await reloadAllBeers();
    } else {
      loadMoreButton.disabled = true;
      loadMoreButton.textContent = 'Toutes les bières ont été chargées.';
    }

    console.log(`Total bières chargées: ${allBeers.length}`);
  } catch (error) {
    console.error('Erreur de chargement des bières:', error);
    cardContainer.innerHTML =
      '<div class="col-12"><p class="text-danger">Erreur lors du chargement des bières.</p></div>';
  }
}

/**
 * Recharge toutes les bières depuis IndexedDB
 */
async function reloadAllBeers() {
  if (typeof BeerDB !== 'undefined') {
    allBeers = await BeerDB.getBeers();
    allBeers.sort((a, b) => a.id - b.id);
    displayBeers(allBeers, false);
    console.log(`✅ ${allBeers.length} bières rechargées depuis la DB`);
  }
}

/**
 * Affiche les suggestions de recherche
 */
function showSuggestions(filteredBeers) {
  suggestionsList.innerHTML = '';

  filteredBeers.slice(0, 10).forEach(beer => {
    const li = document.createElement('li');
    li.textContent = beer.name;
    li.classList.add('suggestion-item');

    li.addEventListener('click', () => {
      searchInput.value = beer.name;
      suggestionsList.innerHTML = '';
      displayBeers([beer], false);
    });

    suggestionsList.appendChild(li);
  });

  if (filteredBeers.length === 0 || searchInput.value.trim() === '') {
    suggestionsList.innerHTML = '';
  }
}

/**
 * Initialisation de l'application
 */
async function initApp() {
  try {
    if (typeof BeerDB !== 'undefined') {
      const cachedBeers = await BeerDB.getBeers();

      if (cachedBeers.length > 0) {
        allBeers = cachedBeers;
        allBeers.sort((a, b) => a.id - b.id);
        displayBeers(allBeers, false);
        console.log('Bières chargées depuis le cache:', allBeers.length);
      } else {
        await loadBeers(pageAll, false);
      }
    } else {
      await loadBeers(pageAll, false);
    }
  } catch (error) {
    console.error('Erreur initialisation:', error);
    await loadBeers(pageAll, false);
  }
}

/**
 * Désactive le bouton d'installation
 */
function disableInAppInstallPrompt() {
  installPrompt = null;
  if (installButton) {
    installButton.setAttribute('hidden', '');
  }
}

// --- Gestion des Événements ---

// 1. Recherche et autocomplétion
searchInput.addEventListener('input', () => {
  const valueInput = searchInput.value.toLowerCase().trim();

  if (valueInput === '') {
    displayBeers(allBeers, false);
    suggestionsList.innerHTML = '';
    return;
  }

  const filteredBeers = allBeers.filter(beer => beer.name.toLowerCase().includes(valueInput));
  showSuggestions(filteredBeers);
  displayBeers(filteredBeers, false);
});

// 2. Fermer les suggestions si on clique ailleurs
document.addEventListener('click', e => {
  if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
    suggestionsList.innerHTML = '';
  }
});

// 3. Bouton "Charger plus"
loadMoreButton.addEventListener('click', async () => {
  pageAll++;
  await loadBeers(pageAll, true);
});

// 4. Écouter l'événement personnalisé quand une bière est ajoutée
window.addEventListener('beerAdded', async () => {
  console.log('🍺 Nouvelle bière détectée, rechargement...');
  await reloadAllBeers();
});

// 5. PWA Installation
document.addEventListener('DOMContentLoaded', () => {
  installButton = document.querySelector('#install');

  console.log('🔍 Bouton install trouvé:', installButton);

  // Initialiser l'application
  initApp();
});

// Événement beforeinstallprompt
window.addEventListener('beforeinstallprompt', event => {
  console.log('✅ beforeinstallprompt déclenché');
  event.preventDefault();
  installPrompt = event;

  if (installButton) {
    installButton.removeAttribute('hidden');
    console.log('👁️ Bouton install visible');
  }
});

// Click sur le bouton d'installation
document.addEventListener('click', async e => {
  if (e.target && e.target.id === 'install') {
    console.log('🖱️ Clic sur le bouton install');
    if (!installPrompt) {
      console.warn('⚠️ Pas de installPrompt disponible');
      return;
    }
    const result = await installPrompt.prompt();
    console.log(`Install prompt result: ${result.outcome}`);
    disableInAppInstallPrompt();
  }
});

// Événement appinstalled
window.addEventListener('appinstalled', () => {
  console.log('✅ App installée avec succès');
  disableInAppInstallPrompt();
});
