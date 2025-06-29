; BoomServer Installer Script for AP DreamStudios
; Author: Macro

[Setup]
AppName=BoomServer
AppVersion=1.0.1
DefaultDirName={autopf}\BoomServer
DefaultGroupName=BoomServer
OutputBaseFilename=boomserver-v1.0.1-setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Dirs]
Name: "{app}\bin"

[Files]
; Using {#SourcePath} which resolves to the directory containing this script.
Source: "{#SourcePath}\build_assets\node.exe"; DestDir: "{app}\bin";

Source: "{#SourcePath}\backend\*"; DestDir: "{app}\backend"; Excludes: "node_modules"; Flags: recursesubdirs
Source: "{#SourcePath}\backend\node_modules\*"; DestDir: "{app}\backend\node_modules"; Flags: recursesubdirs

Source: "{#SourcePath}\frontend\dist\*"; DestDir: "{app}\frontend\dist"; Flags: recursesubdirs

Source: "{#SourcePath}\run-boomserver.bat"; DestDir: "{app}";

[Icons]
Name: "{group}\Launch BoomServer"; Filename: "{app}\run-boomserver.bat"
Name: "{autodesktop}\Launch BoomServer"; Filename: "{app}\run-boomserver.bat"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:";

[Run]
Filename: "{app}\run-boomserver.bat"; Description: "Launch BoomServer now"; Flags: nowait postinstall shellexec