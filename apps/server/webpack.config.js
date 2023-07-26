const { composePlugins, withNx } = require('@nx/webpack');
// const { AngularWebpackPlugin } = require('@ngtools/webpack');
// const { dynamicImport } = require('tsimportlib');

// Nx plugins for webpack.
module.exports =   composePlugins(withNx(), async (config) => {
  // Update the webpack config as needed here.
//   // e.g. `config.plugins.push(new MyPlugin())`
//   const linkerPlugin = await dynamicImport('@angular/compiler-cli/linker/babel', module);


// config.module.rules.push(
//   {
//     test: /\.mjs$/,
//     loader: 'babel-loader',
//     options: {
//         compact: false,
//         plugins: [linkerPlugin.default],
//     },
//     resolve: {
//         fullySpecified: false
//     }
// })



//   config.plugins.push(
//     new AngularWebpackPlugin({
//       jitMode: '@angular/compiler'
//     }),
//   )
  return config;
});
