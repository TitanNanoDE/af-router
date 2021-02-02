# AF Router CCC

[![Greenkeeper badge](https://badges.greenkeeper.io/TitanNanoDE/af-router.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/TitanNanoDE/af-router.svg?branch=master)](https://travis-ci.org/TitanNanoDE/af-router)
[![Coverage Status](https://coveralls.io/repos/github/TitanNanoDE/af-router/badge.svg?branch=master)](https://coveralls.io/github/TitanNanoDE/af-router?branch=master)

AF Router is a single page application router. It allows to easily attach
listeners to state changes.

## Installation

```
npm i --save @af-modules/router
```

## How to Use

```JavaScript
import Router from '@af-modules/router';

Router.init([
    {
        path: ['/', '/home'],
        onEnter: (path) => {...},   
        onLeave: (path) => {...},
        isPersistent: true,
    },
    {
        path: '/home/details',
        onEnter: (path) => {...},
        onLeave: (path) => {...},
        isPersistent: true,
    }

]);

Router.restore();
```

## API

```JavaScript
Router.init([{ path: string, onEnter: Function, onLeave: Function, isPersistent: boolean }]);
```

The `init()` method initializes the router. An array of objects can be specified to define the initial states.


```JavaScript
Router.restore();
```

Restores the state of the application the last time it was open. Call this method
if users should be able to return to the application in the same state they left.
