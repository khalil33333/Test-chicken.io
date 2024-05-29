// Artikeldata och pallinformation
let artikelData = {
  röd: { artikelnummer: [1311, 1111, 1112, 1168, 1391, 1361, 1161], maxLav: 8, maxLådorPerLav: 8, minLav: 3 },
  grön: { artikelnummer: [1047, 1057, 10422, 10622, 3467, 3567], maxLav: 7, maxLådorPerLav: 4, minLav: 3 },
  svart: { artikelnummer: [1176, 1173, 1222], maxLav: 6, maxLådorPerLav: 8, minLav: 3 },
  blå1: { artikelnummer: [5585, 1167, 4762, 4732], maxLav: 11, maxLådorPerLav: 8, minLav: 4 },
  blå2: { artikelnummer: [2701, 2704, 2703, 2706, 2700], maxLav: 16, maxLådorPerLav: 8, minLav: 4 }
};

function submitOrder() {
  const orderInput = document.getElementById('orderInput').value;
  const orderLines = orderInput.split('\n');
  const order = orderLines.map(line => {
      const [artikelnummer, kvantitet] = line.split(':').map(item => item.trim());
      return { artikelnummer: parseInt(artikelnummer), kvantitet: parseInt(kvantitet) };
  });

  processOrder(order);
}

function addArticle() {
  const artikelnummer = parseInt(document.getElementById('newArtikelnummer').value);
  const sort = document.getElementById('newSort').value;

  if (artikelnummer && sort && artikelData[sort]) {
      artikelData[sort].artikelnummer.push(artikelnummer);
      alert(`Artikelnummer ${artikelnummer} har lagts till i sort ${sort}.`);
  } else {
      alert('Vänligen fyll i både artikelnummer och sort korrekt.');
  }

  // Rensa fälten efter tillägg
  document.getElementById('newArtikelnummer').value = '';
  document.getElementById('newSort').value = 'röd';
}

function processOrder(order) {
  const pickLists = {
      fulla: [],
      halva: [],
      blandad: []
  };

  // Sortera orderartiklar efter artikelnummer
  order.sort((a, b) => a.artikelnummer - b.artikelnummer);

  // Tilldela till pallar
  order.forEach(artikel => {
      const artikelTyp = getArtikelTyp(artikel.artikelnummer);
      if (artikelTyp) {
          const maxLav = artikelData[artikelTyp].maxLav;
          const maxLådorPerLav = artikelData[artikelTyp].maxLådorPerLav;
          const minLav = artikelData[artikelTyp].minLav;

          const fullLav = Math.floor(artikel.kvantitet / (maxLav * maxLådorPerLav));
          const remaining = artikel.kvantitet % (maxLav * maxLådorPerLav);

          for (let i = 0; i < fullLav; i++) {
              pickLists.fulla.push({
                  artikelnummer: artikel.artikelnummer,
                  kvantitet: maxLav * maxLådorPerLav
              });
          }

          if (remaining > 0) {
              if (remaining >= minLav * maxLådorPerLav) {
                  pickLists.halva.push({
                      artikelnummer: artikel.artikelnummer,
                      kvantitet: remaining
                  });
              } else {
                  pickLists.blandad.push({
                      artikelnummer: artikel.artikelnummer,
                      kvantitet: remaining
                  });
              }
          }
      }
  });

  // Optimera pallar för att kombinera mindre kvantiteter till halva pallar och fulla pallar
  optimizePallets(pickLists);

  generatePickLists(pickLists);
}

function getArtikelTyp(artikelnummer) {
  for (const typ in artikelData) {
      if (artikelData[typ].artikelnummer.includes(artikelnummer)) {
          return typ;
      }
  }
  return null;
}

function optimizePallets(pickLists) {
  // Kombinera blandade lådor till halva pallar om möjligt
  let mixed = [...pickLists.blandad];
  pickLists.blandad = [];

  while (mixed.length > 0) {
      let mixedItem = mixed.pop();

      // Försök hitta en halv pall att kombinera med
      let combined = false;
      for (let i = 0; i < pickLists.halva.length; i++) {
          let halfItem = pickLists.halva[i];
          const artikelTyp = getArtikelTyp(halfItem.artikelnummer);
          const maxLav = artikelData[artikelTyp].maxLav;
          const maxLådorPerLav = artikelData[artikelTyp].maxLådorPerLav;

          if (mixedItem.artikelnummer !== halfItem.artikelnummer &&
              (mixedItem.kvantitet + halfItem.kvantitet) <= maxLav * maxLådorPerLav) {
              halfItem.kvantitet += mixedItem.kvantitet;
              combined = true;
              break;
          }
      }

      // Om ingen passande halv pall hittades, skapa en ny
      if (!combined) {
          pickLists.halva.push(mixedItem);
      }
  }

  // Kontrollera om några halva pallar nu kan kombineras till fulla pallar
  for (let i = 0; i < pickLists.halva.length; i++) {
      let halfItem = pickLists.halva[i];
      const artikelTyp = getArtikelTyp(halfItem.artikelnummer);
      const maxLav = artikelData[artikelTyp].maxLav;
      const maxLådorPerLav = artikelData[artikelTyp].maxLådorPerLav;

      if (halfItem.kvantitet >= maxLav * maxLådorPerLav) {
          pickLists.fulla.push(halfItem);
          pickLists.halva.splice(i, 1);
          i--;  // Justera indexet eftersom vi tog bort en artikel från listan
      }
  }
}

function generatePickLists(pickLists) {
  const pickListsContainer = document.getElementById('pickLists');
  pickListsContainer.innerHTML = '';

  for (const type in pickLists) {
      const list = pickLists[type];
      if (list.length > 0) {
          const listElement = document.createElement('div');
          listElement.classList.add('pickList');

          const title = document.createElement('h3');
          title.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} pallar`;
          listElement.appendChild(title);

          const itemList = document.createElement('ul');

          // Gruppartiklar
          const groupedItems = {};
          list.forEach(item => {
              if (!groupedItems[item.artikelnummer]) {
                  groupedItems[item.artikelnummer] = [];
              }
              groupedItems[item.artikelnummer].push(item.kvantitet);
          });

          // Skapa listan utan att repetera artikelnummer
          for (const artikelnummer in groupedItems) {
              const itemElement = document.createElement('li');
              itemElement.textContent = `${artikelnummer}: ${groupedItems[artikelnummer].join(' ')}`;
              itemList.appendChild(itemElement);
          }

          listElement.appendChild(itemList);
          pickListsContainer.appendChild(listElement);
      }
  }
}
