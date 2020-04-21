# How to build the PxlTbl mini

# RasPi Setup
## Enable audio over I2S (check this still applies)

Follow the instructions here: https://learn.adafruit.com/adafruit-max98357-i2s-class-d-mono-amp/raspberry-pi-usage


## Set screen res to 1024x600

Add the following to /boot/config.txt: 

    hdmi_cvt=1024 600 60 3 0 0 0
    hdmi_group=2
    hdmi_mode=87


## Using RasPi config:

* Enable SSH
* Enable VNC
* Enable Serial Port
* Disable Serial Console

## Other config

Disable boot info (this is usually already done), edit this file: `/boot/cmdline.txt` and look for something like this
    `dwc_otg.lpm_enable=0 console=serial0,115200 console=tty1 root=/dev/mmcblk0p6 rootfstype=ext4 elevator=deadline rootwait`

Delete the `console=serail0,115200` part.



## Install

### Prerequisites for node-hid 

Compilation tools: 

    sudo apt-get install build-essential git

gcc-4.8+: 

    sudo apt-get install gcc-4.8 g++-4.8 && export CXX=g++-4.8

libusb-1.0-0 w/headers:

    sudo apt-get install libusb-1.0-0 libusb-1.0-0-dev

libudev-dev: 

    sudo apt-get install libudev-dev


## Next...

* Setup Chromium kiosk and auto boot
* Disable touch screen for X11
## Disable screen blanking and pointer 
    sudo apt-get install unclutter xscreensaver
    
## Enable auto run as service

Copy service file

    sudo cp /home/pi/pxltbl/scripts/pxltbl.service /etc/systemd/system/pxltbl.service

Enable the service

    sudo systemctl enable pxltbl.service
   
Start the service

    sudo systemctl start pxltbl.service
    
If you want to view the logs

    journalctl -u pxltbl
        