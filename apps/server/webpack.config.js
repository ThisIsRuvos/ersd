const { composePlugins, withNx } = require('@nx/webpack');

// Nx plugins for webpack.
module.exports =   composePlugins(withNx(), async (config) => {
  return config;
});
