// Variables Globales
let pageAll = 1;
var allBeers = [];
const cardContainer = document.getElementById('beer-card');
const searchInput = document.getElementById('searchIndex');
const loadMoreButton = document.getElementById('loadMore');
const suggestionsList = document.getElementById('suggestions-list');

function displayBeers(beersToDisplay, append = false) {
  let html = '';

  if (beersToDisplay.length === 0 && !append) {
    cardContainer.innerHTML =
      '<div class="col-12"><p class="text-muted fs-4">Aucune bière trouvée correspondant à votre recherche.</p></div>';
    return;
  }

  beersToDisplay.forEach(beer => {
    const imageUrl = `https://punkapi.online/v3/images/${beer.image}`;

    html += `
            <div class="col-md-4">
                <div class="card h-100">
                    <img class="card-img-top p-3" src="${imageUrl}" alt="${
      beer.name
    }" style="height:300px; object-fit:contain;">
                    <div class="card-body">
                        <h5 class="card-title">${beer.name}</h5>
                        <p class="card-text">${beer.description.substring(0, 100)}...</p>
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
 * Charge les bières depuis l'API.
 */
function loadBeers(page, append) {
  fetch(`https://punkapi.online/v3/beers?page=${page}`)
    .then(response => response.json())
    .then(dataJson => {
      if (dataJson.length > 0) {
        allBeers = allBeers.concat(dataJson);
        displayBeers(dataJson, append);
      } else {
        loadMoreButton.disabled = true;
        loadMoreButton.textContent = 'Toutes les bières ont été chargées.';
      }
      addToStore(allBeers);
      console.log(allBeers);
    })
    .catch(error => {
      console.error('Erreur de chargement des bières:', error);
      cardContainer.innerHTML =
        '<div class="col-12"><p class="text-danger">Erreur lors du chargement des bières.</p></div>';
    });
}

// --- Nouvelle fonction pour les suggestions ---
function showSuggestions(filteredBeers) {
  suggestionsList.innerHTML = ''; // Nettoie la liste précédente

  // Limite à 10 suggestions pour garder la liste courte et rapide
  filteredBeers.slice(0, 10).forEach(beer => {
    const li = document.createElement('li');
    li.textContent = beer.name;

    // Ajouter un événement pour cliquer sur la suggestion
    li.addEventListener('click', () => {
      searchInput.value = beer.name; // Remplir l'input
      suggestionsList.innerHTML = ''; // Vider les suggestions

      // Afficher uniquement la bière sélectionnée dans le catalogue principal
      displayBeers([beer], false);
    });
    suggestionsList.appendChild(li);
  });

  // Masquer la liste s'il n'y a pas de suggestions ou si le champ est vide
  if (filteredBeers.length === 0 || searchInput.value.trim() === '') {
    suggestionsList.innerHTML = '';
  }
}

// --- Gestion des Événements ---

// 1. Logique de Filtrage et d'Autocomplétion
searchInput.addEventListener('input', () => {
  const valueInput = searchInput.value.toLowerCase().trim();

  const filteredBeers = allBeers.filter(beer =>
    // Filtrer la liste globale pour l'autocomplétion
    beer.name.toLowerCase().includes(valueInput)
  );

  // Affiche les suggestions sous l'input
  showSuggestions(filteredBeers);

  // Affiche également les résultats filtrés dans le catalogue principal immédiatement
  displayBeers(filteredBeers, false);
});

// 2. Bouton "Charger plus"
loadMoreButton.addEventListener('click', () => {
  pageAll++;
  loadBeers(pageAll, true);
});

// 3. Chargement Initial
document.addEventListener('DOMContentLoaded', () => {
  loadBeers(pageAll, false);
});
