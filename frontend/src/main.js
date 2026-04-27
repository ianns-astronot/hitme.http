import './style.css';
import './app.css';

import logo from './assets/images/logo-universal.png';
import {GetCollections, CreateCollection} from '../wailsjs/go/main/App';

document.querySelector('#app').innerHTML = `
    <img id="logo" class="logo">
    <div class="result" id="result">HitMe HTTP - Phase 0 Test</div>
    <div class="input-box" id="input">
      <input class="input" id="collectionName" type="text" placeholder="Collection Name" autocomplete="off" />
      <button class="btn" onclick="createCollection()">Create Collection</button>
      <button class="btn" onclick="loadCollections()">Load Collections</button>
    </div>
    <div id="collections"></div>
`;
document.getElementById('logo').src = logo;

let nameElement = document.getElementById("collectionName");
nameElement.focus();
let resultElement = document.getElementById("result");
let collectionsElement = document.getElementById("collections");

// Setup the createCollection function
window.createCollection = function () {
    let name = nameElement.value;
    if (name === "") return;

    try {
        CreateCollection(name)
            .then((result) => {
                resultElement.innerText = `Created: ${result.name} (ID: ${result.id})`;
                nameElement.value = "";
                loadCollections();
            })
            .catch((err) => {
                resultElement.innerText = `Error: ${err}`;
                console.error(err);
            });
    } catch (err) {
        console.error(err);
    }
};

// Setup the loadCollections function
window.loadCollections = function () {
    try {
        GetCollections()
            .then((collections) => {
                if (collections && collections.length > 0) {
                    collectionsElement.innerHTML = `<h3>Collections (${collections.length}):</h3>` +
                        collections.map(c => `<div>- ${c.name} (${c.id})</div>`).join('');
                } else {
                    collectionsElement.innerHTML = '<div>No collections yet</div>';
                }
            })
            .catch((err) => {
                collectionsElement.innerHTML = `Error loading: ${err}`;
                console.error(err);
            });
    } catch (err) {
        console.error(err);
    }
};

// Load collections on startup
loadCollections();
