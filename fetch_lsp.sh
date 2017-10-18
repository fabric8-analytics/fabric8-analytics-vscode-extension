rm -rf ca-lsp-server.tar
rm -rf ca-lsp-server

wget https://github.com/fabric8-analytics/fabric8-analytics-lsp-server/releases/download/0.0.5/ca-lsp-server.tar

archive=ca-lsp-server.tar
mkdir ${archive%.tar*} 
tar --extract --file=${archive} --strip-components=1 --directory=${archive%.tar*}