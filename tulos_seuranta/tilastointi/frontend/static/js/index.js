import Dashboard from './views/Dashboard.js';
import Ottelut from './views/Ottelut.js';
import Tilastot from './views/Tilastot.js';
import Hallinto from './views/Hallinto.js';
import Livehallinto from './views/Livehallinto.js';

/* Tehdään reititysjärjestelmä, joka mahdollistaa näkymien lataamisen URL-osoitteen perusteella */

// Polun muuttaminen regex-muotoon
const pathToRegex = (path) =>
  new RegExp('^' + path.replace(/\//g, '\\/').replace(/:\w+/g, '(.+)') + '$');

// parametrien haku polusta
const getParams = (match) => {
  const values = match.result.slice(1);
  const keys = Array.from(
    match.route.path.matchAll(/:\w+/g).map((result) => result[1])
  );

  return Object.fromEntries(
    keys.map((key, i) => {
      return [key, values[i]];
    })
  );
};

// Navigoi uuteen URL-osoitteeseen ja päivittää näkymän
const navigateTo = (url) => {
  history.pushState(null, null, url);
  router();
};

// Reititys URL-osoitteen mukaan oikeaan näkymään
const router = async () => {
  const routes = [
    { path: '/', view: Dashboard },
    { path: '/hallinto', view: Hallinto },
    { path: '/ottelut', view: Ottelut },
    { path: '/tilastot', view: Tilastot },
    { path: '/hallinto:live', view: Livehallinto },
  ];

  const potentialMatches = routes.map((route) => {
    return {
      route: route,
      result: location.pathname.match(pathToRegex(route.path)),
    };
  });

  let match = potentialMatches.find(
    (potentialMatch) => potentialMatch.result !== null
  );

  if (!match) {
    match = {
      route: routes[0],
      result: [location.pathname],
    };
  }

  const view = new match.route.view(getParams(match));

  document.querySelector('#app').innerHTML = await view.getHtml();
  view.addEventListeners();
};

window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    if (e.target.matches('[data-link]')) {
      e.preventDefault();
      navigateTo(e.target.href);
    }
  });
  router();
});
