var BABYLON;
(function (BABYLON) {
    var EDITOR;
    (function (EDITOR) {
        var GameTester = (function () {
            function GameTester() {
            }
            // Static members
            GameTester.RunInWindow = function (core) {
                var popup = EDITOR.Tools.OpenWindowPopup("run-game.html", 1280, 800);
                popup.onloadeddata = function () {
                    var filesInput = popup.BABYLON.FilesInput;
                    var projectContent = EDITOR.ProjectExporter.ExportProject(core, true);
                    var project = JSON.parse(projectContent);
                    // Copy textures
                    for (var thing in BABYLON.FilesInput.FilesTextures) {
                        popup.BABYLON.FilesInput.FilesTextures[thing] = BABYLON.FilesInput.FilesTextures[thing];
                    }
                    // Copy files to load
                    for (var thing in BABYLON.FilesInput.FilesToLoad) {
                        popup.BABYLON.FilesInput.FilesToLoad[thing] = BABYLON.FilesInput.FilesToLoad[thing];
                    }
                    // Lens flare textures
                    for (var i = 0; i < project.lensFlares.length; i++) {
                        var lf = project.lensFlares[i].serializationObject;
                        for (var j = 0; j < lf.flares.length; j++) {
                            popup.BABYLON.FilesInput.FilesTextures[lf.flares[j].base64Name.toLowerCase()] = EDITOR.Tools.CreateFile(EDITOR.Tools.ConvertBase64StringToArrayBuffer(lf.flares[j].base64Buffer), lf.flares[j].base64Name);
                        }
                    }
                    // Particle system textures
                    for (var i = 0; i < project.particleSystems.length; i++) {
                        var ps = project.particleSystems[i].serializationObject;
                        popup.BABYLON.FilesInput.FilesTextures[ps.base64TextureName.toLowerCase()] = EDITOR.Tools.CreateFile(EDITOR.Tools.ConvertBase64StringToArrayBuffer(ps.base64Texture), ps.base64TextureName);
                    }
                    // Scene data
                    var scene = EDITOR.BabylonExporter.GenerateFinalBabylonFile(core);
                    popup.filesInput._sceneFileToLoad = EDITOR.Tools.CreateFile(EDITOR.Tools.ConvertStringToArray(JSON.stringify(scene)), "scene.babylon");
                    popup.BABYLON.EDITOR.EXTENSIONS.EditorExtension._ExtensionsDatas = EDITOR.SceneManager._CustomMetadatas;
                    // Reload scene
                    popup.loadScene();
                };
            };
            return GameTester;
        }());
        EDITOR.GameTester = GameTester;
    })(EDITOR = BABYLON.EDITOR || (BABYLON.EDITOR = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.editor.testGame.js.map
