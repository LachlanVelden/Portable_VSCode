import { suite, test, context } from 'mocha-typescript';
import { UITestSuite } from './uiTestSuite';
import { Code } from '@vsliveshare/vscode-automation/vscode/code';
import { IHookCallbackContext } from 'mocha';

@suite
export class CoeditingTests extends UITestSuite {
    @context static mochaContext: IHookCallbackContext;
    static before() { return UITestSuite.startSharing(CoeditingTests.mochaContext); }
    static after() { return UITestSuite.endSharing(CoeditingTests.mochaContext); }

    @test
    async summon() {
        // TODO: Verify no files opened on either side.
        // TODO: `this.guestWorkbench` implies only one guest, maybe we should do
        // `this.guestWorkbench[index]` instead some day

        await this.guestWorkbench.quickopen.openFile('index.js');
        await this.guestWorkbench.quickopen.openQuickOpen(':10');
        await this.guestWindow.dispatchKeybinding('enter');

        await this.runLiveShareCommand(
            this.guestWorkbench, 'liveshare.focusParticipants');
        await this.waitForNotificationMessage(
            this.guestWindow, 'Focus request sent.'); // :()

        await this.waitForNotificationMessage(
            this.hostWindow, 'requested you to follow');

        await this.hostWorkbench.editors.waitForTab('index.js');

        // TODO: Check that we're on the correct line.
    }
}
