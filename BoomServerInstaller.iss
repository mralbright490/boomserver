#define MyAppSourcePath "backend"
#define MyAppFrontendBuildPath "frontend\dist"
#define MyAppAssetBinariesPath "build_assets"

[Setup]
AppName=BoomServer
AppVersion=1.0.5
AppPublisher=AP DreamStudios
DefaultDirName={autopf}\BoomServer
DisableProgramGroupPage=yes
OutputBaseFilename=BoomServerInstaller_1.0.5
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Files]
Source: "{#MyAppSourcePath}\src\*"; DestDir: "{app}\backend\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#MyAppSourcePath}\package.json"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "{#MyAppSourcePath}\node_modules\*"; DestDir: "{app}\backend\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

Source: "{#MyAppFrontendBuildPath}\*"; DestDir: "{app}\frontend\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

Source: "{#MyAppAssetBinariesPath}\ffprobe.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "{#MyAppAssetBinariesPath}\node.exe"; DestDir: "{app}\bin\Nodejs"; Flags: ignoreversion
Source: "{#MyAppAssetBinariesPath}\npm"; DestDir: "{app}\bin\Nodejs"; Flags: ignoreversion
Source: "{#MyAppAssetBinariesPath}\npm.cmd"; DestDir: "{app}\bin\Nodejs"; Flags: ignoreversion
Source: "{#MyAppAssetBinariesPath}\npm.ps1"; DestDir: "{app}\bin\Nodejs"; Flags: ignoreversion
Source: "{#MyAppAssetBinariesPath}\npx.cmd"; DestDir: "{app}\bin\Nodejs"; Flags: ignoreversion

Source: ".\README.md"; DestDir: "{app}"; Flags: ignoreversion
; --- ADD THIS LINE ---
Source: ".\StartBoomServer.bat"; DestDir: "{app}"; Flags: ignoreversion


[Dirs]
Name: "{app}\backend"
Name: "{app}\backend\src"
Name: "{app}\backend\node_modules"
Name: "{app}\frontend"
Name: "{app}\frontend\dist"
Name: "{app}\bin"
Name: "{app}\bin\Nodejs"

[Icons]
Name: "{group}\BoomServer (Start)"; Filename: "{app}\StartBoomServer.bat"; WorkingDir: "{app}"; IconFilename: "{app}\bin\Nodejs\node.exe"
Name: "{commondesktop}\BoomServer (Start)"; Filename: "{app}\StartBoomServer.bat"; WorkingDir: "{app}"; IconFilename: "{app}\bin\Nodejs\node.exe"; Tasks: desktopicon

[Run]

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce