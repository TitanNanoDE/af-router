# AF Router

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
