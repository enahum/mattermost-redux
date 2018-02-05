// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {createSelectorCreator, defaultMemoize} from 'reselect';
import shallowEqual from 'shallow-equals';
import {Client4} from 'client';

export function memoizeResult(func) {
    let lastArgs = null;
    let lastResult = null;

    // we reference arguments instead of spreading them for performance reasons
    return function shallowCompare() {
        if (!shallowEqual(lastArgs, arguments)) { //eslint-disable-line prefer-rest-params
            // apply arguments instead of spreading for performance.
            const result = Reflect.apply(func, null, arguments); //eslint-disable-line prefer-rest-params
            if (!shallowEqual(lastResult, result)) {
                lastResult = result;
            }
        }

        lastArgs = arguments; //eslint-disable-line prefer-rest-params
        return lastResult;
    };
}

// Use this selector when you want a shallow comparison of the arguments and you want to memoize the result
// try and use this only when your selector returns an array of ids
export const createIdsSelector = createSelectorCreator(memoizeResult);

// Use this selector when you want a shallow comparison of the arguments and you don't need to memoize the result
export const createShallowSelector = createSelectorCreator(defaultMemoize, shallowEqual);

// isMinimumServerVersion will return true if currentVersion is equal to higher or than the
// the provided minimum version. A non-equal major version will ignore minor and dot
// versions, and a non-equal minor version will ignore dot version.
// currentVersion is a string, e.g '4.6.0'
// minMajorVersion, minMinorVersion, minDotVersion are integers
export function isMinimumServerVersion(currentVersion, minMajorVersion = 0, minMinorVersion = 0, minDotVersion = 0) {
    if (!currentVersion || typeof currentVersion !== 'string') {
        return false;
    }

    let firstDotIndex = currentVersion.indexOf('.');
    if (firstDotIndex < 0) {
        firstDotIndex = currentVersion.length;
    }

    let secondDotIndex = currentVersion.indexOf('.', firstDotIndex + 1);
    if (secondDotIndex < 0) {
        secondDotIndex = currentVersion.length;
    }

    let thirdDotIndex = currentVersion.indexOf('.', secondDotIndex + 1) || currentVersion.length;
    if (thirdDotIndex < 0) {
        thirdDotIndex = currentVersion.length;
    }

    const major = parseInt(currentVersion.slice(0, firstDotIndex), 10);
    const minor = parseInt(currentVersion.slice(firstDotIndex + 1, secondDotIndex) || '0', 10);
    const dot = parseInt(currentVersion.slice(secondDotIndex + 1, thirdDotIndex) || '0', 10);

    if (major > minMajorVersion) {
        return true;
    }
    if (major < minMajorVersion) {
        return false;
    }

    // Major version is equal, check minor
    if (minor > minMinorVersion) {
        return true;
    }
    if (minor < minMinorVersion) {
        return false;
    }

    // Minor version is equal, check dot
    if (dot > minDotVersion) {
        return true;
    }
    if (dot < minDotVersion) {
        return false;
    }

    // Dot version is equal
    return true;
}
