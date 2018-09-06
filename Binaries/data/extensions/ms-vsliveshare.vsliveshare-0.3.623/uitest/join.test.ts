import { suite, test, slow, timeout } from 'mocha-typescript';
import { UITestSuite } from './uiTestSuite';

@suite
export class JoinTests extends UITestSuite {
    async before() {
        await this.openGuestWindow();
    }

    @test(slow(30000), timeout(90000))
    async join() {
        // The guest window should automatically sign-in with the account cached by the host window.
        await this.waitForStatusBarTitle(this.guestWindow, this.testAccount.email);

        await super.share();
        await super.join();

        // TODO: Verify notification on host about user joined.
    }

    @test
    async unjoin() {
        await super.unjoin();

        // The window should remain signed in.
        await this.waitForStatusBarTitle(this.guestWindow, this.testAccount.email);

        // TODO: Verify notification on host about user left.

        await super.unshare();
    }

    @test.skip
    async joinAndEndSession() {
        // TODO: Join then end session from host.
        // TODO: Verify message on guest about session ended.
    }

    @test.skip
    async joinAndDisconnectGuest() {
        // TODO: Join then close guest window.
        // TODO: Verify message on host about guest disconnected.
    }

    @test.skip
    async joinAndDisconnectHost() {
        // TODO: Join then close host window.
        // TODO: Verify message on guest about host disconnected.
    }
}
