# AF Router
[![Build Status](https://travis-ci.org/TitanNanoDE/af-router.svg?branch=master)](https://travis-ci.org/TitanNanoDE/af-router)

## Instalation

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

```
