# rewire-entry

Rewire for [react-app-rewired](https://github.com/timarney/react-app-rewired) to change entry points of [create-react-app](https://github.com/facebook/create-react-app).

## Usage

```
npm install react-app-rewired rewire-entry --save-dev
```

Create a `config-overrides.js` file in the root directory with something like this:

```js
const rewireEntry = require('rewire-entry');

module.exports = rewireEntry({
  entry: ['desktop.js', 'touch.js']
});
```

or for typescript support:

```js
const rewireTypescript = require('react-app-rewire-typescript');
const rewireEntry = require('rewire-entry')({
  entry: ['desktop.tsx', 'touch.tsx']
});

module.exports = {
  webpack: (config, env) => {
    config = rewireTypescript(config, env);
    config = rewireEntry.webpack(config, env);

    return config;
  },
  devServer: (config, env) => {
    config = rewireEntry.devServer(config, env);

    return config;
  }
};

```
