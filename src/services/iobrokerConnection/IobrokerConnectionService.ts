import { env, Uri, window } from "vscode";

import { inject, injectable } from "inversify";
import { AdminVersion, Config, NoConfig } from '../../models/Config';
import { NoWorkspaceFolder } from '../../models/NoWorkspaceFolder';
import TYPES from '../../Types';
import { ILogService } from '../log/ILogService';
import { IWorkspaceService } from '../workspace/IWorkspaceService';
import { IIobrokerConnectionService } from "./IIobrokerConnectionService";
import { IConnectionEventListener } from "../connection/IConnectionEventListener";
import { IConfigRepositoryService } from "../configRepository/IConfigRepositoryService";
import CONSTANTS from "../../Constants";
import { IConfigCreationService } from "../configCreation/IConfigCreationService";
import { IScriptService } from "../script/IScriptService";
import { IScriptRepositoryService } from "../scriptRepository/IScriptRepositoryService";
import { IConnectionServiceProvider } from "../connectionServiceProvider/IConnectionServiceProvider";
import { ILoginService } from "../loginHttpClient/ILoginService";
import { ILoginCredentialsService } from "../loginCredentialsService/ILoginCredentialsService";
import { IDebugLogService } from "../debugLogService/IDebugLogService";
import { IStatusBarService } from "../statusBar/IStatusBarService";

@injectable()
export class IobrokerConnectionService implements IIobrokerConnectionService, IConnectionEventListener {

  config: Config = new NoConfig();

  private isReAuthenticationRunning = false;

  constructor(
    @inject(TYPES.services.configCreation) private configCreationService: IConfigCreationService,
    @inject(TYPES.services.configRepository) private configReaderWriterService: IConfigRepositoryService,
    @inject(TYPES.services.connectionServiceProvider) private connectionServiceProvider: IConnectionServiceProvider,
    @inject(TYPES.services.workspace) private workspaceService: IWorkspaceService,
    @inject(TYPES.services.log) private logService: ILogService,
    @inject(TYPES.services.script) private scriptService: IScriptService,
    @inject(TYPES.services.scriptRepository) private scriptRepositoryService: IScriptRepositoryService,
    @inject(TYPES.services.login) private loginService: ILoginService,
    @inject(TYPES.services.loginCredentials) private loginCredentialService: ILoginCredentialsService,
    @inject(TYPES.services.debugLogService) private debugLogService: IDebugLogService,
    @inject(TYPES.services.statusBarService) private statusBarService: IStatusBarService
  ) {
    statusBarService.init();
  }

  onConnected(): void {
    this.statusBarService.setText("$(check) ioBroker connected");
  }

  onDisconnected(): void {
    this.statusBarService.setText("$(warning) ioBroker disconnected");
  }

  async onReAuthenticate(): Promise<void> {
    this.debugLogService.log("start reAuthentication");
    
    if (!this.isReAuthenticationRunning) {
      this.debugLogService.log("reAuthentication not running");
      this.isReAuthenticationRunning = true;
      this.statusBarService.setText("$(warning) ioBroker disconnected (authentication required)");
      await this.loginCredentialService.updatePasswordFromUser();
      await this.connect();
      this.isReAuthenticationRunning = false;
      this.debugLogService.log("reAuthentication done");
    }
  }

  isConnected(): boolean {
    return this.connectionServiceProvider.isConnectionServiceAvailable() && this.connectionServiceProvider.getConnectionService().isConnected;
  }

  async connect(): Promise<void> {
    try {
      let isInitialConnect = false;
      let workspaceFolder = await this.workspaceService.getWorkspaceToUse();

      if (workspaceFolder instanceof NoWorkspaceFolder) {
        window.showErrorMessage("Cannot continue execution of extension 'ioBroker.javascript', because no valid workspace was selected. Exiting.");
        return;
      }

      this.config = await this.configReaderWriterService.read(workspaceFolder);

      if (!(this.config instanceof NoConfig) && !this.isConfigValid()) {
        const pickAnswer = await window.showQuickPick(["Yes", "No", "No, open documentation"], { placeHolder: "ioBroker: Your config is missing mandatory items. Recreate config?", ignoreFocusOut: true });
        if (pickAnswer === "Yes") {
          this.config = new NoConfig();
        }
        else if (pickAnswer === "No, open documentation") {
          await env.openExternal(Uri.parse("https://github.com/nokxs/iobroker-javascript-vs-code-extension#available-settings"));
          window.showWarningMessage("Connection attempt to ioBroker aborted. Update your config and try again!");
          return;
        }
      }

      if (this.config instanceof NoConfig) {
        this.config = await this.configCreationService.createConfigInteractivly();
        if (this.config instanceof NoConfig) {
          window.showWarningMessage("ioBroker: Config not saved. Execute command 'iobroker: Connect to ioBroker' to start another connection attempt.");
          return;
        }
        else {
          await this.configReaderWriterService.write(this.config, workspaceFolder);
          window.setStatusBarMessage("ioBroker: Created new 'iobroker-config.json' in root directory", CONSTANTS.StatusBarMessageTime);
          isInitialConnect = true;
        }
      }

      this.connectionServiceProvider.getConnectionService().registerConnectionEventListener(this);
      const connectionService = this.connectionServiceProvider.getConnectionService();
      const useAutoReconnect = this.config?.autoReconnect ?? true;
      const allowSelfSignedCertificate = this.config.allowSelfSignedCertificate ?? false;
      const uri = Uri.parse(`${this.config.ioBrokerUrl}:${this.config.socketIoPort}`);

      if (await this.loginService.isLoginNecessary(uri, allowSelfSignedCertificate)) {
        if (!this.config.username) {
          window.showWarningMessage("ioBroker: Login to ioBroker necessary, but no user name is set. Add property 'username' to .iobroker-config.json and try again!");
          return;
        }

        const token = await this.loginService.getAccessToken(uri, allowSelfSignedCertificate, this.config.username);
        if (!token) {
          window.showWarningMessage("ioBroker: Could not login to ioBroker. Is user name and password correct?");
          return;
        }

        await connectionService.connectWithToken(uri, useAutoReconnect, allowSelfSignedCertificate, token);
      }
      else {
        await connectionService.connect(uri, useAutoReconnect, allowSelfSignedCertificate);
      }

      await this.logService.startReceiving();
      await this.scriptRepositoryService.init();

      if (isInitialConnect) {
        const answer = await window.showQuickPick(["Yes", "No"], { placeHolder: "Download all scripts" });
        if (answer === "Yes") {
          const scripts = this.scriptRepositoryService.getAllScripts();
          await this.scriptService.saveAllToFile(scripts);
          await this.scriptRepositoryService.evaluateScriptOnRemoteForAllScripts();
          await this.scriptRepositoryService.evaluateDirtyStateForAllScripts();
        }
      }
    } catch (error) {
      window.showErrorMessage(`Could not connect to ioBroker. Check your '.iobroker-config.json' for wrong configuration: ${error}`);
    }
  }

  private isConfigValid(): boolean {
    if (
      !this.config.ioBrokerUrl ||
      !this.config.socketIoPort ||
      !this.config.scriptRoot ||
      !this.config.adminVersion || this.config.adminVersion === AdminVersion.unknown
    ) {
      return false;
    }

    return true;
  }
}
