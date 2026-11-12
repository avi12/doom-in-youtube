import { base } from "eslint-config-avi12/base";

export default [
  ...base({
    ignores: [".output/", ".wxt/", "src/public/"],
    sourceFiles: ["src/lib/**/*.ts"],
    overrides: {
       "jsdoc/require-jsdoc": "off" 
    }
  })
];
