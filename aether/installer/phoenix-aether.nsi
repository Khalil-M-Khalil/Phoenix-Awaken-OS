Unicode true
ManifestSupportedOS win10
RequestExecutionLevel admin

!include "MUI2.nsh"
!include "LogicLib.nsh"

Name "Phoenix Aether"
Caption "Phoenix Aether — Aether of the Phoenix"
OutFile "../dist/Phoenix-Aether-Aether-of-the-Phoenix-Setup.exe"
InstallDir "$PROGRAMFILES64\Phoenix Aether"
InstallDirRegKey HKLM "Software\Phoenix Aether" "InstallDir"

VIProductVersion "0.1.0.0"
VIAddVersionKey "ProductName" "Phoenix Aether"
VIAddVersionKey "CompanyName" "Khalil Mohammad Khalil"
VIAddVersionKey "LegalCopyright" "Copyright © 2026 Khalil Mohammad Khalil"
VIAddVersionKey "FileDescription" "Offline local and optical file transfer"
VIAddVersionKey "ProductVersion" "0.1.0"

!define MUI_ABORTWARNING
!define MUI_ICON "../assets/phoenix-aether.ico"
!define MUI_UNICON "../assets/phoenix-aether.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "../assets/installer-header.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_WELCOMEFINISHPAGE_BITMAP "../assets/installer-sidebar.bmp"
!define MUI_WELCOMEPAGE_TITLE "Awaken Phoenix Aether"
!define MUI_WELCOMEPAGE_TEXT "A secure local handoff tool for moving files through light or a private Wi-Fi connection — no cloud account required.\r\n\r\nThis release is created and maintained by Khalil Mohammad Khalil."
!define MUI_FINISHPAGE_TITLE "Phoenix Aether is ready"
!define MUI_FINISHPAGE_TEXT "The Aether is awakened. Phoenix Aether is installed and ready for offline local transfer."
!define MUI_FINISHPAGE_RUN "$INSTDIR\Phoenix Aether.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Phoenix Aether"
!define MUI_FINISHPAGE_LINK "Contact Khalil Mohammad Khalil for authorized development"
!define MUI_FINISHPAGE_LINK_LOCATION "mailto:khalilmkhalil0937@gmail.com"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "../installer/license.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Phoenix Aether core" SecCore
  SectionIn RO
  SetOutPath "$INSTDIR"
  File /nonfatal /r "../dist/win-unpacked\*"
  WriteUninstaller "$INSTDIR\Uninstall Phoenix Aether.exe"
  WriteRegStr HKLM "Software\Phoenix Aether" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix Aether" "DisplayName" "Phoenix Aether"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix Aether" "UninstallString" "$INSTDIR\Uninstall Phoenix Aether.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix Aether" "Publisher" "Khalil Mohammad Khalil"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix Aether" "DisplayVersion" "0.1.0"
  CreateDirectory "$SMPROGRAMS\Phoenix Aether"
  CreateShortCut "$SMPROGRAMS\Phoenix Aether\Phoenix Aether.lnk" "$INSTDIR\Phoenix Aether.exe"
  CreateShortCut "$SMPROGRAMS\Phoenix Aether\Uninstall Phoenix Aether.lnk" "$INSTDIR\Uninstall Phoenix Aether.exe"
SectionEnd

Section "Desktop shortcut" SecDesktop
  CreateShortCut "$DESKTOP\Phoenix Aether.lnk" "$INSTDIR\Phoenix Aether.exe"
SectionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "Phoenix Aether was removed safely. User files and transfer data were not deleted."
FunctionEnd

Section "Uninstall"
  Delete "$DESKTOP\Phoenix Aether.lnk"
  Delete "$SMPROGRAMS\Phoenix Aether\Phoenix Aether.lnk"
  Delete "$SMPROGRAMS\Phoenix Aether\Uninstall Phoenix Aether.lnk"
  RMDir "$SMPROGRAMS\Phoenix Aether"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Phoenix Aether"
  DeleteRegKey HKLM "Software\Phoenix Aether"
SectionEnd
