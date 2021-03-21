import { EngineType } from "../../models/EngineType";
import { ILocalScript } from "../../models/ILocalScript";
import { Uri } from "vscode";

export interface IScriptService {

    getFileExtension(engineType: EngineType): string
    getEngineType(uri: Uri): EngineType

    getFileContentOnDisk(script: ILocalScript): Promise<string | null>
    
    saveToFile(script: ILocalScript): Promise<void>
    saveAllToFile(scripts: ILocalScript[]): Promise<void>

    findAllScriptsRecursively(startDirectory: Uri): Promise<Uri[]>
}
