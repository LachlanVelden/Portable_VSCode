import * as assert from 'assert';
import { suite, test, slow, timeout } from 'mocha-typescript';
import { UITestSuite } from './uiTestSuite';
import { signInWithBrowser } from './browserSignIn';
import { QuickInput } from '@vsliveshare/vscode-automation/areas/quickinput/quickinput';

@suite
export class SigninTests extends UITestSuite {
    @test(slow(15000), timeout(60000))
    async signInWithUserCode() {
        const userCode = await signInWithBrowser(
            this.serviceUri,
            <any>this.testAccount.provider,
            this.testAccount.email,
            this.testAccount.password,
            true);
        assert(userCode, 'Should have gotten a user code from browser sign-in.');

        await this.runLiveShareCommandIfAvailable(this.hostWorkbench, 'liveshare.signout');
        await this.waitForStatusBarTitle(this.hostWindow, 'Signed in', true);

        await this.runLiveShareCommand(this.hostWorkbench, 'liveshare.signin.token');
        await this.hostWorkbench.quickinput.waitForQuickInputOpened();
        await this.hostWindow.waitForSetValue(QuickInput.QUICK_INPUT_INPUT, userCode);
        await this.hostWindow.dispatchKeybinding('enter');

        await this.waitForStatusBarTitle(this.hostWindow, this.testAccount.email);
    }
}
