# restrict-imports-loader

A Webpack loader to restrict imports in ES and TypeScript.

## Installation

```
npm install --save-dev restrict-imports-loader
```

## Usage

**NOTE:** Only static imports are supported; see _Limitations_.

Configuration example (`webpack.config.js`):

```javascript
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, "src"),
        loaders: [
          {
            loader: "awesome-typescript-loader", // or babel-loader, etc
          },
          {
            loader: "restrict-imports-loader",
            options: {
              severity: "error",
              rules: [
                {
                  restricted: /^lodash$/,
                },
              ],
            },
          },
        ],
      },
    ],
  },
}
```

Source code (e.g. `src/index.ts`):

```typescript
import * as ts from "typescript"; // OK
import * as _ from "lodash"; // error
import * as fp from "lodash/fp"; // OK (see "Restrict Entire Package" for more info)
```

Webpack output:

```
ERROR in ./src/index.ts
Module build failed (from ../restrict-imports-loader/dist/index.js):
Found restricted imports:

  • "lodash", imported here:

        import * as _ from "lodash";
```


### Options

#### `severity`

You can control what happens if a restricted import is found by setting the `severity` option to either `"fatal"` (stop compilation), `"error"` (emit error) or `"warning"` (emit warning).
The severity level can be overridden for individual rules; see below.


#### `rules`

Must be a list in which each element has a `restricted` property with a `RegExp` or function value.
Each rule can also override the `severity` defined for the loader.
Example:

```javascript
{
  loader: "restrict-imports-loader",
  options: {
    severity: "error",
    rules: [
      {
        restricted: /^lodash$/,
        // inherits severity: "error"
        info: "Please import submodules instead of the full lodash package.",
      },
      {
        restricted: /^typescript$/,
        severity: "warning",
        // no info specified; default is "Found restricted imports:"
      },
    ],
  },
},
```

##### Using a function as decider

If you provide a function as the `restricted` value, it must have the type

```typescript
(string, webpack.loader.LoaderContext) => Promise<boolean>
```

where the `string` parameter represents the import path in each import statement, e.g. `typescript` in `import * as ts from "typescript";`.

This way, you can use any algorithm you want to determine if an import should be restricted, possibly depending on the loader context.
In the example below (written in TypeScript), if `decider` is used as the `restricted` value, all imports from outside the project root directory are restricted.
(The "project root directory" is whatever directory you've specified using [Webpack's `context` option](https://webpack.js.org/configuration/entry-context/#context), or, if not specified, the "current working directory" as seen from Webpack's perspective.)

```typescript
import { LoaderDecider } from "restrict-imports-loader";

const decider: LoaderDecider = (importPath, loaderContext) => new Promise((resolve, reject) => {
  loaderContext.resolve(loaderContext.context, importPath, (err, result) => {
    if (err === null) {
      resolve(false === result.startsWith(loaderContext.rootContext));
    } else {
      reject(err.message);
    }
  });
});
```


#### `detailedErrorMessages`

By default, error messages include the faulty import statement exactly as written:

```
Found restricted imports:

  • "typescript", imported here:

        import * as _ from "typescript";
```

Setting `detailedErrorMessages` to `false` means that error messages will only include the import path:

```
Found restricted imports:

  • "typescript"
```

Note that Webpack will always show the file name (e.g. `ERROR in ./src/main.ts`).


### Restrict Entire Package

If you want to restrict an entire package, including its submodules, you can use `everythingIn` for convenience and readability:

```javascript
const { everythingIn } = require("restrict-imports-loader");

module.exports = {
  // ...
  {
    loader: "restrict-imports-loader",
    options: {
      severity: "error",
      rules: [
        {
          restricted: everythingIn("lodash"),
        },
      ],
    },
  },
};
```

Code:

```typescript
import * as ts from "typescript"; // OK
import * as _ from "lodash"; // error
import * as fp from "lodash/fp"; // error
```



### Limitations

Only **static ES2015 (ES6) imports** are supported, for example:

  * `import {} from "typescript";`
  * `import * as ts from "typescript";`
  * `import ts from "typescript";`
  * `import "typescript";`
  * `export {} from "typescript";`
  * [`import ts = require("typescript");`](https://github.com/microsoft/TypeScript/blob/7cf6c70d90b60e962db417d80290288eb786b5fd/doc/spec.md#1133-import-require-declarations) _(works only in TypeScript)_

Dynamic imports are **not supported**:

  * `const ts = require("typescript");`
  * `const ts = import("typescript");`



## Contribute

```bash
npm install
npm run verify # build, lint and test
```
