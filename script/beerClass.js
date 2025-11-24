export class Beer {
  constructor(beerName, beerDesc, ABV) {
    this._name = beerName;
    this._desc = beerDesc;
    this._abv = ABV;
    this._imgPath = '/assets/img/personalized_beer.png';
  }

  // Convertir l'objet en format compatible avec l'API et IndexedDB
  async toAPIFormat() {
    // Récupérer le dernier ID et incrémenter
    let newId = Date.now(); // ID par défaut si BeerDB n'est pas disponible

    if (typeof window.BeerDB !== 'undefined') {
      const lastId = await window.BeerDB.getLastId();
      newId = lastId + 1;
    }

    return {
      id: newId, // ID incrémenté
      name: this._name,
      description: this._desc,
      abv: parseFloat(this._abv),
      image: 'personalized_beer.png', // Nom du fichier seulement
      tagline: 'Bière personnalisée', // Ajout d'une tagline par défaut
      first_brewed: new Date().toLocaleDateString('fr-FR'), // Date actuelle
      isCustom: true, // Marqueur pour identifier les bières personnalisées
    };
  }

  beerToJson() {
    return JSON.stringify(this.toAPIFormat());
  }

  async addObjectToDB() {
    try {
      const beerData = await this.toAPIFormat(); // Maintenant async

      console.log("Tentative d'ajout de la bière:", beerData);

      // Vérifier que BeerDB est disponible
      if (typeof window.BeerDB === 'undefined') {
        console.error("BeerDB n'est pas disponible");
        return false;
      }

      // Ajouter la bière à IndexedDB
      await window.BeerDB.addBeers([beerData]);
      console.log('✅ Bière ajoutée avec succès:', beerData.name, '(ID:', beerData.id + ')');

      // Émettre un événement pour notifier les autres pages
      window.dispatchEvent(new CustomEvent('beerAdded', { detail: beerData }));

      return true;
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de la bière:", error);
      return false;
    }
  }
}
