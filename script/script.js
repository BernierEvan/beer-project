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

console.log('🔍 Script chargé');

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/serviceworker.js', { scope: '/' })
      .then(reg => {
        console.log('✅ Service Worker enregistré:', reg.scope);

        if (reg.installing) {
          console.log("⏳ Service Worker en cours d'installation");
        } else if (reg.waiting) {
          console.log('⏸️ Service Worker en attente');
        } else if (reg.active) {
          console.log('✅ Service Worker actif');
        }

        if (window.matchMedia('(display-mode: standalone)').matches) {
          console.log('ℹ️ App déjà installée (mode standalone)');
        }
      })
      .catch(error => {
        console.error('❌ Erreur Service Worker:', error);
      });
  });
} else {
  console.warn('⚠️ Service Worker non supporté');
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
 * Gère l'installation de la PWA
 */
async function handleInstallClick() {
  console.log('🖱️ CLIC SUR LE BOUTON INSTALL DÉTECTÉ');

  if (!installPrompt) {
    console.error('⚠️ installPrompt est null');
    console.log('Vérifications:');
    console.log('- App déjà installée?', window.matchMedia('(display-mode: standalone)').matches);
    console.log(
      '- HTTPS?',
      window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    );
    alert(
      "Installation non disponible. L'app est peut-être déjà installée ou les conditions ne sont pas remplies."
    );
    return;
  }

  console.log('✅ installPrompt disponible, affichage du prompt...');

  try {
    // Afficher le prompt d'installation
    const result = await installPrompt.prompt();
    console.log(`📊 Choix de l'utilisateur: ${result.outcome}`);

    if (result.outcome === 'accepted') {
      console.log('✅ Installation acceptée');
    } else {
      console.log('❌ Installation refusée');
    }

    // Réinitialiser installPrompt
    installPrompt = null;

    // Masquer le bouton
    if (installButton) {
      installButton.setAttribute('hidden', '');
      console.log('🔒 Bouton masqué après installation');
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'installation:", error);
    alert("Erreur lors de l'installation: " + error.message);
  }
}

/**
 * Configure le bouton d'installation
 */
function setupInstallButton() {
  installButton = document.querySelector('#install');

  if (!installButton) {
    console.error('❌ Bouton #install introuvable dans le DOM !');
    return;
  }

  console.log('✅ Bouton #install trouvé');
  console.log('📍 Type du bouton:', installButton.tagName);
  console.log('📍 ID du bouton:', installButton.id);
  console.log('📍 Hidden initial:', installButton.hasAttribute('hidden'));

  // SUPPRIMER tous les anciens event listeners en clonant le bouton
  const newButton = installButton.cloneNode(true);
  installButton.parentNode.replaceChild(newButton, installButton);
  installButton = newButton;

  // Ajouter UN SEUL event listener
  installButton.addEventListener('click', handleInstallClick);
  console.log('✅ Event listener ajouté au bouton');

  // Test du bouton
  installButton.addEventListener(
    'click',
    () => {
      console.log('🔔 Clic détecté sur le bouton (listener de test)');
    },
    { once: true }
  );
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

// 5. PWA Installation - Initialisation
// Vérifier si le DOM est déjà chargé ou attendre qu'il le soit
if (document.readyState === 'loading') {
  console.log('⏳ DOM en cours de chargement, attente...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log('✅ DOM déjà chargé, initialisation immédiate');
  initializeApp();
}

function initializeApp() {
  console.log("📄 Initialisation de l'application...");

  // Configurer le bouton d'installation
  setupInstallButton();

  // Initialiser l'application
  initApp();
}

// ⭐ ÉVÉNEMENT CLÉ: beforeinstallprompt
window.addEventListener('beforeinstallprompt', event => {
  console.log('🎉 ========================================');
  console.log('🎉 beforeinstallprompt DÉCLENCHÉ !');
  console.log('🎉 ========================================');

  event.preventDefault();
  installPrompt = event;

  console.log('📦 installPrompt stocké:', !!installPrompt);

  if (installButton) {
    installButton.removeAttribute('hidden');
    console.log('👁️ Bouton install RENDU VISIBLE');
    console.log('📍 Hidden après reveal:', installButton.hasAttribute('hidden'));
  } else {
    console.error("❌ installButton est null, impossible d'afficher le bouton");
    // Réessayer de trouver le bouton
    setTimeout(() => {
      setupInstallButton();
      if (installButton) {
        installButton.removeAttribute('hidden');
        console.log('👁️ Bouton trouvé et affiché (2ème tentative)');
      }
    }, 100);
  }
});

// Événement appinstalled
window.addEventListener('appinstalled', () => {
  console.log('🎊 ========================================');
  console.log('🎊 APP INSTALLÉE AVEC SUCCÈS !');
  console.log('🎊 ========================================');

  installPrompt = null;

  if (installButton) {
    installButton.setAttribute('hidden', '');
  }
});

// Debug: afficher l'état toutes les 5 secondes
setInterval(() => {
  if (installButton && !installButton.hasAttribute('hidden')) {
    console.log('🔍 État du bouton install:');
    console.log('  - Visible:', !installButton.hasAttribute('hidden'));
    console.log('  - installPrompt disponible:', !!installPrompt);
    console.log('  - Disabled:', installButton.disabled);
  }
}, 5000);
