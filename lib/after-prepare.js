const xcode = require('xcode');
const path = require('path');
const fs = require('fs-extra');

module.exports = function (hookArgs) {
    const platform = (hookArgs.platform || hookArgs.prepareData.platform).toLowerCase();
    const platformPath = path.join(hookArgs.projectData.platformsDir, platform);
    const projectPath = hookArgs.projectData.projectDir;
    const regionConfigPath = path.join(projectPath, 'region.nativescript.json');
    const projectName = hookArgs.projectData.projectName;
    const pbxprojPath = path.join(platformPath, projectName + '.xcodeproj', 'project.pbxproj');
    const configExists = fs.existsSync(regionConfigPath);

    return new Promise(function (resolve, reject) {
        if (platform === 'ios' && configExists) {
            try {
                const regionConfig = JSON.parse(fs.readFileSync(regionConfigPath).toString());
                const xcodeproj = xcode.project(pbxprojPath);

                xcodeproj.parse(function() {
                    const uuid = xcodeproj.getFirstProject()['uuid'];

                    xcodeproj.pbxProjectSection()[uuid]['developmentRegion'] = regionConfig.developmentRegion;
                    xcodeproj.removeKnownRegion('en');

                    for (let knownRegion of regionConfig.knownRegions) {
                        xcodeproj.addKnownRegion(knownRegion);
                    }

                    fs.writeFileSync(pbxprojPath, xcodeproj.writeSync());
                    console.log('INFO: Successfully set regions.');
                });
            } catch (error) {
                reject();
            }
        } else if (!configExists) {
            console.error('ERROR: Unable to find region config file at path: ' + regionConfigPath);
        }

        resolve();
    });
};
