import * as http from 'http';
import { suite, test, context } from 'mocha-typescript';
import { UITestSuite } from './uiTestSuite';
import { Code } from '@vsliveshare/vscode-automation/vscode/code';
import { IHookCallbackContext } from 'mocha';

@suite
export class DebugTests extends UITestSuite {
    @context static mochaContext: IHookCallbackContext;
    static before() { return UITestSuite.startSharing(DebugTests.mochaContext); }
    static after() { return UITestSuite.endSharing(DebugTests.mochaContext); }

    // Code in this class is adapted from VS Code's debugging smoke tests:
    // vscode/test/smoke/src/areas/debug/debug.test.ts

    // Note test suite instance members are not persisted across test methods.
    // (Apparently each test method runs with a unique instance of the class.)
    // So use static variables instead.
    private static appPort: number;

    @test
    async guestSetBreakpoint() {
        await this.guestWorkbench.quickopen.openFile('index.js');
        await this.guestWorkbench.debug.setBreakpointOnLine(6);

        // Verify the breakpoint appears on the host side.
        await this.hostWorkbench.quickopen.openFile('index.js');
        await this.hostWindow.waitForElement('.debug-breakpoint');
    }

    @test
    async hostStartDebugging() {
        DebugTests.appPort = await this.hostWorkbench.debug.startDebugging();

        // Make a request that will hit the breakpoint.
        await new Promise((c, e) => {
            const request = http.get(`http://localhost:${DebugTests.appPort}`);
            request.on('error', e);

            // Wait for the host to hit the breakpoint.
            this.hostWorkbench.debug.waitForStackFrame(
                sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6,
                'looking for index.js and line 6')
                .then(c, e);
        });

        // Wait for the guest to hit the breakpoint.
        await this.guestWorkbench.debug.waitForStackFrame(
            sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6,
            'looking for index.js and line 6');
    }

    @test
    async guestStackFramesAndVariables() {
        // Ensure the debug variables viewlet is visible and the Locals tree item is expanded.
        await this.guestWorkbench.quickopen.runCommand('Debug: Focus Variables');
        await this.guestWindow.waitAndClick('.debug-view-content .scope');
        await this.guestWindow.dispatchKeybinding('right');

        await this.guestWorkbench.debug.waitForVariableCount(4);

        await this.guestWorkbench.debug.focusStackFrame('layer.js', 'looking for layer.js');
        await this.guestWorkbench.debug.waitForVariableCount(5);

        await this.guestWorkbench.debug.focusStackFrame('route.js', 'looking for route.js');
        await this.guestWorkbench.debug.waitForVariableCount(3);

        await this.guestWorkbench.debug.focusStackFrame('index.js', 'looking for index.js');
        await this.guestWorkbench.debug.waitForVariableCount(4);
    }

    @test
    async guestStepOverInOut() {
        await this.guestWorkbench.debug.stepIn();

        const first = await this.guestWorkbench.debug.waitForStackFrame(
            sf => /response\.js$/.test(sf.name), 'looking for response.js');
        await this.guestWorkbench.debug.stepOver();

        await this.guestWorkbench.debug.waitForStackFrame(
            sf => /response\.js$/.test(sf.name) && sf.lineNumber === first.lineNumber + 1,
            `looking for response.js and line ${first.lineNumber + 1}`);
        await this.guestWorkbench.debug.stepOut();

        await this.guestWorkbench.debug.waitForStackFrame(
            sf => /index\.js$/.test(sf.name) && sf.lineNumber === 7,
            `looking for index.js and line 7`);
    }

    @test
    async guestContinue() {
        await this.guestWorkbench.debug.continue();

        // Wait for the host to continue.
        await this.hostWindow.waitForElement('.debug-action.pause');

        // Make another request and wait for the breakpoint to hit again.
        await new Promise((c, e) => {
            const request = http.get(`http://localhost:${DebugTests.appPort}`);
            request.on('error', e);

            this.hostWorkbench.debug.waitForStackFrame(
                sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6,
                `looking for index.js and line 6`)
            .then(c, e);
        });
        await this.guestWorkbench.debug.waitForStackFrame(
            sf => /index\.js$/.test(sf.name) && sf.lineNumber === 6,
            'looking for index.js and line 6');
    }

    @test
    async guestDisconnectDebugging() {
        await this.disconnectDebugging(this.guestWindow);
    }

    @test
    async hostStop() {
        // stopDebugging() doesn't find the hidden toolbar on Mac.
        //await this.hostWorkbench.debug.stopDebugging();
        await this.hostWindow.waitAndClick('.debug-actions-widget .debug-action.stop');
        await this.hostWindow.waitForElement('.statusbar:not(debugging)');
    }

    private async disconnectDebugging(window: Code): Promise<void> {
        const DISCONNECT = `.debug-actions-widget .debug-action.disconnect`;
        const TOOLBAR_HIDDEN = `.debug-actions-widget.monaco-builder-hidden`;
        const NOT_DEBUG_STATUS_BAR = `.statusbar:not(debugging)`;

        await window.waitAndClick(DISCONNECT);
        await window.waitForElement(TOOLBAR_HIDDEN);
        await window.waitForElement(NOT_DEBUG_STATUS_BAR);
    }
}
