const paths = require('react-scripts/config/paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const defaultMinify = {
  removeComments: true,
  collapseWhitespace: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  removeStyleLinkTypeAttributes: true,
  keepClosingSlash: true,
  minifyJS: true,
  minifyCSS: true,
  minifyURLs: true,
};

function capitalize(str) {
  return str ? str[0].toUpperCase() + str.substr(1, str.length) : '';
}

const replacePlugin = (plugins, nameMatcher, newPlugin) => {
  const pluginIndex = plugins.findIndex((plugin) => {
    return plugin.constructor && plugin.constructor.name && nameMatcher(plugin.constructor.name);
  });

  if (-1 === pluginIndex) {
    return plugins;
  }

  const nextPlugins = plugins.slice(0, pluginIndex).concat(newPlugin).concat(plugins.slice(pluginIndex + 1));

  return nextPlugins;
};

// params.entry
function createRewire(params) {
  if (!params.entry || !params.entry.length) return; // todo: checkme!

  const entries = [].concat(params.entry);
  const bundles = entries.map(entry => {
    const ext = entry.split('.').pop();
    return entry.replace('.' + ext, '');
  });

  bundles.forEach((bundle, idx) => {
    paths[`app${capitalize(bundle)}Js`] = `${paths.appSrc}/${entries[idx]}`;
  });

  function getHtmlPlugin(bundle, isProd) {
    const opts = Object.assign({
      inject: true,
      template: paths.appHtml,
      // note: 2.x adds optimization with 'vendors' and 'runtime~bundle' in chunks
      chunks: ['vendors', 'runtime~' + bundle, bundle],
      filename: bundle + '.html',
    }, isProd ? { minify: Object.assign(defaultMinify, params.minify) } : {});

    return new HtmlWebpackPlugin(opts);
  }

  return {
    webpack: (config, env) => {
      const isProd = env !== 'development';

      config.entry = bundles.reduce((acc, bundle) => {
        acc[bundle] = [require.resolve('react-scripts/config/polyfills')].concat(
          isProd ? [] : require.resolve('react-dev-utils/webpackHotDevClient'),
          paths[`app${capitalize(bundle)}Js`]
        );

        return acc;
      }, {});

      // checkme: possibly is not required in production env
      config.output.filename = 'static/js/[name].[chunkhash:8].js';

      // initial HtmlWebpackPlugin for `index.html`
      config.plugins = replacePlugin(config.plugins, (name) => /HtmlWebpackPlugin/i.test(name), getHtmlPlugin(bundles[0], isProd));
      // HtmlWebpackPlugin for other *.html
      bundles.slice(1).forEach(bundle => {
        config.plugins.push(getHtmlPlugin(bundle, isProd));
      });

      return config;
    },
    devServer: (configFunction) => {
      return (proxy, allowedHost) => {
        const config = configFunction(proxy, allowedHost);
        config.historyApiFallback.rewrites = bundles.slice(1).map(bundle => {
          return { from: new RegExp('^\/' + bundle + '.html'), to: `/build/${bundle}.html` }
        });

        return config;
      };
    }
  };
}

module.exports = createRewire;
