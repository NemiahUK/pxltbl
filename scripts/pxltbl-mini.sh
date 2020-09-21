#!/bin/bash

xinput disable 'wch.cn USB2IIC_CTP_CONTROL'

unclutter -idle 0.1 -root &

sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/pi/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/pi/.config/chromium/Default/Preferences

/usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000/fullscreen.html &

xset s noblank
xset s off
xset -dpms

