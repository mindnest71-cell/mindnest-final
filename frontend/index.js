// Polyfill for localStorage to fix expo-notifications crash in Node environment
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
    global.localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
    };
}

import 'expo-router/entry';
