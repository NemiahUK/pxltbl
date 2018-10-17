##Enable audio over GPIO

add the following to /boot/config.txt: 

    dtoverlay=pwm-2chan,pin=18,func=2,pin2=13,func2=4


##Set screen res to 1600x900
Why? becasue this works really well for VNC on a 1080p monitor and is wide enough to display the LED buffer.

add the following to /boot/config.txt: 

    hdmi_group=2
    hdmi_mode=83



##RasPi config:

Enable SSH
Enable VNC
Enable I2C
Enable SPI
Enable Serial Port
Disable Serial Console

##Other config

Disable boot info (may already been done), edit this file: /boot/cmdline.txt and look for something liek this
    dwc_otg.lpm_enable=0 console=serial0,115200 console=tty1 root=/dev/mmcblk0p6 rootfstype=ext4 elevator=deadline rootwait

Delete the "console=serail0,115200" part.


##Install

###Arduino (in future this may be handled by node)

    sudo apt-get install arduino

###Arduino auto-reset script (in future this may be handled by node)

    cd ~
    wget https://github.com/SpellFoundry/avrdude-rpi/archive/master.zip
    sudo unzip master.zip
    cd ./avrdude-rpi-master/
    sudo cp autoreset /usr/bin
    sudo cp avrdude-autoreset /usr/bin
    sudo mv /usr/bin/avrdude /usr/bin/avrdude-original
    sudo ln -s /usr/bin/avrdude-autoreset /usr/bin/avrdude


 