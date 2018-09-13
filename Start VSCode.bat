@ECHO OFF
SET _openPath=%0
SET _drive=%_test:~1,2%
IF "%_prefix%"=="H:" GOTO OnHDrive
IF "%_prefix%"=="C:" GOTO OnCDrive
IF "%_prefix%"=="T:" GOTO OnTDrive

:OnHDrive
echo Opening from H Drive... Using data directory H:/.vscode
".\Binaries\Code.exe" --user-data-dir "H:/.vscode" --extensions-dir ".\Binaries\extensions" --verbose 
GOTO Finish

:OnCDrive
echo Opening from Local Hard Disk. Using default options.
".\Binaries\Code.exe" --verbose 
GOTO Finish

:OnTDrive
echo Opening from T Drive... Using data directory H:/.vscode
".\Binaries\Code.exe" --user-data-dir "H:/.vscode" --extensions-dir ".\Binaries\extensions" --verbose 
GOTO Finish

:Finish
echo  All Finished.
pause
