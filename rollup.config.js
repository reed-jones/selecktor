import vue from "rollup-plugin-vue";
import css from "rollup-plugin-css-only";
import babel from "rollup-plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import size from "rollup-plugin-size";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default [
  // ESM build to be used with webpack/rollup.
  {
    input: "src/index.js",
    output: {
      format: "esm",
      file: "dist/selektor.esm.js"
    },
    plugins: [
      resolve(),
      babel(),
      css({ output: 'dist/selektor.css' }),
      vue({ css: false }),
      production && terser(),
      size(),
    ]
    },
    {
        input: "src/index.js",
        output: {
            name: 'selektor',
          format: "umd",
          file: "dist/selektor.umd.js"
        },
        plugins: [
          resolve(),
          babel(),
          css({ output: 'dist/selektor.css' }),
          commonjs(),
          vue({ css: false }),
          production && terser(),
          size(),
        ]
      }
  // SSR build.
  //   {
  //     input: "src/index.js",
  //     output: {
  //       format: "cjs",
  //       file: "dist/library.ssr.js"
  //     },
  //     plugins: [css(), vue({ template: { optimizeSSR: true }, css: false })]
  //   },
  // Browser build.
  // {
  //   input: "src/index.js",
  //     output: [
  //         { format: "cjs", file: "dist/library.cjs.js" },
  //         { format: "es", file: "dist/library.cjs.js" },
  //     ],
  //   plugins: [css(), vue({ css: false })]
  // }
];
