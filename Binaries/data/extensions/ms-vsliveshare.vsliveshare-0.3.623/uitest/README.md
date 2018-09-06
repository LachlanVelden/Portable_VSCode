# VSLS UI Tests


## VS Code Automation Driver
Tests use an automation driver extracted from VS Code's smoke tests. The driver package is published to our internal NPM feed as `vscode-automation`.

**How to update the automation driver for a new VS Code release**
 - Run these commands in the VS Code repo:
   - `git checkout -t origin/release/1.##` _(Replace ## with the release number.)_
   - `cd test/smoke`
   - `npm run copy-driver-definition`
 - Copy all the contents of VS Code's `test/smoke` directory to a staging directory.
 - Make the driver definitions static insteady of dynamically generated:
   - Delete the `tools/` directory.
   - Change the `copy-driver-definition` script in `package.json` to `cpx src/vscode/driver.d.ts vscode`
 - Edit `tsconfig.json`:
   - Add `"declaration": true` to enable generation of `.d.ts` files.
   - Set `"include": [ "src" ], "exclude": []`.
 - Edit `package.json`:
   - Change `"name"` to `"@vsliveshare/vscode-automation"`
   - Change `"version"` to match the VS Code release version, e.g. `"1.26.0"`
   - Delete the `postinstall`, `watch` and `mocha` scripts.
 - Add `.npmignore`:
    ```
    test/
    main.*
    *.test.*
    .gitignore
    *.md
    yarn.lock
    ```
 - Replace `README.md` with this file.
 - Run `npm install`.
 - Publish to npm (the scope makes it go to our private feed).
