import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose,
  Middleware,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import thunk from 'redux-thunk';

import { createReducer, AppStateInterface } from 'reducers';
import { windowRef } from 'utils/window-ref';
import { processFavorites } from 'modules/markets/helpers/favorites-processor';
import { getNetworkId } from 'modules/contracts/actions/contractCalls';
import { WindowApp } from 'modules/types';
import { augurSdk } from 'services/augursdk';
import { AppStatus } from 'modules/app/store/app-status';
import { PendingOrders } from 'modules/app/store/pending-orders';

// console log middleware
const consoleLog = store => next => action => {
  if (!action) return;
  // const isIgnoreFlag = action.meta != null && action.meta.ignore === true;
  // if (typeof action !== 'function' && !isIgnoreFlag) {
  //   // console.log(action);
  // }
  return next(action);
};

// local storage middleware
const localStorageMiddleware = store => next => action => {
  next(action);
  // const { drafts, analytics, alerts, notifications, favorites, loginAccount, isLogged, isConnected, env, gasPriceInfo, pendingQueue } = AppStatus.get();
  // const { pendingOrders, pendingLiquidityOrders } = PendingOrders.get();
  // if (
  //   !loginAccount?.address ||
  //   !isLogged ||
  //   !isConnected
  // ) {
  //   return;
  // }
  // const { address, affiliate, settings } = loginAccount;
  // const windowApp: WindowApp = windowRef as WindowApp;
  // if (windowApp.localStorage && windowApp.localStorage.setItem) {
  //   const { localStorage } = windowApp;
  //   const networkIdToUse: number = isConnected
  //     ? parseInt(getNetworkId(), 10)
  //     : 1;
  //   let universeId = env.universe;
  //   const Augur = augurSdk ? augurSdk.get() : undefined;
  //   if (Augur) {
  //     universeId = Augur.contracts.universe.address;
  //   }
  //   const universeIdToUse = universeId;
  //   const accountValue = localStorage.getItem(address) || '{}';
  //   let storedAccountData = JSON.parse(accountValue);
  //   if (!storedAccountData || !storedAccountData.selectedUniverse) {
  //     storedAccountData = {
  //       selectedUniverse: { [networkIdToUse]: universeIdToUse },
  //     };
  //   }
  //   const processedFavorites = processFavorites(
  //     favorites,
  //     storedAccountData.favorites,
  //     networkIdToUse,
  //     universeIdToUse
  //   );
  //   localStorage.setItem(
  //     address,
  //     JSON.stringify({
  //       pendingLiquidityOrders,
  //       analytics,
  //       favorites: processedFavorites,
  //       alerts,
  //       notifications,
  //       pendingOrders,
  //       pendingQueue,
  //       drafts,
  //       gasPriceInfo: {
  //         userDefinedGasPrice: gasPriceInfo.userDefinedGasPrice,
  //       },
  //       selectedUniverse: {
  //         ...storedAccountData.selectedUniverse,
  //       },
  //       settings,
  //       affiliate
  //     })
  //   );
  // }
};

let middleware;

if (process.env.NODE_ENV === 'production') {
  middleware = applyMiddleware(thunk, localStorageMiddleware as Middleware);
} else {
  const whenever = require('redux-whenever');
  middleware = compose(
    whenever,
    composeWithDevTools({})(
      applyMiddleware(consoleLog, thunk, localStorageMiddleware as Middleware)
    )
  );
}

const rootReducers = createReducer();
// middleware
const store = createStore(combineReducers({ ...rootReducers }), middleware);

export type AppState = AppStateInterface;

// Keep a copy of the state on the window object for debugging.
if (process.env.NODE_ENV !== 'test') {
  Object.defineProperty(window, 'state', {
    get: store.getState,
    enumerable: true,
  });
}

if ((module as any).hot) {
  (module as any).hot.accept('./reducers', changed => {
    const nextReducers = require('reducers');
    store.replaceReducer(
      combineReducers({
        ...nextReducers.createReducer(),
      })
    );
  });

  Object.defineProperty(window, 'state', {
    get: store.getState,
    enumerable: true,
  });
}

export default store;
