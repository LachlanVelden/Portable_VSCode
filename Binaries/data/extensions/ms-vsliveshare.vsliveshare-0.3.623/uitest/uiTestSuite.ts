import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { context } from 'mocha-typescript';
import { Code } from '@vsliveshare/vscode-automation/vscode/code';
import { Application } from '@vsliveshare/vscode-automation/application';
import { Workbench } from '@vsliveshare/vscode-automation/areas/workbench/workbench';
import { Logger } from '@vsliveshare/vscode-automation/logger';
import { IHookCallbackContext } from 'mocha';
import { IElement } from '@vsliveshare/vscode-automation/vscode/driver';
import { readSync as readClipboard } from 'clipboardy';
import { QuickInput } from '@vsliveshare/vscode-automation/areas/quickinput/quickinput';

const extensionDir = path.join(__dirname, '..', '..');

/**
 * Base class for UI test suites.
 */
export class UITestSuite {
    readonly extensionInfo: any = require(path.join(extensionDir, 'package.json'));

    private static firstShare: boolean = true;

    @context
    mochaContext: IHookCallbackContext;

    get app(): Application { return this.mochaContext && this.mochaContext.app as Application; }
    get logger(): Logger { return this.app && this.app.logger; }

    get testAccount(): { provider: string, email: string, password: string } {
        return this.mochaContext && this.mochaContext.testAccount;
    }

    get serviceUri(): string {
        return this.mochaContext && this.mochaContext.serviceUri;
    }

    private static _hostWindow: Code;
    private static _guestWindow: Code;
    private static _hostWorkbench: Workbench;
    private static _guestWorkbench: Workbench;
    private static _inviteUri: string | null;

    get hostWindow(): Code { return UITestSuite._hostWindow; }
    set hostWindow(value: Code) { UITestSuite._hostWindow = value; }
    get guestWindow(): Code { return UITestSuite._guestWindow; }
    set guestWindow(value: Code) { UITestSuite._guestWindow = value; }

    get hostWorkbench(): Workbench { return UITestSuite._hostWorkbench; }
    set hostWorkbench(value: Workbench) { UITestSuite._hostWorkbench = value; }
    get guestWorkbench(): Workbench { return UITestSuite._guestWorkbench; }
    set guestWorkbench(value: Workbench) { UITestSuite._guestWorkbench = value; }

    get inviteUri(): string | null { return UITestSuite._inviteUri; }
    set inviteUri(value: string | null) { UITestSuite._inviteUri = value; }

    // Call from a static before() method in a subclass to start sharing before a test suite.
    static async startSharing(context: IHookCallbackContext) {
        const suite =  new UITestSuite();
        suite.mochaContext = context;

        await suite.openGuestWindow();

        await suite.share();
        await suite.join();
    }

    // Call from a static after() method in a subclass to end sharing after a test suite.
    static async endSharing(context: IHookCallbackContext) {
        const suite =  new UITestSuite();
        suite.mochaContext = context;

        await suite.unjoin();
        await suite.unshare();
    }

    protected async openGuestWindow(): Promise<void> {
        if (this.guestWindow) {
            return; // Already open.
        }

        await this.hostWorkbench.quickopen.runCommand('New Window');

        let newWindowId: number;
        await this.hostWindow.waitForWindowIds((ids: number[]) => {
            if (ids.length === 2) {
                newWindowId = ids[1];
                return true;
            }
        });

        this.guestWindow = await this.getNewWindow(this.hostWindow, newWindowId);
        this.guestWorkbench = new Workbench(this.guestWindow, this.app.userDataPath);
    }

    private async getNewWindow(existingWindow: Code, windowId: number): Promise<Code> {
        // This code accesses some private members of the `Code` class,
        // because it was not designed to support multi-window automation.
        const newWindow = new Code(
            (existingWindow as any).process,
            (existingWindow as any).client,
            (existingWindow as any).driver,
            this.logger,
        );
        (newWindow as any)._activeWindowId = windowId;
        (newWindow as any).driver = (existingWindow as any).driver;
    
        // Wait for the new window to be ready. (This code is copied from
        // Application.checkWindowReady(), which only works for the first window.)
        await newWindow.waitForElement('.monaco-workbench');
        await new Promise(c => setTimeout(c, 500));
    
        return newWindow;
    }

    protected getLiveShareCommandInfo(id: string): { command: string, title: string, category: string } {
        const command = this.extensionInfo.contributes.commands.find((c: any) => c.command === id);
        assert(command && command.title && command.category, 'Expected Live Share command: ' + id);
        return command;
    }

    protected async runLiveShareCommand(workbench: Workbench, id: string): Promise<void> {
        const command = this.getLiveShareCommandInfo(id);
        const title = command && command.title;
        const category = command && command.category;
        await workbench.quickopen.runCommand(`${category}: ${title}`);
    }

    protected async runLiveShareCommandIfAvailable(workbench: Workbench, id: string): Promise<void> {
        const command = this.getLiveShareCommandInfo(id);
        const title = command && command.title;
        const category = command && command.category;
        await workbench.quickopen.openQuickOpen(`>${category}: ${title}`);
        await ((workbench.quickopen as any).code as Code).dispatchKeybinding('enter');
    }

    protected async waitForNotificationMessage(window: Code, message: string | RegExp): Promise<void> {
        await window.waitForElements('.notification-list-item-message', false, (elements: IElement[]) => {
            for (let element of elements) {
                if (element.textContent.match(message)) {
                    return true;
                }
            }

            return false;
        });
    }

    /**
     * Waits for a statusbar with the given title (not label).
     * Or specify invert=true to wait until it goes away.
     */
    protected async waitForStatusBarTitle(
        window: Code,
        titleMatch: string | RegExp,
        invert: boolean = false,
    ): Promise<void> {
        await window.waitForElements('.statusbar-entry a', false, (elements: IElement[]) => {
            for (let element of elements) {
                const title = element.attributes['title'];
                if (title && title.match(titleMatch)) {
                    return !invert;
                }
            }

            return invert;
        });
    }

    protected async waitForDocumentTitle(
        window: Code,
        titleMatch: string | RegExp,
        invert: boolean = false,
    ): Promise<void> {
        await window.waitForElements('.monaco-icon-label a.label-name', false, (elements: IElement[]) => {
            for (let element of elements) {
                const title = element.textContent;
                if (title && title.match(titleMatch)) {
                    return !invert;
                }
            }

            return invert;
        });
    }

    protected async share(): Promise<void> {
        // Dismiss any old notifications.
        await this.hostWindow.dispatchKeybinding('escape');

        await this.runLiveShareCommand(this.hostWorkbench, 'liveshare.start');

        if (UITestSuite.firstShare) {
            await this.waitForDocumentTitle(this.hostWindow, 'vsliveshare-welcome-page');
            UITestSuite.firstShare = false;
        } else {
            await this.waitForNotificationMessage(this.hostWindow, 'invite link copied');
        }

        this.inviteUri = readClipboard();
        assert(this.inviteUri && this.inviteUri.startsWith(this.serviceUri),
            'Invite link should have been copied to clipboard.');
    }

    protected async unshare(): Promise<void> {
        await this.runLiveShareCommand(this.hostWorkbench, 'liveshare.end');

        await this.waitForStatusBarTitle(
            this.hostWindow, /(Start Collaboration)|(Share the workspace)/);
    }

    protected async join(): Promise<void> {
        await this.runLiveShareCommand(this.guestWorkbench, 'liveshare.join');
        await this.guestWorkbench.quickinput.waitForQuickInputOpened();
        await this.guestWindow.waitForSetValue(QuickInput.QUICK_INPUT_INPUT, this.inviteUri);
        await this.guestWindow.dispatchKeybinding('enter');

        // The window should reload with collaborating status.
        // Consume some of the time here to reduce the liklihood of the next wait timing out.
        await new Promise((c) => setTimeout(c, 5000));

        await this.waitForStatusBarTitle(this.guestWindow, 'Collaborating');
    }

    protected async unjoin(): Promise<void> {
        await this.runLiveShareCommand(this.guestWorkbench, 'liveshare.leave');

        await this.waitForStatusBarTitle(this.guestWindow,
            /(Start Collaboration)|(Share the workspace)/);
    }
}
