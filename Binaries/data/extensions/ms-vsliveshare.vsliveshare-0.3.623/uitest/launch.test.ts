import * as path from 'path';
import * as rimraf from 'rimraf';
import { suite, test, slow, timeout } from 'mocha-typescript';
import { UITestSuite } from './uiTestSuite';

@suite
export class LaunchTests extends UITestSuite {
    @test
    async launch() {
        // Delete install.Lock to trigger the dependency check.
        const extensionDir = path.resolve(__dirname, '../..');
        rimraf.sync(path.join(extensionDir, 'install.Lock'));

        // Uncomment this line to cause .NET Core to be downloaded.
        //rimraf.sync(path.join(extensionDir, 'dotnet_modules', 'mscorlib.dll'));

        await this.app.start();

        this.hostWindow = this.app.code;
        this.hostWorkbench = this.app.workbench;
    }

    @test(slow(30000), timeout(120000))
    async dependenciesInstalledNotification() {
        await this.waitForNotificationMessage(this.hostWindow, 'VS Live Share installed!');
    }

    @test
    async shareButtonOnStatusBar() {
        await this.waitForStatusBarTitle(this.hostWindow,
            /(Start Collaboration)|(Share the workspace)/);
    }

    @test
    async shareTabOnActivityBar() {
        const title = this.extensionInfo.contributes.viewsContainers.activitybar[0].title;
        await this.hostWindow.waitForElement(`.monaco-action-bar .action-item[title="${title}"]`);
    }
}
