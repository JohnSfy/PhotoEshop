@echo off
echo Renaming .js files to .jsx files...

cd src\components
ren *.js *.jsx
cd ..\context
ren *.js *.jsx
cd ..

echo Files renamed successfully!
pause
