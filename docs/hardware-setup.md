# RasPi Setup
## Enable audio over I2S

Follow the instructions here: https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-usage


## Set screen res to 1600x900
Why? becasue this works really well for VNC on a 1080p monitor and is wide enough to display the LED buffer.

add the following to /boot/config.txt: 

    hdmi_group=2
    hdmi_mode=83



## RasPi config:

* Enable SSH
* Enable VNC
* Enable I2C
* Enable SPI
* Enable Serial Port
* Disable Serial Console

## Other config

Disable boot info (this is usually already done), edit this file: `/boot/cmdline.txt` and look for something like this
    `dwc_otg.lpm_enable=0 console=serial0,115200 console=tty1 root=/dev/mmcblk0p6 rootfstype=ext4 elevator=deadline rootwait`

Delete the `console=serail0,115200` part.

## Enable auto run as service

Create the init.d script...

    cd /etc/init.d
    sudo nano pxltbl

Paste the following:

    #! /bin/sh
    # /etc/init.d/pxltbl

    ### BEGIN INIT INFO
    # Provides:          test
    # Required-Start:    $remote_fs $syslog
    # Required-Stop:     $remote_fs $syslog
    # Default-Start:     2 3 4 5
    # Default-Stop:      0 1 6
    # Short-Description: Example initscript
    # Description:       This file should be used to construct scripts to be
    #                    placed in /etc/init.d.
    ### END INIT INFO

    # Carry out specific functions when asked to by the system
    case "$1" in
       start)
        echo "Starting pxltbl"
        # run application you want to start
        cd /home/pi/pxltbl/api
        /usr/bin/node index.js >> /dev/null 
       ;;
       stop)
        echo "Stopping pxltbl"
        # kill application you want to stop
        killall -9 node
        # Not a great approach for running
        # multiple node instances
        ;;
      *)
        echo "Usage: /etc/init.d/pxltbl {start|stop}"
        exit 1
        ;;
    esac

    exit 0

Make the file eXecutable `sudo chmod +x pxltbl`

Update rc.d `sudo update-rc.d pxltbl defaults`

Reboot

## Install

### Arduino (in future this may be handled by node)

    sudo apt-get install arduino

### Arduino auto-reset script (in future this may be handled by node)

    cd ~
    wget https://github.com/SpellFoundry/avrdude-rpi/archive/master.zip
    sudo unzip master.zip
    cd ./avrdude-rpi-master/
    sudo cp autoreset /usr/bin
    sudo cp avrdude-autoreset /usr/bin
    sudo mv /usr/bin/avrdude /usr/bin/avrdude-original
    sudo ln -s /usr/bin/avrdude-autoreset /usr/bin/avrdude


 
