#!/bin/bash

# must be in project directory to start

OTPATH=$1
PLUGIN=$2
PLUGINSPATH=$PWD

echo "Removing $PLUGIN.zip"
rm $PLUGIN.zip
echo "Zipping $PLUGIN.zip"
zip -qr $PLUGIN.zip $PLUGIN

cd $OTPATH/bin/
echo "Uninstalling $PLUGIN"
./dita --uninstall $PLUGIN
echo "Installing $PLUGIN" 
./dita --install $PLUGINSPATH/$PLUGIN.zip
echo "Done"
