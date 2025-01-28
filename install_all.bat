curl.exe https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
start /w "" "Docker Desktop Installer.exe" install
net localgroup docker-users <user> /add

curl.exe https://github.com/Francisiek/pnk2025/archive/refs/heads/main.zip
tar.exe -xf main.zip
