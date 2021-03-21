import { ICommand } from "./ICommand";
import { inject, injectable } from "inversify";
import TYPES from "../Types";
import { window } from "vscode";
import { IScriptService } from "../services/script/IScriptService";
import CONSTANTS from "../Constants";
import { IScriptRepositoryService } from "../services/scriptRepository/IScriptRepositoryService";
import { IWorkspaceService } from "../services/workspace/IWorkspaceService";

@injectable()
export class DownloadAllCommand implements ICommand {
    id: string = "iobroker-javascript.downloadAll";

    constructor(
        @inject(TYPES.services.scriptRepository) private scriptRepository: IScriptRepositoryService,
        @inject(TYPES.services.script) private scriptService: IScriptService,
        @inject(TYPES.services.workspace) private workspaceService: IWorkspaceService
    ) {}
    
    async execute() {
        const message = window.setStatusBarMessage("ioBroker: Downloading all scripts...");
        await this.scriptRepository.updateFromServer();
        const scripts = this.scriptRepository.getAllScripts();
        await this.scriptService.saveAllToFile(scripts);

        await this.scriptService.findAllScriptsRecursively(this.workspaceService.workspaceToUse.uri);
        
        message.dispose();
        window.setStatusBarMessage("ioBroker: Finished downloading all scripts", CONSTANTS.StatusBarMessageTime);
    }
}
